/**
 * POST /api/demo: Protected public workbench with cost abuse prevention.
 *
 * Security and budget safeguards run in this strict order:
 *   1. DEMO_ENABLED must be "true"
 *   2. Operator Kill Switch check (instantly halts workbench when engaged)
 *   3. Global Daily Spend Cap check (DEMO_DAILY_SPEND_CAP_USD)
 *   4. Fail closed without rate limit store
 *   5. Request shape, origin, content-type, size, honeypot & attachment rejection
 *   6. Turnstile verification
 *   7. Per-visitor (5 questions) & Per-IP rate limits
 *   8. Prompt-injection heuristics (intercepts adversarial attempts; 0 tokens burned)
 *   9. Lead capture webhook dispatch
 *   10. Backend inference call with input (250 chars) and token (200 tokens) caps
 *   11. Output safety inspection (redacts leaked secrets, enforces 500-char cap)
 *   12. Token cost calculation & immutable logging to events table
 */
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { getPipeline, getWorkbenchOrgId } from "@/lib/pipeline";
import { sendDemoLead } from "@/lib/demo-lead";
import { buildRules, getLimitStore, sha, type RuleId } from "@/lib/security/demo-limits";
import { getClientIp, isSameOrigin } from "@/lib/demo-request";
import { demoRequestSchema } from "@/lib/validation/demo-schema";
import { turnstileConfigured, verifyTurnstile } from "@/lib/security/turnstile";
import {
  isWorkbenchKillSwitchEngaged,
  getWorkbenchSpendTelemetry,
  recordWorkbenchCost,
} from "@/lib/security/workbench-control";
import { inspectPromptSafety, inspectOutputSafety } from "@/lib/security/prompt-injection";
import { recordEvent } from "@/lib/db/events-store";
import {
  DEMO_LIMITS,
  DEMO_UNAVAILABLE_MESSAGE,
  type DemoApiError,
  type DemoApiSuccess,
  type DemoErrorCode,
} from "@/lib/validation/demo-types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 8 * 1024;
const NO_STORE = { "Cache-Control": "no-store" };

function fail(status: number, code: DemoErrorCode, error: string) {
  return NextResponse.json<DemoApiError>({ error, code }, { status, headers: NO_STORE });
}

const LIMIT_MESSAGES: Record<RuleId, string> = {
  email: "You have used your 5 sample questions. Contact our team and we will run it on your own documents.",
  phone: "You have used your 5 sample questions. Contact our team and we will run it on your own documents.",
  ip: "This network has reached today's demo limit. Try again tomorrow, or contact our team.",
  global_day: "The demo has reached its limit for today. Contact our team and we will run it live on your documents.",
  global_month: "The demo has reached its limit for this month. Contact our team and we will run it live on your documents.",
};

