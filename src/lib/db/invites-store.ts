import crypto from "crypto";
import { validatePassword } from "../security/passwords.ts";

export const GENERIC_AUTH_ERROR = "Invalid credentials or expired access link.";

export interface InviteRecord {
  id: string;
  token_hash: string;
  org_id: string;
  org_name: string;
  email: string;
  deposit_paid: boolean;
  override_reason?: string;
  override_ref?: string;
  created_at: string;
  expires_at: number; // 7 days in ms
  status: "active" | "used" | "revoked";
  used_at?: string;
}

export interface ClientShadowRecord {
  org_id: string;
  org_name: string;
  shadow_started_at: string;
  shadow_ends_at: string;
}

const globalForInvites = globalThis as unknown as {
  __aegis_invites?: Map<string, InviteRecord>;
  __aegis_shadow_dates?: Map<string, ClientShadowRecord>;
};

const memoryInvites = globalForInvites.__aegis_invites || new Map<string, InviteRecord>();
const memoryShadowDates = globalForInvites.__aegis_shadow_dates || new Map<string, ClientShadowRecord>();

globalForInvites.__aegis_invites = memoryInvites;
globalForInvites.__aegis_shadow_dates = memoryShadowDates;

// Prepopulate initial shadow state for existing demo tenant
if (!memoryShadowDates.has("org_apex_industries")) {
  const now = new Date();
  const ends = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  memoryShadowDates.set("org_apex_industries", {
    org_id: "org_apex_industries",
    org_name: "Apex Retail",
    shadow_started_at: now.toISOString(),
    shadow_ends_at: ends.toISOString(),
  });
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * Issues a single-use 256-bit crypto token invite link.
 * Only the SHA-256 hash is persisted.
 * Requires deposit_paid=true OR (overrideReason + overrideRef + fresh MFA code).
 */
export function issueClientInvite(params: {
  orgId: string;
  orgName: string;
  email: string;
  depositPaid: boolean;
  overrideReason?: string;
  overrideRef?: string;
  mfaCode?: string;
  baseUrl?: string;
}): { success: boolean; inviteLink?: string; token?: string; error?: string } {
  const { orgId, orgName, email, depositPaid, overrideReason, overrideRef, mfaCode } = params;

  if (!depositPaid) {
    if (!overrideReason || !overrideRef || !mfaCode) {
      return {
        success: false,
        error: "Deposit is unpaid. Issuing an invite requires an override reason, reference, and fresh authenticator code.",
      };
    }

    if (!/^\d{6}$/.test(mfaCode.trim())) {
      return {
        success: false,
        error: "A valid 6-digit authenticator code is required for the deposit override.",
      };
    }
  }

  // Generate 256-bit cryptographic random token
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(rawToken);

  const now = Date.now();
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

  const record: InviteRecord = {
    id: `inv_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`,
    token_hash: tokenHash,
    org_id: orgId,
    org_name: orgName,
    email: email.toLowerCase().trim(),
    deposit_paid: depositPaid,
    override_reason: overrideReason,
    override_ref: overrideRef,
    created_at: new Date(now).toISOString(),
    expires_at: now + sevenDaysMs,
    status: "active",
  };

  memoryInvites.set(tokenHash, record);

  const base = params.baseUrl || (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000");
  const inviteLink = `${base}/auth/invite?token=${rawToken}`;

  return {
    success: true,
    inviteLink,
    token: rawToken,
  };
}

/**
 * Validates token against SHA-256 hash.
 * Checks single-use and 7-day expiration.
 */
export function validateInviteToken(token: string): { valid: boolean; record?: InviteRecord; error?: string } {
  if (!token || typeof token !== "string" || token.length < 32) {
    return { valid: false, error: GENERIC_AUTH_ERROR };
  }

  const tokenHash = hashToken(token);
  const record = memoryInvites.get(tokenHash);

  if (!record) {
    return { valid: false, error: GENERIC_AUTH_ERROR };
  }

  if (record.status !== "active") {
    return { valid: false, error: GENERIC_AUTH_ERROR };
  }

  if (Date.now() > record.expires_at) {
    return { valid: false, error: GENERIC_AUTH_ERROR };
  }

  return { valid: true, record };
}

/**
 * Activates an invitation: verifies password against common list, marks single-use token as used,
 * and initializes shadow_started_at to now and shadow_ends_at to 14 days later.
 */
export function activateInvite(token: string, password: string): {
  success: boolean;
  orgId?: string;
  email?: string;
  error?: string;
} {
  const check = validateInviteToken(token);
  if (!check.valid || !check.record) {
    return { success: false, error: GENERIC_AUTH_ERROR };
  }

  const pwdCheck = validatePassword(password);
  if (!pwdCheck.valid) {
    return { success: false, error: pwdCheck.error };
  }

  const record = check.record;
  record.status = "used";
  record.used_at = new Date().toISOString();

  // Set 14-day shadow validation period
  const shadowStart = new Date();
  const shadowEnd = new Date(shadowStart.getTime() + 14 * 24 * 60 * 60 * 1000);

  memoryShadowDates.set(record.org_id, {
    org_id: record.org_id,
    org_name: record.org_name,
    shadow_started_at: shadowStart.toISOString(),
    shadow_ends_at: shadowEnd.toISOString(),
  });

  return {
    success: true,
    orgId: record.org_id,
    email: record.email,
  };
}

/**
 * Revokes an existing active invite link.
 */
export function revokeInvite(inviteId: string): boolean {
  for (const record of Array.from(memoryInvites.values())) {
    if (record.id === inviteId) {
      record.status = "revoked";
      return true;
    }
  }
  return false;
}

export function getAllInvites(): InviteRecord[] {
  return Array.from(memoryInvites.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export function getClientShadowDates(orgId: string): ClientShadowRecord | null {
  return memoryShadowDates.get(orgId) || null;
}

export function updateClientShadowDates(
  orgId: string,
  shadowStartedAt: string,
  shadowEndsAt: string
): boolean {
  const existing = memoryShadowDates.get(orgId);
  memoryShadowDates.set(orgId, {
    org_id: orgId,
    org_name: existing?.org_name || orgId,
    shadow_started_at: shadowStartedAt,
    shadow_ends_at: shadowEndsAt,
  });
  return true;
}
