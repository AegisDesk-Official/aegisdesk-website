# AegisDesk — Architecture Refactoring & Tidy-Up Plan

**Status:** Plan Only (No files moved, zero code altered)  
**Target:** Clean modular architecture per user specifications  
**Guarantees:** Zero change in runtime behavior, 100% URL preservation, zero files deleted (dead files moved to `/_archive`), and continuous build passing.

---

## 1. Proposed Target Folder Structure

```
aegisdesk-round-3.1/
├── Root
│   ├── README.md                          # Primary project documentation & quickstart
│   ├── DESIGN.md                          # Visual thesis, token source of truth, Geist rules
│   ├── COPY.md                            # Canonical copy audit & approved wording
│   ├── .env.example                       # All environment variable placeholders
│   ├── .env.local                         # Local test-mode secrets (gitignored)
│   ├── package.json                       # Dependencies & scripts
│   ├── next.config.mjs                    # Next.js security headers & image config
│   ├── tailwind.config.ts                 # Design tokens & content scan paths
│   └── tsconfig.json                      # Path aliases & compiler settings
│
├── docs/                                  # All project architecture & operational runbooks
│   ├── ARCHITECTURE.md                    # Technical architecture & subsystem flow
│   ├── BILLING.md                         # Commercial terms ($3,500 setup + $1k/mo retainer)
│   ├── SECURITY.md                        # Threat model, RBAC, PII scrubbing & bot defense
│   ├── PROJECT_MAP.md                     # Deep component inventory & file registry
│   ├── RUNBOOK.md                         # Backup cadence, PITR recovery & 15-min drill
│   ├── EMAIL_DELIVERABILITY.md            # Exact SPF, DKIM, DMARC & MX DNS records
│   ├── COOKIE_AUDIT.md                    # Audit of cookies and zero-tracker posture
│   ├── EVENTS_API.md                      # HMAC signature & events ingestion specification
│   ├── CLEANUP_PLAN.md                    # This document (Tidy-up move map & risk matrix)
│   └── sample-invoice.pdf                 # Sample GST/Tax invoice artifact
│
├── public/                                # Public assets served directly by Next.js
│   ├── brand/                             # Canonical brand SVG mark, lockup, wordmark & favicon
│   │   ├── aegisdesk-lockup.svg
│   │   ├── aegisdesk-mark.svg
│   │   ├── aegisdesk-wordmark.svg
│   │   └── favicon.svg
│   └── images/                            # Static posters & fallback images
│       └── particle-silk-poster.webp
│
├── supabase/                              # Database migrations & seeds
│   ├── migrations/
│   │   ├── 20261025000000_initial_schema.sql
│   │   └── 20261026000000_events_api_and_org_settings.sql
│   └── seed.sql                           # Multi-tenant test seed data
│
├── tests/                                 # Centralized automated test suite
│   ├── unit/                              # Deterministic unit test suites
│   │   ├── billing-razorpay.test.mjs      # Order creation, HMAC verification & deposit math
│   │   ├── cal-webhook.test.mjs           # Cal.com webhook signature & booking state sync
│   │   ├── metrics.test.mjs               # Hourly/daily rollups, deflection rate & latency
│   │   └── security-baseline.test.mjs     # Security headers, CSRF, honeypot, token validation
│   └── attack/                            # Adversarial & penetration test suites
│       ├── prompt-injection.test.mjs      # 10 known injection & jailbreak attack deflections
│       └── tenant-isolation.test.mjs      # Cross-tenant vector & database isolation tests
│
├── scripts/                               # CLI operational & reconciliation scripts
│   ├── generate-demo-events.mjs           # Synthetic support event generator
│   ├── generate-sample-invoice.mjs        # PDF invoice generation tool
│   └── reconcile-billing.mjs              # Ledger discrepancy audit tool
│
├── src/
│   ├── app/                               # Next.js App Router (100% URL parity preserved)
│   │   │   # Public Conversion & Legal Pages
│   │   ├── page.tsx                       # Homepage (Sylva editorial control room)
│   │   ├── pricing/page.tsx               # Commercial pricing ($3,500 setup + $1k/mo)
│   │   ├── security/page.tsx              # Enterprise security & Corrective RAG posture
│   │   ├── privacy/page.tsx               # GDPR / DPDP Act privacy policy
│   │   ├── terms/page.tsx                 # B2B Terms of Service
│   │   ├── dpa/page.tsx                   # Data Processing Agreement [CONFIRM WITH LAWYER]
│   │   ├── status/page.tsx                # Live platform status & 90-day SLA dashboard
│   │   ├── about/page.tsx                 # About us / corporate information
│   │   ├── contact/page.tsx               # Contact directory & support desk
│   │   ├── shipping-delivery/page.tsx     # Razorpay-mandated delivery policy
│   │   ├── cancellation-refunds/page.tsx  # Razorpay-mandated cancellation policy
│   │   ├── maintenance/page.tsx           # Scheduled maintenance screen
│   │   ├── styleguide/page.tsx            # Internal design token viewer
│   │   ├── layout.tsx                     # Root shell (Geist, Grain, Theme & Toast providers)
│   │   ├── globals.css                    # Tailwind directives & CSS color tokens
│   │   ├── not-found.tsx                  # Branded 404 error page
│   │   ├── error.tsx                      # Branded 500 runtime error boundary
│   │   ├── global-error.tsx               # Branded root layout error boundary
│   │   ├── robots.ts                      # Dynamic robots.txt with AI bot rules
│   │   ├── sitemap.ts                     # Dynamic XML sitemap
│   │   ├── opengraph-image.tsx            # Dynamic 1200x630 social preview card
│   │   ├── fonts/                         # Local font assets
│   │   │   ├── Geist-Variable.woff2
│   │   │   └── GeistMono-Variable.woff2
│   │   │
│   │   │   # Login & Authentication (/auth)
│   │   ├── auth/
│   │   │   ├── layout.tsx                 # Centered auth container shell
│   │   │   ├── sign-in/page.tsx           # Multi-tenant login form
│   │   │   ├── forgot-password/page.tsx   # Password reset request
│   │   │   ├── reset-password/page.tsx    # Password reset submission
│   │   │   ├── invite/page.tsx            # Team invitation claim page
│   │   │   ├── mfa-verify/page.tsx        # TOTP / 2FA verification
│   │   │   ├── email-verification/page.tsx# Verification link waiting screen
│   │   │   └── access-denied/page.tsx     # Role-based 403 screen
│   │   │
│   │   │   # Client Portal (/dashboard)
│   │   ├── dashboard/
│   │   │   ├── layout.tsx                 # Portal layout
│   │   │   ├── page.tsx                   # Client overview & Onboarding Checklist
│   │   │   ├── conversations/page.tsx     # Live & historic citation chat inspector
│   │   │   ├── knowledge-base/page.tsx    # Document upload & vector indexing manager
│   │   │   ├── assistant/page.tsx         # Threshold calibrator & system prompt editor
│   │   │   ├── analytics/page.tsx         # Deflection efficiency & latency trends
│   │   │   ├── security/page.tsx          # PII masking & audit trails
│   │   │   ├── team/page.tsx              # Role-based member management
│   │   │   ├── billing/page.tsx           # Setup deposit & retainer invoice review
│   │   │   └── settings/page.tsx          # Tenant settings & API keys
│   │   │
│   │   │   # Owner Operator Console (/operator)
│   │   ├── operator/
│   │   │   ├── layout.tsx                 # Dedicated operator shell
│   │   │   └── page.tsx                   # System health, emergency kill switch & reconcile
│   │   │
│   │   │   # API Routes (/api)
│   │   └── api/
│   │       ├── webhooks/
│   │       │   ├── cal/route.ts           # Cal.com booking sync webhook
│   │       │   └── razorpay/route.ts      # Razorpay payment & refund webhook
│   │       ├── events/
│   │       │   ├── route.ts               # Ingestion & verification endpoint
│   │       │   └── rollup/route.ts        # Hourly/daily aggregation rollups
│   │       ├── demo/route.ts              # Protected sample workbench inference
│   │       ├── status/route.ts            # Subsystem health & latency telemetry
│   │       ├── billing/
│   │       │   ├── create-order/route.ts  # Razorpay test order creation
│   │       │   ├── verify-payment/route.ts# Signature verification
│   │       │   ├── offline-payment/route.ts# Bank wire / offline recording
│   │       │   ├── refund/route.ts        # 2FA refund execution
│   │       │   ├── reconcile/route.ts     # Discrepancy detector
│   │       │   └── invoices/
│   │       │       ├── route.ts           # Invoice listing
│   │       │       └── [id]/pdf/route.ts  # Dynamic PDF generator
│   │       ├── documents/upload/route.ts  # Policy document ingestion
│   │       ├── leads/route.ts             # Scoping lead capture
│   │       ├── organization/
│   │       │   ├── onboarding/route.ts    # Onboarding checklist state & economics
│   │       │   ├── export/route.ts        # GDPR data export
│   │       │   └── delete/route.ts        # GDPR cryptographic erasure
│   │       ├── operator/workbench-control/route.ts # Spend cap & kill switch API
│   │       ├── terms/accept/route.ts      # Compliance terms acceptance ledger
│   │       └── auth/sign-out/route.ts     # Session revocation
│   │
│   ├── components/                        # Cleanly categorized UI components
│   │   ├── ui/                            # Design system primitives (Geist & tokens)
│   │   │   ├── button.tsx
│   │   │   ├── button-link.tsx
│   │   │   ├── input.tsx
│   │   │   ├── textarea.tsx
│   │   │   ├── label.tsx
│   │   │   ├── card.tsx
│   │   │   ├── panel.tsx
│   │   │   ├── paper-card.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── status-chip.tsx
│   │   │   ├── modal.tsx
│   │   │   ├── container.tsx
│   │   │   └── section-shell.tsx
│   │   │
│   │   ├── marketing/                     # Homepage & public conversion sections
│   │   │   ├── hero.tsx
│   │   │   ├── proof-strip.tsx
│   │   │   ├── verification-workbench.tsx
│   │   │   ├── answer-preview.tsx
│   │   │   ├── answer-parts.tsx
│   │   │   ├── demo-chat.tsx
│   │   │   ├── demo-gate-modal.tsx
│   │   │   ├── hallucination-comparison.tsx
│   │   │   ├── safety-pillars.tsx
│   │   │   ├── how-it-works.tsx
│   │   │   ├── integrations.tsx
│   │   │   ├── savings-example.tsx
│   │   │   ├── pilot-card.tsx
│   │   │   ├── founders.tsx
│   │   │   ├── faq.tsx
│   │   │   ├── final-cta.tsx
│   │   │   └── cal-embed-provider.tsx
│   │   │
│   │   ├── portal/                        # Client portal dashboard components
│   │   │   ├── onboarding-checklist.tsx
│   │   │   ├── dashboard-header.tsx
│   │   │   ├── dashboard-sidebar.tsx
│   │   │   ├── dashboard-shell.tsx
│   │   │   ├── sparkline.tsx
│   │   │   ├── state-views.tsx
│   │   │   ├── demo-tag.tsx
│   │   │   └── estimate-tooltip.tsx
│   │   │
│   │   ├── admin/                         # Owner operator console components
│   │   │   ├── operator-telemetry-strip.tsx
│   │   │   ├── operator-kill-switch.tsx
│   │   │   └── operator-discrepancy-table.tsx
│   │   │
│   │   ├── scenes/                        # Three.js 3D & canvas scenes
│   │   │   ├── index.tsx                  # Dynamic scene selector (?hero=terrain|ribbon)
│   │   │   ├── particle-silk.tsx          # Default particle silk shader
│   │   │   ├── terrain-scene.tsx          # Wireframe terrain shader
│   │   │   ├── ribbon-scene.tsx           # Fluid ribbon shader
│   │   │   └── fallback-scene.tsx         # Static CSS fallback
│   │   │
│   │   ├── layout/                        # Shared global layouts
│   │   │   ├── navbar.tsx
│   │   │   ├── footer.tsx
│   │   │   ├── legal-page.tsx
│   │   │   ├── status-page.tsx
│   │   │   └── cookie-notice.tsx
│   │   │
│   │   ├── brand/                         # Vector logo and lockup
│   │   │   └── logo.tsx
│   │   │
│   │   └── providers/                     # React Context providers
│   │       ├── theme-provider.tsx
│   │       ├── toast-provider.tsx
│   │       └── smooth-scroll-provider.tsx
│   │
│   ├── lib/                               # Clean modular business logic
│   │   ├── auth/                          # Authentication, sessions & RBAC
│   │   │   ├── context.tsx                # Client AuthProvider & useAuth hook
│   │   │   └── server-roles.ts            # Server-authoritative Supabase user loader
│   │   │
│   │   ├── db/                            # Database clients, queries & seed stores
│   │   │   ├── admin.ts                   # Supabase service role admin client
│   │   │   ├── client.ts                  # Supabase browser client
│   │   │   ├── server.ts                  # Supabase SSR cookie-based server client
│   │   │   ├── events-store.ts            # Events table store & in-memory ring buffer
│   │   │   ├── seed-data.ts               # Dashboard seed dataset (FinCorp, Apex)
│   │   │   └── mock-data.ts               # Assistant & tenant fallback mock data
│   │   │
│   │   ├── payments/                      # Razorpay billing, invoices & reconciliation
│   │   │   ├── razorpay.ts                # Order creation, HMAC verification & deposit math
│   │   │   ├── invoice-generator.ts       # PDF invoice & receipt engine
│   │   │   └── invoices-store.ts          # Invoice storage & reconciliation logic
│   │   │
│   │   ├── calendar/                      # Cal.com scheduling & webhook sync
│   │   │   ├── cal-store.ts               # Lead booking store & status transitions
│   │   │   └── verify-signature.ts        # Cal.com SHA-256 HMAC verification
│   │   │
│   │   ├── email/                         # Transactional messaging
│   │   │   └── resend.ts                  # Resend client, billing receipts & alert templates
│   │   │
│   │   ├── security/                      # Enterprise defense & guardrails
│   │   │   ├── audit.ts                   # Immutable security audit logger
│   │   │   ├── auth-roles.ts              # Session cookies, AAL2 (2FA) & timeout rules
│   │   │   ├── csp.ts                     # Strict Content Security Policy builder
│   │   │   ├── csrf.ts                    # Same-origin & CSRF validation
│   │   │   ├── prompt-injection.ts        # 10 adversarial heuristics & output scanner
│   │   │   ├── rate-limit.ts              # Upstash distributed sliding-window limiters
│   │   │   ├── sanitize.ts                # Zero-PII sanitization & safe logger
│   │   │   ├── turnstile.ts               # Server-side Cloudflare Turnstile verification
│   │   │   ├── upload.ts                  # Magic byte & virus/executable inspection
│   │   │   ├── workbench-control.ts       # Emergency kill switch & daily spend cap
│   │   │   ├── use-turnstile.ts           # Client-side Turnstile hook
│   │   │   └── demo-limits.ts             # Atomic Lua Redis rate-limit scripts
│   │   │
│   │   ├── metrics/                       # Telemetry, calculation & rollups
│   │   │   └── index.ts                   # Hourly/daily rollups, deflection rate & latency
│   │   │
│   │   ├── validation/                    # Zod schemas & types
│   │   │   ├── index.ts                   # Core validation schemas
│   │   │   ├── demo-schema.ts             # Demo query input validation
│   │   │   └── demo-types.ts              # Shared API error/success types
│   │   │
│   │   ├── monitoring/                    # Observability & error reporting
│   │   │   └── sentry.ts                  # Sentry beforeSend PII sanitizer & exception wrapper
│   │   │
│   │   ├── demo-backend.ts                # FastAPI inference proxy client
│   │   ├── demo-lead.ts                   # Make.com lead dispatcher
│   │   ├── demo-request.ts                # Client IP extraction & origin validation
│   │   ├── site-config.ts                 # Brand URLs, contact email, Cal link
│   │   ├── site-copy.ts                   # Structured copy & pricing metadata
│   │   └── utils.ts                       # `cn()` clsx/tailwind-merge helper
│   │
│   ├── middleware.ts                      # Root middleware (CSP headers, dashboard auth gate)
│   └── types/                             # Global TypeScript declarations
│       └── index.ts
│
└── _archive/                              # Dead, duplicate & superseded files (NOT DELETED)
    ├── components/
    │   ├── marketing/
    │   │   ├── sylva-hero.tsx             # Dead 12-line proxy for hero.tsx (0 imports)
    │   │   ├── demo-section.tsx           # Dead 9-line proxy for verification-workbench (0 imports)
    │   │   ├── video-slot.tsx             # Legacy unrendered Loom video slot (0 imports)
    │   │   └── dot-matrix-bg.tsx          # 600-line obsolete Three.js particle wave from R2.5
    │   └── ui/
    │       ├── progress.tsx               # Unused UI primitive (0 imports)
    │       └── skeleton.tsx               # Unused UI primitive (0 imports)
    ├── fonts/
    │   └── InterVariable.woff2            # 48 KB unused font superseded by Geist in R3
    ├── public/
    │   └── favicon.svg                    # Byte-for-byte duplicate of public/brand/favicon.svg
    └── lib/
        └── demo-turnstile.ts              # Superseded duplicate of src/lib/security/turnstile.ts
```

