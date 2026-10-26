# AegisDesk — Cookie & Third-Party Script Audit

**Audit Date:** 26 October 2026  
**Audited By:** SecOps & Compliance Engineering  
**Standard:** EU ePrivacy Directive (2002/58/EC Art. 5(3)), GDPR (Regulation (EU) 2016/679), and India DPDP Act 2023.

---

## 1. Complete Inventory of Loaded Third-Party Scripts

AegisDesk enforces a zero-tracker architecture. We do NOT load Google Analytics, Meta Pixel, Hotjar, TikTok Pixel, Segment, or third-party advertising scripts.

| Script URL | Vendor | Purpose | Classification | Consent Required? |
|---|---|---|---|---|
| `https://challenges.cloudflare.com/turnstile/v0/api.js` | Cloudflare | Bot mitigation, credential stuffing defense & rate-limit proof on public forms. | **Strictly Necessary** (Security) | **No** (Exempt under ePrivacy Art. 5(3)) |
| `https://checkout.razorpay.com/v1/checkout.js` | Razorpay | Hosted checkout modal for test/live setup fee and retainer processing. Loaded on-demand only when client clicks "Pay". | **Strictly Necessary** (Contract Performance) | **No** (Exempt — essential to fulfill user-requested purchase) |
| `https://app.cal.com/embed/embed.js` | Cal.com | Interactive 15-minute engineer scoping call calendar modal. Loaded on-demand only when client clicks "Book a 15-min scoping call". | **Strictly Necessary** (User-Initiated Booking) | **No** (Exempt — essential to render requested calendar) |

---

## 2. Complete Inventory of Cookies Set

| Cookie Name | Provider / Domain | Purpose & Function | Expiration | Classification | Consent Required? |
|---|---|---|---|---|---|
| `sb-*-auth-token` | Supabase / `.aegisdesk.ai` | Encrypted session token maintaining client portal login state. | Session / 14 days | **Strictly Necessary** | **No** |
| `__cf_bm` | Cloudflare | Cloudflare Bot Management token identifying legitimate human browsing patterns. | 30 minutes | **Strictly Necessary** | **No** |
| `cf_clearance` | Cloudflare Turnstile | Clearance token granted after successfully completing interactive Turnstile challenge. | 2 hours | **Strictly Necessary** | **No** |
| `aegis_terms_accepted` | First-Party | Timestamp token recording that the user has reviewed our Terms of Service & Privacy Policy. | 1 year | **Strictly Necessary** | **No** |

---

## 3. Regulatory Conclusion & Cookie Notice Policy

1. **Zero Non-Essential Cookies:** AegisDesk sets **0 tracking, advertising, marketing, or cross-site profiling cookies**.
2. **Statutory Exemption:** Under Article 5(3) of the ePrivacy Directive and guidance from the European Data Protection Board (EDPB Guidelines 02/2023):
   > *"Consent is not required if the cookie is strictly necessary in order for the provider of an information society service explicitly requested by the subscriber or user to provide the service."*
3. **User Experience Impact:** Because all cookies set by AegisDesk are strictly necessary for security, session persistence, or requested checkout/booking actions, **a disruptive cookie modal is not required**.
4. **Conditional Banner Scaffolding:** To guard against future regression, [`src/components/layout/cookie-notice.tsx`](file:///Users/aditgupta/Downloads/aegisdesk-round-3.1/src/components/layout/cookie-notice.tsx) is deployed in dormant mode. It inspects `document.cookie` at runtime: if any non-essential cookie (e.g. `_ga`, `_fbp`, `_hj`) is detected, it automatically renders a consent and opt-out dialog.
