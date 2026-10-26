# AegisDesk — Project Map

A technical audit and architectural breakdown of the AegisDesk codebase (`aegisdesk-round-3.1`).

---

## 1. Framework, Versions, and How to Run

### Core Stack
- **Framework:** Next.js `14.2.21` (App Router, Node runtime)
- **UI Library:** React `18.3.1` / React DOM `18.3.1`
- **Language / Compiler:** TypeScript `5.7.2`
- **Styling:** Tailwind CSS `3.4.16` + PostCSS `8.4.49` + Autoprefixer `10.4.20`
- **Node Requirement:** `>=18.18.0`

### Available Scripts
| Command | Description |
|---|---|
| `npm run dev` | Starts local Next.js development server at `http://localhost:3000` |
| `npm run build` | Compiles production build and validates TypeScript/linting |
| `npm run start` | Serves compiled production build |
| `npm run lint` | Runs Next.js ESLint validation |

### Running the Project
1. Run `npm install` (dependencies already present in `node_modules`).
2. Verify `.env.local` exists (created from `.env.example`).
3. Run `npm run dev`.
4. *Access Note:* By default, `DASHBOARD_PREVIEW="false"` and `DEMO_ENABLED="false"` in `.env.local`. Gated routes (`/dashboard/*`, `/auth/*`) redirect to `/` via `src/middleware.ts` unless `DASHBOARD_PREVIEW="true"`.

---

## 2. Every Page, Route, and Component

### Pages and Routing (`src/app/`)
| Path / Route | File | One-Line Purpose |
|---|---|---|
| `/` | `src/app/page.tsx` | Main marketing landing page assembling all Sylva-themed conversion sections. |
| `/privacy` | `src/app/privacy/page.tsx` | Enterprise GDPR/DPDP-compliant privacy policy legal page. |
| `/terms` | `src/app/terms/page.tsx` | Enterprise Terms of Service and SLA legal agreement page. |
| `/not-found` (404) | `src/app/not-found.tsx` | Custom branded 404 error page using `StatusPage`. |
| Error Boundary | `src/app/error.tsx` | Global client-side runtime error boundary with retry trigger. |
| Root Layout | `src/app/layout.tsx` | Root HTML shell with font definitions, meta tags, and provider wrappers. |
| `/robots.txt` | `src/app/robots.ts` | Dynamic search engine indexing rules. |
| `/sitemap.xml` | `src/app/sitemap.ts` | Dynamic XML sitemap generator for production SEO. |
| `/opengraph-image` | `src/app/opengraph-image.tsx` | Dynamic OpenGraph image generator using `@vercel/og` ImageResponse. |
| `/api/demo` (API) | `src/app/api/demo/route.ts` | Rate-limited POST route proxying demo queries to FastAPI backend with Upstash Redis enforcement. |
| `/auth` (Layout) | `src/app/auth/layout.tsx` | Centered authentication container layout with brand shield header. |
| `/auth/sign-in` | `src/app/auth/sign-in/page.tsx` | Multi-tenant login form with pre-filled demo credentials and toast notifications. |
| `/auth/forgot-password` | `src/app/auth/forgot-password/page.tsx` | Password reset request form with email validation. |
| `/auth/reset-password` | `src/app/auth/reset-password/page.tsx` | New password submission form with confirmation check. |
| `/auth/email-verification` | `src/app/auth/email-verification/page.tsx` | Status screen prompting user to verify their corporate inbox. |
| `/auth/access-denied` | `src/app/auth/access-denied/page.tsx` | Role-based 403 access barrier notification screen. |
| `/dashboard` (Layout) | `src/app/dashboard/layout.tsx` | Authenticated client portal shell integrating sidebar and top navigation. |
| `/dashboard` | `src/app/dashboard/page.tsx` | High-level metrics overview: deflection rate, accuracy score, and active volume. |
| `/dashboard/conversations`| `src/app/dashboard/conversations/page.tsx` | Live and historic customer support chat inspector with citation trails. |
| `/dashboard/knowledge-base`| `src/app/dashboard/knowledge-base/page.tsx`| Document upload and indexing status manager for ingested PDFs/SOPs. |
| `/dashboard/assistant` | `src/app/dashboard/assistant/page.tsx` | System prompt editor, confidence threshold slider, and fallback calibrator. |
| `/dashboard/analytics` | `src/app/dashboard/analytics/page.tsx` | Deflection efficiency, latency distributions, and escalation trends. |
| `/dashboard/security` | `src/app/dashboard/security/page.tsx` | PII masking controls, audit trails, and multi-tenant isolation telemetry. |
| `/dashboard/team` | `src/app/dashboard/team/page.tsx` | Role-based member management (Admin, Agent, Viewer) and seat assignments. |
| `/dashboard/billing` | `src/app/dashboard/billing/page.tsx` | Subscription invoice review, tier limits, and payment method details. |
| `/dashboard/settings` | `src/app/dashboard/settings/page.tsx` | Tenant configuration, API key generation, and webhook setup. |

