import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import {
  recordEvent,
  recordRejectedEvent,
  getRecentEvents,
  getRecentRejectedEvents,
  isEventDuplicate,
  type AegisEvent,
} from "@/lib/db/events-store";
import { getClientIp } from "@/lib/demo-request";
import { getEventSecret } from "@/lib/pipeline/event-secrets";
import { recordEngineEvent } from "@/lib/pipeline";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FIVE_MINUTES_MS = 5 * 60 * 1000;
const FUTURE_TOLERANCE_MS = 5 * 1000;

// Known organization API secrets (from seed.sql and environment)
const KNOWN_SECRETS: Record<string, string> = {
  "00000000-0000-0000-0000-000000000001": "sec_live_apex_retail_7719",
  "org-a": "sec_live_apex_retail_7719",
  "00000000-0000-0000-0000-000000000002": "sec_live_beacon_fin_8820",
  "org-b": "sec_live_beacon_fin_8820",
  "00000000-0000-0000-0000-000000000003": process.env.EVENTS_API_DEFAULT_SECRET || "sec_demo_aegis_key_001",
  "org-demo": process.env.EVENTS_API_DEFAULT_SECRET || "sec_demo_aegis_key_001",
};

// Strict schema for an individual event
const eventItemSchema = z
  .object({
    org_id: z.string().min(1, "org_id is required"),
    event_id: z.string().min(1, "event_id is required"),
    type: z.enum([
      "ticket_received",
      "draft_created",
      "check_passed",
      "check_blocked",
      "handed_to_human",
      "reply_approved",
      "reply_edited",
      "reply_rejected",
      "reply_sent",
    ]),
    occurred_at: z.string().optional(),
    ticket_ref: z.string().min(1, "ticket_ref must be an opaque identifier"),
    channel: z.string().default("zendesk"),
    topic: z.string().optional(),
    check: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),
    reason: z.string().optional(),
    latency_ms: z.number().nonnegative().optional(),
    model_cost_usd: z.number().nonnegative().optional(),
    edit_distance: z.number().nonnegative().optional(),
  })
  .strict();

async function getSecretForOrg(orgId: string): Promise<string> {
  const custom = await getEventSecret(orgId);
  if (custom) return custom;
  if (KNOWN_SECRETS[orgId]) {
    return KNOWN_SECRETS[orgId];
  }
  return process.env.EVENTS_API_DEFAULT_SECRET || "sec_demo_aegis_key_001";
}

function verifyHmacSignature(rawBody: string, timestamp: string, signature: string, secret: string): boolean {
  try {
    const payloadToSign = `${timestamp}.${rawBody}`;
    const expectedSignature = crypto.createHmac("sha256", secret).update(payloadToSign).digest("hex");
    const sigBuffer = Buffer.from(signature, "hex");
    const expBuffer = Buffer.from(expectedSignature, "hex");
    if (sigBuffer.length !== expBuffer.length) {
      return false;
    }
    return crypto.timingSafeEqual(sigBuffer, expBuffer);
  } catch {
    return false;
  }
}

/**
 * POST /api/events: Ingest pipeline events with cryptographic HMAC verification
 */
