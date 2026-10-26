/**
 * scripts/generate-demo-events.mjs
 * AegisDesk Events API Simulation Engine
 * Generates 5,000 realistic events over 30 days, cryptographically signs with HMAC-SHA256,
 * and posts to the Events API endpoint.
 */

import crypto from "crypto";

const TARGET_BASE = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const DEMO_ORG_ID = "00000000-0000-0000-0000-000000000003";
const API_SECRET = process.env.EVENTS_API_DEFAULT_SECRET || "sec_demo_aegis_key_001";

const CHANNELS = ["zendesk", "freshdesk", "email", "chat", "slack"];
const TOPICS = [
  "enterprise_sla",
  "billing_invoice",
  "return_policy",
  "api_authentication",
  "data_retention_gdpr",
  "pricing_tier_upgrade",
  "soc2_report_request",
];

const HANDOFF_REASONS = [
  { reason: "no_source", weight: 48 },
  { reason: "low_confidence", weight: 31 },
  { reason: "conflicting_policy", weight: 14 },
  { reason: "sensitive_topic", weight: 7 },
];

function pickWeightedReason() {
  const rand = Math.random() * 100;
  let cum = 0;
  for (const item of HANDOFF_REASONS) {
    cum += item.weight;
    if (rand <= cum) return item.reason;
  }
  return "no_source";
}

function generateEvents(totalCount = 5000) {
  const events = [];
  const now = Date.now();
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

  let ticketSeq = 10000;

  while (events.length < totalCount) {
    // Spread evenly across 30 days
    const ageMs = Math.floor(Math.random() * thirtyDaysMs);
    const occurredAt = new Date(now - ageMs).toISOString();

    const ticketRef = `zen_${ticketSeq++}`;
    const channel = CHANNELS[Math.floor(Math.random() * CHANNELS.length)];
    const topic = TOPICS[Math.floor(Math.random() * TOPICS.length)];

    // 1. ticket_received
    events.push({
      org_id: DEMO_ORG_ID,
      event_id: `evt_${crypto.randomBytes(8).toString("hex")}`,
      type: "ticket_received",
      occurred_at: occurredAt,
      ticket_ref: ticketRef,
      channel,
      topic,
    });
    if (events.length >= totalCount) break;

    // 2. draft_created
    const draftLatency = Math.floor(120 + Math.random() * 260); // 120ms - 380ms
    const modelCost = Number((0.0032 + Math.random() * 0.0048).toFixed(4));
    events.push({
      org_id: DEMO_ORG_ID,
      event_id: `evt_${crypto.randomBytes(8).toString("hex")}`,
      type: "draft_created",
      occurred_at: occurredAt,
      ticket_ref: ticketRef,
      channel,
      topic,
      latency_ms: draftLatency,
      model_cost_usd: modelCost,
    });
    if (events.length >= totalCount) break;

    // 82% verified, 18% handed to human
    const isVerified = Math.random() < 0.82;

    if (isVerified) {
      // 3. check_passed
      events.push({
        org_id: DEMO_ORG_ID,
        event_id: `evt_${crypto.randomBytes(8).toString("hex")}`,
        type: "check_passed",
        occurred_at: occurredAt,
        ticket_ref: ticketRef,
        channel,
        topic,
        check: 3,
      });
      if (events.length >= totalCount) break;

      // Approval breakdown in Shadow Mode: 91% approved, 6% edited, 3% rejected
      const outcomeRand = Math.random();
      if (outcomeRand < 0.91) {
        events.push({
          org_id: DEMO_ORG_ID,
          event_id: `evt_${crypto.randomBytes(8).toString("hex")}`,
          type: "reply_approved",
          occurred_at: occurredAt,
          ticket_ref: ticketRef,
          channel,
          topic,
        });
        if (events.length >= totalCount) break;

        // Auto resolved projection
        events.push({
          org_id: DEMO_ORG_ID,
          event_id: `evt_${crypto.randomBytes(8).toString("hex")}`,
          type: "reply_sent",
          occurred_at: occurredAt,
          ticket_ref: ticketRef,
          channel,
          topic,
          edit_distance: 0,
        });
      } else if (outcomeRand < 0.97) {
        events.push({
          org_id: DEMO_ORG_ID,
          event_id: `evt_${crypto.randomBytes(8).toString("hex")}`,
          type: "reply_edited",
          occurred_at: occurredAt,
          ticket_ref: ticketRef,
          channel,
          topic,
          edit_distance: Math.floor(4 + Math.random() * 15),
        });
      } else {
        events.push({
          org_id: DEMO_ORG_ID,
          event_id: `evt_${crypto.randomBytes(8).toString("hex")}`,
          type: "reply_rejected",
          occurred_at: occurredAt,
          ticket_ref: ticketRef,
          channel,
          topic,
          reason: "stylistic_mismatch",
        });
      }
    } else {
      // Check blocked & handed to human
      const checkNum = (Math.floor(Math.random() * 3) + 1);
      const reason = pickWeightedReason();

      events.push({
        org_id: DEMO_ORG_ID,
        event_id: `evt_${crypto.randomBytes(8).toString("hex")}`,
        type: "check_blocked",
        occurred_at: occurredAt,
        ticket_ref: ticketRef,
        channel,
        topic,
        check: checkNum,
        reason,
      });
      if (events.length >= totalCount) break;

      events.push({
        org_id: DEMO_ORG_ID,
        event_id: `evt_${crypto.randomBytes(8).toString("hex")}`,
        type: "handed_to_human",
        occurred_at: occurredAt,
        ticket_ref: ticketRef,
        channel,
        topic,
        reason,
      });
    }
  }

  // Sort chronologically
  events.sort((a, b) => new Date(a.occurred_at).getTime() - new Date(b.occurred_at).getTime());
  return events.slice(0, totalCount);
}