---

### Marketing Components (`src/components/marketing/`)
| Component | File | One-Line Purpose |
|---|---|---|
| `SylvaHero` | `sylva-hero.tsx` | Editorial hero with cursor-tracking ambient light pool, 3D parallax, and headline. |
| `Hero` | `hero.tsx` | Backwards-compatibility wrapper forwarding props directly to `SylvaHero`. |
| `DotMatrixBackground`| `dot-matrix-bg.tsx` | Three.js animated mathematical wave mesh and 3D knowledge arch canvas. |
| `DemoSection` | `demo-section.tsx` | Anchor wrapper switching between live chat (`DemoChat`) and mock console (`AnswerPreview`). |
| `AnswerPreview` | `answer-preview.tsx` | Simulated live RAG console toggling verified citation playback and human escalation. |
| `AnswerParts` | `answer-parts.tsx` | Sub-renderer parsing citation tokens `[1]` into clickable interactive pills. |
| `DemoChat` | `demo-chat.tsx` | Live interactive chat interface with Turnstile security, rate limits, and lead gating. |
| `DemoGateModal` | `demo-gate-modal.tsx` | Lead-capture modal collecting name, email, and phone before granting live demo queries. |
| `useTurnstile` | `use-turnstile.ts` | React hook managing Cloudflare Turnstile script loading and token acquisition. |
| `VideoSlot` | `video-slot.tsx` | Fallback video container rendering Loom embed if `NEXT_PUBLIC_LOOM_URL` is set. |
| `SectionHeading` | `section-heading.tsx` | Standardized section header with pill eyebrow, bold display title, and subcopy. |
| `HallucinationComparison`| `hallucination-comparison.tsx` | Interactive split card contrasting generic LLM hallucinations against grounded RAG. |
| `SafetyPillars` | `safety-pillars.tsx` | Four technical safeguard cards (Strict Verification, Human Escalation, Zero Training, Privacy). |
| `HowItWorks` | `how-it-works.tsx` | Three-phase roadmap explaining Indexing, 14-Day Shadow Mode, and Live Routing. |
| `Integrations` | `integrations.tsx` | Enterprise helpdesk logo grid (Zendesk, Gorgias, Salesforce, Intercom, Webhooks). |
| `SavingsExample` | `savings-example.tsx` | Interactive client-side ROI calculator with dynamic sliders and preset pills. |
| `PilotCard` | `pilot-card.tsx` | Warm ivory dossier card detailing the $2,500 setup + $1,000/mo commercial offer and Cal.com CTA. |
| `Founders` | `founders.tsx` | Operator trust section detailing the engineering and support calibration team. |
| `Faq` | `faq.tsx` | Accordion answering technical, security, and onboarding customer questions. |

---

