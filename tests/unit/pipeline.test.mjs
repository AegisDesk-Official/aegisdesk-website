import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { HttpAnswerPipeline, signPipelineRequest, verifyPipelineSignature, maskBaseUrl } from "../../src/lib/pipeline/http-adapter.ts";
import {
  newDocumentId,
  createDocumentRecord,
  getDocument,
  buildEngineFileUrl,
  verifyEngineFileUrl,
  updateDocumentStatus,
  __resetDocumentsForTests,
} from "../../src/lib/db/documents-store.ts";
import {
  issueEventSecret,
  getEventSecret,
  getEventSecretMeta,
  __resetEventSecretsForTests,
} from "../../src/lib/pipeline/event-secrets.ts";

// Set required test env
process.env.ENCRYPTION_KEY = "test_encryption_key_32_bytes_long_exact!";
process.env.PIPELINE_SHARED_SECRET = "test_secret_32_bytes_minimum_length_example_key";

test("1. Unconnected Pipeline: Returns NOT_CONNECTED for all methods when PIPELINE_BASE_URL is empty", async () => {
  const pipeline = new HttpAnswerPipeline({
    baseUrl: "",
    sharedSecret: "test_secret_32_bytes_minimum_length_example_key",
  });

  assert.equal(pipeline.configured, false);

  const health = await pipeline.health();
  assert.equal(health.ok, false);
  assert.equal(health.error.code, "NOT_CONNECTED");
  assert.equal(health.error.retryable, false);

  const index = await pipeline.indexDocument("org-1", "doc-1", "https://example.com/file.pdf");
  assert.equal(index.ok, false);
  assert.equal(index.error.code, "NOT_CONNECTED");

  const remove = await pipeline.removeDocument("org-1", "doc-1");
  assert.equal(remove.ok, false);
  assert.equal(remove.error.code, "NOT_CONNECTED");

  const draft = await pipeline.draftReply("org-1", "zen-123", "How do I return items?");
  assert.equal(draft.ok, false);
  assert.equal(draft.error.code, "NOT_CONNECTED");
});

test("2. Cryptographic Signing: Matches exact test vector from docs/PIPELINE_CONTRACT.md", () => {
  const secret = "test_secret_32_bytes_minimum_length_example_key";
  const timestamp = "1730000000";
  const method = "POST";
  const path = "/v1/draft-reply";
  const rawBody = JSON.stringify({
    org_id: "00000000-0000-0000-0000-000000000001",
    ticket_ref: "demo_12345",
    text: "Test inquiry",
  });

  const signature = signPipelineRequest(secret, timestamp, method, path, rawBody);
  const expectedVector = "5e054bfb04b23d1cf2f30e85a7ff8b58aeb295730a5b8d493e24eb6183024b1e";

  assert.equal(signature, expectedVector, "Generated signature must match verified contract test vector");

  const isValid = verifyPipelineSignature(secret, timestamp, method, path, rawBody, signature);
  assert.equal(isValid, true, "Signature verification must succeed");

  const isTampered = verifyPipelineSignature(secret, timestamp, method, path, rawBody + "tamper", signature);
  assert.equal(isTampered, false, "Tampered payload must fail signature verification");

  const isBadTimestamp = verifyPipelineSignature(secret, "1730000001", method, path, rawBody, signature);
  assert.equal(isBadTimestamp, false, "Altered timestamp must fail signature verification");
});

test("3. URL Masking: Masks hostname while preserving protocol and TLD", () => {
  assert.equal(maskBaseUrl("https://engine.internal.aegisdesk.ai"), "https://eng••••••.ai");
  assert.equal(maskBaseUrl("https://ai-service.company.com:8443"), "https://ai-••••••.com:8443");
  assert.equal(maskBaseUrl(""), "");
});

