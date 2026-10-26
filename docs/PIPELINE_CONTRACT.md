# AegisDesk // AI Answering Engine Integration Contract

This document is the official technical specification for integrating an external AI answering engine with AegisDesk.

AegisDesk acts as the secure presentation layer, administrative console, and audit log. **AegisDesk contains zero AI models or vector databases.** All knowledge ingestion, embedding generation, retrieval-augmented generation (Corrective-RAG), and policy validation are performed by your external answering engine.

---

## 1. Architectural Summary & Responsibilities

```
                                  AegisDesk-Initiated Calls
               ┌─────────────────────────────────────────────────────────────┐
               │  1. GET  /v1/health             (Heartbeat & Status)        │
               │  2. POST /v1/documents/index    (Client Uploaded PDF)       │
               │  3. POST /v1/documents/remove   (Client Deleted PDF)        │
┌──────────────┤  4. POST /v1/draft-reply        (Workbench Live Pass-Thru)  ├──────────────┐
│              └─────────────────────────────────────────────────────────────┘              │
│                                                                                           ▼
│  AegisDesk                                                                          External Engine
│  Platform                                                                           (FastAPI / Go /
│  (Next.js)                                                                          Node Microservice)
│              ┌─────────────────────────────────────────────────────────────┐              ▲
└──────────────┤  5. POST /api/events            (Audit, Costs & Telemetry)  ├──────────────┘
               └─────────────────────────────────────────────────────────────┘
                                   Engine-Initiated Calls
```

### Core Invariants & Privacy Rules
1. **Zero Text Retention on Workbench Pass-Through**:
   When a prospective visitor tests the verification workbench by asking a custom question, AegisDesk forwards the query directly to `POST /v1/draft-reply`. AegisDesk **never stores, logs, or persists the user question text**.
2. **Zero Customer PII in Events API**:
   When your engine reports telemetry back to AegisDesk via `POST /api/events`, it **must never include customer message bodies, customer names, or customer email addresses**. Tickets are identified strictly by opaque identifiers (e.g. `zen_94812`).
3. **No Random or Fabricated Numbers**:
   When your engine is offline or unconfigured, AegisDesk returns a calm `"Not connected yet"` state. AegisDesk never invents fake metrics or sample replies.
4. **Cryptographic Authentication**:
   Every request in both directions is cryptographically verified via HMAC-SHA256 signatures with timestamp skew validation.

---

## 2. Request Signing & Authentication

All requests sent by AegisDesk to your engine include three authentication headers:

| Header | Description | Example |
| :--- | :--- | :--- |
| `X-Aegis-Timestamp` | Unix timestamp in seconds | `1730000000` |
| `X-Aegis-Signature` | Hexadecimal HMAC-SHA256 signature | `5e054bfb...` |
| `X-Aegis-Request-Id` | Unique UUID for idempotency and tracing | `c7a18b9e-3d12-4c55-b829-1a2b3c4d5e6f` |
| `Content-Type` | MIME payload type | `application/json` |

### Signing Algorithm
```
StringToSign = "${Timestamp}.${METHOD}.${Path}.${RawBody}"
Signature    = HMAC_SHA256(Secret = PIPELINE_SHARED_SECRET, Data = StringToSign).hexdigest()
```
- For requests with no body (`GET /v1/health`), `RawBody` is the empty string `""`.
- Timestamp must be verified within a 5-minute drift window (`|now - timestamp| <= 300` seconds).
- Compare signatures using constant-time comparison (`crypto.timingSafeEqual`).

### Verified Test Vector
You can use this exact vector to verify your HMAC implementation:

- **Shared Secret**: `test_secret_32_bytes_minimum_length_example_key`
- **Timestamp**: `1730000000`
- **Method**: `POST`
- **Path**: `/v1/draft-reply`
- **Raw Body**:
  ```json
  {"org_id":"00000000-0000-0000-0000-000000000001","ticket_ref":"demo_12345","text":"Test inquiry"}
  ```
- **String to Sign**:
  ```
  1730000000.POST./v1/draft-reply.{"org_id":"00000000-0000-0000-0000-000000000001","ticket_ref":"demo_12345","text":"Test inquiry"}
  ```
