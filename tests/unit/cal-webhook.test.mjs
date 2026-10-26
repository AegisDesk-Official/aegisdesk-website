import { test } from "node:test";
import assert from "node:assert/strict";
import crypto from "crypto";

import { verifyCalSignature } from "../../src/lib/calendar/verify-signature.ts";
import {
  handleBookingCreated,
  handleBookingRescheduled,
  handleBookingCancelled,
  isCalEventProcessed,
  recordCalWebhookEvent,
  extractCustomBookingFields,
  getAllLeads,
} from "../../src/lib/calendar/cal-store.ts";
import { getAllRealClients } from "../../src/lib/db/operator-store.ts";
import { getRecentOutboxEmails } from "../../src/lib/email/resend.ts";

const TEST_SECRET = "cal_whsec_test_secret_key_9812";

test("1. Valid Cal.com HMAC SHA-256 signature verification succeeds", () => {
  const payloadStr = JSON.stringify({
    triggerEvent: "BOOKING_CREATED",
    payload: { uid: "test_uid_01", startTime: "2026-10-30T14:00:00Z" },
  });

  const validSignature = crypto
    .createHmac("sha256", TEST_SECRET)
    .update(payloadStr)
    .digest("hex");

  const result = verifyCalSignature({
    rawBody: payloadStr,
    signatureHeader: validSignature,
    secret: TEST_SECRET,
  });

  assert.equal(result.valid, true, "Signature verification should pass");
  assert.equal(result.error, undefined);
});

test("2. Tampered or invalid Cal.com signature is rejected (constant-time evaluation)", () => {
  const payloadStr = JSON.stringify({
    triggerEvent: "BOOKING_CREATED",
    payload: { uid: "test_uid_02" },
  });

  const badSignature = "bad_deadbeef_signature_hash_0000000000000000000000000000000000000000000000";

  const result = verifyCalSignature({
    rawBody: payloadStr,
    signatureHeader: badSignature,
    secret: TEST_SECRET,
  });

  assert.equal(result.valid, false, "Tampered signature must be rejected");
  assert.match(result.error || "", /verification failed|length mismatch/i);
});

test("3. Missing signature header is rejected", () => {
  const payloadStr = JSON.stringify({ triggerEvent: "BOOKING_CREATED" });

  const result = verifyCalSignature({
    rawBody: payloadStr,
    signatureHeader: null,
    secret: TEST_SECRET,
  });

  assert.equal(result.valid, false);
  assert.match(result.error || "", /Missing required 'x-cal-signature-256'/i);
});

test("4. Custom booking questions mapping (company, helpdesk_used, tickets_per_month)", () => {
  const mockResponses = {
    name: { label: "Your name", value: "Alexander Wright" },
    email: { label: "Email Address", value: "alex@hyperretail.com" },
    company: { label: "Company / Organization Name", value: "HyperRetail Inc" },
    helpdesk_used: { label: "Helpdesk Used", value: "Zendesk Enterprise" },
    tickets_per_month: { label: "Tickets Per Month", value: "5,000 - 15,000" },
  };

  const fields = extractCustomBookingFields(mockResponses);
  assert.equal(fields.company, "HyperRetail Inc");
  assert.equal(fields.helpdesk_used, "Zendesk Enterprise");
  assert.equal(fields.tickets_per_month, "5,000 - 15,000");
});

test("5. BOOKING_CREATED creates lead and booking, moves lead to 'booked call'", async () => {
  const bookingPayload = {
    uid: "cal_test_uid_9901",
    startTime: "2026-11-02T16:00:00.000Z",
    endTime: "2026-11-02T16:15:00.000Z",
    attendees: [
      {
        name: "Samantha Reed",
        email: "samantha@apexlogistics.io",
      },
    ],
    responses: {
      company: { value: "Apex Logistics Global" },
      helpdesk_used: { value: "Gorgias" },
      tickets_per_month: { value: "2,000 - 5,000" },
    },
    notes: "High return rate inquiry during holiday promotions.",
  };

  const { lead, booking, isNewLead } = await handleBookingCreated(bookingPayload);

  assert.equal(lead.email, "samantha@apexlogistics.io");
  assert.equal(lead.name, "Samantha Reed");
  assert.equal(lead.company, "Apex Logistics Global");
  assert.equal(lead.helpdesk_used, "Gorgias");
  assert.equal(lead.tickets_per_month, "2,000 - 5,000");
  assert.equal(lead.stage, "booked call", "Lead stage must be 'booked call'");
  assert.equal(booking.cal_booking_id, "cal_test_uid_9901");
  assert.equal(booking.status, "scheduled");

  // Verify in lead store
  const allLeads = getAllLeads();
  const matched = allLeads.find((l) => l.email === "samantha@apexlogistics.io");
  assert.ok(matched, "Stored lead must exist in leadsStore");
  assert.equal(matched.company, "Apex Logistics Global");
});

test("6. Event idempotency: replayed webhook is flagged as processed", async () => {
  const testEventId = "BOOKING_CREATED:cal_test_uid_9901";

  assert.equal(isCalEventProcessed(testEventId), false, "Event not processed yet");

  await recordCalWebhookEvent({
    event_id: testEventId,
    trigger_event: "BOOKING_CREATED",
    payload: { uid: "cal_test_uid_9901" },
    status: "processed",
    processed_at: new Date().toISOString(),
  });

  assert.equal(isCalEventProcessed(testEventId), true, "Event must be recognized as processed");
});

