-- =====================================================================
-- AegisDesk Seed Script: Organizations, Users, Memberships, & Tenant Data
-- Target: Supabase Postgres
-- =====================================================================

-- 1. Create Organizations (Org A, Org B, and one is_demo workspace)
INSERT INTO organizations (id, name, slug, status, helpdesk_type, confidence_threshold, is_demo, api_secret, avg_handle_minutes, agent_hourly_cost, reporting_currency)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'Apex Retail (Org A)', 'org-a', 'live', 'zendesk', 92.0, false, 'sec_live_apex_9812487123', 11.8, 30.0, 'USD'),
  ('00000000-0000-0000-0000-000000000002', 'Beacon Logistics (Org B)', 'org-b', 'live', 'freshdesk', 92.0, false, 'sec_live_beacon_1928471203', 14.2, 32.5, 'USD'),
  ('00000000-0000-0000-0000-000000000003', 'AegisDesk Interactive Demo', 'org-demo', 'shadow_mode', 'custom_webhook', 92.0, true, 'sec_demo_aegis_key_001', 11.8, 30.0, 'USD')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  status = EXCLUDED.status,
  is_demo = EXCLUDED.is_demo,
  api_secret = EXCLUDED.api_secret,
  avg_handle_minutes = EXCLUDED.avg_handle_minutes,
  agent_hourly_cost = EXCLUDED.agent_hourly_cost,
  reporting_currency = EXCLUDED.reporting_currency;

-- 2. Mock Users (in public.users table; corresponds with Supabase Auth identities)
INSERT INTO users (id, email, full_name, mfa_enabled)
VALUES
  ('10000000-0000-0000-0000-000000000000', 'owner@aegisdesk.ai', 'System Owner (Executive)', true),
  ('10000000-0000-0000-0000-000000000001', 'admin@orga.com', 'Alex Morgan (Org A Admin)', false),
  ('10000000-0000-0000-0000-000000000002', 'agent@orga.com', 'Sam Chen (Org A Agent)', false),
  ('20000000-0000-0000-0000-000000000001', 'admin@orgb.com', 'Elena Rostova (Org B Admin)', false),
  ('20000000-0000-0000-0000-000000000002', 'agent@orgb.com', 'Marcus Vance (Org B Agent)', false)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  mfa_enabled = EXCLUDED.mfa_enabled;

-- 3. Memberships
INSERT INTO memberships (id, org_id, user_id, role)
VALUES
  -- Platform Owner has owner membership across orgs
  ('a0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000000', 'owner'),
  ('a0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000000', 'owner'),
  ('a0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000000', 'owner'),

  -- Org A Memberships
  ('b0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'client_admin'),
  ('b0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'client_agent'),

  -- Org B Memberships
  ('c0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', 'client_admin'),
  ('c0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', 'client_agent')
ON CONFLICT (org_id, user_id) DO UPDATE SET role = EXCLUDED.role;

-- 4. Invoices
INSERT INTO invoices (id, org_id, invoice_number, type, amount_cents, currency, status, due_date, paid_at)
VALUES
  ('d0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'INV-APEX-001', 'setup_deposit', 250000, 'USD', 'paid', CURRENT_DATE - 30, now() - INTERVAL '30 days'),
  ('d0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'INV-APEX-002', 'monthly_retainer', 100000, 'USD', 'paid', CURRENT_DATE - 2, now() - INTERVAL '2 days'),
  ('d0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002', 'INV-BEACON-001', 'setup_deposit', 250000, 'USD', 'paid', CURRENT_DATE - 15, now() - INTERVAL '15 days')
ON CONFLICT (id) DO NOTHING;

-- 5. Documents
INSERT INTO documents (id, org_id, storage_path, filename, file_size_bytes, mime_type, sha256_hash, chunk_count, processing_status, indexed_at)
VALUES
  ('e0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'org-a/docs/apex_refund_v2.pdf', 'apex_refund_v2.pdf', 342000, 'application/pdf', 'a1b2c3d4e5f6001', 42, 'ready', now() - INTERVAL '20 days'),
  ('e0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 'org-b/docs/beacon_freight_sla.pdf', 'beacon_freight_sla.pdf', 812000, 'application/pdf', 'a1b2c3d4e5f6002', 98, 'ready', now() - INTERVAL '10 days'),
  ('e0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003', 'org-demo/docs/sample_policy.pdf', 'sample_policy.pdf', 124000, 'application/pdf', 'a1b2c3d4e5f6003', 18, 'ready', now() - INTERVAL '5 days')
ON CONFLICT (id) DO NOTHING;

-- 6. Daily Metrics
INSERT INTO daily_metrics (id, org_id, date, total_conversations, deflected_count, escalated_count, avg_confidence_score, avg_latency_ms)
VALUES
  ('f0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', CURRENT_DATE, 142, 114, 28, 94.6, 740),
  ('f0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', CURRENT_DATE, 88, 71, 17, 93.8, 810),
  ('f0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003', CURRENT_DATE, 25, 20, 5, 95.1, 620)
ON CONFLICT (org_id, date) DO NOTHING;

-- 7. Policy Gaps
INSERT INTO policy_gaps (id, org_id, query_text, unmatched_clause, frequency, status)
VALUES
  ('11000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Can I exchange items after 45 days if tags are intact?', 'Returns allowed strictly within 30 days of delivery.', 14, 'unreviewed'),
  ('11000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 'Does insurance cover perishable goods spoilage in transit?', 'Cargo loss standard excludes ambient spoilage unless refrigerated seal verified.', 9, 'unreviewed')
ON CONFLICT (id) DO NOTHING;

-- 8. Audit Log
INSERT INTO audit_log (id, org_id, user_id, action, resource_type, resource_id, metadata)
VALUES
  ('22000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'upload_document', 'document', 'e0000000-0000-0000-0000-000000000001', '{"filename": "apex_refund_v2.pdf"}'),
  ('22000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', 'upload_document', 'document', 'e0000000-0000-0000-0000-000000000002', '{"filename": "beacon_freight_sla.pdf"}')
ON CONFLICT (id) DO NOTHING;
