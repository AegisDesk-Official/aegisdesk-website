# AegisDesk Commercial Billing Architecture & Razorpay Specification (`BILLING.md`)

**Document Version:** 1.0.0  
**Status:** Approved Master Architecture  
**Target Gateways:** Razorpay (Payments, Invoices, Payment Links, Smart Collect)  
**Currencies Supported:** USD (`$`), INR (`₹`)  
**Pricing Model:** $3,500 Fixed Setup (50% Deposit + 50% Balance) + $1,000/mo Recurring Retainer  

---

## Executive Summary & Audit of Pricing Discrepancies

### Price List Reconciliation
The target commercial model specifies:
1. **One-Time Setup & Helpdesk Integration:** **$3,500**  
   - **50% Kickoff Deposit ($1,750):** Due prior to document engineering and vector ingestion. Unlocks workspace and agent onboarding.  
   - **50% Shadow Mode Balance ($1,750):** Due upon completion of the 14-day Shadow Mode calibration and written sign-off. Unlocks autonomous live routing.  
2. **Monthly Managed Infrastructure & Calibration Retainer:** Starting at **$1,000/month**.  
   - Due monthly in advance. Covers vector store hosting, continuous retrieval tuning, weekly policy gap reports, model inference, and human escalation routing.

### Current Codebase & Copy Inconsistencies (Flagged for Future Code Pass)
An audit across the existing public site pages and configuration reveals the following discrepancies:
- **Discrepancy 1 (Setup Price):**  
  - Marketing copy (`src/lib/site-copy.ts`, `src/components/marketing/savings-example.tsx`, `src/components/marketing/final-cta.tsx`, `src/components/layout/navbar.tsx`), and the legal terms (`src/app/terms/page.tsx`) currently state **"$2,500 one-time setup"** instead of **"$3,500 setup"**.
  - `DESIGN.md` (Section 1) currently states: `AegisDesk sells Corrective-RAG customer support to B2B teams: $2,500 setup plus $1,000 per month`.
  - `ARCHITECTURE.md` (line 58) previously allowed an ambiguous `($1,250 or $2,500)`.
- **Discrepancy 2 (Single vs. Split Invoicing):**  
  - The current client billing screen (`src/app/dashboard/billing/page.tsx`) displays a single `$2,500` invoice (`INV-APEX-001`) rather than the two milestone invoices: `INV-001: 50% Kickoff Deposit ($1,750)` and `INV-002: 50% Final Calibration Balance ($1,750)`.
- **Discrepancy 3 (Terms of Service Language):**  
  - `src/app/terms/page.tsx` states: *"Payment is by invoice and bank transfer. There is no payment form on this site."* It lacks explicit cancellation terms, non-refundable deposit clauses, and GST statutory disclosures.

*Note: Per instructions, no code or existing copy files are modified in this planning task. All inconsistencies are formally cataloged below and will be reconciled during the implementation phase.*

---

## 1. The Billing State Machine & Dashboard Unlock Matrix

The customer journey follows a strict finite state machine (FSM). Dashboard capabilities, model execution, and human-in-the-loop controls are gated by verified commercial milestone payments.

```mermaid
flowchart TD
    Lead["lead"] --> BookedCall["booked_call"]
    BookedCall --> ProposalSent["proposal_sent"]
    ProposalSent -->|50% Deposit ($1,750) Paid| DepositPaid["deposit_paid"]
    DepositPaid -->|SOP Uploaded & Helpdesk Connected| Onboarding["onboarding"]
    Onboarding -->|Retrieval Calibration Complete| ShadowMode["shadow_mode (14 Days)"]
    ShadowMode -->|Calibration Sign-off & 50% Balance ($1,750) Paid| BalancePaid["balance_paid"]
    BalancePaid -->|Go-Live Authorization Signed| Live["live"]
    Live -->|Month 1 Retainer ($1,000) Active| RetainerActive["retainer_active"]
    RetainerActive -->|Payment Due / Grace Exceeded| Paused["paused"]
    Paused -->|Payment Recovered| RetainerActive
    Paused -->|Contract Termination| Churned["churned"]
```

