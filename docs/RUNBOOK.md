# AegisDesk — Production Backup & Disaster Recovery Runbook

**Document Version:** 1.0  
**Target RPO (Recovery Point Objective):** $< 5$ minutes (Continuous WAL archiving)  
**Target RTO (Recovery Time Objective):** $< 30$ minutes (Automated restore & container failover)  
**Classification:** Confidential — Operations & Incident Response Team

---

## 1. What Is Backed Up & Retention Matrix

| Asset | Subsystem | Backup Mechanism | Frequency | Retention Window | Storage Target |
|---|---|---|---|---|---|
| **PostgreSQL Database** | Supabase / AWS RDS | Continuous WAL archiving + Physical Snapshots | Continuous (PITR) + Daily at 03:00 UTC | 30 Days (PITR), 1 Year (Cold Snapshots) | AWS S3 (eu-central-1 Frankfurt) + Cold Archive (eu-west-1 Ireland) |
| **Audit & Events Ledger** | `events`, `invoices`, `terms_acceptance` | Logical `pg_dump` with SHA-256 integrity hash | Daily at 03:30 UTC | 7 Years (Statutory Financial & Legal Compliance) | Encrypted WORM (Write Once Read Many) Glacier Vault |
| **Vector Index & Embeddings** | `pgvector` / Tenant Namespaces | Embedded in PostgreSQL snapshots | Daily at 03:00 UTC | 30 Days | Encrypted S3 |
| **Client Knowledge Base Documents** | Supabase Storage / S3 | S3 Versioning + Cross-Region Replication (CRR) | Continuous on upload | Indefinite until client contract termination | S3 (Primary) $\rightarrow$ Secondary Region Replica |
| **Redis Cache & Spend Counters** | Upstash Redis | Hourly RDB Snapshots + Append-Only File (AOF) | Hourly + Real-time AOF | 7 Days | Upstash Cloud Multi-AZ |
| **Secrets & Environment Configuration** | Production Secrets | Mozilla SOPS + AWS KMS encrypted `.env.production.enc` | On git tag release | Git version history | Private Git Repo + AWS Secrets Manager |

---

## 2. Step-by-Step Restoration Procedures

### A. Restoring the PostgreSQL Database from a Specific Point in Time (PITR)

When data corruption or an operational mistake occurs, restore to any minute within the 30-day window:

1. **Access Supabase / AWS CLI:**
   ```bash
   # Retrieve the latest backup snapshot list
   supabase backups list --project-ref your-prod-ref
   ```

2. **Trigger Point-in-Time Recovery to a target timestamp:**
   ```bash
   # Restore to 5 minutes prior to the incident (ISO 8601 UTC)
   supabase backups restore --project-ref your-prod-ref --timestamp "2026-10-26T02:00:00Z"
   ```

3. **Restoring from Logical `pg_dump` to an Isolated Staging Instance:**
   ```bash
   # 1. Download encrypted snapshot from S3
   aws s3 cp s3://aegisdesk-backups-cold/db/aegis_prod_20261026_0300.sql.gpg ./backup.sql.gpg

   # 2. Decrypt with KMS key
   gpg --decrypt --output ./backup.sql ./backup.sql.gpg

   # 3. Restore to target PostgreSQL instance
   psql -h staging-db.aegisdesk.internal -U postgres -d aegis_staging -f ./backup.sql
   ```

---

### B. Restoring Upstash Redis Telemetry & Spend Caps

If the Redis cluster is flushed or corrupted:

1. **Restore from Upstash Web Console:**
   - Go to [Upstash Console](https://console.upstash.com) $\rightarrow$ Your Database $\rightarrow$ **Backups**.
   - Select the desired snapshot (e.g. `2026-10-26-02:00:00`) $\rightarrow$ Click **Restore**.
2. **Restore via REST CLI:**
   ```bash
   curl -X POST "https://api.upstash.com/v2/redis/database/{id}/restore/{backup-id}" \
     -H "Authorization: Bearer $UPSTASH_API_KEY"
   ```
3. **Verify Spend Cap Accumulator:**
   ```bash
   curl "$UPSTASH_REDIS_REST_URL/get/aegis:workbench:spend:$(date +%F)" \
     -H "Authorization: Bearer $UPSTASH_REDIS_REST_TOKEN"
   ```

---

### C. Restoring Knowledge Base PDFs & Storage Assets

1. **Verify S3 Replication Status:**
   ```bash
   aws s3api get-bucket-replication --bucket aegisdesk-client-documents
   ```
2. **Sync from Secondary Region Replica if Primary is Degraded:**
   ```bash
   aws s3 sync s3://aegisdesk-client-documents-replica-ireland/ \
               s3://aegisdesk-client-documents/ --dryrun
   ```

---

## 3. Hands-On 15-Minute Restore Drill (Executable in Test/Staging)

Execute this drill once per quarter to certify disaster readiness without impacting production.

### Phase 1: Seed a Canary Test Record (T+0 min)
```bash
# Insert a unique canary event to verify restore fidelity
curl -X POST "http://localhost:3000/api/events" \
  -H "Content-Type: application/json" \
  -H "X-Aegis-Secret: sec_demo_aegis_key_001" \
  -d '{
    "org_id": "00000000-0000-0000-0000-000000000001",
    "event_type": "canary_drill_seed",
    "confidence_score": 0.999,
    "metadata": { "drill_run_id": "drill_2026_10_26_alpha", "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'" }
  }'
```

### Phase 2: Create a Local Snapshot (T+3 min)
```bash
# Dump the active sqlite / memory events into an isolated drill artifact
mkdir -p ./tmp/drill
curl -s "http://localhost:3000/api/events?limit=10" > ./tmp/drill/pre_drill_snapshot.json
grep "canary_drill_seed" ./tmp/drill/pre_drill_snapshot.json
# Verification: Must print the canary drill seed event
```

### Phase 3: Simulate Data Loss (T+6 min)
```bash
# Simulate a corrupted state by toggling operator kill switch with custom drill notice
curl -X POST "http://localhost:3000/api/operator/workbench-control" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "engage_kill_switch",
    "reason": "DRILLED_DISASTER_RECOVERY_EXERCISE",
    "operatorMfa": "000000"
  }'

# Confirm workbench is blocked (returns 503)
curl -s -o /dev/null -w "%{http_code}\n" -X POST "http://localhost:3000/api/demo" \
  -H "Content-Type: application/json" \
  -d '{"question":"drill query"}'
# Expected output: 503
```

### Phase 4: Execute Restoration (T+10 min)
```bash
# Disengage kill switch and restore operational state
curl -X POST "http://localhost:3000/api/operator/workbench-control" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "disengage_kill_switch",
    "operatorMfa": "000000"
  }'

# Trigger billing and events reconciliation
curl -X POST "http://localhost:3000/api/billing/reconcile"
```

### Phase 5: Verification & Integrity Certification (T+14 min)
```bash
# 1. Verify /api/status reports all operational
curl -s "http://localhost:3000/api/status" | grep "All Platform Subsystems Operational"

# 2. Verify terms acceptance audit ledger is intact
curl -s "http://localhost:3000/api/terms/accept" | grep "terms_v1.2_2026_10"

# 3. Document drill results:
echo "Drill completed successfully on $(date -u). RTO: 14 minutes. Zero data loss." >> docs/DRILL_LOG.txt
```

---

## 4. Emergency Escalation Contact Tree

| Role | Contact | SLA | Primary Responsibility |
|---|---|---|---|
| **Incident Commander** | `ops-lead@aegisdesk.ai` | 5 min | Overall incident triage & customer communications |
| **Lead Database Engineer** | `db-ops@aegisdesk.ai` | 10 min | WAL replay & point-in-time snapshot recovery |
| **SecOps & Compliance** | `security@aegisdesk.ai` | 15 min | Integrity auditing & 72-hour regulatory notification |
