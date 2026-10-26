/**
 * The ONLY file that knows how to talk to the AI backend (Aman's FastAPI).
 *
 * If his endpoint, auth header or field names change, edit this file and
 * nothing else:
 *   - URL         FASTAPI_BACKEND_URL
 *   - Path        DEMO_BACKEND_PATH (default /api/v1/ask)
 *   - Key         DEMO_TENANT_API_KEY, sent as a Bearer token. No default.
 *   - Request     buildRequestBody() below
 *   - Response    mapResponse() below
 *
 * It never invents an answer. Any problem throws BackendUnavailableError and
 * the API replies 503.
 */
import type { DemoAnswer, DemoCitation } from "./validation/demo-types";

export class BackendUnavailableError extends Error {
  constructor(reason: string) {
    super(reason);
    this.name = "BackendUnavailableError";
  }
}

const TIMEOUT_MS = 20_000;
const MAX_TOKENS = 200;

/* ---- REQUEST MAPPING: our fields -> backend fields ---- */
function buildRequestBody(input: { message: string; conversationId: string }) {
  return {
    message: input.message,
    conversation_id: input.conversationId,
    max_tokens: MAX_TOKENS,
  };
}

/* ---- RESPONSE MAPPING: backend fields -> our fields ---- */
type Raw = Record<string, unknown>;

function pick(obj: Raw, ...names: string[]): unknown {
  for (const n of names) if (obj[n] !== undefined && obj[n] !== null) return obj[n];
  return undefined;
}

function toCitation(value: unknown): DemoCitation | null {
  if (!value || typeof value !== "object") return null;
  const c = value as Raw;
  const source = pick(c, "sourceDocument", "source_document", "source", "document", "file");
  const snippet = pick(c, "snippet", "text", "chunk", "passage");
  if (typeof source !== "string" || !source.trim()) return null;
  const pageRaw = pick(c, "pageNumber", "page_number", "page");
  const page = typeof pageRaw === "number" && Number.isFinite(pageRaw) ? pageRaw : undefined;
  return {
    source: source.trim().slice(0, 160),
    page,
    snippet: typeof snippet === "string" ? snippet.trim().slice(0, 600) : "",
  };
}

function mapResponse(data: unknown): DemoAnswer {
  if (!data || typeof data !== "object") throw new BackendUnavailableError("empty response");
  const d = data as Raw;
  const answer = pick(d, "answer", "response", "text");
  if (typeof answer !== "string" || !answer.trim()) {
    throw new BackendUnavailableError("response had no answer text");
  }
  const grounded = pick(d, "grounded");
  const escalated = pick(d, "escalated") === true || grounded === false;
  const scoreRaw = pick(d, "grounding_score", "groundingScore");
  const score =
    typeof scoreRaw === "number" && Number.isFinite(scoreRaw)
      ? Math.max(0, Math.min(1, scoreRaw > 1 ? scoreRaw / 100 : scoreRaw))
      : undefined;
  const citationsRaw = pick(d, "citations", "sources");
  const citations = Array.isArray(citationsRaw)
    ? citationsRaw.map(toCitation).filter((c): c is DemoCitation => c !== null).slice(0, 5)
    : [];
  return {
    answer: answer.trim().slice(0, 1500),
    escalated,
    groundingScore: score,
    citations,
  };
}

/* ---- The call ---- */
export async function askDemoBackend(input: {
  message: string;
  conversationId: string;
}): Promise<DemoAnswer> {
  const base = process.env.FASTAPI_BACKEND_URL?.trim().replace(/\/+$/, "");
  const key = process.env.DEMO_TENANT_API_KEY?.trim();
  if (!base || !key) throw new BackendUnavailableError("backend URL or key not configured");

  const rawPath = process.env.DEMO_BACKEND_PATH?.trim() || "/api/v1/ask";
  const path = rawPath.startsWith("/") ? rawPath : `/${rawPath}`;

  let res: Response;
  try {
    res = await fetch(`${base}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify(buildRequestBody(input)),
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });
  } catch {
    throw new BackendUnavailableError("backend unreachable or timed out");
  }
  if (!res.ok) throw new BackendUnavailableError(`backend returned ${res.status}`);

  let json: unknown;
  try {
    json = await res.json();
  } catch {
    throw new BackendUnavailableError("backend returned invalid JSON");
  }
  return mapResponse(json);
}
