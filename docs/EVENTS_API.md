# AegisDesk Events API Specification

**Version:** 1.0.0  
**Target Ingestion Endpoint:** `POST /api/events`  
**Rollup Endpoint:** `POST /api/events/rollup`  
**Protocol:** HTTPS / JSON with Cryptographic HMAC-SHA256 Authentication  

---

## 1. Overview & Architectural Principles

The AegisDesk Events API is the telemetry backbone connecting your production customer support pipelines (FastAPI inference engine, Zendesk, Freshdesk, Gorgias, Salesforce Service Cloud, or custom routing agents) to the AegisDesk Control Room.

### Core Architectural Invariants:
1. **Zero Customer PII or Message Text**:  
   The Events API **strictly rejects** any payload containing customer message bodies, email addresses, names, or unredacted text (`message`, `message_text`, `email`, `customer_name`, `body`). All tickets are tracked solely through opaque identifiers (`ticket_ref` e.g., `zen_94812`).
2. **Cryptographic HMAC-SHA256 Authentication**:  
   Every payload must be signed using the organization's unique `api_secret`.
3. **Replay Attack Defense**:  
   Signatures include a Unix timestamp. Payloads older than 5 minutes or skewed into the future by >5 seconds are immediately rejected with `401 Unauthorized` and logged to the owner's security incident log.
4. **Strict Idempotency**:  
   Events are deduplicated on `(org_id, event_id)`. Re-transmitting an event returns `200 OK` with `status: "duplicate"`.

---

## 2. Authentication & Request Headers

Every request to `POST /api/events` must provide two cryptographic headers:

| Header | Description | Example |
| :--- | :--- | :--- |
| `X-Aegis-Timestamp` | Current Unix epoch timestamp in seconds or milliseconds. | `1730000000` |
| `X-Aegis-Signature` | Hexadecimal HMAC-SHA256 signature calculated over `${timestamp}.${rawBody}`. | `8f4b23c9...a1` |
| `Content-Type` | Standard JSON header. | `application/json` |

### HMAC Signing Algorithm
```text
payload_to_sign = "${X-Aegis-Timestamp}.${RAW_JSON_BODY_STRING}"
signature = HMAC_SHA256(key = ORG_API_SECRET, data = payload_to_sign).hexdigest()
```

---

## 3. Supported Event Types

The event life cycle maps to the AegisDesk 3-Gate Corrective RAG pipeline:

| Event Type | Gate / Phase | Trigger Condition |
| :--- | :--- | :--- |
| `ticket_received` | Ingestion | Inbound support ticket received by helpdesk webhook. |
| `draft_created` | Generation | AI inference engine generated an initial answer candidate. |
| `check_passed` | Gate 1, 2, or 3 | Draft successfully passed a specific verification gate. |
| `check_blocked` | Gate 1, 2, or 3 | Draft failed a verification gate (unverified claims, low confidence, etc.). |
| `handed_to_human` | Escalation | Query routed to human agent queue with specific reason code. |
| `reply_approved` | Shadow Mode | Human agent reviewed and accepted the AI draft without edits. |
| `reply_edited` | Shadow Mode | Human agent edited the AI draft before sending (`edit_distance` recorded). |
| `reply_rejected` | Shadow Mode | Human agent discarded the draft and wrote a completely new response. |
| `reply_sent` | Live Production | Verified response dispatched directly to customer (`edit_distance: 0`). |

---

## 4. Event Schema & Field Reference

### Single Event Schema
```typescript
interface AegisEvent {
  org_id: string;              // Tenant UUID or slug (e.g., "00000000-0000-0000-0000-000000000003")
  event_id: string;            // Unique event UUID or monotonic string for idempotency
  type: string;                // One of the 9 supported event types
  occurred_at?: string;        // ISO 8601 UTC timestamp (defaults to current time)
  ticket_ref: string;          // Opaque ticket ID (e.g., "zen_94812", "fresh_10482")
  channel: string;             // "zendesk" | "freshdesk" | "email" | "chat" | "slack"
  topic?: string;              // Topic classification (e.g., "billing", "return_policy")
  check?: 1 | 2 | 3;           // Gate index (1: Source Grounding, 2: Self-Correction, 3: Deterministic Policy)
  reason?: string;             // Reason code ("no_source" | "low_confidence" | "conflicting_policy" | "sensitive_topic")
  latency_ms?: number;         // Generation / verification latency in milliseconds
  model_cost_usd?: number;     // Direct LLM inference cost (e.g., 0.0042)
  edit_distance?: number;      // Levenshtein character edit distance by human reviewer
}
```

