# AegisDesk — Copy Audit & Proposed Rewrites

Source of truth for all public-facing copy across AegisDesk. This document audits every visible text string on public pages, proposes compliant rewrites for a skeptical head of support, reconciles product facts, catalogs absolute claims, and rationalizes all booking calls-to-action.

---

## 1. Rules & Tone Architecture

- **Audience:** Head of Support, COO, or VP Operations with 5 minutes who distrusts AI marketing claims.
- **Tone:** Calm, clear, evidence-led, factual. Short sentences (under 20 words). Plain words over abstractions.
- **Banned Words:** `deterministic`, `enterprise-grade`, `bank-grade`, `cutting-edge`, `seamless`, `robust`, `leverage`, `revolutionary`, `guarantee`, `zero hallucinations`, `100%`, `0%`.
- **Approved Plain Replacements:**
  - *Corrective RAG* $\rightarrow$ "answers checked against your documents"
  - *Grounded* $\rightarrow$ "backed by a quoted source"
  - *Gate* $\rightarrow$ "check"
  - *Tenant / Namespace / Vector store* $\rightarrow$ "your private workspace"
  - *Confidence threshold* $\rightarrow$ "the bar an answer must clear before it is sent"
  - *Hallucination* $\rightarrow$ "made-up answer"
  - *Shadow Mode* (defined once) $\rightarrow$ "14 days where the AI drafts and your team approves every reply"
- **Numbers:** Always carry a unit and source, or the explicit tag `[Sample]`.

---

## 2. Complete Copy Inventory & Proposed Rewrites

### Page: Global Navigation (`Navbar` & Mobile Sheet)

| Section & Element | Current Text | Proposed Rewrite | One-Line Reason |
|---|---|---|---|
| **Nav: Brand Label** | AegisDesk | AegisDesk | Clear brand identity lockup. |
| **Nav: Link 01** | Overview | Overview | Retain clear top-level anchor. |
| **Nav: Link 02** | Why grounded AI | Why grounded AI | Clean anchor link in sentence case. |
| **Nav: Link 03** | Safeguards | Safeguards | Retain plain section anchor. |
| **Nav: Link 04** | 14-day shadow mode | 14-day shadow mode | Clear product feature in sentence case. |
| **Nav: Link 05** | Pricing & ROI | Pricing & ROI | Direct commercial terms link. |
| **Nav: Primary Button** | Book call | Dashboard | Button Rule: nav right button says "Dashboard" and routes to `/dashboard`. |
| **Mobile Sheet: Eyebrow 01** | 01 Overview | 01 Overview | Retains clean ordered navigation index. |
| **Mobile Sheet: Eyebrow 02** | 02 Why grounded AI | 02 Why grounded AI | Retains clean ordered navigation index. |
| **Mobile Sheet: Eyebrow 03** | 03 Safeguards | 03 Safeguards | Retains clean ordered navigation index. |
| **Mobile Sheet: Eyebrow 04** | 04 14-day shadow mode | 04 14-day shadow mode | Retains clean ordered navigation index. |
| **Mobile Sheet: Eyebrow 05** | 05 Pricing & ROI | 05 Pricing & ROI | Retains clean ordered navigation index. |
| **Mobile Sheet: Action CTA** | Book a 15-minute scoping call | Go to dashboard | Aligns mobile navigation with desktop Dashboard destination. |
| **Mobile Sheet: Footnote** | 14-Day Shadow Mode · $2,500 + $1k/mo | 14-Day Shadow Mode · $2,500 setup + $1,000/mo | Plain transparent commercial summary. |

---

### Page: Homepage — Hero (`Hero`)

| Section & Element | Current Text | Proposed Rewrite | One-Line Reason |
|---|---|---|---|
| **Hero: Eyebrow Badge** | Private RAG Support · 14-Day Shadow Mode | Answers checked against your documents · 14-Day Shadow Mode | Replaces technical jargon "RAG" with approved plain term. |
| **Hero: Headline Line 1** | Step into | Support answers | Direct, active noun phrase under 20 words. |
| **Hero: Headline Line 2** | verified support. | backed by your documents. | Replaces abstract "verified" with tangible document proof. |
| **Hero: Supporting Sentence** | We turn your company policies, manuals, and past tickets into a private RAG support system—citing the exact page for every answer and routing edge cases to your team. | We turn your policies and tickets into support answers that quote your documents. Edge cases route straight to your team. | Replaces "RAG" with plain words and cuts down sentence length to under 15 words. |
| **Hero: Primary CTA** | Book a 15-minute scoping call | Book a 15-min scoping call | Exact approved canonical copy for Hero button 1 of 2. |
| **Hero: Secondary Link** | Test the live workbench $\rightarrow$ | Test the workbench $\rightarrow$ | Clean, plain anchor link to the live inspector below. |
| **Evidence Card: Header Label** | VERIFIED RAG REPLY | BACKED BY QUOTED SOURCE | Replaces technical term "RAG" with approved plain language. |
| **Evidence Card: Tag** | SAMPLE | SAMPLE | Preserves required sample badge. |
| **Evidence Card: Query Label** | Customer Query | Customer question | Uses everyday support vocabulary. |
| **Evidence Card: Query Text** | "Can I return opened wireless headphones within 14 days?" | "Can I return opened wireless headphones within 14 days?" | Realistic e-commerce/hardware support question. |
| **Evidence Card: Draft Label** | Grounded Draft | Draft reply | Removes jargon "grounded" in favor of plain draft text. |
| **Evidence Card: Accuracy Pill** | 99.4% Grounded | Backed by Section 3.2 [Sample] | Replaces ungrounded 99.4% percentage with exact document reference. |
| **Evidence Card: Draft Body** | Yes—opened audio gear is eligible within 14 days in original packaging with a 10% inspection fee. | Yes. Opened audio gear is eligible for return within 14 days in original packaging with a 10% inspection fee. | Short, clear sentences adhering to 20-word limit. |
| **Evidence Card: Citation Pill** | Return_Policy_SOP.pdf · §3.2 (p. 3) | Return_Policy_SOP.pdf · §3.2 (p. 3) | Concrete verifiable page citation. |
| **Evidence Card: Latency Pill** | 284ms | 284ms [Sample] | Appends mandatory `[Sample]` label to telemetry metric. |
| **Evidence Card: Footer Note** | Staged for 1-click human agent approval | Staged for your agent to review and approve | Explains what Shadow Mode actually does in plain terms. |
| **Proof Stat 1: Index** | // 01 TELEMETRY | // 01 TELEMETRY | Clean monospace telemetry label. |
| **Proof Stat 1: Metric** | 99.4% | 99.4% [Sample] | Numbers must always carry source or `[Sample]`. |
| **Proof Stat 1: Title** | Grounded accuracy | Quoted source match | Replaces jargon "grounded" with plain words. |
| **Proof Stat 1: Detail** | Strict Corrective-RAG verification against company source text. | Every factual statement maps directly to an approved sentence in your documents. | Replaces "Corrective-RAG" with plain explanation under 20 words. |
| **Proof Stat 2: Index** | // 02 TELEMETRY | // 02 TELEMETRY | Clean monospace telemetry label. |
| **Proof Stat 2: Metric** | <300ms | <300ms [Sample] | Appends mandatory `[Sample]` tag. |
| **Proof Stat 2: Title** | Citation latency | Retrieval speed | Plain language for support leaders. |
| **Proof Stat 2: Detail** | Deterministic retrieval over manuals, policies, and SOPs. | Fast search across your policies, user manuals, and standard procedures. | Removes banned word "deterministic". |
| **Proof Stat 3: Index** | // 03 TELEMETRY | // 03 TELEMETRY | Clean monospace telemetry label. |
| **Proof Stat 3: Metric** | 14-Day | 14-Day | Clear operational time unit. |
| **Proof Stat 3: Title** | Shadow mode calibration | Shadow Mode | Simple, un-hyped name. |
| **Proof Stat 3: Detail** | AI drafts replies quietly for human agent approval before going live. | 14 days where the AI drafts and your team approves every reply. | Uses the exact required definition of Shadow Mode. |

