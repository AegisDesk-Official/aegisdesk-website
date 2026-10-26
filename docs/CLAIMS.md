# CLAIMS.md — Factual Claims Audit & Verification Matrix

This document audits every factual claim made across the public marketing site, client dashboard, legal policies, emails, and PDFs for AegisDesk (`aegisdesk-round-3.1`).

Each claim is categorized under one of three statuses:
- **TRUE BY DESIGN**: Enforced by specific, verifiable application code or infrastructure configuration.
- **MEASURED**: Backed by empirical production measurement or telemetry data.
- **UNSUPPORTED**: Hardcoded, promotional, sample, or aspirational with no backing data or code.

---

## 1. Quantitative Performance & Telemetry Claims

| Exact Text | Where It Appears | Status | Proof / Evidence |
|---|---|---|---|
| `"99.4% Grounded accuracy"` / `"99.4% source match"` | `sylva-hero.tsx` (L68), `safety-pillars.tsx` (L83), `verification-workbench.tsx` (L109), `seed-data.ts` (L98) | **UNSUPPORTED** | Synthetic sample metric hardcoded in marketing components and seed fixtures (`CLIENT_OVERVIEW_DATA.groundingAccuracy = "99.4%"`). No empirical production benchmark data exists. |
| `"<300ms Citation latency"` / `"Retrieval speed <300ms"` | `sylva-hero.tsx` (L72) | **UNSUPPORTED** | Hardcoded promotional telemetry label in hero proof strip. |
| `"284ms [Sample]"` / `"Latency: 284ms"` | `sylva-hero.tsx` (L65), `verification-workbench.tsx` (L98, L673, L795), `seed-data.ts` (L106) | **UNSUPPORTED** | Hardcoded mock latency in demo scenarios and `seed-data.ts`. |
| `"260ms [Sample]"` / `"routed to a human in 260ms"` | `verification-workbench.tsx` (L86, L107) | **UNSUPPORTED** | Hardcoded simulation value in Scenario 02 comparison card. |
| `"192ms Human Handoff"` / `"192ms handoff [Sample]"` | `safety-pillars.tsx` (L110, L126), `verification-workbench.tsx` (L927) | **UNSUPPORTED** | Hardcoded mock handoff time in Scenario 03 escalation card. |
| `"92.0% Confidence Floor"` / `"92.0% confidence bar"` | `safety-pillars.tsx` (L110, L124), `verification-workbench.tsx` (L115, L919) | **TRUE BY DESIGN** | Enforced in code: [`src/lib/demo-backend.ts:getWorkbenchConfig`](file:///Users/aditgupta/Downloads/aegisdesk-round-3.1/src/lib/demo-backend.ts#L22) sets `threshold: 0.92`, and [`verification-workbench.tsx`](file:///Users/aditgupta/Downloads/aegisdesk-round-3.1/src/components/marketing/verification-workbench.tsx#L919) evaluates `score < 0.92` to halt autonomous dispatch and trigger human handoff. |
| `"99.96% SLA compliance"` | `verification-workbench.tsx` (L110) | **UNSUPPORTED** | Hardcoded illustrative number in mock comparison copy. |
| `"98.7% match [Sample]"` | `verification-workbench.tsx` (L97) | **UNSUPPORTED** | Hardcoded fixture in Scenario 01 verified draft. |
| `"38.0% (below 92.0% bar) [Sample]"` | `safety-pillars.tsx` (L124), `verification-workbench.tsx` (L115) | **UNSUPPORTED** | Hardcoded mock score in Scenario 03 edge-case demonstration. |
| `"14-Day Shadow Mode"` / `"14-day supervised shadow mode"` | `DESIGN.md` (L5), `sylva-hero.tsx` (L76), `how-it-works.tsx` (L178), `savings-example.tsx` (L206), `terms/page.tsx` (L28) | **TRUE BY DESIGN** | Architecture mandates a 14-day calibration phase before live routing; coded in [`src/lib/site-config.ts`](file:///Users/aditgupta/Downloads/aegisdesk-round-3.1/src/lib/site-config.ts#L30), [`src/lib/billing/invoices-store.ts`](file:///Users/aditgupta/Downloads/aegisdesk-round-3.1/src/lib/billing/invoices-store.ts#L78), and tracked in [`src/app/operator/page.tsx`](file:///Users/aditgupta/Downloads/aegisdesk-round-3.1/src/app/operator/page.tsx#L55). |
| `"$2,500 setup plus $1,000 per month"` | `DESIGN.md` (L5), `site-config.ts` (L30-31), `savings-example.tsx` (L206), `terms/page.tsx` (L28) | **TRUE BY DESIGN** | Canonical pricing enforced in [`src/lib/site-config.ts:setupPriceLabel`](file:///Users/aditgupta/Downloads/aegisdesk-round-3.1/src/lib/site-config.ts#L30) and split into 50% deposit / 50% balance invoices in [`src/lib/billing/invoices-store.ts:DEFAULT_INVOICES`](file:///Users/aditgupta/Downloads/aegisdesk-round-3.1/src/lib/billing/invoices-store.ts#L65-L105). |

---

## 2. Security, Privacy & Architectural Claims

| Exact Text | Where It Appears | Status | Proof / Evidence |
|---|---|---|---|
| `"Encrypted with AES-256 at rest"` | `src/app/security/page.tsx` (L17), `safety-pillars.tsx` (L63) | **TRUE BY DESIGN** | Supabase managed PostgreSQL infrastructure enforces AES-256 volume encryption at rest by default. |
| `"TLS 1.3 in transit"` | `src/app/security/page.tsx` (L17) | **TRUE BY DESIGN** | Enforced at Edge by Vercel/Cloudflare and strengthened via HTTP Strict Transport Security (`HSTS`) headers injected by [`src/middleware.ts:BASELINE_SECURITY_HEADERS`](file:///Users/aditgupta/Downloads/aegisdesk-round-3.1/src/lib/security/csp.ts#L32). |
| `"Cryptographic client boundary / Dedicated private partition"` | `src/app/security/page.tsx` (L21), `safety-pillars.tsx` (L55) | **TRUE BY DESIGN** | Supabase Row-Level Security (RLS) migrations in [`supabase/migrations/20261025000000_initial_schema.sql`](file:///Users/aditgupta/Downloads/aegisdesk-round-3.1/supabase/migrations/20261025000000_initial_schema.sql) and [`20261026000000_events_api_and_org_settings.sql`](file:///Users/aditgupta/Downloads/aegisdesk-round-3.1/supabase/migrations/20261026000000_events_api_and_org_settings.sql) strictly isolate tenant rows by `org_id`. |
| `"Zero public foundation model training on client data"` | `src/app/security/page.tsx` (L25), `src/app/privacy/page.tsx` (L21), `safety-pillars.tsx` (L55) | **TRUE BY DESIGN** | Backend proxy in [`src/lib/demo-backend.ts`](file:///Users/aditgupta/Downloads/aegisdesk-round-3.1/src/lib/demo-backend.ts#L61) routes queries through zero-data-retention inference APIs; no model fine-tuning or training code exists anywhere in the repository. |
| `"Cryptographic HMAC signature verification on webhook events"` | `docs/EVENTS_API.md`, `src/app/api/events/route.ts` | **TRUE BY DESIGN** | Implemented using constant-time `crypto.timingSafeEqual` in [`src/lib/security/hmac.ts`](file:///Users/aditgupta/Downloads/aegisdesk-round-3.1/src/lib/security/hmac.ts) and [`src/lib/billing/razorpay.ts:verifyWebhookSignature`](file:///Users/aditgupta/Downloads/aegisdesk-round-3.1/src/lib/billing/razorpay.ts#L64). |
| `"Strict per-request cryptographic CSP nonce generation"` | `src/app/security/page.tsx`, `src/middleware.ts` | **TRUE BY DESIGN** | Implemented in [`src/middleware.ts`](file:///Users/aditgupta/Downloads/aegisdesk-round-3.1/src/middleware.ts#L25-L37) generating fresh Base64 cryptographic nonces via Edge Web Cryptography API for every HTTP response. |
| `"Zero plaintext customer communications stored in event telemetry"` | `src/app/security/page.tsx`, `docs/EVENTS_API.md`, `src/app/api/events` | **TRUE BY DESIGN** | Enforced by design in [`src/lib/db/events-store.ts:recordEvent`](file:///Users/aditgupta/Downloads/aegisdesk-round-3.1/src/lib/db/events-store.ts#L72): message bodies and customer emails are explicitly stripped; only opaque sanitized `ticket_ref` tokens are persisted. |

---

## 3. Platform Integrations Claims

| Exact Text | Where It Appears | Status | Proof / Evidence |
|---|---|---|---|
| `"Zendesk Enterprise"` | `src/lib/site-config.ts` (L34), `integrations.tsx` (L12), `faq.tsx` (L251) | **UNSUPPORTED** | No native Zendesk API connector, OAuth client, or ticket sync webhook handler exists in the codebase. Only general webhook payload types exist. |
| `"Gorgias Commerce"` | `src/lib/site-config.ts` (L35), `integrations.tsx` (L13), `faq.tsx` (L251) | **UNSUPPORTED** | No native Gorgias API connector or authentication integration exists in code. |
| `"Shopify Plus"` | `src/lib/site-config.ts` (L36), `integrations.tsx` (L14), `faq.tsx` (L251) | **UNSUPPORTED** | No Shopify App Bridge, REST, or GraphQL connector exists in code. |
| `"Custom webhook"` | `src/lib/site-config.ts` (L37), `src/app/api/webhooks/*` | **TRUE BY DESIGN** | Fully implemented webhook receivers with cryptographic signature verification exist for Razorpay ([`src/app/api/webhooks/razorpay/route.ts`](file:///Users/aditgupta/Downloads/aegisdesk-round-3.1/src/app/api/webhooks/razorpay/route.ts)) and Cal.com ([`src/app/api/webhooks/cal/route.ts`](file:///Users/aditgupta/Downloads/aegisdesk-round-3.1/src/app/api/webhooks/cal/route.ts)). |
| `"REST API"` | `src/lib/site-config.ts` (L37), `docs/EVENTS_API.md`, `src/app/api/events` | **TRUE BY DESIGN** | Production-ready HTTP REST API implemented at [`src/app/api/events/route.ts`](file:///Users/aditgupta/Downloads/aegisdesk-round-3.1/src/app/api/events/route.ts) with OpenAPI/Zod payload validation. |

---

## 4. Commercial, Operational & Service Promises

| Exact Text | Where It Appears | Status | Proof / Evidence |
|---|---|---|---|
| `"100% human sign-off floor / Human agent approval before live dispatch"` | `how-it-works.tsx` (L194), `terms/page.tsx` (L28), `DESIGN.md` (L5) | **TRUE BY DESIGN** | During 14-day Shadow Mode, drafted replies are marked `staged` for approval; the backend proxy in [`src/lib/demo-backend.ts`](file:///Users/aditgupta/Downloads/aegisdesk-round-3.1/src/lib/demo-backend.ts) has no autonomous email/ticket dispatch path enabled without operator intervention. |
| `"Direct shared Slack channel with our AI systems engineers"` | `savings-example.tsx` (L218) | **UNSUPPORTED** | Service deliverable promise. No automated Slack bot or channel provisioning code exists in the codebase. |
| `"Payback: Under 30 days [Sample]"` | `savings-example.tsx` (L326) | **UNSUPPORTED** | Dynamic formula output calculated on the client based on user-entered slider values; not an empirical measurement of client payback. |
| `"Weekly retrieval calibration and engineering review of escalated edge-case tickets"` | `how-it-works.tsx` (L191), `savings-example.tsx` (L221) | **UNSUPPORTED** | Human operational deliverable; no automated scheduling script or calibration queue pipeline exists in the repo. |
| `"Bi-directional integration with Zendesk, Gorgias, Shopify"` | `savings-example.tsx` (L216) | **UNSUPPORTED** | Only outbound event publishing and generic webhook ingestion schemas are currently implemented. |
| `"Clients retain 100% intellectual property ownership of their source documents and ticket histories"` | `terms/page.tsx` (L291) | **TRUE BY DESIGN** | Legal guarantee enforced by Terms of Service contract clause and data export endpoint at [`src/app/api/organization/export/route.ts`](file:///Users/aditgupta/Downloads/aegisdesk-round-3.1/src/app/api/organization/export/route.ts). |
