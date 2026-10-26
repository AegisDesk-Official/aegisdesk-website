#!/usr/bin/env node
/**
 * Mock AI Answering Engine (Development / Testing Only)
 *
 * Implements the contract defined in docs/PIPELINE_CONTRACT.md with canned responses.
 * Never part of a production build. Every response includes "simulated": true.
 *
 * Usage:
 *   PIPELINE_SHARED_SECRET="mock_secret_key_32_bytes_long_min_12345" node tools/mock-pipeline-engine.mjs
 */
import http from "node:http";
import crypto from "node:crypto";

const PORT = Number(process.env.MOCK_ENGINE_PORT || process.env.PORT || 8080);
const SHARED_SECRET = (process.env.PIPELINE_SHARED_SECRET || "mock_secret_key_32_bytes_long_min_12345").trim();

function buildStringToSign(timestamp, method, path, rawBody) {
  return `${timestamp}.${method.toUpperCase()}.${path}.${rawBody}`;
}

function verifySignature(timestamp, method, path, rawBody, signatureHeader) {
  if (!timestamp || !signatureHeader) return false;
  try {
    const expected = crypto
      .createHmac("sha256", SHARED_SECRET)
      .update(buildStringToSign(timestamp, method, path, rawBody), "utf8")
      .digest("hex");

    const a = Buffer.from(expected, "hex");
    const b = Buffer.from(signatureHeader, "hex");
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  const method = req.method.toUpperCase();
  const path = url.pathname;

  // Read request body
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const rawBody = Buffer.concat(chunks).toString("utf8");

  // Validate request signature
  const timestamp = req.headers["x-aegis-timestamp"] || "";
  const signature = req.headers["x-aegis-signature"] || "";

  const isVerified = verifySignature(timestamp, method, path, rawBody, signature);
  if (!isVerified) {
    res.writeHead(401, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        error: {
          code: "UNAUTHORIZED",
          message: "Cryptographic signature verification failed or timestamp missing.",
        },
        simulated: true,
      })
    );
    return;
  }

  // Parse JSON body when present
  let body = {};
  if (rawBody) {
    try {
      body = JSON.parse(rawBody);
    } catch {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          error: { code: "INVALID_JSON", message: "Malformed JSON body." },
          simulated: true,
        })
      );
      return;
    }
  }

  res.setHeader("Content-Type", "application/json");

  // 1. GET /v1/health
  if (method === "GET" && path === "/v1/health") {
    res.writeHead(200);
    res.end(
      JSON.stringify({
        status: "ok",
        version: "1.0.0-mock",
        simulated: true,
      })
    );
    return;
  }

  // 2. POST /v1/documents/index
  if (method === "POST" && path === "/v1/documents/index") {
    const documentId = body.document_id || "doc-mock-unknown";
    res.writeHead(200);
    res.end(
      JSON.stringify({
        document_id: documentId,
        status: "indexed",
        simulated: true,
      })
    );
    return;
  }

  // 3. POST /v1/documents/remove
  if (method === "POST" && path === "/v1/documents/remove") {
    const documentId = body.document_id || "doc-mock-unknown";
    res.writeHead(200);
    res.end(
      JSON.stringify({
        document_id: documentId,
        removed: true,
        simulated: true,
      })
    );
    return;
  }

  // 4. POST /v1/draft-reply
  if (method === "POST" && path === "/v1/draft-reply") {
    const text = body.text || "";
    const isEscalation = text.toLowerCase().includes("human") || text.toLowerCase().includes("escalat");

    if (isEscalation) {
      res.writeHead(200);
      res.end(
        JSON.stringify({
          reply: "",
          citations: [],
          grounded: false,
          handed_to_human: true,
          reason: "sensitive_topic",
          cost_usd: 0.0012,
          simulated: true,
        })
      );
      return;
    }

    res.writeHead(200);
    res.end(
      JSON.stringify({
        reply: "Standard returns are accepted within 30 days of delivery. All claims must cite an immutable policy clause.",
        citations: [
          {
            document_id: "doc-return-policy-sample",
            page: 2,
            quote: "Returns are accepted within 30 calendar days of delivery with original proof of purchase.",
          },
        ],
        grounded: true,
        handed_to_human: false,
        cost_usd: 0.0035,
        simulated: true,
      })
    );
    return;
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(
    JSON.stringify({
      error: { code: "NOT_FOUND", message: `Unknown mock route ${method} ${path}` },
      simulated: true,
    })
  );
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`[AegisDesk Mock Engine] Listening on http://127.0.0.1:${PORT}`);
  console.log(`[AegisDesk Mock Engine] Shared Secret length: ${SHARED_SECRET.length} chars`);
  console.log(`[AegisDesk Mock Engine] All responses tagged { "simulated": true }`);
});