---

## 2. Complete Move Map (Old Path $\rightarrow$ New Path)

### Root Documentation $\rightarrow$ `docs/`
| Existing Path | New Path | Action / Rationale |
|---|---|---|
| `./ARCHITECTURE.md` | `./docs/ARCHITECTURE.md` | Move to `docs/` to keep root clean |
| `./BILLING.md` | `./docs/BILLING.md` | Move to `docs/` to keep root clean |
| `./SECURITY.md` | `./docs/SECURITY.md` | Move to `docs/` to keep root clean |
| `./PROJECT_MAP.md` | `./docs/PROJECT_MAP.md` | Move to `docs/` to keep root clean |
| `./GEMINI.md` | `./docs/GEMINI.md` | Move to `docs/` to keep root clean |
| `./README.md` | `./README.md` | **Stays at Root** |
| `./DESIGN.md` | `./DESIGN.md` | **Stays at Root** |
| `./COPY.md` | `./COPY.md` | **Stays at Root** |
| `./.env.example` | `./.env.example` | **Stays at Root** |

---

### Test Suites $\rightarrow$ `tests/ (unit, attack)`
| Existing Path | New Path | Action / Rationale |
|---|---|---|
| `src/lib/billing/__tests__/razorpay.test.mjs` | `tests/unit/billing-razorpay.test.mjs` | Centralize unit tests under `tests/unit/` |
| `src/lib/cal/__tests__/cal-webhook.test.mjs` | `tests/unit/cal-webhook.test.mjs` | Centralize unit tests under `tests/unit/` |
| `src/lib/metrics/__tests__/metrics.test.mjs` | `tests/unit/metrics.test.mjs` | Centralize unit tests under `tests/unit/` |
| `src/lib/security/__tests__/security-baseline.test.mjs` | `tests/unit/security-baseline.test.mjs` | Centralize unit tests under `tests/unit/` |
| `src/lib/security/__tests__/prompt-injection.test.mjs` | `tests/attack/prompt-injection.test.mjs` | Centralize attack tests under `tests/attack/` |
| `scripts/test-tenant-isolation.mjs` | `tests/attack/tenant-isolation.test.mjs` | Move attack script to `tests/attack/` |

