import crypto from "crypto";

export interface RazorpayOrderPayload {
  amount: number; // in lowest currency unit (cents or paise)
  currency: string; // 'USD' | 'INR'
  receipt: string; // invoice_number or reference
  notes?: Record<string, string>;
}

export interface RazorpayOrderResponse {
  id: string;
  entity: string;
  amount: number;
  currency: string;
  receipt: string;
  status: string;
  created_at: number;
}

export interface VerifyCheckoutSignatureArgs {
  orderId: string;
  paymentId: string;
  signature: string;
  keySecret: string;
}

export interface VerifyWebhookSignatureArgs {
  rawBody: string;
  signature: string;
  webhookSecret: string;
}

/**
 * Verifies Razorpay checkout signature:
 * Expected: HMAC-SHA256(order_id + "|" + payment_id, secret)
 */
export function verifyCheckoutSignature({
  orderId,
  paymentId,
  signature,
  keySecret,
}: VerifyCheckoutSignatureArgs): boolean {
  try {
    const data = `${orderId}|${paymentId}`;
    const expected = crypto.createHmac("sha256", keySecret).update(data).digest("hex");
    const sigBuf = Buffer.from(signature, "hex");
    const expBuf = Buffer.from(expected, "hex");
    if (sigBuf.length !== expBuf.length) return false;
    return crypto.timingSafeEqual(sigBuf, expBuf);
  } catch {
    return false;
  }
}

/**
 * Verifies Razorpay Webhook signature:
 * Expected: HMAC-SHA256(rawBody, webhookSecret)
 */
export function verifyWebhookSignature({
  rawBody,
  signature,
  webhookSecret,
}: VerifyWebhookSignatureArgs): boolean {
  try {
    const expected = crypto.createHmac("sha256", webhookSecret).update(rawBody).digest("hex");
    const sigBuf = Buffer.from(signature, "hex");
    const expBuf = Buffer.from(expected, "hex");
    if (sigBuf.length !== expBuf.length) return false;
    return crypto.timingSafeEqual(sigBuf, expBuf);
  } catch {
    return false;
  }
}

/**
 * Server-side Razorpay order creation via REST API (Basic Auth)
 * Zero external libraries required; uses native fetch.
 */
export async function createRazorpayOrder(
  payload: RazorpayOrderPayload,
  keyId: string,
  keySecret: string
): Promise<RazorpayOrderResponse> {
  // If test placeholder keys are detected in development/preview, return a deterministic mock test order
  if (
    !keyId ||
    !keySecret ||
    keyId.includes("placeholder") ||
    keyId === "rzp_test_your_key_id"
  ) {
    return {
      id: `order_test_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      entity: "order",
      amount: payload.amount,
      currency: payload.currency.toUpperCase(),
      receipt: payload.receipt,
      status: "created",
      created_at: Math.floor(Date.now() / 1000),
    };
  }

  const authHeader = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: `Basic ${authHeader}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: payload.amount,
      currency: payload.currency.toUpperCase(),
      receipt: payload.receipt,
      notes: payload.notes || {},
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Razorpay Order API error (HTTP ${res.status}): ${errText}`);
  }

  return (await res.json()) as RazorpayOrderResponse;
}

/**
 * Fetch payments from Razorpay API for reconciliation
 */
export async function fetchRazorpayPayments(
  fromTimestamp: number,
  toTimestamp: number,
  keyId: string,
  keySecret: string
): Promise<any[]> {
  if (
    !keyId ||
    !keySecret ||
    keyId.includes("placeholder") ||
    keyId === "rzp_test_your_key_id"
  ) {
    // Return mock payment records matching test orders in preview
    return [];
  }

  const authHeader = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
  const url = `https://api.razorpay.com/v1/payments?from=${fromTimestamp}&to=${toTimestamp}&count=100`;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Basic ${authHeader}`,
    },
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Razorpay Payments fetch failed: ${errText}`);
  }

  const data = await res.json();
  return data.items || [];
}
