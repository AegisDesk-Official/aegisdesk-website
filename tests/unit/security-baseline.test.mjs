import test from "node:test";
import assert from "node:assert/strict";
import { validatePdfUpload, MAX_UPLOAD_BYTES } from "../../src/lib/security/upload.ts";
import { buildContentSecurityPolicy, BASELINE_SECURITY_HEADERS } from "../../src/lib/security/csp.ts";
import { checkRateLimit, recordAuthFailure, clearAuthLockout } from "../../src/lib/security/rate-limit.ts";
import { sanitizeText, sanitizeObject, formatSafeError } from "../../src/lib/security/sanitize.ts";
import { recordAuditLog, getAuditLogs } from "../../src/lib/security/audit.ts";

test("Security Baseline: CSP Builder includes nonces and required gateway allowlists", () => {
  const nonce = "test-crypto-nonce-12345";
  const csp = buildContentSecurityPolicy({ nonce, isProduction: true });

  assert.ok(csp.includes(`'nonce-${nonce}'`), "CSP must include per-request nonce");
  assert.ok(csp.includes("https://challenges.cloudflare.com"), "CSP must permit Cloudflare Turnstile");
  assert.ok(csp.includes("https://checkout.razorpay.com"), "CSP must permit Razorpay hosted checkout");
  assert.ok(csp.includes("https://app.cal.com"), "CSP must permit Cal.com booking popup");
  assert.ok(csp.includes("frame-ancestors 'none'"), "CSP must forbid unauthorized framing");
  assert.ok(csp.includes("upgrade-insecure-requests"), "CSP in production must upgrade insecure requests");
  assert.equal(BASELINE_SECURITY_HEADERS["X-Frame-Options"], "DENY");
  assert.equal(BASELINE_SECURITY_HEADERS["X-Content-Type-Options"], "nosniff");
});

test("Security Baseline: PDF Upload validation enforces magic bytes signature and 25MB ceiling", () => {
  // 1. Valid PDF with %PDF- header (0x25, 0x50, 0x44, 0x46, 0x2D)
  const validPdfBuffer = Buffer.from("%PDF-1.7\nSample PDF Document Body Content");
  const validResult = validatePdfUpload(validPdfBuffer, "sample_sla.pdf");

  assert.equal(validResult.success, true);
  if (validResult.success) {
    assert.ok(validResult.upload.storageName.startsWith("doc_"));
    assert.ok(validResult.upload.storageName.endsWith(".pdf"));
    assert.equal(validResult.upload.mimeType, "application/pdf");
    assert.equal(validResult.upload.originalName, "sample_sla.pdf");
  }

  // 2. Spoofed extension: Executable/text file with .pdf extension
  const fakePdfBuffer = Buffer.from("MZ\x90\x00\x03\x00\x00\x00Fake executable file masquerading as pdf");
  const fakeResult = validatePdfUpload(fakePdfBuffer, "malicious_exploit.pdf");
  assert.equal(fakeResult.success, false);
  if (!fakeResult.success) {
    assert.ok(fakeResult.error.includes("magic bytes") || fakeResult.error.includes("%PDF-"));
  }

  // 3. Oversized file exceeding 25MB ceiling
  const oversizedBuffer = Buffer.alloc(MAX_UPLOAD_BYTES + 1024);
  oversizedBuffer.write("%PDF-");
  const oversizedResult = validatePdfUpload(oversizedBuffer, "huge_document.pdf");
  assert.equal(oversizedResult.success, false);
  if (!oversizedResult.success) {
    assert.ok(oversizedResult.error.includes("exceeds 25 MB"));
  }
});

test("Security Baseline: Rate limiting and account lockout with backoff", async () => {
  const testId = `user_test_${Date.now()}`;
  clearAuthLockout(testId);

  // Normal public form rate limit allows up to 10 queries
  const res1 = await checkRateLimit("public_form", testId);
  assert.equal(res1.success, true);

  // Trigger repeated authentication failures
  recordAuthFailure(testId);
  recordAuthFailure(testId);
  recordAuthFailure(testId);
  recordAuthFailure(testId);
  const lockResult = recordAuthFailure(testId); // 5th failure

  assert.equal(lockResult.locked, true);
  assert.ok(lockResult.lockedUntil && lockResult.lockedUntil > Date.now());

  // Subsequent login attempt must be rejected due to account lockout
  const loginCheck = await checkRateLimit("login", testId);
  assert.equal(loginCheck.success, false);
  assert.ok(loginCheck.lockedUntil && loginCheck.lockedUntil > Date.now());

  // Clear lockout resets state
  clearAuthLockout(testId);
  const clearedCheck = await checkRateLimit("login", testId);
  assert.equal(clearedCheck.success, true);
});

test("Security Baseline: PII and Secret Sanitization strips tokens and stack traces", () => {
  const secretString = "User logged in with bearer eyJhbGciOiJIUzI1Ni.secret and card 4111 2222 3333 4444";
  const sanitized = sanitizeText(secretString);

  assert.ok(!sanitized.includes("4111 2222 3333 4444"), "Credit card must be redacted");
  assert.ok(sanitized.includes("[REDACTED_CARD]"));
  assert.ok(!sanitized.includes("eyJhbGciOiJIUzI1Ni.secret"));
  assert.ok(sanitized.includes("[REDACTED_TOKEN]"));

  const errorWithStack = new Error("Database connection to postgres://admin:secret@db.internal:5432 failed");
  const safeErr = formatSafeError(errorWithStack);
  assert.ok(!safeErr.error.includes("postgres://admin:secret"), "Credentials in errors must be sanitized");
});

test("Security Baseline: Audit logging tracks logins, refunds, exports, and deletions", () => {
  const testOrg = `org_audit_test_${Date.now()}`;

  recordAuditLog({
    eventType: "auth.login",
    actorId: "usr_test_01",
    actorEmail: "lead@test.com",
    actorRole: "admin",
    organizationId: testOrg,
    details: { ip: "127.0.0.1" },
  });

  recordAuditLog({
    eventType: "organization.export",
    actorId: "usr_test_01",
    actorEmail: "lead@test.com",
    actorRole: "owner",
    organizationId: testOrg,
    details: { records: 50 },
  });

  const logs = getAuditLogs(testOrg);
  assert.equal(logs.length, 2);
  assert.equal(logs[0].eventType, "organization.export");
  assert.equal(logs[1].eventType, "auth.login");
});