### Layout, Brand & UI Components (`src/components/`)
| Component | File | One-Line Purpose |
|---|---|---|
| `Navbar` | `layout/navbar.tsx` | Floating glass dock with pointer-tracking specular rim and section anchor jump links. |
| `Footer` | `layout/footer.tsx` | Global dark footer with brand mark, legal links, email link, and copyright notice. |
| `StatusPage` | `layout/status-page.tsx` | Generic centered layout for 404 and 500 error screens with action buttons. |
| `LegalPage` | `layout/legal-page.tsx` | Editorial two-column template rendering Markdown-style legal terms and privacy policies. |
| `DashboardSidebar` | `layout/dashboard-sidebar.tsx` | Collapsible navigation rail for the client portal with section routing and active badges. |
| `DashboardHeader` | `layout/dashboard-header.tsx` | Portal top bar showing current tenant selector, theme switcher, and user avatar. |
| `Logo` & `LogoMark` | `brand/logo.tsx` | SVG shield vector icon with radial gradient backdrop and optional wordmark. |
| `ThemeProvider` | `providers/theme-provider.tsx` | Context holding light/dark/system theme state (forced to dark on public landing). |
| `ToastProvider` | `providers/toast-provider.tsx` | Global toast dispatch system rendering temporary floating alert banners. |
| `SmoothScrollProvider`| `providers/smooth-scroll-provider.tsx`| Initializes Lenis smooth scrolling synced with GSAP ScrollTrigger ticks. |
| `Button` | `ui/button.tsx` | Reusable button component styled with class variants (default, outline, ghost). |
| `ButtonLink` | `ui/button-link.tsx` | Accessible Next.js `Link` wrapper styled with `buttonVariants`. |
| `Badge` | `ui/badge.tsx` | Small status indicator pill with semantic color styling. |
| `Card` (+ subparts)| `ui/card.tsx` | Base container card with header, title, description, content, and footer primitives. |
| `Input` | `ui/input.tsx` | Styled accessible form text input with focus rings and disabled states. |
| `Textarea` | `ui/textarea.tsx` | Multi-line text field component for prompt inputs and feedback forms. |
| `Modal` | `ui/modal.tsx` | Accessible modal dialog with backdrop blur, focus trapping, and ESC dismiss. |
| `Progress` | `ui/progress.tsx` | Horizontal percentage bar for token metrics and deflection visualizers. |
| `Skeleton` | `ui/skeleton.tsx` | Animated pulse placeholder block for loading states. |

---

## 3. Libraries in `package.json` and Where They Are Used

| Package | Version | Usage in Project | Status |
|---|---|---|---|
| `next` | `^14.2.21` | Core App Router framework, server routing, and static generation. | **In Use** |
| `react` & `react-dom` | `^18.3.1` | Core component rendering and hooks. | **In Use** |
| `typescript` | `^5.7.2` | Type definitions and compiler checks across all `.ts`/`.tsx` files. | **In Use** |
| `tailwindcss` | `^3.4.16` | Utility-first styling engine driving design tokens and layouts. | **In Use** |
| `postcss` & `autoprefixer`| `^8.4.49` / `^10.4.20` | CSS processing pipeline in `postcss.config.js`. | **In Use** |
| `gsap` | `^3.15.0` | Orchestrates scroll triggers, entrance staggers, and Lenis sync. | **In Use** |
| `@gsap/react` | `^2.1.2` | `useGSAP` hook used in `sylva-hero`, `safety-pillars`, `hallucination-comparison`, `how-it-works`, `integrations`, and `answer-preview`. | **In Use** |
| `lenis` | `^1.3.27` | Smooth scrolling engine in `smooth-scroll-provider.tsx` and `modal.tsx`. | **In Use** |
| `three` & `@types/three` | `^0.186.1` | Dynamically imported in `dot-matrix-bg.tsx` to render the 3D wave mesh. | **In Use** |
| `lucide-react` | `^0.468.0` | Icon set used across navbar, footer, marketing pillars, and dashboard. | **In Use** |
| `clsx` & `tailwind-merge`| `^2.1.1` / `^2.5.5` | Class combining utility `cn(...)` in `src/lib/utils.ts`. | **In Use** |
| `geist` | `^1.8.1` | `GeistSans` and `GeistMono` variable fonts imported in `src/app/layout.tsx`. | **In Use** |
| `zod` | `^3.24.1` | Schema validation in `src/lib/demo-schema.ts`, `validation.ts`, and auth forms. | **In Use** |
| `@upstash/redis` | `^1.34.0` | IP and token rate-limiting in `src/lib/demo-limits.ts`. | **In Use** *(Falls back to memory if credentials omitted)* |
| `react-hook-form` | `^7.54.1` | Form state management in `/auth/sign-in`, `/auth/forgot-password`, `/auth/reset-password`. | ⚠️ **Effectively Unused in Public Site** *(Only used on gated `/auth` routes)* |
| `@hookform/resolvers` | `^3.9.1` | Zod resolver adapter for `react-hook-form` in `/auth` pages. | ⚠️ **Effectively Unused in Public Site** *(Only used on gated `/auth` routes)* |
| `eslint` & `eslint-config-next`| `^8.57.1` / `14.2.35` | Linting tools configured in `.eslintrc.json`. | **Dev Only** |

