import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { quote, pricingConfig } from "../../src/lib/pricing.ts";

describe("Pricing and ROI Quotation Engine (Single Source of Truth)", () => {
  test("Configuration has expected initial baseline values", () => {
    assert.equal(pricingConfig.baseSetup, 2500);
    assert.equal(pricingConfig.baseRetainer, 1000);
    assert.equal(pricingConfig.includedTickets, 1500);
    assert.equal(pricingConfig.tierSize, 1000);
    assert.equal(pricingConfig.setupPerTier, 250);
    assert.equal(pricingConfig.retainerPerTier, 150);
  });

  test("Hand-checked Case 1: 1,500 tickets, $6.00, 50%", () => {
    const res = quote({ tickets: 1500, costPerTicket: 6.0, automationPct: 50 });
    assert.equal(res.setupFee, 2500);
    assert.equal(res.monthlyRetainer, 1000);
    assert.equal(res.currentMonthlyCost, 9000);
    assert.equal(res.grossMonthlySavings, 4500);
    assert.equal(res.netMonthlyRoi, 3500);
    assert.equal(res.annualSavings, 42000);
    assert.ok(res.paybackMonths !== null);
    assert.equal(res.paybackMonths.toFixed(2), "0.71");
  });

  test("Hand-checked Case 2: 5,000 tickets, $8.00, 60%", () => {
    const res = quote({ tickets: 5000, costPerTicket: 8.0, automationPct: 60 });
    assert.equal(res.setupFee, 3500);
    assert.equal(res.monthlyRetainer, 1600);
    assert.equal(res.currentMonthlyCost, 40000);
    assert.equal(res.grossMonthlySavings, 24000);
    assert.equal(res.netMonthlyRoi, 22400);
    assert.equal(res.annualSavings, 268800);
    assert.ok(res.paybackMonths !== null);
    assert.equal(res.paybackMonths < 1, true);
  });

  test("Hand-checked Case 3: 500 tickets, $4.00, 30%", () => {
    const res = quote({ tickets: 500, costPerTicket: 4.0, automationPct: 30 });
    assert.equal(res.setupFee, 2500);
    assert.equal(res.monthlyRetainer, 1000);
    assert.equal(res.currentMonthlyCost, 2000);
    assert.equal(res.grossMonthlySavings, 600);
    assert.equal(res.netMonthlyRoi, -400);
    assert.equal(res.paybackMonths, null);
  });

  test("Step boundaries calculation", () => {
    // 1500 tickets -> base tier (0 steps)
    const b1500 = quote({ tickets: 1500, costPerTicket: 6.0, automationPct: 50 });
    assert.equal(b1500.setupFee, 2500);
    assert.equal(b1500.monthlyRetainer, 1000);

    // 1501 tickets -> 1 step
    const b1501 = quote({ tickets: 1501, costPerTicket: 6.0, automationPct: 50 });
    assert.equal(b1501.setupFee, 2750);
    assert.equal(b1501.monthlyRetainer, 1150);

    // 2500 tickets -> 1 step
    const b2500 = quote({ tickets: 2500, costPerTicket: 6.0, automationPct: 50 });
    assert.equal(b2500.setupFee, 2750);
    assert.equal(b2500.monthlyRetainer, 1150);

    // 2501 tickets -> 2 steps
    const b2501 = quote({ tickets: 2501, costPerTicket: 6.0, automationPct: 50 });
    assert.equal(b2501.setupFee, 3000);
    assert.equal(b2501.monthlyRetainer, 1300);

    // 25000 tickets -> 24 steps
    const b25000 = quote({ tickets: 25000, costPerTicket: 6.0, automationPct: 50 });
    assert.equal(b25000.setupFee, 8500);
    assert.equal(b25000.monthlyRetainer, 4600);
  });

  test("Moving each slider changes the resulting calculation", () => {
    const base = quote({ tickets: 1500, costPerTicket: 6.0, automationPct: 50 });

    // Slider 1: Ticket volume moves
    const higherTickets = quote({ tickets: 3000, costPerTicket: 6.0, automationPct: 50 });
    assert.notEqual(higherTickets.annualSavings, base.annualSavings);

    // Slider 2: Cost per ticket moves
    const higherCost = quote({ tickets: 1500, costPerTicket: 10.0, automationPct: 50 });
    assert.notEqual(higherCost.annualSavings, base.annualSavings);

    // Slider 3: Automation percentage moves
    const higherAuto = quote({ tickets: 1500, costPerTicket: 6.0, automationPct: 70 });
    assert.notEqual(higherAuto.annualSavings, base.annualSavings);
  });
});