test("4. HttpAnswerPipeline with Mock Transport: Verifies contract responses and simulated tag", async () => {
  const secret = "test_secret_32_bytes_minimum_length_example_key";
  const calls = [];

  const mockFetch = async (url, init) => {
    calls.push({ url, init });
    const path = new URL(url).pathname;

    // Verify request signature
    const sig = init.headers["X-Aegis-Signature"];
    const ts = init.headers["X-Aegis-Timestamp"];
    const rawBody = init.body || "";
    const isSigOk = verifyPipelineSignature(secret, ts, init.method, path, rawBody, sig);
    if (!isSigOk) {
      return new Response(JSON.stringify({ error: { code: "UNAUTHORIZED", message: "Bad sig" } }), { status: 401 });
    }

    if (path === "/v1/health") {
      return new Response(JSON.stringify({ status: "ok", version: "2.4.0", simulated: true }), { status: 200 });
    }
    if (path === "/v1/documents/index") {
      const parsed = JSON.parse(rawBody);
      return new Response(JSON.stringify({ document_id: parsed.document_id, status: "indexed", simulated: true }), {
        status: 200,
      });
    }
    if (path === "/v1/documents/remove") {
      const parsed = JSON.parse(rawBody);
      return new Response(JSON.stringify({ document_id: parsed.document_id, removed: true, simulated: true }), {
        status: 200,
      });
    }
    if (path === "/v1/draft-reply") {
      return new Response(
        JSON.stringify({
          reply: "Returns are accepted within 30 days.",
          citations: [{ document_id: "doc-1", page: 1, quote: "Returns within 30 days" }],
          grounded: true,
          handed_to_human: false,
          cost_usd: 0.0035,
          simulated: true,
        }),
        { status: 200 }
      );
    }
    return new Response(JSON.stringify({ error: { code: "NOT_FOUND" } }), { status: 404 });
  };

  const pipeline = new HttpAnswerPipeline({
    baseUrl: "https://mock-engine.internal.com",
    sharedSecret: secret,
    fetchImpl: mockFetch,
  });

  assert.equal(pipeline.configured, true);

  // Health
  const healthRes = await pipeline.health();
  assert.equal(healthRes.ok, true);
  assert.equal(healthRes.data.status, "ok");
  assert.equal(healthRes.data.version, "2.4.0");
  assert.equal(healthRes.data.simulated, true);
  assert.ok(healthRes.data.latencyMs >= 0);

  // Index Document
  const indexRes = await pipeline.indexDocument("org-alpha", "doc-uuid-99", "https://aegisdesk.ai/file.pdf");
  assert.equal(indexRes.ok, true);
  assert.equal(indexRes.data.documentId, "doc-uuid-99");
  assert.equal(indexRes.data.status, "indexed");
  assert.equal(indexRes.data.simulated, true);

  // Remove Document
  const removeRes = await pipeline.removeDocument("org-alpha", "doc-uuid-99");
  assert.equal(removeRes.ok, true);
  assert.equal(removeRes.data.documentId, "doc-uuid-99");
  assert.equal(removeRes.data.removed, true);
  assert.equal(removeRes.data.simulated, true);

  // Draft Reply
  const draftRes = await pipeline.draftReply("org-alpha", "zen-101", "Can I return opened items?");
  assert.equal(draftRes.ok, true);
  assert.equal(draftRes.data.grounded, true);
  assert.equal(draftRes.data.handedToHuman, false);
  assert.equal(draftRes.data.citations.length, 1);
  assert.equal(draftRes.data.costUsd, 0.0035);
  assert.equal(draftRes.data.simulated, true);

  assert.equal(calls.length, 4);
});

test("5. Document Store: Initial status is 'waiting_for_engine' and download URL is protected", async () => {
  __resetDocumentsForTests();
  const orgId = "org-test-doc";
  const docId = newDocumentId();

  const doc = await createDocumentRecord({
    id: docId,
    orgId,
    filename: "Terms_and_Conditions_2026.pdf",
    sizeBytes: 102400,
    sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    storage: "local",
    storagePath: `.data/private-documents/${orgId}/${docId}.pdf`,
  });

  assert.equal(doc.status, "waiting_for_engine");
  assert.equal(doc.statusDetail, null);

  const fetched = getDocument(orgId, docId);
  assert.ok(fetched);
  assert.equal(fetched.filename, "Terms_and_Conditions_2026.pdf");

  // Build engine download URL
  const fileUrl = await buildEngineFileUrl(doc);
  assert.ok(fileUrl);
  const parsedUrl = new URL(fileUrl);
  const exp = parsedUrl.searchParams.get("exp");
  const sig = parsedUrl.searchParams.get("sig");
  const urlOrg = parsedUrl.searchParams.get("org");

  assert.equal(urlOrg, orgId);
  assert.ok(verifyEngineFileUrl(orgId, docId, exp, sig), "Signed URL must verify cleanly");

  // Tampered sig fails
  assert.equal(verifyEngineFileUrl(orgId, docId, exp, sig + "fail"), false);

  // Update status to indexed
  const updated = await updateDocumentStatus(orgId, docId, "indexed");
  assert.equal(updated.status, "indexed");
  assert.ok(updated.indexedAt);
});

test("6. Event Secrets: Encryption at rest, single reveal, and rotation invalidation", async () => {
  __resetEventSecretsForTests();
  const orgId = "00000000-0000-0000-0000-000000000001";

  // Issue secret
  const issued = await issueEventSecret(orgId);
  assert.ok(issued.secret.startsWith("aeg_evt_"));
  assert.equal(issued.rotated, false);
  assert.equal(issued.meta.orgId, orgId);
  assert.equal(issued.meta.hint, issued.secret.slice(-4));

  // Retrieve decrypted secret on server
  const retrieved = await getEventSecret(orgId);
  assert.equal(retrieved, issued.secret, "Retrieved plaintext secret must match issued secret");

  // Metadata retrieval hides ciphertext and secret
  const meta = await getEventSecretMeta(orgId);
  assert.equal(meta.hint, issued.secret.slice(-4));
  assert.equal(meta.orgId, orgId);
  assert.equal(meta.secret, undefined);
  assert.equal(meta.ciphertext, undefined);

  // Rotate secret
  const rotated = await issueEventSecret(orgId);
  assert.equal(rotated.rotated, true);
  assert.notEqual(rotated.secret, issued.secret);
  assert.ok(rotated.meta.rotatedAt);

  // Previous secret is invalidated immediately
  const activeNow = await getEventSecret(orgId);
  assert.equal(activeNow, rotated.secret);
  assert.notEqual(activeNow, issued.secret);
});
