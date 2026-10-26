/**
 * Client knowledge documents (PDFs).
 *
 * Storage: a PRIVATE Supabase Storage bucket (DOCUMENTS_BUCKET, default "client-documents")
 * when Supabase is configured; otherwise a private local folder (.data/private-documents,
 * git-ignored, never under /public) for test mode. Files are never publicly readable.
 *
 * Status lifecycle:
 *   waiting_for_engine -> queued (engine accepted) -> indexed | failed (engine reports via POST /api/events)
 * A document stays "waiting_for_engine" for as long as the AI engine is not connected.
 */
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { isSupabaseConfigured } from "../pipeline/event-secrets.ts";

export type DocumentStatus = "waiting_for_engine" | "queued" | "indexed" | "failed";

export interface DocumentRecord {
  id: string;
  orgId: string;
  filename: string;
  sizeBytes: number;
  sha256: string;
  storage: "supabase" | "local";
  storagePath: string;
  status: DocumentStatus;
  /** Plain-language reason for the current status (e.g. engine error code). Never contains file text. */
  statusDetail: string | null;
  uploadedAt: string;
  updatedAt: string;
  indexedAt: string | null;
}

const ORG_ID_PATTERN = /^[A-Za-z0-9_\-:.]{1,128}$/;
const DOC_ID_PATTERN = /^[0-9a-f-]{36}$/;
export const ENGINE_FILE_URL_TTL_SECONDS = 15 * 60;

const g = globalThis as unknown as { __aegis_documents?: Map<string, DocumentRecord> };
const docs: Map<string, DocumentRecord> = g.__aegis_documents || new Map();
g.__aegis_documents = docs;

const key = (orgId: string, id: string) => `${orgId}::${id}`;

function bucketName(): string {
  return (process.env.DOCUMENTS_BUCKET || "client-documents").trim();
}

function localRoot(): string {
  return path.join(process.cwd(), ".data", "private-documents");
}

function localPath(orgId: string, id: string): string {
  if (!ORG_ID_PATTERN.test(orgId) || !DOC_ID_PATTERN.test(id)) throw new Error("Invalid document path.");
  return path.join(localRoot(), orgId.replace(/[:.]/g, "_"), `${id}.pdf`);
}

export function newDocumentId(): string {
  return crypto.randomUUID();
}

/** Stores the PDF bytes privately. Returns where it went. */
export async function storeDocumentFile(
  orgId: string,
  id: string,
  buffer: Buffer
): Promise<{ storage: "supabase" | "local"; storagePath: string }> {
  if (isSupabaseConfigured()) {
    const storagePath = `${orgId}/${id}.pdf`;
    const mod = await import("./admin");
    const { error } = await mod
      .createAdminClient()
      .storage.from(bucketName())
      .upload(storagePath, buffer, { contentType: "application/pdf", upsert: false });
    if (error) throw new Error("Private storage upload failed.");
    return { storage: "supabase", storagePath };
  }
  const p = localPath(orgId, id);
  await fs.mkdir(path.dirname(p), { recursive: true, mode: 0o700 });
  await fs.writeFile(p, buffer, { mode: 0o600 });
  return { storage: "local", storagePath: path.relative(process.cwd(), p) };
}

export async function readDocumentFile(doc: DocumentRecord): Promise<Buffer | null> {
  try {
    if (doc.storage === "supabase") {
      const mod = await import("./admin");
      const { data } = await mod.createAdminClient().storage.from(bucketName()).download(doc.storagePath);
      return data ? Buffer.from(await data.arrayBuffer()) : null;
    }
    return await fs.readFile(localPath(doc.orgId, doc.id));
  } catch {
    return null;
  }
}

async function deleteDocumentFile(doc: DocumentRecord): Promise<void> {
  try {
    if (doc.storage === "supabase") {
      const mod = await import("./admin");
      await mod.createAdminClient().storage.from(bucketName()).remove([doc.storagePath]);
      return;
    }
    await fs.unlink(localPath(doc.orgId, doc.id));
  } catch {
    // Already gone.
  }
}

async function persistRow(doc: DocumentRecord): Promise<void> {
  if (!isSupabaseConfigured()) return;
  try {
    const mod = await import("./admin");
    await mod.createAdminClient().from("documents").upsert({
      id: doc.id,
      org_id: doc.orgId,
      storage_path: doc.storagePath,
      storage_backend: doc.storage,
      filename: doc.filename,
      file_size_bytes: doc.sizeBytes,
      mime_type: "application/pdf",
      sha256_hash: doc.sha256,
      processing_status: doc.status,
      status_detail: doc.statusDetail,
      indexed_at: doc.indexedAt,
      created_at: doc.uploadedAt,
    });
  } catch {
    // Memory copy remains authoritative in test mode.
  }
}

