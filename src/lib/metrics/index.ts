/**
 * AegisDesk Metrics Engine
 * =====================================================================
 * Pure, deterministic mathematical functions calculating customer support
 * and executive telemetry from raw events and organization parameters.
 * Zero side-effects; 100% testable with hand-calculated fixtures.
 * =====================================================================
 */

export type EventType =
  | "ticket_received"
  | "draft_created"
  | "check_passed"
  | "check_blocked"
  | "handed_to_human"
  | "reply_approved"
  | "reply_edited"
  | "reply_rejected"
  | "reply_sent";

export interface ApiEvent {
  org_id: string;
  event_id: string;
  type: EventType;
  occurred_at: string; // ISO 8601
  ticket_ref: string; // Opaque ticket identifier - NEVER customer text
  channel?: string;
  topic?: string;
  check?: 1 | 2 | 3;
  reason?: "no_source" | "low_confidence" | "conflicting_policy" | "sensitive_topic" | string;
  latency_ms?: number;
  model_cost_usd?: number;
  edit_distance?: number;
  csat_score?: number; // 1 to 5 (optional)
}

export interface ClientOrgSettings {
  avg_handle_minutes: number;
  agent_hourly_cost: number;
  reporting_currency: string;
}

export type OrgSettings = ClientOrgSettings;

export interface DailyMetricsRollup {
  org_id: string;
  date: string;
  tickets_handled: number;
  verified_answer_rate: number;
  handed_to_team_rate: number;
  handoff_reasons: HandoffBreakdown;
  blocked_drafts_total: number;
  blocked_check_1: number;
  blocked_check_2: number;
  blocked_check_3: number;
  approval_rate_shadow: number;
  autoresolved_rate_live: number;
  median_first_response_ms: number;
  p95_first_response_ms: number;
  time_saved_hours: number;
  cost_saved_amount: number;
  currency: string;
  top_topics: Array<{ topic: string; volume: number; handoffCount: number; handoffRate: number }>;
  knowledge_health_score: number;
  channel_split: Array<{ channel: string; count: number; percentage: number }>;
  policy_gaps_count: number;
  policy_gaps: Array<{ topic: string; count: number; sampleTicketRef: string }>;
}

export const DEFAULT_ORG_SETTINGS: ClientOrgSettings = {
  avg_handle_minutes: 11.8,
  agent_hourly_cost: 30.0,
  reporting_currency: "USD",
};

/**
 * 1. Tickets handled: Count of ticket_received in the period
 */
export function calculateTicketsHandled(events: ApiEvent[]): number {
  return events.filter((e) => e.type === "ticket_received").length;
}

/**
 * 2. Verified-answer rate: Drafts that passed every check / drafts created
 * A draft passes every check if it has passed checks and 0 check_blocked events for that ticket_ref.
 */
export function calculateVerifiedAnswerRate(events: ApiEvent[]): {
  draftsCreated: number;
  draftsPassed: number;
  ratePercentage: number;
} {
  const draftsCreatedTickets = new Set(
    events.filter((e) => e.type === "draft_created").map((e) => e.ticket_ref)
  );
  const draftsCreated = draftsCreatedTickets.size;
  if (draftsCreated === 0) {
    return { draftsCreated: 0, draftsPassed: 0, ratePercentage: 0 };
  }

  const blockedTickets = new Set(
    events.filter((e) => e.type === "check_blocked").map((e) => e.ticket_ref)
  );

  let draftsPassed = 0;
  draftsCreatedTickets.forEach((ticket) => {
    if (!blockedTickets.has(ticket)) {
      draftsPassed++;
    }
  });

  const ratePercentage = Math.round((draftsPassed / draftsCreated) * 1000) / 10;
  return { draftsCreated, draftsPassed, ratePercentage };
}

/**
 * 3. Handed to your team: handed_to_human / ticket_received,
 * split by reason: no_source, low_confidence, conflicting_policy, sensitive_topic
 */
