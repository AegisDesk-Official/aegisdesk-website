export interface InvoiceRecord {
  id: string;
  org_id: string;
  invoice_number: string;
  description: string;
  amount_cents: number; // e.g. 175000 for $1,750.00
  currency: "USD" | "INR";
  status: "draft" | "issued" | "authorized" | "paid" | "overdue" | "refunded";
  due_date: string;
  paid_at?: string;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
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
  type: "missed_webhook" | "amount_mismatch" | "currency_mismatch" | "duplicate_replay";
  invoice_id?: string;
  invoice_number?: string;
  razorpay_payment_id: string;
  expected_amount_cents?: number;
  received_amount_cents?: number;
  expected_currency?: string;
  received_currency?: string;
  detected_at: string;
  resolved: boolean;
  notes: string;
}

// In-memory singletons for local development and preview mode
const globalForBilling = globalThis as unknown as {
  __aegis_invoices?: InvoiceRecord[];
  __aegis_payments?: PaymentRecord[];
  __aegis_webhooks?: Map<string, WebhookEventRecord>;
  __aegis_discrepancies?: ReconciliationDiscrepancy[];
};

const DEFAULT_INVOICES: InvoiceRecord[] = [
  {
    id: "inv_setup_dep_01",
    org_id: "00000000-0000-0000-0000-000000000003", // Demo Org
    invoice_number: "INV-DEMO-001",
    description: "50% Setup & Integration Kickoff Deposit ($1,750)",
    amount_cents: 175000,
    currency: "USD",
    status: "paid",
    due_date: "2026-10-01",
    paid_at: "2026-10-01T14:22:00.000Z",
    razorpay_order_id: "order_demo_dep_001",
    razorpay_payment_id: "pay_demo_dep_001",
    created_at: "2026-10-01T12:00:00.000Z",
  },
  {
    id: "inv_setup_bal_02",
    org_id: "00000000-0000-0000-0000-000000000003",
    invoice_number: "INV-DEMO-002",
    description: "50% Final Shadow Validation Balance ($1,750)",
    amount_cents: 175000,
    currency: "USD",
    status: "issued",
    due_date: "2026-11-05",
    created_at: "2026-10-20T10:00:00.000Z",
  },
  {
    id: "inv_ret_03",
    org_id: "00000000-0000-0000-0000-000000000003",
    invoice_number: "INV-DEMO-003",
    description: "Monthly Managed Retainer (Month 1)",
    amount_cents: 100000,
    currency: "USD",
    status: "draft",
    due_date: "2026-11-15",
    created_at: "2026-10-25T10:00:00.000Z",
  },
];

const invoicesStore: InvoiceRecord[] = globalForBilling.__aegis_invoices || [...DEFAULT_INVOICES];
const paymentsStore: PaymentRecord[] = globalForBilling.__aegis_payments || [];
const webhooksStore: Map<string, WebhookEventRecord> = globalForBilling.__aegis_webhooks || new Map();
const discrepanciesStore: ReconciliationDiscrepancy[] = globalForBilling.__aegis_discrepancies || [
  {
    id: "disc_demo_01",
    type: "amount_mismatch",
    invoice_number: "INV-TEST-992",
    razorpay_payment_id: "pay_tamper_attempt_441",
    expected_amount_cents: 175000,
    received_amount_cents: 100, // Attacker sent $1.00
    expected_currency: "USD",
    received_currency: "USD",
    detected_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    resolved: false,
    notes: "Client attempted to alter checkout amount. Blocked on server; payment rejected.",
  },
];

globalForBilling.__aegis_invoices = invoicesStore;
globalForBilling.__aegis_payments = paymentsStore;
globalForBilling.__aegis_webhooks = webhooksStore;
globalForBilling.__aegis_discrepancies = discrepanciesStore;

/**
 * Get all invoices for an organization (or all in preview)
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
 * Check if a webhook event ID has already been recorded
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

  // Attempt async write to Supabase if configured
  try {
    const mod = await import("../supabase/admin");
    const supabase = mod.createAdminClient();
    await supabase.from("webhook_events").insert({
      provider: "razorpay",
      event_id: event.event_id,
      event_type: event.event_type,
      payload: event.payload,
      status: event.status,
      processed_at: event.processed_at,
    });
  } catch {
    // Graceful fallback for local preview
  }
}

/**
 * Mark an invoice as authorized (immediately after checkout signature verified)
 */
export function markInvoiceAuthorized(invoiceId: string, orderId: string, paymentId: string): InvoiceRecord | undefined {
  const inv = getInvoiceById(invoiceId);
  if (!inv) return undefined;
  inv.status = "authorized";
  inv.razorpay_order_id = orderId;
  inv.razorpay_payment_id = paymentId;
  return inv;
}

/**
 * Mark an invoice as paid (ONLY when webhook confirms payment.captured / payment_link.paid / order.paid)
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

  // Verify amount & currency
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
    return { success: false, error: "Payment amount does not match invoice" };
  }

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
    return { success: false, error: "Payment currency does not match invoice" };
  }

  inv.status = "paid";
  inv.paid_at = new Date().toISOString();
  inv.razorpay_order_id = paymentData.razorpay_order_id;
  inv.razorpay_payment_id = paymentData.razorpay_payment_id;

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

  // Sync with Supabase if configured
  try {
    const mod = await import("../supabase/admin");
    const supabase = mod.createAdminClient();
    await supabase
      .from("invoices")
      .update({ status: "paid", paid_at: inv.paid_at })
      .eq("id", inv.id);

    await supabase.from("payments").insert({
      org_id: inv.org_id,
      invoice_id: inv.id,
      razorpay_order_id: paymentData.razorpay_order_id,
      razorpay_payment_id: paymentData.razorpay_payment_id,
      razorpay_signature: "webhook_verified",
      amount_cents: paymentData.amount_cents,
      currency: paymentData.currency,
      status: "captured",
      method: paymentData.method,
    });
  } catch {
    // Graceful fallback for preview
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