### Milestone State Definitions & Access Control Matrix

| System Phase (`organizations.phase`) | Commercial Trigger | Invoices Generated | Dashboard Access & Feature Gating |
| :--- | :--- | :--- | :--- |
| **`lead`** | Demo submitted. | None. | Zero portal access. Read-only demo chat quota. |
| **`booked_call`** | Cal.com scoping call scheduled. | None. | Zero portal access. Cal invite dispatched via Resend. |
| **`proposal_sent`** | Scoping complete; formal quote issued. | `INV-SETUP-DEP` ($1,750 / ₹1,45,000) issued in `issued` status. | **Locked Portal Preview.** Client can log in to `/dashboard/billing` to view commercial quote and pay the deposit invoice. All operational tabs (`conversations`, `knowledge-base`, `team`) show locked overlays. |
| **`deposit_paid`** | Razorpay confirms 50% kickoff deposit ($1,750). | `INV-SETUP-DEP` transitioned to `paid`. | **Onboarding Unlocked.** Client Admin can access `/dashboard/knowledge-base` to upload proprietary PDF manuals, and `/dashboard/team` to invite human agents. |
| **`onboarding`** | Initial documents uploaded; helpdesk credentials provided. | None. | **Integration Monitor Active.** Displays real-time status of document chunking, embeddings, and vector indexing. |
| **`shadow_mode`** | Vector retrieval benchmarked ($\ge 92.0\%$ cosine accuracy). | None (Day 1 to 14). | **Draft Console Unlocked.** `/dashboard/conversations` streams live AI-generated draft responses for human agent approval. **Autonomous customer sending is strictly hard-coded to disabled.** |
| **`balance_paid`** | 14-day calibration report approved; Razorpay confirms 50% balance ($1,750). | `INV-SETUP-BAL` ($1,750 / ₹1,45,000) transitioned to `paid`. | **Sign-off Authorization Enabled.** Client Admin is presented with the formal Go-Live written authorization toggle and calibration sign-off screen. |
| **`live`** | Written authorization executed by Client Admin. | None. | **Autonomous Resolution Unlocked.** Answers clearing the 92.0% confidence threshold are dispatched directly to end-users in Zendesk/Freshdesk. |
| **`retainer_active`** | Month 1+ retainer ($1,000 / ₹83,000) paid. | `INV-RET-XXXX` marked `paid`. | **Full Enterprise Operations Sustained.** Ongoing vector hosting, weekly policy gap audits, model compute, and dedicated engineering reviews. |
| **`paused`** | Retainer payment overdue ($>7$ calendar days grace). | `INV-RET-XXXX` in `overdue` status. | **Autonomous Answering Halted (Safety Fail-Soft).** System reverts to draft-only Shadow Mode. Top warning banner alerts agents that direct customer resolution is paused pending billing resolution. |
| **`churned`** | Formal cancellation or $>30$ days delinquent. | Final settlement invoice (if applicable). | **Read-Only Archive (30 Days).** API keys revoked; helpdesk webhooks disconnected; document vector embeddings queued for cryptographic purge. |

---

## 2. Multi-Currency Architecture: USD ($) vs. INR (₹)

Every client organization is assigned a single statutory billing currency (`organizations.billing_currency`), determined during scoping and stored permanently on the organization record:
- **`USD`**: For international clients (United States, Europe, United Kingdom, Singapore, etc.).
- **`INR`**: For domestic clients incorporated or operating in India.

### How Razorpay Handles Each Currency