export interface HandoffBreakdown {
  handedCount: number;
  ticketsHandled: number;
  ratePercentage: number;
  reasons: {
    no_source: { count: number; percentage: number };
    low_confidence: { count: number; percentage: number };
    conflicting_policy: { count: number; percentage: number };
    sensitive_topic: { count: number; percentage: number };
    other: { count: number; percentage: number };
  };
}

export function calculateHandedToTeam(events: ApiEvent[]): HandoffBreakdown {
  const ticketsHandled = calculateTicketsHandled(events);
  const handoffEvents = events.filter((e) => e.type === "handed_to_human");
  const handedCount = handoffEvents.length;

  const initialReasons = {
    no_source: 0,
    low_confidence: 0,
    conflicting_policy: 0,
    sensitive_topic: 0,
    other: 0,
  };

  for (const ev of handoffEvents) {
    if (ev.reason === "no_source") initialReasons.no_source++;
    else if (ev.reason === "low_confidence") initialReasons.low_confidence++;
    else if (ev.reason === "conflicting_policy") initialReasons.conflicting_policy++;
    else if (ev.reason === "sensitive_topic") initialReasons.sensitive_topic++;
    else initialReasons.other++;
  }

  const getPct = (cnt: number) =>
    handedCount === 0 ? 0 : Math.round((cnt / handedCount) * 1000) / 10;

  const ratePercentage =
    ticketsHandled === 0 ? 0 : Math.round((handedCount / ticketsHandled) * 1000) / 10;

  return {
    handedCount,
    ticketsHandled,
    ratePercentage,
    reasons: {
      no_source: { count: initialReasons.no_source, percentage: getPct(initialReasons.no_source) },
      low_confidence: { count: initialReasons.low_confidence, percentage: getPct(initialReasons.low_confidence) },
      conflicting_policy: { count: initialReasons.conflicting_policy, percentage: getPct(initialReasons.conflicting_policy) },
      sensitive_topic: { count: initialReasons.sensitive_topic, percentage: getPct(initialReasons.sensitive_topic) },
      other: { count: initialReasons.other, percentage: getPct(initialReasons.other) },
    },
  };
}

/**
 * 4. Blocked drafts: check_blocked count, by check 1, 2 or 3
 */
export function calculateBlockedDrafts(events: ApiEvent[]): {
  totalBlocked: number;
  byCheck: { check1: number; check2: number; check3: number };
} {
  const blocked = events.filter((e) => e.type === "check_blocked");
  const byCheck = { check1: 0, check2: 0, check3: 0 };

  for (const b of blocked) {
    if (b.check === 1) byCheck.check1++;
    else if (b.check === 2) byCheck.check2++;
    else if (b.check === 3) byCheck.check3++;
  }

  return {
    totalBlocked: blocked.length,
    byCheck,
  };
}

/**
 * 5. Approval rate (Shadow Validation): reply_approved / (approved + edited + rejected)
 */
export function calculateApprovalRate(events: ApiEvent[]): {
  approved: number;
  edited: number;
  rejected: number;
  totalDecided: number;
  approvalRatePercentage: number;
} {
  const approved = events.filter((e) => e.type === "reply_approved").length;
  const edited = events.filter((e) => e.type === "reply_edited").length;
  const rejected = events.filter((e) => e.type === "reply_rejected").length;
  const totalDecided = approved + edited + rejected;

  const approvalRatePercentage =
    totalDecided === 0 ? 0 : Math.round((approved / totalDecided) * 1000) / 10;

  return { approved, edited, rejected, totalDecided, approvalRatePercentage };
}

/**
 * 6. Auto-resolved rate (Live): reply_sent with edit_distance 0 / ticket_received
 */
export function calculateAutoResolvedRate(events: ApiEvent[]): {
  autoResolvedCount: number;
  ticketsReceived: number;
  ratePercentage: number;
} {
  const ticketsReceived = calculateTicketsHandled(events);
  const autoResolvedCount = events.filter(
    (e) => e.type === "reply_sent" && (e.edit_distance === 0 || e.edit_distance === undefined)
  ).length;

  const ratePercentage =
    ticketsReceived === 0 ? 0 : Math.round((autoResolvedCount / ticketsReceived) * 1000) / 10;

  return { autoResolvedCount, ticketsReceived, ratePercentage };
}