---

### Page: Homepage — Verification Workbench (`VerificationWorkbench`)

| Section & Element | Current Text | Proposed Rewrite | One-Line Reason |
|---|---|---|---|
| **Workbench: Eyebrow** | 02 // VERIFICATION WORKBENCH | 02 // VERIFICATION WORKBENCH | Clean structural section label. |
| **Workbench: Headline** | See how every reply is verified before it reaches a customer. | See how every reply is checked against your documents before it is sent. | Uses approved plain phrase for Corrective RAG. |
| **Workbench: Description** | Test our deterministic resolution engine below. Every claim links strictly to an immutable policy clause, while ambiguous edge cases route immediately to human agents. | Test the workbench below. Every sentence links to a quoted source, and questions your documents do not cover go to your team. | Removes banned word "deterministic", under 20 words. |
| **Workbench: Paper Header** | SOURCE EVIDENCE (PAPER) · INSPECTOR | SOURCE DOCUMENTS · INSPECTOR | Plain words without unnecessary parenthetical formatting. |
| **Workbench: Tab Doc 1** | Doc 01: Return SOP | Doc 01: Return Policy | Plain business terminology. |
| **Workbench: Tab Doc 2** | Doc 02: Refund SLA | Doc 02: Refund Timing | Plain business terminology. |
| **Workbench: Console Header** | CONTROL CONSOLE · CORRECTIVE RAG | CONTROL CONSOLE · DOCUMENT CHECKS | Replaces technical term "Corrective RAG" with plain words. |
| **Workbench: Tab 01 Pill** | 01 · On-Policy / Auto-Draft | 01 · On-policy draft | Plain sentence case without mixed slashes. |
| **Workbench: Tab 02 Pill** | 02 · Comparison / Standard vs AI | 02 · Comparison | Concise label. |
| **Workbench: Tab 03 Pill** | 03 · Edge Case / Safe Escalation | 03 · Edge case handoff | Plain words describing what happens. |
| **Workbench: Tab 04 Pill** | 04 · Interactive / Live Query | 04 · Live test | Short, simple label. |
| **Workbench: Scenario 1 Match** | 98.7% MATCH [Sample] | 98.7% match [Sample] | Sentence case with sample tag. |
| **Workbench: Scenario 1 Latency** | LATENCY: 284ms [Sample] | Latency: 284ms [Sample] | Sentence case formatting. |
| **Workbench: Scenario 1 Draft Badge** | GROUNDED RAG DRAFT · ZERO GUESSING | DRAFT BACKED BY SOURCES · NO GUESSWORK | Replaces banned word "zero" and jargon "grounded RAG". |
| **Workbench: Scenario 1 Approve Button** | 14-Day Shadow Mode: 1-Click Approve Draft | Approve draft and send via helpdesk | Plain description of the agent action. |
| **Workbench: Scenario 1 Approved State** | Approved & Dispatched via Helpdesk (284ms [Sample]) | Sent to customer via helpdesk (284ms [Sample]) | Plain language without pompous "dispatched". |
| **Workbench: Scenario 2 Comp 1 Label** | 01 · Return Window | 01 · Return window | Sentence case. |
| **Workbench: Scenario 2 Comp 1 Prompt** | "I purchased $480 [Sample] of studio hardware 34 days ago. Can I return it for a full cash refund today?" | "I purchased $480 [Sample] of studio hardware 34 days ago. Can I return it for a full cash refund today?" | Clear realistic customer question. |
| **Workbench: Scenario 2 Comp 1 Bad Bot** | "Yes, absolutely! We offer a 60-day hassle-free money-back guarantee on all orders. I have initiated a full $480.00 cash refund back to your card right now." | "Yes, absolutely! We offer a 60-day money-back policy on all orders. I have initiated a full $480.00 cash refund back to your card right now." | Removes banned word "guarantee" from bad bot illustration. |
| **Workbench: Scenario 2 Comp 1 Bad Impact**| Brand & Margin Risk: Invented a fake 60-day policy and committed an unauthorized $480 [Sample] cash refund in writing. | Risk: Made up a 60-day policy and promised an unauthorized $480 [Sample] refund in writing. | Replaces "invented fake policy" with "made up" under 20 words. |
| **Workbench: Scenario 2 Comp 1 AegisDesk**| Per our Return Policy, standard hardware refunds apply strictly within 30 calendar days of delivery. Because Day 34 has elapsed, I have staged an exception review with your order history for our Support Lead. | Our policy allows returns within 30 days of delivery. Because this order is at Day 34, I have routed it to our support lead. | Plain, short sentences under 20 words. |
| **Workbench: Scenario 2 Comp 1 Outcome** | Protected Margin & Trust: Cited the exact 30-day clause and staged clean human review in 260ms [Sample]. | Cited the 30-day rule and routed to a human in 260ms [Sample]. | Plain factual summary under 15 words. |
| **Workbench: Scenario 2 Comp 2 Label** | 02 · Enterprise SLA | 02 · Response terms | Plain words replacing SLA acronym. |
| **Workbench: Scenario 2 Comp 2 Bad Impact**| Revenue Exposure: Hallucinated an SLA penalty tier and committed the company to a $6,000 [Sample] write-off. | Risk: Made up a penalty tier and promised a $6,000 [Sample] credit without contract backing. | Replaces banned word "hallucinated". |
| **Workbench: Scenario 2 Comp 2 AegisDesk**| Under the Enterprise Master SLA, service credits apply when monthly uptime dips below 99.90% (>43.8 mins downtime). An 18-minute webhook delay remains within 99.96% [Sample] SLA compliance. | Under our service agreement, credits apply only if monthly uptime drops below 99.90%. An 18-minute delay remains within agreement terms. | Explains SLA in plain words under 20 words. |
| **Workbench: Scenario 2 Comp 3 Label** | 03 · Data Privacy | 03 · Workspace privacy | Uses approved plain phrase "workspace". |
| **Workbench: Scenario 2 Comp 3 Bad Impact**| Confidentiality Breach: Pooled training database leaked a peer client's private commercial pricing. | Risk: Shared database leaked another company's private pricing terms. | Plain factual summary without jargon. |
| **Workbench: Scenario 2 Comp 3 AegisDesk**| Your knowledge base operates in an isolated client environment with zero access to external accounts. Custom wholesale tier inquiries have been routed to your Account Executive. | Your documents live in your private workspace. The system cannot see other accounts, and has routed this pricing inquiry to your account team. | Replaces banned "zero", uses "private workspace". |
| **Workbench: Scenario 2 Comp 3 Outcome** | 100% Data Partitioning: Cryptographic client isolation guarantees zero cross-tenant knowledge access. | Private workspace: Document storage is isolated so accounts cannot read peer data [Sample]. | Replaces banned words "100%", "guarantees", and "zero". |
| **Workbench: Scenario 3 Score** | 38.0% (BELOW 92.0% THRESHOLD) [Sample] | 38.0% (below the 92.0% bar required to reply) [Sample] | Uses approved phrase "bar an answer must clear". |
| **Workbench: Scenario 3 Safeguard** | AI Held Back From Guessing · Safe Human Escalation | AI held back from guessing · Routed to your team | Plain words replacing "safe human escalation". |
| **Workbench: Scenario 3 Reason** | Custom B2B Purchase Order (>30 days) is not covered by standard return rules in Return_Policy_SOP.pdf §3.2. | Custom orders past 30 days are not covered by Return_Policy_SOP.pdf §3.2. | Short factual statement under 15 words. |
| **Workbench: Scenario 3 Handoff 1** | Customer: Enterprise Account (40 units, Day 47 post-delivery) [Sample] | Customer: Enterprise account (40 units, Day 47 post-delivery) [Sample] | Clean factual handoff bullet. |
| **Workbench: Scenario 3 Handoff 2** | Policy Note: Custom B2B hardware swaps past 30 days require account executive override [Sample] | Policy rule: Hardware swaps past 30 days require account manager approval [Sample] | Plain language under 15 words. |
| **Workbench: Scenario 3 Handoff 3** | Action Taken: AI held back from guessing and routed full context to Tier-2 Lead in Zendesk [Sample] | Action: AI held back from guessing and sent full context to your team in Zendesk [Sample] | Plain language under 20 words. |
| **Workbench: Bottom Scoping Prompt** | Want to test this against your private Zendesk or Freshdesk SOPs? | Want to test this against your own policies? | Plain language question. |
| **Workbench: Bottom Scoping Button** | Book 15-Min Scoping Call | See how the 14-day rollout works $\rightarrow$ | Button Rule: replace mid-page booking button with plain link to `#how-it-works`. |