- **Expected HMAC-SHA256 Hex**:
  ```
  5e054bfb04b23d1cf2f30e85a7ff8b58aeb295730a5b8d493e24eb6183024b1e
  ```

---

## 3. Endpoints Your Engine Must Implement

### 3.1. Health Check (`GET /v1/health`)
Called periodically by the AegisDesk Owner Console to determine engine availability.

- **Timeout**: 3 seconds (no retries).
- **Request Headers**: `X-Aegis-Timestamp`, `X-Aegis-Signature`, `X-Aegis-Request-Id`.
- **Request Body**: None (`RawBody = ""`).

#### Response (200 OK)
```json
{
  "status": "ok",
  "version": "2.4.0",
  "simulated": false
}
```
*Note: If your engine is running in development/test mock mode, set `"simulated": true`.*

---

### 3.2. Index Document (`POST /v1/documents/index`)
Called immediately after a client uploads a PDF in their Knowledge Base.

- **Timeout**: 10 seconds.
- **Retry Policy**: Maximum 3 attempts with exponential backoff (500ms, 1500ms) on 5xx or network errors. Same `X-Aegis-Request-Id` is preserved across attempts for idempotency.
- **File Download**: AegisDesk provides a signed, short-lived (15-minute) download URL in `file_url`. Your engine should download the PDF, extract text chunks, generate vector embeddings, and store them partitioned by `org_id`.

#### Request Body
```json
{
  "org_id": "00000000-0000-0000-0000-000000000001",
  "document_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "file_url": "https://aegisdesk.ai/api/documents/9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d/file?org=...&exp=...&sig=..."
}
```

#### Response (200 OK)
```json
{
  "document_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "status": "indexed",
  "simulated": false
}
```
*(Status can be `"queued"` if your engine performs chunking asynchronously via Celery/RabbitMQ, or `"indexed"` if synchronous).*

---

### 3.3. Remove Document (`POST /v1/documents/remove`)
Called when a client deletes a document from their knowledge base. Your engine must purge all vector embeddings associated with `document_id`.

- **Timeout**: 10 seconds.
- **Retry Policy**: Maximum 3 attempts with exponential backoff.

#### Request Body
```json
{
  "org_id": "00000000-0000-0000-0000-000000000001",
  "document_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d"
}
```

#### Response (200 OK)
```json
{
  "document_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "removed": true,
  "simulated": false
}
```

---

### 3.4. Draft Reply (`POST /v1/draft-reply`)
Called when a prospective client uses the "Ask your own question" box on the Verification Workbench. The question text is passed straight through to your inference engine.

- **Timeout**: 15 seconds (no retries).
- **Constraints**: Maximum question length is 2,000 characters.

#### Request Body
```json
{
  "org_id": "00000000-0000-0000-0000-000000000001",
  "ticket_ref": "demo_a9b8c7d6e5f4",
  "text": "What is the policy for returning opened hardware after 25 days?"
}
```

#### Successful Grounded Response (200 OK)
```json
{
  "reply": "Standard returns are accepted within 30 calendar days of delivery, provided original packaging is retained.",
  "citations": [
    {
      "document_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
      "page": 3,
      "quote": "Opened items may be returned within 30 calendar days of delivery subject to inspection."
    }
  ],
  "grounded": true,
  "handed_to_human": false,
  "cost_usd": 0.0035,
  "simulated": false
}
```

#### Safe Escalation / Stepped-Aside Response (200 OK)
When your model cannot find a verifiable source or detects conflicting clauses:
```json
{
  "reply": "",
  "citations": [],
  "grounded": false,
  "handed_to_human": true,
  "reason": "no_source",
  "cost_usd": 0.0012,
  "simulated": false
}
```
*(Permitted reason codes: `"no_source"`, `"low_confidence"`, `"conflicting_policy"`, `"sensitive_topic"`).*

---

## 4. Reporting Events Back to AegisDesk (`POST /api/events`)

As your background worker processes tickets in live production or shadow mode, it streams telemetry events back to AegisDesk at:
`https://your-aegisdesk-domain.com/api/events`

