import { NextRequest, NextResponse } from "next/server";
import { getDocument, readDocumentFile, verifyEngineFileUrl } from "@/lib/db/documents-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/documents/[id]/file?org=...&exp=...&sig=...
 * Short-lived signed download endpoint for the external AI engine to fetch
 * uploaded PDFs during document indexing.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { searchParams } = new URL(req.url);
  const orgId = searchParams.get("org") || "";
  const exp = searchParams.get("exp") || "";
  const sig = searchParams.get("sig") || "";

  if (!orgId || !exp || !sig) {
    return NextResponse.json({ error: "Missing required signature parameters." }, { status: 401 });
  }

  const isValid = verifyEngineFileUrl(orgId, params.id, exp, sig);
  if (!isValid) {
    return NextResponse.json({ error: "Invalid or expired file download signature." }, { status: 403 });
  }

  const doc = getDocument(orgId, params.id);
  if (!doc) {
    return NextResponse.json({ error: "Document not found." }, { status: 404 });
  }

  const buffer = await readDocumentFile(doc);
  if (!buffer) {
    return NextResponse.json({ error: "Document file unavailable in private storage." }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Length": String(buffer.byteLength),
      "Content-Disposition": `attachment; filename="${encodeURIComponent(doc.filename)}"`,
      "Cache-Control": "private, no-cache, no-store, must-revalidate",
    },
  });
}
