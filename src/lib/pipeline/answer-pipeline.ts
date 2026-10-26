/**
 * AnswerPipeline — the single connection point between AegisDesk and the
 * externally hosted AI answering engine.
 *
 * AegisDesk does NOT contain any AI. Every method below forwards a signed
 * request to PIPELINE_BASE_URL. While that variable is empty every method
 * resolves to { ok: false, error: { code: "NOT_CONNECTED" } } and callers must
 * render a calm "Not connected yet" / empty state. Never fabricate a result.
 *
 * Wire format: see docs/PIPELINE_CONTRACT.md.
 */

export type PipelineErrorCode =
  | "NOT_CONNECTED" // PIPELINE_BASE_URL or PIPELINE_SHARED_SECRET is empty
  | "TIMEOUT" // engine did not answer within the method timeout
  | "NETWORK_ERROR" // DNS / TCP / TLS failure
  | "UNAUTHORIZED" // engine rejected our signature (401/403)
  | "RATE_LIMITED" // engine answered 429
  | "ENGINE_ERROR" // engine answered 4xx/5xx with an error body
  | "BAD_RESPONSE" // engine answered 2xx but the JSON did not match the contract
  | "INVALID_INPUT"; // AegisDesk refused to send a malformed request (nothing left the server)

export interface PipelineError {
  code: PipelineErrorCode;
  message: string;
  /** HTTP status from the engine, when one was received. */
  status?: number;
  /** True when the caller may safely retry later. */
  retryable: boolean;
}

export type PipelineResult<T> = { ok: true; data: T } | { ok: false; error: PipelineError };

/** NOT_CONNECTED is the only error returned while the engine is unconfigured. */
export const NOT_CONNECTED_ERROR: PipelineError = Object.freeze({
  code: "NOT_CONNECTED",
  message: "The AI engine is not connected yet.",
  retryable: false,
}) as PipelineError;

export interface HealthResult {
  status: "ok" | "degraded";
  version: string;
  /** Present and true only when the engine is the local mock in /tools. */
  simulated?: boolean;
  /** Round-trip time measured by AegisDesk, not reported by the engine. */
  latencyMs: number;
}

export interface IndexDocumentResult {
  documentId: string;
  /** "queued": the engine accepted the job and will report completion via POST /api/events. */
  status: "queued" | "indexed";
  simulated?: boolean;
}

export interface RemoveDocumentResult {
  documentId: string;
  removed: boolean;
  simulated?: boolean;
}

export interface DraftCitation {
  documentId: string;
  page?: number;
  quote: string;
}

export interface DraftReplyResult {
  /** The proposed reply. Empty when the engine handed the question to a human. */
  reply: string;
  citations: DraftCitation[];
  /** True when every sentence is backed by a citation. */
  grounded: boolean;
  /** True when the engine declined to answer and would route to a person. */
  handedToHuman: boolean;
  reason?: "no_source" | "low_confidence" | "conflicting_policy" | "sensitive_topic";
  /** Engine-reported cost of this call in USD, if the engine reports it. */
  costUsd?: number;
  simulated?: boolean;
}

export interface AnswerPipeline {
  /** True when PIPELINE_BASE_URL and PIPELINE_SHARED_SECRET are both set. */
  readonly configured: boolean;

  /** GET /v1/health */
  health(): Promise<PipelineResult<HealthResult>>;

  /** POST /v1/documents/index — called after a client uploads a PDF. */
  indexDocument(orgId: string, documentId: string, fileUrl: string): Promise<PipelineResult<IndexDocumentResult>>;

  /** POST /v1/documents/remove — called when a client deletes a PDF. */
  removeDocument(orgId: string, documentId: string): Promise<PipelineResult<RemoveDocumentResult>>;

  /**
   * POST /v1/draft-reply — used ONLY by the public workbench "Ask your own question" box.
   * The text is passed straight through to the engine and is never stored or logged by AegisDesk.
   */
  draftReply(orgId: string, ticketRef: string, text: string): Promise<PipelineResult<DraftReplyResult>>;
}
