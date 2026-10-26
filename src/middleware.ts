import { NextResponse, type NextRequest } from "next/server";
import { buildContentSecurityPolicy, BASELINE_SECURITY_HEADERS } from "@/lib/security/csp";
import { validateCsrf } from "@/lib/security/csrf";
import {
  SESSION_MAX_AGE_SECONDS,
  SESSION_IDLE_TIMEOUT_SECONDS,
} from "@/lib/security/auth-roles";

/**
 * Global Edge Security Middleware.
 * 1. Enforces CSRF origin checks on state-changing mutations.
 * 2. Injects strict CSP nonces and baseline security headers.
 * 3. Stealth 404 masking for /operator and /api/operator/* (returns exact 404 page & headers for non-owners).
 * 4. Guards /dashboard (redirects logged-out visitors to /login).
 * 5. Enforces 8-hour maximum session and 30-minute idle timeouts.
 */
export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isProduction = process.env.NODE_ENV === "production";

  // 1. Enforce CSRF Origin verification on state-changing requests (POST, PUT, DELETE, PATCH)
  const csrfCheck = validateCsrf(request);
  if (!csrfCheck.valid) {
    return NextResponse.json(
      { error: csrfCheck.error || "Forbidden: CSRF check failed" },
      { status: 403 }
    );
  }

  // 2. Generate per-request cryptographic nonce for strict CSP
  const rawId =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : "aegis_nonce_" + Math.random().toString(36).substring(2);
  const nonce = btoa(rawId);
  const csp = buildContentSecurityPolicy({ nonce, isProduction });

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);
  requestHeaders.set("content-security-policy", csp);

  const applySecurityHeaders = (res: NextResponse) => {
    res.headers.set("Content-Security-Policy", csp);
    res.headers.set("x-nonce", nonce);
    for (const [key, value] of Object.entries(BASELINE_SECURITY_HEADERS)) {
      res.headers.set(key, value);
    }
    return res;
  };

  // Helper to check active session validity
  const sessionToken = request.cookies.get("aegis_session_token")?.value;
  const userRole = request.cookies.get("aegis_user_role")?.value;
  const aal = request.cookies.get("aegis_aal")?.value;
  const sessionCreatedAt = Number(request.cookies.get("aegis_session_created_at")?.value || 0);
  const lastActiveAt = Number(request.cookies.get("aegis_last_active_at")?.value || 0);
  const now = Date.now();

  const isSessionValid =
    Boolean(sessionToken) &&
    sessionCreatedAt > 0 &&
    now - sessionCreatedAt <= SESSION_MAX_AGE_SECONDS * 1000 &&
    (lastActiveAt === 0 || now - lastActiveAt <= SESSION_IDLE_TIMEOUT_SECONDS * 1000);

  const isOwner = isSessionValid && userRole === "owner" && aal === "aal2";

  // 3. STEALTH 404 FOR /operator AND /api/operator/*
  // For logged-out visitor, client, or any other user: return EXACT same 404 page & headers as unknown URL.
  // Not 401, not 403, not a redirect.
  const isOperatorRoute = pathname.startsWith("/operator") || pathname.startsWith("/api/operator");
  if (isOperatorRoute) {
    if (!isOwner) {
      // Rewrite to /not-found with 404 status code, matching unknown URL behavior exactly
      const notFoundUrl = new URL("/not-found", request.url);
      const notFoundResponse = NextResponse.rewrite(notFoundUrl, {
        status: 404,
        headers: requestHeaders,
      });
      return applySecurityHeaders(notFoundResponse);
    }
  }

  // 4. GUARD /dashboard ROUTES
  // Logged-out visitor redirected to /login
  if (pathname.startsWith("/dashboard")) {
    if (!isSessionValid) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  let response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Slide idle timeout window on active authenticated requests
  if (isSessionValid) {
    response.cookies.set("aegis_last_active_at", String(now), {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS,
    });
  }

  return applySecurityHeaders(response);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|brand/|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
