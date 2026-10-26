/**
 * AegisDesk Dashboard Seed & Fixture Data
 * Contains exact metrics from ARCHITECTURE.md and seed.sql for Org A, Org B, and Demo workspaces.
 * Every demo number is flagged and displayed with a "Demo" label.
 */

export interface MetricTile {
  id: string;
  label: string;
  value: string;
  delta: string;
  deltaType: "positive" | "negative" | "neutral";
  subtext: string;
  sparkline: number[];
}

export interface HandoffReason {
  reason: "no_source" | "low_confidence" | "conflicting_policy" | "sensitive_topic";
  label: string;
  count: number;
  percentage: number;
  color: string;
}

export interface PolicyGapItem {
  id: string;
  query: string;
  unmatchedClause: string;
  frequency: number;
  status: "unreviewed" | "in_progress" | "resolved";
  firstSeen: string;
  topic: string;
}

export interface ClientInvoiceItem {
  id: string;
  invoiceNumber: string;
  type: "setup_deposit" | "setup_balance" | "monthly_retainer";
  typeLabel: string;
  amount: number;
  currency: string;
  status: "paid" | "issued" | "overdue" | "draft";
  dueDate: string;
  paidAt?: string;
}

export interface OperatorClient {
  id: string;
  name: string;
  slug: string;
  phase: "deposit_paid" | "onboarding" | "shadow_mode" | "balance_paid" | "live" | "retainer_active";
  phaseLabel: string;
  monthlyRevenue: number;
  volume: number;
  handoffRate: number;
  aiCost: number;
  marginAmount: number;
  marginPercent: number;
  confidenceThreshold: number;
}

export interface PipelineStage {
  stage: "booked" | "proposal_sent" | "deposit_paid" | "shadow_mode" | "live";
  label: string;
  count: number;
  value: number;
}

export interface SecurityEventItem {
  id: string;
  type: "failed_login" | "blocked_bot" | "rejected_signature" | "mfa_challenge";
  label: string;
  ip: string;
  source: string;
  timestamp: string;
  severity: "low" | "medium" | "high";
}

// Client Overview Fixtures (Apex Retail - Org A in Shadow Validation Day 11 of 14)
export const CLIENT_OVERVIEW_DATA = {
  phase: "shadow_mode",
  phaseTitle: "14-Day Shadow Validation — Day 11 of 14",
  phaseDescription: "AI drafts responses alongside your human agents in Zendesk. Autonomous customer delivery is paused until written calibration sign-off.",
  confidenceThreshold: 92.0,
  daysRemaining: 3,

  // Six Headline Tiles
  headlineTiles: [
    {
      id: "tickets_handled",
      label: "Tickets handled",
      value: "1,420",
      delta: "+18% vs prev period",
      deltaType: "positive",
      subtext: "Count of ticket_received",
      sparkline: [120, 135, 142, 138, 155, 162, 170, 185],
    },
    {
      id: "verified_answer_rate",
      label: "Verified Answer Rate",
      value: "94.6%",
      delta: "+1.2% above target",
      deltaType: "positive",
      subtext: "Drafts passing all 3 checks",
      sparkline: [91.8, 92.4, 93.1, 93.0, 93.9, 94.2, 94.6],
    },
    {
      id: "handed_to_team",
      label: "Escalated to Team",
      value: "18.2%",
      delta: "-2.4% escalation drop",
      deltaType: "positive",
      subtext: "handed_to_human / tickets",
      sparkline: [24.0, 22.5, 21.0, 20.2, 19.5, 18.8, 18.2],
    },
    {
      id: "blocked_drafts",
      label: "Blocked drafts",
      value: "42",
      delta: "Check 1: 18 • Check 2: 15 • Check 3: 9",
      deltaType: "neutral",
      subtext: "Total check_blocked count",
      sparkline: [12, 15, 8, 10, 6, 7, 5, 4],
    },
    {
      id: "approval_rate_shadow",
      label: "Shadow Approval Rate",
      value: "91.4%",
      delta: "Target: ≥90.0% for Live",
      deltaType: "positive",
      subtext: "approved / (approved + edited + rejected)",
      sparkline: [82.0, 84.5, 87.0, 89.2, 90.1, 91.0, 91.4],
    },
    {
      id: "autoresolved_rate_live",
      label: "Projected Deflection",
      value: "76.8%",
      delta: "Share of drafts approved as they are",
      deltaType: "neutral",
      subtext: "In Shadow Validation: approved as they are; after go-live: resolved with no edit",
      sparkline: [68.0, 70.5, 72.0, 73.5, 75.0, 76.2, 76.8],
    },
  ] as MetricTile[],

  // Handoff Reasons Breakdown
  handoffReasons: [
    { reason: "no_source", label: "No source document matches query", count: 124, percentage: 48, color: "var(--blocked)" },
    { reason: "low_confidence", label: "Model confidence below 92.0% threshold", count: 80, percentage: 31, color: "var(--warn)" },
    { reason: "conflicting_policy", label: "Contradiction detected across documents", count: 36, percentage: 14, color: "var(--text-dim)" },
    { reason: "sensitive_topic", label: "Sensitive keyword or security escalation", count: 18, percentage: 7, color: "var(--text-faint)" },
  ] as HandoffReason[],

  // Policy Gaps
  policyGaps: [
    {
      id: "gap-1",
      query: "Can customers exchange opened cosmetics within 45 days if allergic?",
      unmatchedClause: "Returns policy strictly covers unopened merchandise within 30 days.",
      frequency: 24,
      status: "unreviewed",
      firstSeen: "2 days ago",
      topic: "Cosmetics Return Exclusions",
    },
    {
      id: "gap-2",
      query: "What is the warranty turnaround time for custom engraved jewelry?",
      unmatchedClause: "Standard warranty clause does not specify engraving delays.",
      frequency: 18,
      status: "in_progress",
      firstSeen: "4 days ago",
      topic: "Bespoke Jewelry SLAs",
    },
    {
      id: "gap-3",
      query: "Is express international courier shipping reimbursable on return?",
      unmatchedClause: "Return shipping clause covers domestic postal carriage only.",
      frequency: 11,
      status: "unreviewed",
      firstSeen: "6 days ago",
      topic: "Courier Freight Policy",
    },
  ] as PolicyGapItem[],

  // Next Payment
  nextPayment: {
    amount: 1000,
    currency: "USD",
    dueDate: "2026-11-01",
    planLabel: "Monthly Engineering Retainer",
    status: "scheduled",
    paymentMethod: "Razorpay Mandate ending in ••8491",
  },
};

