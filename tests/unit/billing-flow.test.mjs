import test from "node:test";
import assert from "node:assert/strict";
import {
  createDepositInvoice,
  createSettlementInvoice,
  markInvoicePaid,
  getInvoiceById,
  getInvoicesForOrg,
  isWebhookProcessed,
  recordWebhookEvent,
  getOrCreateOrgProfile,
  getDiscrepancies,
} from "../../src/lib/payments/invoices-store.ts";

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";

test("1. Deposit Amount & Hand-Calculated Settlement Total (S = 3000, M = 1200)", () => {
  const S = 3000;
  const M = 1200;

  // Hand-calculated verification:
  // Deposit = 0.5 * 3000 = 1500
  // Settlement = (0.5 * 3000) + 1200 = 1500 + 1200 = 2700
  const expectedDeposit = 1500;
  const expectedSettlement = 2700;

  const testOrgId = `org_test_calc_${Date.now()}`;
  const profile = getOrCreateOrgProfile({
    orgId: testOrgId,
    orgName: "Test Hand Calc Corp",
    currency: "USD",
    setupFee: S,
    monthlyRetainer: M,
  });

  assert.equal(profile.setupFee, 3000);
  assert.equal(profile.monthlyRetainer, 1200);
  assert.equal(profile.depositAmount, expectedDeposit);
  assert.equal(profile.settlementAmount, expectedSettlement);

  // Invoice 1: 50% onboarding deposit
  const inv1 = createDepositInvoice({
    orgId: testOrgId,
    orgName: "Test Hand Calc Corp",
    clientEmail: "finance@handcalc.com",
    currency: "USD",
    setupFee: S,
    monthlyRetainer: M,
  });

  assert.equal(inv1.invoice_type, "deposit");
  assert.equal(inv1.description, "50% onboarding deposit");
  assert.equal(inv1.amount_cents, 150000); // $1,500 in cents
  assert.equal(inv1.lines.length, 1);
  assert.equal(inv1.lines[0].description, "50% onboarding deposit");
  assert.equal(inv1.lines[0].amount_cents, 150000);

  // Invoice 2: 48h settlement
  const inv2 = createSettlementInvoice({
    orgId: testOrgId,
  });

  assert.equal(inv2.invoice_type, "settlement");
  assert.equal(inv2.lines.length, 2);
  assert.equal(inv2.lines[0].description, "Remaining 50% setup balance");
  assert.equal(inv2.lines[0].amount_cents, 150000); // 0.5 * 3000 = 1500 (150,000 cents)
  assert.equal(inv2.lines[1].description, "Month 1 managed retainer");
  assert.equal(inv2.lines[1].amount_cents, 120000); // 1200 (120,000 cents)
  assert.equal(inv2.amount_cents, 270000); // 150,000 + 120,000 = 270,000 cents ($2,700)
});

test("2. Wrong amount rejected by server & logged as discrepancy", async () => {
  const orgId = `org_test_tamper_${Date.now()}`;
  const inv = createDepositInvoice({
    orgId,
    orgName: "Tamper Test Corp",
    clientEmail: "attacker@tamper.com",
    currency: "USD",
    setupFee: 3000,
    monthlyRetainer: 1200,
  });

  // Expected: 150000 cents. Attacker attempts to pay 100 cents ($1.00)
  const result = await markInvoicePaid(inv.id, {
    razorpay_order_id: "order_tamper_01",
    razorpay_payment_id: "pay_tamper_01",
    amount_cents: 100, // Tampered amount
    currency: "USD",
  });

  assert.equal(result.success, false);
  assert.match(result.error, /does not match invoice/);

  // Invoice must remain unpaid
  const checkInv = getInvoiceById(inv.id);
  assert.equal(checkInv.status, "issued");

  // Check discrepancy log
  const discrepancies = getDiscrepancies();
  const disc = discrepancies.find((d) => d.invoice_id === inv.id);
  assert.ok(disc);
  assert.equal(disc.type, "amount_mismatch");
});

test("3. Currency mismatch rejected by server", async () => {
  const orgId = `org_test_curr_${Date.now()}`;
  const inv = createDepositInvoice({
    orgId,
    orgName: "Currency Test Corp",
    clientEmail: "billing@currency.com",
    currency: "USD",
    setupFee: 3000,
    monthlyRetainer: 1200,
  });

  // Invoice expects USD, attacker sends INR
  const result = await markInvoicePaid(inv.id, {
    razorpay_order_id: "order_curr_01",
    razorpay_payment_id: "pay_curr_01",
    amount_cents: 150000,
    currency: "INR", // Wrong currency
  });

  assert.equal(result.success, false);
  assert.match(result.error, /currency.*does not match/i);
});