/**
 * 7. First response time: Median and 95th percentile of ticket_received to reply_sent
 */
export function calculateFirstResponseTime(events: ApiEvent[]): {
  durationsSeconds: number[];
  medianSeconds: number;
  p95Seconds: number;
} {
  const receivedMap = new Map<string, number>();
  const durations: number[] = [];

  for (const e of events) {
    if (e.type === "ticket_received") {
      receivedMap.set(e.ticket_ref, new Date(e.occurred_at).getTime());
    } else if (e.type === "reply_sent" && receivedMap.has(e.ticket_ref)) {
      const startTime = receivedMap.get(e.ticket_ref)!;
      const endTime = new Date(e.occurred_at).getTime();
      const diffSec = Math.max(0, (endTime - startTime) / 1000);
      durations.push(diffSec);
    }
  }

  if (durations.length === 0) {
    return { durationsSeconds: [], medianSeconds: 0, p95Seconds: 0 };
  }

  durations.sort((a, b) => a - b);
  const mid = Math.floor(durations.length / 2);
  const medianSeconds =
    durations.length % 2 !== 0
      ? durations[mid]
      : (durations[mid - 1] + durations[mid]) / 2;

  const p95Index = Math.min(
    durations.length - 1,
    Math.floor(durations.length * 0.95)
  );
  const p95Seconds = durations[p95Index];

  return {
    durationsSeconds: durations,
    medianSeconds: Math.round(medianSeconds),
    p95Seconds: Math.round(p95Seconds),
  };
}

/**
 * 8. Time saved (Estimate): (auto-resolved + approved as is) x average handle minutes you set
 */
export function calculateTimeSaved(
  events: ApiEvent[],
  avgHandleMinutes: number = DEFAULT_ORG_SETTINGS.avg_handle_minutes
): {
  qualifyingCount: number;
  avgHandleMinutes: number;
  timeSavedMinutes: number;
  timeSavedHours: number;
} {
  const autoResolved = events.filter(
    (e) => e.type === "reply_sent" && (e.edit_distance === 0 || e.edit_distance === undefined)
  ).length;
  const approvedAsIs = events.filter((e) => e.type === "reply_approved").length;
  const qualifyingCount = autoResolved + approvedAsIs;

  const timeSavedMinutes = qualifyingCount * avgHandleMinutes;
  const timeSavedHours = Math.round((timeSavedMinutes / 60) * 10) / 10;

  return {
    qualifyingCount,
    avgHandleMinutes,
    timeSavedMinutes,
    timeSavedHours,
  };
}

/**
 * Single source of truth for projected savings across Overview, Analytics, and Settings.
 * Derived from the client's own settings (average handle time, agent hourly cost)
 * and approved-as-is drafts.
 */
export function calculateProjectedSavings({
  approvedAsIsCount,
  avgHandleMinutes = DEFAULT_ORG_SETTINGS.avg_handle_minutes,
  agentHourlyCost = DEFAULT_ORG_SETTINGS.agent_hourly_cost,
}: {
  approvedAsIsCount: number;
  avgHandleMinutes?: number;
  agentHourlyCost?: number;
}): {
  hoursSaved: number;
  monthlySavingsUsd: number;
  formula: string;
} {
  const hoursSaved = Math.round(((approvedAsIsCount * avgHandleMinutes) / 60) * 10) / 10;
  const monthlySavingsUsd = Math.round(hoursSaved * agentHourlyCost);
  const formula = `(${approvedAsIsCount.toLocaleString()} approved drafts × ${avgHandleMinutes}m AHT) ÷ 60 × $${agentHourlyCost}/hr = $${monthlySavingsUsd.toLocaleString()}/mo`;
  return {
    hoursSaved,
    monthlySavingsUsd,
    formula,
  };
}

/**
 * 9. Cost saved (Estimate): Time saved x agent hourly cost you set
 */