```
┌────────────────────────────────────────────────────────────────────────┐
│                   AegisDesk Client (B2B Buyer)                         │
└──────────────────┬─────────────────────────────────┬───────────────────┘
                   │                                 │
         USD Order │                                 │ INR Order
         ($1,750)  │                                 │ (₹1,45,000)
                   v                                 v
┌──────────────────────────────────────┐  ┌──────────────────────────────┐
│  Razorpay International Gateway      │  │  Razorpay Domestic Gateway   │
│  - Accepts: US/EU/UK Credit Cards    │  │  - Accepts: Corporate Cards  │
│  - No 2FA OTP requirement on intl    │  │  - Mandatory RBI 2FA (OTP)   │
│  - Settlement in INR via AD-I Bank   │  │  - Netbanking & NEFT/RTGS    │
│  - Purpose Code: P0802 (Software)    │  │  - UPI & Smart Collect VPA   │
│  - Generates: e-FIRA / FIRC          │  │  - B2B GST Credit E-Invoicing│
└──────────────────┬───────────────────┘  └──────────────┬───────────────┘
                   │                                     │
                   └──────────────────┬──────────────────┘
                                      v
                      Razorpay Settlement (INR)
                                      v
                    AegisDesk Current Account (India)
```

#### Domestic Transactions (INR)
- Invoiced in Indian Rupees (`INR`).
- Payment methods: Corporate Credit Cards, Commercial Debit Cards, Netbanking (50+ banks), UPI, and NEFT/RTGS via dedicated Razorpay Smart Collect Virtual Accounts.
- Regulatory requirement: Two-factor authentication (OTP / 3DS) is mandatory per Reserve Bank of India (RBI) mandates.
- GST: Taxable under domestic GST rules (CGST + SGST or IGST).

#### International Transactions (USD)
- Invoiced in US Dollars (`USD`).
- Payment methods: International Visa, Mastercard, American Express cards.
- Customer experience: The customer is billed strictly in USD on their card statement (zero foreign exchange surprise at checkout).
- Settlement: Razorpay routes the USD charge through its acquiring network and settles the equivalent INR into the AegisDesk Indian current account via an Authorized Dealer Category-I (AD-I) bank under the RBI OPGSP / Export guidelines.
- Regulatory compliance: AegisDesk receives a digital Foreign Inward Remittance Advice / Certificate (**e-FIRA / FIRC**) from the partner bank with export Purpose Code **`P0802`** (*Software consultancy, implementation, and IT services*).

### Critical Items to Confirm with Razorpay Support

| Topic | Specific Question to Razorpay Merchant Support | Business Risk & Technical Context |
| :--- | :--- | :--- |
| **1. International Payments Activation** | *"Confirm that International Payments are enabled for our account for USD charges on API orders, Invoices, and Payment Links."* | By default, newly created Razorpay Indian accounts only accept domestic INR cards. International payments require manual approval, export proof, and website verification. |
| **2. Indian Cards on USD Orders (FEMA Rule)** | *"What happens if an Indian-issued credit card attempts to pay a USD-denominated Payment Link or Order?"* | **Strict Regulatory Failure Mode:** Under Section 40 of FEMA and RBI currency regulations, transactions between two Indian residents must be denominated and settled in INR. If an Indian resident attempts to pay a USD order using an Indian card, Indian issuing banks will decline the transaction, or Razorpay will reject the card. **Remedy:** Ensure the onboarding scoping workflow forces `INR` currency for all Indian companies. |
| **3. American Express International Acceptance** | *"Is international AMEX enabled on our USD merchant profile?"* | US enterprise buyers heavily favor corporate AMEX. AMEX requires a separate merchant agreement or backend checkbox in Razorpay's dashboard. |
| **4. Automated e-FIRA Generation** | *"Are e-FIRAs generated automatically for each batch settlement, and can we fetch FIRA details via API or dashboard?"* | Essential for Indian GST compliance when filing GSTR-1 for zero-rated export of services without payment of tax. |
| **5. Standard Invoices vs. Payment Links Limits** | *"What are the per-transaction limits on Razorpay Payment Links for international cards ($1,750 and $1,000)?"* | Ensure the merchant account does not encounter velocity or ticket-size limits on $1,750 or $3,500 transactions. |