test("7. BOOKING_RESCHEDULED updates meeting start time", async () => {
  const reschedulePayload = {
    uid: "cal_test_uid_9901",
    startTime: "2026-11-05T18:30:00.000Z",
    endTime: "2026-11-05T18:45:00.000Z",
  };

  const updated = await handleBookingRescheduled(reschedulePayload);
  assert.ok(updated);
  assert.equal(updated.event_time, "2026-11-05T18:30:00.000Z");
  assert.equal(updated.status, "rescheduled");
});

test("8. BOOKING_CANCELLED marks status as cancelled", async () => {
  const cancelPayload = {
    uid: "cal_test_uid_9901",
  };

  const cancelled = await handleBookingCancelled(cancelPayload);
  assert.ok(cancelled);
  assert.equal(cancelled.status, "cancelled");
});

test("9. Stored lead is synchronized into Owner Console Pipeline with stage 'Booked call'", async () => {
  const realClients = getAllRealClients();
  const matchedClient = realClients.find((c) => c.supportEmail === "samantha@apexlogistics.io");
  assert.ok(matchedClient, "Lead must be present in operator console real clients");
  assert.equal(matchedClient.name, "Apex Logistics Global");
  assert.equal(matchedClient.state, "Booked call", "Pipeline state must be 'Booked call'");
  assert.ok(matchedClient.setupFee >= 2500, "Setup fee must be derived from pricing config");
});

test("10. End-to-end webhook processing with Resend email notification dispatch and idempotency", async () => {
  const testPayload = {
    triggerEvent: "BOOKING_CREATED",
    payload: {
      uid: "cal_e2e_real_test_8812",
      startTime: "2026-11-10T15:00:00.000Z",
      attendees: [
        {
          name: "Dr. Evelyn Reed",
          email: "evelyn@bioflowlabs.com",
        },
      ],
      responses: {
        company: "BioFlow Analytics",
        helpdesk_used: "Zendesk",
        tickets_per_month: "5,000",
      },
      description: "Interested in Corrective-RAG for clinical support ticket validation.",
    },
  };

  const rawBody = JSON.stringify(testPayload);
  const signature = crypto.createHmac("sha256", TEST_SECRET).update(rawBody).digest("hex");

  // 1. Signature verification
  const verification = verifyCalSignature({
    rawBody,
    signatureHeader: signature,
    secret: TEST_SECRET,
  });
  assert.equal(verification.valid, true);

  // 2. Parse & process booking created
  const json = JSON.parse(rawBody);
  const triggerEvent = json.triggerEvent;
  const payload = json.payload;
  const uid = payload.uid;
  const idempotencyKey = `${triggerEvent}:${uid}`;

  assert.equal(isCalEventProcessed(idempotencyKey), false);

  const { lead, booking } = await handleBookingCreated(payload);
  assert.equal(lead.email, "evelyn@bioflowlabs.com");
  assert.equal(lead.stage, "booked call");
  assert.equal(booking.cal_booking_id, "cal_e2e_real_test_8812");

  // 3. Dispatch emails
  const { sendBookingOwnerNotificationEmail, sendBookingConfirmationToLeadEmail } = await import("../../src/lib/email/resend.ts");
  await sendBookingOwnerNotificationEmail({
    leadName: lead.name,
    leadEmail: lead.email,
    company: lead.company,
    helpdeskUsed: lead.helpdesk_used,
    ticketsPerMonth: lead.tickets_per_month,
    startTime: booking.event_time,
    notes: booking.notes,
    calBookingId: booking.cal_booking_id,
  });

  await sendBookingConfirmationToLeadEmail({
    leadName: lead.name,
    leadEmail: lead.email,
    company: lead.company,
    startTime: booking.event_time,
  });

  // 4. Record idempotency
  await recordCalWebhookEvent({
    event_id: idempotencyKey,
    trigger_event: triggerEvent,
    payload: json,
    status: "processed",
    processed_at: new Date().toISOString(),
  });

  // 5. Verify lead in store
  const allLeads = getAllLeads();
  const foundLead = allLeads.find((l) => l.email === "evelyn@bioflowlabs.com");
  assert.ok(foundLead, "Real test lead must be stored");
  assert.equal(foundLead.company, "BioFlow Analytics");
  assert.equal(foundLead.helpdesk_used, "Zendesk");

  // 6. Verify lead in owner console pipeline
  const realClients = getAllRealClients();
  const foundClient = realClients.find((c) => c.supportEmail === "evelyn@bioflowlabs.com");
  assert.ok(foundClient, "Lead must be in owner console pipeline");
  assert.equal(foundClient.state, "Booked call");

  // 7. Verify emails in outbox
  const outbox = getRecentOutboxEmails(10);
  const ownerEmail = outbox.find((e) => e.template === "cal_booking_created_owner" && e.body.includes("BioFlow Analytics"));
  const leadEmail = outbox.find((e) => e.template === "cal_booking_created_lead" && e.to === "evelyn@bioflowlabs.com");

  assert.ok(ownerEmail, "Owner notification email must be sent via Resend");
  assert.ok(leadEmail, "Lead confirmation email must be sent via Resend");

  // 8. Test idempotency: second identical event must be recognized as already processed
  assert.equal(isCalEventProcessed(idempotencyKey), true, "Duplicate webhook must be recognized as processed");
});
