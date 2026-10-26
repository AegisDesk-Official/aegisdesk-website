#!/usr/bin/env node

/**
 * AegisDesk Pre-Launch Go-Live Checker
 * 
 * Verifies that all mandatory corporate entity details are configured in
 * src/config/site.config.ts before Razorpay live merchant activation.
 * 
 * Fails (exit 1) if legalName, registeredAddress, or phone are null or empty.
 */

import { siteConfig } from "../src/config/site.config.ts";

export function validateGoLiveConfig(config = siteConfig) {
  const missing = [];

  if (!config.legalName || typeof config.legalName !== "string" || config.legalName.trim() === "") {
    missing.push("legalName (Legal company entity name)");
  }
  if (!config.registeredAddress || typeof config.registeredAddress !== "string" || config.registeredAddress.trim() === "") {
    missing.push("registeredAddress (Official registered corporate office)");
  }
  if (!config.phone || typeof config.phone !== "string" || config.phone.trim() === "") {
    missing.push("phone (Official corporate telephone support number)");
  }

  return {
    valid: missing.length === 0,
    missing,
    fields: {
      legalName: config.legalName ?? null,
      registeredAddress: config.registeredAddress ?? null,
      phone: config.phone ?? null,
    },
  };
}

export function runCheck(config = siteConfig, silent = false) {
  const result = validateGoLiveConfig(config);

  if (!silent) {
    console.log("=========================================================================");
    console.log("AEGISDESK PRE-LAUNCH GO-LIVE CHECK (RAZORPAY MERCHANT ACTIVATION GATE)");
    console.log("=========================================================================");
    console.log(`Brand Name:          ${config.brandName}`);
    console.log(`Legal Name:          ${config.legalName ?? "[MISSING - null]"}`);
    console.log(`Registered Address:  ${config.registeredAddress ?? "[MISSING - null]"}`);
    console.log(`Corporate Telephone: ${config.phone ?? "[MISSING - null]"}`);
    console.log(`Support Email:       ${config.supportEmail}`);
    console.log("-------------------------------------------------------------------------");

    if (!result.valid) {
      console.error("❌ GO-LIVE CHECK FAILED: The following mandatory company details are missing:");
      for (const item of result.missing) {
        console.error(`   - ${item}`);
      }
      console.error("\nPlease populate these fields in src/config/site.config.ts before activating");
      console.error("the live Razorpay merchant account. See docs/OPEN_ITEMS.md for tracking.");
      console.log("=========================================================================\n");
    } else {
      console.log("✅ GO-LIVE CHECK PASSED: All corporate entity fields are populated.");
      console.log("=========================================================================\n");
    }
  }

  return result.valid;
}

// Execute check if run directly via CLI
if (import.meta.url === `file://${process.argv[1]}`) {
  const passed = runCheck();
  process.exit(passed ? 0 : 1);
}