---

## 3. Retainer Charging Architecture: Subscriptions (A) vs. Monthly Invoice Links (B)

Two architectural models exist for charging the recurring $1,000/month retainer:

### Evaluation of Options

| Dimension | Option A: Razorpay Subscriptions (Autopay) | Option B: Automated Monthly Invoice + Payment Link |
| :--- | :--- | :--- |
| **How it Works** | Card tokenized on day 1; Razorpay automatically debits $1,000 every 30 days without human intervention. | Server cron generates sequential GST invoice on the 1st of each month; creates a Razorpay Payment Link; emails link to client AP contact. |
| **International Cards (US / EU)** | **Extremely brittle / Unsupported.** US and European enterprise cards fail Razorpay subscription authentication because foreign issuing banks do not support RBI-mandated recurring e-mandates. | **Flawless.** Standard 3D Secure / international e-commerce transaction. Works seamlessly with any international card. |
| **Indian Cards & RBI Regulations** | **High friction.** RBI requires explicit e-mandate registration with OTP, a ₹15,000 threshold restriction (exceeded by ₹83,000 retainer), and a mandatory pre-debit SMS notification 24 hours prior. | **Flawless.** Standard domestic OTP-verified corporate card or NEFT payment. |
| **Enterprise B2B Purchasing Norms** | Poor fit. B2B finance departments rarely permit automated recurring card deductions without an approved, audited invoice. | **Ideal fit.** Matches corporate accounts payable (AP) workflows: Net-15 or Net-30 payment against approved invoice. |
| **Implementation Complexity** | High: Plan creation, subscription schedules, mandate registrations, handling `subscription.halted`. | Clean: Single database table, standard Payment Links API, simple webhook listener. |

### Architectural Recommendation: **Build Option B First**
**We will build Option B (Monthly Invoice with Payment Link) as the foundational engine.**
- Option B operates identically across international (USD) and domestic (INR) enterprise clients.
- It completely sidesteps RBI's complex recurring payment e-mandate bottlenecks.
- It satisfies corporate B2B procurement requirements (issuing a stamped, tax-compliant invoice before funds are transferred).
- Once Option B is live, Option A (Subscriptions) can be evaluated strictly as an optional self-service upgrade for domestic INR clients who specifically request auto-debit.

---

## 4. Statutory GST Architecture (Goods & Services Tax - India)

Every invoice generated by AegisDesk must store and render statutory GST parameters. All values are configurable on the server and verified by your chartered accountant.

### Configurable Statutory Fields

```typescript
interface InvoiceGstMetadata {
  // Supplier Statutory Identity (AegisDesk / Registered Legal Entity)
  supplier_legal_name: string;      // e.g., "AegisDesk Technologies Private Limited"
  supplier_gstin: string;           // 15-digit GSTIN (e.g., "27AAAAA0000A1Z5")
  supplier_pan: string;             // Permanent Account Number
  supplier_state_code: string;       // e.g., "27" (Maharashtra)
  supplier_address: string;         // Registered corporate office address
  
  // Tax Classification
  sac_code: string;                 // "998313" (Information technology consulting & support services)
  tax_rate_percent: number;         // 18.0 (Standard Indian IT Services Rate)

  // Recipient / Client Identity
  recipient_legal_name: string;
  recipient_gstin?: string;         // Mandatory for Indian B2B input tax credit; null for intl
  recipient_pan?: string;
  place_of_supply: string;          // State Code (e.g., "29-Karnataka") or "96-Foreign Country"
  
  // Computed Tax Splits
  taxable_amount: number;           // Amount before tax
  cgst_amount: number;              // 9% if Intra-state (Supplier State == Recipient State)
  sgst_amount: number;              // 9% if Intra-state
  igst_amount: number;              // 18% if Inter-state (Supplier State != Recipient State)
  is_export: boolean;               // True if foreign client paid in convertible currency
  lut_number?: string;              // Letter of Undertaking number for zero-rated export
}
```

