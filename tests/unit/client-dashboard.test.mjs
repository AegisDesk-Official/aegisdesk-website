import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

test("Client Dashboard: Unified projected savings formula across overview and analytics", async () => {
  const { calculateProjectedSavings } = await import("../../src/lib/metrics/index.ts");
  
  const res1 = calculateProjectedSavings({
    approvedAsIsCount: 1090,
    avgHandleMinutes: 11.8,
    agentHourlyCost: 30.0,
  });

  assert.equal(res1.hoursSaved, 214.4);
  assert.equal(res1.monthlySavingsUsd, 6432);
  assert.match(res1.formula, /1,090 approved drafts/);
  assert.match(res1.formula, /\$6,432\/mo/);

  // Custom client economics
  const res2 = calculateProjectedSavings({
    approvedAsIsCount: 500,
    avgHandleMinutes: 6.0,
    agentHourlyCost: 25.0,
  });
  assert.equal(res2.hoursSaved, 50.0);
  assert.equal(res2.monthlySavingsUsd, 1250);
});

test("Client Dashboard: Inspect client code for 'operator' and 'owner' references", () => {
  const clientDir = path.resolve("src/app/dashboard");
  const portalDir = path.resolve("src/components/portal");

  function scanDir(dir) {
    const files = fs.readdirSync(dir, { recursive: true });
    for (const f of files) {
      const full = path.join(dir, f);
      if (fs.statSync(full).isFile() && (full.endsWith(".tsx") || full.endsWith(".ts"))) {
        const content = fs.readFileSync(full, "utf8");
        // Verify no links or references to operator console
        assert.doesNotMatch(
          content,
          /\/operator/,
          `File ${f} must not link to or reference /operator`
        );
        assert.doesNotMatch(
          content,
          /Owner Console/i,
          `File ${f} must not contain 'Owner Console'`
        );
      }
    }
  }

  scanDir(clientDir);
  scanDir(portalDir);
});

test("Client Dashboard: Metric labels conform to plain wording and no truncation", async () => {
  const { CLIENT_OVERVIEW_DATA } = await import("../../src/lib/db/seed-data.ts");
  
  const labels = CLIENT_OVERVIEW_DATA.headlineTiles.map((t) => t.label);
  assert.ok(labels.includes("Verified Answer Rate"), "Must include 'Verified Answer Rate'");
  assert.ok(labels.includes("Escalated to Team"), "Must include 'Escalated to Team'");
  assert.ok(labels.includes("Shadow Approval Rate"), "Must include 'Shadow Approval Rate'");
  assert.ok(labels.includes("Projected Deflection"), "Must include 'Projected Deflection'");

  for (const label of labels) {
    assert.doesNotMatch(label, /\.\.\.$/, `Label '${label}' must not end with '...'`);
  }
});

test("Client Dashboard: Check 1 plain language replacement", async () => {
  const { CLIENT_PERFORMANCE_DATA } = await import("../../src/lib/db/seed-data.ts");
  const check1 = CLIENT_PERFORMANCE_DATA.blockedDraftsBreakdown.find((b) => b.check.includes("Check 1"));
  assert.ok(check1, "Check 1 must exist");
  assert.equal(check1.reason, "No matching policy clause above the 92% confidence bar");
});
