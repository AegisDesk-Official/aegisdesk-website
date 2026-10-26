-- =====================================================================
-- AegisDesk Schema Migration: Initial Core Schema & RLS Policies
-- Target: Supabase Postgres
-- =====================================================================

-- Enums
CREATE TYPE org_lifecycle_state AS ENUM (
  'lead', 'booked_call', 'proposal_sent', 'deposit_paid', 'onboarding',
  'shadow_mode', 'balance_paid', 'live', 'retainer_active', 'paused', 'churned'
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
  is_demo BOOLEAN NOT NULL DEFAULT false,
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

-- =====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================================

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

-- Policies: Leads
CREATE POLICY "leads_org_read" ON leads FOR SELECT
  USING (org_id IN (SELECT auth_user_org_ids()));

CREATE POLICY "leads_admin_mutate" ON leads FOR ALL
  USING (auth_user_has_role(org_id, ARRAY['owner'::user_role, 'client_admin'::user_role]));

-- Policies: Bookings
CREATE POLICY "bookings_org_read" ON bookings FOR SELECT
  USING (org_id IN (SELECT auth_user_org_ids()));

CREATE POLICY "bookings_admin_mutate" ON bookings FOR ALL
  USING (auth_user_has_role(org_id, ARRAY['owner'::user_role, 'client_admin'::user_role]));

-- Policies: Tenant Scoped Data Tables
CREATE POLICY "tenant_read_documents" ON documents FOR SELECT
  USING (org_id IN (SELECT auth_user_org_ids()));

CREATE POLICY "tenant_admin_write_documents" ON documents FOR INSERT
  WITH CHECK (auth_user_has_role(org_id, ARRAY['owner'::user_role, 'client_admin'::user_role]));

CREATE POLICY "tenant_admin_delete_documents" ON documents FOR DELETE
  USING (auth_user_has_role(org_id, ARRAY['owner'::user_role, 'client_admin'::user_role]));

CREATE POLICY "tenant_read_metrics" ON daily_metrics FOR SELECT
  USING (org_id IN (SELECT auth_user_org_ids()));

CREATE POLICY "tenant_read_gaps" ON policy_gaps FOR SELECT
  USING (org_id IN (SELECT auth_user_org_ids()));

CREATE POLICY "tenant_admin_update_gaps" ON policy_gaps FOR UPDATE
  USING (auth_user_has_role(org_id, ARRAY['owner'::user_role, 'client_admin'::user_role]));

CREATE POLICY "tenant_read_invoices" ON invoices FOR SELECT
  USING (org_id IN (SELECT auth_user_org_ids()));

CREATE POLICY "tenant_admin_mutate_invoices" ON invoices FOR ALL
  USING (auth_user_has_role(org_id, ARRAY['owner'::user_role, 'client_admin'::user_role]));

CREATE POLICY "tenant_read_payments" ON payments FOR SELECT
  USING (org_id IN (SELECT auth_user_org_ids()));

CREATE POLICY "tenant_read_subscriptions" ON subscriptions FOR SELECT
  USING (org_id IN (SELECT auth_user_org_ids()));

CREATE POLICY "tenant_read_events" ON events FOR SELECT
  USING (org_id IN (SELECT auth_user_org_ids()));

CREATE POLICY "tenant_write_events" ON events FOR INSERT
  WITH CHECK (auth_user_has_role(org_id, ARRAY['owner'::user_role, 'client_admin'::user_role, 'client_agent'::user_role]));

-- Audit Log (append-only by tenant members, viewable by tenant members, no updates/deletes)
CREATE POLICY "tenant_read_audit" ON audit_log FOR SELECT
  USING (org_id IN (SELECT auth_user_org_ids()));

CREATE POLICY "tenant_append_audit" ON audit_log FOR INSERT
  WITH CHECK (org_id IN (SELECT auth_user_org_ids()));

-- Webhook table: Strict server-only policy
CREATE POLICY "no_client_access_webhooks" ON webhook_events FOR ALL
  TO authenticated USING (false);
