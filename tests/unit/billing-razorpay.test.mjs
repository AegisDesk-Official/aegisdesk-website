import { test } from "node:test";
import assert from "node:assert/strict";
import crypto from "crypto";
import {
  verifyCheckoutSignature,
  verifyWebhookSignature,
} from "../../src/lib/payments/razorpay.ts";
import {
  markInvoicePaid,
  isWebhookProcessed,
  recordWebhookEvent,
  getInvoiceById,
  getDiscrepancies,
} from "../../src/lib/payments/invoices-store.ts";

const TEST_SECRET = "test_rzp_secret_key_884920";
const TEST_WEBHOOK_SECRET = "test_webhook_hmac_secret_9910";

test("1. Valid checkout signature verification succeeds", () => {
  const orderId = "order_test_99182";
  const paymentId = "pay_test_88192";
  const data = `${orderId}|${paymentId}`;
  const validSignature = crypto.createHmac("sha256", TEST_SECRET).update(data).digest("hex");

  const result = verifyCheckoutSignature({
    orderId,
    paymentId,
    signature: validSignature,
    keySecret: TEST_SECRET,
  });

  assert.equal(result, true, "Valid checkout signature should verify successfully");
});

test("2. Bad/tampered checkout signature is rejected", () => {
  const orderId = "order_test_99182";
  const paymentId = "pay_test_88192";
  const tamperedSignature = "bad_hex_deadbeef_0000000000000000000000000000000000000000000000000000";

  const result = verifyCheckoutSignature({
    orderId,
    paymentId,
    signature: tamperedSignature,
    keySecret: TEST_SECRET,
  });

  assert.equal(result, false, "Tampered signature must be rejected");
});

test("3. Valid webhook HMAC signature verification succeeds", () => {
  const rawBody = JSON.stringify({
    event: "payment_link.paid",
    payload: {
      payment: {
        entity: { id: "pay_xyz", amount: 175000, currency: "USD" },
      },
    },
  });

  const validSignature = crypto.createHmac("sha256", TEST_WEBHOOK_SECRET).update(rawBody).digest("hex");

  const result = verifyWebhookSignature({
    rawBody,
    signature: validSignature,
    webhookSecret: TEST_WEBHOOK_SECRET,
  });

  assert.equal(result, true, "Valid webhook signature should verify successfully");
});

test("4. Tampered webhook signature is rejected (constant-time evaluation)", () => {
  const rawBody = JSON.stringify({ event: "payment.captured", amount: 100 });
  const badSignature = "0000000000000000000000000000000000000000000000000000000000000000";

  const result = verifyWebhookSignature({
    rawBody,
    signature: badSignature,
    webhookSecret: TEST_WEBHOOK_SECRET,
  });

  assert.equal(result, false, "Tampered webhook signature must return false");
});

test("5. Replayed webhook event idempotency (same event replayed)", async () => {
  const eventId = `evt_replay_test_${Date.now()}`;

  assert.equal(isWebhookProcessed(eventId), false, "Event should not be processed yet");

  // First ingestion
  await recordWebhookEvent({
    provider: "razorpay",
    event_id: eventId,
    event_type: "payment_link.paid",
    payload: { id: eventId },
    status: "processed",
  });

  assert.equal(isWebhookProcessed(eventId), true, "Event should be marked processed");

  // Replay check
  const isDuplicate = isWebhookProcessed(eventId);
  assert.equal(isDuplicate, true, "Replayed event must be flagged as duplicate for immediate 200 acknowledge");
});

test("6. Amount mismatch between Razorpay payment and invoice is blocked", async () => {
  // Test invoice 2 expects $1,750.00 (175,000 cents)
  const invoice = getInvoiceById("inv_setup_bal_02");
  assert.ok(invoice, "Invoice 2 must exist");
  assert.equal(invoice.amount_cents, 175000);

  // Attacker attempts to pay $1.00 (100 cents)
  const result = await markInvoicePaid(invoice.id, {
    razorpay_order_id: "order_tamper_100",
    razorpay_payment_id: "pay_tamper_100",
    amount_cents: 100, // Attacker manipulated amount!
    currency: "USD",
  });

  assert.equal(result.success, false, "Amount mismatch must fail");
  assert.equal(result.error, "Payment amount does not match invoice");

  // Invoice must remain unpaid
  const checked = getInvoiceById("inv_setup_bal_02");
  assert.notEqual(checked.status, "paid", "Invoice status must not be changed to paid on amount mismatch");

  // Discrepancy logged for operator console
  const disc = getDiscrepancies().find((d) => d.razorpay_payment_id === "pay_tamper_100");
  assert.ok(disc, "Discrepancy must be logged for owner console");
  assert.equal(disc.type, "amount_mismatch");
});

test("7. Currency mismatch is blocked", async () => {
  const invoice = getInvoiceById("inv_setup_bal_02");
  assert.ok(invoice);

  // Client attempts to pay in INR for a USD invoice
  const result = await markInvoicePaid(invoice.id, {
    razorpay_order_id: "order_curr_mismatch",
    razorpay_payment_id: "pay_curr_mismatch",
    amount_cents: 175000,
    currency: "INR", // Wrong currency!
  });

  assert.equal(result.success, false, "Currency mismatch must fail");
  assert.equal(result.error, "Payment currency does not match invoice");
});

test("8. Out-of-order duplicate capture event handled safely", async () => {
  // Mark invoice 1 is already paid
  const invoice = getInvoiceById("inv_setup_dep_01");
  assert.ok(invoice);
  assert.equal(invoice.status, "paid");

  // An out-of-order duplicate webhook arrives for an already-paid invoice
  const result = await markInvoicePaid(invoice.id, {
    razorpay_order_id: invoice.razorpay_order_id,
    razorpay_payment_id: "pay_duplicate_capture_001",
    amount_cents: invoice.amount_cents,
    currency: invoice.currency,
  });

  // State remains cleanly paid without corruption
  assert.equal(result.success, true);
  assert.equal(invoice.status, "paid");
});