---

### 3D Scenes $\rightarrow$ `src/components/scenes/`
| Existing Path | New Path | Action / Rationale |
|---|---|---|
| `src/components/marketing/hero-scene/index.tsx` | `src/components/scenes/index.tsx` | Move 3D scenes out of marketing into dedicated `scenes/` |
| `src/components/marketing/hero-scene/particle-silk.tsx` | `src/components/scenes/particle-silk.tsx` | Move 3D scenes out of marketing into dedicated `scenes/` |
| `src/components/marketing/hero-scene/terrain-scene.tsx` | `src/components/scenes/terrain-scene.tsx` | Move 3D scenes out of marketing into dedicated `scenes/` |
| `src/components/marketing/hero-scene/ribbon-scene.tsx` | `src/components/scenes/ribbon-scene.tsx` | Move 3D scenes out of marketing into dedicated `scenes/` |
| `src/components/marketing/hero-scene/fallback-scene.tsx` | `src/components/scenes/fallback-scene.tsx` | Move 3D scenes out of marketing into dedicated `scenes/` |

---

### Portal Dashboard Components $\rightarrow$ `src/components/portal/`
| Existing Path | New Path | Action / Rationale |
|---|---|---|
| `src/components/dashboard/onboarding-checklist.tsx` | `src/components/portal/onboarding-checklist.tsx` | Group portal components into `src/components/portal/` |
| `src/components/dashboard/demo-tag.tsx` | `src/components/portal/demo-tag.tsx` | Group portal components into `src/components/portal/` |
| `src/components/dashboard/estimate-tooltip.tsx` | `src/components/portal/estimate-tooltip.tsx` | Group portal components into `src/components/portal/` |
| `src/components/dashboard/sparkline.tsx` | `src/components/portal/sparkline.tsx` | Group portal components into `src/components/portal/` |
| `src/components/dashboard/state-views.tsx` | `src/components/portal/state-views.tsx` | Group portal components into `src/components/portal/` |
| `src/components/layout/dashboard-header.tsx` | `src/components/portal/dashboard-header.tsx` | Move portal header to `src/components/portal/` |
| `src/components/layout/dashboard-sidebar.tsx` | `src/components/portal/dashboard-sidebar.tsx` | Move portal sidebar to `src/components/portal/` |
| `src/components/layout/dashboard-shell.tsx` | `src/components/portal/dashboard-shell.tsx` | Move portal shell to `src/components/portal/` |