---

## 4. Working Logic vs. Presentation Only

| Subsystem | Logic Type | Working Status & Implementation Details |
|---|---|---|
| **ROI / Savings Calculator** (`savings-example.tsx`) | **Real Logic** | Full client-side calculation using active React state (`tickets`, `costPerTicket`, `resolutionPct`). Computes baseline cost, AI-automated savings, human remainder, net monthly/annual savings, and preset toggles in real time. |
| **Demo Chat API & Rate Limiting** (`/api/demo`) | **Real Logic** | Complete server route in `src/app/api/demo/route.ts`. Handles payload size limits, honeypot traps, Upstash Redis atomic increment rate limits, Turnstile token validation, and FastAPI backend proxying. |
| **Lead Capture Modal** (`demo-gate-modal.tsx`) | **Real Logic** | Form validation, Turnstile verification, and state dispatch passed into `DemoChat` and `/api/demo`. |
| **Live RAG Workbench Console** (`answer-preview.tsx`) | **Presentation / Simulation** | Purely visual interactive playback. Switches between two hardcoded static mock scenarios (`VERIFIED_EXAMPLE` and `ESCALATED_EXAMPLE`) with simulated typing and static mock citation cards. Does **not** call an LLM. |
| **Client Portal / Dashboard** (`/dashboard/*`) | **Presentation / Simulated** | Contains full interactive UI shells (tabs, modals, charts, inputs) powered by `src/lib/api-client.ts` and `src/lib/mock-data.ts`. Unless connected to a live FastAPI instance with `NEXT_PUBLIC_USE_MOCK_API="false"`, all data is local in-memory mock fixtures. Entirely locked behind middleware by default. |
| **Authentication Flow** (`/auth/*`) | **Presentation / Simulated** | Validates forms with Zod, sets a mock token in `localStorage`, and signs in a pre-configured mock user (`MOCK_USER`). No live identity provider (Supabase/Auth0/NextAuth) connected. |
| **3D Background Canvas** (`dot-matrix-bg.tsx`) | **Real Logic** | Active WebGL vertex/fragment shader simulation with cursor repulsion math, responsive pixel ratio downsampling, and 2D canvas fallback. |

---

## 5. Current Design Tokens

### Color Palette
- **Obsidian Dark Canvas:**
  - `globals.css`: `--sylva-obsidian: #070908;`, `--sylva-obsidian-elevated: #0C100E;`
  - `tailwind.config.ts`: `obsidian.DEFAULT: #050507`, `obsidian.elevated: #0A0A0E`, `obsidian.surface: #0E0E14`
  - Hardcoded component surfaces: `#0c100d`, `#070908`
- **Tactile Warm Ivory Dossier:**
  - `globals.css`: `--sylva-dossier-bg: #F2F3EF;`, `--sylva-dossier-ink: #1C201B;`, `--sylva-dossier-border: #DCDFD6;`
  - `tailwind.config.ts`: `dossier.DEFAULT: #F5F2EB`, `dossier.ink: #111113`, `dossier.border: #D8D3C8`
- **Forest / Verified Emerald:**
  - `tailwind.config.ts`: `verified.DEFAULT: #34d399`, `verified.muted: #10b981`
  - WebGL Wave: `COLOR_SAGE_DEEP` (`0x1a261e`), `COLOR_MOSS_MID` (`0x3d6b4c`), `COLOR_CANOPY_LIGHT` (`0x86efac`)
- **Legacy Brand Blue (Website 2.0 leftover):**
  - `tailwind.config.ts`: `brand.500: #3b82f6`, `brand.600: #2563eb` (used in `demo-chat.tsx` buttons).

### Typography
- **Display / Editorial Headings:** Google Font **Lexend** (weights 300, 400, 500, 600) loaded via external Google Fonts `<link>` tag in `layout.tsx`.
- **Sans Primary:** `var(--font-sans)` resolves to Lexend with fallback to `GeistSans` (`geist/font/sans`).
- **Monospace:** `var(--font-mono)` resolves to `GeistMono` (`geist/font/mono`) for latency metrics, citations, and numbers.
- **Unused Font:** `src/app/fonts/InterVariable.woff2` is present in the filesystem but never loaded in `layout.tsx`.

