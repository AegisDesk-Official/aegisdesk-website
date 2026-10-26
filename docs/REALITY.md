# REALITY.md — Technical Fact-Finding & Architecture Audit

This document audits every public page, dashboard screen, owner-console tab, API route, and background job in AegisDesk (`aegisdesk-round-3.1`). Each item is classified as:
- **REAL**: Reads or writes the real database or a real external service (citing the exact file and function that proves it).
- **SIMULATED**: Uses in-memory fixtures, hardcoded data, or local state.
- **MISSING**: Advertised or expected capability with no implementation in code.

---

## 1. Two Mandatory System Verification Checks

### Check (a): Can a logged-out visitor open `/dashboard` or `/operator` today?
- **Finding:** **YES, a logged-out visitor CAN currently open both `/dashboard` and `/operator`.**
- **Root Cause & Code Proof:**
  In [`src/middleware.ts`](file:///Users/aditgupta/Downloads/aegisdesk-round-3.1/src/middleware.ts#L54-L58):
  ```typescript
  // 3. Supabase session and AAL2 2FA check for protected routes (/dashboard & /operator)
  const isProtected = pathname.startsWith("/dashboard") || pathname.startsWith("/operator");

  if (isProtected) {
    // If DASHBOARD_PREVIEW is set to true (test & preview mode), allow access
    if (process.env.DASHBOARD_PREVIEW === "true") {
      return response;
    }
  ```
  The active `.env.local` contains `DASHBOARD_PREVIEW="true"`. This short-circuits the Supabase `getUser()` check and immediately serves the page.
- **Verification Command & Output:**
  ```bash
  $ curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/dashboard
  200
  $ curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/operator
  200
  ```
  *(Note: When `DASHBOARD_PREVIEW="false"`, the middleware issues an HTTP 307 redirect to `/auth/sign-in?redirect=/dashboard` or `/operator`)*.

---

### Check (b): Does anything on the site still say Sample, Demo or Example next to a number?
- **Finding:** **YES, multiple numbers across public marketing pages, legal pages, and dashboard screens are explicitly tagged `[Sample]` or `Demo`.**
- **Test Command:**
  ```bash
  $ grep -rn -E "([0-9]+.*(Sample|Demo|Example)|(Sample|Demo|Example).*[0-9]+)" src/components src/app
  $ grep -rn "DemoTag" src/
  ```
- **Active Instances Discovered:**
  1. [`src/components/marketing/verification-workbench.tsx`](file:///Users/aditgupta/Downloads/aegisdesk-round-3.1/src/components/marketing/verification-workbench.tsx#L70-L109):
     - Line 72: `"$480 [Sample]"`
     - Line 76: `"unauthorized $480 [Sample] refund"`
     - Line 86: `"routed to a human in 260ms [Sample]"`
     - Line 99: `"promised a $6,000 [Sample] credit"`
     - Line 109: `"verified 99.96% [Sample] compliance"`
     - Line 148: `"Day 47 post-delivery [Sample]"`
     - Line 673: `"LATENCY: 284ms [Sample]"`
     - Line 708: `"2 Verified Citations [Sample]"`
     - Line 795: `"Sent to customer via helpdesk (284ms [Sample])"`
     - Line 919: `"% (below the 92.0% bar required to reply) [Sample]"`
     - Line 927: `"LATENCY: 192ms [Sample]"`
  2. [`src/components/marketing/safety-pillars.tsx`](file:///Users/aditgupta/Downloads/aegisdesk-round-3.1/src/components/marketing/safety-pillars.tsx#L71-L126):
     - Line 71: `"Blocked (0 sources) [Sample]"`
     - Line 83: `"99.4% source match [Sample] · 2 quoted sources"`
     - Line 110: `"92.0% confidence bar [Sample] · 192ms handoff [Sample]"`
     - Line 124: `"38.0% (below 92.0% bar) [Sample]"`
     - Line 126: `"Sent to Zendesk team queue (192ms [Sample])"`
  3. [`src/components/marketing/savings-example.tsx`](file:///Users/aditgupta/Downloads/aegisdesk-round-3.1/src/components/marketing/savings-example.tsx#L302-L326):
     - Line 302: `"${baseline.toLocaleString()} / mo [Sample]"`
     - Line 312: `"-$${automated.toLocaleString()} / mo [Sample]"`
     - Line 326: `"Payback: Under 30 days [Sample]"`
  4. [`src/components/marketing/demo-chat.tsx`](file:///Users/aditgupta/Downloads/aegisdesk-round-3.1/src/components/marketing/demo-chat.tsx#L136):
     - Line 136: `"MATCH {(score * 100).toFixed(1)}% [Sample]"`
  5. [`src/components/portal/demo-tag.tsx`](file:///Users/aditgupta/Downloads/aegisdesk-round-3.1/src/components/portal/demo-tag.tsx#L9):
     - Renders a literal `"Demo"` badge component adjacent to numbers across all 9 dashboard screens (`/dashboard`, `/dashboard/analytics`, `/dashboard/conversations`, `/dashboard/knowledge-base`, `/dashboard/billing`) and the `/operator` console.
- **Round 3 Rule Conflict:**
  Per Round 3 Rules: *"A number may appear only if it is (a) a price or term from src/lib/pricing, (b) computed from what the visitor typed, (c) a fact about how the product is built, or (d) real data from the database. Never tag a number 'Sample', 'Demo' or 'Example'. If there is no real number, show an empty state."* All instances above must be migrated to computed values or clean empty states.

---

## 2. Public Pages Inventory

| Public Page | Path / Route | Classification | Proof / Implementation Details |
|---|---|---|---|
| **Homepage** | `src/app/page.tsx` (`/`) | **REAL** | Compiles server layout and renders client components; live chat connects to real backend via `/api/demo` ([`src/lib/demo-backend.ts:askDemoBackend`](file:///Users/aditgupta/Downloads/aegisdesk-round-3.1/src/lib/demo-backend.ts#L61)). |
| **Pricing & ROI** | `src/app/pricing/page.tsx` (`/pricing`) | **REAL** | Reads canonical pricing from [`src/lib/site-config.ts`](file:///Users/aditgupta/Downloads/aegisdesk-round-3.1/src/lib/site-config.ts#L30); client calculator computes real values dynamically in [`src/components/marketing/savings-example.tsx`](file:///Users/aditgupta/Downloads/aegisdesk-round-3.1/src/components/marketing/savings-example.tsx#L96). |
| **Security & Trust** | `src/app/security/page.tsx` (`/security`) | **REAL** | Renders static legal and architecture compliance statements; no DB read. |
| **Privacy Policy** | `src/app/privacy/page.tsx` (`/privacy`) | **REAL** | Renders GDPR and India DPDP-compliant privacy policy text. |
| **Terms of Service** | `src/app/terms/page.tsx` (`/terms`) | **REAL** | Renders Master Services Agreement and SLA terms; records acceptance via `/api/terms/accept`. |
| **Data Processing Addendum** | `src/app/dpa/page.tsx` (`/dpa`) | **REAL** | Renders standardized B2B DPA legal schedule. |
| **Cancellation & Refunds** | `src/app/cancellation-refunds/page.tsx` | **REAL** | Renders payment policy governing setup fee and monthly retainer terms. |
| **Shipping & Delivery** | `src/app/shipping-delivery/page.tsx` | **REAL** | Renders digital service onboarding SLA schedule. |
| **About Page** | `src/app/about/page.tsx` (`/about`) | **SIMULATED** | Renders static brand narrative and founder bios; no live database or CRM connection. |
| **Contact Page** | `src/app/contact/page.tsx` (`/contact`) | **REAL** | Renders official email contact and dynamic Cal.com booking link from [`src/lib/site-config.ts:resolveCalLink`](file:///Users/aditgupta/Downloads/aegisdesk-round-3.1/src/lib/site-config.ts#L10). |
| **System Status** | `src/app/status/page.tsx` (`/status`) | **SIMULATED** | Renders static mock operational latency and uptime bars; does not query external monitor (Datadog/BetterUptime). |
| **Styleguide** | `src/app/styleguide/page.tsx` (`/styleguide`) | **REAL** | Internal engineering tool verifying design token contrast and typography scales. |
| **Maintenance** | `src/app/maintenance/page.tsx` (`/maintenance`) | **REAL** | Static 503 emergency maintenance notice screen. |
| **Not Found (404)** | `src/app/not-found.tsx` (`/not-found`) | **REAL** | Custom branded Next.js 404 response. |
| **Sign-In** | `src/app/auth/sign-in/page.tsx` (`/auth/sign-in`) | **SIMULATED** | Multi-tenant auth UI form with mock credentials; sets local mock token unless Supabase Auth is actively connected. |
| **Forgot Password** | `src/app/auth/forgot-password/page.tsx` | **SIMULATED** | Validates email input via Zod; does not dispatch live transactional reset email without Resend credentials. |
| **Reset Password** | `src/app/auth/reset-password/page.tsx` | **SIMULATED** | Client-side password form validation; no live Supabase Auth update executed. |
| **Email Verification** | `src/app/auth/email-verification/page.tsx` | **SIMULATED** | Static notification instructing user to check their corporate inbox. |
| **Workspace Invite** | `src/app/auth/invite/page.tsx` (`/auth/invite`) | **SIMULATED** | Decodes token client-side and sets mock session; no DB invite validation. |
| **Access Denied (403)** | `src/app/auth/access-denied/page.tsx` | **REAL** | Accessible role-barrier notification screen. |
| **MFA Verification** | `src/app/auth/mfa-verify/page.tsx` (`/auth/mfa-verify`) | **SIMULATED** | Accepts 6-digit TOTP code and validates against static demo code `123456`. |

---

## 3. Dashboard Screens Inventory (`/dashboard/*`)

| Screen | Route / File | Classification | Proof / Implementation Details |
|---|---|---|---|
| **Overview** | `src/app/dashboard/page.tsx` (`/dashboard`) | **SIMULATED** | Loads static telemetry metrics from [`src/lib/dashboard-seed-data.ts:CLIENT_OVERVIEW_DATA`](file:///Users/aditgupta/Downloads/aegisdesk-round-3.1/src/lib/db/seed-data.ts#L93). |
| **Conversations** | `src/app/dashboard/conversations/page.tsx` | **SIMULATED** | Inspects mock conversation transcripts and citation pills from [`src/lib/dashboard-seed-data.ts:MOCK_CONVERSATIONS`](file:///Users/aditgupta/Downloads/aegisdesk-round-3.1/src/lib/db/seed-data.ts). |
| **Knowledge Base** | `src/app/dashboard/knowledge-base/page.tsx` | **SIMULATED** | Renders static document list from [`src/lib/mock-data.ts:MOCK_DOCUMENTS`](file:///Users/aditgupta/Downloads/aegisdesk-round-3.1/src/lib/mock-data.ts); file upload triggers `/api/documents/upload`. |
| **Assistant Settings** | `src/app/dashboard/assistant/page.tsx` | **SIMULATED** | Local React state slider for confidence threshold (80–99%) and system prompt; no persistent API write. |
| **Analytics** | `src/app/dashboard/analytics/page.tsx` | **SIMULATED** | Deflection and latency histograms read from [`src/lib/dashboard-seed-data.ts:CLIENT_PERFORMANCE_DATA`](file:///Users/aditgupta/Downloads/aegisdesk-round-3.1/src/lib/db/seed-data.ts). |
| **Security & Audit** | `src/app/dashboard/security/page.tsx` | **SIMULATED** | Renders static PII toggle states and mock audit log entries from [`src/lib/mock-data.ts`](file:///Users/aditgupta/Downloads/aegisdesk-round-3.1/src/lib/mock-data.ts). |
| **Team Management** | `src/app/dashboard/team/page.tsx` | **SIMULATED** | Displays 3 hardcoded team members (Admin, Agent, Viewer) from [`src/lib/mock-data.ts`](file:///Users/aditgupta/Downloads/aegisdesk-round-3.1/src/lib/mock-data.ts). |
| **Billing & Invoices** | `src/app/dashboard/billing/page.tsx` | **SIMULATED** | Reads invoice array from [`src/lib/billing/invoices-store.ts:getInvoicesForOrg`](file:///Users/aditgupta/Downloads/aegisdesk-round-3.1/src/lib/billing/invoices-store.ts#L125) which defaults to in-memory fixtures. |
| **Settings** | `src/app/dashboard/settings/page.tsx` | **SIMULATED** | Renders static organization slug, mock API key, and dummy webhook endpoints from [`src/lib/mock-data.ts`](file:///Users/aditgupta/Downloads/aegisdesk-round-3.1/src/lib/mock-data.ts). |

---

## 4. Owner Console Tabs (`/operator` - `src/app/operator/page.tsx`)

| Tab | State / Selector | Classification | Proof / Implementation Details |
|---|---|---|---|
| **Clients** | `activeTab === "clients"` | **SIMULATED** | Reads client fleet cards from [`src/lib/dashboard-seed-data.ts:OPERATOR_DATA.clients`](file:///Users/aditgupta/Downloads/aegisdesk-round-3.1/src/lib/db/seed-data.ts#L368). |
| **Pipeline** | `activeTab === "pipeline"` | **SIMULATED** | Fetches `/api/leads` which queries in-memory Map `globalThis.__aegis_leads` in [`src/lib/cal/cal-store.ts:getLeads`](file:///Users/aditgupta/Downloads/aegisdesk-round-3.1/src/lib/cal/cal-store.ts#L78). |
| **Payments** | `activeTab === "payments"` | **SIMULATED** | Fetches `/api/billing/invoices` backed by in-memory array [`src/lib/billing/invoices-store.ts:getInvoicesForOrg`](file:///Users/aditgupta/Downloads/aegisdesk-round-3.1/src/lib/billing/invoices-store.ts#L125). |
| **Health** | `activeTab === "health"` | **SIMULATED** | Renders hardcoded infrastructure status cards from [`src/lib/dashboard-seed-data.ts:OPERATOR_DATA.health`](file:///Users/aditgupta/Downloads/aegisdesk-round-3.1/src/lib/db/seed-data.ts#L430). |
| **Events** | `activeTab === "events"` | **REAL** | Fetches `/api/events` which reads from the live Supabase `events` table and in-memory ring buffer via [`src/lib/db/events-store.ts:queryEvents`](file:///Users/aditgupta/Downloads/aegisdesk-round-3.1/src/lib/db/events-store.ts#L149). |
| **Security** | `activeTab === "security"` | **SIMULATED** | Displays hardcoded SOC2/GDPR compliance posture and rejected events from in-memory array [`src/lib/db/events-store.ts:memoryRejected`](file:///Users/aditgupta/Downloads/aegisdesk-round-3.1/src/lib/db/events-store.ts#L43). |

---

## 5. API Routes Inventory (`src/app/api/`)

| Route | File Path | Classification | Proof / Implementation Details |
|---|---|---|---|
| `/api/auth/sign-out` | `src/app/api/auth/sign-out/route.ts` | **REAL** | Calls `supabase.auth.signOut()` in [`src/app/api/auth/sign-out/route.ts:POST`](file:///Users/aditgupta/Downloads/aegisdesk-round-3.1/src/app/api/auth/sign-out/route.ts#L16). |
| `/api/billing/create-order` | `src/app/api/billing/create-order/route.ts` | **REAL** | Calls live Razorpay Orders API via [`src/lib/billing/razorpay.ts:createRazorpayOrder`](file:///Users/aditgupta/Downloads/aegisdesk-round-3.1/src/lib/billing/razorpay.ts#L36) when keys are set. |
| `/api/billing/invoices` | `src/app/api/billing/invoices/route.ts` | **SIMULATED** | Reads from in-memory array [`src/lib/billing/invoices-store.ts:getInvoicesForOrg`](file:///Users/aditgupta/Downloads/aegisdesk-round-3.1/src/lib/billing/invoices-store.ts#L125). |
| `/api/billing/invoices/[id]/pdf` | `src/app/api/billing/invoices/[id]/pdf/route.ts` | **REAL** | Compiles real dynamic PDF document bytes in memory using `pdf-lib` via [`src/lib/billing/invoice-pdf.ts:generateInvoicePdf`](file:///Users/aditgupta/Downloads/aegisdesk-round-3.1/src/lib/billing/invoice-pdf.ts#L22). |
| `/api/billing/offline-payment` | `src/app/api/billing/offline-payment/route.ts` | **SIMULATED** | Validates Zod schema and marks in-memory invoice as paid via [`src/lib/billing/invoices-store.ts:markInvoicePaid`](file:///Users/aditgupta/Downloads/aegisdesk-round-3.1/src/lib/billing/invoices-store.ts#L137). |
| `/api/billing/reconcile` | `src/app/api/billing/reconcile/route.ts` | **REAL** | Calls real Razorpay REST API endpoint `https://api.razorpay.com/v1/payments` via [`src/lib/billing/razorpay.ts:fetchRazorpayPayments`](file:///Users/aditgupta/Downloads/aegisdesk-round-3.1/src/lib/billing/razorpay.ts#L115). |
| `/api/billing/refund` | `src/app/api/billing/refund/route.ts` | **SIMULATED** | Enforces 6-digit MFA and rate limits, but updates in-memory invoice store; does not execute Razorpay Refund API call. |
| `/api/billing/verify-payment` | `src/app/api/billing/verify-payment/route.ts` | **REAL** | Performs cryptographic HMAC-SHA256 constant-time signature verification via [`src/lib/billing/razorpay.ts:verifyWebhookSignature`](file:///Users/aditgupta/Downloads/aegisdesk-round-3.1/src/lib/billing/razorpay.ts#L64). |
| `/api/demo` | `src/app/api/demo/route.ts` | **REAL** | Enforces Turnstile token validation via [`src/lib/security/turnstile.ts:verifyTurnstile`](file:///Users/aditgupta/Downloads/aegisdesk-round-3.1/src/lib/security/turnstile.ts#L15), atomic Upstash Redis rate limits via [`src/lib/demo-limits.ts:checkDemoLimits`](file:///Users/aditgupta/Downloads/aegisdesk-round-3.1/src/lib/demo-limits.ts#L36), and proxies to FastAPI via [`src/lib/demo-backend.ts:askDemoBackend`](file:///Users/aditgupta/Downloads/aegisdesk-round-3.1/src/lib/demo-backend.ts#L61). |
| `/api/documents/upload` | `src/app/api/documents/upload/route.ts` | **REAL** | Uploads multipart PDF files into Supabase Storage bucket `knowledge_documents` via [`src/lib/db/server.ts:uploadDocument`](file:///Users/aditgupta/Downloads/aegisdesk-round-3.1/src/lib/db/server.ts#L88). |
| `/api/events` | `src/app/api/events/route.ts` | **REAL** | Validates HMAC signature, strips PII, and writes to Supabase `events` table (with in-memory fallback) via [`src/lib/db/events-store.ts:recordEvent`](file:///Users/aditgupta/Downloads/aegisdesk-round-3.1/src/lib/db/events-store.ts#L65). |
| `/api/events/rollup` | `src/app/api/events/rollup/route.ts` | **REAL** | Computes daily aggregation rollups and stores summaries via [`src/lib/db/events-store.ts:rollupEvents`](file:///Users/aditgupta/Downloads/aegisdesk-round-3.1/src/lib/db/events-store.ts#L182). |
| `/api/leads` | `src/app/api/leads/route.ts` | **SIMULATED** | Saves captured leads into in-memory Map `globalThis.__aegis_leads` via [`src/lib/cal/cal-store.ts:recordLead`](file:///Users/aditgupta/Downloads/aegisdesk-round-3.1/src/lib/cal/cal-store.ts#L71). |
| `/api/operator/workbench-control` | `src/app/api/operator/workbench-control/route.ts` | **REAL** | Reads and persists runtime workbench configuration via [`src/lib/demo-backend.ts:getWorkbenchConfig`](file:///Users/aditgupta/Downloads/aegisdesk-round-3.1/src/lib/demo-backend.ts#L22). |
| `/api/organization/delete` | `src/app/api/organization/delete/route.ts` | **REAL** | Executes cascading hard GDPR deletion across Supabase database and storage buckets via [`src/lib/db/server.ts:deleteOrganizationData`](file:///Users/aditgupta/Downloads/aegisdesk-round-3.1/src/lib/db/server.ts#L174). |
| `/api/organization/export` | `src/app/api/organization/export/route.ts` | **REAL** | Compiles complete JSON archive of all tenant records from Supabase via [`src/lib/db/server.ts:exportOrganizationData`](file:///Users/aditgupta/Downloads/aegisdesk-round-3.1/src/lib/db/server.ts#L141). |
| `/api/organization/onboarding` | `src/app/api/organization/onboarding/route.ts` | **REAL** | Creates organization entry and settings in Supabase via [`src/lib/db/server.ts:saveOrganizationOnboarding`](file:///Users/aditgupta/Downloads/aegisdesk-round-3.1/src/lib/db/server.ts#L42). |
| `/api/status` | `src/app/api/status/route.ts` | **REAL** | Returns live Node.js process uptime, memory usage, timestamp, and environment health check. |
| `/api/terms/accept` | `src/app/api/terms/accept/route.ts` | **REAL** | Records legal acceptance signature with IP and timestamp into Supabase `terms_acceptances` table via [`src/app/api/terms/accept/route.ts:POST`](file:///Users/aditgupta/Downloads/aegisdesk-round-3.1/src/app/api/terms/accept/route.ts#L52). |
| `/api/webhooks/cal` | `src/app/api/webhooks/cal/route.ts` | **REAL** | Verifies Cal.com webhook signature via [`src/lib/cal/cal-service.ts:verifyCalWebhookSignature`](file:///Users/aditgupta/Downloads/aegisdesk-round-3.1/src/lib/cal/cal-service.ts#L24) and records booking. |
| `/api/webhooks/razorpay` | `src/app/api/webhooks/razorpay/route.ts` | **REAL** | Cryptographically verifies Razorpay payment signature and updates payment status via [`src/lib/billing/razorpay.ts:verifyWebhookSignature`](file:///Users/aditgupta/Downloads/aegisdesk-round-3.1/src/lib/billing/razorpay.ts#L64). |

---

## 6. Background Jobs & Automation Scripts

| Job / Script | Location | Classification | Proof / Implementation Details |
|---|---|---|---|
| **Billing Reconciliation CLI** | `scripts/reconcile-billing.mjs` | **REAL** | Node.js script querying the Razorpay API over HTTPS and generating discrepancy JSON reports. |
| **Daily Telemetry Rollup** | `/api/events/rollup` | **REAL** | Aggregates daily telemetry event rows into summary records in [`src/lib/db/events-store.ts:rollupEvents`](file:///Users/aditgupta/Downloads/aegisdesk-round-3.1/src/lib/db/events-store.ts#L182). |
| **Sample Invoice Generator** | `scripts/generate-sample-invoice.mjs` | **REAL** | Node.js script generating compliant B2B PDF invoice files using `pdf-lib`. |
| **Synthetic Event Generator** | `scripts/generate-demo-events.mjs` | **SIMULATED** | Test utility generating synthetic random telemetry events for preview visualization. |
| **Scheduled Billing Cron** | External / `vercel.json` | **MISSING** | No automated cron schedule configured in `vercel.json`; reconciliation must be executed manually. |
| **Automated Helpdesk Ingestion Worker** | Backend Worker | **MISSING** | No background daemon polling Zendesk/Gorgias APIs for new customer tickets or document changes. |
