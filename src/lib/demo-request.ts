/** Small helpers for reading the incoming demo request. Server only. */

/**
 * The visitor's IP, from the headers Vercel sets itself. A client-supplied
 * x-forwarded-for is deliberately ignored, so it cannot be used to get
 * extra questions.
 */
export function getClientIp(headers: Headers): string {
  const raw = headers.get("x-vercel-forwarded-for") || headers.get("x-real-ip") || "";
  const ip = raw.split(",")[0]?.trim();
  if (ip) return ip.slice(0, 64);
  return process.env.NODE_ENV === "production" ? "unknown" : "dev-local";
}

/**
 * Blocks other websites from calling the demo from a visitor's browser.
 * Requests with no Origin header (curl, server tools) are let through: the
 * real protection is the server-side limits, not this check.
 */
export function isSameOrigin(headers: Headers): boolean {
  const origin = headers.get("origin");
  if (!origin) return true;
  try {
    const host = headers.get("x-forwarded-host") || headers.get("host");
    return !!host && new URL(origin).host === host;
  } catch {
    return false;
  }
}
