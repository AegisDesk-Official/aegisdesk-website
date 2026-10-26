import { NextRequest, NextResponse } from "next/server";
import { notFound } from "next/navigation";
import { isOwnerRequest } from "@/lib/security/auth-roles";
import {
  issueClientInvite,
  getAllInvites,
  revokeInvite,
  getClientShadowDates,
  updateClientShadowDates,
} from "@/lib/db/invites-store";

// Ensure stealth 404 for non-owners
function enforceOwner(req: NextRequest) {
  if (!isOwnerRequest(req)) {
    notFound();
  }
}

export async function GET(req: NextRequest) {
  enforceOwner(req);
  const orgId = req.nextUrl.searchParams.get("org_id");

  if (orgId) {
    const shadowDates = getClientShadowDates(orgId);
    return NextResponse.json({ shadowDates });
  }

  const invites = getAllInvites();
  return NextResponse.json({ invites });
}

export async function POST(req: NextRequest) {
  enforceOwner(req);

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const action = body.action || "create";

  if (action === "update_shadow_dates") {
    const { orgId, shadowStartedAt, shadowEndsAt } = body;
    if (!orgId || !shadowStartedAt || !shadowEndsAt) {
      return NextResponse.json({ error: "Missing required shadow date parameters" }, { status: 400 });
    }
    updateClientShadowDates(orgId, shadowStartedAt, shadowEndsAt);
    return NextResponse.json({ success: true });
  }

  if (action === "revoke") {
    const { inviteId } = body;
    if (!inviteId) {
      return NextResponse.json({ error: "Missing inviteId" }, { status: 400 });
    }
    const revoked = revokeInvite(inviteId);
    return NextResponse.json({ success: revoked });
  }

  // Issue invite
  const { orgId, orgName, email, depositPaid, overrideReason, overrideRef, mfaCode } = body;

  if (!orgId || !orgName || !email) {
    return NextResponse.json({ error: "Organization and email are required." }, { status: 400 });
  }

  const result = issueClientInvite({
    orgId,
    orgName,
    email,
    depositPaid: Boolean(depositPaid),
    overrideReason,
    overrideRef,
    mfaCode,
    baseUrl: process.env.NEXT_PUBLIC_SITE_URL || req.nextUrl.origin,
  });

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    success: true,
    inviteLink: result.inviteLink,
    token: result.token,
  });
}
