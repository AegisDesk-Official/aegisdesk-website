# AegisDesk — Grounded B2B Customer Support AI

> **Deterministic, zero-hallucination customer support built strictly on your company knowledge.**  
> Answers exclusively from validated policies and SOPs, cites every sentence to source PDFs, runs in a 14-day human-approved **Shadow Validation**, and routes edge cases directly to your support team.

---

## 1. System Overview

AegisDesk operates as a control room and verification layer for enterprise customer support. It contains **zero autonomous generative hallucination**:

- **Strict Source Grounding:** Every reply must pass 3 independent gates (Source Citation, Boundary Policy, and Human Verification) before leaving the system.
- **External AI Pipeline Boundary:** AegisDesk delegates inference and document vectorization to an external answering engine via typed HMAC-SHA256 signed requests (`src/lib/pipeline/`). Text submitted in the verification workbench is passed through and never stored in any database or telemetry log.
- **14-Day Shadow Validation:** The system drafts candidate replies alongside human agents for 14 days. Drafts require human approval, calibrating confidence thresholds ($\ge 92\%$) before live autonomy is granted.
- **Single Source of Truth Pricing:** All commercial terms ($2,500+ setup with 50% deposit before kickoff and 50% balance after Shadow Validation, plus $1,000+/mo retainer) are derived mathematically from [`src/lib/pricing.ts`](file:///Users/aditgupta/Downloads/aegisdesk-round-3.1/src/lib/pricing.ts).

---

## 2. Prerequisites & Quickstart

### System Requirements
- **Node.js:** `>= 18.18.0` (Node 20+ LTS recommended)
- **Package Manager:** `npm` (v9 or v10)
- **Operating System:** macOS, Linux, or Windows WSL2

### Quickstart Guide

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-org/aegisdesk.git
   cd aegisdesk
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up local environment:**
   ```bash
   cp .env.example .env.local
   ```
   *(Configure `.env.local` using the placeholders. Local development runs in safe test mode with in-memory SQLite and mock telemetry fallback).*

4. **Start the development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to view the application.

5. **Build and run for production:**
   ```bash
   npm run build
   npm run start
   ```

---

## 3. Directory & Folder Map

```
aegisdesk/
├── Root
│   ├── .env.example                # Canonical environment variable specification
│   ├── COPY.md                     # Brand voice, editorial rules & copy reference
│   ├── DESIGN.md                   # Visual thesis, design tokens & strict layout rules
│   ├── PROJECT_MAP.md              # Project architecture & component manifest
│   ├── README.md                   # This document
│   ├── package.json                # Project dependencies & automation scripts
│   ├── next.config.mjs             # Next.js configuration (CSP headers, asset optimization)
│   ├── tsconfig.json               # TypeScript strict configuration
│   └── tailwind.config.ts          # Tailwind design tokens referencing DESIGN.md variables
│
├── _archive/                       # Deprecated, legacy, or superseded duplicate code
│   ├── components/layout/          # Superseded layout duplicates
│   ├── components/marketing/       # Superseded marketing hooks
│   └── lib/                        # Archived shims (payments-legacy, supabase-legacy, etc.)
│
├── docs/                           # Architecture specifications, runbooks & contracts
│   ├── ARCHITECTURE.md             # Multi-tenant state machine & subsystem architecture
│   ├── ATTACK_PLAN.md              # Red-team threat models (injection, isolation, brute force)
│   ├── ATTACK_REPORT.md            # Automated attack suite certification results
│   ├── BILLING.md                  # Invoicing, GST/LUT compliance & reconciliation runbook
│   ├── CLAIMS.md                   # Legal and factual marketing claims audit
│   ├── COOKIE_AUDIT.md             # Privacy audit & cookie inventory
│   ├── EMAIL_DELIVERABILITY.md     # SPF, DKIM, DMARC DNS deliverability specifications
│   ├── EVENTS_API.md               # Telemetry ingestion specification
│   ├── GO_LIVE.md                  # Pre-launch security checklist
│   ├── PIPELINE_CONTRACT.md        # External AI Engine integration contract & test vectors
│   ├── RUNBOOK.md                  # Disaster recovery, PITR restore & quarterly drills
│   ├── SECURITY.md                 # Security baseline, CSP, CSRF, and RBAC policies
│   └── examples/                   # 10 copy-ready pipeline request and response JSON payloads
│
├── public/
│   ├── brand/                      # currentColor SVG lockups & favicon
│   │   ├── aegisdesk-lockup.svg
│   │   ├── aegisdesk-mark.svg
│   │   ├── aegisdesk-wordmark.svg
│   │   └── favicon.svg
│   └── images/hero/                # Optimized responsive AVIF/WebP evidence stills
│
├── src/
│   ├── app/                        # Next.js 14 App Router
│   │   ├── page.tsx                # Public homepage (Hero, Proof, Workbench, Pricing, FAQ)
│   │   ├── (public pages)          # /about, /contact, /pricing, /privacy, /terms, /dpa, /security,
│   │   │                           # /shipping-delivery, /cancellation-refunds, /status, /maintenance
│   │   ├── auth/ & login/          # /login, /auth/invite, /auth/mfa-verify, password resets
│   │   ├── dashboard/              # Client Portal (/dashboard, /knowledge-base, /billing, /team)
│   │   ├── operator/               # Owner Console (/operator) with stealth 404 security gate
│   │   ├── api/                    # Webhooks (Razorpay, Cal.com), telemetry (/events), demo, documents
│   │   ├── error.tsx & not-found   # Branded error boundaries with zero stack trace leakage
│   │   ├── robots.ts & sitemap.ts  # Technical SEO & AI citation crawler indexing rules
│   │   └── opengraph-image.tsx     # Dynamic 1200x630 social preview card
│   │
│   ├── components/
│   │   ├── admin/                  # Owner Console components (Sparkline, StateViews, DemoTag)
│   │   ├── marketing/              # Landing page components (Hero, Navbar, Footer, Workbench, FAQ)
│   │   ├── portal/                 # Client Portal widgets (Header, Sidebar, Shell, OnboardingChecklist)
│   │   ├── scenes/                 # 3D Hero canvas, WebGL wireframe terrain & GSAP sequence
│   │   └── ui/                     # Primitives (Button, Badge, Card, Modal, Input, Panel, StatusChip)
│   │
│   ├── config/
│   │   └── site.config.ts          # Single Source of Truth for company info per Round 3
│   │
│   └── lib/
│       ├── auth/                   # RBAC authorization roles, sessions, token hashing
│       ├── calendar/               # Cal.com booking store & HMAC-SHA256 signature verifier
│       ├── db/                     # Documents store, operator store, seed data, database client
│       ├── email/                  # Resend transactional email templates & outbox dispatcher
│       ├── metrics/                # Telemetry rollups, deflection formulas, savings ROI model
│       ├── payments/               # Razorpay checkout, HMAC verification, invoices, audit ledger
│       ├── pipeline/               # External AnswerPipeline interface, HTTP adapter & ingest
│       ├── pricing.ts              # Authoritative pricing & ROI math (Single Source of Truth)
│       ├── security/               # CSP builder, CSRF guard, rate limiter, sanitization, TOTP, injection
│       └── validation/             # Zod validation schemas & demo request types
│
├── supabase/
│   ├── migrations/                 # PostgreSQL multi-tenant schema & RLS policies
│   └── seed.sql
│
├── tests/
│   ├── attack/                     # Security attack suite (tenant isolation, injection, capacity)
│   └── unit/                       # Unit test suites (pricing, pipeline, auth, billing, cal)
│
└── tools/
    └── mock-pipeline-engine.mjs    # Local development external answering engine simulator (:8080)
```

---

## 4. Available npm Scripts

| Script | Command | Description |
| :--- | :--- | :--- |
| `npm run dev` | `next dev` | Starts local Next.js development server with fast refresh. |
| `npm run build` | `next build` | Compiles production assets, validates types, and runs ESLint checks. |
| `npm run start` | `next start` | Runs the compiled production server daemon on port 3000. |
| `npm test` | `node --test tests/unit/*.test.mjs tests/attack/*.test.mjs` | Executes the complete 84-test unit and security attack suites. |
| `npm run lint` | `next lint` | Runs ESLint analysis across all project TypeScript source files. |

---

## 5. Environment Variables Guide

All platform configuration is managed via environment variables. Refer to [`.env.example`](file:///Users/aditgupta/Downloads/aegisdesk-round-3.1/.env.example) for exact defaults:

| Variable | Scope | Purpose |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_APP_URL` | Public | Canonical public domain URL (e.g. `https://aegisdesk.ai`). |
| `NEXT_PUBLIC_CAL_LINK` | Public | Cal.com scheduling link for the 15-minute scoping call. |
| `OWNER_EMAIL` | Server | Platform owner email used for 2FA operator authentication. |
| `PIPELINE_BASE_URL` | Server | Base URL of external AI answering engine (leave empty when offline). |
| `PIPELINE_SHARED_SECRET` | Server | Symmetric HMAC-SHA256 secret for signing pipeline requests. |
| `ENCRYPTION_KEY` | Server | AES-256-GCM master key (min 32 chars) for encrypting tenant event secrets. |
| `RAZORPAY_KEY_ID` | Server/Public | Razorpay API key ID for hosted checkout. |
| `RAZORPAY_KEY_SECRET` | Server | Razorpay API secret key for order verification. |
| `RAZORPAY_WEBHOOK_SECRET` | Server | Secret for verifying Razorpay HMAC webhook signatures. |
| `CALCOM_WEBHOOK_SECRET` | Server | Secret for verifying Cal.com HMAC-SHA256 booking signatures. |
| `RESEND_API_KEY` | Server | Resend API key for transactional emails (invoices, invites, alerts). |
| `UPSTASH_REDIS_REST_URL` | Server | Redis REST endpoint for atomic rate limiters and spend counters. |
| `UPSTASH_REDIS_REST_TOKEN` | Server | Upstash Redis authentication token. |

---

## 6. Security & Privacy Guarantees

1. **Zero Text Storage:** Inquiries submitted to the Verification Workbench are passed directly to `pipeline.draftReply()` and discarded from memory. No ticket questions or customer messages are ever stored in databases, logs, or file storage.
2. **Stealth 404 Operator Gate:** Any unauthenticated request or non-owner user attempting to access `/operator` or `/api/operator/*` receives an exact, unidentifiable `404 Not Found` response with identical headers and page markup as an unknown URL.
3. **Encrypted Tenant Secrets:** Per-organization HMAC event keys for `POST /api/events` are encrypted with AES-256-GCM at rest, require fresh TOTP MFA clearance to rotate, and are revealed exactly once upon generation.
4. **Tenant Isolation:** Every tenant query enforces cryptographic Row-Level Security (`org_id`). Org A can never read, modify, or insert data belonging to Org B.
