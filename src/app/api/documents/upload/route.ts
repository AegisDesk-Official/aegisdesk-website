import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { requireRole } from "@/lib/security/auth-roles";
import { validatePdfUpload, parsePdfWithTimeout } from "@/lib/security/upload";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { recordAuditLog } from "@/lib/security/audit";
import { formatSafeError, safeLog } from "@/lib/security/sanitize";
import {
  newDocumentId,
  storeDocumentFile,
  createDocumentRecord,
  listDocuments,
} from "@/lib/db/documents-store";
import { submitDocumentForIndexing } from "@/lib/pipeline/ingest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    // 1. Role verification: Only Owner or Admin can upload training documents
    const authCheck = requireRole(request, ["owner", "admin"]);
    if ("error" in authCheck) {
      return authCheck.error;
    }
    const { user } = authCheck;

    // 2. Rate limiting check
    const rateLimit = await checkRateLimit("api_route", user.id);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please wait before uploading further documents." },
        { status: 429, headers: { "Retry-After": String(rateLimit.reset) } }
      );
    }

    // 3. Extract multipart/form-data
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        { error: "Invalid upload payload: 'file' form field is required." },
        { status: 400 }
      );
    }

    const filename = (file as File).name || "document.pdf";
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 4. Validate magic signature (%PDF-) and 25MB size ceiling
    const validation = validatePdfUpload(buffer, filename);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { upload } = validation;
    const sha256 = crypto.createHash("sha256").update(buffer).digest("hex");
    const docId = newDocumentId();

    // 5. Store PDF in private storage (bucket or local private directory)
    const storageInfo = await storeDocumentFile(user.orgId, docId, buffer);

    // 6. Create record in state "waiting_for_engine"
    let docRecord = await createDocumentRecord({
      id: docId,
      orgId: user.orgId,
      filename: upload.originalName,
      sizeBytes: upload.sizeBytes,
      sha256,
      storage: storageInfo.storage,
      storagePath: storageInfo.storagePath,
    });

    // 7. Hand to AI answering engine if connected (remains waiting_for_engine if unconfigured)
    docRecord = await submitDocumentForIndexing(docRecord);

    // 8. Record immutable audit log
    recordAuditLog({
      eventType: "document.upload",
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      organizationId: user.orgId,
      details: {
        documentId: docRecord.id,
        filename: docRecord.filename,
        sizeBytes: docRecord.sizeBytes,
        sha256: docRecord.sha256,
        status: docRecord.status,
      },
    });

    safeLog(`Document stored in private storage: ${docRecord.id} (${docRecord.status}) for org ${user.orgId}`);

    return NextResponse.json({
      success: true,
      document: {
        id: docRecord.id,
        filename: docRecord.filename,
        sizeBytes: docRecord.sizeBytes,
        sha256: docRecord.sha256,
        status: docRecord.status,
        statusDetail: docRecord.statusDetail,
        uploadedAt: docRecord.uploadedAt,
      },
    });
  } catch (error) {
    const safeErr = formatSafeError(error);
    return NextResponse.json({ error: safeErr.error }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const authCheck = requireRole(request, ["owner", "admin", "agent", "viewer"]);
    if ("error" in authCheck) {
      return authCheck.error;
    }
    const docs = listDocuments(authCheck.user.orgId);
    return NextResponse.json({
      documents: docs.map((d) => ({
        id: d.id,
        filename: d.filename,
        filesize: `${(d.sizeBytes / 1024).toFixed(0)} KB`,
        sizeBytes: d.sizeBytes,
        sha256: d.sha256,
        status: d.status,
        statusDetail: d.statusDetail,
        uploadedAt: d.uploadedAt,
        indexedAt: d.indexedAt,
      })),
    });
  } catch (error) {
    const safeErr = formatSafeError(error);
    return NextResponse.json({ error: safeErr.error }, { status: 500 });
  }
}
