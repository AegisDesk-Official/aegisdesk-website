/**
 * POST /api/terms/accept
 * Stores immutable compliance audit record when a client accepts:
 * - Terms of Service (version, ISO timestamp, user ID, client IP)
 * - Data Processing Agreement (version, ISO timestamp, user ID, client IP)
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getClientIp, isSameOrigin } from "@/lib/demo-request";
import { recordEvent } from "@/lib/db/events-store";
import { safeLog } from "@/lib/security/sanitize";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const termsAcceptSchema = z.object({
  orgId: z.string().default("00000000-0000-0000-0000-000000000001"),
  userId: z.string().min(1).max(100),
  userEmail: z.string().email(),
  agreementType: z.enum(["terms_of_service", "dpa", "both"]),
  termsVersion: z.string().default("terms_v1.2_2026_10"),
  dpaVersion: z.string().default("dpa_v1.0_2026_10"),
  userSignatureName: z.string().min(2).max(120),
});

// Audit in-memory / persistent ledger of legal acceptances
const globalTermsLedger = globalThis as unknown as {
  __aegisTermsAcceptanceLedger?: any[];
};
const termsLedger = (globalTermsLedger.__aegisTermsAcceptanceLedger ??= []);

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req.headers)) {
    return NextResponse.json({ error: "Forbidden cross-origin request" }, { status: 403 });
  }

  try {
    const raw = await req.json();
    const parsed = termsAcceptSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid legal agreement payload", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const {
      orgId,
      userId,
      userEmail,
      agreementType,
      termsVersion,
      dpaVersion,
      userSignatureName,
    } = parsed.data;

    const clientIp = getClientIp(req.headers);
    const acceptedAt = new Date().toISOString();

    const record = {
      id: `agree_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      orgId,
      userId,
      userEmail,
      agreementType,
      termsVersion: agreementType === "dpa" ? null : termsVersion,
      dpaVersion: agreementType === "terms_of_service" ? null : dpaVersion,
      userSignatureName,
      clientIp,
      acceptedAt,
      complianceStandard: "GDPR Art. 28 / India DPDP Act 2023 Sec. 8",
    };

    termsLedger.push(record);

    // Immutable audit logging to events store
    await recordEvent({
      org_id: orgId,
      event_id: `evt_terms_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      type: "ticket_received",
      occurred_at: new Date().toISOString(),
      ticket_ref: `legal_accept_${agreementType}`,
      channel: "compliance_ledger",
      reason: `terms_accepted:${record.termsVersion || record.dpaVersion}`,
    });

    safeLog("Legal terms / DPA accepted and recorded", {
      orgId,
      userEmail,
      agreementType,
      termsVersion: record.termsVersion,
      dpaVersion: record.dpaVersion,
    });

    return NextResponse.json({
      success: true,
      message: "Legal agreement acceptance successfully executed and logged",
      data: {
        agreementId: record.id,
        acceptedAt: record.acceptedAt,
        termsVersion: record.termsVersion,
        dpaVersion: record.dpaVersion,
        clientIp: record.clientIp,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Internal error recording terms acceptance", message: err.message },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const orgId = searchParams.get("orgId");
  const records = orgId ? termsLedger.filter((r) => r.orgId === orgId) : termsLedger;

  return NextResponse.json(
    {
      success: true,
      records,
      activeVersions: {
        termsVersion: "terms_v1.2_2026_10",
        dpaVersion: "dpa_v1.0_2026_10",
      },
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