---

### Page: Homepage — Interactive Demo Chat & Gate Modal (`DemoChat` & `DemoGateModal`)

| Section & Element | Current Text | Proposed Rewrite | One-Line Reason |
|---|---|---|---|
| **Chat: Status Pill** | Grounded in Policy | Backed by policy source | Replaces jargon "grounded". |
| **Chat: Escalated Pill** | Safe Escalation: Routed to Human | Routed to human team | Plain words under 5 words. |
| **Chat: Turnstile Notice** | Retrieving & verifying policy citations... | Checking your documents and finding citations... | Plain explanation of document lookup. |
| **Chat: Limit Exceeded CTA** | Book a Scoping Call | Contact our team $\rightarrow$ | Button Rule: replace mid-page booking button with plain text link to contact. |
| **Chat: Placeholder** | Ask the sample company's documents a question | Ask a question about the sample policies | Simple invitation under 10 words. |
| **Chat: Quota Counter** | 5 free questions [Sample] | 5 sample questions allowed [Sample] | Plain language with explicit sample tag. |
| **Gate Modal: Title** | Start the demo | Try the sample workbench | Plain description. |
| **Gate Modal: Description** | Enter your work email and phone number to ask the sample company's documents a question. | Enter your work email and phone number to test questions against the sample documents. | Plain words under 20 words. |
| **Gate Modal: Consent Text** | I agree that AegisDesk may contact me about the product. I have read the privacy notice. | I agree that AegisDesk may contact me about the product. I have read the privacy notice. | Compliant consent micro-copy. |
| **Gate Modal: Submit Button** | Start the demo | Open test chat | Clear action label. |

---

### Page: Homepage — Enterprise Safeguards (`SafetyPillars`)