test("4. Duplicate webhook event ignored idempotently", async () => {
  const eventId = `evt_idem_test_${Date.now()}`;

  // 1. Initial delivery
  const res1 = await fetch(`${BASE_URL}/api/webhooks/razorpay`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Razorpay-Signature": "placeholder_valid_signature",
    },
    body: JSON.stringify({
      event: "payment.captured",
      event_id: eventId,
      payload: {},
    }),
  });
  assert.equal(res1.status, 200);

  // 2. Replayed duplicate delivery with exact same event_id
  const res2 = await fetch(`${BASE_URL}/api/webhooks/razorpay`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Razorpay-Signature": "placeholder_valid_signature",
    },
    body: JSON.stringify({
      event: "payment.captured",
      event_id: eventId,
      payload: {},
    }),
  });

  assert.equal(res2.status, 200);
  const data2 = await res2.json();
  assert.equal(data2.status, "ignored");
});

test("5. Invoice 2 paid with Invoice 1's amount is rejected (Cross-Invoice Tamper Defense)", async () => {
  const orgId = `org_test_cross_${Date.now()}`;
  const inv1 = createDepositInvoice({
    orgId,
    orgName: "Cross Tamper Corp",
    clientEmail: "hacker@cross.com",
    currency: "USD",
    setupFee: 3000,
    monthlyRetainer: 1200,
  });

  const inv2 = createSettlementInvoice({ orgId });

  // Invoice 1 amount: 150,000 cents
  // Invoice 2 expected amount: 270,000 cents
  assert.equal(inv1.amount_cents, 150000);
  assert.equal(inv2.amount_cents, 270000);

  // Attacker attempts to pay Invoice 2 using Invoice 1's smaller deposit amount
  const tamperResult = await markInvoicePaid(inv2.id, {
    razorpay_order_id: "order_cross_tamper",
    razorpay_payment_id: "pay_cross_tamper",
    amount_cents: inv1.amount_cents, // Attempting to settle Invoice 2 with Invoice 1's price
    currency: "USD",
  });

  assert.equal(tamperResult.success, false);
  assert.match(tamperResult.error, /does not match invoice/);

  // Invoice 2 must remain unpaid in issued status
  const checkInv2 = getInvoiceById(inv2.id);
  assert.equal(checkInv2.status, "issued");
});

test("6. Multi-Tenant Row Level Security: Client unable to see another organization's invoices", async () => {
  // Simulate a request from Org A client trying to read Org B invoices
  const res = await fetch(`${BASE_URL}/api/billing/invoices?org_id=00000000-0000-0000-0000-000000000001`, {
    headers: {
      cookie: "aegis_session_token=mock_client_token; aegis_user_role=agent; aegis_org_id=org_different_corp",
    },
  });

  // Row Level Security blocks cross-tenant query with 403 Forbidden
  assert.equal(res.status, 403);
  const data = await res.json();
  assert.match(data.error, /Row Level Security/);
});

test("7. Invoice 2 Payment Transitions Org to live_ready (Not Automatically Live)", async () => {
  const orgId = `org_test_live_ready_${Date.now()}`;
  createDepositInvoice({
    orgId,
    orgName: "Live Ready Corp",
    clientEmail: "admin@liveready.com",
    currency: "USD",
    setupFee: 3000,
    monthlyRetainer: 1200,
  });

  const inv2 = createSettlementInvoice({ orgId });

  // Webhook confirms exact Invoice 2 payment
  const res = await markInvoicePaid(inv2.id, {
    razorpay_order_id: "order_settle_valid",
    razorpay_payment_id: "pay_settle_valid",
    amount_cents: inv2.amount_cents,
    currency: inv2.currency,
  });

  assert.equal(res.success, true);
  assert.equal(res.invoice.status, "paid");

  const profile = getOrCreateOrgProfile({ orgId });
  assert.equal(profile.state, "live_ready");
  assert.equal(profile.isLiveReady, true);
  assert.equal(profile.liveModeActive, false); // Crucial: Payment NEVER switches live mode on automatically!
});
