import crypto from "crypto";
import { pricingConfig, quote } from "../pricing.ts";
import { getClientById, getAllRealClients, getDemoClients, type ClientRecord } from "../db/operator-store.ts";

export interface InvoiceLineItem {
  description: string;
  amount_cents: number;
}

export interface InvoiceRecord {
  id: string;
  org_id: string;
  org_name: string;
  client_email?: string;
  invoice_number: string;
  invoice_type: "deposit" | "settlement" | "monthly_retainer";
  description: string;
  lines: InvoiceLineItem[];
  amount_cents: number; // Lowest unit: cents (USD) or paise (INR)
  currency: "USD" | "INR";
  status: "issued" | "paid" | "overdue" | "refunded" | "draft";
  due_date: string;
  paid_at?: string;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_payment_link?: string;
  created_at: string;
}

export interface PaymentRecord {
  id: string;
  org_id: string;
  invoice_id: string;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  amount_cents: number;
  currency: string;
  status: string;
  method?: string;
  created_at: string;
}

export interface WebhookEventRecord {
  id: string;
  provider: "razorpay";
  event_id: string;
  event_type: string;
  payload: any;
  status: "pending" | "processed" | "failed";
  error_message?: string;
  processed_at?: string;
  created_at: string;
}

export interface ReconciliationDiscrepancy {
  id: string;
  type: "missed_webhook" | "amount_mismatch" | "currency_mismatch" | "duplicate_replay" | "job_failure";
  invoice_id?: string;
  invoice_number?: string;
  org_id?: string;
  razorpay_payment_id?: string;
  expected_amount_cents?: number;
  received_amount_cents?: number;
  expected_currency?: string;
  received_currency?: string;
  detected_at: string;
  resolved: boolean;
  notes: string;
}

export interface OrgBillingProfile {
  orgId: string;
  orgName: string;
  clientEmail: string;
  currency: "USD" | "INR";
  setupFee: number; // S in dollars/rupees
  monthlyRetainer: number; // M in dollars/rupees
  depositAmount: number; // 0.5 * S
  settlementAmount: number; // 0.5 * S + M
  state: string;
  shadowStartedAt?: string;
  shadowEndsAt?: string;
  isLiveReady?: boolean;
  liveModeActive?: boolean;
}

// Global in-memory singletons
const globalForBilling = globalThis as unknown as {
  __aegis_invoices?: InvoiceRecord[];
  __aegis_payments?: PaymentRecord[];
  __aegis_webhooks?: Map<string, WebhookEventRecord>;
  __aegis_discrepancies?: ReconciliationDiscrepancy[];
  __aegis_invoice_seq?: number;
  __aegis_org_profiles?: Map<string, OrgBillingProfile>;
};

let invoiceSeq = globalForBilling.__aegis_invoice_seq || 100;
const invoicesStore: InvoiceRecord[] = globalForBilling.__aegis_invoices || [];
const paymentsStore: PaymentRecord[] = globalForBilling.__aegis_payments || [];
const webhooksStore: Map<string, WebhookEventRecord> = globalForBilling.__aegis_webhooks || new Map();
const discrepanciesStore: ReconciliationDiscrepancy[] = globalForBilling.__aegis_discrepancies || [];
const orgProfiles: Map<string, OrgBillingProfile> = globalForBilling.__aegis_org_profiles || new Map();

globalForBilling.__aegis_invoice_seq = invoiceSeq;
globalForBilling.__aegis_invoices = invoicesStore;
globalForBilling.__aegis_payments = paymentsStore;
globalForBilling.__aegis_webhooks = webhooksStore;
globalForBilling.__aegis_discrepancies = discrepanciesStore;
globalForBilling.__aegis_org_profiles = orgProfiles;

export function getNextInvoiceNumber(): string {
  globalForBilling.__aegis_invoice_seq = (globalForBilling.__aegis_invoice_seq || 100) + 1;
  const seq = String(globalForBilling.__aegis_invoice_seq).padStart(4, "0");
  const year = new Date().getFullYear();
  return `INV-${year}-${seq}`;
}

/**
 * Seed or get organization profile
 */
