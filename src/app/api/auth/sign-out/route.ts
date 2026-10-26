import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/security/auth-roles";
import { recordAuditLog } from "@/lib/security/audit";
import { safeLog } from "@/lib/security/sanitize";

export async function POST(request: NextRequest) {
  const user = getAuthenticatedUser(request);

  if (user) {
    recordAuditLog({
      eventType: "auth.logout",
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      organizationId: user.orgId,
      details: { scope: "sign_out_everywhere" },
    });
    safeLog(`User signed out: ${user.email}`);
  }

  const response = NextResponse.json({
    success: true,
    message: "Session terminated. All active authentication tokens revoked.",
  });

  const cookiesToClear = [
    "aegis_session_token",
    "aegis_user_role",
    "aegis_org_id",
    "aegis_aal",
    "aegis_session_created_at",
    "aegis_last_active_at",
    "aegis_pending_mfa",
    "aegis_pending_owner_email",
    "aegis_preview_auth",
    "sb-access-token",
    "sb-refresh-token",
  ];

  cookiesToClear.forEach((name) => {
    response.cookies.set(name, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
      expires: new Date(0),
    });
  });

  return response;
}