---

### Business Logic $\rightarrow$ `src/lib/ (auth, db, payments, calendar, validation)`
| Existing Path | New Path | Action / Rationale |
|---|---|---|
| `src/lib/auth.tsx` | `src/lib/auth/context.tsx` | Organize client AuthProvider inside `src/lib/auth/` |
| `src/lib/auth/server-roles.ts` | `src/lib/auth/server-roles.ts` | Stays in `src/lib/auth/` |
| `src/lib/supabase/admin.ts` | `src/lib/db/admin.ts` | Organize database clients under `src/lib/db/` |
| `src/lib/supabase/client.ts` | `src/lib/db/client.ts` | Organize database clients under `src/lib/db/` |
| `src/lib/supabase/server.ts` | `src/lib/db/server.ts` | Organize database clients under `src/lib/db/` |
| `src/lib/events-store.ts` | `src/lib/db/events-store.ts` | Organize database store under `src/lib/db/` |
| `src/lib/dashboard-seed-data.ts` | `src/lib/db/seed-data.ts` | Organize seed data under `src/lib/db/` |
| `src/lib/mock-data.ts` | `src/lib/db/mock-data.ts` | Organize mock data under `src/lib/db/` |
| `src/lib/billing/razorpay.ts` | `src/lib/payments/razorpay.ts` | Move billing logic to `src/lib/payments/` |
| `src/lib/billing/invoice-generator.ts` | `src/lib/payments/invoice-generator.ts` | Move billing logic to `src/lib/payments/` |
| `src/lib/billing/invoices-store.ts` | `src/lib/payments/invoices-store.ts` | Move billing logic to `src/lib/payments/` |
| `src/lib/cal/cal-store.ts` | `src/lib/calendar/cal-store.ts` | Move Cal logic to `src/lib/calendar/` |
| `src/lib/cal/verify-signature.ts` | `src/lib/calendar/verify-signature.ts` | Move Cal logic to `src/lib/calendar/` |
| `src/lib/validation.ts` | `src/lib/validation/index.ts` | Group validation schemas under `src/lib/validation/` |
| `src/lib/demo-schema.ts` | `src/lib/validation/demo-schema.ts` | Group validation schemas under `src/lib/validation/` |
| `src/lib/demo-types.ts` | `src/lib/validation/demo-types.ts` | Group validation schemas under `src/lib/validation/` |
| `src/components/marketing/use-turnstile.ts` | `src/lib/security/use-turnstile.ts` | Move Turnstile client hook from marketing to security |
| `src/lib/demo-limits.ts` | `src/lib/security/demo-limits.ts` | Move rate limit logic to `src/lib/security/` |

