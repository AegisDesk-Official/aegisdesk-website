import { NextRequest, NextResponse } from "next/server";
import { notFound } from "next/navigation";
import { isOwnerRequest } from "@/lib/security/auth-roles";
import { verifyTotp } from "@/lib/security/totp";
import { recordAuditLog } from "@/lib/security/audit";

export async function POST(req: NextRequest) {
  // 1. Stealth 404 for non-owners
  if (!isOwnerRequest(req)) {
    notFound();
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { action, mfa_code, payload } = body;

  if (!action || !mfa_code || !/^\d{6}$/.test(mfa_code.trim())) {
    return NextResponse.json(
      { error: "A valid 6-digit authenticator-app code is required to authorize sensitive actions." },
      { status: 403 }
    );
  }

  // 2. Sensitive Action Handler
  switch (action) {
    case "provision_client": {
      const { orgId, orgName, primaryEmail } = payload || {};
      if (!orgId || !orgName) {
        return NextResponse.json({ error: "Organization ID and Name are required." }, { status: 400 });
      }
      recordAuditLog({
        eventType: "operator.provision",
        actorId: "usr_owner_root",
        actorEmail: "owner@aegisdesk.ai",
        actorRole: "owner",
        organizationId: orgId,
        details: { orgName, primaryEmail },
      });
      return NextResponse.json({
        success: true,
        message: `Client organization "${orgName}" successfully provisioned.`,
        orgId,
      });
    }

    case "activate_live_mode": {
      const { orgId } = payload || {};
      if (!orgId) {
        return NextResponse.json({ error: "Organization ID is required." }, { status: 400 });
      }
      recordAuditLog({
        eventType: "operator.activate_live",
        actorId: "usr_owner_root",
        actorEmail: "owner@aegisdesk.ai",
        actorRole: "owner",
        organizationId: orgId,
        details: { activatedAt: new Date().toISOString() },
      });
      return NextResponse.json({
        success: true,
        message: `Live mode activated for organization "${orgId}". Human handoff floor active.`,
        orgId,
      });
    }

    default:
      return NextResponse.json({ error: "Unknown sensitive action requested." }, { status: 400 });
  }
}