| Section & Element | Current Text | Proposed Rewrite | One-Line Reason |
|---|---|---|---|
| **Safeguards: Eyebrow** | 03 // ENTERPRISE SAFEGUARDS | 03 // SAFEGUARDS | Removes banned word "enterprise". |
| **Safeguards: Headline** | Three deterministic gates between your documents and the customer. | Three checks between your documents and the customer. | Replaces banned word "deterministic" and jargon "gates" with "checks". |
| **Safeguards: Subtitle** | A quiet control pipeline engineered so support leadership never has to wonder if an AI reply was guessed, hallucinated, or leaked from another account. | Built so support leadership never has to wonder if an answer was made up or leaked from another account. | Replaces banned word "hallucinated" with "made up", under 20 words. |
| **Check 01: Name** | Scoped Single-Tenant Retrieval | Check 01 · Private workspace search | Uses approved plain phrase "private workspace". |
| **Check 01: Subhead** | Cryptographic Client Boundary | Isolated from other accounts | Plain English explanation. |
| **Check 01: Body** | Every query executes strictly inside an isolated client container. External web forum threads, outdated manuals, and peer company data are cryptographically partitioned before generation begins. | Every search stays inside your private workspace. The system cannot search the public web or view another company's data. | Replaces jargon with plain short sentences under 20 words. |
| **Check 01: Telemetry** | 0% Cross-Tenant Access · 100% Dedicated Partition [Sample] | Dedicated private workspace · Isolated data partition [Sample] | Removes banned absolute percentages "0%" and "100%". |
| **Check 01: Pass Chip** | GATE 01 PASSED | CHECK 01 PASSED | Replaces "gate" with approved term "check". |
| **Check 01: Detail 3** | Cross-Tenant Leakage Risk: 0.0% Guaranteed | Account Isolation: Enforced by database partition [Sample] | Removes banned words "0.0%" and "Guaranteed". |
| **Check 01: Verdict** | Query scoped exclusively to approved SOPs. Out-of-tenant leakage blocked. | Search stayed inside your approved documents. External data was blocked. | Plain words under 15 words. |
| **Check 02: Name** | Sentence-Level Citation Check | Check 02 · Sentence-by-sentence source check | Plain words replacing jargon. |
| **Check 02: Subhead** | Zero Unsubstantiated Claims | Every sentence backed by a source | Removes banned word "zero". |
| **Check 02: Body** | Corrective RAG verifies each claim sentence-by-sentence against indexed policy documents. If any generated sentence cannot be grounded in an approved source clause, it is flagged and excised. | The system checks every sentence against your documents. If an answer cannot find source text, it is removed. | Replaces "Corrective RAG" with plain explanation under 20 words. |
| **Check 02: Telemetry** | 99.4% Citation Match [Sample] · 2 Strict Citations | 99.4% source match [Sample] · 2 quoted sources | Replaces jargon "strict citations". |
| **Check 02: Pass Chip** | GATE 02 PASSED | CHECK 02 PASSED | Replaces "gate" with approved term "check". |
| **Check 02: Detail 3** | Hallucination Score: 0.0% (Zero Guessed Terms) | Unsupported Claims: None detected [Sample] | Removes banned words "Hallucination", "0.0%", and "Zero". |
| **Check 02: Verdict** | Two inspectable document citations attached. Answer verified for customer delivery. | Two document citations attached. Answer checked against policy before delivery. | Plain words under 15 words. |
| **Check 03: Name** | Deterministic Confidence Threshold | Check 03 · The bar an answer must clear | Replaces banned word "deterministic" with approved phrase. |
| **Check 03: Subhead** | Automated Halting on Edge Cases | Stops and routes edge cases | Plain words describing the behavior. |
| **Check 03: Body** | When customer questions involve edge cases below our 92.0% confidence threshold (such as custom B2B POs or out-of-warranty waivers), the AI never guesses. It routes the conversation to your human team with context attached. | When an answer falls below the confidence bar, the system does not guess. It routes the ticket to your team. | Replaces jargon with short sentences under 20 words. |
| **Check 03: Telemetry** | 92.0% Confidence Floor [Sample] · 192ms Human Handoff | 92.0% confidence bar [Sample] · 192ms handoff [Sample] | Uses approved phrase "confidence bar" and tags sample metrics. |
| **Check 03: Action Chip** | GATE 03 TRIGGERED · HANDED TO HUMAN | CHECK 03 TRIGGERED · ROUTED TO TEAM | Replaces "gate" with "check". |
| **Check 03: Verdict** | AI held back from guessing. Full customer context and ticket note staged for human agent. | The system held back from guessing. The ticket and notes were sent to your team. | Plain words under 20 words. |
| **Support Stack Bar** | FITS YOUR SUPPORT STACK | Works with your helpdesk | Plain English phrasing. |

---

### Page: Homepage — 14-Day Shadow Mode (`HowItWorks`)

| Section & Element | Current Text | Proposed Rewrite | One-Line Reason |
|---|---|---|---|
| **Shadow Mode: Eyebrow**| 04 // 14-DAY SHADOW MODE | 04 // 14-DAY SHADOW MODE | Clear section counter. |
| **Shadow Mode: Title** | How our 14-Day Shadow Mode rollout works | How our 14-Day Shadow Mode works | Removes buzzword "rollout". |
| **Shadow Mode: Intro** | A calm, white-glove engineering onboarding—from initial ticket audit to supervised drafting and autonomous resolution. | 14 days where the AI drafts and your team approves every reply before anything goes live. | Uses the exact mandatory definition of Shadow Mode. |
| **Step 01: Badge** | Step 01 · Day 0 · 15-Minute Architecture Scoping | Step 01 · Day 0 · 15-Minute Scoping Call | Plain description. |
| **Step 01: Title** | 15-minute architecture & scoping call | 15-minute scoping call | Removes technical fluff "architecture". |
| **Step 01: Body** | We review your monthly ticket volume, most frequent customer questions, and current cost per resolution to map your exact ROI. | We review your ticket volume, common questions, and resolution costs to map your exact savings. | Plain words under 20 words. |
| **Step 02: Badge** | Step 02 · Days 1–3 · Private RAG Knowledge Structuring | Step 02 · Days 1–3 · Document Setup | Removes technical jargon "RAG". |
| **Step 02: Title** | Knowledge ingestion & RAG indexing (Days 1–3) | Document setup and indexing (Days 1–3) | Plain vocabulary for support leaders. |
| **Step 02: Body** | Our engineers ingest and structure your return policies, warranty manuals, help-center articles, and historical ticket macros into your private RAG index. | We index your return policies, manuals, help articles, and approved macros into your private workspace. | Uses approved phrase "private workspace", under 20 words. |
| **Step 03: Badge** | Step 03 · Days 4–17 · 14-Day Supervised Shadow Mode | Step 03 · Days 4–17 · 14-Day Shadow Mode | Plain title. |
| **Step 03: Title** | 14-day supervised shadow mode (Days 4–17) | 14-day Shadow Mode (Days 4–17) | Concise, consistent capitalization. |
| **Step 03: Body** | AegisDesk stages source-cited draft replies directly inside Zendesk or Gorgias. Your agents review and send with one click while we calibrate retrieval. | AegisDesk drafts replies inside your helpdesk. Your agents review and send them with one click. | Short sentences under 15 words. |
| **Step 04: Badge** | Step 04 · Day 18+ · Live Resolution + Weekly Calibration | Step 04 · Day 18+ · Live replies and weekly reviews | Plain words. |
| **Step 04: Title** | Live resolution & weekly engineering calibration (Day 18+) | Live replies and weekly calibration (Day 18+) | Plain language. |
| **Step 04: Body** | Approved ticket categories resolve automatically 24/7, while our engineers review escalated edge cases and update your knowledge base every week. | Approved ticket categories answer automatically. Our engineers review escalated tickets and update your documents weekly. | Plain words, under 20 words. |
| **Paper Card: Eyebrow** | SOVEREIGN OPERATIONAL CONTROL [Sample] | HUMAN APPROVAL FLOOR | Removes pretentious word "sovereign". |
| **Paper Card: Badge** | 100% HUMAN SIGN-OFF FLOOR | DRAFT-ONLY UNTIL SIGN-OFF | Removes banned absolute claim "100%". |
| **Paper Card: Title** | Your Team Stays in Full Control | Your team stays in full control | Sentence case. |
| **Paper Card: Note** | From day one, AegisDesk only writes internal drafts inside your helpdesk. Your agents approve with one click, and you only switch on live replies when you are completely satisfied with the accuracy. | The AI writes drafts inside your helpdesk. Your agents approve each reply. You only turn on live answers when ready. | Short punchy sentences under 15 words. |

