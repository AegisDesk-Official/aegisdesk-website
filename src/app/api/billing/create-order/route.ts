import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getInvoiceById } from "@/lib/payments/invoices-store";
import { createRazorpayOrder } from "@/lib/payments/razorpay";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { getClientIp } from "@/lib/demo-request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const createOrderSchema = z
  .object({
    invoice_id: z.string().min(1, "invoice_id is required"),
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
    const parseResult = createOrderSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid request payload", details: parseResult.error.format() },
        { status: 400 }
      );
    }

    const { invoice_id } = parseResult.data;

    // Strict Security Rule: Amount and currency come strictly from verified database records.
    const invoice = getInvoiceById(invoice_id);
    if (!invoice) {
      return NextResponse.json(
        { error: `Invoice "${invoice_id}" not found.`, code: "invoice_not_found" },
        { status: 404 }
      );
    }

    if (invoice.status === "paid") {
      return NextResponse.json(
        { error: "This invoice has already been fully paid and settled.", code: "already_paid" },
        { status: 400 }
      );
    }

    const keyId =
      process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
      process.env.RAZORPAY_KEY_ID ||
      "rzp_test_placeholder_key";
    const keySecret = process.env.RAZORPAY_KEY_SECRET || "placeholder_secret_key";

    // Call Razorpay API to generate the hosted checkout order
    const order = await createRazorpayOrder(
      {
        amount: invoice.amount_cents,
        currency: invoice.currency,
        receipt: invoice.invoice_number,
        notes: {
          invoice_id: invoice.id,
          org_id: invoice.org_id,
        },
      },
      keyId,
      keySecret
    );

    invoice.razorpay_order_id = order.id;

    // The browser receives ONLY the order ID and the public key ID
    return NextResponse.json({
      order_id: order.id,
      key_id: keyId,
      amount: order.amount,
      currency: order.currency,
      invoice_number: invoice.invoice_number,
      description: invoice.description,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create payment order";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