export function calculateCostSaved(
  events: ApiEvent[],
  avgHandleMinutes: number = DEFAULT_ORG_SETTINGS.avg_handle_minutes,
  agentHourlyCost: number = DEFAULT_ORG_SETTINGS.agent_hourly_cost
): {
  timeSavedHours: number;
  agentHourlyCost: number;
  costSavedUsd: number;
} {
  const { timeSavedHours } = calculateTimeSaved(events, avgHandleMinutes);
  const costSavedUsd = Math.round(timeSavedHours * agentHourlyCost * 100) / 100;
  return { timeSavedHours, agentHourlyCost, costSavedUsd };
}

/**
 * 10. Policy gaps: Handed-over tickets with reason 'no source', grouped by topic
 */
export function calculatePolicyGaps(
  events: ApiEvent[]
): { topic: string; count: number; sampleTicketRef: string }[] {
  const noSourceEvents = events.filter(
    (e) => e.type === "handed_to_human" && e.reason === "no_source"
  );
  const topicMap = new Map<string, { count: number; sampleTicketRef: string }>();

  for (const e of noSourceEvents) {
    const topic = e.topic || "Uncategorized Missing SOP";
    const existing = topicMap.get(topic) || { count: 0, sampleTicketRef: e.ticket_ref };
    existing.count++;
    topicMap.set(topic, existing);
  }

  return Array.from(topicMap.entries())
    .map(([topic, val]) => ({
      topic,
      count: val.count,
      sampleTicketRef: val.sampleTicketRef,
    }))
    .sort((a, b) => b.count - a.count);
}

/**
 * 11. Top topics: Volume and handoff rate per topic
 */
export function calculateTopTopics(
  events: ApiEvent[]
): { topic: string; volume: number; handoffCount: number; handoffRate: number }[] {
  const topicTotals = new Map<string, number>();
  const topicHandoffs = new Map<string, number>();

  for (const e of events) {
    if (e.topic) {
      if (e.type === "ticket_received") {
        topicTotals.set(e.topic, (topicTotals.get(e.topic) || 0) + 1);
      } else if (e.type === "handed_to_human") {
        topicHandoffs.set(e.topic, (topicHandoffs.get(e.topic) || 0) + 1);
      }
    }
  }

  return Array.from(topicTotals.entries())
    .map(([topic, volume]) => {
      const handoffCount = topicHandoffs.get(topic) || 0;
      const handoffRate = volume === 0 ? 0 : Math.round((handoffCount / volume) * 1000) / 10;
      return { topic, volume, handoffCount, handoffRate };
    })
    .sort((a, b) => b.volume - a.volume);
}

/**
 * 12. Knowledge health: Document count, days since last update, share of tickets with at least one source
 */
export function calculateKnowledgeHealth(
  events: ApiEvent[],
  documentCount = 14,
  lastUpdatedDate = new Date(Date.now() - 3 * 86400000)
): {
  documentCount: number;
  daysSinceLastUpdate: number;
  shareWithSourcePercentage: number;
} {
  const ticketsReceived = calculateTicketsHandled(events);
  const noSourceCount = events.filter(
    (e) => e.type === "handed_to_human" && e.reason === "no_source"
  ).length;

  const ticketsWithSource = Math.max(0, ticketsReceived - noSourceCount);
  const shareWithSourcePercentage =
    ticketsReceived === 0 ? 100 : Math.round((ticketsWithSource / ticketsReceived) * 1000) / 10;

  const diffMs = Math.max(0, Date.now() - lastUpdatedDate.getTime());
  const daysSinceLastUpdate = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  return {
    documentCount,
    daysSinceLastUpdate,
    shareWithSourcePercentage,
  };
}

/**
 * 13. Channel split: Count by channel (Zendesk, Gorgias, Freshdesk, other)
 */