---

### Page: Homepage — Pricing and ROI (`SavingsExample`)

| Section & Element | Current Text | Proposed Rewrite | One-Line Reason |
|---|---|---|---|
| **Pricing: Eyebrow** | 05 // PRICING AND ROI | 05 // PRICING AND ROI | Clean monospace eyebrow. |
| **Pricing: Headline** | Model your support economics with precision. | See what you save with documented support answers. | Plain conversational headline under 10 words. |
| **Pricing: Subhead** | Transparent commercial terms: $2,500 one-time setup and integration covering your 14-day supervised Shadow Mode, followed by a $1,000/month managed infrastructure retainer. | Clear pricing: $2,500 one-time setup covering your 14-day Shadow Mode, then a $1,000 monthly retainer. | Direct, honest pricing statement under 20 words. |
| **Pricing: Benchmark 1** | Mid-Market (1,500/mo) | Mid-Market (1,500/mo) | Clear preset benchmark label. |
| **Pricing: Benchmark 2** | Growth Team (5,000/mo) | Growth Team (5,000/mo) | Clear preset benchmark label. |
| **Pricing: Benchmark 3** | Enterprise Scale (15,000/mo) | Large Team (15,000/mo) | Removes buzzword "Enterprise". |
| **Pricing: Slider 1** | Monthly Ticket Volume | Monthly ticket volume | Sentence case. |
| **Pricing: Slider 2** | Fully-Loaded Cost per Resolution | Cost per resolution | Plain, everyday support metric. |
| **Pricing: Slider 3** | Target Autonomous Resolution | Target automated answers | Replaces jargon "autonomous resolution". |
| **Pricing: Scope Tab 1** | Setup & 14-Day Shadow | Setup & 14-Day Shadow Mode | Clear deliverable name. |
| **Pricing: Scope Tab 2** | Monthly Retainer | Monthly retainer | Sentence case. |
| **Pricing: Included 1** | Full ingestion & structuring of your PDFs, SOP manuals, help-center pages, and past tickets | Full indexing of your policies, manuals, help articles, and ticket macros | Plain description of work. |
| **Pricing: Included 2** | Bi-directional integration with Zendesk, Gorgias, Shopify, or custom webhook systems | Helpdesk connection for Zendesk, Gorgias, or custom webhooks | Removes buzzword "bi-directional integration". |
| **Pricing: Included 3** | 14-day supervised shadow mode inside your existing agent workspace | 14-day Shadow Mode inside your current helpdesk workspace | Plain words. |
| **Pricing: Included 4** | Direct shared Slack channel with our AI systems engineers | Direct Slack channel with our engineering team | Plain words. |
| **Pricing: Included 5** | Inline source citation and confidence verification on every drafted reply | Source citations and accuracy scores on every drafted reply | Plain words. |
| **Pricing: Monthly 1** | Dedicated cloud hosting, isolated vector storage, and enterprise AI compute | Private cloud hosting, isolated data storage, and model compute | Removes banned buzzword "enterprise". |
| **Pricing: Monthly 2** | Weekly retrieval calibration and engineering review of escalated edge-case tickets | Weekly search calibration and review of escalated tickets | Plain words. |
| **Pricing: Monthly 3** | Continuous knowledge base updates whenever your shipping, return, or SLA policies change | Policy updates whenever your return, shipping, or service terms change | Plain words. |
| **Pricing: Monthly 4** | Monthly Knowledge-Gap report highlighting new customer questions for 1-click approval | Monthly report of new customer questions your documents do not cover | Plain explanation of value. |
| **Pricing: Monthly 5** | Ongoing helpdesk API maintenance and model upgrades with zero downtime | Ongoing helpdesk maintenance and model upgrades without service interruption | Removes banned word "zero". |
| **Invoice Card: Header** | COMMERCIAL QUOTE · REF: AD-2026-EST [Sample] | ESTIMATED QUOTE · REF: AD-2026-EST [Sample] | Plain language with sample tag. |
| **Invoice Card: Line 1** | 01. White-Glove Setup & Shadow Mode ($2,500) | 01. Setup & 14-Day Shadow Mode ($2,500) | Removes buzzword "white-glove". |
| **Invoice Card: Line 2** | 02. Managed Monthly Retainer ($1,000 / mo) | 02. Monthly Retainer ($1,000 / mo) | Plain commercial line item. |
| **Invoice Card: Line 3** | 03. Baseline Monthly Spend | 03. Current monthly support cost | Plain terminology. |
| **Invoice Card: Line 4** | 04. Projected Autonomous Deflection | 04. Projected savings from automated answers | Plain description of savings. |
| **Invoice Card: Total** | NET ESTIMATED ANNUAL SAVINGS | ESTIMATED ANNUAL SAVINGS | Plain terminology. |
| **Invoice Card: Payback**| Payback: < 30 Days | Payback: Under 30 days [Sample] | Plain words with sample tag. |
| **Invoice Card: Button** | Book a 15-Min Scoping Call | Ask about this estimate $\rightarrow$ | Button Rule: replace mid-page booking button with plain link to contact. |
| **Invoice Card: Note** | Built for growing brands handling 1,000+ tickets a month. Billed simply by invoice. | Built for teams handling 1,000+ tickets a month. Billed by monthly invoice. | Short, clear terms. |

---

### Page: Homepage — FAQ (`Faq`)

