import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRole, require2FA } from "@/lib/security/auth-roles";
import {
  getWorkbenchSpendTelemetry,
  setWorkbenchKillSwitch,
} from "@/lib/security/workbench-control";
import { recordAuditLog } from "@/lib/security/audit";
import { formatSafeError, safeLog } from "@/lib/security/sanitize";

const ToggleKillSwitchSchema = z
  .object({
    active: z.boolean(),
    reason: z.string().min(3).max(180).optional(),
    mfa_code: z.string().length(6).regex(/^\d{6}$/).optional(),
  })
  .strict();

export async function GET(request: NextRequest) {
  try {
    const telemetry = await getWorkbenchSpendTelemetry();
    return NextResponse.json(telemetry);
  } catch (error) {
    const safeErr = formatSafeError(error);
    return NextResponse.json({ error: safeErr.error }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // 1. Role verification: Only Owner can toggle the emergency workbench kill switch
    const authCheck = requireRole(request, ["owner"]);
    if ("error" in authCheck) {
      return authCheck.error;
    }
    const { user } = authCheck;

    // 2. Validate request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Malformed JSON body" }, { status: 400 });
    }

    const parseResult = ToggleKillSwitchSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Validation failed: 'active' boolean is required." },
        { status: 400 }
      );
    }

    const { active, reason, mfa_code } = parseResult.data;

    // 3. Step-up 2FA verification for Owner actions
    const twoFactorCheck = require2FA(request, user, mfa_code);
    if (!twoFactorCheck.verified) {
      return twoFactorCheck.error!;
    }

    // 4. Update kill switch state
    const result = await setWorkbenchKillSwitch(active, reason || "Operator manual toggle");

    // 5. Record immutable audit log
    recordAuditLog({
      eventType: "role.change", // categorized as operational posture change
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      organizationId: user.orgId,
      details: {
        action: "toggle_workbench_kill_switch",
        killSwitchActive: active,
        reason: result.reason,
      },
    });

    safeLog(`Operator ${user.email} set workbench kill switch to ${active}`);

    const updatedTelemetry = await getWorkbenchSpendTelemetry();
    return NextResponse.json({
      success: true,
      message: active
        ? "Emergency kill switch engaged. Public workbench is immediately halted."
        : "Kill switch disengaged. Public workbench resumed.",
      telemetry: updatedTelemetry,
    });
  } catch (error) {
    const safeErr = formatSafeError(error);
    return NextResponse.json({ error: safeErr.error }, { status: 500 });
  }
}
