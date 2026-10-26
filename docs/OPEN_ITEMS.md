# AegisDesk Pre-Launch Open Items & Legal Confirmation Register (`OPEN_ITEMS.md`)

This document tracks all required company details that are currently `null` in [`src/config/site.config.ts`](../src/config/site.config.ts), as well as all statutory and contractual clauses marked with `[CONFIRM]` across the public legal pages.

In accordance with Round 3 rules:
- Company details come **only** from `src/config/site.config.ts`.
- Where a value is `null`, it is omitted from the public pages.
- The automated go-live check (`npm run check:go-live` / `node scripts/check-go-live.mjs`) **fails** until all mandatory company details are populated.

---

## 1. Missing Corporate Entity Details in `src/config/site.config.ts`

The following fields in `siteConfig` are currently `null` and must be populated prior to flipping Razorpay to live production mode:

| Configuration Key | Current Value | Required Production Value | Status |
| :--- | :---: | :--- | :---: |
| `siteConfig.legalName` | `null` | Full legal entity name (e.g. *AegisDesk Technologies Private Limited*) | ❌ **Blocking Go-Live** |
| `siteConfig.registeredAddress` | `null` | Official registered corporate office address matching incorporation certificate and GSTIN | ❌ **Blocking Go-Live** |
| `siteConfig.phone` | `null` | Official corporate telephone support number | ❌ **Blocking Go-Live** |

---

## 2. Statutory & Legal Clauses Requiring Lawyer Confirmation (`[CONFIRM]`)

The following clauses across all 7 public legal pages are drafted in plain language and marked with `[CONFIRM]` pending final corporate legal counsel sign-off:

### A. Contact Us (`/contact`)
- [ ] **Statutory Officer Designation:** Applicability of designated Grievance Officer details under IT Act 2000, Intermediary Rules 2021, and DPDP Act 2023.
- [ ] **Statutory Resolution Window:** "Within 15 calendar days of receipt".

### B. Pricing Details & Commercial Terms (`/pricing`)
- [ ] **Advance Billing & Notice:** "Monthly in advance" and "30 days written notice" cancellation term.
- [ ] **Milestone Delivery Mechanism:** Staged 50% deposit and 50% balance post-Shadow Validation.
- [ ] **International Currency & Taxes:** USD billing without foreign currency conversion fees, export of services under statutory Letter of Undertaking procedures with 0.0% statutory IGST.
- [ ] **Domestic Indian Taxes:** INR contract conversion, 18% GST applicability under SAC 998313, and B2B GST tax credit invoicing.
- [ ] **Payment Handling:** Explicit clause: *"Payment details are handled by Razorpay and not stored by us. Payment card details and netbanking credentials are processed exclusively by Razorpay (PCI-DSS Level 1 compliant gateway) and are never stored on AegisDesk servers."*

### C. Terms of Service (`/terms`)
- [ ] **Parties & Acceptance:** Binding nature of electronic order forms and digital payment settlement.
- [ ] **14-Day Shadow Validation:** Calibration period terms, agent approval workflow, and human escalation safeguard.
- [ ] **Payment Terms & Late Payment Grace Period:** 7-day grace period before fail-soft downgrade to draft-only mode.
- [ ] **Intellectual Property Ownership:** Sole and exclusive client ownership of uploaded manuals, documents, and support tickets; platform IP reservation.
- [ ] **Zero Model Training Guarantee:** Enforceability of the guarantee that client content is never used to train public foundation models.
- [ ] **Limitation of Liability:** Exclusion of consequential damages and trailing 12-month fees liability ceiling.
- [ ] **Term, Suspension & Termination:** 30 days written notice, 30-day cryptographic data purge schedule.
- [ ] **Governing Law & Dispute Resolution:** Dual jurisdiction structure (Bengaluru courts for domestic INR; State of Delaware arbitration for international USD).

### D. Privacy Policy (`/privacy`)
- [ ] **Razorpay Data Handling Clause:** Explicit clause: *"Payment details are handled by Razorpay and not stored by us. All digital payments for AegisDesk setup fees and recurring retainers are processed exclusively by Razorpay Software Private Limited ('Razorpay'), a certified Payment Card Industry Data Security Standard (PCI-DSS) Level 1 service provider."*
- [ ] **Zero Card Data on Servers:** Direct TLS 1.3 tokenization to Razorpay; zero storage of card credentials on application servers.
- [ ] **Data Principal Rights:** DPDP Act 2023 and GDPR rights (access, correction, erasure, consent withdrawal, grievance escalation).
- [ ] **Sub-Processor Transparency:** Sub-processor listing (Razorpay, Supabase, Cloudflare, Resend, Cal.com).
- [ ] **Retention & Purge Timelines:** 30-day post-termination purge window.

### E. Cancellation & Refund Policy (`/cancellation-refunds`)
- [ ] **Kickoff Deposit Refundability:** 100% refund within 48 hours if prior to document ingestion; non-refundable once ingestion/engineering begins.
- [ ] **14-Day Shadow Validation Exit Guarantee:** Complete waiver of final 50% setup balance and zero retainer commitment if benchmark accuracy (< 92.0%) is not achieved.
- [ ] **Monthly Retainer Cancellation:** 30 days written notice; no pro-rata refunds for partial active billing cycles.
- [ ] **Razorpay Gateway Refund Timelines:** 2 business days audit window; 5 to 7 business days banking credit schedule to original payment method.

### F. Shipping & Delivery Policy (`/shipping-delivery`)
- [ ] **Purely Digital Service Declaration:** Statutory confirmation that AegisDesk provides cloud SaaS with zero physical delivery, shipping fees, or physical transit.
- [ ] **Electronic Delivery Milestones:** Account provisioning within 1 business day of deposit settlement, document ingestion in 3–5 business days, autonomous live activation within 24 hours of sign-off and balance settlement.
- [ ] **Proof of Delivery Standards:** Electronic timestamp records, webhook handshakes, and portal telemetry as legal proof of delivery.

---

## 3. Go-Live Verification Script

Run the automated check:
```bash
npm run check:go-live
```
Or directly:
```bash
node scripts/check-go-live.mjs
```

The script verifies:
1. `siteConfig.legalName` is not null or empty.
2. `siteConfig.registeredAddress` is not null or empty.
3. `siteConfig.phone` is not null or empty.

Until all three are provided, the check exits with code `1`, preventing premature merchant account activation.
