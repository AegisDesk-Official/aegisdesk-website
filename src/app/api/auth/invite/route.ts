import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import {
  validateInviteToken,
  activateInvite,
} from "@/lib/db/invites-store";
import { COOKIE_OPTIONS, GENERIC_AUTH_ERROR } from "@/lib/security/auth-roles";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token") || "";
  const validation = validateInviteToken(token);

  if (!validation.valid || !validation.record) {
    return NextResponse.json(
      { valid: false, error: GENERIC_AUTH_ERROR },
      { status: 400 }
    );
  }

  return NextResponse.json({
    valid: true,
    orgName: validation.record.org_name,
    email: validation.record.email,
  });
}

export async function POST(request: NextRequest) {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: GENERIC_AUTH_ERROR }, { status: 400 });
  }

  const token = typeof body.token === "string" ? body.token.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!token || !password) {
    return NextResponse.json({ error: GENERIC_AUTH_ERROR }, { status: 400 });
  }

  const result = activateInvite(token, password);

  if (!result.success || !result.orgId) {
    return NextResponse.json(
      { error: result.error || GENERIC_AUTH_ERROR },
      { status: 400 }
    );
  }

  const sessionToken = crypto.randomBytes(32).toString("hex");
  const now = Date.now();

  const response = NextResponse.json({
    success: true,
    redirect: "/dashboard",
  });

  response.cookies.set("aegis_session_token", sessionToken, COOKIE_OPTIONS);
  response.cookies.set("aegis_user_role", "admin", COOKIE_OPTIONS);
  response.cookies.set("aegis_org_id", result.orgId, COOKIE_OPTIONS);
  response.cookies.set("aegis_aal", "aal1", COOKIE_OPTIONS);
  response.cookies.set("aegis_session_created_at", String(now), COOKIE_OPTIONS);
  response.cookies.set("aegis_last_active_at", String(now), COOKIE_OPTIONS);

  return response;
}
