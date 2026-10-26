/**
 * Hands a stored document to the engine. Used after upload and by the owner
 * console "Send waiting documents" action. Never fabricates an outcome:
 * NOT_CONNECTED leaves the document "waiting_for_engine".
 */
import { getPipeline } from "./index.ts";
import {
  buildEngineFileUrl,
  updateDocumentStatus,
  type DocumentRecord,
} from "../db/documents-store.ts";

export async function submitDocumentForIndexing(doc: DocumentRecord): Promise<DocumentRecord> {
  const pipeline = getPipeline();
  if (!pipeline.configured) {
    return (await updateDocumentStatus(doc.orgId, doc.id, "waiting_for_engine", null)) || doc;
  }
  const fileUrl = await buildEngineFileUrl(doc);
  if (!fileUrl) {
    return (await updateDocumentStatus(doc.orgId, doc.id, "waiting_for_engine", "Could not create a download link for the engine.")) || doc;
  }
  const result = await pipeline.indexDocument(doc.orgId, doc.id, fileUrl);
  if (result.ok) {
    return (
      (await updateDocumentStatus(
        doc.orgId,
        doc.id,
        result.data.status === "indexed" ? "indexed" : "queued",
        result.data.simulated ? "simulated" : null
      )) || doc
    );
  }
  // Engine configured but the call failed: stay waiting so it can be resent.
  return (await updateDocumentStatus(doc.orgId, doc.id, "waiting_for_engine", result.error.code)) || doc;
}
