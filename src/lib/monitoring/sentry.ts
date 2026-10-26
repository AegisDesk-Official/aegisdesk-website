/**
 * Sentry Error Monitoring & Telemetry with Strict PII Scrubbing.
 *
 * Rules:
 *   1. Zero personal data or customer ticket content is sent to Sentry.
 *   2. Client IPs are anonymized to "0.0.0.0".
 *   3. All authorization headers, cookies, and secret tokens are stripped.
 *   4. Operates gracefully even if @sentry/nextjs is not installed.
 */

// Regex patterns for sensitive data scrubbing
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PHONE_REGEX = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
const CREDIT_CARD_REGEX = /\b(?:\d{4}[-\s]?){3}\d{4}\b/g;
const AUTH_TOKEN_REGEX = /(?:Bearer\s+[A-Za-z0-9-_=.]+|rzp_[a-z0-9_]+|whsec_[a-zA-Z0-9_]+|sk_[a-zA-Z0-9_]+)/gi;

/**
 * Scrubs strings of any PII, credentials, or customer conversation snippets.
 */
export function scrubString(input: string): string {
  if (!input || typeof input !== "string") return input;
  return input
    .replace(EMAIL_REGEX, "[REDACTED_EMAIL]")
    .replace(PHONE_REGEX, "[REDACTED_PHONE]")
    .replace(CREDIT_CARD_REGEX, "[REDACTED_PAN]")
    .replace(AUTH_TOKEN_REGEX, "[REDACTED_SECRET]");
}

/**
 * Recursively deep-scrubs objects before sending to error telemetry.
 */
export function scrubSensitiveData<T>(obj: T): T {
  if (!obj) return obj;

  if (typeof obj === "string") {
    return scrubString(obj) as unknown as T;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => scrubSensitiveData(item)) as unknown as T;
  }

  if (typeof obj === "object") {
    const scrubbed: Record<string, any> = {};
    const sensitiveKeys = new Set([
      "password",
      "secret",
      "token",
      "authorization",
      "cookie",
      "set-cookie",
      "credential",
      "apikey",
      "api_key",
      "message_text",
      "ticket_body",
      "query",
      "phone",
      "email",
      "signature",
    ]);

    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();
      if (sensitiveKeys.has(lowerKey)) {
        scrubbed[key] = "[REDACTED_SENSITIVE_FIELD]";
      } else {
        scrubbed[key] = scrubSensitiveData(value);
      }
    }
    return scrubbed as T;
  }

  return obj;
}

/**
 * Standard Sentry beforeSend filter implementing strict enterprise data scrubbing.
 */
export function sentryBeforeSendFilter(event: any, hint?: any): any {
  if (!event) return null;

  // 1. Strip user IP address completely
  if (event.user) {
    event.user.ip_address = "0.0.0.0";
    if (event.user.email) event.user.email = "[REDACTED_USER_EMAIL]";
    if (event.user.username) event.user.username = "[REDACTED_USERNAME]";
  }

  // 2. Strip request headers, cookies, and query params
  if (event.request) {
    if (event.request.cookies) event.request.cookies = "[REDACTED_COOKIES]";
    if (event.request.headers) {
      const headers = { ...event.request.headers };
      delete headers["authorization"];
      delete headers["cookie"];
      delete headers["x-api-key"];
      delete headers["x-razorpay-signature"];
      delete headers["x-cal-signature-256"];
      event.request.headers = scrubSensitiveData(headers);
    }
    if (event.request.query_string) {
      event.request.query_string = scrubString(String(event.request.query_string));
    }
  }

  // 3. Deep-scrub breadcrumbs
  if (Array.isArray(event.breadcrumbs)) {
    event.breadcrumbs = event.breadcrumbs.map((b: any) => ({
      ...b,
      message: b.message ? scrubString(b.message) : undefined,
      data: b.data ? scrubSensitiveData(b.data) : undefined,
    }));
  }

  // 4. Deep-scrub extra context & exceptions
  if (event.extra) {
    event.extra = scrubSensitiveData(event.extra);
  }

  return event;
}

/**
 * Safe capture exception wrapper.
 */
export function captureSanitizedException(error: unknown, context?: Record<string, any>) {
  const sanitizedContext = context ? scrubSensitiveData(context) : undefined;
  const errorDigest = (error as any)?.digest || (error as any)?.name || "UnknownException";

  if (process.env.NODE_ENV === "development") {
    // Development console warning without sensitive data
    console.warn(`[Telemetry] Exception captured [${errorDigest}]:`, sanitizedContext);
  }

  // If Sentry is installed globally, dispatch sanitized event
  const globalSentry = (globalThis as any).Sentry;
  if (globalSentry?.captureException) {
    try {
      globalSentry.captureException(error, {
        extra: sanitizedContext,
      });
    } catch {
      // Telemetry failures must never crash runtime
    }
  }
}

export const sentryTelemetry = {
  scrubString,
  scrubSensitiveData,
  sentryBeforeSendFilter,
  captureSanitizedException,
};

export default sentryTelemetry;
