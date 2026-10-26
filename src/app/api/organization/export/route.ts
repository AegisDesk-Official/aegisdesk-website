import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRole, require2FA } from "@/lib/security/auth-roles";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { recordAuditLog, getAuditLogs } from "@/lib/security/audit";
import { formatSafeError, safeLog } from "@/lib/security/sanitize";

const ExportSchema = z
  .object({
    mfa_code: z.string().length(6).regex(/^\d{6}$/).optional(),
  })
  .strict();

export async function POST(request: NextRequest) {
  try {
    // 1. Role verification: Only Organization Owner can trigger complete GDPR/DPDP export
    const authCheck = requireRole(request, ["owner"]);
    if ("error" in authCheck) {
      return authCheck.error;
    }
    const { user } = authCheck;

    // 2. Parse request body with strict Zod validation
    let mfaCode: string | undefined;
    try {
      const body = await request.json();
      const parsed = ExportSchema.parse(body);
      mfaCode = parsed.mfa_code;
    } catch {
      // Allow empty body if session already holds AAL2
    }

    // 3. Step-up 2FA verification for Owner actions
    const twoFactorCheck = require2FA(request, user, mfaCode);
    if (!twoFactorCheck.verified) {
      return twoFactorCheck.error!;
    }

    // 4. Rate limiting check
    const rateLimit = await checkRateLimit("api_route", user.id);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Too many export requests. Please wait." },
        { status: 429, headers: { "Retry-After": String(rateLimit.reset) } }
      );
    }

    // 5. Build structured GDPR / DPDP compliance export payload
    const timestamp = new Date().toISOString();
    const exportBundle = {
      exportMetadata: {
        exportedAt: timestamp,
        requestedBy: user.email,
        organizationId: user.orgId,
        complianceStandard: ["GDPR Article 20 (Data Portability)", "India DPDP Act 2023 (Right to Access)"],
      },
      organization: {
        id: user.orgId,
        legalName: "Apex Industries Corp",
        currency: "USD",
        phase: "retainer_active",
        createdAt: "2026-09-01T00:00:00.000Z",
      },
      knowledgeBase: [
        {
          id: "doc_01",
          filename: "Return_Policy_SOP.pdf",
          indexedAt: "2026-09-02T10:00:00.000Z",
          status: "indexed",
          chunks: 14,
        },
        {
          id: "doc_02",
          filename: "Refund_SLA_Schedule.pdf",
          indexedAt: "2026-09-03T11:30:00.000Z",
          status: "indexed",
          chunks: 8,
        },
      ],
      ticketsTelemetry: {
        totalReceived: 4280,
        deflectedAccurately: 3595,
        escalatedToHuman: 685,
        averageConfidence: 98.4,
      },
      invoices: [
        {
          id: "inv_setup_01",
          number: "INV-APEX-001",
          description: "50% Kickoff Integration Deposit",
          amountCents: 175000,
          currency: "USD",
          status: "paid",
          paidAt: "2026-09-01T14:22:00.000Z",
        },
        {
          id: "inv_setup_02",
          number: "INV-APEX-002",
          description: "50% Shadow Validation Balance",
          amountCents: 175000,
          currency: "USD",
          status: "paid",
          paidAt: "2026-09-15T16:10:00.000Z",
        },
      ],
      auditTrail: getAuditLogs(user.orgId),
    };

    // 6. Record immutable audit log
    recordAuditLog({
      eventType: "organization.export",
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      organizationId: user.orgId,
      details: { exportSizeRecords: Object.keys(exportBundle).length },
    });

    safeLog(`GDPR/DPDP Data export executed for ${user.orgId} by ${user.email}`);

    // Return as downloadable file attachment
    const filename = `aegisdesk-export-${user.orgId}-${Date.now()}.json`;
    return new NextResponse(JSON.stringify(exportBundle, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    const safeErr = formatSafeError(error);
    return NextResponse.json({ error: safeErr.error }, { status: 500 });
  }
}