### Tailwind Configuration & Custom Utilities
- **Hairline Grids:** `bg-sylva-grid` (`rgba(255,255,255,0.08)` 1px hairlines) and `bg-grid-lg` (`4rem 4rem`).
- **Specular Shadows:** `shadow-specular-top` (`inset 0 1px 0 0 rgba(255, 255, 255, 0.12)`).
- **Custom CSS Classes in `globals.css`:**
  - `.sylva-ivory-card`: Ivory background `#F2F3EF`, dark ink text `#1C201B`, 36px radius, specular top highlight.
  - `.sylva-liquid-pill`: Semi-transparent glass capsule with top highlight gradient.
  - `[data-spec]`: Cursor-tracking pointer angle specular rim gradient using `-webkit-mask`.
  - `.sylva-par`: 3D perspective mouse parallax transform.
  - `.sylva-crosshair`: Small monospace `+` sign for structural grid intersections.

### Old Tokens to Be Removed Later (Pruning Plan)
Per `DESIGN.md`, the site standardizes on a single color world (`--canvas`, `--surface`, `--surface-2`, `--line`, `--text`, `--brand`, `--paper`, etc.). The following legacy tokens are kept temporarily so existing un-refactored pages don't crash, and must be deleted once sections are refactored:

1. **Legacy Blue Scale (`tailwind.config.ts`):**
   - `brand.50` through `brand.950` (`#eff6ff` ... `#3b82f6` ... `#172554`) — to be replaced everywhere with `--brand` (`#0A433A`) or `--paper`.
2. **Round 3.1 Obsidian Tokens (`tailwind.config.ts` & `globals.css`):**
   - `obsidian.DEFAULT` (`#050507`), `obsidian.elevated` (`#0A0A0E`), `obsidian.surface` (`#0E0E14`), `obsidian.border`
   - `--sylva-obsidian`, `--sylva-obsidian-elevated`, `--sylva-hairline`, `--sylva-specular`
3. **Round 3.1 Dossier Tokens (`tailwind.config.ts` & `globals.css`):**
   - `dossier.DEFAULT` (`#F5F2EB`), `dossier.surface` (`#EFECE4`), `dossier.ink` (`#111113`), `dossier.muted` (`#52514E`), `dossier.border` (`#D8D3C8`)
   - `--sylva-dossier-bg`, `--sylva-dossier-ink`, `--sylva-dossier-label`, `--sylva-dossier-border`
4. **Radix / Shadcn HSL Tokens (`globals.css` & `tailwind.config.ts`):**
   - `--background`, `--foreground`, `--card`, `--card-foreground`, `--popover`, `--primary`, `--secondary`, `--destructive`, `--muted`, `--accent`, `--border`, `--input`, `--ring`, `--radius`
5. **Legacy Font Tokens:**
   - `--font-lexend: "Lexend"` and external Google Font link (replaced by `next/font` Geist and Geist Mono).
6. **Legacy Shadows & Background Grids:**
   - `shadow-card-elevated`, `shadow-obsidian-elevated`, `shadow-dossier-card`, `shadow-specular-top`, `shadow-inner-top`
   - `bg-grid-slate`, `bg-grid-slate-faint`, `bg-sylva-grid`, `bg-sylva-grid-subtle`
7. **Legacy CSS Classes in `globals.css`:**
   - `.surface-card`, `.surface-card-interactive`, `.surface-inset`, `.label-mono`
   - `.sylva-ivory-card`, `.sylva-liquid-pill`, `.sylva-knob`, `[data-spec]`, `.sylva-par`, `.sylva-scroll-track`
   - `.cfo-slider` custom pseudo-classes (to be harmonized with standard range tokens)

---

## 6. Duplicated, Dead, or Leftover Code

1. **Unused Font File:**
   - `src/app/fonts/InterVariable.woff2` (48KB) is in the directory but completely bypassed in `src/app/layout.tsx`.
2. **Wrapper Component Leftover:**
   - `src/components/marketing/hero.tsx` is an obsolete 12-line forwarding file that only wraps `SylvaHero`. `src/app/page.tsx` imports `SylvaHero` directly.
3. **Frozen Dashboard & Auth Footprint:**
   - 17 route files (`src/app/dashboard/*` and `src/app/auth/*`), `src/components/layout/dashboard-*.tsx`, `src/lib/api-client.ts` (492 lines), and `src/lib/mock-data.ts` (375 lines) are completely dead in production because `middleware.ts` forces a redirect to `/` when `DASHBOARD_PREVIEW !== "true"`.
