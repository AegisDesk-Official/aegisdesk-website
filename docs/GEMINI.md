# AegisDesk Round 3.1 — Master Agent Blueprint (Upgrading from Round 2.5)

## 1. Existing Round 2.5 Folder Structure
- `src/app/page.tsx`, `src/app/layout.tsx`, `src/app/globals.css`
- `src/components/marketing/` (contains Round 2.5 components like `hero.tsx`, `answer-preview.tsx`, `safety-pillars.tsx`, `how-it-works.tsx`, `dot-matrix-bg.tsx`)
- `src/lib/site-copy.ts` and `src/lib/site-config.ts` (contains existing AegisDesk copy and configuration)
- `tailwind.config.ts` and `package.json`

## 2. Core Business Logic & Offer (Must Preserve & Highlight)
- **Product:** AegisDesk — Deterministic, Bank-Grade B2B Customer Support AI powered by Corrective RAG (zero hallucinations, cryptographically/strictly verified citations, human-in-the-loop escalation when confidence thresholds aren't met).
- **Signature Onboarding:** 14-Day Shadow Mode (AI drafts responses alongside human agents for approval and calibration before going live).
- **Commercial Terms:** $2,500 one-time Setup & Integration Fee + $1,000/month Retainer.

## 3. Round 3.1 Aesthetic: "Sylva Spatial Editorial"
- **Deep Obsidian Canvas:** Primary background `#050507`, elevated surface `#0A0A0E`, subtle top specular edge highlight (`inset 0 1px 0 0 rgba(255,255,255,0.12)`).
- **Exposed Structural Hairline Grid:** Visible `1px solid rgba(255, 255, 255, 0.08)` architectural grid lines dividing sections and cells with crisp crosshair (`+`) intersection markers.
- **Tactile Ivory Dossier Cards:** High-contrast editorial cards (`#F5F2EB` warm ivory surface with `#111113` crisp ink typography and `#D8D3C8` 1px borders) used selectively to contrast against the obsidian canvas for high-trust technical/financial proof.
- **Typography & Telemetry:** High-contrast editorial display headlines, clean sans body copy, and monospace (`JetBrains Mono` / `Geist Mono`) for live latency metrics, confidence scores, citation IDs, and ROI telemetry.

## 4. Strict Technical Guardrails (CRITICAL — NEVER VIOLATE)
- **Install Missing Round 3 Dependencies First:** Check `package.json` and run `npm install three @types/three gsap @gsap/react` (plus `lucide-react` or `framer-motion` if needed) before compiling new Round 3 components.
- **Dual Exports on Every Component:** Every component created or updated in `src/components/` or `src/components/marketing/` MUST export BOTH a named export AND a default export:
  `export function ComponentName() { ... }` AND `export default ComponentName;`
  This prevents Webpack `Attempted import error` crashes in `src/app/page.tsx`.
- **Client Directives:** Every component using React hooks (`useState`, `useEffect`, `useRef`), GSAP, or Three.js MUST start with `'use client';` on line 1.
- **Mandatory Build & Browser Verification:** After every pass, run `npm run build` in the terminal to ensure 0 TypeScript/Webpack errors, and inspect `http://localhost:3000` via Chrome DevTools (`/browser`) to confirm the live page renders without errors.