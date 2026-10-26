#!/usr/bin/env node

/**
 * AegisDesk Sales Call Price Table Generator
 * Reads exclusively from src/lib/pricing.ts so sales collateral never disagrees with the live calculator.
 * Usage: npm run price-table
 */

import { quote, pricingConfig } from "../src/lib/pricing.ts";

const TICKET_VOLUMES = [1500, 2500, 5000, 10000, 15000, 25000];

console.log("=========================================================================================");
console.log("AEGISDESK SALES CALL COMMERCIAL PRICE LIST (DERIVED DIRECTLY FROM SRC/LIB/PRICING.TS)");
console.log("=========================================================================================");
console.log(`Base Configuration:`);
console.log(`- Base Setup: $${pricingConfig.baseSetup.toLocaleString()} (includes ${pricingConfig.includedTickets.toLocaleString()} tickets)`);
console.log(`- Base Retainer: $${pricingConfig.baseRetainer.toLocaleString()}/mo`);
console.log(`- Tier Increments: +$${pricingConfig.setupPerTier} setup & +$${pricingConfig.retainerPerTier}/mo per ${pricingConfig.tierSize.toLocaleString()} tickets`);
console.log("-----------------------------------------------------------------------------------------");
console.log(
  [
    "Monthly Tickets".padEnd(18),
    "Tiers (Steps)".padEnd(16),
    "Setup Fee ($)".padEnd(16),
    "Monthly Retainer ($/mo)".padEnd(25),
    "Annual Retainer ($/yr)",
  ].join("")
);
console.log("-----------------------------------------------------------------------------------------");

for (const tickets of TICKET_VOLUMES) {
  const result = quote({ tickets, costPerTicket: 6.0, automationPct: 50 });
  const row = [
    `${tickets.toLocaleString()} tickets`.padEnd(18),
    `${result.tiers} steps`.padEnd(16),
    `$${result.setupFee.toLocaleString()}`.padEnd(16),
    `$${result.monthlyRetainer.toLocaleString()} / mo`.padEnd(25),
    `$${(result.monthlyRetainer * 12).toLocaleString()} / yr`,
  ].join("");
  console.log(row);
}

console.log("=========================================================================================");
console.log("Note: This printed table matches the live website ROI calculator exactly at all volumes.\n");
