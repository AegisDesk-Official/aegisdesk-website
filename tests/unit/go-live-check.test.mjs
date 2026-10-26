import { describe, it } from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { validateGoLiveConfig } from "../../scripts/check-go-live.mjs";
import { siteConfig } from "../../src/config/site.config.ts";

describe("Pre-Launch Go-Live Checker & Legal Pages Verification", () => {
  it("fails go-live check when company details are null in site.config.ts", () => {
    const result = validateGoLiveConfig(siteConfig);
    assert.strictEqual(result.valid, false, "Go-live check must fail while company details are null");
    assert.ok(result.missing.some((m) => m.includes("legalName")), "Must report missing legalName");
    assert.ok(result.missing.some((m) => m.includes("registeredAddress")), "Must report missing registeredAddress");
    assert.ok(result.missing.some((m) => m.includes("phone")), "Must report missing phone");
  });

  it("passes go-live check only when all three company fields are populated", () => {
    const mockPopulatedConfig = {
      ...siteConfig,
      legalName: "AegisDesk Technologies Private Limited",
      registeredAddress: "Prestige Tech Park, Bengaluru, Karnataka 560103, India",
      phone: "+91 80 4123 4567",
    };

    const result = validateGoLiveConfig(mockPopulatedConfig);
    assert.strictEqual(result.valid, true, "Go-live check must pass when all fields are populated");
    assert.strictEqual(result.missing.length, 0, "No fields should be reported missing");
  });

  it("fails when any single field is empty string or whitespace", () => {
    const missingPhone = {
      ...siteConfig,
      legalName: "AegisDesk Technologies Pvt Ltd",
      registeredAddress: "Bengaluru, India",
      phone: "   ",
    };

    const result = validateGoLiveConfig(missingPhone);
    assert.strictEqual(result.valid, false);
    assert.strictEqual(result.missing.length, 1);
    assert.ok(result.missing[0].includes("phone"));
  });

  it("verifies docs/OPEN_ITEMS.md exists and documents all missing fields and [CONFIRM] clauses", () => {
    const openItemsPath = path.resolve(process.cwd(), "docs/OPEN_ITEMS.md");
    assert.ok(fs.existsSync(openItemsPath), "docs/OPEN_ITEMS.md must exist");

    const content = fs.readFileSync(openItemsPath, "utf-8");
    assert.ok(content.includes("siteConfig.legalName"), "Must document legalName");
    assert.ok(content.includes("siteConfig.registeredAddress"), "Must document registeredAddress");
    assert.ok(content.includes("siteConfig.phone"), "Must document phone");
    assert.ok(content.includes("[CONFIRM]"), "Must register [CONFIRM] clauses");
  });

  it("verifies Privacy Policy includes explicit Razorpay payment data handling statement", () => {
    const privacyPath = path.resolve(process.cwd(), "src/app/privacy/page.tsx");
    const privacyContent = fs.readFileSync(privacyPath, "utf-8");

    assert.ok(
      privacyContent.includes("Payment details are handled by Razorpay and not stored by us"),
      "Privacy policy must contain exact required Razorpay clause"
    );
    assert.ok(
      privacyContent.includes("PCI-DSS Level 1"),
      "Privacy policy must cite PCI-DSS Level 1 compliance"
    );
  });

  it("verifies Terms of Service covers 14-day Shadow Validation, milestones, and client IP ownership", () => {
    const termsPath = path.resolve(process.cwd(), "src/app/terms/page.tsx");
    const termsContent = fs.readFileSync(termsPath, "utf-8");

    assert.ok(termsContent.includes("14-Day Shadow Validation"), "Must cover 14-day Shadow Validation");
    assert.ok(termsContent.includes("Kickoff Deposit"), "Must cover milestone kickoff deposit");
    assert.ok(termsContent.includes("Client Ownership"), "Must cover client IP ownership");
    assert.ok(termsContent.includes("Zero Model Training Guarantee"), "Must cover zero model training");
  });

  it("verifies Shipping and Delivery policy states digital delivery with zero physical shipping", () => {
    const shippingPath = path.resolve(process.cwd(), "src/app/shipping-delivery/page.tsx");
    const shippingContent = fs.readFileSync(shippingPath, "utf-8");

    assert.ok(shippingContent.includes("Purely Digital Service Declaration"), "Must declare purely digital service");
    assert.ok(shippingContent.includes("We do not manufacture, package, ship, or deliver any physical goods"), "Must state zero physical goods");
  });
});
