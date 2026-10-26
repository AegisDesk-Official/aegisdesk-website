/**
 * HTTP adapter for the external AI answering engine.
 *
 * - Every request is signed: HMAC-SHA256(PIPELINE_SHARED_SECRET, "<timestamp>.<METHOD>.<path>.<rawBody>").
 * - Every request has a hard timeout (AbortController).
 * - Every response is validated against the contract before it is trusted.
 * - Nothing here logs request bodies. draftReply text is never stored or logged.
 *
 * Contract: docs/PIPELINE_CONTRACT.md
 */
import crypto from "node:crypto";
import { z } from "zod";
import type {
  AnswerPipeline,
  DraftReplyResult,
  HealthResult,
  IndexDocumentResult,
  PipelineError,
  PipelineErrorCode,
  PipelineResult,
  RemoveDocumentResult,
} from "./answer-pipeline.ts";

// ---------------------------------------------------------------------------
// Constants (facts about how the product is built; documented in the contract)
// ---------------------------------------------------------------------------
export const PIPELINE_TIMEOUTS_MS = {
  health: 3_000,
  indexDocument: 10_000,
  removeDocument: 10_000,
  draftReply: 15_000,
} as const;

/** Total attempts for idempotent calls (index/remove). draftReply and health are never retried. */
export const PIPELINE_MAX_ATTEMPTS = 3;
export const PIPELINE_RETRY_BACKOFF_MS = [500, 1_500] as const;

export const PIPELINE_PATHS = {
  health: "/v1/health",
  indexDocument: "/v1/documents/index",
  removeDocument: "/v1/documents/remove",
  draftReply: "/v1/draft-reply",
} as const;

export const MAX_DRAFT_TEXT_CHARS = 2_000;
const ID_PATTERN = /^[A-Za-z0-9_\-:.]{1,128}$/;

const NOT_CONNECTED: PipelineError = {
  code: "NOT_CONNECTED",
  message: "The AI engine is not connected yet.",
  retryable: false,
};

// ---------------------------------------------------------------------------
// Signing (shared by the adapter, the mock engine docs and the unit tests)
// ---------------------------------------------------------------------------
export function buildStringToSign(timestamp: string, method: string, path: string, rawBody: string): string {
  return `${timestamp}.${method.toUpperCase()}.${path}.${rawBody}`;
}

export function signPipelineRequest(
  secret: string,
  timestamp: string,
  method: string,
  path: string,
  rawBody: string
): string {
  return crypto.createHmac("sha256", secret).update(buildStringToSign(timestamp, method, path, rawBody), "utf8").digest("hex");
}

