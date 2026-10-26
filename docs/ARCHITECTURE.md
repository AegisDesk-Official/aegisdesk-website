# AegisDesk — Production Architecture Specification

A technical specification for converting the AegisDesk marketing and simulated demo into a multi-tenant client portal with real payments, bookings, verification workflows, and strict data isolation.

Stack: **Next.js 14 App Router** (Vercel), **Supabase** (Postgres, Auth, Storage), **Razorpay** (Payments & Retainers), **Cal.com** (Scoping Calls), **Resend** (Transactional Email), **Cloudflare Turnstile** (Bot Deterrence), and **Upstash Redis** (Distributed Rate Limiting).

---

## 1. Customer Journey State Machine

The client lifecycle moves through eleven deterministic states. No state transition occurs without a verified cryptographic webhook or signed administrative action.

```
lead ──[Cal.com webhook]──> booked_call ──[Admin proposal]──> proposal_sent
  │                                                                 │
  └──────────────────[Razorpay deposit webhook]─────────────────────┘
                                    │
                                    v
                               deposit_paid
                                    │
                         [Documents & integration]
                                    │
                                    v
                                onboarding
                                    │
                          [Verification passes]
                                    │
                                    v
                               shadow_validation (14 days)
                                    │
                         [Written sign-off + Bal]
                                    │
                                    v
                               balance_paid
                                    │
                        [Autonomous switch turned on]
                                    │
                                    v
                                  live
                                    │
                        [Recurring retainer active]
                                    │
                                    v
                             retainer_active
                                ┌───┴───┐
                    [Snooze/Fail]       [Cancel]
                                v       v
                             paused   churned
```

### State Definitions & Dashboard Unlock Matrix

| State | Entry Trigger | Dashboard Access & Unlocks |
|---|---|---|
| `lead` | Visitor submits email/phone via Turnstile-gated demo or contact form. | **Zero dashboard access.** Read-only demo chat quota. |
| `booked_call` | `BOOKING_CREATED` webhook received from Cal.com. | **Zero dashboard access.** Cal calendar invite dispatched via Resend. |
| `proposal_sent` | Admin submits custom scoping terms & generates commercial quote. | **Portal access unlocked (Locked Preview).** Read-only quote view at `/dashboard/billing`. |
| `deposit_paid` | Razorpay webhook verifies initial setup deposit ($1,250 or $2,500). | **Onboarding unlocked.** `/dashboard/knowledge-base` unlocked for PDF uploads; `/dashboard/team` unlocked for agent invites. |
| `onboarding` | System receives $\ge 1$ approved SOP doc and helpdesk API webhook credentials. | **Integration inspector unlocked.** Status badges for document chunking and vector indexing. |
| `shadow_validation` | Systems engineer marks retrieval calibration complete. | **Draft review console unlocked.** `/dashboard/conversations` displays live helpdesk drafts with citation inspection. Live resolution disabled. |
| `balance_paid` | Razorpay webhook verifies final setup fee balance payment. | **Sign-off toggle enabled.** Client Admin can review 14-day calibration report. |
| `live` | Client Admin provides written authorization; autonomous routing enabled. | **Full operations unlocked.** Automated ticket resolution active; `/dashboard/analytics` charts live deflection. |
| `retainer_active` | Razorpay subscription webhook confirms $1,000/mo retainer charge. | **Full operations sustained.** Weekly engineering retrieval recalibrations and gap reports unlocked. |
| `paused` | Helpdesk disconnect or Razorpay renewal payment failure ($>7$ days grace). | **Autonomous answering halted.** System reverts to draft-only mode; banner displays billing resolution prompt. |
| `churned` | Explicit cancellation agreement or retainer termination. | **Read-only archive (30 days).** Model endpoints revoked; document vectors queued for cryptographic purge. |

---

## 2. Database Schema & Entity Relationships

Every table containing tenant-scoped data carries an `org_id UUID REFERENCES organizations(id) ON DELETE CASCADE`.