export async function POST(req: NextRequest) {
  const clientIp = getClientIp(req.headers);
  const rawBody = await req.text();

  // Max payload size ceiling (500 KB)
  if (rawBody.length > 500 * 1024) {
    return NextResponse.json(
      { error: "Payload exceeds 500KB maximum size ceiling", code: "payload_too_large" },
      { status: 413 }
    );
  }

  const signatureHeader = req.headers.get("x-aegis-signature") || "";
  const timestampHeader = req.headers.get("x-aegis-timestamp") || "";

  // 1. Missing authentication headers
  if (!signatureHeader || !timestampHeader) {
    await recordRejectedEvent({
      org_id: "unknown",
      client_ip: clientIp,
      timestamp: timestampHeader || "missing",
      reason: "Missing X-Aegis-Signature or X-Aegis-Timestamp header",
      signature_received: signatureHeader || "none",
    });
    return NextResponse.json(
      {
        error: "Missing authentication headers (X-Aegis-Signature and X-Aegis-Timestamp required)",
        code: "missing_headers",
      },
      { status: 401 }
    );
  }

  // 2. Timestamp replay & skew validation (5-minute window)
  const reqTimeMs = Number(timestampHeader) > 1e11 ? Number(timestampHeader) : Number(timestampHeader) * 1000;
  const now = Date.now();
  if (isNaN(reqTimeMs) || Math.abs(now - reqTimeMs) > FIVE_MINUTES_MS || reqTimeMs - now > FUTURE_TOLERANCE_MS) {
    await recordRejectedEvent({
      org_id: "unknown",
      client_ip: clientIp,
      timestamp: timestampHeader,
      reason: `Timestamp skew exceeded 5-minute window (req: ${timestampHeader}, server: ${Math.floor(now / 1000)})`,
      signature_received: signatureHeader,
    });
    return NextResponse.json(
      {
        error: "Timestamp expired or outside permitted 5-minute drift window",
        code: "timestamp_skew_exceeded",
      },
      { status: 401 }
    );
  }

  // 3. Parse JSON body
  let parsedBody: unknown;
  try {
    parsedBody = JSON.parse(rawBody);
  } catch {
    await recordRejectedEvent({
      org_id: "unknown",
      client_ip: clientIp,
      timestamp: timestampHeader,
      reason: "Malformed JSON payload",
      signature_received: signatureHeader,
    });
    return NextResponse.json({ error: "Malformed JSON payload", code: "invalid_json" }, { status: 400 });
  }

  // Handle single event or batch of events
  const rawEvents = Array.isArray(parsedBody)
    ? parsedBody
    : typeof parsedBody === "object" && parsedBody !== null && "events" in parsedBody && Array.isArray((parsedBody as { events: unknown[] }).events)
    ? (parsedBody as { events: unknown[] }).events
    : [parsedBody];

  if (rawEvents.length === 0) {
    return NextResponse.json({ error: "No events provided", code: "empty_payload" }, { status: 400 });
  }

  // Determine org_id from first item
  const primaryOrgId = (rawEvents[0] as { org_id?: string })?.org_id || "unknown";
  const orgSecret = await getSecretForOrg(primaryOrgId);

  // 4. Cryptographic HMAC verification
  const isValidSignature = verifyHmacSignature(rawBody, timestampHeader, signatureHeader, orgSecret);
  if (!isValidSignature) {
    await recordRejectedEvent({
      org_id: primaryOrgId,
      client_ip: clientIp,
      timestamp: timestampHeader,
      reason: "Cryptographic HMAC signature mismatch",
      signature_received: signatureHeader,
    });
    return NextResponse.json(
      {
        error: "Cryptographic signature verification failed",
        code: "invalid_signature",
      },
      { status: 401 }
    );
  }

  // 5. Invariant check: Strict ban on customer message text or email in payloads
  const forbiddenFields = ["message", "message_text", "email", "customer_name", "body", "customer_email", "raw_content"];
  for (const item of rawEvents) {
    if (typeof item === "object" && item !== null) {
      for (const field of forbiddenFields) {
        if (field in item) {
          await recordRejectedEvent({
            org_id: primaryOrgId,
            client_ip: clientIp,
            timestamp: timestampHeader,
            reason: `Data privacy violation: prohibited field "${field}" detected in event payload`,
            signature_received: signatureHeader,
          });
          return NextResponse.json(
            {
              error: `Data privacy invariant violation: Prohibited field "${field}" detected. AegisDesk Events API accepts only opaque ticket references and telemetry metrics. Never pass customer message text or PII.`,
              code: "privacy_invariant_violation",
            },
            { status: 400 }
          );
        }
      }
    }
  }

  // 6. Validate each event and process idempotently
  const results: Array<{ event_id: string; status: "accepted" | "duplicate" | "error"; error?: string }> = [];

  for (const item of rawEvents) {
    const parseResult = eventItemSchema.safeParse(item);
    if (!parseResult.success) {
      const errMessage = parseResult.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ");
      results.push({
        event_id: (item as { event_id?: string })?.event_id || "unknown",
        status: "error",
        error: errMessage,
      });
      continue;
    }

    const validEvent = parseResult.data as AegisEvent;

    // Check idempotency
    const isDup = isEventDuplicate(validEvent.org_id, validEvent.event_id);
    if (isDup) {
      results.push({ event_id: validEvent.event_id, status: "duplicate" });
      continue;
    }

    await recordEvent(validEvent);
    recordEngineEvent({
      orgId: validEvent.org_id,
      type: validEvent.type,
      at: validEvent.occurred_at,
    });
    results.push({ event_id: validEvent.event_id, status: "accepted" });
  }

  const acceptedCount = results.filter((r) => r.status === "accepted").length;
  const duplicateCount = results.filter((r) => r.status === "duplicate").length;
  const errorCount = results.filter((r) => r.status === "error").length;

  return NextResponse.json(
    {
      status: errorCount === 0 ? "success" : "partial_success",
      total: results.length,
      accepted: acceptedCount,
      duplicate: duplicateCount,
      errors: errorCount,
      results: results.length === 1 ? results[0] : results,
    },
    { status: errorCount === results.length ? 400 : 200 }
  );
}

/**
 * GET /api/events: Query recent events and security rejections for operator console
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const orgId = searchParams.get("org_id") || undefined;
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") || "50")));
  const view = searchParams.get("view"); // "rejected" or "events"

  if (view === "rejected") {
    const rejected = getRecentRejectedEvents(limit);
    return NextResponse.json({ rejected, total: rejected.length });
  }

  const events = getRecentEvents(orgId, limit);
  return NextResponse.json({ events, total: events.length });
}