### Statutory Tax Rules Table

| Client Classification | Currency | Place of Supply | Applicable Tax Rate | Required Statutory Invoice Declaration |
| :--- | :--- | :--- | :--- | :--- |
| **Domestic (Same State / Intra-state)** | INR | Supplier State (e.g. `27-Maharashtra`) | **18% (9% CGST + 9% SGST)** | Standard B2B Tax Invoice showing CGST + SGST breakdown and client's 15-digit GSTIN. |
| **Domestic (Different State / Inter-state)** | INR | Other Indian State (e.g. `29-Karnataka`) | **18% (IGST)** | Standard B2B Tax Invoice showing IGST breakdown and client's GSTIN. |
| **International (Export of Services)** | USD | `96-Foreign Country` | **0% (Zero-Rated Export)** | *"Supply meant for export under Letter of Undertaking (LUT) without payment of Integrated Tax (IGST). LUT Ref: AD270326000000X."* |

---

## 5. Webhook Engineering Specification (Razorpay Official API)

AegisDesk uses Razorpay webhooks as the single source of truth for payment verification.

### Exact Official Razorpay Event Names

| Official Event Name | Source Payload Object | System State Transition | Action Executed by Server |
| :--- | :--- | :--- | :--- |
| **`payment_link.paid`** | `payload.payment_link` & `payload.payment` | `proposal_sent` $\rightarrow$ `deposit_paid`<br>`shadow_mode` $\rightarrow$ `balance_paid`<br>`live` $\rightarrow$ `retainer_active` | 1. Verify cryptographic HMAC signature.<br>2. Transition invoice status to `paid`.<br>3. Advance organization phase in database.<br>4. Dispatch email receipt via Resend.<br>5. Record payment details in `payments` table. |
| **`payment.captured`** | `payload.payment` | Confirms funds settled | Secondary verification. Confirms capture if order API workflow is used. |
| **`payment.failed`** | `payload.payment` | No state transition | 1. Log payment failure reason (`card_declined`, `insufficient_funds`).<br>2. Record in operator security/audit console.<br>3. Dispatch payment failure notification email with retry link. |
| **`payment_link.cancelled`** | `payload.payment_link` | No state transition | Marks payment link cancelled; generates audit log entry. |
| **`payment_link.expired`** | `payload.payment_link` | No state transition | Generates replacement link if invoice remains valid. |
| **`refund.processed`** | `payload.refund` | `paid` $\rightarrow$ `refunded` | 1. Marks invoice and payment record `refunded`.<br>2. Deducts from executive MRR telemetry.<br>3. Reverts organization phase if kickoff deposit refunded. |
| **`refund.failed`** | `payload.refund` | Alert to Operator | Logs failure in operator console for manual bank reconciliation. |

### Webhook Security & Cryptographic Invariants
1. **Raw Body Verification:** Razorpay HMAC signatures **cannot** be verified after JSON parsing. The raw UTF-8 string body must be captured directly from the Next.js `req.text()` stream.
2. **Timing-Safe Comparison:** Signatures are compared using constant-time evaluation to defeat timing attacks:
   ```typescript
   const expectedSignature = crypto
     .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET!)
     .update(rawBody)
     .digest("hex");
   const isValid = crypto.timingSafeEqual(
     Buffer.from(receivedSignature, "hex"),
     Buffer.from(expectedSignature, "hex")
   );
   ```

### Idempotency & Replay Defense Matrix
- Every incoming webhook is checked against the database table:
  ```sql
  CREATE TABLE webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider TEXT NOT NULL,                  -- 'razorpay'
    event_id TEXT NOT NULL,                  -- e.g., 'evt_P4N7y1m3o9Z2'
    event_type TEXT NOT NULL,                -- e.g., 'payment_link.paid'
    payload JSONB NOT NULL,
    status webhook_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_provider_event UNIQUE(provider, event_id)
  );
  ```