```
organizations (1) ──< memberships (N) >── (1) users
      │
      ├──< leads (N)
      ├──< bookings (N)
      ├──< invoices (1) ──< payments (N)
      ├──< subscriptions (1)
      ├──< documents (N)
      ├──< daily_metrics (N)
      ├──< policy_gaps (N)
      ├──< events (N)
      └──< audit_log (N)

webhook_events (global idempotent registry)
```

### Table Definitions

```sql
-- Enums
CREATE TYPE org_lifecycle_state AS ENUM (
  'lead', 'booked_call', 'proposal_sent', 'deposit_paid', 'onboarding',
  'shadow_validation', 'balance_paid', 'live', 'retainer_active', 'paused', 'churned'
);

CREATE TYPE user_role AS ENUM ('owner', 'client_admin', 'client_agent', 'client_viewer');
CREATE TYPE invoice_type AS ENUM ('setup_deposit', 'setup_balance', 'monthly_retainer');
CREATE TYPE invoice_status AS ENUM ('draft', 'issued', 'paid', 'overdue', 'void');
CREATE TYPE doc_status AS ENUM ('queued', 'indexing', 'ready', 'failed');
CREATE TYPE webhook_status AS ENUM ('pending', 'processed', 'failed');

-- 1. Organizations
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  status org_lifecycle_state NOT NULL DEFAULT 'lead',
  helpdesk_type TEXT,
  confidence_threshold NUMERIC(4,1) NOT NULL DEFAULT 92.0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Users (Mirrors auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  mfa_enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Memberships
CREATE TABLE memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'client_agent',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(org_id, user_id)
);

-- 4. Leads
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  turnstile_verified BOOLEAN NOT NULL DEFAULT false,
  source TEXT NOT NULL DEFAULT 'web_demo',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Bookings
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  cal_booking_id TEXT UNIQUE NOT NULL,
  event_time TIMESTAMPTZ NOT NULL,
  attendee_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Invoices
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  invoice_number TEXT UNIQUE NOT NULL,
  type invoice_type NOT NULL,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status invoice_status NOT NULL DEFAULT 'draft',
  due_date DATE NOT NULL,
  paid_at TIMESTAMPTZ,
  razorpay_invoice_id TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Payments
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE RESTRICT,
  razorpay_order_id TEXT NOT NULL,
  razorpay_payment_id TEXT UNIQUE NOT NULL,
  razorpay_signature TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL,
  method TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. Subscriptions
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  razorpay_subscription_id TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL,
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. Webhook Events (Idempotency table)
CREATE TABLE webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  event_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  status webhook_status NOT NULL DEFAULT 'pending',
  error_message TEXT,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_provider_event UNIQUE(provider, event_id)
);

-- 10. Operational Events
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 11. Daily Metrics
CREATE TABLE daily_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_conversations INTEGER NOT NULL DEFAULT 0,
  deflected_count INTEGER NOT NULL DEFAULT 0,
  escalated_count INTEGER NOT NULL DEFAULT 0,
  avg_confidence_score NUMERIC(4,1) NOT NULL DEFAULT 0.0,
  avg_latency_ms INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(org_id, date)
);

-- 12. Documents
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  filename TEXT NOT NULL,
  file_size_bytes BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  sha256_hash TEXT NOT NULL,
  chunk_count INTEGER NOT NULL DEFAULT 0,
  processing_status doc_status NOT NULL DEFAULT 'queued',
  indexed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 13. Policy Gaps
CREATE TABLE policy_gaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  query_text TEXT NOT NULL,
  unmatched_clause TEXT,
  frequency INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'unreviewed',
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 14. Audit Log
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## 3. Row Level Security (RLS) Policies

### Plain English Rules
1. **Helper Functions**: Extract the authenticated user's organization memberships and verify their role.
2. **Organizations**: Members can view their own organization. Only `owner` and `client_admin` can edit organization parameters.
3. **Users**: Users can read and update only their own profile.
4. **Memberships**: Members can view who is in their organization. Only `owner` and `client_admin` can create or remove memberships.
5. **Client Data (`documents`, `daily_metrics`, `policy_gaps`, `events`, `invoices`, `payments`, `subscriptions`)**: Users can access records matching an `org_id` where they possess an active membership. Mutations on sensitive billing or configuration are restricted to `owner` and `client_admin`.
6. **Audit Log**: Append-only by server actions. Members can view their organization's audit entries, but updates and deletions are universally blocked.
7. **Webhook Events**: Blocked from all client roles. Only accessible via the `service_role` key inside server webhook handlers.

### Production SQL Implementation

```sql
-- Enable RLS across all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE policy_gaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Helper: Retrieve tenant IDs accessible by the caller
CREATE OR REPLACE FUNCTION auth_user_org_ids()
RETURNS SETOF UUID STABLE SECURITY DEFINER AS $$
  SELECT org_id FROM memberships WHERE user_id = auth.uid();
