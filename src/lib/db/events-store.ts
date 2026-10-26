import { createAdminClient } from "./admin.ts";

export interface AegisEvent {
  id?: string;
  org_id: string;
  event_id: string;
  type:
    | "ticket_received"
    | "draft_created"
    | "check_passed"
    | "check_blocked"
    | "handed_to_human"
    | "reply_approved"
    | "reply_edited"
    | "reply_rejected"
    | "reply_sent";
  occurred_at: string;
  ticket_ref: string; // Opaque ID, NEVER message text or email
  channel: string;
  topic?: string;
  check?: 1 | 2 | 3;
  reason?: string;
  latency_ms?: number;
  model_cost_usd?: number;
  edit_distance?: number;
  created_at?: string;
}

export interface RejectedEvent {
  id: string;
  org_id: string;
  client_ip: string;
  timestamp: string;
  reason: string;
  signature_received?: string;
  created_at: string;
}

// In-memory ring buffer (up to 20,000 events) for high performance and local preview
const globalForEvents = globalThis as unknown as {
  __aegis_events?: AegisEvent[];
  __aegis_rejected_events?: RejectedEvent[];
  __aegis_event_ids?: Set<string>;
};

const memoryEvents: AegisEvent[] = globalForEvents.__aegis_events || [];
const memoryRejected: RejectedEvent[] = globalForEvents.__aegis_rejected_events || [];
const seenEventKeys: Set<string> = globalForEvents.__aegis_event_ids || new Set();

globalForEvents.__aegis_events = memoryEvents;
globalForEvents.__aegis_rejected_events = memoryRejected;
globalForEvents.__aegis_event_ids = seenEventKeys;

/**
 * Check idempotency: returns true if already processed
 */
export function isEventDuplicate(orgId: string, eventId: string): boolean {
  const key = `${orgId}:${eventId}`;
  return seenEventKeys.has(key);
}

/**
 * Record an accepted event
 */
export async function recordEvent(event: AegisEvent): Promise<{ isDuplicate: boolean }> {
  const key = `${event.org_id}:${event.event_id}`;
  if (seenEventKeys.has(key)) {
    return { isDuplicate: true };
  }

  // Strictly enforce privacy: strip any illegal customer PII fields if accidentally present
  const sanitizedEvent: AegisEvent = {
    org_id: event.org_id,
    event_id: event.event_id,
    type: event.type,
    occurred_at: event.occurred_at || new Date().toISOString(),
    ticket_ref: String(event.ticket_ref).replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 64),
    channel: event.channel || "api",
    topic: event.topic,
    check: event.check,
    reason: event.reason,
    latency_ms: typeof event.latency_ms === "number" ? Math.max(0, event.latency_ms) : undefined,
    model_cost_usd: typeof event.model_cost_usd === "number" ? Math.max(0, event.model_cost_usd) : undefined,
    edit_distance: typeof event.edit_distance === "number" ? Math.max(0, event.edit_distance) : undefined,
    created_at: new Date().toISOString(),
  };

  seenEventKeys.add(key);
  memoryEvents.push(sanitizedEvent);
  if (memoryEvents.length > 25000) {
    memoryEvents.shift();
  }

  // Attempt async write to Supabase if configured (fails gracefully in preview/local)
  try {
    const supabase = createAdminClient();
    await supabase.from("events").insert({
      org_id: sanitizedEvent.org_id,
      event_id: sanitizedEvent.event_id,
      type: sanitizedEvent.type,
      occurred_at: sanitizedEvent.occurred_at,
      ticket_ref: sanitizedEvent.ticket_ref,
      channel: sanitizedEvent.channel,
      topic: sanitizedEvent.topic,
      check: sanitizedEvent.check,
      reason: sanitizedEvent.reason,
      latency_ms: sanitizedEvent.latency_ms,
      model_cost_usd: sanitizedEvent.model_cost_usd,
      edit_distance: sanitizedEvent.edit_distance,
    });
  } catch {
    // Graceful fallback for preview mode without active Supabase connection
  }

  return { isDuplicate: false };
}

/**
 * Record a rejected event (bad signature, replay, validation failure)
 */
export async function recordRejectedEvent(item: Omit<RejectedEvent, "id" | "created_at">): Promise<void> {
  const rejected: RejectedEvent = {
    id: `rej_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    ...item,
    created_at: new Date().toISOString(),
  };

  memoryRejected.unshift(rejected);
  if (memoryRejected.length > 5000) {
    memoryRejected.pop();
  }

  try {
    const supabase = createAdminClient();
    await supabase.from("rejected_events").insert({
      org_id: item.org_id,
      client_ip: item.client_ip,
      reason: item.reason,
      payload_sample: {
        timestamp: item.timestamp,
        signature: item.signature_received?.slice(0, 16) + "...",
      },
    });
  } catch {
    // Graceful fallback for preview mode
  }
}

/**
 * Retrieve recent events for an organization or operator
 */
export function getRecentEvents(orgId?: string, limit = 50): AegisEvent[] {
  const filtered = orgId ? memoryEvents.filter((e) => e.org_id === orgId) : memoryEvents;
  return filtered.slice(-limit).reverse();
}

/**
 * Retrieve rejected events
 */
export function getRecentRejectedEvents(limit = 50): RejectedEvent[] {
  return memoryRejected.slice(0, limit);
}

/**
 * Retrieve events in a date range for rollup
 */
export function getEventsForRange(orgId: string, startDate?: string, endDate?: string): AegisEvent[] {
  return memoryEvents.filter((e) => {
    if (e.org_id !== orgId) return false;
    if (startDate && e.occurred_at < startDate) return false;
    if (endDate && e.occurred_at > endDate) return false;
    return true;
  });
}