4. **Outdated Product Identity in LocalStorage:**
   - `src/lib/auth.tsx` (line 38) still queries `localStorage.getItem("omni_token")`, a leftover from an earlier internal project codename ("Omni" / "OmniSupport").
5. **Broken Navigation Link in Config:**
   - `src/lib/site-config.ts` declares `clientLoginHref: "/dashboard/login"`, but the actual sign-in route in the repository is `/auth/sign-in`.
6. **Commercial Model Discrepancy:**
   - Marketing site copy emphasizes the signature service: **$2,500 setup + $1,000/mo retainer**.
   - Meanwhile, `src/types/index.ts` and `src/lib/mock-data.ts` declare self-serve SaaS tiers (Starter $79/mo, Professional $199/mo, Enterprise $499/mo) leftover from Website 1.0.
7. **Unmounted Section Heading Component:**
   - `src/components/marketing/section-heading.tsx` is imported individually by multiple sub-components rather than orchestrated from a single layout schema, resulting in minor prop inconsistencies.

---

## 7. Top Ten Reasons the Site Looks Inconsistent

1. **Near-Black Canvas Shifting:** The page does not use a single background color. It arbitrarily alternates between `#070908` (root page), `#050507` (Tailwind token), `#0C100E` (elevated cards), `#0c100d` (sections), and `#0E0E14` (surfaces).
2. **Accidental Brand Blue Intrusion:** `tailwind.config.ts` maintains a standard blue palette (`brand-500: #3b82f6`, `brand-600: #2563eb`), which is applied to the CTA button in `demo-chat.tsx`. This bright royal blue clashes violently with the forest green, emerald, and warm ivory palette used throughout the rest of the site.
3. **Ivory vs. Dark Card Rhythm Clashing:** The editorial warm ivory styling (`.sylva-ivory-card` / `PilotCard`) is visually striking, but is used in only one or two isolated spots. Surrounding sections abruptly jump back to dark obsidian containers, making the ivory blocks feel dropped in rather than part of a deliberate editorial cadence.
4. **Font Loading Pop (FOUC):** Lexend is loaded via an un-optimized `<link>` tag pointing to Google Fonts. On initial load or slower networks, the typography pops from system sans / Geist to Lexend, causing noticeable layout shifts in headlines.
5. **Border Radius Fragmentation:** Corner radiuses vary without an underlying scale: the navbar dock is `rounded-[16px]`, the logo tile is `rounded-[11px]`, UI cards are `rounded-2xl` (16px), feature cards are `rounded-[28px]` or `rounded-[30px]`, and ivory/calculator containers are `rounded-[36px]`.
6. **Container Width Jumps:** Content bounds jump between breakpoints across sections: the Navbar and Hero span `max-w-7xl` (1280px), Comparison, Safety, and Savings span `max-w-6xl` (1152px), and the Pilot Card constrains to `max-w-5xl` (1024px). Vertical edge alignment breaks continuously during scroll.
7. **Specular Lighting Discontinuity:** High-fidelity effects like the pointer-tracking specular rim (`[data-spec]`) and 3D mouse parallax (`.sylva-par`) are concentrated entirely in the Navbar and Hero. The remainder of the landing page is completely flat, giving the impression that two different templates were merged together.
8. **Three Distinct Brand Logos in Use:** The brand identity is rendered differently across surfaces: `navbar.tsx` renders a custom inline green-check shield SVG; `src/components/brand/logo.tsx` (used by the footer) renders a geometric shield with cyan-blue gradient fills; and `public/favicon.svg` uses a third distinct vector graphic.
9. **Arbitrary Border Opacity and Divider Styles:** Hairline borders switch inconsistently between `border-white/[0.06]`, `border-white/[0.08]`, `border-white/10`, and `border-white/[0.12]`. Architectural grid crosshairs (`+`) appear in the Hero and How-It-Works, but disappear from Savings, Safety, and FAQs.
10. **Theme Switcher Conflict in Gated Portal:** The app layout forces a dark mode class script on `<html>`, while `ThemeProvider` allows switching to a light theme in the dashboard header. Triggering light mode breaks dark hardcoded backgrounds (`#070908`), creating unreadable white-on-white and black-on-black UI components.