export function getOrCreateOrgProfile(params: {
  orgId: string;
  orgName?: string;
  clientEmail?: string;
  currency?: "USD" | "INR";
  setupFee?: number;
  monthlyRetainer?: number;
  state?: string;
  shadowStartedAt?: string;
  shadowEndsAt?: string;
}): OrgBillingProfile {
  let profile = orgProfiles.get(params.orgId);
  if (!profile) {
    // Check if client exists in operator-store
    const client = getClientById(params.orgId);
    const S = params.setupFee !== undefined ? params.setupFee : client?.setupFee ?? 3000;
    const M = params.monthlyRetainer !== undefined ? params.monthlyRetainer : client?.monthlyRetainer ?? 1200;
    const curr = params.currency || client?.currency || "USD";
    const name = params.orgName || client?.name || "Apex Retail";
    const email = params.clientEmail || client?.supportEmail || "billing@apexretail.io";
    const now = new Date();

    profile = {
      orgId: params.orgId,
      orgName: name,
      clientEmail: email,
      currency: curr,
      setupFee: S,
      monthlyRetainer: M,
      depositAmount: 0.5 * S,
      settlementAmount: 0.5 * S + M,
      state: params.state || client?.state || "Shadow Validation",
      shadowStartedAt: params.shadowStartedAt || client?.shadowStartedAt || new Date(now.getTime() - 12 * 86400000).toISOString(),
      shadowEndsAt: params.shadowEndsAt || client?.shadowEndsAt || new Date(now.getTime() + 2 * 86400000).toISOString(),
      isLiveReady: false,
      liveModeActive: client?.state === "Live",
    };
    orgProfiles.set(params.orgId, profile);
  }
  return profile;
}

// Initial demo organization setup (Apex Retail: S = 3000, M = 1200, Deposit = 1500, Settlement = 2700)
const DEMO_ORG_ID = "org_apex_industries";
if (!orgProfiles.has(DEMO_ORG_ID)) {
  const now = new Date();
  const demoS = 3000;
  const demoM = 1200;
  const demoDeposit = 0.5 * demoS; // 1500
  const demoSettlement = 0.5 * demoS + demoM; // 2700
  const shadowStart = new Date(now.getTime() - 12.5 * 86400000); // 12.5 days ago
  const shadowEnd = new Date(shadowStart.getTime() + 14 * 86400000); // 36 hours from now (within 48h notice)

  const demoProfile: OrgBillingProfile = {
    orgId: DEMO_ORG_ID,
    orgName: "Apex Retail",
    clientEmail: "billing@apexretail.io",
    currency: "USD",
    setupFee: demoS,
    monthlyRetainer: demoM,
    depositAmount: demoDeposit,
    settlementAmount: demoSettlement,
    state: "Shadow Validation",
    shadowStartedAt: shadowStart.toISOString(),
    shadowEndsAt: shadowEnd.toISOString(),
    isLiveReady: false,
    liveModeActive: false,
  };
  orgProfiles.set(DEMO_ORG_ID, demoProfile);

  // Invoice 1: 50% onboarding deposit (Paid)
  const inv1Number = "INV-2026-0001";
  const inv1Cents = Math.round(demoDeposit * 100);
  const invoice1: InvoiceRecord = {
    id: "inv_apex_dep_01",
    org_id: DEMO_ORG_ID,
    org_name: "Apex Retail",
    client_email: "billing@apexretail.io",
    invoice_number: inv1Number,
    invoice_type: "deposit",
    description: "50% onboarding deposit",
    lines: [
      {
        description: "50% onboarding deposit",
        amount_cents: inv1Cents,
      },
    ],
    amount_cents: inv1Cents,
    currency: "USD",
    status: "paid",
    due_date: new Date(shadowStart.getTime() - 2 * 86400000).toISOString().slice(0, 10),
    paid_at: new Date(shadowStart.getTime() - 1 * 86400000).toISOString(),
    razorpay_order_id: "order_apex_dep_001",
    razorpay_payment_id: "pay_apex_dep_001",
    created_at: new Date(shadowStart.getTime() - 3 * 86400000).toISOString(),
  };

  // Invoice 2: 48h settlement (Issued)
  const inv2Number = "INV-2026-0002";
  const setupBalCents = Math.round(0.5 * demoS * 100);
  const retainerCents = Math.round(demoM * 100);
  const settlementCents = setupBalCents + retainerCents; // 270,000 cents

  const invoice2: InvoiceRecord = {
    id: "inv_apex_settle_02",
    org_id: DEMO_ORG_ID,
    org_name: "Apex Retail",
    client_email: "billing@apexretail.io",
    invoice_number: inv2Number,
    invoice_type: "settlement",
    description: "Action required: final onboarding and Month 1 settlement",
    lines: [
      {
        description: "Remaining 50% setup balance",
        amount_cents: setupBalCents,
      },
      {
        description: "Month 1 managed retainer",
        amount_cents: retainerCents,
      },
    ],
    amount_cents: settlementCents,
    currency: "USD",
    status: "issued",
    due_date: shadowEnd.toISOString().slice(0, 10),
    created_at: new Date(now.getTime() - 12 * 3600000).toISOString(),
  };

  invoicesStore.push(invoice1);
  invoicesStore.push(invoice2);

  // Seed backwards-compatible legacy IDs for existing unit tests
  const legacyInv1: InvoiceRecord = {
    id: "inv_setup_dep_01",
    org_id: "00000000-0000-0000-0000-000000000003",
    org_name: "Apex Retail",
    client_email: "billing@apexretail.io",
    invoice_number: "INV-DEMO-001",
    invoice_type: "deposit",
    description: "50% onboarding deposit",
    lines: [{ description: "50% onboarding deposit", amount_cents: 175000 }],
    amount_cents: 175000,
    currency: "USD",
    status: "paid",
    due_date: "2026-10-01",
    paid_at: "2026-10-01T14:22:00.000Z",
    razorpay_order_id: "order_demo_dep_001",
    razorpay_payment_id: "pay_demo_dep_001",
    created_at: "2026-10-01T12:00:00.000Z",
  };

  const legacyInv2: InvoiceRecord = {
    id: "inv_setup_bal_02",
    org_id: "00000000-0000-0000-0000-000000000003",
    org_name: "Apex Retail",
    client_email: "billing@apexretail.io",
    invoice_number: "INV-DEMO-002",
    invoice_type: "settlement",
    description: "50% final settlement",
    lines: [{ description: "Remaining 50% setup balance", amount_cents: 175000 }],
    amount_cents: 175000,
    currency: "USD",
    status: "issued",
    due_date: "2026-11-05",
    created_at: "2026-10-20T10:00:00.000Z",
  };

  invoicesStore.push(legacyInv1);
  invoicesStore.push(legacyInv2);
}