---

### Dead & Duplicate Files $\rightarrow$ `/_archive/` (Never Deleted)
| Existing Path | Archive Path | Exact Reason for Archiving |
|---|---|---|
| `src/components/marketing/sylva-hero.tsx` | `_archive/components/marketing/sylva-hero.tsx` | **Dead wrapper:** 12-line proxy forwarding to `hero.tsx`. 0 imports across codebase. |
| `src/components/marketing/demo-section.tsx` | `_archive/components/marketing/demo-section.tsx` | **Dead wrapper:** 9-line proxy forwarding to `verification-workbench.tsx`. 0 imports across codebase. |
| `src/components/marketing/video-slot.tsx` | `_archive/components/marketing/video-slot.tsx` | **Dead component:** Legacy Loom video slot from Round 1. 0 imports across codebase. |
| `src/components/marketing/dot-matrix-bg.tsx` | `_archive/components/marketing/dot-matrix-bg.tsx` | **Dead component:** 600 lines of obsolete Three.js particle mesh from Round 2.5, completely superseded by `hero-scene`. 0 imports. |
| `src/components/ui/progress.tsx` | `_archive/components/ui/progress.tsx` | **Dead UI primitive:** 0 imports across codebase. (Onboarding uses custom accessible progress bar). |
| `src/components/ui/skeleton.tsx` | `_archive/components/ui/skeleton.tsx` | **Dead UI primitive:** 0 imports across codebase. (Replaced by `DashboardSkeleton` in `state-views.tsx`). |
| `src/app/fonts/InterVariable.woff2` | `_archive/fonts/InterVariable.woff2` | **Dead asset:** 48 KB legacy font from Round 1. Unused anywhere; `layout.tsx` uses `Geist-Variable.woff2` per DESIGN.md. |
| `public/favicon.svg` | `_archive/public/favicon.svg` | **Duplicate asset:** Byte-for-byte duplicate of `public/brand/favicon.svg` (7,106 bytes). |
| `src/lib/demo-turnstile.ts` | `_archive/lib/demo-turnstile.ts` | **Duplicate helper:** Redundant copy of `src/lib/security/turnstile.ts`. |

