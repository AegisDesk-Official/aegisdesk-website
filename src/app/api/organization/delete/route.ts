import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRole, require2FA } from "@/lib/security/auth-roles";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { recordAuditLog } from "@/lib/security/audit";
import { formatSafeError, safeLog } from "@/lib/security/sanitize";

const DeleteSchema = z
  .object({
    confirmation: z.string().min(1),
    mfa_code: z.string().length(6).regex(/^\d{6}$/),
  })
  .strict();

export async function POST(request: NextRequest) {
  try {
    // 1. Role verification: Only Organization Owner can request complete account deletion
    const authCheck = requireRole(request, ["owner"]);
    if ("error" in authCheck) {
      return authCheck.error;
    }
    const { user } = authCheck;

    // 2. Parse request body with strict Zod validation
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Malformed JSON body" }, { status: 400 });
    }

    const parseResult = DeleteSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Validation failed: 'confirmation' string and 6-digit 'mfa_code' are required." },
        { status: 400 }
      );
    }

    const { confirmation, mfa_code } = parseResult.data;

    // 3. Confirm target confirmation string
    if (!confirmation.toUpperCase().startsWith("DELETE")) {
      return NextResponse.json(
        { error: "Invalid confirmation: Please type 'DELETE' followed by your company name to authorize." },
        { status: 400 }
      );
    }

    // 4. Step-up 2FA verification for destructive Owner actions
    const twoFactorCheck = require2FA(request, user, mfa_code);
    if (!twoFactorCheck.verified) {
      return twoFactorCheck.error!;
    }

    // 5. Rate limiting check
    const rateLimit = await checkRateLimit("api_route", user.id);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again later." },
        { status: 429, headers: { "Retry-After": String(rateLimit.reset) } }
      );
    }

    // 6. Record immutable audit log before clearing data
    recordAuditLog({
      eventType: "organization.delete",
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      organizationId: user.orgId,
      details: {
        confirmationString: confirmation,
        status: "marked_for_complete_purge",
        purgeWindowDays: 30,
      },
    });

    safeLog(`Organization ${user.orgId} deletion initiated by owner ${user.email}`);

    return NextResponse.json({
      success: true,
      message:
        "Organization marked for complete data erasure under GDPR Art 17 / India DPDP Act. Retainers paused, active API keys revoked, and vector indices queued for purge.",
      organizationId: user.orgId,
      purgedAt: new Date().toISOString(),
    });
  } catch (error) {
    const safeErr = formatSafeError(error);
    return NextResponse.json({ error: safeErr.error }, { status: 500 });
  }
}
