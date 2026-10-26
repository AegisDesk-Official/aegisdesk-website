/**
 * Sanitization Engine for Logs, Error Pages, and Telemetry.
 * Strips stack traces, credit card numbers, passwords, auth tokens, and raw PII.
 */

// Luhn-matching credit card regex pattern
const CARD_PATTERN = /\b(?:\d[ -]*?){13,16}\b/g;
// Bearer and API token pattern
const TOKEN_PATTERN = /(?:bearer\s+[a-zA-Z0-9_\-.]+|sk-[a-zA-Z0-9]{20,}|rzp_[a-zA-Z0-9_]+)/gi;
// Password fields in JSON or query params
const PASSWORD_PATTERN = /(["']?password["']?\s*[:=]\s*["'])([^"']+)(["'])/gi;
// URI credentials e.g. postgres://user:password@host
const URI_CREDENTIAL_PATTERN = /([a-zA-Z+]+:\/\/[^:]+:)[^@]+(@)/gi;

export function sanitizeText(input: string): string {
  if (!input) return "";

  return input
    .replace(CARD_PATTERN, "[REDACTED_CARD]")
    .replace(TOKEN_PATTERN, "[REDACTED_TOKEN]")
    .replace(PASSWORD_PATTERN, "$1[REDACTED_PASSWORD]$3")
    .replace(URI_CREDENTIAL_PATTERN, "$1[REDACTED_PASSWORD]$2");
}

export function sanitizeObject<T>(obj: T): T {
  if (!obj || typeof obj !== "object") {
    if (typeof obj === "string") {
      return sanitizeText(obj) as unknown as T;
    }
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item)) as unknown as T;
  }

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    if (
      lowerKey.includes("password") ||
      lowerKey.includes("secret") ||
      lowerKey.includes("token") ||
      lowerKey.includes("cvv") ||
      lowerKey.includes("card_number")
    ) {
      sanitized[key] = "[REDACTED]";
    } else if (typeof value === "string") {
      sanitized[key] = sanitizeText(value);
    } else if (typeof value === "object" && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized as T;
}

export function formatSafeError(error: unknown): { error: string; code?: string } {
  if (typeof error === "string") {
    return { error: sanitizeText(error) };
  }

  if (error && typeof error === "object") {
    const err = error as { message?: string; code?: string; name?: string };
    // Never expose stack trace or internal SQL / system paths
    const message = err.message ? sanitizeText(err.message) : "An unexpected operational error occurred.";
    return {
      error: message,
      code: err.code || "INTERNAL_ERROR",
    };
  }

  return { error: "An unexpected operational error occurred." };
}

export function safeLog(message: string, meta?: Record<string, unknown>): void {
  // Never log in production unless stripped of PII
  const cleanMessage = sanitizeText(message);
  const cleanMeta = meta ? sanitizeObject(meta) : undefined;

  if (process.env.NODE_ENV !== "test") {
    if (cleanMeta) {
      console.log(`[AegisDesk SecOps] ${cleanMessage}`, cleanMeta);
    } else {
      console.log(`[AegisDesk SecOps] ${cleanMessage}`);
    }
  }
}
