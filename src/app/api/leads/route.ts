import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAllLeads, getAllBookings } from "@/lib/calendar/cal-store";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { getClientIp } from "@/lib/demo-request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const leadSubmissionSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Valid email is required").max(254),
  company: z.string().max(120).optional().default(""),
  tickets_per_month: z.string().max(100).optional().default(""),
  helpdesk: z.string().max(100).optional().default(""),
  // Invisible bot honeypot: real users never fill this
  hp_website: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const leads = getAllLeads();
    const bookings = getAllBookings();

    return NextResponse.json({
      status: "success",
      leads,
      bookings_count: bookings.length,
      total_leads: leads.length,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load leads";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const clientIp = getClientIp(req.headers);
    const rateLimit = await checkRateLimit("api_route", clientIp);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Too many requests. Please wait." },
        { status: 429, headers: { "Retry-After": String(rateLimit.reset) } }
      );
    }

    const raw = await req.json().catch(() => null);
    if (!raw || typeof raw !== "object") {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }

    const parsed = leadSubmissionSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid submission data", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { name, email, company, tickets_per_month, helpdesk, hp_website } = parsed.data;

    // 1. Bot Honeypot Defense: Silently drop bot submission without recording
    if (hp_website && hp_website.trim().length > 0) {
      return NextResponse.json(
        { status: "success", dropped: true, code: "bot_detected" },
        { status: 200 }
      );
    }

    // 2. Legitimate Lead Registration
    const globalForCal = globalThis as unknown as {
      __aegis_leads?: Map<string, any>;
    };
    const leadsMap = globalForCal.__aegis_leads || new Map();
    const leadId = `lead_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const nowIso = new Date().toISOString();

    const newLead = {
      id: leadId,
      name,
      email: email.toLowerCase().trim(),
      company: company || "Undisclosed",
      helpdesk_used: helpdesk || "Zendesk",
      tickets_per_month: tickets_per_month || "1,000 - 5,000",
      stage: "contacted",
      source: "web_lead_form",
      created_at: nowIso,
      updated_at: nowIso,
    };

    leadsMap.set(newLead.email, newLead);
    globalForCal.__aegis_leads = leadsMap;

    return NextResponse.json(
      { status: "success", lead: { id: newLead.id, email: newLead.email, stage: newLead.stage } },
      { status: 200 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to record lead";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

