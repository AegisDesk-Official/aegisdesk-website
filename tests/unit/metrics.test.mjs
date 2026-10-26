import test from "node:test";
import assert from "node:assert/strict";

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
  calculateCustomerSatisfaction,
  calculateMonthlyRecurringRevenue,
  calculatePipeline,
  calculateAiCostPerTicket,
  calculateMarginPerClient,
  calculateReliability,
} from "../../src/lib/metrics/index.ts";

test("calculateTicketsHandled counts ticket_received correctly", () => {
  const events = [
    { type: "ticket_received" },
    { type: "ticket_received" },
    { type: "draft_created" },
    { type: "ticket_received" },
  ];
  assert.equal(calculateTicketsHandled(events), 3);
});

test("calculateVerifiedAnswerRate verifies drafts passed / drafts created", () => {
  // 4 drafts created: t1, t2, t3, t4.
  // t1 had check_blocked.
  // t2, t3, t4 passed all checks.
  // Expected: 3 / 4 = 75.0%
  const events = [
    { type: "draft_created", ticket_ref: "t1" },
    { type: "check_blocked", ticket_ref: "t1", check: 1 },
    { type: "draft_created", ticket_ref: "t2" },
    { type: "draft_created", ticket_ref: "t3" },
    { type: "draft_created", ticket_ref: "t4" },
  ];
  const res = calculateVerifiedAnswerRate(events);
  assert.equal(res.draftsCreated, 4);
  assert.equal(res.draftsPassed, 3);
  assert.equal(res.ratePercentage, 75.0);
});

test("calculateHandedToTeam handles exact reason breakdown", () => {
  const events = [
    { type: "ticket_received" },
    { type: "ticket_received" },
    { type: "ticket_received" },
    { type: "ticket_received" },
    { type: "handed_to_human", reason: "no_source" },
    { type: "handed_to_human", reason: "low_confidence" },
  ];
  const res = calculateHandedToTeam(events);
  assert.equal(res.ticketsHandled, 4);
  assert.equal(res.handedCount, 2);
  assert.equal(res.ratePercentage, 50.0);
  assert.equal(res.reasons.no_source.count, 1);
  assert.equal(res.reasons.no_source.percentage, 50.0);
  assert.equal(res.reasons.low_confidence.count, 1);
  assert.equal(res.reasons.low_confidence.percentage, 50.0);
});

test("calculateBlockedDrafts tallies checks 1, 2, and 3", () => {
  const events = [
    { type: "check_blocked", check: 1 },
    { type: "check_blocked", check: 1 },
    { type: "check_blocked", check: 2 },
    { type: "check_blocked", check: 3 },
  ];
  const res = calculateBlockedDrafts(events);
  assert.equal(res.totalBlocked, 4);
  assert.equal(res.byCheck.check1, 2);
  assert.equal(res.byCheck.check2, 1);
  assert.equal(res.byCheck.check3, 1);
});

test("calculateApprovalRate handles approved / (approved + edited + rejected)", () => {
  const events = [
    { type: "reply_approved" },
    { type: "reply_approved" },
    { type: "reply_approved" },
    { type: "reply_edited" },
  ];
  // 3 approved out of 4 decided -> 75.0%
  const res = calculateApprovalRate(events);
  assert.equal(res.approved, 3);
  assert.equal(res.edited, 1);
  assert.equal(res.totalDecided, 4);
  assert.equal(res.approvalRatePercentage, 75.0);
});

test("calculateAutoResolvedRate counts reply_sent with edit_distance 0", () => {
  const events = [
    { type: "ticket_received" },
    { type: "ticket_received" },
    { type: "reply_sent", edit_distance: 0 },
  ];
  // 1 out of 2 tickets -> 50.0%
  const res = calculateAutoResolvedRate(events);
  assert.equal(res.autoResolvedCount, 1);
  assert.equal(res.ratePercentage, 50.0);
});

test("calculateFirstResponseTime computes median and p95", () => {
  const events = [
    { type: "ticket_received", ticket_ref: "t1", occurred_at: "2026-10-26T00:00:00Z" },
    { type: "reply_sent", ticket_ref: "t1", occurred_at: "2026-10-26T00:00:20Z" }, // 20s
    { type: "ticket_received", ticket_ref: "t2", occurred_at: "2026-10-26T00:00:00Z" },
    { type: "reply_sent", ticket_ref: "t2", occurred_at: "2026-10-26T00:00:40Z" }, // 40s
    { type: "ticket_received", ticket_ref: "t3", occurred_at: "2026-10-26T00:00:00Z" },
    { type: "reply_sent", ticket_ref: "t3", occurred_at: "2026-10-26T00:01:00Z" }, // 60s
  ];
  const res = calculateFirstResponseTime(events);
  assert.equal(res.medianSeconds, 40);
  assert.equal(res.p95Seconds, 60);
});

test("calculateTimeSaved and calculateCostSaved hand-calculated example", () => {
  // 2 auto resolved + 2 approved as is = 4 qualifying
  // avg handle minutes = 15.0
  // total minutes = 4 * 15 = 60 min = 1.0 hr
  // agent hourly cost = $40.00
  // cost saved = 1.0 * 40 = $40.00
  const events = [
    { type: "reply_sent", edit_distance: 0 },
    { type: "reply_sent", edit_distance: 0 },
    { type: "reply_approved" },
    { type: "reply_approved" },
  ];
  const timeRes = calculateTimeSaved(events, 15.0);
  assert.equal(timeRes.qualifyingCount, 4);
  assert.equal(timeRes.timeSavedHours, 1.0);

  const costRes = calculateCostSaved(events, 15.0, 40.0);
  assert.equal(costRes.costSavedUsd, 40.0);
});

test("calculatePolicyGaps groups no_source tickets by topic", () => {
  const events = [
    { type: "handed_to_human", reason: "no_source", topic: "Damaged Goods Claim", ticket_ref: "t1" },
    { type: "handed_to_human", reason: "no_source", topic: "Damaged Goods Claim", ticket_ref: "t2" },
    { type: "handed_to_human", reason: "no_source", topic: "Return Policy", ticket_ref: "t3" },
    { type: "handed_to_human", reason: "low_confidence", topic: "Other", ticket_ref: "t4" },
  ];
  const gaps = calculatePolicyGaps(events);
  assert.equal(gaps.length, 2);
  assert.equal(gaps[0].topic, "Damaged Goods Claim");
  assert.equal(gaps[0].count, 2);
  assert.equal(gaps[1].topic, "Return Policy");
  assert.equal(gaps[1].count, 1);
});

test("Owner metrics: calculateMonthlyRecurringRevenue, AI cost, and margin", () => {
  const clients = [
    { retainer: 1000, phase: "live" },
    { retainer: 1000, phase: "shadow_mode" },
    { retainer: 2500, phase: "onboarding" }, // onboarding not recurring retainer yet
  ];
  assert.equal(calculateMonthlyRecurringRevenue(clients), 2000);

  // AI cost per ticket: $50 model cost for 1,000 tickets = $0.05 / ticket
  assert.equal(calculateAiCostPerTicket(50.0, 1000), 0.05);

  // Margin: $1,000 retainer - $50 AI cost - $15 infra = $935 (93.5%)
  const marginRes = calculateMarginPerClient(1000, 50, 15);
  assert.equal(marginRes.marginAmount, 935.0);
  assert.equal(marginRes.marginPercentage, 93.5);
});