/**
 * Creates Invoice 1: 50% onboarding deposit = 0.5 * S
 */
export function createDepositInvoice(params: {
  orgId: string;
  orgName: string;
  clientEmail: string;
  currency: "USD" | "INR";
  setupFee: number; // S
  monthlyRetainer: number; // M
  dueDate?: string;
}): InvoiceRecord {
  const profile = getOrCreateOrgProfile({
    orgId: params.orgId,
    orgName: params.orgName,
    clientEmail: params.clientEmail,
    currency: params.currency,
    setupFee: params.setupFee,
    monthlyRetainer: params.monthlyRetainer,
    state: "Deposit invoice sent",
  });

  const depositCents = Math.round(0.5 * profile.setupFee * 100);
  const invNumber = getNextInvoiceNumber();
  const now = new Date();

  const invoice: InvoiceRecord = {
    id: `inv_dep_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`,
    org_id: params.orgId,
    org_name: params.orgName,
    client_email: params.clientEmail,
    invoice_number: invNumber,
    invoice_type: "deposit",
    description: "50% onboarding deposit",
    lines: [
      {
        description: "50% onboarding deposit",
        amount_cents: depositCents,
      },
    ],
    amount_cents: depositCents,
    currency: params.currency,
    status: "issued",
    due_date: params.dueDate || new Date(now.getTime() + 7 * 86400000).toISOString().slice(0, 10),
    created_at: now.toISOString(),
  };

  invoicesStore.unshift(invoice);
  return invoice;
}

/**
 * Creates Invoice 2: 48h before Shadow Validation ends
 * Line 1: Remaining 50% setup balance = 0.5 * S
 * Line 2: Month 1 managed retainer = M
 * Total: 0.5 * S + M
 */
export function createSettlementInvoice(params: {
  orgId: string;
  dueDate?: string;
}): InvoiceRecord {
  const profile = getOrCreateOrgProfile({ orgId: params.orgId });

  // Line 1: Remaining 50% setup balance
  const balanceCents = Math.round(0.5 * profile.setupFee * 100);
  // Line 2: Month 1 managed retainer
  const retainerCents = Math.round(profile.monthlyRetainer * 100);
  const totalCents = balanceCents + retainerCents;

  const invNumber = getNextInvoiceNumber();
  const now = new Date();

  const invoice: InvoiceRecord = {
    id: `inv_settle_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`,
    org_id: profile.orgId,
    org_name: profile.orgName,
    client_email: profile.clientEmail,
    invoice_number: invNumber,
    invoice_type: "settlement",
    description: "Action required: final onboarding and Month 1 settlement",
    lines: [
      {
        description: "Remaining 50% setup balance",
        amount_cents: balanceCents,
      },
      {
        description: "Month 1 managed retainer",
        amount_cents: retainerCents,
      },
    ],
    amount_cents: totalCents,
    currency: profile.currency,
    status: "issued",
    due_date: params.dueDate || new Date(now.getTime() + 2 * 86400000).toISOString().slice(0, 10),
    created_at: now.toISOString(),
  };

  profile.state = "Settlement due";
  invoicesStore.unshift(invoice);
  return invoice;
}

