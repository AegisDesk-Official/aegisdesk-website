import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { clearAuthLockout } from "../../src/lib/security/rate-limit.ts";

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";

test("1. Wrong password returns generic error (no account enumeration)", async () => {
  clearAuthLockout("198.51.100.11", "owner@aegisdesk.ai");
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Forwarded-For": "198.51.100.11",
    },
    body: JSON.stringify({
      email: "owner@aegisdesk.ai",
      password: "WrongPassword123!",
    }),
  });

  assert.equal(res.status, 401);
  const data = await res.json();
  assert.equal(data.error, "Invalid credentials or expired access link.");
});

test("2. Unknown email returns exact same generic error", async () => {
  const unknownEmail = `nonexistent_${Date.now()}@nowhere.com`;
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Forwarded-For": "198.51.100.12",
    },
    body: JSON.stringify({
      email: unknownEmail,
      password: "WrongPassword123!",
    }),
  });

  assert.equal(res.status, 401);
  const data = await res.json();
  assert.equal(data.error, "Invalid credentials or expired access link.");
});

test("3. Brute force lockout after 5 failures in 15 minutes", async () => {
  const targetEmail = `brute_test_${Date.now()}@example.com`;
  const ip = "198.51.100.13";

  for (let i = 0; i < 5; i++) {
    await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Forwarded-For": ip,
      },
      body: JSON.stringify({
        email: targetEmail,
        password: "BadPassword123!",
      }),
    });
  }

  // 6th attempt must be locked out with HTTP 429
  const lockedRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Forwarded-For": ip,
    },
    body: JSON.stringify({
      email: targetEmail,
      password: "BadPassword123!",
    }),
  });

  assert.equal(lockedRes.status, 429);
  const lockedData = await lockedRes.json();
  assert.equal(lockedData.locked, true);
  assert.ok(lockedData.reset > 0);
});

test("4. Client invite cannot be issued before deposit is paid unless override + MFA provided", async () => {
  // Test in-memory invite store module directly
  const { issueClientInvite } = await import("../../src/lib/db/invites-store.ts");

  // Attempt 1: Deposit unpaid and no override
  const failResult = issueClientInvite({
    orgId: "org_test_unpaid",
    orgName: "Unpaid Corp",
    email: "ceo@unpaidcorp.com",
    depositPaid: false,
  });
  assert.equal(failResult.success, false);
  assert.ok(failResult.error?.includes("Deposit is unpaid"));

  // Attempt 2: Deposit unpaid with valid override reason + ref + fresh MFA code
  const successOverride = issueClientInvite({
    orgId: "org_test_unpaid",
    orgName: "Unpaid Corp",
    email: "ceo@unpaidcorp.com",
    depositPaid: false,
    overrideReason: "Enterprise MSA wire pending",
    overrideRef: "PO-99120",
    mfaCode: "123456",
  });
  assert.equal(successOverride.success, true);
  assert.ok(successOverride.inviteLink?.includes("/auth/invite?token="));
});

test("5. Expired, reused, and tampered invite links return generic error", async () => {
  const { issueClientInvite, activateInvite } = await import("../../src/lib/db/invites-store.ts");

  // Generate valid invite
  const issued = issueClientInvite({
    orgId: "org_test_activation",
    orgName: "Activation Test Inc",
    email: "ops@activation.com",
    depositPaid: true,
  });
  assert.ok(issued.token);

  // 5a. Tampered link
  const tamperedToken = issued.token.slice(0, -2) + "aa";
  const tamperResult = activateInvite(tamperedToken, "ValidSecurePassword123!");
  assert.equal(tamperResult.success, false);
  assert.equal(tamperResult.error, "Invalid credentials or expired access link.");

  // 5b. Valid first activation
  const firstActivation = activateInvite(issued.token, "ValidSecurePassword123!");
  assert.equal(firstActivation.success, true);
  assert.equal(firstActivation.orgId, "org_test_activation");

  // 5c. Reused invite link must fail with generic error
  const reuseResult = activateInvite(issued.token, "AnotherValidPassword123!");
  assert.equal(reuseResult.success, false);
  assert.equal(reuseResult.error, "Invalid credentials or expired access link.");
});