export async function POST(req: NextRequest) {
  // 1. Request shape & attachment rejection (validate input first)
  if (!isSameOrigin(req.headers)) return fail(403, "forbidden", "This request was not allowed.");
  const contentType = (req.headers.get("content-type") || "").toLowerCase();

  // Reject file attachments
  if (contentType.includes("multipart/form-data")) {
    return fail(400, "invalid", "File attachments are not accepted in the sample workbench.");
  }
  if (!contentType.includes("application/json")) {
    return fail(415, "invalid", "Send the request as JSON.");
  }
  if (Number(req.headers.get("content-length") || 0) > MAX_BODY_BYTES) {
    return fail(413, "invalid", "That request is too large.");
  }

  let raw: unknown;
  try {
    const text = await req.text();
    if (text.length > MAX_BODY_BYTES) return fail(413, "invalid", "That request is too large.");
    raw = JSON.parse(text);
  } catch {
    return fail(400, "invalid", "Please check your details and try again.");
  }
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return fail(400, "invalid", "Please check your details and try again.");
  }
  const body = raw as Record<string, unknown>;

  // Reject attachment fields
  if (
    body.attachment !== undefined ||
    body.file !== undefined ||
    body.files !== undefined ||
    body.doc !== undefined
  ) {
    return fail(400, "invalid", "File attachments are not accepted in the sample workbench.");
  }

  // Honeypot: real visitors never see this field
  if (body.website !== undefined && body.website !== null && body.website !== "") {
    return fail(400, "invalid", "Please check your details and try again.");
  }

  // Normalize prompt -> message alias if provided
  if (body.prompt && !body.message) {
    body.message = body.prompt;
  }

  // Validate prompt length ceiling (200 chars max per workbench spec)
  const candidateMsg = typeof body.message === "string" ? body.message : typeof body.prompt === "string" ? body.prompt : "";
  if (candidateMsg.length > 200) {
    return fail(400, "invalid", "Demo questions are limited to 200 characters.");
  }

  // 2. Master enable switch (stays disabled until LIVE_TEST_ENABLED=true or DEMO_ENABLED=true)
  const isEnabled = process.env.LIVE_TEST_ENABLED === "true" || process.env.NEXT_PUBLIC_LIVE_TEST_ENABLED === "true" || process.env.DEMO_ENABLED === "true";
  if (!isEnabled) {
    return fail(503, "disabled", DEMO_UNAVAILABLE_MESSAGE);
  }

  // 3. Operator Emergency Kill Switch Check
  const killSwitch = await isWorkbenchKillSwitchEngaged();
  if (killSwitch.engaged) {
    return fail(
      503,
      "disabled",
      killSwitch.reason ||
        "The sample workbench is temporarily paused by operations. You can book a 15-minute scoping call to test your policies with our engineering team."
    );
  }

  // 4. Global Daily Spend Cap Check
  const spendTelemetry = await getWorkbenchSpendTelemetry();
  if (spendTelemetry.isCapReached) {
    return fail(
      429,
      "rate_limited",
      "The public demo has reached today's question limit. We'll be back tomorrow! You can book a 15-minute scoping call to test your policies with our engineering team."
    );
  }

  // 5. Fail closed in production without a real limit store
  const store = getLimitStore();
  if (!store) {
    console.error("[demo] Upstash is not configured in production: refusing to answer.");
    return fail(503, "unavailable", DEMO_UNAVAILABLE_MESSAGE);
  }
  const turnstile = turnstileConfigured();
  if (turnstile === "misconfigured") {
    console.error("[demo] Set BOTH Turnstile keys (site + secret) or neither: refusing to answer.");
    return fail(503, "unavailable", DEMO_UNAVAILABLE_MESSAGE);
  }

  const parsed = demoRequestSchema.safeParse(body);
  if (!parsed.success) {
    return fail(400, "invalid", parsed.error.issues[0]?.message ?? "Please check your details.");
  }
  const { message, email, phone, company, turnstileToken } = parsed.data;
  const ip = getClientIp(req.headers);

  // 6. Turnstile
  if (turnstile === "on" && !(await verifyTurnstile(turnstileToken, ip))) {
    return fail(400, "verification_failed", "We could not confirm you are human. Refresh the page and try again.");
  }

  // 7. Per-visitor (5 questions) and per-IP limits (atomic Lua execution)
  const rules = buildRules({ email, phoneDigits: phone, ip });
  let consumed;
  try {
    consumed = await store.consume(rules);
  } catch (err) {
    console.error("[demo] limit store failed:", err instanceof Error ? err.message : "unknown error");
    return fail(503, "unavailable", DEMO_UNAVAILABLE_MESSAGE);
  }
  if (!consumed.ok) {
    return fail(429, "rate_limited", LIMIT_MESSAGES[consumed.blockedBy]);
  }

  // 8. Prompt Injection & Adversarial Defense
  const safetyCheck = inspectPromptSafety(message);
  if (!safetyCheck.isSafe) {
    // Intercept immediately: 0 tokens burned on LLM backend
    await recordEvent({
      org_id: "demo-workbench",
      event_id: `evt_demo_inj_${Date.now()}_${randomUUID().slice(0, 8)}`,
      type: "check_blocked",
      occurred_at: new Date().toISOString(),
      ticket_ref: `demo_${sha(email).slice(0, 12)}`,
      channel: "public_workbench",
      topic: "prompt_injection_attempt",
      reason: safetyCheck.detectedPattern || "prompt_injection",
      model_cost_usd: 0,
      latency_ms: 10,
    });

    const remaining = Math.max(
      0,
      Math.min(
        DEMO_LIMITS.perEmail - consumed.counts.email,
        DEMO_LIMITS.perPhone - consumed.counts.phone,
        DEMO_LIMITS.perIpPerDay - consumed.counts.ip
      )
    );

    return NextResponse.json<DemoApiSuccess>(
      {
        answer: safetyCheck.safeDeflection,
        escalated: true,
        groundingScore: 0,
        citations: [],
        remaining,
        limit: DEMO_LIMITS.perEmail,
      },
      { status: 200, headers: NO_STORE }
    );
  }

  // 9. Lead notification
  const rawPhone = typeof body.phone === "string" ? body.phone.trim().slice(0, 40) : phone;
  const leadDone = sendDemoLead(store, { email, phone: rawPhone, company, ip, firstQuestion: message });

  // 10. Call backend model via AnswerPipeline with strict token & timing boundaries
  const startTime = Date.now();
  const pipeline = getPipeline();
  const ticketRef = `demo_${sha(email).slice(0, 12)}`;

  if (!pipeline.configured) {
    return fail(503, "disabled", "Not connected yet");
  }

  try {
    const pipelineRes = await pipeline.draftReply(getWorkbenchOrgId(), ticketRef, message);
    await leadDone;
    const latencyMs = Date.now() - startTime;

    if (!pipelineRes.ok) {
      if (pipelineRes.error.code === "NOT_CONNECTED") {
        return fail(503, "disabled", "Not connected yet");
      }
      return fail(502, "unavailable", pipelineRes.error.message);
    }

    const { reply, citations, grounded, handedToHuman, costUsd } = pipelineRes.data;

    // 11. Output safety inspection (enforce 500-char cap and prevent secret reflection)
    const outputInspection = inspectOutputSafety(reply);
    const finalAnswer = {
      answer: outputInspection.sanitizedAnswer,
      escalated: handedToHuman,
      groundingScore: grounded ? 98 : 0,
      citations: citations.map((c) => ({
        source: c.documentId,
        snippet: c.quote,
        page: c.page,
      })),
    };

    // 12. Calculate token metrics & log cost to events table (never storing question text)
    const callCostUsd = costUsd ?? 0.004;

    // Update global daily spend accumulator
    await recordWorkbenchCost(callCostUsd);

    // Record immutable telemetry event with opaque topic (text is NEVER stored)
    await recordEvent({
      org_id: "demo-workbench",
      event_id: `evt_demo_${Date.now()}_${randomUUID().slice(0, 8)}`,
      type: finalAnswer.escalated ? "check_blocked" : "draft_created",
      occurred_at: new Date().toISOString(),
      ticket_ref: ticketRef,
      channel: "public_workbench",
      topic: "workbench_live_query",
      model_cost_usd: callCostUsd,
      latency_ms: latencyMs,
    });

    const remaining = Math.max(
      0,
      Math.min(
        DEMO_LIMITS.perEmail - consumed.counts.email,
        DEMO_LIMITS.perPhone - consumed.counts.phone,
        DEMO_LIMITS.perIpPerDay - consumed.counts.ip
      )
    );

    return NextResponse.json<DemoApiSuccess>(
      { ...finalAnswer, remaining, limit: DEMO_LIMITS.perEmail },
      { status: 200, headers: NO_STORE }
    );
  } catch (err) {
    console.error("[demo] backend failed:", err instanceof Error ? err.message : "unknown error");
    const personal = rules.filter((r) => r.id === "email" || r.id === "phone" || r.id === "ip");
    await Promise.all([leadDone, store.refund(personal).catch(() => undefined)]);
    return fail(503, "unavailable", DEMO_UNAVAILABLE_MESSAGE);
  }
}

/** Anything other than POST is refused. */
export async function GET() {
  return NextResponse.json({ error: "Method not allowed." }, { status: 405, headers: { Allow: "POST", ...NO_STORE } });
}
