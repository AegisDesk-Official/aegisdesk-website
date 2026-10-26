import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getEventsForRange } from "@/lib/db/events-store";
import { createAdminClient } from "@/lib/db/admin";
import {
  calculateTicketsHandled,
  calculateVerifiedAnswerRate,
  calculateHandedToTeam,
  calculateBlockedDrafts,
  calculateApprovalRate,
  calculateAutoResolvedRate,
  calculateFirstResponseTime,
  calculateTimeSaved,
  calculateCostSaved,
  calculatePolicyGaps,
  calculateTopTopics,
  calculateKnowledgeHealth,
  calculateChannelSplit,
  type DailyMetricsRollup,
  type OrgSettings,
} from "@/lib/metrics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// In-memory store for rollups in preview mode
const globalForRollups = globalThis as unknown as {
  __aegis_rollups?: Map<string, DailyMetricsRollup>;
};
const rollupsStore = globalForRollups.__aegis_rollups || new Map<string, DailyMetricsRollup>();
globalForRollups.__aegis_rollups = rollupsStore;

const rollupRequestSchema = z.object({
  org_id: z.string().min(1),
  date: z.string().optional(), // YYYY-MM-DD
  avg_handle_minutes: z.number().positive().default(11.8),
  agent_hourly_cost: z.number().positive().default(30.0),
  reporting_currency: z.string().default("USD"),
});

/**
 * POST /api/events/rollup: Compute nightly or on-demand rollup into daily_metrics
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parseResult = rollupRequestSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json({ error: "Invalid rollup parameters", details: parseResult.error.format() }, { status: 400 });
    }

    const { org_id, date, avg_handle_minutes, agent_hourly_cost, reporting_currency } = parseResult.data;
    const targetDate = date || new Date().toISOString().slice(0, 10);
    const startIso = `${targetDate}T00:00:00.000Z`;
    const endIso = `${targetDate}T23:59:59.999Z`;

    // Fetch events for target organization and date
    const events = getEventsForRange(org_id, startIso, endIso);

    const orgSettings: OrgSettings = {
      avg_handle_minutes,
      agent_hourly_cost,
      reporting_currency,
    };

    // Calculate metrics using pure tested formulas
    const ticketsHandled = calculateTicketsHandled(events);
    const verifiedRate = calculateVerifiedAnswerRate(events);
    const handedToTeam = calculateHandedToTeam(events);
    const blockedDrafts = calculateBlockedDrafts(events);
    const approvalRate = calculateApprovalRate(events);
    const autoResolvedRate = calculateAutoResolvedRate(events);
    const firstResponse = calculateFirstResponseTime(events);
    const timeSaved = calculateTimeSaved(events, orgSettings.avg_handle_minutes);
    const costSaved = calculateCostSaved(events, orgSettings.avg_handle_minutes, orgSettings.agent_hourly_cost);
    const policyGaps = calculatePolicyGaps(events);
    const topTopics = calculateTopTopics(events);
    const knowledgeHealth = calculateKnowledgeHealth(events);
    const channelSplit = calculateChannelSplit(events);

    const rollup: DailyMetricsRollup = {
      org_id,
      date: targetDate,
      tickets_handled: ticketsHandled,
      verified_answer_rate: verifiedRate.ratePercentage,
      handed_to_team_rate: handedToTeam.ratePercentage,
      handoff_reasons: handedToTeam,
      blocked_drafts_total: blockedDrafts.totalBlocked,
      blocked_check_1: blockedDrafts.byCheck.check1,
      blocked_check_2: blockedDrafts.byCheck.check2,
      blocked_check_3: blockedDrafts.byCheck.check3,
      approval_rate_shadow: approvalRate.approvalRatePercentage,
      autoresolved_rate_live: autoResolvedRate.ratePercentage,
      median_first_response_ms: Math.round(firstResponse.medianSeconds * 1000),
      p95_first_response_ms: Math.round(firstResponse.p95Seconds * 1000),
      time_saved_hours: timeSaved.timeSavedHours,
      cost_saved_amount: costSaved.costSavedUsd,
      currency: reporting_currency,
      top_topics: topTopics,
      knowledge_health_score: knowledgeHealth.shareWithSourcePercentage,
      channel_split: channelSplit.map((c) => ({
        channel: c.channel,
        count: c.count,
        percentage: c.sharePercentage,
      })),
      policy_gaps_count: policyGaps.length,
      policy_gaps: policyGaps,
    };

    // Store in memory
    const rollupKey = `${org_id}:${targetDate}`;
    rollupsStore.set(rollupKey, rollup);

    // Attempt persistence in Supabase daily_metrics
    try {
      const supabase = createAdminClient();
      await supabase.from("daily_metrics").upsert(
        {
          org_id,
          date: targetDate,
          tickets_handled: rollup.tickets_handled,
          verified_answer_rate: rollup.verified_answer_rate,
          handed_to_team_rate: rollup.handed_to_team_rate,
          blocked_drafts_count: rollup.blocked_drafts_total,
          approval_rate_shadow: rollup.approval_rate_shadow,
          autoresolved_rate_live: rollup.autoresolved_rate_live,
          median_response_time_ms: rollup.median_first_response_ms,
          p95_response_time_ms: rollup.p95_first_response_ms,
          time_saved_hours: rollup.time_saved_hours,
          cost_saved_usd: rollup.cost_saved_amount,
          knowledge_health_score: rollup.knowledge_health_score,
          handoff_breakdown: rollup.handoff_reasons,
          channel_breakdown: rollup.channel_split,
          top_topics: rollup.top_topics,
          policy_gaps: rollup.policy_gaps,
        },
        { onConflict: "org_id,date" }
      );
    } catch {
      // Graceful fallback for preview mode
    }

    return NextResponse.json({
      status: "success",
      org_id,
      date: targetDate,
      events_processed: events.length,
      rollup,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Rollup calculation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * GET /api/events/rollup: Fetch computed daily metrics
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const orgId = searchParams.get("org_id") || "00000000-0000-0000-0000-000000000003";
  const date = searchParams.get("date") || new Date().toISOString().slice(0, 10);

  const rollupKey = `${orgId}:${date}`;
  const cached = rollupsStore.get(rollupKey);

  if (cached) {
    return NextResponse.json({ rollup: cached, source: "memory" });
  }

  // Attempt fetch from Supabase
  try {
    const supabase = createAdminClient();
    const { data } = await supabase.from("daily_metrics").select("*").eq("org_id", orgId).eq("date", date).maybeSingle();
    if (data) {
      return NextResponse.json({ rollup: data, source: "database" });
    }
  } catch {
    // Ignore error
  }

  return NextResponse.json({ error: "No rollup found for date", org_id: orgId, date }, { status: 404 });
}
