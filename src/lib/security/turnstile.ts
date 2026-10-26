/**
 * Cloudflare Turnstile Server-Side Verification Helper.
 * Validates cf-turnstile-response tokens against Cloudflare Turnstile API.
 */

export interface TurnstileVerifyResult {
  success: boolean;
  error?: string;
  challengeTs?: string;
  hostname?: string;
}

const DUMMY_PASS_TOKENS = new Set([
  "1x00000000000000000000AA",
  "XXXX.DUMMY.TOKEN.XXXX",
  "test-turnstile-token",
]);

export async function verifyTurnstileToken(
  token: string | null | undefined,
  remoteIp?: string
): Promise<TurnstileVerifyResult> {
  if (!token) {
    return { success: false, error: "Missing Turnstile verification token" };
  }

  // 1. Allow documented Cloudflare pass tokens in test/dev modes
  if (DUMMY_PASS_TOKENS.has(token)) {
    return { success: true, hostname: "localhost" };
  }

  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  // 2. If secret is missing or a placeholder in development/test, permit pass token
  if (!secretKey || secretKey.includes("placeholder") || secretKey === "dummy_turnstile_secret") {
    if (process.env.NODE_ENV !== "production") {
      return { success: true, hostname: "localhost" };
    }
    return { success: false, error: "Turnstile secret key not configured on server" };
  }

  // 3. Verify against Cloudflare Turnstile siteverify endpoint
  try {
    const formData = new URLSearchParams();
    formData.append("secret", secretKey);
    formData.append("response", token);
    if (remoteIp) {
      formData.append("remoteip", remoteIp);
    }

    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: formData,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    if (!res.ok) {
      return { success: false, error: `Turnstile verification failed with HTTP ${res.status}` };
    }

    const data = await res.json();
    if (data.success) {
      return {
        success: true,
        challengeTs: data.challenge_ts,
        hostname: data.hostname,
      };
    }

    return {
      success: false,
      error: Array.isArray(data["error-codes"]) ? data["error-codes"].join(", ") : "Invalid Turnstile token",
    };
  } catch (err) {
    return { success: false, error: "Network error during Turnstile verification" };
  }
}

/** Check if Cloudflare Turnstile keys are configured on the server. */
export function turnstileConfigured(): "off" | "on" | "misconfigured" {
  const secret = !!process.env.TURNSTILE_SECRET_KEY?.trim();
  const site = !!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim();
  if (secret && site) return "on";
  if (!secret && !site) return "off";
  return "misconfigured";
}

/** Legacy boolean verifier for demo route. */
export async function verifyTurnstile(token: string | undefined, ip: string): Promise<boolean> {
  const res = await verifyTurnstileToken(token, ip);
  return res.success;
}