// Client Performance & Analytics Fixtures
export const CLIENT_PERFORMANCE_DATA = {
  firstResponseTime: {
    median: "42s",
    p95: "2m 14s",
    humanMedian: "14m 30s",
  },
  timeSaved: {
    hours: "214.5 hrs",
    formula: "(1,090 auto-resolved + approved) × 11.8 min avg handle",
  },
  costSaved: {
    amount: "$6,435",
    formula: "214.5 hrs × $30.00/hr agent cost",
  },
  knowledgeHealth: {
    documentCount: 14,
    daysSinceLastUpdate: 3,
    groundedShare: "98.2%",
  },
  channelSplit: [
    { channel: "Zendesk Support", count: 864, share: 61 },
    { channel: "Gorgias Chat", count: 326, share: 23 },
    { channel: "Freshdesk Portal", count: 156, share: 11 },
    { channel: "Custom Email Webhook", count: 74, share: 5 },
  ],
  topTopics: [
    { topic: "Order Shipping Status & Delays", volume: 482, handoffRate: "6.4%", groundedRate: "97.1%" },
    { topic: "Return & Exchange Requirements", volume: 341, handoffRate: "18.2%", groundedRate: "93.4%" },
    { topic: "Promo Code & Coupon Application", volume: 218, handoffRate: "4.1%", groundedRate: "99.0%" },
    { topic: "Damaged Package Claims", volume: 164, handoffRate: "34.8%", groundedRate: "88.2%" },
    { topic: "Account Password & MFA Reset", volume: 115, handoffRate: "2.6%", groundedRate: "99.4%" },
  ],
  customerSatisfaction: {
    available: true,
    csatScore: "4.82 / 5.0",
    responseCount: 312,
    positiveRate: "96.4%",
  },
  blockedDraftsBreakdown: [
    { check: "Check 1: Policy Retrieval Verification", count: 18, reason: "No matching policy clause above the 92% confidence bar" },
    { check: "Check 2: Strict Hallucination Gate", count: 15, reason: "Model assertion unverified by source chunk text" },
    { check: "Check 3: Tone & Safety Invariant", count: 9, reason: "Policy escalation keyword or tone deviation" },
  ],
};