function signPayload(bodyString, timestamp, secret) {
  const payload = `${timestamp}.${bodyString}`;
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

async function sendBatch(eventsBatch) {
  const rawBody = JSON.stringify({ events: eventsBatch });
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = signPayload(rawBody, timestamp, API_SECRET);

  const res = await fetch(`${TARGET_BASE}/api/events`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Aegis-Timestamp": timestamp,
      "X-Aegis-Signature": signature,
    },
    body: rawBody,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Batch send failed with status ${res.status}: ${errText}`);
  }

  return await res.json();
}

async function simulateSecurityAttacks() {
  console.log("\nSimulating security rejections to verify operator telemetry...");

  // 1. Invalid signature attack
  const badBody = JSON.stringify({
    events: [
      {
        org_id: DEMO_ORG_ID,
        event_id: `bad_sig_${Date.now()}`,
        type: "ticket_received",
        ticket_ref: "zen_tampered",
        channel: "chat",
      },
    ],
  });
  const nowTs = Math.floor(Date.now() / 1000).toString();
  const fakeSig = "bad_deadbeef_signature_00000000000000000000000000000000000000000000";

  const res1 = await fetch(`${TARGET_BASE}/api/events`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Aegis-Timestamp": nowTs,
      "X-Aegis-Signature": fakeSig,
    },
    body: badBody,
  });
  console.log(`- Invalid Signature Test: HTTP ${res1.status} (Expected 401)`);

  // 2. Replay attack (>5 min expired timestamp)
  const expiredTs = (Math.floor(Date.now() / 1000) - 600).toString(); // 10 minutes ago
  const replaySig = signPayload(badBody, expiredTs, API_SECRET);
  const res2 = await fetch(`${TARGET_BASE}/api/events`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Aegis-Timestamp": expiredTs,
      "X-Aegis-Signature": replaySig,
    },
    body: badBody,
  });
  console.log(`- Expired Replay Attack Test: HTTP ${res2.status} (Expected 401)`);

  // 3. Prohibited PII / Message text invariant violation
  const piiBody = JSON.stringify({
    events: [
      {
        org_id: DEMO_ORG_ID,
        event_id: `pii_${Date.now()}`,
        type: "ticket_received",
        ticket_ref: "zen_99",
        message_text: "My credit card is 4111-2222...", // Strictly forbidden!
      },
    ],
  });
  const piiTs = Math.floor(Date.now() / 1000).toString();
  const piiSig = signPayload(piiBody, piiTs, API_SECRET);
  const res3 = await fetch(`${TARGET_BASE}/api/events`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Aegis-Timestamp": piiTs,
      "X-Aegis-Signature": piiSig,
    },
    body: piiBody,
  });
  console.log(`- Privacy Invariant (Prohibited Text) Test: HTTP ${res3.status} (Expected 400)`);
}

async function runRollup() {
  console.log("\nTriggering on-demand rollup into daily_metrics...");
  const today = new Date().toISOString().slice(0, 10);
  const res = await fetch(`${TARGET_BASE}/api/events/rollup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      org_id: DEMO_ORG_ID,
      date: today,
      avg_handle_minutes: 11.8,
      agent_hourly_cost: 30.0,
      reporting_currency: "USD",
    }),
  });
  if (res.ok) {
    const data = await res.json();
    console.log(`Rollup completed successfully for ${today}:`);
    console.log(`- Tickets handled: ${data.rollup.tickets_handled}`);
    console.log(`- Verified answer rate: ${data.rollup.verified_answer_rate}%`);
    console.log(`- Handed to team rate: ${data.rollup.handed_to_team_rate}%`);
    console.log(`- Time saved: ${data.rollup.time_saved_hours} hrs (Estimate)`);
    console.log(`- Cost saved: $${data.rollup.cost_saved_amount} (Estimate)`);
  } else {
    console.log(`Rollup endpoint returned status: ${res.status}`);
  }
}

async function main() {
  console.log("=================================================");
  console.log("AegisDesk Simulation: Ingesting 5,000 Real Events");
  console.log(`Target: ${TARGET_BASE}/api/events`);
  console.log(`Organization: ${DEMO_ORG_ID} (Demo Workspace)`);
  console.log("=================================================");

  const allEvents = generateEvents(5000);
  console.log(`Generated ${allEvents.length} realistic events over the past 30 days.`);

  const batchSize = 250;
  let sentCount = 0;
  let batchIndex = 0;

  for (let i = 0; i < allEvents.length; i += batchSize) {
    batchIndex++;
    const batch = allEvents.slice(i, i + batchSize);
    process.stdout.write(`Sending batch ${batchIndex}/${Math.ceil(allEvents.length / batchSize)} (${batch.length} events)... `);
    const result = await sendBatch(batch);
    sentCount += result.accepted || 0;
    console.log(`Accepted: ${result.accepted}, Duplicates: ${result.duplicate}`);
  }

  console.log(`\nSuccessfully ingested ${sentCount} authenticated events.`);

  // Test security rejections
  await simulateSecurityAttacks();

  // Compute rollup
  await runRollup();

  console.log("\nSimulation complete! All charts and control rooms now have 30 days of real history.");
}

main().catch((err) => {
  console.error("Simulation failed:", err);
  process.exit(1);
});
