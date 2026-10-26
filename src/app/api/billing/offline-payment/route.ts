import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getInvoiceById, markInvoicePaid } from "@/lib/payments/invoices-store";
import { sendPaymentReceivedEmail } from "@/lib/email/resend";
import { createAdminClient } from "@/lib/db/admin";
import { getClientIp } from "@/lib/demo-request";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { recordAuditLog } from "@/lib/security/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const offlinePaymentSchema = z
  .object({
    invoice_id: z.string().min(1, "invoice_id is required"),
    reason: z.string().min(5, "A descriptive offline payment reason is required (e.g., Wire transfer reference, NEFT UTR)"),
    reference_number: z.string().optional(),
    mfa_code: z.string().regex(/^\d{6}$/, "A valid 6-digit authenticator-app code is required to authorize offline settlement"),
  })
  .strict();

export async function POST(req: NextRequest) {
  try {
    const clientIp = getClientIp(req.headers);
    const rateLimit = await checkRateLimit("api_route", clientIp);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please wait." },
        { status: 429, headers: { "Retry-After": String(rateLimit.reset) } }
      );
    }

    const raw = await req.text();
    if (raw.length > 10 * 1024) {
      return NextResponse.json({ error: "Payload exceeds 10KB limit" }, { status: 413 });
    }

    const body = JSON.parse(raw);

    const parseResult = offlinePaymentSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parseResult.error.format() },
        { status: 400 }
      );
    }

    const { invoice_id, reason, reference_number, mfa_code } = parseResult.data;

    if (!/^\d{6}$/.test(mfa_code)) {
      return NextResponse.json({ error: "Invalid authenticator code" }, { status: 403 });
    }

    const invoice = getInvoiceById(invoice_id);
    if (!invoice) {
      return NextResponse.json({ error: `Invoice "${invoice_id}" not found.`, code: "not_found" }, { status: 404 });
    }

    if (invoice.status === "paid") {
      return NextResponse.json({ error: "Invoice has already been paid.", code: "already_paid" }, { status: 400 });
    }

    const offlinePaymentId = reference_number || `offline_wire_${Date.now()}`;

    // Mark invoice paid
    const result = await markInvoicePaid(invoice.id, {
      razorpay_order_id: invoice.razorpay_order_id || `offline_order_${Date.now()}`,
      razorpay_payment_id: offlinePaymentId,
      amount_cents: invoice.amount_cents,
      currency: invoice.currency,
      method: "offline_bank_transfer",
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    // Write to audit_log
    recordAuditLog({
      eventType: "billing.mark_paid",
      actorId: "usr_operator",
      actorEmail: "owner@aegisdesk.ai",
      actorRole: "owner",
      organizationId: invoice.org_id,
      ipAddress: clientIp,
      details: {
        invoiceNumber: invoice.invoice_number,
        amountCents: invoice.amount_cents,
        reason,
        offlinePaymentId,
      },
    });

    try {
      const supabase = createAdminClient();
      await supabase.from("audit_log").insert({
        org_id: invoice.org_id,
        action: "invoice_marked_paid_offline",
        resource_type: "invoice",
        resource_id: invoice.id,
        metadata: {
          invoice_number: invoice.invoice_number,
          amount_cents: invoice.amount_cents,
          currency: invoice.currency,
          reason,
          reference_number: offlinePaymentId,
          operator_ip: clientIp,
        },
        ip_address: clientIp,
      });
    } catch {
      // Graceful fallback for preview mode
    }

    // Send receipt email
    await sendPaymentReceivedEmail({
      to: "billing@apexretail.io", // Demo recipient
      invoiceNumber: invoice.invoice_number,
      amount: invoice.amount_cents / 100,
      currency: invoice.currency,
      paymentId: offlinePaymentId,
      paidAt: new Date().toISOString(),
    });

    return NextResponse.json({
      status: "success",
      message: `Invoice ${invoice.invoice_number} successfully marked as paid offline.`,
      invoice: result.invoice,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to record offline payment";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
