/** Cloudflare Turnstile check. Server only. Optional: off unless a secret key is set. */

export function turnstileConfigured(): "off" | "on" | "misconfigured" {
  const secret = !!process.env.TURNSTILE_SECRET_KEY?.trim();
  const site = !!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim();
  if (secret && site) return "on";
  if (!secret && !site) return "off";
  return "misconfigured";
}

export async function verifyTurnstile(token: string | undefined, ip: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  if (!secret || !token) return false;
  try {
    const body = new URLSearchParams({ secret, response: token });
    if (ip && ip !== "unknown" && ip !== "dev-local") body.set("remoteip", ip);
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body,
      signal: AbortSignal.timeout(5000),
      cache: "no-store",
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}
