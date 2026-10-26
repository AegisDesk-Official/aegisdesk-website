-- =====================================================================
-- AegisDesk Migration: Events API, Idempotency & Per-Org Settings
-- =====================================================================

-- 1. Add per-organization configuration and API credentials to organizations
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS api_secret TEXT NOT NULL DEFAULT 'sec_demo_aegis_key_001',
ADD COLUMN IF NOT EXISTS avg_handle_minutes NUMERIC(5,2) NOT NULL DEFAULT 11.8,
ADD COLUMN IF NOT EXISTS agent_hourly_cost NUMERIC(6,2) NOT NULL DEFAULT 30.0,
ADD COLUMN IF NOT EXISTS reporting_currency TEXT NOT NULL DEFAULT 'USD';

-- 2. Enhance events table for high-throughput idempotent ingestion
ALTER TABLE events
ADD COLUMN IF NOT EXISTS event_id TEXT,
ADD COLUMN IF NOT EXISTS occurred_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS ticket_ref TEXT,
ADD COLUMN IF NOT EXISTS channel TEXT,
ADD COLUMN IF NOT EXISTS topic TEXT,
ADD COLUMN IF NOT EXISTS check_number INTEGER,
ADD COLUMN IF NOT EXISTS reason TEXT,
ADD COLUMN IF NOT EXISTS latency_ms INTEGER,
ADD COLUMN IF NOT EXISTS model_cost_usd NUMERIC(8,6),
ADD COLUMN IF NOT EXISTS edit_distance INTEGER;

-- Unique constraint for idempotent event ingestion per organization
CREATE UNIQUE INDEX IF NOT EXISTS uq_org_event_id ON events (org_id, event_id);
CREATE INDEX IF NOT EXISTS idx_events_org_type_occurred ON events (org_id, event_type, occurred_at);
CREATE INDEX IF NOT EXISTS idx_events_ticket_ref ON events (org_id, ticket_ref);

-- 3. Rejected events audit table for owner console security telemetry
CREATE TABLE IF NOT EXISTS rejected_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  event_id TEXT,
  reason TEXT NOT NULL,
  client_ip INET,
  user_agent TEXT,
  provided_timestamp TEXT,
  provided_signature TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE rejected_events ENABLE ROW LEVEL SECURITY;

-- Block client access to rejected events (accessible only by service_role and owner)
CREATE POLICY "owner_read_rejected_events" ON rejected_events FOR SELECT
  USING (EXISTS (SELECT 1 FROM memberships WHERE user_id = auth.uid() AND role = 'owner'));

-- 4. Expanded metrics columns in daily_metrics for rollups
ALTER TABLE daily_metrics
ADD COLUMN IF NOT EXISTS tickets_handled INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS drafts_created INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS drafts_passed_all_checks INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS handed_to_human_count INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS check_1_blocked INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS check_2_blocked INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS check_3_blocked INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS reply_approved_count INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS reply_edited_count INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS reply_rejected_count INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS reply_auto_resolved_count INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS median_latency_ms INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS p95_latency_ms INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_model_cost_usd NUMERIC(10,4) NOT NULL DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS time_saved_hours NUMERIC(8,2) NOT NULL DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS cost_saved_usd NUMERIC(10,2) NOT NULL DEFAULT 0.0;
