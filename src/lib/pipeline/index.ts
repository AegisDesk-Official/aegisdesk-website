/**
 * Pipeline entry point: builds the adapter from environment variables and keeps
 * a tiny in-process record of the last health check and the last event the
 * engine sent us. Both records are real observations, never invented.
 */
import { HttpAnswerPipeline, maskBaseUrl, resolvePipelineConfig } from "./http-adapter.ts";
import type { AnswerPipeline, HealthResult, PipelineResult } from "./answer-pipeline.ts";

export type { AnswerPipeline, PipelineResult, PipelineError, PipelineErrorCode } from "./answer-pipeline.ts";

export function getPipeline(): HttpAnswerPipeline {
  return new HttpAnswerPipeline({
    baseUrl: process.env.PIPELINE_BASE_URL || "",
    sharedSecret: process.env.PIPELINE_SHARED_SECRET || "",
  });
}

/** Organization whose documents back the public workbench "Ask your own question" box. */
export function getWorkbenchOrgId(): string {
  const v = (process.env.PIPELINE_WORKBENCH_ORG_ID || "").trim();
  return /^[A-Za-z0-9_\-:.]{1,128}$/.test(v) ? v : "aegisdesk-workbench";
}

// ---------------------------------------------------------------------------
// Observed status (globalThis so every route shares one record per process)
// ---------------------------------------------------------------------------
export interface HealthObservation {
  at: string;
  ok: boolean;
  latencyMs?: number;
  version?: string;
  simulated?: boolean;
  errorCode?: string;
  errorMessage?: string;
}

export interface EngineEventObservation {
  at: string;
  orgId: string;
  type: string;
  simulated?: boolean;
}

const g = globalThis as unknown as {
  __aegis_pipeline_health?: HealthObservation | null;
  __aegis_pipeline_last_event?: EngineEventObservation | null;
};

export async function runHealthCheck(pipeline: AnswerPipeline = getPipeline()): Promise<PipelineResult<HealthResult>> {
  const result = await pipeline.health();
  // NOT_CONNECTED is not an observation of the engine; do not record it as a failed check.
  if (!result.ok && result.error.code === "NOT_CONNECTED") return result;
  g.__aegis_pipeline_health = result.ok
    ? {
        at: new Date().toISOString(),
        ok: result.data.status === "ok",
        latencyMs: result.data.latencyMs,
        version: result.data.version,
        ...(result.data.simulated ? { simulated: true } : {}),
      }
    : {
        at: new Date().toISOString(),
        ok: false,
        errorCode: result.error.code,
        errorMessage: result.error.message,
      };
  return result;
}

export function recordEngineEvent(obs: Omit<EngineEventObservation, "at"> & { at?: string }): void {
  g.__aegis_pipeline_last_event = { ...obs, at: obs.at || new Date().toISOString() };
}

export function getLastHealth(): HealthObservation | null {
  return g.__aegis_pipeline_health || null;
}

export function getLastEngineEvent(): EngineEventObservation | null {
  return g.__aegis_pipeline_last_event || null;
}

export interface PipelineStatusSnapshot {
  configured: boolean;
  configIssue: string | null;
  /** Configured AND the most recent health check succeeded. */
  connected: boolean;
  baseUrlMasked: string;
  lastHealth: HealthObservation | null;
  lastEvent: EngineEventObservation | null;
}

export function getPipelineStatus(): PipelineStatusSnapshot {
  const resolved = resolvePipelineConfig({
    baseUrl: process.env.PIPELINE_BASE_URL || "",
    sharedSecret: process.env.PIPELINE_SHARED_SECRET || "",
  });
  const lastHealth = resolved.configured ? getLastHealth() : null;
  return {
    configured: resolved.configured,
    configIssue: resolved.issue,
    connected: resolved.configured && Boolean(lastHealth?.ok),
    baseUrlMasked: maskBaseUrl(resolved.baseUrl),
    lastHealth,
    lastEvent: getLastEngineEvent(),
  };
}

/** Test-only reset. */
export function __resetPipelineStatusForTests(): void {
  g.__aegis_pipeline_health = null;
  g.__aegis_pipeline_last_event = null;
}
