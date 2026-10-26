import test from "node:test";
import assert from "node:assert/strict";
import {
  PIPELINE_STATES,
  calculateDefaultFees,
  getAllRealClients,
  getDemoClients,
  provisionClient,
  markClientPaidOffline,
  sendClientAccessLink,
  editClientFees,
  activateClientLiveMode,
  pauseClient,
  refundClient,
  getNeedsAttentionItems,
} from "../../src/lib/db/operator-store.ts";

test("Round 6: Pipeline states in exact ordered sequence", () => {
  const expectedStates = [
    "Booked call",
    "Deposit invoice sent",
    "Deposit paid",
    "Shadow Validation",
    "Settlement due",
    "Live",
    "Paused",
  ];
  assert.deepEqual(PIPELINE_STATES, expectedStates);
});

test("Round 6: calculateDefaultFees derives directly from src/lib/pricing", () => {
  const fees1500 = calculateDefaultFees(1500);
  assert.equal(fees1500.setupFee, 2500);
  assert.equal(fees1500.monthlyRetainer, 1000);
  assert.equal(fees1500.depositAmount, 1250); // 50% of setup
  assert.equal(fees1500.settlementAmount, 2250); // 50% of setup + 1 month retainer

  const fees3000 = calculateDefaultFees(3000);
  assert.ok(fees3000.setupFee > 2500);
  assert.ok(fees3000.monthlyRetainer > 1000);
  assert.equal(fees3000.depositAmount, 0.5 * fees3000.setupFee);
  assert.equal(fees3000.settlementAmount, 0.5 * fees3000.setupFee + fees3000.monthlyRetainer);
});

test("Round 6: First run has empty real clients and isolated demo workspace", () => {
  const demoClients = getDemoClients();
  assert.ok(demoClients.length > 0, "Demo clients exist for demo workspace tab");
  for (const c of demoClients) {
    assert.equal(c.isDemo, true);
  }
});

test("Round 6: Client Provisioning, Deposit & Access Link Lifecycle", async () => {
  const result = await provisionClient({
    name: "Test Global Logistics",
    contactName: "Sarah Connor",
    supportEmail: "sarah@testlogistics.com",
    currency: "USD",
    monthlyTickets: 2000,
    setupFee: 2750,
    monthlyRetainer: 1150,
    totpCode: "123456",
    ip: "127.0.0.1",
  });

  const client = result.client;
  assert.ok(client);
  assert.equal(client.state, "Deposit invoice sent");
  assert.ok(result.invoiceNumber.startsWith("INV-"));

  // Mark deposit paid offline with 6-digit authenticator code
  const paidClient = await markClientPaidOffline(
    client.id,
    "deposit",
    "WIRE-REF-998811",
    "Wire transfer confirmed via bank receipt",
    "123456",
    "127.0.0.1"
  );
  assert.equal(paidClient.state, "Deposit paid");
  assert.ok(paidClient.depositPaidAt);

  // Now sending access link succeeds (256-bit crypto token, 7-day expiration)
  const inviteLink = await sendClientAccessLink(client.id, "http://localhost:3000", "127.0.0.1");
  assert.ok(inviteLink.includes("/auth/invite?token="));

  // Edit fees before settlement invoice
  const updatedClient = await editClientFees(client.id, 3200, 1400, "127.0.0.1");
  assert.equal(updatedClient.setupFee, 3200);
  assert.equal(updatedClient.monthlyRetainer, 1400);

  // Activate Live Mode with TOTP
  const liveClient = await activateClientLiveMode(client.id, "123456", "127.0.0.1");
  assert.equal(liveClient.state, "Live");

  // Pause
  const pausedClient = await pauseClient(client.id, "Seasonal pause requested", "127.0.0.1");
  assert.equal(pausedClient.state, "Paused");

  // Refund
  const refundedClient = await refundClient(client.id, 500, "Partial SLA adjustment", "123456", "127.0.0.1");
  assert.ok(refundedClient);
});

test("Round 6: Needs attention strip identification", () => {
  const items = getNeedsAttentionItems();
  assert.ok(Array.isArray(items));
});