### Batch Ingestion
You may submit a single event or a batch of up to 500 events in a single HTTP request:
```json
{
  "events": [
    {
      "org_id": "00000000-0000-0000-0000-000000000003",
      "event_id": "evt_98471928374",
      "type": "ticket_received",
      "occurred_at": "2026-10-26T00:15:30.000Z",
      "ticket_ref": "zen_88192",
      "channel": "zendesk",
      "topic": "enterprise_sla"
    },
    {
      "org_id": "00000000-0000-0000-0000-000000000003",
      "event_id": "evt_98471928375",
      "type": "draft_created",
      "occurred_at": "2026-10-26T00:15:30.220Z",
      "ticket_ref": "zen_88192",
      "channel": "zendesk",
      "topic": "enterprise_sla",
      "latency_ms": 220,
      "model_cost_usd": 0.0045
    }
  ]
}
```

---

## 5. Implementation Code Examples

### Python (FastAPI / Celery Integration)
```python
import hmac
import hashlib
import time
import json
import requests

def send_aegis_event(org_id: str, api_secret: str, event_data: dict):
    url = "https://your-domain.com/api/events"
    payload = json.dumps({"events": [event_data]})
    timestamp = str(int(time.time()))
    
    # Compute HMAC-SHA256
    to_sign = f"{timestamp}.{payload}".encode("utf-8")
    signature = hmac.new(api_secret.encode("utf-8"), to_sign, hashlib.sha256).hexdigest()
    
    headers = {
        "Content-Type": "application/json",
        "X-Aegis-Timestamp": timestamp,
        "X-Aegis-Signature": signature
    }
    
    response = requests.post(url, data=payload, headers=headers, timeout=5.0)
    response.raise_for_status()
    return response.json()
```

### Node.js / TypeScript
```typescript
import crypto from "crypto";

export async function sendAegisEvents(orgId: string, apiSecret: string, events: any[]) {
  const url = "https://your-domain.com/api/events";
  const payload = JSON.stringify({ events });
  const timestamp = Math.floor(Date.now() / 1000).toString();

  const signature = crypto
    .createHmac("sha256", apiSecret)
    .update(`${timestamp}.${payload}`)
    .digest("hex");

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Aegis-Timestamp": timestamp,
      "X-Aegis-Signature": signature,
    },
    body: payload,
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(`Events API error: ${JSON.stringify(error)}`);
  }

  return await res.json();
}
```

### cURL Example
```bash
TIMESTAMP=$(date +%s)
SECRET="sec_demo_aegis_key_001"
BODY='{"events":[{"org_id":"00000000-0000-0000-0000-000000000003","event_id":"evt_demo_101","type":"ticket_received","ticket_ref":"zen_1001","channel":"zendesk"}]}'
SIGNATURE=$(echo -n "${TIMESTAMP}.${BODY}" | openssl dgst -sha256 -hmac "${SECRET}" | sed 's/^.* //')

curl -X POST https://your-domain.com/api/events \
  -H "Content-Type: application/json" \
  -H "X-Aegis-Timestamp: ${TIMESTAMP}" \
  -H "X-Aegis-Signature: ${SIGNATURE}" \
  -d "${BODY}"
```

---

## 6. HTTP Status Codes & Error Responses

| Status Code | Code Identifier | Description | Remediation |
| :--- | :--- | :--- | :--- |
| `200 OK` | `success` | Events validated, deduplicated, and stored. | Normal operation. |
| `200 OK` | `duplicate` | Event was already acknowledged (idempotent). | No action needed. |
| `400 Bad Request` | `privacy_invariant_violation` | Customer message text or email was detected in the payload. | Remove message body and send only opaque `ticket_ref`. |
| `400 Bad Request` | `invalid_json` / validation | Missing required fields (`org_id`, `ticket_ref`). | Correct JSON structure. |
| `401 Unauthorized` | `missing_headers` | Missing signature or timestamp headers. | Include both `X-Aegis-Timestamp` and `X-Aegis-Signature`. |
| `401 Unauthorized` | `timestamp_skew_exceeded` | Request timestamp is older than 5 minutes or in the future. | Check system NTP clock synchronization. |
| `401 Unauthorized` | `invalid_signature` | HMAC signature mismatch. | Verify API secret matches tenant secret. |

---

## 7. Metrics Rollup API (`POST /api/events/rollup`)

Aggregates raw event telemetry into pure `daily_metrics`:
- **Formula:**
  - `Time Saved (Hours) = (Auto-resolved tickets × avg_handle_minutes) / 60`
  - `Cost Saved (USD) = Time Saved × agent_hourly_cost`
- Configurable per-organization parameters:
  - `avg_handle_minutes` (default: 11.8)
  - `agent_hourly_cost` (default: $30.00)
  - `reporting_currency` (default: USD)
