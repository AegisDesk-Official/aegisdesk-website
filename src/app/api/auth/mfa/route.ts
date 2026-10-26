import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import {
  initFirstTimeOwnerSetup,
  confirmOwnerMfaEnrollment,
  verifyOwnerMfaOrRecovery,
  getOwnerMfaState,
} from "@/lib/security/totp";
import { COOKIE_OPTIONS, SESSION_MAX_AGE_SECONDS } from "@/lib/security/auth-roles";

export async function GET(request: NextRequest) {
  const pendingMfa = request.cookies.get("aegis_pending_mfa")?.value;
  if (!pendingMfa) {
    return NextResponse.json({ error: "No pending MFA verification" }, { status: 403 });
  }

  const mfaState = getOwnerMfaState();
  if (!mfaState.enrolled) {
    const setupData = initFirstTimeOwnerSetup();
    return NextResponse.json({
      isFirstTimeSetup: true,
      secret: setupData.secret,
      recoveryCodes: setupData.recoveryCodes,
    });
  }

  return NextResponse.json({
    isFirstTimeSetup: false,
  });
}

export async function POST(request: NextRequest) {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
  }

  const code = typeof body.code === "string" ? body.code.trim() : "";
  if (!code) {
    return NextResponse.json({ error: "Authenticator code or recovery code is required." }, { status: 400 });
  }

  const mfaState = getOwnerMfaState();
  let verified = false;

  if (!mfaState.enrolled) {
    verified = confirmOwnerMfaEnrollment(code);
  } else {
    verified = verifyOwnerMfaOrRecovery(code);
  }

  if (!verified) {
    return NextResponse.json(
      { error: "Invalid authenticator code or recovery key. Please check your app." },
      { status: 401 }
    );
  }

  // Issue verified Owner AAL2 session cookies
  const sessionToken = crypto.randomBytes(32).toString("hex");
  const now = Date.now();

  const response = NextResponse.json({
    success: true,
    redirect: "/operator",
  });

  response.cookies.set("aegis_session_token", sessionToken, COOKIE_OPTIONS);
  response.cookies.set("aegis_user_role", "owner", COOKIE_OPTIONS);
  response.cookies.set("aegis_org_id", "system_portfolio", COOKIE_OPTIONS);
  response.cookies.set("aegis_aal", "aal2", COOKIE_OPTIONS);
  response.cookies.set("aegis_session_created_at", String(now), COOKIE_OPTIONS);
  response.cookies.set("aegis_last_active_at", String(now), COOKIE_OPTIONS);

  // Clear pending flags
  response.cookies.delete("aegis_pending_mfa");
  response.cookies.delete("aegis_pending_owner_email");

  return response;
}