// Owner Console Fixtures (/operator)
export const OPERATOR_DATA = {
  monthlyRecurringRevenue: 12000, // 12 active client retainers x $1,000/mo
  totalInvoiced: 42500,
  activeClientsCount: 12,
  pipelineStages: [
    { stage: "booked", label: "Call Booked", count: 4, value: 10000 },
    { stage: "proposal_sent", label: "Proposal Sent", count: 3, value: 7500 },
    { stage: "deposit_paid", label: "Deposit Paid ($2,500)", count: 2, value: 5000 },
    { stage: "shadow_mode", label: "14-Day Shadow Validation", count: 3, value: 7500 },
    { stage: "live", label: "Live Retainer Active ($1,000/mo)", count: 12, value: 12000 },
  ] as PipelineStage[],

  clients: [
    {
      id: "00000000-0000-0000-0000-000000000001",
      name: "Apex Retail",
      slug: "apex-retail",
      phase: "shadow_mode",
      phaseLabel: "Shadow Validation (Day 11)",
      monthlyRevenue: 1000,
      volume: 1420,
      handoffRate: 18.2,
      aiCost: 48.28,
      marginAmount: 951.72,
      marginPercent: 95.2,
      confidenceThreshold: 92.0,
    },
    {
      id: "00000000-0000-0000-0000-000000000002",
      name: "Beacon Logistics",
      slug: "beacon-logistics",
      phase: "live",
      phaseLabel: "Live",
      monthlyRevenue: 1000,
      volume: 3840,
      handoffRate: 11.4,
      aiCost: 112.5,
      marginAmount: 887.5,
      marginPercent: 88.8,
      confidenceThreshold: 92.0,
    },
    {
      id: "client-003",
      name: "Strata Global SaaS",
      slug: "strata-global",
      phase: "live",
      phaseLabel: "Live",
      monthlyRevenue: 1000,
      volume: 2190,
      handoffRate: 8.7,
      aiCost: 68.1,
      marginAmount: 931.9,
      marginPercent: 93.2,
      confidenceThreshold: 92.0,
    },
    {
      id: "client-004",
      name: "Krona FinTech",
      slug: "krona-fintech",
      phase: "live",
      phaseLabel: "Live",
      monthlyRevenue: 1000,
      volume: 4120,
      handoffRate: 14.1,
      aiCost: 138.4,
      marginAmount: 861.6,
      marginPercent: 86.2,
      confidenceThreshold: 94.0,
    },
    {
      id: "client-005",
      name: "Vantage Healthcare",
      slug: "vantage-health",
      phase: "onboarding",
      phaseLabel: "Onboarding",
      monthlyRevenue: 0,
      volume: 120,
      handoffRate: 45.0,
      aiCost: 12.0,
      marginAmount: -12.0,
      marginPercent: 0.0,
      confidenceThreshold: 95.0,
    },
  ] as OperatorClient[],

  cashPosition: {
    invoicedMonth: 14500,
    paidMonth: 13500,
    overdueMonth: 1000,
    overdueClient: "Vantage Healthcare (INV-2026-004)",
  },

  paymentFailures: [
    { id: "pf-1", client: "Vantage Healthcare", amount: 1000, date: "2026-10-22", error: "Card declined: insufficient funds", retryCount: 2 },
  ],

  systemHealth: {
    errorRate: "0.02%",
    p95LatencyEvents: "340ms",
    p95LatencySite: "180ms",
    avgTokensPerDraft: 642,
    aiCostPerTicketAvg: "$0.032",
    uptime30d: "99.98%",
  },

  securityEvents: [
    { id: "sec-1", type: "failed_login", label: "Failed login attempt (3 incorrect passwords)", ip: "194.26.29.112", source: "/auth/sign-in", timestamp: "12m ago", severity: "medium" },
    { id: "sec-2", type: "blocked_bot", label: "Cloudflare Turnstile challenge failure on demo chat", ip: "45.154.255.89", source: "/api/demo", timestamp: "34m ago", severity: "low" },
    { id: "sec-3", type: "blocked_bot", label: "Rate limit exceeded (Upstash Redis 429)", ip: "89.187.168.14", source: "/api/demo", timestamp: "1h 05m ago", severity: "low" },
    { id: "sec-4", type: "rejected_signature", label: "Invalid Razorpay HMAC signature on webhook attempt", ip: "52.66.101.40", source: "/api/webhooks/razorpay", timestamp: "3h 22m ago", severity: "high" },
  ] as SecurityEventItem[],
};