$$ LANGUAGE sql;

-- Helper: Verify tenant role level
CREATE OR REPLACE FUNCTION auth_user_has_role(target_org_id UUID, required_roles user_role[])
RETURNS BOOLEAN STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM memberships 
    WHERE user_id = auth.uid() 
      AND org_id = target_org_id 
      AND role = ANY(required_roles)
  );
$$ LANGUAGE sql;

-- Policies: Organizations
CREATE POLICY "org_member_read" ON organizations FOR SELECT
  USING (id IN (SELECT auth_user_org_ids()));

CREATE POLICY "org_admin_update" ON organizations FOR UPDATE
  USING (auth_user_has_role(id, ARRAY['owner'::user_role, 'client_admin'::user_role]));

-- Policies: Users
CREATE POLICY "users_read_self" ON users FOR SELECT
  USING (id = auth.uid() OR id IN (
    SELECT user_id FROM memberships WHERE org_id IN (SELECT auth_user_org_ids())
  ));

CREATE POLICY "users_update_self" ON users FOR UPDATE
  USING (id = auth.uid());

-- Policies: Memberships
CREATE POLICY "memberships_org_read" ON memberships FOR SELECT
  USING (org_id IN (SELECT auth_user_org_ids()));

CREATE POLICY "memberships_admin_mutate" ON memberships FOR ALL
  USING (auth_user_has_role(org_id, ARRAY['owner'::user_role, 'client_admin'::user_role]));

-- Policies: Tenant Scoped Data Tables
CREATE POLICY "tenant_read_documents" ON documents FOR SELECT
  USING (org_id IN (SELECT auth_user_org_ids()));

CREATE POLICY "tenant_admin_write_documents" ON documents FOR INSERT
  WITH CHECK (auth_user_has_role(org_id, ARRAY['owner'::user_role, 'client_admin'::user_role]));

CREATE POLICY "tenant_read_metrics" ON daily_metrics FOR SELECT
  USING (org_id IN (SELECT auth_user_org_ids()));

CREATE POLICY "tenant_read_gaps" ON policy_gaps FOR SELECT
  USING (org_id IN (SELECT auth_user_org_ids()));

CREATE POLICY "tenant_read_invoices" ON invoices FOR SELECT
  USING (org_id IN (SELECT auth_user_org_ids()));

CREATE POLICY "tenant_read_payments" ON payments FOR SELECT
  USING (org_id IN (SELECT auth_user_org_ids()));

CREATE POLICY "tenant_read_subscriptions" ON subscriptions FOR SELECT
  USING (org_id IN (SELECT auth_user_org_ids()));

CREATE POLICY "tenant_read_events" ON events FOR SELECT
  USING (org_id IN (SELECT auth_user_org_ids()));

CREATE POLICY "tenant_read_audit" ON audit_log FOR SELECT
  USING (org_id IN (SELECT auth_user_org_ids()));

-- Webhook table: Strict server-only policy
CREATE POLICY "no_client_access_webhooks" ON webhook_events FOR ALL
  TO authenticated USING (false);