export function calculateChannelSplit(
  events: ApiEvent[]
): { channel: string; count: number; sharePercentage: number }[] {
  const received = events.filter((e) => e.type === "ticket_received");
  const channelCounts = new Map<string, number>();

  for (const e of received) {
    const ch = e.channel || "other";
    channelCounts.set(ch, (channelCounts.get(ch) || 0) + 1);
  }

  const total = received.length;
  return Array.from(channelCounts.entries()).map(([channel, count]) => ({
    channel,
    count,
    sharePercentage: total === 0 ? 0 : Math.round((count / total) * 1000) / 10,
  }));
}

/**
 * 14. Customer satisfaction: Shown only if the helpdesk sends CSAT; hidden otherwise
 */
export function calculateCustomerSatisfaction(
  events: ApiEvent[]
): { hasCsat: boolean; averageCsat: number; totalResponses: number } {
  const csatScores = events
    .filter((e) => e.csat_score !== undefined && e.csat_score > 0)
    .map((e) => e.csat_score!);

  if (csatScores.length === 0) {
    return { hasCsat: false, averageCsat: 0, totalResponses: 0 };
  }

  const sum = csatScores.reduce((acc, val) => acc + val, 0);
  const averageCsat = Math.round((sum / csatScores.length) * 100) / 100;

  return {
    hasCsat: true,
    averageCsat,
    totalResponses: csatScores.length,
  };
}

// =====================================================================
// OWNER TELEMETRY FORMULAS
// =====================================================================

export interface ClientPortfolioItem {
  id: string;
  name: string;
  retainer: number;
  tickets: number;
  modelCostUsd: number;
  infraShareUsd: number;
  phase: string;
}

/**
 * Monthly recurring revenue: Sum of active retainers, in one reporting currency
 */
export function calculateMonthlyRecurringRevenue(clients: { retainer: number; phase: string }[]): number {
  return clients
    .filter((c) => c.phase === "live" || c.phase === "retainer_active" || c.phase === "shadow_mode")
    .reduce((acc, c) => acc + c.retainer, 0);
}

/**
 * Pipeline: Count by state: booked, proposal sent, deposit paid, Shadow Validation, live
 */
export function calculatePipeline(
  items: { state: "booked" | "proposal_sent" | "deposit_paid" | "shadow_mode" | "live" }[]
): Record<string, number> {
  const counts: Record<string, number> = {
    booked: 0,
    proposal_sent: 0,
    deposit_paid: 0,
    shadow_mode: 0,
    live: 0,
  };

  for (const item of items) {
    if (counts[item.state] !== undefined) {
      counts[item.state]++;
    }
  }

  return counts;
}

/**
 * AI cost per ticket: Sum of model_cost_usd / tickets, by client
 */
export function calculateAiCostPerTicket(totalModelCostUsd: number, totalTickets: number): number {
  if (totalTickets === 0) return 0;
  return Math.round((totalModelCostUsd / totalTickets) * 10000) / 10000;
}

/**
 * Margin per client: Retainer - AI cost - infrastructure share
 */
export function calculateMarginPerClient(
  retainer: number,
  aiCost: number,
  infraShare: number = 15.0
): { marginAmount: number; marginPercentage: number } {
  const marginAmount = Math.round((retainer - aiCost - infraShare) * 100) / 100;
  const marginPercentage =
    retainer === 0 ? 0 : Math.round((marginAmount / retainer) * 1000) / 10;
  return { marginAmount, marginPercentage };
}

/**
 * Reliability: Error rate and 95th percentile latency of the Events API and site
 */
export function calculateReliability(
  latenciesMs: number[],
  failedRequests: number,
  totalRequests: number
): { errorRatePercentage: number; p95LatencyMs: number } {
  const errorRatePercentage =
    totalRequests === 0 ? 0 : Math.round((failedRequests / totalRequests) * 10000) / 100;

  if (latenciesMs.length === 0) {
    return { errorRatePercentage, p95LatencyMs: 0 };
  }

  const sorted = [...latenciesMs].sort((a, b) => a - b);
  const p95Idx = Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95));
  const p95LatencyMs = sorted[p95Idx];

  return { errorRatePercentage, p95LatencyMs };
}
