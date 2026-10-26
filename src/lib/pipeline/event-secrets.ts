/**
 * Per-organization secrets for the inbound Events API (engine -> POST /api/events).
 *
 * - Created and rotated by the platform owner only (see /api/operator/ai-engine).
 * - The plaintext secret is returned exactly once, at creation/rotation time.
 * - At rest it is encrypted with AES-256-GCM using a key derived from ENCRYPTION_KEY.
 *   (HMAC verification needs the original secret, so a one-way hash is not possible.)
 * - Rotation replaces the secret immediately; the previous one stops working.
 */
import crypto from "node:crypto";

export interface EventSecretMeta {
  orgId: string;
  hint: string; // last 4 characters only
  createdAt: string;
  rotatedAt: string | null;
}

interface StoredSecret extends EventSecretMeta {
  ciphertext: string;
}

const g = globalThis as unknown as { __aegis_event_secrets?: Map<string, StoredSecret> };
const store: Map<string, StoredSecret> = g.__aegis_event_secrets || new Map();
g.__aegis_event_secrets = store;

const ORG_ID_PATTERN = /^[A-Za-z0-9_\-:.]{1,128}$/;

export class EventSecretConfigError extends Error {}

function getKey(): Buffer {
  const raw = (process.env.ENCRYPTION_KEY || "").trim();
  if (raw.length < 32 || raw.startsWith("placeholder")) {
    throw new EventSecretConfigError("ENCRYPTION_KEY is not set (needs at least 32 characters).");
  }
  return crypto.createHash("sha256").update(raw, "utf8").digest();
}

export function isEncryptionConfigured(): boolean {
  try {
    getKey();
    return true;
  } catch {
    return false;
  }
}

function encrypt(plaintext: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getKey(), iv);
  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1:${iv.toString("base64")}:${tag.toString("base64")}:${ct.toString("base64")}`;
}

function decrypt(payload: string): string | null {
  try {
    const [v, ivB64, tagB64, ctB64] = payload.split(":");
    if (v !== "v1") return null;
    const decipher = crypto.createDecipheriv("aes-256-gcm", getKey(), Buffer.from(ivB64, "base64"));
    decipher.setAuthTag(Buffer.from(tagB64, "base64"));
    return Buffer.concat([decipher.update(Buffer.from(ctB64, "base64")), decipher.final()]).toString("utf8");
  } catch {
    return null;
  }
}

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  return Boolean(url && key && !url.includes("your-project-id") && !url.includes("placeholder") && !key.includes("your-service-role-key"));
}

async function persist(row: StoredSecret): Promise<void> {
  if (!isSupabaseConfigured()) return;
  try {
    const mod = await import("../db/admin");
    await mod
      .createAdminClient()
      .from("org_event_secrets")
      .upsert({
        org_id: row.orgId,
        secret_ciphertext: row.ciphertext,
        secret_hint: row.hint,
        created_at: row.createdAt,
        rotated_at: row.rotatedAt,
      });
  } catch {
    // Memory copy remains authoritative for this process.
  }
}

async function load(orgId: string): Promise<StoredSecret | null> {
  const mem = store.get(orgId);
  if (mem) return mem;
  if (!isSupabaseConfigured()) return null;
  try {
    const mod = await import("../db/admin");
    const { data } = await mod
      .createAdminClient()
      .from("org_event_secrets")
      .select("org_id, secret_ciphertext, secret_hint, created_at, rotated_at")
      .eq("org_id", orgId)
      .maybeSingle();
    if (!data) return null;
    const row: StoredSecret = {
      orgId: data.org_id,
      ciphertext: data.secret_ciphertext,
      hint: data.secret_hint,
      createdAt: data.created_at,
      rotatedAt: data.rotated_at,
    };
    store.set(orgId, row);
    return row;
  } catch {
    return null;
  }
}

/**
 * Creates (or rotates, when one exists) the events secret for an organization.
 * Returns the plaintext ONCE. Callers must never log or persist the return value.
 */
export async function issueEventSecret(orgId: string): Promise<{ secret: string; meta: EventSecretMeta; rotated: boolean }> {
  if (!ORG_ID_PATTERN.test(orgId)) throw new Error("Invalid organization id.");
  const existing = await load(orgId);
  const secret = `aeg_evt_${crypto.randomBytes(32).toString("hex")}`;
  const now = new Date().toISOString();
  const row: StoredSecret = {
    orgId,
    ciphertext: encrypt(secret),
    hint: secret.slice(-4),
    createdAt: existing?.createdAt || now,
    rotatedAt: existing ? now : null,
  };
  store.set(orgId, row);
  await persist(row);
  const { ciphertext: _c, ...meta } = row;
  return { secret, meta, rotated: Boolean(existing) };
}

/** Returns the plaintext secret for HMAC verification, or null when none exists. Server-only. */
export async function getEventSecret(orgId: string): Promise<string | null> {
  if (!ORG_ID_PATTERN.test(orgId)) return null;
  const row = await load(orgId);
  if (!row) return null;
  return decrypt(row.ciphertext);
}

export async function getEventSecretMeta(orgId: string): Promise<EventSecretMeta | null> {
  const row = await load(orgId);
  if (!row) return null;
  const { ciphertext: _c, ...meta } = row;
  return meta;
}

/** Test-only reset. */
export function __resetEventSecretsForTests(): void {
  store.clear();
}