```

---

## 4. Authentication & Invite-Only Architecture

### Zero Public Registration
Public self-service signups are disabled in Supabase Auth (`enable_signup = false`). 
The `/auth/sign-up` route does not exist. The only entry routes into authentication are:
1. **Invite Email via Resend**: An Admin invites an agent. Supabase generates an `invite_user_by_email` token routed through a server action calling Resend with a branded email template.
2. **Magic Link / OTP**: Client agents sign in via passwordless email OTP sent by Resend.

### Enforced Two-Factor Authentication (MFA/TOTP)
- **Role Requirement**: The `owner` account and platform administrators must enroll in TOTP authentication before accessing the dashboard.
- **Middleware Enforcement**:
  Next.js `middleware.ts` inspects the Supabase JWT. If the user possesses the `owner` role in any organization, the middleware verifies the Authenticator Assurance Level:
  ```ts
  const { data: { user } } = await supabase.auth.getUser();
  const aal = user?.app_metadata?.aal || 'aal1';
  if (isOwner && aal !== 'aal2') {
    return NextResponse.redirect(new URL('/auth/mfa-verify', req.url));
  }
  ```
  If `aal2` is missing, all dashboard access is rejected until a valid 6-digit TOTP token is verified.

---

## 5. Working Logic vs. Simulated Matrix & Dashboard Upgrades

### Current State Analysis (from `PROJECT_MAP.md`)

| Surface / System | Current Implementation Status | Production Upgrade Required |
|---|---|---|
| **Marketing Site (`/`)** | **100% Real UI & Layout**. Particle Silk WebGL scene, responsive grid, dynamic SVG noise. | Retain as-is. Connect hero/final buttons directly to Cal.com modal. |
| **ROI Calculator (`savings-example.tsx`)** | **100% Real Logic**. Interactive sliders and math. | Retain client calculation; add "Email this Quote" server action saving to `leads`. |
| **Demo Chat API (`/api/demo`)** | **Real Logic**. Upstash Redis rate limiting, Turnstile token validation. | Retain for public testing. Point backend proxy to Supabase sandbox tenant. |
| **Authentication (`/auth/*`)** | **Simulated / Mock**. Uses hardcoded dummy user, stores plain mock token in `localStorage`. | **Replace completely.** Wire to `@supabase/ssr` cookies, disable localStorage token, add MFA view. |
| **Dashboard Shell & Pages (`/dashboard/*`)** | **Simulated / Mock**. Hardcoded in-memory fixtures in `mock-data.ts`. Gated by `DASHBOARD_PREVIEW` flag. | **Replace with real data queries.** (Detailed below). |

### Real Data Requirements for Dashboard Pages

1. `/dashboard` (Overview): Replace mock statistics with aggregated queries against `daily_metrics` (deflection rate, active conversation volume, quoted accuracy percentage).
2. `/dashboard/conversations`: Replace hardcoded messages with real-time subscription to `events` table (streaming incoming queries, retrieved chunk citations, and human escalations).
3. `/dashboard/knowledge-base`: Replace static table with Supabase Storage upload component. Files are hashed (SHA-256), stored in bucket `client-docs/{org_id}/`, and recorded in `documents`.
4. `/dashboard/assistant`: Connect threshold slider directly to `organizations.confidence_threshold` (enforced at 92.0% baseline).
5. `/dashboard/analytics`: Bind charts to `daily_metrics` history grouped by week/month.
6. `/dashboard/security`: Bind audit table to `audit_log`, displaying authenticated IP addresses and user agents.
7. `/dashboard/team`: Bind member table to `memberships` join `users`. Add "Invite Teammate" modal calling Supabase invite action.
8. `/dashboard/billing`: Replace mock plan cards with Razorpay subscription telemetry, showing active status, renewal dates, and payment history from `invoices` and `payments`.
9. `/dashboard/settings`: Allow editing organization name and rotating webhook endpoints.

---

## 6. Environment Variables Matrix

All secret variables live exclusively on the server and are never referenced in client code.

| Variable Name | Environment | Security Classification | Purpose |
|---|---|---|---|
| `NEXT_PUBLIC_APP_URL` | Browser & Server | Public | Base URL for absolute redirects and canonical tags (`https://aegisdesk.com`). |
| `NEXT_PUBLIC_SUPABASE_URL` | Browser & Server | Public | Supabase project API gateway endpoint. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser & Server | Public (Restricted by RLS) | Supabase anonymous API key for client-side Auth sessions. |
| `SUPABASE_SERVICE_ROLE_KEY` | Server Only | **Critical Secret** | Superuser key bypassing RLS for webhook event processing and admin tasks. |
| `RAZORPAY_KEY_ID` | Browser & Server | Public | Razorpay Checkout identifier loaded in browser payment modal. |
| `RAZORPAY_KEY_SECRET` | Server Only | **Critical Secret** | Razorpay secret key used for signing orders and verifying payment signatures. |
| `RAZORPAY_WEBHOOK_SECRET` | Server Only | **Critical Secret** | Secret HMAC salt used to authenticate Razorpay webhook payloads. |
| `CAL_WEBHOOK_SECRET` | Server Only | **Critical Secret** | Secret key verifying HMAC-SHA256 signatures from Cal.com booking events. |
| `RESEND_API_KEY` | Server Only | **Critical Secret** | API token used to dispatch onboarding invites and receipts. |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Browser & Server | Public | Cloudflare Turnstile public site key for client challenge widgets. |
| `TURNSTILE_SECRET_KEY` | Server Only | **Critical Secret** | Cloudflare Turnstile secret key verifying challenge tokens on the server. |
| `UPSTASH_REDIS_REST_URL` | Server Only | **Critical Secret** | Upstash Redis REST endpoint for distributed rate-limiting. |
| `UPSTASH_REDIS_REST_TOKEN` | Server Only | **Critical Secret** | Upstash Redis authentication token. |

---

## 7. Ten Core Systemic Risks & Defensive Mitigations

### 1. Razorpay Webhook Signature Replay & Double Crediting
- **Risk**: An attacker intercepts or replays a successful payment webhook to artificially move an organization from `deposit_paid` to `live` without transferring funds.
- **Defense**: Store every event in `webhook_events` with a unique constraint `UNIQUE(provider, event_id)`. Validate the cryptographic HMAC signature (`crypto.createHmac('sha256', secret)`) on the raw request buffer before processing. If `event_id` already exists, immediately return HTTP 200 without mutating balances.

### 2. Multi-Tenant Cross-Contamination via Vector Retrieval
- **Risk**: A customer support query submitted by Client A retrieves confidential SOP clauses from Client B's vector index.
- **Defense**: Storage buckets and vector namespaces are isolated using the tenant's `org_id`. Every database and vector search query attaches an immutable filter: `WHERE org_id = $auth_org_id`. RLS enforces that even if an application bug omits the parameter, the database layer rejects cross-tenant reads.

### 3. Untrusted Browser-Supplied Pricing & Role Privilege Escalation
- **Risk**: A user tampers with the DOM or HTTP payload to request a setup payment of $1.00 or grant themselves the `owner` role.
- **Defense**: The server never trusts client-supplied amounts, roles, or organization IDs. Invoices and Razorpay orders are generated exclusively by server actions reading hardcoded constants ($2,500 setup, $1,000 retainer). Role changes require an active `owner` membership verified in Postgres.

### 4. Webhook Cold Starts & Timeout Failures
- **Risk**: Vercel serverless cold starts exceed Razorpay or Cal.com's 5-second webhook delivery window, causing retries and out-of-order state execution.
- **Defense**: Webhook endpoints perform zero synchronous processing. They immediately validate signatures, write the raw payload to `webhook_events` with status `pending`, and return HTTP 200 within 400ms. An asynchronous background worker processes the event idempotently.

### 5. Malicious Document Uploads & Macro Injection
- **Risk**: An onboarding client uploads weaponized PDFs, executables, or prompt-injection macros disguised as support manuals.
- **Defense**: Uploads are restricted to `application/pdf` and `text/plain` capped at 15MB. Files are verified via magic bytes inspection, hashed with SHA-256, and processed in an isolated text-extraction sandbox. Raw binary macros are stripped before chunking.

### 6. Service Role Key Leakage in Client Bundles
- **Risk**: Accidental import of `SUPABASE_SERVICE_ROLE_KEY` into a client component grants any browser user full admin database access.
- **Defense**: Enforce Next.js build-time guardrails with `import 'server-only'` in all database client wrappers. Run automated AST verification during CI to verify `SUPABASE_SERVICE_ROLE_KEY` does not appear in `.next/static` output.

### 7. Denial-of-Wallet & LLM Inference Flooding
- **Risk**: Attackers flood the interactive demo or client support assistant with automated requests, exhausting API compute budgets.
- **Defense**: Three-layer rate limiting: Cloudflare Turnstile blocks automated scripts; Upstash Redis enforces IP and session limits (5 queries per session, 10 queries per IP/day); FastAPI backend imposes a hard concurrency cap per client tenant.

### 8. Stale or Desynchronized Booking State
- **Risk**: A lead books a call on Cal.com, but network drops prevent the webhook from reaching the server, leaving the lead stranded.
- **Defense**: Resend dispatches a calendar invite with a fallback confirmation link directly to the attendee. A daily cron reconciliation job queries the Cal.com REST API for all bookings in the last 24 hours to sync missing booking records.

### 9. Transactional Email Failure on Time-Sensitive Invites
- **Risk**: Spam filters or provider outages drop Resend invite emails, preventing client executives from accessing their 14-day Shadow Mode.
- **Defense**: All outgoing emails log their Resend `message_id` into `events`. If an invite email bounces or fails, the dashboard displays a secure "Copy Direct One-Time Invite Link" button available only to the `owner` or `client_admin`.

### 10. Session Fixation & Owner Account Takeover
- **Risk**: An attacker steals an owner's session token to tamper with the system prompt or lower the confidence threshold below 92.0%.
- **Defense**: Supabase Auth sessions use `httpOnly`, `secure`, `sameSite=lax` cookies. Rotating refresh tokens invalidate previous sessions upon new token generation. The `owner` role requires mandatory TOTP verification (`aal2`); without a fresh MFA challenge, sensitive settings updates are rejected by the server.

---

## 8. Clean Modular Codebase Organization (Post-Tidy Up)

Following the refactoring pass, the codebase is structured into strict architectural domains with zero dead or duplicate code:

- **`src/app/`**: Next.js App Router (maintaining 100% URL parity across all 41 public, auth, portal, operator, and API routes).
- **`src/components/`**: Clean separation into `ui/` (design system primitives), `marketing/` (conversion sections), `portal/` (client dashboard controls), `admin/` (operator console controls), `scenes/` (Three.js 3D shaders), `layout/` (global nav, footer, status), and `brand/` (vector mark & lockup).
- **`src/lib/`**: Domain-isolated business logic:
  - `auth/`: Server-authoritative user loader & client context
  - `db/`: Supabase admin/client/server, events store, and seed datasets
  - `payments/`: Razorpay order creation, verification, and PDF invoice generation
  - `calendar/`: Cal.com booking sync and HMAC signature verification
  - `email/`: Resend transactional templates & spend alerts
  - `security/`: PII scrubbing, CSP builder, Turnstile, kill-switch, and prompt injection defense
  - `metrics/`: Hourly and daily aggregation rollups
  - `validation/`: Zod schemas & API types
  - `monitoring/`: Sentry error telemetry & PII sanitization
- **`tests/`**: Centralized test suite organized into `tests/unit/` (billing, cal, metrics, security) and `tests/attack/` (prompt-injection, tenant-isolation).
- **`_archive/`**: Preserves dead and duplicate legacy files (`sylva-hero.tsx`, `demo-section.tsx`, `dot-matrix-bg.tsx`, `progress.tsx`, `skeleton.tsx`, `InterVariable.woff2`, `demo-turnstile.ts`). Nothing is deleted.

