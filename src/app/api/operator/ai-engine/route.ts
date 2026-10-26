import { NextRequest, NextResponse } from "next/server";
import { notFound } from "next/navigation";
import { isOwnerRequest } from "@/lib/security/auth-roles";
import { getClientIp } from "@/lib/demo-request";
import { recordAuditLog } from "@/lib/security/audit";
import { verifyTOTP } from "@/lib/security/totp";
import {
  getPipelineStatus,
  runHealthCheck,
  getLastHealth,
  getLastEngineEvent,
} from "@/lib/pipeline";
import {
  listWaitingDocuments,
  getDocument,
} from "@/lib/db/documents-store";
import { submitDocumentForIndexing } from "@/lib/pipeline/ingest";
import {
  issueEventSecret,
  getEventSecretMeta,
} from "@/lib/pipeline/event-secrets";
import { getAllRealClients, getDemoClients } from "@/lib/db/operator-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function enforceOwner(req: NextRequest) {
  if (!isOwnerRequest(req)) {
    notFound();
  }
}

export async function GET(req: NextRequest) {
  enforceOwner(req);

  const status = getPipelineStatus();
  const waitingDocuments = listWaitingDocuments();
  const realClients = getAllRealClients();
  const demoClients = getDemoClients();
  const allClients = [...realClients, ...demoClients];

  // Fetch event secret metadata for each active client org
  const orgSecretMetas: Record<string, any> = {};
  for (const client of allClients) {
    const meta = await getEventSecretMeta(client.id);
    if (meta) {
      orgSecretMetas[client.id] = meta;
    }
  }

  return NextResponse.json({
    status,
    waitingDocuments: waitingDocuments.map((d) => ({
      id: d.id,
      orgId: d.orgId,
      filename: d.filename,
      sizeBytes: d.sizeBytes,
      sha256: d.sha256,
      status: d.status,
      statusDetail: d.statusDetail,
      uploadedAt: d.uploadedAt,
    })),
    orgSecrets: orgSecretMetas,
  });
}

export async function POST(req: NextRequest) {
  enforceOwner(req);

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const { action } = body;
  const ip = getClientIp(req.headers);

  try {
    switch (action) {
      case "health_check": {
        const result = await runHealthCheck();
        const status = getPipelineStatus();
        return NextResponse.json({
          result,
          status,
        });
      }

      case "rotate_event_secret": {
        const { orgId, totpCode } = body;
        if (!orgId) {
          return NextResponse.json({ error: "Organization ID is required." }, { status: 400 });
        }
        if (!totpCode || !verifyTOTP(String(totpCode))) {
          return NextResponse.json(
            { error: "Invalid authenticator code. Security clearance required to issue or rotate organization credentials." },
            { status: 403 }
          );
        }

        const issued = await issueEventSecret(orgId);

        recordAuditLog({
          eventType: "operator.rotate_event_secret",
          actorId: "usr_platform_owner",
          actorEmail: process.env.OWNER_EMAIL || "owner@aegisdesk.ai",
          actorRole: "owner",
          organizationId: orgId,
          ipAddress: ip,
          details: {
            orgId,
            rotated: issued.rotated,
            hint: issued.meta.hint,
          },
        });

        // The plaintext secret is revealed once here.
        return NextResponse.json({
          success: true,
          secret: issued.secret,
          meta: issued.meta,
          rotated: issued.rotated,
        });
      }

      case "retry_document_ingest": {
        const { documentId, orgId } = body;
        if (!documentId || !orgId) {
          return NextResponse.json({ error: "documentId and orgId are required." }, { status: 400 });
        }
        const doc = getDocument(orgId, documentId);
        if (!doc) {
          return NextResponse.json({ error: "Document not found." }, { status: 404 });
        }

        const updated = await submitDocumentForIndexing(doc);
        return NextResponse.json({
          success: true,
          document: {
            id: updated.id,
            orgId: updated.orgId,
            status: updated.status,
            statusDetail: updated.statusDetail,
            updatedAt: updated.updatedAt,
          },
        });
      }

      default:
        return NextResponse.json({ error: `Unknown action "${action}"` }, { status: 400 });
    }
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal operator error" },
      { status: 500 }
    );
  }
}
