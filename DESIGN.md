# AegisDesk - Design Brief (source of truth)
Read this file before every UI change. If a request conflicts with it, stop and ask.

## What the site does
AegisDesk sells Corrective-RAG customer support to B2B teams: $2,500 setup plus $1,000 per month, starting with a 14-day Shadow Mode where the AI drafts replies and a human approves them.
The site has one job: get a support or operations leader to book a 15-minute scoping call. Second job: let them test the live verification workbench.
Audience: Head of Support, COO, CTO at B2B companies. They distrust chatbots. They scan first, then verify. They reward calm, exact, evidence-led design.

## Brand
The logo is a five-petal mark plus a heavy rounded "AegisDesk" wordmark, in three colours: deep green #0A433A, cream #F4EFE9, near-black #111311.
Files are in public/brand: aegisdesk-lockup.svg, aegisdesk-mark.svg, aegisdesk-wordmark.svg, favicon.svg. They use currentColor, so set the colour with CSS.
Use the logo only in cream, near-black or deep green. Nav and footer use the lockup. Minimum mark height 24px, clear space equal to half the mark's height.

## Visual thesis
A quiet control room with one colour world. Near-black canvas, one living light-filled 3D scene, one warm paper surface, and the brand green as a full-bleed field used once or twice per page.
Paper means evidence: source PDFs, citations, the pricing quote. Dark means the system. Never use paper for decoration.
Material: a static film-grain overlay (SVG noise, 5% opacity, never animated) over the canvas and the brand-green fields, so it feels printed rather than flat.

## Colour (CSS variables only; never hard-code a hex outside the token file)
--canvas #0B0F0D   --surface #111713   --surface-2 #17201B
--line rgba(214,235,224,0.10)   --line-strong rgba(214,235,224,0.18)
--text #E8EDE8   --text-dim #9AA8A0   --text-faint #62706A
--brand #0A433A (full-bleed colour field only, never for small text)   --glow #2FA67F (light in the 3D scene only)
--paper #F4EFE9   --paper-ink #111311   --paper-line rgba(17,19,17,0.14)
--verified #6FD8A6 (only for verified or grounded status)   --warn #E3B341   --blocked #E5645C
Primary button: paper background, paper-ink text. On a --brand field the button is paper too. No bright green buttons. At most one soft glow per screen.

## Type
Geist for everything, Geist Mono for labels and numbers (load with next/font).
Display: weight 300, letter-spacing -0.03em, line-height 1.0, size clamp(44px, 6.5vw, 96px).
Body: 17px, line-height 1.6, colour --text-dim for secondary text. Text blocks never wider than 62ch.
Labels: Geist Mono 12px, uppercase, letter-spacing 0.08em. All numbers use tabular-nums.

## Shape
Panels 16px radius, buttons 10px, chips 6px. No pill buttons. 1px borders in --line. No drop shadows except on paper cards (soft, low).
No gradients except the hero glow. No emojis. No icons inside coloured circles. Never nest more than two bordered boxes.

## Layout
12-column grid, container max 1200px, side padding 24px mobile and 48px desktop.
Section padding 140px desktop, 88px mobile. One idea per section. Alternate dense instrument panels with open space.
Page order: Nav, Hero, Proof strip, Verification Workbench, Safeguards (3 gates), Shadow Mode (14 days), Pricing and ROI, FAQ, Final CTA, Footer. The Final CTA and footer sit on a full-bleed --brand field with cream text.
/dashboard, /security, /privacy and /terms use the same tokens.

## Hero rules
The first screen contains only: a small status label, the headline (max 3 lines), one sentence, one primary button plus one text link, the nav, the 3D scene, and ONE paper evidence card marked "Sample".
No stat cards, no second floating card, no orb, nothing overlapping the headline or the button.
Nav: one floating bar that never wraps, 5 links plus the Book call button. Under 900px it becomes a menu button.

## Motion (GSAP and ScrollTrigger, useGSAP hook with cleanup)
Hero intro, once, about 1.2s: headline lines rise out of a mask, the 3D scene fades in, the card slides up 24px.
Sections: content fades and rises 16px once when it enters (trigger at top 85%). Content must be visible if JS fails.
Safeguards is the only pinned scroll sequence on the page. The Shadow Mode timeline line draws as you scroll.
Hover: 150ms, border brightens. No bounce, no text parallax, no cursor effects. Animate only transform and opacity.
prefers-reduced-motion: no movement, everything visible.

## 3D scene (hero only)
Two variants, switched with ?hero=terrain or ?hero=ribbon in the address. Default is terrain. Both load client-side only through react-three-fiber and share these rules:
light and lines are --glow at 35% opacity or less, fading into the canvas at the edges; device pixel ratio capped at 1.5; paused when offscreen or the tab is hidden; very subtle pointer response.
Terrain: a wireframe landscape with slow drift from noise in the vertex shader. Clamp the displacement so there are no spikes and no solid white shapes.
Ribbon: one full-screen fragment shader drawing a slow, silky band of light (domain-warped noise) in --glow with a few cream highlights on --canvas, like smoke or silk. No geometry, no solid shapes.
Fallback for screens under 768px, reduced motion, or no WebGL: a static CSS gradient with a faint grid.

## Copy and data
Keep existing copy, pricing and logic unless a task says otherwise. Example numbers (grounded %, latency) are labelled "Sample". The footer year is computed, never typed.

## Quality bar
At 1440, 820 and 390px: no horizontal scroll, nav never wraps, nothing clipped or overlapping. Contrast AA. Visible keyboard focus. Mobile Lighthouse performance 85 or higher.

## Never
Add a colour, font, radius or library that is not in this file. Restyle outside the files named in the task. Remove working functionality.