### Authentication for Events
Every organization has a dedicated event secret (`api_secret`) managed in the Owner Console.
The signature format for `/api/events` is:
```
StringToSign = "${X-Aegis-Timestamp}.${RAW_JSON_BODY}"
Signature    = HMAC_SHA256(Secret = ORG_API_SECRET, Data = StringToSign).hexdigest()
```
Headers required:
- `X-Aegis-Timestamp`: Current Unix timestamp.
- `X-Aegis-Signature`: Computed signature hex.
- `Content-Type`: `application/json`.

### Single Event Example
```json
{
  "org_id": "00000000-0000-0000-0000-000000000001",
  "event_id": "evt_98471928374",
  "type": "draft_created",
  "occurred_at": "2026-10-26T14:15:30.220Z",
  "ticket_ref": "zen_88192",
  "channel": "zendesk",
  "topic": "hardware_return",
  "latency_ms": 220,
  "model_cost_usd": 0.0035
}
```

### Batch Events Example (Up to 500 events)
```json
{
  "events": [
    {
      "org_id": "00000000-0000-0000-0000-000000000001",
      "event_id": "evt_98471928374",
      "type": "ticket_received",
      "ticket_ref": "zen_88192",
      "channel": "zendesk"
    },
    {
      "org_id": "00000000-0000-0000-0000-000000000001",
      "event_id": "evt_98471928375",
      "type": "draft_created",
      "ticket_ref": "zen_88192",
      "channel": "zendesk",
      "latency_ms": 220,
      "model_cost_usd": 0.0035
    }
  ]
}
```

Supported event types:
- `ticket_received`
- `draft_created`
- `check_passed` (with `check: 1 | 2 | 3`)
- `check_blocked` (with `check: 1 | 2 | 3` and `reason`)
- `handed_to_human` (with `reason`)
- `reply_approved`
- `reply_edited` (with `edit_distance`)
- `reply_rejected`
- `reply_sent`

---

## 5. Environment Variables Checklist

To connect AegisDesk to your engine, set these variables in AegisDesk's `.env.local`:

| Variable | Description |
| :--- | :--- |
| `PIPELINE_BASE_URL` | Base URL of your AI engine (e.g. `https://engine.internal.yourcompany.com`). In local development, `http://localhost:8080` is allowed. |
| `PIPELINE_SHARED_SECRET` | Cryptographically random secret (min 32 characters) shared between AegisDesk and your engine for request signing. |
| `ENCRYPTION_KEY` | 32-byte hexadecimal key used by AegisDesk to encrypt organization event secrets at rest. |
| `EVENTS_API_DEFAULT_SECRET` | Fallback signing secret for legacy or demo organization event reporting. |

On your engine side, set:
- `PIPELINE_SHARED_SECRET`: Identical to the value in AegisDesk.
- `AEGISDESK_BASE_URL`: Base URL of AegisDesk (e.g. `https://aegisdesk.ai`).
- `ORG_API_SECRETS`: Dictionary or key vault holding the per-org event secrets issued by the AegisDesk Owner Console.

---

## 6. Implementation Checklist for External Developer

- [ ] **HMAC Signature Verifier**: Implement signature check for incoming requests (`X-Aegis-Timestamp`, `X-Aegis-Signature`). Check against the test vector in Section 2.
- [ ] **GET /v1/health**: Return status and version. Response time under 500ms.
- [ ] **POST /v1/documents/index**: Accept document ID and download the PDF using the short-lived signed URL. Chunk, embed, and store in your vector database partitioned by `org_id`.
- [ ] **POST /v1/documents/remove**: Remove all chunks and embeddings for the given `document_id`.
- [ ] **POST /v1/draft-reply**: Run retrieval on the organization corpus. Return grounded reply with citations or step aside with `handed_to_human: true`. Never return hallucinations.
- [ ] **POST /api/events Client**: Sign and push execution telemetry to AegisDesk.
- [ ] **Local Mock Engine Validation**: Run `node tools/mock-pipeline-engine.mjs` to test against the reference mock implementation.