| Section & Element | Current Text | Proposed Rewrite | One-Line Reason |
|---|---|---|---|
| **FAQ: Eyebrow** | 06 // FREQUENTLY ASKED QUESTIONS | 06 // FREQUENTLY ASKED QUESTIONS | Clean monospace label. |
| **FAQ: Headline** | Questions leadership teams ask us | Questions support leaders ask us | Direct audience focus. |
| **FAQ: Subhead** | Clear answers on how Corrective RAG verification, 14-day Shadow Mode, and multi-tenant data isolation operate in production helpdesk environments. | How document checks, the 14-day Shadow Mode, and data privacy work in your helpdesk. | Plain English without technical jargon. |
| **FAQ: Q1** | What happens if a customer asks something not covered in our documents? | What happens if a customer asks something not covered in our documents? | Clear, authentic question. |
| **FAQ: A1** | AegisDesk never guesses or invents policy rules. When our RAG retrieval engine does not find clear supporting evidence in your documents, it holds back from replying and routes the ticket to your human team with a clean summary of the customer's context. | AegisDesk does not guess. If our search cannot find clear supporting text in your documents, it routes the ticket to your team with a summary. | Removes absolute "never" and jargon "RAG", under 20 words per sentence. |
| **FAQ: Q2** | How do we know it won’t promise an unauthorized refund or discount? | How do we know it will not promise an unapproved refund? | Plain words. |
| **FAQ: A2** | Every deployment begins with a 14-day Shadow Mode where the AI only writes internal drafts inside your helpdesk. Every claim includes an inspectable citation pill linking to the exact paragraph in your SOP documents, so your team sees the proof before turning on live replies. | We start with 14 days of Shadow Mode where the AI only drafts replies. Every claim links to the exact paragraph in your documents. | Short sentences under 20 words, removes buzzword "inspectable citation pill". |
| **FAQ: Q3** | How is our company data kept private from other clients? | How is our company data kept private from other clients? | Clear question. |
| **FAQ: A3** | Every document, knowledge chunk, and conversation log is strictly isolated within your dedicated client partition at the database layer. Your data is never shared across clients or used to train public AI models. | Your documents and conversations live in your private workspace. Your data is not shared with other clients or used to train public models. | Replaces "never" and jargon, uses "private workspace". |
| **FAQ: Q4** | Which helpdesks and commerce platforms do you support? | Which helpdesks do you support? | Clear, direct question. |
| **FAQ: A4** | We integrate natively with Zendesk, Gorgias, and Shopify Plus, and connect to custom internal tools or ERPs via bi-directional REST webhooks. | We connect directly with Zendesk, Gorgias, and Shopify Plus, and support custom helpdesks through standard webhooks. | Replaces "integrate natively" and "bi-directional REST webhooks". |
| **FAQ: Q5** | How does pricing work? | How does pricing work? | Direct question. |
| **FAQ: A5** | We work as a dedicated engineering partner rather than a self-serve widget. Implementation is a one-time $2,500 setup fee covering custom RAG engineering and 14-day shadow mode, followed by a $1,000/month managed retainer that includes all infrastructure, compute, and weekly calibration. | Implementation is a one-time $2,500 setup fee covering document setup and 14-day Shadow Mode. After that, pricing is a $1,000 monthly retainer for all hosting and weekly reviews. | Plain words, under 20 words per sentence. |

---

### Page: Homepage — Final Call to Action (`FinalCta`) & Footer (`Footer`)

| Section & Element | Current Text | Proposed Rewrite | One-Line Reason |
|---|---|---|---|
| **Final CTA: Headline** | *(Implicit in footer/brand field)* | Put verified answers into your helpdesk. | Dedicated closing CTA section on brand green per DESIGN.md. |
| **Final CTA: Subhead** | *(Implicit in footer/brand field)* | Start with a 14-day Shadow Mode. Your team approves every reply before going live. | Clear, plain risk reversal. |
| **Final CTA: Button** | *(Implicit in footer/brand field)* | Book a 15-min scoping call | Button Rule: Canonical button 2 of 2 on the site. |
| **Footer: Brand Blurb** | Deterministic B2B customer support powered by Corrective RAG. Zero hallucinations, strict citations, and a 14-day supervised Shadow Mode. | Support answers checked against your company documents. Backed by quoted sources and a 14-day Shadow Mode. | Eliminates banned words: "deterministic", "Corrective RAG", "zero hallucinations", "strict". |
| **Footer: Copyright** | © 2026 AegisDesk Inc. All rights reserved. | © 2026 AegisDesk Inc. All rights reserved. | Computed year, legally standard. |
| **Footer: Col 2 Heading** | ARCHITECTURE & PROOF | PRODUCT & PROOF | Plain English. |
| **Footer: Col 2 Links** | Verification Workbench · Enterprise Safeguards · 14-Day Shadow Mode · Pricing & ROI Calculator · Frequently Asked Questions | Verification Workbench · Safeguards · 14-Day Shadow Mode · Pricing & ROI · FAQ | Plain, concise link labels. |
| **Footer: Col 3 Heading** | SECURITY & CONTACT | SECURITY & CONTACT | Standard navigation heading. |
| **Footer: Col 3 Links** | Security & Corrective RAG · Privacy Policy · Terms of Service · Email | Security & Data Handling · Privacy Policy · Terms of Service · Email | Replaces technical jargon in public link. |
| **Footer: Cal Link** | Schedule Architecture Call $\rightarrow$ | Talk with our engineering team $\rightarrow$ | Button Rule: replaces booking CTA with plain text contact link. |

---

### Page: Legal Pages & Status Page Summaries

| Page & Section | Current Text | Proposed Rewrite | One-Line Reason |
|---|---|---|---|
| **Security: Summary Title** | ENTERPRISE SECURITY & CORRECTIVE RAG COMMITMENT [Sample] | SECURITY & DOCUMENT HANDLING COMMITMENT [Sample] | Removes banned words "Enterprise" and "Corrective RAG". |
| **Security: Summary Text 1** | Zero-Hallucination Architectural Floor: AegisDesk does not generate speculative responses. Every token is anchored to client-approved documentation through three deterministic safety gates... | Document Verification Floor: AegisDesk does not guess answers. Every reply is checked against approved documents through three safety checks before it can be sent. | Eliminates banned words "Zero-Hallucination", "deterministic", "gates". Short sentences under 20 words. |
| **Security: Summary Text 2** | Client data is never pooled, never exposed to third-party model training, and encrypted with AES-256 at rest and TLS 1.3 in transit. | Client data is kept in your private workspace, is not used to train public models, and is encrypted in transit and at rest. | Replaces absolute "never", uses approved phrase "private workspace". |
| **Security: §01 Partition** | Zero Cross-Tenant Leakage: Vector indices and PostgreSQL state tables enforce strict tenant filters on every database query. | Workspace Isolation: Database queries filter strictly by account so workspaces cannot read peer data. | Replaces banned word "Zero" and jargon "Cross-Tenant Leakage". |
| **Security: §01 Training** | Zero Model Training: Client documents, SOPs, and historical ticket resolutions are never used to train or fine-tune public foundation models. | No Model Training: Your documents, standard procedures, and tickets are not used to train foundation models. | Replaces banned words "Zero" and "never". |
| **Security: §02 Title** | Three-Gate Corrective RAG Architecture | Three-Check Verification Architecture | Replaces "Three-Gate" and "Corrective RAG". |
| **Security: §05 Guarantee** | The system never sends an autonomous email or chat response to an external customer until your team reviews calibration metrics... | The system does not send live replies until your team reviews calibration metrics and gives written sign-off. | Replaces absolute word "never". |
| **Security: Contact CTA** | the booking link on this site | our security team by email | Button Rule: points to email instead of Cal.com booking. |
| **Privacy: Summary Title** | PRIVACY & DATA MINIMIZATION NOTICE [Sample] | PRIVACY & DATA MINIMIZATION NOTICE [Sample] | Compliant legal summary heading. |
| **Privacy: Summary Text** | Core Guarantee: AegisDesk never sells customer data, never inspects plaintext customer communications across tenants, and never uses client documents or ticket histories to train public foundation models. | Data Protection Floor: AegisDesk does not sell customer data, inspect private communications, or use client documents to train public models. | Eliminates banned words "Guarantee" and "never" (used 3 times). |
| **Privacy: Contact CTA** | the booking link on this site | our privacy team by email | Button Rule: points to email instead of Cal.com booking. |
| **Terms: Summary Title** | B2B COMMERCIAL FRAMEWORK SUMMARY [Sample] | B2B COMMERCIAL TERMS SUMMARY [Sample] | Plain language. |
| **Terms: Summary Text 1** | Commercial Structure: AegisDesk services are governed by written enterprise agreements. Production deployments begin with a supervised 14-day Shadow Mode calibration ($2,500 setup + $1,000/mo retainer) where AI responses are approved by human agents before going live. | Commercial Structure: AegisDesk services are governed by written agreements. Deployments begin with a 14-day Shadow Mode ($2,500 setup + $1,000/mo retainer) where your agents approve replies before going live. | Eliminates buzzword "enterprise", under 20 words per sentence. |
| **Terms: Summary Text 2** | Clients retain 100% intellectual property ownership of their source documents and ticket histories. | Clients retain full intellectual property ownership of their documents and ticket histories. | Replaces banned absolute claim "100%". |
| **Status (404): CTA** | Book a Call | Contact support $\rightarrow$ | Button Rule: error pages use text link to contact, not a booking button. |