- **Duplicate Delivery:** If Razorpay retries a webhook (up to 24 hours), the database `UNIQUE(provider, event_id)` constraint catches it immediately. The route returns HTTP `200 OK` and skips processing.
- **Out-of-Order Delivery:** If `payment.captured` arrives *after* `payment_link.paid` has already marked the invoice `paid`, the invoice updater checks:
  ```typescript
  if (currentInvoice.status === "paid") {
    // Already satisfied; skip duplicate mutation
    return;
  }
  ```

### Daily Automated Reconciliation Job (Dropped Webhook Fail-Safe)
If an edge worker drops an incoming webhook or Vercel experiences a transient 504 gateway timeout, funds could be captured on Razorpay while the customer remains locked out.
- **The Reconciliation Worker (`scripts/reconcile-billing.mjs` / cron job):**
  1. Runs daily at 02:00 UTC (and on-demand from `/operator`).
  2. Queries Razorpay's API: `GET /v1/payments?from={yesterday}&to={now}&count=100`.
  3. Matches each successful payment against our Postgres `payments` and `invoices` tables.
  4. If a payment is `captured` on Razorpay but marked `issued` / `unpaid` in Postgres:
     - Automatically transitions invoice to `paid`.
     - Advances organization state.
     - Logs critical healing event to `audit_log` with tag `[AUTO_RECONCILED]`.
     - Dispatches an executive Slack/email notification to the AegisDesk operator.

---

## 6. Refund, Cancellation & Terms Alignment

### Commercial Policies Matching the Terms of Service

```
┌────────────────────────────────────────────────────────────────────────┐
│                        AegisDesk Refund Model                          │
├───────────────────────┬────────────────────────────────────────────────┤
│ Kickoff Deposit       │ Non-refundable once document engineering begins│
│ ($1,750 / 50%)        │ (Compensates initial retrieval setup & compute)│
├───────────────────────┼────────────────────────────────────────────────┤
│ Shadow Mode Balance   │ Conditional on satisfaction. If calibration   │
│ ($1,750 / 50%)        │ fails 92% benchmark, balance is NEVER billed   │
├───────────────────────┼────────────────────────────────────────────────┤
│ Monthly Retainer      │ Billed in advance. Cancellable with 30 days    │
│ ($1,000/mo)           │ notice. No mid-month pro-rated refunds.        │
└───────────────────────┴────────────────────────────────────────────────┘
```

1. **50% Kickoff Deposit ($1,750):**  
   - Non-refundable once custom document chunking and vector indexing has begun.  
   - If the client cancels prior to engineering kickoff, a 100% refund is processed within 5 business days minus credit card gateway processing fees (typically 2.9%).
2. **50% Shadow Mode Balance ($1,750):**  
   - The balance is **not** invoiced until the 14-day Shadow Mode calibration period concludes.
   - If the client is unsatisfied with accuracy during Shadow Mode and decides not to authorize Go-Live, the balance fee is never charged, and the engagement terminates with zero further obligation.
3. **Monthly Managed Retainer ($1,000/mo):**  
   - Retainers are billed on a 30-day advance cycle.
   - Cancellable at any time with 30 calendar days written notice.
   - Once a monthly billing period commences, services are rendered for the duration of that month; no partial or pro-rated refunds are issued for mid-cycle cancellation.

### Terms Page (`/terms`) Inconsistencies & Remediation Plan
During the upcoming code pass, `src/app/terms/page.tsx` must be updated with the following explicit clauses:
- Update Section §03 (*Pricing and Payment*) to specify the 50/50 milestone structure ($1,750 deposit + $1,750 balance).
- Add explicit refund declaration: Kickoff deposit non-refundable once ingestion begins; balance contingent on Shadow Mode calibration.
- Add 30-day advance cancellation notice requirement for monthly retainer termination.

---