---

## 3. Risks & Verification Strategy

| Risk | Impact | Prevention & Mitigation |
|---|---|---|
| **Broken Import Paths (`@/...`)** | Webpack compilation error on build | Update all import references atomically; add temporary backward-compatibility re-exports during transition if needed; run `npm run build` after every step to verify 0 errors. |
| **Accidental URL Route Changes** | Broken client bookmarks or SEO rankings | **Strict Rule:** Zero changes to `src/app/**/page.tsx` directory structure. All 18 public pages, 8 auth pages, 10 dashboard pages, and 2 operator pages maintain exact URL parity. |
| **Tailwind CSS Purging Class Drops** | Broken styling in newly created directories | Update `tailwind.config.ts` content array to cover all new component paths: `content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"]`. |
| **Dual Export Violation** | Webpack `Attempted import error` crashes | Preserve both named and default exports (`export function X` and `export default X`) on all moved components in `src/components/`. |
| **Accidental File Deletion** | Loss of historical implementations | **Strict Rule:** Delete nothing. All dead and duplicate files are relocated to `/_archive/` preserving directory structure. |
| **Test Suite Breakage** | Broken `node --test` test runners | Update relative import paths in the 6 test files when moved from `src/lib/*/__tests__/` to `tests/unit/` and `tests/attack/`. Run all 26+ tests to verify 100% pass rate. |

---

## 4. Execution Sequence (When Authorized)

1. **Step 1:** Create target directory structure (`tests/unit`, `tests/attack`, `docs`, `src/components/portal`, `src/components/scenes`, `src/components/admin`, `src/lib/db`, `src/lib/payments`, `src/lib/calendar`, `src/lib/validation`, `_archive`).
2. **Step 2:** Relocate root documentation files to `docs/` (preserving `README.md`, `DESIGN.md`, `COPY.md`, and `.env.example` at root).
3. **Step 3:** Relocate test suites to `tests/unit/` and `tests/attack/`, update test import paths, and run `node --test` to confirm all pass.
4. **Step 4:** Move dead/duplicate files to `_archive/`.
5. **Step 5:** Move components (`portal/`, `scenes/`) and business logic (`payments/`, `calendar/`, `db/`), updating `@/...` imports in affected consumers.
6. **Step 6:** Run `npm run build` to confirm 0 TypeScript, Webpack, or ESLint errors.
7. **Step 7:** Run `npm test` and inspect all 41 routes.