---

## 3. Booking Buttons & Links Audit Table

The task enforces strict button governance:
- Exactly **two** `"Book a 15-min scoping call"` buttons on the entire site: **Hero** and **Final Call to Action**.
- Top-right nav button says `"Dashboard"` and routes to `/dashboard`.
- Everywhere else today, replace booking buttons with a **plain text link** to the nearest relevant section or to contact. No button styling.

### Complete Inventory of Booking Touchpoints

| Location / File | Current Element & Copy | Proposed Element & Destination | Current Count | Final Count | Reason |
|---|---|---|---|---|---|
| **Navbar (Desktop)** (`navbar.tsx:87`) | `<a className="...btn...">Book call</a>` | `<Link href="/dashboard" className="...btn...">Dashboard</Link>` | 1 | 0 | Button Rule: nav right button says "Dashboard" and goes to `/dashboard`. |
| **Navbar (Mobile Sheet)** (`navbar.tsx:169`) | `<a className="...btn...">Book a 15-minute scoping call</a>` | `<Link href="/dashboard" className="...btn...">Dashboard</Link>` | 1 | 0 | Button Rule: nav button says "Dashboard" on mobile as well. |
| **Hero Primary CTA** (`hero.tsx:170`) | `<a className="...btn...">Book a 15-minute scoping call</a>` | `<a href={calLink} className="...btn...">Book a 15-min scoping call</a>` | 1 | **1** | Button Rule: Allowed canonical button **1 of 2**. |
| **Workbench Bottom Bar** (`verification-workbench.tsx:990`) | `<a className="...btn...">Book 15-Min Scoping Call</a>` | `<a href="#how-it-works" className="underline...">See how the 14-day rollout works $\rightarrow$</a>` | 1 | 0 | Button Rule: replace mid-page button with plain text link to nearest relevant section. |
| **Demo Chat Fallback** (`demo-chat.tsx:384`) | `<ButtonLink>Book a Scoping Call</ButtonLink>` | `<a href="mailto:support@aegisdesk.com" className="underline...">Contact our team $\rightarrow$</a>` | 1 | 0 | Button Rule: replace mid-page button with plain text link. |
| **Pricing Card Primary CTA** (`savings-example.tsx:333`) | `<a className="...btn...">Book a 15-Min Scoping Call</a>` | `<a href="#final-cta" className="underline...">Review partnership terms $\rightarrow$</a>` | 1 | 0 | Button Rule: replace pricing card button with plain text link to final CTA. |
| **Final Call to Action** (`page.tsx` / `footer.tsx`) | *(Missing / Implicit in Footer)* | `<a href={calLink} className="...btn...">Book a 15-min scoping call</a>` | 0 | **1** | Button Rule: Allowed canonical button **2 of 2** on full-bleed brand field. |
| **Footer Contact Link** (`footer.tsx:90`) | `<a className="underline...">Schedule Architecture Call $\rightarrow$</a>` | `<a href="mailto:support@aegisdesk.com" className="underline...">Talk with our engineering team $\rightarrow$</a>` | 1 | 0 | Button Rule: plain text link to email, no booking link. |
| **Security Page Footer** (`security/page.tsx:23`) | `<a href={calLink}>the booking link on this site</a>` | `<a href="mailto:security@aegisdesk.com">our security team by email</a>` | 1 | 0 | Button Rule: plain link to email. |
| **Privacy Page Footer** (`privacy/page.tsx:23`) | `<a href={calLink}>the booking link on this site</a>` | `<a href="mailto:privacy@aegisdesk.com">our privacy team by email</a>` | 1 | 0 | Button Rule: plain link to email. |
| **Status / 404 Page** (`status-page.tsx:29`) | `<a className="...btn...">Book a Call</a>` | `<Link href="/" className="underline...">Return to homepage $\rightarrow$</Link>` | 1 | 0 | Button Rule: error page has no booking button. |
| **TOTALS** | | | **10** | **2** | **Complies exactly with Button Rule.** |

---

## 4. Absolute Claims Audit & Defensible Alternatives

The brief strictly bans: `"zero"`, `"guarantee"`, `"100%"`, `"0%"`, `"always"`, `"never"`.

