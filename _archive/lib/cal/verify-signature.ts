import crypto from "crypto";

export interface VerifyCalSignatureOptions {
  rawBody: string | Buffer;
  signatureHeader: string | null | undefined;
  secret?: string;
}

/**
 * Verifies the `x-cal-signature-256` HMAC SHA-256 signature from Cal.com
 * using constant-time evaluation to prevent timing attacks.
 */
export function verifyCalSignature({
  rawBody,
  signatureHeader,
  secret,
}: VerifyCalSignatureOptions): { valid: boolean; error?: string } {
  const webhookSecret =
    secret ||
    process.env.CALCOM_WEBHOOK_SECRET ||
    process.env.CAL_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return {
      valid: false,
      error: "Cal.com webhook signing secret is not configured in environment variables (CALCOM_WEBHOOK_SECRET)",
    };
  }

  if (!signatureHeader || typeof signatureHeader !== "string") {
    return {
      valid: false,
      error: "Missing required 'x-cal-signature-256' signature header",
    };
  }

  try {
    const rawBuffer = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(rawBody, "utf-8");

    // Compute expected HMAC SHA-256 hex digest
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(rawBuffer)
      .digest("hex");

    const headerClean = signatureHeader.trim();
    const signatureBuffer = Buffer.from(headerClean, "utf-8");
    const expectedBuffer = Buffer.from(expectedSignature, "utf-8");

    // Both buffers must be non-empty and have identical byte lengths for timingSafeEqual
    if (signatureBuffer.length === 0 || signatureBuffer.length !== expectedBuffer.length) {
      return {
        valid: false,
        error: "Cal.com webhook signature length mismatch or invalid format",
      };
    }

    const isValid = crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
    if (!isValid) {
      return {
        valid: false,
        error: "Cryptographic HMAC SHA-256 signature verification failed",
      };
    }

    return { valid: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Verification error";
    return { valid: false, error: `Signature evaluation failure: ${message}` };
  }
}