/** Constant-time verification. Exported so the mock engine and tests use identical logic. */
export function verifyPipelineSignature(
  secret: string,
  timestamp: string,
  method: string,
  path: string,
  rawBody: string,
  signatureHex: string
): boolean {
  try {
    const expected = Buffer.from(signPipelineRequest(secret, timestamp, method, path, rawBody), "hex");
    const received = Buffer.from(signatureHex, "hex");
    return expected.length === received.length && crypto.timingSafeEqual(expected, received);
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------
export interface PipelineConfig {
  baseUrl: string;
  sharedSecret: string;
}

export interface ResolvedPipelineConfig {
  configured: boolean;
  /** Human-readable reason when not configured. Never contains the secret. */
  issue: string | null;
  baseUrl: string;
}

function isLocalHost(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1" || hostname === "[::1]";
}

export function resolvePipelineConfig(cfg: PipelineConfig): ResolvedPipelineConfig {
  const baseUrl = (cfg.baseUrl || "").trim().replace(/\/+$/, "");
  const secret = (cfg.sharedSecret || "").trim();
  if (!baseUrl) return { configured: false, issue: "PIPELINE_BASE_URL is empty.", baseUrl: "" };
  let parsed: URL;
  try {
    parsed = new URL(baseUrl);
  } catch {
    return { configured: false, issue: "PIPELINE_BASE_URL is not a valid URL.", baseUrl: "" };
  }
  if (parsed.protocol !== "https:" && !(parsed.protocol === "http:" && isLocalHost(parsed.hostname))) {
    return { configured: false, issue: "PIPELINE_BASE_URL must use https (http is allowed only for localhost).", baseUrl: "" };
  }
  if (secret.length < 32) {
    return { configured: false, issue: "PIPELINE_SHARED_SECRET is empty or shorter than 32 characters.", baseUrl };
  }
  return { configured: true, issue: null, baseUrl };
}

/** Masks a base URL for display: keeps scheme, first 3 characters of the host and the TLD. */
export function maskBaseUrl(baseUrl: string): string {
  if (!baseUrl) return "";
  try {
    const u = new URL(baseUrl);
    const host = u.hostname;
    const parts = host.split(".");
    const tld = parts.length > 1 ? `.${parts[parts.length - 1]}` : "";
    const head = host.slice(0, 3);
    const port = u.port ? `:${u.port}` : "";
    return `${u.protocol}//${head}${"•".repeat(6)}${tld}${port}`;
  } catch {
    return "••••••";
  }
}

// ---------------------------------------------------------------------------
// Response schemas (wire format is snake_case)
// ---------------------------------------------------------------------------
const healthSchema = z.object({
  status: z.enum(["ok", "degraded"]),
  version: z.string().min(1).max(64),
  simulated: z.boolean().optional(),
});

const indexSchema = z.object({
  document_id: z.string().min(1).max(128),
  status: z.enum(["queued", "indexed"]),
  simulated: z.boolean().optional(),
});

const removeSchema = z.object({
  document_id: z.string().min(1).max(128),
  removed: z.boolean(),
  simulated: z.boolean().optional(),
});

const draftSchema = z.object({
  reply: z.string().max(4_000),
  citations: z
    .array(
      z.object({
        document_id: z.string().min(1).max(128),
        page: z.number().int().positive().optional(),
        quote: z.string().max(1_000),
      })
    )
    .max(20),
  grounded: z.boolean(),
  handed_to_human: z.boolean(),
  reason: z.enum(["no_source", "low_confidence", "conflicting_policy", "sensitive_topic"]).optional(),
  cost_usd: z.number().nonnegative().max(100).optional(),
  simulated: z.boolean().optional(),
});

const errorBodySchema = z.object({
  error: z.object({ code: z.string().max(64), message: z.string().max(500) }),
});

// ---------------------------------------------------------------------------
// Transport
// ---------------------------------------------------------------------------
type FetchLike = (input: string, init: RequestInit) => Promise<Response>;

interface AdapterOptions extends PipelineConfig {
  fetchImpl?: FetchLike;
  /** Override timeouts/backoff in tests. */
  timeouts?: Partial<typeof PIPELINE_TIMEOUTS_MS>;
  backoffMs?: readonly number[];
  now?: () => number;
}

function fail(code: PipelineErrorCode, message: string, retryable: boolean, status?: number): { ok: false; error: PipelineError } {
  return { ok: false, error: { code, message, retryable, ...(status !== undefined ? { status } : {}) } };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export class HttpAnswerPipeline implements AnswerPipeline {
  readonly configured: boolean;
  readonly configIssue: string | null;
  private readonly baseUrl: string;
  private readonly secret: string;
  private readonly fetchImpl: FetchLike;
  private readonly timeouts: typeof PIPELINE_TIMEOUTS_MS;
  private readonly backoffMs: readonly number[];
  private readonly now: () => number;

  constructor(opts: AdapterOptions) {
    const resolved = resolvePipelineConfig(opts);
    this.configured = resolved.configured;
    this.configIssue = resolved.issue;
    this.baseUrl = resolved.baseUrl;
    this.secret = (opts.sharedSecret || "").trim();
    this.fetchImpl = opts.fetchImpl || ((input, init) => fetch(input, init));
    this.timeouts = { ...PIPELINE_TIMEOUTS_MS, ...(opts.timeouts || {}) };
    this.backoffMs = opts.backoffMs || PIPELINE_RETRY_BACKOFF_MS;
    this.now = opts.now || Date.now;
  }

  /** One signed HTTP attempt. Returns parsed JSON or a typed error. */
  private async send(
    method: "GET" | "POST",
    path: string,
    body: Record<string, unknown> | null,
    timeoutMs: number,
    requestId: string
  ): Promise<{ ok: true; json: unknown } | { ok: false; error: PipelineError }> {
    const rawBody = body ? JSON.stringify(body) : "";
    const timestamp = String(Math.floor(this.now() / 1000));
    const signature = signPipelineRequest(this.secret, timestamp, method, path, rawBody);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    let res: Response;
    try {
      res = await this.fetchImpl(`${this.baseUrl}${path}`, {
        method,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-Aegis-Timestamp": timestamp,
          "X-Aegis-Signature": signature,
          "X-Aegis-Request-Id": requestId,
        },
        body: body ? rawBody : undefined,
        signal: controller.signal,
        cache: "no-store",
        redirect: "error",
      });
    } catch (err) {
      clearTimeout(timer);
      if (controller.signal.aborted || (err instanceof Error && err.name === "AbortError")) {
        return fail("TIMEOUT", `The AI engine did not answer within ${timeoutMs} ms.`, true);
      }
      return fail("NETWORK_ERROR", "Could not reach the AI engine.", true);
    }

    let json: unknown = null;
    try {
      const text = await res.text();
      json = text ? JSON.parse(text) : null;
    } catch {
      json = null;
    } finally {
      clearTimeout(timer);
    }

    if (res.ok) return { ok: true, json };

    const parsedErr = errorBodySchema.safeParse(json);
    const engineMsg = parsedErr.success ? parsedErr.data.error.message : `HTTP ${res.status}`;
    if (res.status === 401 || res.status === 403) {
      return fail("UNAUTHORIZED", "The AI engine rejected the request signature.", false, res.status);
    }
    if (res.status === 429) return fail("RATE_LIMITED", "The AI engine is rate limiting requests.", true, res.status);
    return fail("ENGINE_ERROR", `The AI engine returned an error: ${engineMsg}`, res.status >= 500, res.status);
  }

  /** Retries only retryable errors, with backoff. Same request id across attempts for idempotency. */
  private async sendWithRetry(
    method: "POST",
    path: string,
    body: Record<string, unknown>,
    timeoutMs: number
  ): Promise<{ ok: true; json: unknown } | { ok: false; error: PipelineError }> {
    const requestId = crypto.randomUUID();
    let last: { ok: false; error: PipelineError } | null = null;
    for (let attempt = 0; attempt < PIPELINE_MAX_ATTEMPTS; attempt++) {
      const r = await this.send(method, path, body, timeoutMs, requestId);
      if (r.ok) return r;
      last = r;
      if (!r.error.retryable || attempt === PIPELINE_MAX_ATTEMPTS - 1) break;
      await sleep(this.backoffMs[Math.min(attempt, this.backoffMs.length - 1)] ?? 0);
    }
    return last as { ok: false; error: PipelineError };
  }

  async health(): Promise<PipelineResult<HealthResult>> {
    if (!this.configured) return { ok: false, error: NOT_CONNECTED };
    const started = this.now();
    const r = await this.send("GET", PIPELINE_PATHS.health, null, this.timeouts.health, crypto.randomUUID());
    if (!r.ok) return r;
    const parsed = healthSchema.safeParse(r.json);
    if (!parsed.success) return fail("BAD_RESPONSE", "Health response did not match the contract.", false);
    return {
      ok: true,
      data: {
        status: parsed.data.status,
        version: parsed.data.version,
        ...(parsed.data.simulated ? { simulated: true } : {}),
        latencyMs: Math.max(0, this.now() - started),
      },
    };
  }

  async indexDocument(orgId: string, documentId: string, fileUrl: string): Promise<PipelineResult<IndexDocumentResult>> {
    if (!this.configured) return { ok: false, error: NOT_CONNECTED };
    if (!ID_PATTERN.test(orgId) || !ID_PATTERN.test(documentId)) {
      return fail("INVALID_INPUT", "orgId or documentId has an invalid format.", false);
    }
    if (!/^https?:\/\//.test(fileUrl) || fileUrl.length > 2_048) {
      return fail("INVALID_INPUT", "fileUrl must be an absolute http(s) URL.", false);
    }
    const r = await this.sendWithRetry(
      "POST",
      PIPELINE_PATHS.indexDocument,
      { org_id: orgId, document_id: documentId, file_url: fileUrl },
      this.timeouts.indexDocument
    );
    if (!r.ok) return r;
    const parsed = indexSchema.safeParse(r.json);
    if (!parsed.success || parsed.data.document_id !== documentId) {
      return fail("BAD_RESPONSE", "Index response did not match the contract.", false);
    }
    return {
      ok: true,
      data: {
        documentId: parsed.data.document_id,
        status: parsed.data.status,
        ...(parsed.data.simulated ? { simulated: true } : {}),
      },
    };
  }

  async removeDocument(orgId: string, documentId: string): Promise<PipelineResult<RemoveDocumentResult>> {
    if (!this.configured) return { ok: false, error: NOT_CONNECTED };
    if (!ID_PATTERN.test(orgId) || !ID_PATTERN.test(documentId)) {
      return fail("INVALID_INPUT", "orgId or documentId has an invalid format.", false);
    }
    const r = await this.sendWithRetry(
      "POST",
      PIPELINE_PATHS.removeDocument,
      { org_id: orgId, document_id: documentId },
      this.timeouts.removeDocument
    );
    if (!r.ok) return r;
    const parsed = removeSchema.safeParse(r.json);
    if (!parsed.success || parsed.data.document_id !== documentId) {
      return fail("BAD_RESPONSE", "Remove response did not match the contract.", false);
    }
    return {
      ok: true,
      data: {
        documentId: parsed.data.document_id,
        removed: parsed.data.removed,
        ...(parsed.data.simulated ? { simulated: true } : {}),
      },
    };
  }

  async draftReply(orgId: string, ticketRef: string, text: string): Promise<PipelineResult<DraftReplyResult>> {
    if (!this.configured) return { ok: false, error: NOT_CONNECTED };
    if (!ID_PATTERN.test(orgId) || !ID_PATTERN.test(ticketRef)) {
      return fail("INVALID_INPUT", "orgId or ticketRef has an invalid format.", false);
    }
    if (typeof text !== "string" || !text.trim() || text.length > MAX_DRAFT_TEXT_CHARS) {
      return fail("INVALID_INPUT", `text must be 1-${MAX_DRAFT_TEXT_CHARS} characters.`, false);
    }
    // Pass-through only: the text lives in this request body and nowhere else.
    const r = await this.send(
      "POST",
      PIPELINE_PATHS.draftReply,
      { org_id: orgId, ticket_ref: ticketRef, text },
      this.timeouts.draftReply,
      crypto.randomUUID()
    );
    if (!r.ok) return r;
    const parsed = draftSchema.safeParse(r.json);
    if (!parsed.success) return fail("BAD_RESPONSE", "Draft response did not match the contract.", false);
    const d = parsed.data;
    return {
      ok: true,
      data: {
        reply: d.reply,
        citations: d.citations.map((c) => ({
          documentId: c.document_id,
          quote: c.quote,
          ...(c.page !== undefined ? { page: c.page } : {}),
        })),
        grounded: d.grounded,
        handedToHuman: d.handed_to_human,
        ...(d.reason ? { reason: d.reason } : {}),
        ...(d.cost_usd !== undefined ? { costUsd: d.cost_usd } : {}),
        ...(d.simulated ? { simulated: true } : {}),
      },
    };
  }
}
