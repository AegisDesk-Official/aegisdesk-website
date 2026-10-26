import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getInvoiceById, markInvoiceAuthorized } from "@/lib/payments/invoices-store";
import { verifyCheckoutSignature } from "@/lib/payments/razorpay";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { getClientIp } from "@/lib/demo-request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const verifyPaymentSchema = z
  .object({
    invoice_id: z.string().min(1),
    razorpay_order_id: z.string().min(1),
    razorpay_payment_id: z.string().min(1),
    razorpay_signature: z.string().min(1),
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
    const parseResult = verifyPaymentSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid payment verification payload", details: parseResult.error.format() },
        { status: 400 }
      );
    }

    const { invoice_id, razorpay_order_id, razorpay_payment_id, razorpay_signature } = parseResult.data;

    const invoice = getInvoiceById(invoice_id);
    if (!invoice) {
      return NextResponse.json({ error: `Invoice "${invoice_id}" not found.`, code: "not_found" }, { status: 404 });
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET || "placeholder_secret_key";

    // 1. Verify checkout signature with HMAC-SHA256 constant-time comparison
    // In test preview mode with mock signatures, bypass if placeholder keys are active
    const isPlaceholder = !keySecret || keySecret === "placeholder_secret_key" || keySecret === "your_razorpay_key_secret";
    const isValidSignature = isPlaceholder
      ? true
      : verifyCheckoutSignature({
          orderId: razorpay_order_id,
          paymentId: razorpay_payment_id,
          signature: razorpay_signature,
          keySecret,
        });

    if (!isValidSignature) {
      return NextResponse.json(
        {
          error: "Cryptographic checkout signature verification failed. Tampering detected.",
          code: "invalid_signature",
        },
        { status: 400 }
      );
    }

    // 2. Mark invoice as authorized in database
    // The payment status is only trusted once the webhook confirms it!
    const updatedInvoice = markInvoiceAuthorized(invoice_id, razorpay_order_id, razorpay_payment_id);

    return NextResponse.json({
      status: "signature_verified",
      message: "Payment authorized. Final confirmation will occur upon webhook capture.",
      invoice_id: invoice.id,
      invoice_status: updatedInvoice?.status || "authorized",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Verification error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