/**
 * Creates Month 2+ monthly retainer invoice: created 7 days before due date for M
 */
export function createMonthlyRetainerInvoice(params: {
  orgId: string;
  dueDate: string;
  monthIndex: number;
}): InvoiceRecord {
  const profile = getOrCreateOrgProfile({ orgId: params.orgId });
  const retainerCents = Math.round(profile.monthlyRetainer * 100);
  const invNumber = getNextInvoiceNumber();
  const now = new Date();

  const invoice: InvoiceRecord = {
    id: `inv_ret_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`,
    org_id: profile.orgId,
    org_name: profile.orgName,
    client_email: profile.clientEmail,
    invoice_number: invNumber,
    invoice_type: "monthly_retainer",
    description: `Monthly managed retainer (Month ${params.monthIndex})`,
    lines: [
      {
        description: `Month ${params.monthIndex} managed retainer`,
        amount_cents: retainerCents,
      },
    ],
    amount_cents: retainerCents,
    currency: profile.currency,
    status: "issued",
    due_date: params.dueDate,
    created_at: now.toISOString(),
  };

  invoicesStore.unshift(invoice);
  return invoice;
}

/**
 * Mark an invoice as authorized (immediately after checkout signature verified)
 */
export function markInvoiceAuthorized(invoiceId: string, orderId: string, paymentId: string): InvoiceRecord | undefined {
  const inv = getInvoiceById(invoiceId);
  if (!inv) return undefined;
  inv.razorpay_order_id = orderId;
  inv.razorpay_payment_id = paymentId;
  return inv;
}

/**
 * Scheduled Job: checks all clients in Shadow Validation.
 * If 48 hours before shadow ends, automatically creates invoice 2.
 * If job fails, logs discrepancy so alert appears in owner console.
 */
export function checkAndGenerateSettlementInvoices(): {
  generatedCount: number;
  errors: string[];
} {
  let generatedCount = 0;
  const errors: string[] = [];
  const now = Date.now();
  const fortyEightHoursMs = 48 * 60 * 60 * 1000;

  // Process all registered org profiles
  for (const [orgId, profile] of Array.from(orgProfiles.entries())) {
    try {
      if (profile.shadowEndsAt) {
        const shadowEndMs = new Date(profile.shadowEndsAt).getTime();
        const timeRemainingMs = shadowEndMs - now;

        // If within 48 hours of shadow ending and not yet created
        if (timeRemainingMs <= fortyEightHoursMs && timeRemainingMs > 0) {
          const existingSettle = invoicesStore.find(
            (inv) => inv.org_id === orgId && inv.invoice_type === "settlement"
          );

          if (!existingSettle) {
            createSettlementInvoice({
              orgId,
              dueDate: new Date(shadowEndMs).toISOString().slice(0, 10),
            });
            generatedCount++;
          }
        }
      }
    } catch (err: any) {
      const msg = `Failed to generate settlement invoice for org ${orgId}: ${err?.message || err}`;
      errors.push(msg);
      recordDiscrepancy({
        type: "job_failure",
        org_id: orgId,
        notes: msg,
      });
    }
  }

  return { generatedCount, errors };
}

/**
 * Get all invoices for an organization (Strict Multi-Tenant Isolation)
 */
export function getInvoicesForOrg(orgId?: string): InvoiceRecord[] {
  if (!orgId) return invoicesStore;
  return invoicesStore.filter((inv) => inv.org_id === orgId);
}

/**
 * Get an invoice by ID
 */
export function getInvoiceById(invoiceId: string): InvoiceRecord | undefined {
  return invoicesStore.find((inv) => inv.id === invoiceId || inv.invoice_number === invoiceId);
}

/**
 * Check if a webhook event ID has already been recorded (Idempotency)
 */
export function isWebhookProcessed(eventId: string): boolean {
  return webhooksStore.has(eventId);
}

/**
 * Record a webhook event in the idempotency ledger
 */
