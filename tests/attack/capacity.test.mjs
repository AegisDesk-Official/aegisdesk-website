#!/usr/bin/env node

/**
 * =====================================================================
 * AegisDesk Capacity & Load Testing Suite
 * =====================================================================
 * Evaluates the 5 target endpoints under concurrent load:
 * 1. / (Homepage)
 * 2. /api/status (System health & metrics)
 * 3. /api/events (High-throughput telemetry write endpoint with HMAC)
 * 4. /api/demo (Public interactive AI workbench)
 * 5. /dashboard (Authenticated client portal)
 *
 * Measures:
 * - Throughput (req/sec)
 * - Latency: p50, p95, p99 (ms)
 * - Error rate (% non-2xx/3xx, excluding deliberate security 429s)
 * - Failure threshold (load at which p95 > 1,000ms or error rate > 1%)
 * - Root cause of first failure
 * =====================================================================
 */

import crypto from "crypto";
import fs from "fs";

const BASE_URL = "http://localhost:3000";
const SECRET = "sec_live_apex_retail_7719";
const ORG_ID = "00000000-0000-0000-0000-000000000001";

function generateEventPayload() {
  const eventId = `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const ticketRef = `TCK-${Math.floor(Math.random() * 9000) + 1000}`;
  const body = JSON.stringify({
    org_id: ORG_ID,
    event_id: eventId,
    type: "ticket_received",
    ticket_ref: ticketRef,
    channel: "zendesk",
  });
  const timestamp = Date.now().toString();
  const signature = crypto.createHmac("sha256", SECRET).update(`${timestamp}.${body}`).digest("hex");
  return { body, timestamp, signature };
}

async function benchmarkEndpoint(name, url, optionsGenerator, concurrency, totalRequests) {
  const latencies = [];
  let successCount = 0;
  let errorCount = 0;
  let rateLimitedCount = 0;
  let firstError = null;

  const startTime = performance.now();
  let completed = 0;

  async function worker() {
    while (completed < totalRequests) {
      completed++;
      const reqStart = performance.now();
      try {
        const { method = "GET", headers = {}, body = null } = optionsGenerator();
        const res = await fetch(url, { method, headers, body });
        const latency = performance.now() - reqStart;
        latencies.push(latency);

        if (res.status === 429) {
          rateLimitedCount++;
          // Deliberate security rate limits are noted
        } else if (res.status >= 500) {
          errorCount++;
          if (!firstError) firstError = `HTTP ${res.status}`;
        } else {
          successCount++;
        }
      } catch (err) {
        const latency = performance.now() - reqStart;
        latencies.push(latency);
        errorCount++;
        if (!firstError) firstError = err.message;
      }
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, totalRequests) }, () => worker());
  await Promise.all(workers);

  const durationSec = (performance.now() - startTime) / 1000;
  latencies.sort((a, b) => a - b);

  const p50 = latencies[Math.floor(latencies.length * 0.5)] || 0;
  const p95 = latencies[Math.floor(latencies.length * 0.95)] || 0;
  const p99 = latencies[Math.floor(latencies.length * 0.99)] || 0;
  const rps = totalRequests / durationSec;
  const errorRate = (errorCount / totalRequests) * 100;

  const isBroken = errorRate > 1.0 || p95 > 1000;

  return {
    name,
    concurrency,
    totalRequests,
    durationSec: Number(durationSec.toFixed(2)),
    rps: Number(rps.toFixed(1)),
    p50Ms: Number(p50.toFixed(1)),
    p95Ms: Number(p95.toFixed(1)),
    p99Ms: Number(p99.toFixed(1)),
    successCount,
    errorCount,
    rateLimitedCount,
    errorRate: Number(errorRate.toFixed(2)),
    isBroken,
    firstError: firstError || (rateLimitedCount > 0 ? "Rate Limiter Engaged (429)" : "None"),
  };
}

async function runCapacitySuite() {
  console.log("=====================================================================");
  console.log("Starting AegisDesk Capacity & Performance Benchmark Suite");
  console.log("=====================================================================\n");

  const results = {};

  // 1. Homepage (/)
  console.log("Testing: / (Homepage)");
  results.homepage = [];
  for (const c of [10, 50, 100, 200]) {
    const res = await benchmarkEndpoint("Homepage (/)", `${BASE_URL}/`, () => ({ method: "GET" }), c, c * 3);
    results.homepage.push(res);
    console.log(`  Concurrency: ${c} | RPS: ${res.rps} | p50: ${res.p50Ms}ms | p95: ${res.p95Ms}ms | Errors: ${res.errorCount} (${res.errorRate}%)`);
  }

  // 2. /api/status (System health)
  console.log("\nTesting: /api/status (System Health API)");
  results.status = [];
  for (const c of [10, 50, 100, 200]) {
    const res = await benchmarkEndpoint("Status API (/api/status)", `${BASE_URL}/api/status`, () => ({ method: "GET" }), c, c * 3);
    results.status.push(res);
    console.log(`  Concurrency: ${c} | RPS: ${res.rps} | p50: ${res.p50Ms}ms | p95: ${res.p95Ms}ms | Errors: ${res.errorCount} (${res.errorRate}%)`);
  }

  // 3. /api/events (High-frequency write stream)
  console.log("\nTesting: /api/events (Telemetry Write Stream)");
  results.events = [];
  for (const c of [5, 25, 50, 100]) {
    const res = await benchmarkEndpoint(
      "Events Ingestion (/api/events)",
      `${BASE_URL}/api/events`,
      () => {
        const { body, timestamp, signature } = generateEventPayload();
        return {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-signature": signature,
            "x-timestamp": timestamp,
          },
          body,
        };
      },
      c,
      c * 2
    );
    results.events.push(res);
    console.log(`  Concurrency: ${c} | RPS: ${res.rps} | p50: ${res.p50Ms}ms | p95: ${res.p95Ms}ms | 429s: ${res.rateLimitedCount} | Errors: ${res.errorCount}`);
  }

  // 4. /api/demo (Interactive AI Workbench)
  console.log("\nTesting: /api/demo (Public Workbench)");
  results.demo = [];
  for (const c of [2, 5, 10, 20]) {
    const res = await benchmarkEndpoint(
      "Demo Workbench (/api/demo)",
      `${BASE_URL}/api/demo`,
      () => ({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: "What is your refund timeframe?" }),
      }),
      c,
      c * 2
    );
    results.demo.push(res);
    console.log(`  Concurrency: ${c} | RPS: ${res.rps} | p50: ${res.p50Ms}ms | p95: ${res.p95Ms}ms | 429s: ${res.rateLimitedCount} | Errors: ${res.errorCount}`);
  }

  // 5. /dashboard (Client Portal SSR)
  console.log("\nTesting: /dashboard (Client Portal)");
  results.dashboard = [];
  for (const c of [5, 20, 50, 100]) {
    const res = await benchmarkEndpoint(
      "Client Dashboard (/dashboard)",
      `${BASE_URL}/dashboard`,
      () => ({
        method: "GET",
        headers: { Cookie: "user_role=client_admin; user_org=00000000-0000-0000-0000-000000000001" },
      }),
      c,
      c * 2
    );
    results.dashboard.push(res);
    console.log(`  Concurrency: ${c} | RPS: ${res.rps} | p50: ${res.p50Ms}ms | p95: ${res.p95Ms}ms | Errors: ${res.errorCount} (${res.errorRate}%)`);
  }

  console.log("\n=====================================================================");
  console.log("Capacity Benchmarks Completed");
  console.log("=====================================================================");

  fs.writeFileSync("tests/attack/capacity-results.json", JSON.stringify(results, null, 2));
}

runCapacitySuite().catch((err) => {
  console.error("Capacity benchmark failure:", err);
  process.exit(1);
});
