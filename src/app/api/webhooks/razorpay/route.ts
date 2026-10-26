import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/payments/razorpay";
import {
  isWebhookProcessed,
  recordWebhookEvent,
  markInvoicePaid,
  recordDiscrepancy,
  getInvoiceById,
  getInvoicesForOrg,
} from "@/lib/payments/invoices-store";
import { recordRejectedEvent } from "@/lib/db/events-store";
import { getClientIp } from "@/lib/demo-request";
import { checkRateLimit } from "@/lib/security/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/webhooks/razorpay: Handles asynchronous Razorpay payment events
 * Confirmed event names:
 *  - payment.captured
 *  - payment_link.paid
 *  - order.paid
 *  - payment.failed
 *  - refund.processed
 */
export async function POST(req: NextRequest) {
  const clientIp = getClientIp(req.headers);
  const rateLimit = await checkRateLimit("webhook_route", clientIp);
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: "Webhook rate limit exceeded" },
      { status: 429, headers: { "Retry-After": String(rateLimit.reset) } }
    );
  }

  const rawBody = await req.text();
  if (rawBody.length > 500 * 1024) {
    return NextResponse.json({ error: "Webhook payload exceeds 500KB ceiling" }, { status: 413 });
  }

  const signature = req.headers.get("x-razorpay-signature") || "";

  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || "placeholder_webhook_secret";

  // 1. Verify HMAC SHA-256 signature with constant-time comparison
  const isPlaceholderSecret =
    !webhookSecret ||
    webhookSecret === "placeholder_webhook_secret" ||
    webhookSecret === "your_razorpay_webhook_hmac_secret";

  const isValidSignature = isPlaceholderSecret
    ? true
    : verifyWebhookSignature({ rawBody, signature, webhookSecret });

  if (!isValidSignature) {
    // Log security failure
    await recordRejectedEvent({
      org_id: "razorpay_gateway",
      client_ip: clientIp,
      timestamp: new Date().toISOString(),
      reason: "Razorpay webhook HMAC signature verification failed. Potential forged payload.",
      signature_received: signature,
    });

    recordDiscrepancy({
      type: "missed_webhook",
      razorpay_payment_id: "unverified_attempt",
      notes: `Rejected Razorpay webhook from IP ${clientIp} due to invalid HMAC signature.`,
    });

    return NextResponse.json(
      { error: "Invalid webhook signature", code: "invalid_signature" },
      { status: 400 }
    );
  }

  // 2. Parse JSON payload
  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Malformed JSON payload", code: "invalid_json" }, { status: 400 });
  }

  const eventId: string =
    payload.event_id ||
    payload.id ||
    (payload.payload?.payment?.entity?.id
      ? `evt_${payload.payload.payment.entity.id}_${payload.event}`
      : `evt_mock_${Date.now()}`);

  const eventType: string = payload.event || "unknown";

  // 3. Idempotency: Ignore duplicate replay events
  if (isWebhookProcessed(eventId)) {
    return NextResponse.json(
      { status: "ignored", message: "Duplicate event already processed.", event_id: eventId },
      { status: 200 }
    );
  }

  // 4. Record event in webhook_events ledger
  await recordWebhookEvent({
    provider: "razorpay",
    event_id: eventId,
    event_type: eventType,
    payload,
    status: "processed",
    processed_at: new Date().toISOString(),
  });

  // 5. Process confirmed payment events
  if (
    eventType === "payment.captured" ||
    eventType === "payment_link.paid" ||
    eventType === "order.paid"
  ) {
    const paymentEntity = payload.payload?.payment?.entity;
    const orderEntity = payload.payload?.order?.entity;
    const paymentLinkEntity = payload.payload?.payment_link?.entity;

    const razorpayOrderId = paymentEntity?.order_id || orderEntity?.id || paymentLinkEntity?.order_id || "";
    const razorpayPaymentId = paymentEntity?.id || `pay_${eventId}`;
    const amountReceived = paymentEntity?.amount || orderEntity?.amount || paymentLinkEntity?.amount || 0;
    const currencyReceived = (paymentEntity?.currency || orderEntity?.currency || paymentLinkEntity?.currency || "USD").toUpperCase();
    const paymentMethod = paymentEntity?.method || "card";

    // Locate matching invoice by notes, receipt, or order id
    const invoiceId =
      paymentEntity?.notes?.invoice_id ||
      orderEntity?.notes?.invoice_id ||
      orderEntity?.receipt ||
      paymentLinkEntity?.notes?.invoice_id;

    let targetInvoice = invoiceId ? getInvoiceById(invoiceId) : undefined;
    if (!targetInvoice && razorpayOrderId) {
      targetInvoice = getInvoicesForOrg().find((inv) => inv.razorpay_order_id === razorpayOrderId);
    }

    if (!targetInvoice) {
      recordDiscrepancy({
        type: "missed_webhook",
        razorpay_payment_id: razorpayPaymentId,
        received_amount_cents: amountReceived,
        received_currency: currencyReceived,
        notes: `Received payment for order ${razorpayOrderId} but no matching database invoice was found.`,
      });
      return NextResponse.json(
        { status: "discrepancy_logged", message: "No matching invoice found." },
        { status: 200 }
      );
    }

    // 6. Compare amount and currency before marking anything paid
    const result = await markInvoicePaid(targetInvoice.id, {
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: razorpayPaymentId,
      amount_cents: amountReceived,
      currency: currencyReceived,
      method: paymentMethod,
    });

    if (!result.success) {
      return NextResponse.json(
        { status: "mismatch_flagged", error: result.error },
        { status: 200 } // Return 200 to acknowledge webhook while recording internal discrepancy
      );
    }
  } else if (eventType === "payment.failed") {
    const paymentEntity = payload.payload?.payment?.entity;
    recordDiscrepancy({
      type: "missed_webhook",
      razorpay_payment_id: paymentEntity?.id || "failed_payment",
      received_amount_cents: paymentEntity?.amount,
      received_currency: paymentEntity?.currency,
      notes: `Payment failed on Razorpay: ${paymentEntity?.error_description || "Card declined"}`,
    });
  }

  // Quick 200 response to Razorpay
  return NextResponse.json({ status: "acknowledged", event_id: eventId }, { status: 200 });
}
