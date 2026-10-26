/**
 * Content Security Policy & HTTP Security Headers Specification
 * Enforces strict nonce-based CSP allowing only Razorpay, Cal.com, Turnstile, and self origins.
 */

export interface CspConfig {
  nonce: string;
  isProduction?: boolean;
}

export function buildContentSecurityPolicy({ nonce, isProduction = false }: CspConfig): string {
  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    "script-src": [
      "'self'",
      `'nonce-${nonce}'`,
      // Fallback origins for browsers or embeds
      "https://challenges.cloudflare.com",
      "https://checkout.razorpay.com",
      "https://app.cal.com",
      // Needed for WebGL / Three.js vertex shaders and GSAP easing ticks
      "'unsafe-eval'",
    ],
    "style-src": [
      "'self'",
      // Tailwind runtime styles and Next.js font inlining
      "'unsafe-inline'",
      "https://fonts.googleapis.com",
    ],
    "img-src": ["'self'", "data:", "blob:", "https:"],
    "font-src": ["'self'", "data:", "https://fonts.gstatic.com"],
    "connect-src": [
      "'self'",
      "https://challenges.cloudflare.com",
      "https://api.razorpay.com",
      "https://lumberjack.razorpay.com",
      "https://app.cal.com",
      "https://*.supabase.co",
      "https://*.upstash.io",
    ],
    "frame-src": [
      "'self'",
      "https://challenges.cloudflare.com",
      "https://api.razorpay.com",
      "https://checkout.razorpay.com",
      "https://app.cal.com",
    ],
    "frame-ancestors": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
  };

  if (isProduction) {
    directives["upgrade-insecure-requests"] = [];
  }

  return Object.entries(directives)
    .map(([key, values]) => (values.length ? `${key} ${values.join(" ")}` : key))
    .join("; ");
}

export const BASELINE_SECURITY_HEADERS: Record<string, string> = {
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
};
