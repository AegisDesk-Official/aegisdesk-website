export const copy = {
  hero: {
    badge: [
      "Answers checked against your documents",
      "Backed by quoted sources",
      "14-Day Shadow Validation",
    ],
    title: "Support answers backed by your documents.",
    subtitle:
      "We turn your policies and tickets into support answers that quote your documents. Edge cases route straight to your team.",
    primaryCta: "Book a 15-min scoping call",
    secondaryCtaDemoOff: "See how the 14-day rollout works",
    secondaryCtaDemoOn: "Test the workbench",
    trust: [
      "Private workspace for your documents",
      "Exact document & page citation on every reply",
      "Uncertain or complex cases route straight to your team",
    ],
  },

  safety: {
    title: "Three checks between your documents and the customer.",
    intro:
      "Built so support leadership never has to wonder if an answer was made up or leaked from another account.",
    cards: [
      {
        title: "Check 01 · Private workspace search",
        subhead: "Isolated from other accounts",
        body: "Every search stays inside your private workspace. The system cannot search the public web or view another company's data.",
      },
      {
        title: "Check 02 · Sentence-by-sentence source check",
        subhead: "Every sentence backed by a source",
        body: "The system checks every sentence against your documents. If an answer cannot find source text, it is removed.",
      },
      {
        title: "Check 03 · The bar an answer must clear",
        subhead: "Stops and routes edge cases",
        body: "When an answer falls below the confidence bar, the system does not guess. It routes the ticket to your team.",
      },
    ],
  },

  comparison: {
    eyebrow: "Why Document Checks Matter",
    title: "Why ungrounded chatbots put customer trust at risk",
    intro:
      "Standard chatbots try to sound helpful at all costs—even when that means making up refund windows or promising unauthorized credits. AegisDesk only speaks when your documents back it up.",
  },

  integrations: {
    title: "Works with your helpdesk",
    note: "Connectors and webhooks for modern helpdesks—deployed without disrupting your team’s daily workflow.",
  },

  howItWorks: {
    title: "How Shadow Validation works",
    intro:
      "14 days where the AI drafts and your team approves every reply before anything goes live.",
    note: "The AI writes drafts inside your helpdesk. Your agents approve each reply. You only turn on live answers when ready.",
    steps: [
      {
        phase: "PHASE 01",
        pill: "DISCOVERY",
        title: "Discovery and baseline audit",
        body: "In 15 minutes we review your ticket volume, common questions and cost per resolution, and map your expected savings.",
      },
      {
        phase: "PHASE 02",
        pill: "PROVISIONING",
        title: "Workspace provisioning and knowledge ingestion",
        body: "We set up your private dashboard, connect your helpdesk, and index your policies, manuals and approved macros.",
      },
      {
        phase: "PHASE 03",
        pill: "SHADOW VALIDATION",
        title: "Parallel Shadow Validation",
        body: "AegisDesk drafts replies inside your helpdesk. Your agents review each one and send it with a click. Nothing reaches a customer unapproved.",
      },
      {
        phase: "PHASE 04",
        pill: "CALIBRATION",
        title: "Confidence calibration and go-live",
        body: "We tune the confidence bar to your team's approvals. Categories you approve go live; everything else stays with your team. Policy updates are synced continuously.",
      },
    ],
  },

  savings: {
    title: "See what you save with documented support answers.",
    label: "Interactive ROI model · Default shows 1,500 tickets/month baseline",
    note: "Adjust the sliders below to reflect your support volume and team costs. We lock in your exact scope during a 15-minute call.",
  },

  pilot: {
    title: "B2B Managed Partnership",
    badge: "Limited to 3 partner brands this cohort",
    setupLabel: "Document Setup & Helpdesk Connection",
    setupNote:
      "One-time setup covering document structuring, private workspace setup, helpdesk connection, and your 14-day Shadow Validation.",
    monthlyLabel: "Managed Monthly Retainer",
    monthlyNote:
      "Covers dedicated private hosting, model compute, weekly calibration, and ongoing policy updates.",
    quoteNote: "Transparent, predictable partnership—locked in after your 15-minute scoping call.",
    includedTitle: "Included in your one-time setup",
    included: [
      "Full indexing of your policies, manuals, help articles, and ticket macros",
      "Helpdesk connection for Zendesk, Gorgias, or custom webhooks",
      "14-day Shadow Validation inside your current helpdesk workspace",
      "Direct Slack channel with our engineering team",
      "Source citations and accuracy scores on every drafted reply",
    ],
    monthlyTitle: "Included in your monthly managed retainer",
    monthly: [
      "Private cloud hosting, isolated data storage, and model compute",
      "Weekly search calibration and review of escalated tickets",
      "Policy updates whenever your return, shipping, or service terms change",
      "Monthly report of new customer questions your documents do not cover",
      "Ongoing helpdesk maintenance and model upgrades without service interruption",
    ],
    cta: "Book a 15-min scoping call",
    footnote: "",
  },

  faq: {
    title: "Questions support leaders ask us",
    intro:
      "How document checks, the 14-day Shadow Validation, and data privacy work in your helpdesk.",
    items: [
      {
        q: "What happens if a customer asks something not covered in our documents?",
        a: "AegisDesk does not guess. If our search cannot find clear supporting text in your documents, it routes the ticket to your team with a summary.",
      },
      {
        q: "How do we know it will not promise an unapproved refund?",
        a: "We start with 14 days of Shadow Validation where the AI only drafts replies. Every claim links to the exact paragraph in your documents.",
      },
      {
        q: "How is our company data kept private from other clients?",
        a: "Your documents and conversations live in your private workspace. Your data is not shared with other clients or used to train public models.",
      },
      {
        q: "Which helpdesks do you support?",
        a: "We connect directly with Zendesk, Gorgias, and Shopify Plus, and support custom helpdesks through standard webhooks.",
      },
      {
        q: "How does pricing work?",
        a: "Setup starts at $2,500 and the monthly retainer at $1,000, scaled to your monthly ticket volume. A 50% deposit starts your setup, and the balance is due before go-live. You see your exact fees in your proposal before you pay anything.",
      },
    ],
  },

  founders: {
    title: "Built and managed by dedicated support engineering partners",
  },
} as const;

export const siteCopy = copy;
export default copy;