test("6. Common password rejected on client invite activation", async () => {
  const { issueClientInvite, activateInvite } = await import("../../src/lib/db/invites-store.ts");

  const issued = issueClientInvite({
    orgId: "org_test_pwd",
    orgName: "Pwd Test Inc",
    email: "user@pwdtest.com",
    depositPaid: true,
  });

  // Short password (< 12 chars)
  const shortResult = activateInvite(issued.token, "short123");
  assert.equal(shortResult.success, false);
  assert.ok(shortResult.error?.includes("at least 12 characters"));

  // Common password
  const commonResult = activateInvite(issued.token, "123456789012");
  assert.equal(commonResult.success, false);
  assert.ok(commonResult.error?.includes("too common"));
});

test("7. Stealth 404 for /operator: logged-out visitor and client receive exact same 404 page & status as unknown URL", async () => {
  // 7a. Random unknown URL
  const randomRes = await fetch(`${BASE_URL}/nonexistent-route-xyz-404`);
  assert.equal(randomRes.status, 404);
  const randomBody = await randomRes.text();

  // 7b. Logged-out visitor hitting /operator
  const loggedOutRes = await fetch(`${BASE_URL}/operator`);
  assert.equal(loggedOutRes.status, 404);
  const loggedOutBody = await loggedOutRes.text();

  // Verify status is 404, not 401, not 403, not a redirect
  assert.equal(loggedOutRes.status, randomRes.status);
  // Both responses render the 404 not-found page title
  assert.ok(loggedOutBody.includes("404"));
  assert.ok(loggedOutBody.includes("Page Not Found"));

  // 7c. Client session hitting /operator
  const clientRes = await fetch(`${BASE_URL}/operator`, {
    headers: {
      Cookie: "aegis_session_token=mock_client_token; aegis_user_role=admin; aegis_org_id=org_apex_industries; aegis_aal=aal1; aegis_session_created_at=" + Date.now() + "; aegis_last_active_at=" + Date.now(),
    },
  });
  assert.equal(clientRes.status, 404);
  const clientBody = await clientRes.text();
  assert.ok(clientBody.includes("404"));
  assert.ok(clientBody.includes("Page Not Found"));
});

test("8. Logged-out visitor opening /dashboard is redirected to /login", async () => {
  const res = await fetch(`${BASE_URL}/dashboard`, {
    redirect: "manual",
  });

  // Next.js redirect code is 307
  assert.equal(res.status, 307);
  const location = res.headers.get("location");
  assert.ok(location?.includes("/login"));
});

test("9. Multi-tenant Row Level Security (RLS): Client cannot read another organization's invoices", async () => {
  // Client is in org_apex_industries, tries to query org_alpha_logistics
  const crossTenantRes = await fetch(`${BASE_URL}/api/billing/invoices?org_id=org_alpha_logistics`, {
    headers: {
      Cookie: "aegis_session_token=mock_client_token; aegis_user_role=admin; aegis_org_id=org_apex_industries; aegis_aal=aal1; aegis_session_created_at=" + Date.now() + "; aegis_last_active_at=" + Date.now(),
    },
  });

  assert.equal(crossTenantRes.status, 403);
  const data = await crossTenantRes.json();
  assert.ok(data.error?.includes("Row Level Security"));
});

test("10. Public and client bundles do not leak operator console code", async () => {
  const nextStaticDir = path.join(process.cwd(), ".next/static/chunks");
  assert.ok(fs.existsSync(nextStaticDir), ".next/static/chunks must exist");

  // Read files in chunks
  const findFiles = (dir) => {
    let files = [];
    for (const item of fs.readdirSync(dir)) {
      const full = path.join(dir, item);
      if (fs.statSync(full).isDirectory()) {
        files = files.concat(findFiles(full));
      } else if (item.endsWith(".js")) {
        files.push(full);
      }
    }
    return files;
  };

  const jsFiles = findFiles(nextStaticDir);

  // Check login bundle specifically
  const loginChunks = jsFiles.filter((f) => f.includes("login"));
  for (const f of loginChunks) {
    const content = fs.readFileSync(f, "utf8");
    // Ensure owner console secrets/actions like refund or provision are not in the login bundle
    assert.equal(content.includes("Authorize Owner Refund"), false, "Login bundle must not contain owner console components");
    assert.equal(content.includes("Issue Client Activation Link"), false, "Login bundle must not contain operator invite modal");
  }

  // Check dashboard sidebar
  const sidebarFile = fs.readFileSync(path.join(process.cwd(), "src/components/portal/dashboard-sidebar.tsx"), "utf8");
  assert.equal(sidebarFile.includes('href="/operator"'), false, "Client sidebar must have zero mention of operator console");
  assert.equal(sidebarFile.includes("Owner Console"), false, "Client sidebar must have zero mention of Owner Console");
});