## 7. Failure Modes & Detection Architecture ("Everything That Can Go Wrong With Money")

| # | What Can Go Wrong With Money | Real-World Scenario | Preventative Defense & Automated Detection |
| :--- | :--- | :--- | :--- |
| **1** | **Client-side Price Tampering** | Malicious user intercepts checkout and sends `amount: 100` ($1.00) instead of `$1,750`. | **Zero Client Trust.** The browser never sends pricing. Razorpay orders and payment links are created strictly server-side by reading hardcoded constants from `src/lib/billing/pricing-constants.ts`. |
| **2** | **Currency Mismatch** | Indian client charged in USD, causing bank rejection and FEMA compliance audit. | **Currency Enforcement Rule:** Server checks `organization.billing_currency`. Domestic Indian entities are strictly restricted to `INR`; international clients to `USD`. |
| **3** | **Dropped Webhook (Silent Black Hole)** | Customer pays $1,750, but a Vercel 504 timeout drops the webhook. Client remains locked out. | **2-Way Safety Net:**<br>1. Client-side polling on `/dashboard/billing` checks server status every 3s after Razorpay popup closes.<br>2. Nightly cron reconciliation script compares Razorpay API records against Postgres. |
| **4** | **Replay Attack / Duplicate Processing** | Webhook replayed multiple times by attacker or Razorpay retry loop. | **Idempotent Webhook Ledger:** Database table `webhook_events` enforces `UNIQUE(provider, event_id)`. Duplicates exit on line 1 with zero state mutation. |
| **5** | **Double Payment on Same Invoice** | Client opens payment link in two tabs and pays twice with different corporate cards. | **Idempotent Invoice Locking:** Razorpay payment links are configured with `single_use: true`. Once one payment succeeds, subsequent attempts are rejected by Razorpay. |
| **6** | **Chargeback / Payment Dispute** | Client files an unauthorized charge dispute with their US credit card issuer. | **Dispute Listener:** Server listens for `payment.disputed` webhook. Automatically alerts operator console, logs dispute deadline, and places autonomous resolution on hold. |
| **7** | **Floating Point / Rounding Errors** | Invoicing `1750.004` results in accounting discrepancy with bank statement. | **Integer Storage Invariant:** All financial amounts in Postgres and APIs are stored strictly in integer lowest currency units (`amount_cents` for USD, `amount_paise` for INR). Floats are strictly prohibited. |
| **8** | **GST Audit Failure on Export** | Indian tax authorities audit USD export invoices lacking proof of foreign inward remittance. | **Statutory Export Ledger:** Invoices record export LUT number, foreign client address, and bank e-FIRA Purpose Code `P0802`. |
| **9** | **Retainer Card Expiration (Involuntary Churn)** | Monthly retainer payment fails due to expired corporate card or credit limit exhaustion. | **Dunning & Grace Lifecycle:**<br>- Day 0: `payment.failed` triggers notification email with updated payment link.<br>- Days 1–7: System remains active in grace period.<br>- Day 8: System transitions to `paused` (safe draft-only mode).<br>- Day 30: System transitions to `churned`. |

---

## 8. Database Schema Additions for Billing (`supabase/migrations/`)

To support the above architecture, the following schema enhancements will be applied in the upcoming implementation pass:

```sql
-- 1. Milestone Invoices Table
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS milestone_type TEXT CHECK (milestone_type IN ('deposit_50', 'balance_50', 'monthly_retainer', 'custom'));
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS statutory_gst JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS payment_link_id TEXT UNIQUE;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS payment_link_url TEXT;

-- 2. Organization Billing Configuration
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS billing_currency TEXT NOT NULL DEFAULT 'USD' CHECK (billing_currency IN ('USD', 'INR'));
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS billing_contact_email TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS gst_number TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS place_of_supply TEXT;
```

---

*This specification serves as the formal architectural blueprint for all commercial billing, payment processing, and reconciliation logic in AegisDesk.*
