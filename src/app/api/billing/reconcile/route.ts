import { NextRequest, NextResponse } from "next/server";
import {
  getInvoicesForOrg,
  markInvoicePaid,
  recordDiscrepancy,
  getDiscrepancies,
  type ReconciliationDiscrepancy,
} from "@/lib/payments/invoices-store";
import { fetchRazorpayPayments } from "@/lib/payments/razorpay";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/billing/reconcile: Compares Razorpay records with database invoices
 */
export async function POST(req: NextRequest) {
  try {
    const keyId = process.env.RAZORPAY_KEY_ID || "";
    const keySecret = process.env.RAZORPAY_KEY_SECRET || "";

    const now = Math.floor(Date.now() / 1000);
    const oneDayAgo = now - 24 * 60 * 60;

    // Fetch payments from Razorpay API
    const razorpayPayments = await fetchRazorpayPayments(oneDayAgo, now, keyId, keySecret);
    const ourInvoices = getInvoicesForOrg();

    let autoReconciledCount = 0;
    let mismatchesCount = 0;

    // Compare Razorpay payments against database records
    for (const payment of razorpayPayments) {
      if (payment.status !== "captured") continue;

      const invoiceId = payment.notes?.invoice_id || payment.description;
      const matchedInvoice = ourInvoices.find(
        (inv) => inv.id === invoiceId || inv.razorpay_order_id === payment.order_id
      );

      if (!matchedInvoice) {
        recordDiscrepancy({
          type: "missed_webhook",
          razorpay_payment_id: payment.id,
          received_amount_cents: payment.amount,
          received_currency: payment.currency,
          notes: `Payment ${payment.id} found on Razorpay but not in AegisDesk database.`,
        });
        mismatchesCount++;
        continue;
      }

      // Check amount and currency
      if (
        matchedInvoice.amount_cents !== payment.amount ||
        matchedInvoice.currency.toUpperCase() !== payment.currency.toUpperCase()
      ) {
        recordDiscrepancy({
          type: "amount_mismatch",
          invoice_id: matchedInvoice.id,
          invoice_number: matchedInvoice.invoice_number,
          razorpay_payment_id: payment.id,
          expected_amount_cents: matchedInvoice.amount_cents,
          received_amount_cents: payment.amount,
          expected_currency: matchedInvoice.currency,
          received_currency: payment.currency,
          notes: `Reconciliation discrepancy: Invoice ${matchedInvoice.invoice_number} expects ${matchedInvoice.amount_cents} ${matchedInvoice.currency}, but Razorpay payment has ${payment.amount} ${payment.currency}.`,
        });
        mismatchesCount++;
        continue;
      }

      // Auto-heal missed webhook
      if (matchedInvoice.status !== "paid") {
        await markInvoicePaid(matchedInvoice.id, {
          razorpay_order_id: payment.order_id,
          razorpay_payment_id: payment.id,
          amount_cents: payment.amount,
          currency: payment.currency,
          method: payment.method,
        });
        autoReconciledCount++;
      }
    }

    const discrepancies = getDiscrepancies();

    return NextResponse.json({
      status: "success",
      timestamp: new Date().toISOString(),
      razorpay_payments_scanned: razorpayPayments.length,
      invoices_evaluated: ourInvoices.length,
      auto_reconciled_count: autoReconciledCount,
      active_discrepancies_count: discrepancies.length,
      discrepancies,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Reconciliation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * GET /api/billing/reconcile: Return recent reconciliation discrepancies for the owner console
 */
export async function GET() {
  const discrepancies = getDiscrepancies();
  return NextResponse.json({
    timestamp: new Date().toISOString(),
    discrepancies,
    total: discrepancies.length,
  });
}