export async function createDocumentRecord(
  input: Omit<DocumentRecord, "status" | "statusDetail" | "uploadedAt" | "updatedAt" | "indexedAt">
): Promise<DocumentRecord> {
  const now = new Date().toISOString();
  const doc: DocumentRecord = {
    ...input,
    status: "waiting_for_engine",
    statusDetail: null,
    uploadedAt: now,
    updatedAt: now,
    indexedAt: null,
  };
  docs.set(key(doc.orgId, doc.id), doc);
  await persistRow(doc);
  return doc;
}

export function getDocument(orgId: string, id: string): DocumentRecord | null {
  return docs.get(key(orgId, id)) || null;
}

export function listDocuments(orgId: string): DocumentRecord[] {
  return Array.from(docs.values())
    .filter((d) => d.orgId === orgId)
    .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
}

/** Documents not yet accepted by the engine, across all organizations (owner console). */
export function listWaitingDocuments(): DocumentRecord[] {
  return Array.from(docs.values())
    .filter((d) => d.status === "waiting_for_engine" || d.status === "failed")
    .sort((a, b) => a.uploadedAt.localeCompare(b.uploadedAt));
}

export async function updateDocumentStatus(
  orgId: string,
  id: string,
  status: DocumentStatus,
  detail: string | null = null
): Promise<DocumentRecord | null> {
  const doc = docs.get(key(orgId, id));
  if (!doc) return null;
  doc.status = status;
  doc.statusDetail = detail;
  doc.updatedAt = new Date().toISOString();
  if (status === "indexed") doc.indexedAt = doc.updatedAt;
  await persistRow(doc);
  return doc;
}

export async function deleteDocument(orgId: string, id: string): Promise<DocumentRecord | null> {
  const doc = docs.get(key(orgId, id));
  if (!doc) return null;
  docs.delete(key(orgId, id));
  await deleteDocumentFile(doc);
  if (isSupabaseConfigured()) {
    try {
      const mod = await import("./admin");
      await mod.createAdminClient().from("documents").delete().eq("id", id).eq("org_id", orgId);
    } catch {
      // ignore
    }
  }
  return doc;
}

// ---------------------------------------------------------------------------
// Short-lived download URL handed to the engine in indexDocument(fileUrl)
// ---------------------------------------------------------------------------
function fileUrlSignature(secret: string, orgId: string, id: string, exp: number): string {
  return crypto.createHmac("sha256", secret).update(`file.${orgId}.${id}.${exp}`, "utf8").digest("hex");
}

export function appBaseUrl(): string {
  return (process.env.APP_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/+$/, "");
}

/** Returns a URL the engine can GET for 15 minutes, or null if it cannot be built. */
export async function buildEngineFileUrl(doc: DocumentRecord): Promise<string | null> {
  if (doc.storage === "supabase") {
    try {
      const mod = await import("./admin");
      const { data } = await mod
        .createAdminClient()
        .storage.from(bucketName())
        .createSignedUrl(doc.storagePath, ENGINE_FILE_URL_TTL_SECONDS);
      return data?.signedUrl || null;
    } catch {
      return null;
    }
  }
  const secret = (process.env.PIPELINE_SHARED_SECRET || "").trim();
  if (!secret) return null;
  const exp = Math.floor(Date.now() / 1000) + ENGINE_FILE_URL_TTL_SECONDS;
  const sig = fileUrlSignature(secret, doc.orgId, doc.id, exp);
  const qs = new URLSearchParams({ org: doc.orgId, exp: String(exp), sig });
  return `${appBaseUrl()}/api/documents/${doc.id}/file?${qs.toString()}`;
}

export function verifyEngineFileUrl(orgId: string, id: string, exp: string, sig: string): boolean {
  const secret = (process.env.PIPELINE_SHARED_SECRET || "").trim();
  const expNum = Number(exp);
  if (!secret || !Number.isFinite(expNum) || expNum < Math.floor(Date.now() / 1000)) return false;
  if (expNum > Math.floor(Date.now() / 1000) + ENGINE_FILE_URL_TTL_SECONDS + 5) return false;
  try {
    const a = Buffer.from(fileUrlSignature(secret, orgId, id, expNum), "hex");
    const b = Buffer.from(sig, "hex");
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/** Test-only reset. */
export function __resetDocumentsForTests(): void {
  docs.clear();
}