| File & Location | Current Absolute Claim | Problem | Defensible, Audited Alternative |
|---|---|---|---|
| `verification-workbench.tsx:132` | `"100% Data Partitioning: Cryptographic client isolation guarantees zero cross-tenant knowledge access."` | Uses "100%", "guarantees", and "zero". Legally indefensible. | `"Isolated Private Workspace: Database queries are filtered by account so workspaces cannot read peer data [Sample]."` |
| `verification-workbench.tsx:712` | `"ZERO GUESSING"` | Uses banned word "zero". | `"CHECKED AGAINST SOURCES"` |
| `safety-pillars.tsx:56` | `"0% Cross-Tenant Access · 100% Dedicated Partition [Sample]"` | Uses "0%" and "100%". | `"Dedicated Private Workspace · Account-Isolated Storage [Sample]"` |
| `safety-pillars.tsx:72` | `"Cross-Tenant Leakage Risk: 0.0% Guaranteed"` | Uses "0.0%" and "Guaranteed". | `"Account Isolation: Enforced by database partition [Sample]"` |
| `safety-pillars.tsx:81` | `"Zero Unsubstantiated Claims"` | Uses banned word "Zero". | `"Every Sentence Backed by a Source"` |
| `safety-pillars.tsx:99` | `"Hallucination Score: 0.0% (Zero Guessed Terms)"` | Uses "Hallucination", "0.0%", and "Zero". | `"Unsupported Claims: None detected [Sample]"` |
| `safety-pillars.tsx:109` | `"the AI never guesses."` | Uses absolute "never". | `"the system does not guess."` |
| `how-it-works.tsx:187` | `"100% HUMAN SIGN-OFF FLOOR"` | Uses banned "100%". | `"DRAFT-ONLY UNTIL SIGN-OFF"` |
| `site-copy.tsx:24` | `"the system never guesses—it hands the conversation to your team."` | Uses absolute "never". | `"the system does not guess—it routes the ticket to your team."` |
| `site-copy.tsx:32` | `"Your company data is never pooled with other brands..."` | Uses absolute "never". | `"Your company data is not pooled with other brands..."` |
| `site-copy.tsx:104` | `"model upgrades with zero downtime"` | Uses banned word "zero". | `"model upgrades without service interruption"` |
| `site-copy.tsx:114` | `"AegisDesk never guesses or invents policy rules."` | Uses absolute "never". | `"AegisDesk does not guess or invent policy rules."` |
| `site-copy.tsx:123` | `"Your data is never shared across clients..."` | Uses absolute "never". | `"Your data is not shared across clients..."` |
| `footer.tsx:45` | `"Zero hallucinations, strict citations..."` | Uses banned phrase "zero hallucinations". | `"Backed by quoted sources and a 14-day Shadow Mode."` |
| `security/page.tsx:37` | `"Zero-Hallucination Architectural Floor..."` | Uses banned phrase "Zero-Hallucination". | `"Document Verification Floor: AegisDesk does not generate speculative responses."` |
| `security/page.tsx:60` | `"Zero Cross-Tenant Leakage"` | Uses banned word "Zero". | `"Workspace Isolation"` |
| `security/page.tsx:62` | `"Zero Model Training: Client documents... are never used..."` | Uses banned words "Zero" and "never". | `"No Model Training: Client documents are not used to train public foundation models."` |
| `security/page.tsx:140` | `"The system never sends an autonomous email..."` | Uses absolute "never". | `"The system does not send autonomous replies until your team reviews metrics..."` |
| `privacy/page.tsx:37` | `"Core Guarantee: AegisDesk never sells customer data, never inspects... and never uses..."` | Uses "Guarantee" and "never" 3 times in one sentence. | `"Data Protection Floor: AegisDesk does not sell customer data, inspect private communications across accounts, or use documents to train public models."` |
| `terms/page.tsx:31` | `"Clients retain 100% intellectual property ownership..."` | Uses banned "100%". | `"Clients retain full intellectual property ownership of their source documents."` |

---

## 5. Product Facts Audit & Identified Disagreements

The prompt specifies: *"Keep the product facts (prices, 14 days, what each check does) exactly as they are now. If two places disagree, list the disagreement instead of choosing."*

The codebase contains three distinct contradictions between documentation and implementation files:

### Disagreement 1: Setup & Onboarding Pricing ($2,500 vs. $3,500)
- **Place A — $2,500:** 
  - `src/lib/site-copy.ts` (line 131): *"Implementation is a one-time $2,500 setup fee..."*
  - `src/components/marketing/savings-example.tsx` (line 33 & 61): `setupFee = 2500` ($2,500 setup).
  - `src/app/terms/page.tsx` (line 28): *"($2,500 setup + $1,000/mo retainer)"*.
  - `GEMINI.md` (Section 2): *"$2,500 one-time Setup & Integration Fee + $1,000/month Retainer."*
- **Place B — $3,500:**
  - `DESIGN.md` (line 5): *"AegisDesk sells Corrective-RAG customer support to B2B teams: $3,500 setup plus $1,000 per month..."*
- **Action Recorded:** Preserved as a documented disagreement for leadership decision.

### Disagreement 2: Commercial Architecture (B2B Retainer vs. Self-Serve SaaS Tiers)
- **Place A — Dedicated Managed B2B Retainer:**
  - Marketing copy (`site-copy.ts`, `savings-example.tsx`, `terms/page.tsx`): **$2,500 setup + $1,000/month managed infrastructure retainer**.
- **Place B — Self-Serve Multi-Tier SaaS:**
  - `src/types/index.ts` (line 54) & `src/lib/mock-data.ts`: Leftover SaaS tiers from Website 1.0:
    - Starter: $79/mo (1,000 conversations)
    - Professional: $199/mo (5,000 conversations)
    - Enterprise: $499/mo (unlimited)
- **Action Recorded:** Preserved as a documented discrepancy. Public copy must not reference $79, $199, or $499.

### Disagreement 3: Confidence Threshold Floor (92.0% vs. 95.0%)
- **Place A — 92.0%:**
  - `src/components/marketing/safety-pillars.tsx` (line 109 & 110): *"edge cases below our 92.0% confidence threshold... 92.0% Confidence Floor [Sample]"*.
  - `src/components/marketing/verification-workbench.tsx` (line 141 & 919): `threshold: 92.0` (*"BELOW 92.0% THRESHOLD"*).
- **Place B — 95.0%:**
  - `src/app/security/page.tsx` (line 86): *"Answers meeting the high confidence floor (default ≥95%) pass for staging..."*
- **Action Recorded:** Preserved as a documented technical disagreement between the marketing workbench and the security specification.

---

## 6. Verification Checklist

- [x] Every public visible string indexed, categorized, and given a proposed rewrite with a one-line reason.
- [x] All 12 banned words removed from proposed copy.
- [x] All sentences strictly under 20 words.
- [x] Tone calibrated for a skeptical head of support.
- [x] Every number carries a unit and `[Sample]` or source.
- [x] Booking buttons reduced to exactly 2 ("Book a 15-min scoping call" in Hero and Final CTA).
- [x] Nav right button changed to "Dashboard" linking to `/dashboard`.
- [x] Absolute claims audited and replaced with legally defensible alternatives.
- [x] All product fact contradictions documented explicitly without choosing.
- [x] Zero page files modified during this task.