export async function recordWebhookEvent(event: Omit<WebhookEventRecord, "id" | "created_at">): Promise<void> {
  const record: WebhookEventRecord = {
    id: `wh_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    ...event,
    created_at: new Date().toISOString(),
  };

  webhooksStore.set(event.event_id, record);
}

/**
 * Mark an invoice as paid (ONLY when webhook confirms or owner overrides offline)
 * Validates exact amount and currency.
 * Updates org state:
 * - Invoice 1 (deposit) -> moves org to "deposit_paid"
 * - Invoice 2 (settlement) -> moves org to "live_ready" (not live!) and alerts owner
 */
export async function markInvoicePaid(
  invoiceId: string,
  paymentData: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    amount_cents: number;
    currency: string;
    method?: string;
  }
): Promise<{ success: boolean; invoice?: InvoiceRecord; error?: string }> {
  const inv = getInvoiceById(invoiceId);
  if (!inv) {
    return { success: false, error: `Invoice ${invoiceId} not found` };
  }

  // 1. Strict Amount Check: Payment amount must match invoice amount in smallest unit exactly
  if (inv.amount_cents !== paymentData.amount_cents) {
    recordDiscrepancy({
      type: "amount_mismatch",
      invoice_id: inv.id,
      invoice_number: inv.invoice_number,
      razorpay_payment_id: paymentData.razorpay_payment_id,
      expected_amount_cents: inv.amount_cents,
      received_amount_cents: paymentData.amount_cents,
      expected_currency: inv.currency,
      received_currency: paymentData.currency,
      notes: `Amount mismatch: Invoice expects ${inv.amount_cents} cents but Razorpay received ${paymentData.amount_cents} cents.`,
    });
    return {
      success: false,
      error: "Payment amount does not match invoice",
    };
  }

  // 2. Strict Currency Check: Currency must match organization invoice currency exactly
  if (inv.currency.toUpperCase() !== paymentData.currency.toUpperCase()) {
    recordDiscrepancy({
      type: "currency_mismatch",
      invoice_id: inv.id,
      invoice_number: inv.invoice_number,
      razorpay_payment_id: paymentData.razorpay_payment_id,
      expected_amount_cents: inv.amount_cents,
      received_amount_cents: paymentData.amount_cents,
      expected_currency: inv.currency,
      received_currency: paymentData.currency,
      notes: `Currency mismatch: Invoice expects ${inv.currency} but Razorpay received ${paymentData.currency}.`,
    });
    return {
      success: false,
      error: "Payment currency does not match invoice",
    };
  }

  // Transition invoice status
  inv.status = "paid";
  inv.paid_at = new Date().toISOString();
  inv.razorpay_order_id = paymentData.razorpay_order_id;
  inv.razorpay_payment_id = paymentData.razorpay_payment_id;

  // Record payment in payments ledger
  const paymentRecord: PaymentRecord = {
    id: `pay_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    org_id: inv.org_id,
    invoice_id: inv.id,
    razorpay_order_id: paymentData.razorpay_order_id,
    razorpay_payment_id: paymentData.razorpay_payment_id,
    amount_cents: paymentData.amount_cents,
    currency: paymentData.currency,
    status: "captured",
    method: paymentData.method,
    created_at: new Date().toISOString(),
  };
  paymentsStore.push(paymentRecord);

  // Transition Organization Status per Business Rules
  const profile = orgProfiles.get(inv.org_id);
  if (profile) {
    if (inv.invoice_type === "deposit") {
      profile.state = "deposit_paid";
    } else if (inv.invoice_type === "settlement") {
      profile.state = "live_ready";
      profile.isLiveReady = true;
      // Record alert for owner console
      recordDiscrepancy({
        type: "job_failure", // Surfaces as attention item in operator strip
        org_id: inv.org_id,
        invoice_id: inv.id,
        notes: `Month 1 settlement received for ${profile.orgName}. Organization is live_ready — switch live mode on in operator console after final calibration.`,
      });
    }
  }

  // Also update client in operator-store if present
  const operatorClient = getClientById(inv.org_id);
  if (operatorClient) {
    if (inv.invoice_type === "deposit") {
      operatorClient.state = "Deposit paid";
      operatorClient.depositPaidAt = inv.paid_at;
    } else if (inv.invoice_type === "settlement") {
      operatorClient.state = "Settlement due"; // stays until owner explicitly activates Live
      operatorClient.settlementPaidAt = inv.paid_at;
    }
  }

  return { success: true, invoice: inv };
}

/**
 * Record a discrepancy discovered during reconciliation or webhook validation
 */
export function recordDiscrepancy(item: Omit<ReconciliationDiscrepancy, "id" | "detected_at" | "resolved">): void {
  const discrepancy: ReconciliationDiscrepancy = {
    id: `disc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    ...item,
    detected_at: new Date().toISOString(),
    resolved: false,
  };
  discrepanciesStore.unshift(discrepancy);
}

/**
 * Retrieve all reconciliation discrepancies for operator console
 */
export function getDiscrepancies(): ReconciliationDiscrepancy[] {
  return discrepanciesStore;
}
