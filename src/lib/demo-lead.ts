/**
 * Sends a demo lead to LEAD_WEBHOOK_URL (Make.com, Zapier, Slack...).
 * Never throws: if the webhook fails, the demo keeps working and the error
 * is logged. Sends once per email per 30 days so one visitor asking five
 * questions does not use five webhook runs.
 */
import { FREE_EMAIL_DOMAINS } from "./validation/demo-types";
import { LEAD_TTL_SECONDS, leadKey, type LimitStore } from "./security/demo-limits";

export interface LeadInput {
  email: string;
  phone: string;
  company: string;
  ip: string;
  firstQuestion: string;
}

export async function sendDemoLead(store: LimitStore, lead: LeadInput): Promise<void> {
  const url = process.env.LEAD_WEBHOOK_URL?.trim();
  if (!url) {
    console.warn("[demo] LEAD_WEBHOOK_URL is not set: this lead was not delivered anywhere.");
    return;
  }
  try {
    const key = leadKey(lead.email);
    if (await store.has(key)) return;

    const domain = lead.email.split("@")[1] ?? "";
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        source: "aegisdesk-demo",
        time: new Date().toISOString(),
        email: lead.email,
        phone: lead.phone,
        company: lead.company,
        ip: lead.ip,
        freeEmailProvider: FREE_EMAIL_DOMAINS.has(domain),
        firstQuestion: lead.firstQuestion,
      }),
      signal: AbortSignal.timeout(5000),
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`webhook returned ${res.status}`);
    await store.mark(key, LEAD_TTL_SECONDS);
  } catch (err) {
    console.error("[demo] lead webhook failed:", err instanceof Error ? err.message : "unknown error");
  }
}
