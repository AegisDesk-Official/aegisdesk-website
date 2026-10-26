import { NextRequest, NextResponse } from "next/server";

/**
 * CSRF Protection for state-changing requests (POST, PUT, DELETE, PATCH).
 * Webhook endpoints with HMAC signatures are exempt from browser origin checks.
 */

const MUTATION_METHODS = new Set(["POST", "PUT", "DELETE", "PATCH"]);

const EXEMPT_PATHS = [
  "/api/webhooks/razorpay",
  "/api/webhooks/cal",
  "/api/events", // Authenticated via per-org HMAC signature + timestamp skew
];

export function validateCsrf(request: NextRequest): { valid: boolean; error?: string } {
  if (!MUTATION_METHODS.has(request.method.toUpperCase())) {
    return { valid: true };
  }

  const pathname = request.nextUrl.pathname;

  // Exempt external webhooks that carry their own cryptographic HMAC signatures
  if (EXEMPT_PATHS.some((path) => pathname.startsWith(path))) {
    return { valid: true };
  }

  // 1. Verify Origin or Referer header matches host
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const host = request.headers.get("host");

  if (origin) {
    try {
      const originUrl = new URL(origin);
      if (host && originUrl.host !== host) {
        return { valid: false, error: "CSRF: Origin host mismatch" };
      }
      return { valid: true };
    } catch {
      return { valid: false, error: "CSRF: Malformed origin header" };
    }
  }

  if (referer) {
    try {
      const refererUrl = new URL(referer);
      if (host && refererUrl.host !== host) {
        return { valid: false, error: "CSRF: Referer host mismatch" };
      }
      return { valid: true };
    } catch {
      return { valid: false, error: "CSRF: Malformed referer header" };
    }
  }

  // 2. Fallback check: Custom header check for programmatic API calls (prevents cross-origin form POSTs)
  const requestedWith = request.headers.get("x-requested-with");
  const contentType = request.headers.get("content-type") || "";

  if (requestedWith === "XMLHttpRequest" || contentType.includes("application/json")) {
    return { valid: true };
  }

  // In test / dev environments without origin header (e.g. node curl/testing)
  if (process.env.NODE_ENV !== "production") {
    return { valid: true };
  }

  return { valid: false, error: "CSRF: Missing Origin/Referer header on state-changing request" };
}
