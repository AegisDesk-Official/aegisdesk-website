"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  ArrowRight,
  PlusCircle,
  FileText,
  Clock,
  CreditCard,
  AlertTriangle,
  HelpCircle,
  CheckCircle2,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import { CLIENT_OVERVIEW_DATA } from "@/lib/dashboard-seed-data";
import { calculateProjectedSavings } from "@/lib/metrics";
import { Sparkline } from "@/components/portal/sparkline";
import { InspectStatesBar } from "@/components/portal/inspect-states-bar";
import { DashboardSkeleton, DashboardEmptyState, DashboardErrorState } from "@/components/portal/state-views";
import { OnboardingChecklist } from "@/components/portal/onboarding-checklist";
import { PhaseBanner } from "@/components/portal/phase-banner";

export default function DashboardOverviewPage() {
  const [data, setData] = useState(CLIENT_OVERVIEW_DATA);
  const [viewState, setViewState] = useState<"normal" | "loading" | "empty" | "error">("normal");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedTopicForDoc, setSelectedTopicForDoc] = useState<string | null>(null);
  const [approvalsDisabled, setApprovalsDisabled] = useState(false);

  // Phase metadata from server
  const [phaseInfo, setPhaseInfo] = useState<{
    serverTime: number;
    shadow_started_at: string;
    shadow_ends_at: string;
    isSettled: boolean;
    settledAt: string | null;
    isDemo: boolean;
    hasData: boolean;
  }>({
    serverTime: Date.now(),
    shadow_started_at: new Date(Date.now() - 11 * 86400000).toISOString(),
    shadow_ends_at: new Date(Date.now() + 3 * 86400000).toISOString(),
    isSettled: false,
    settledAt: null,
    isDemo: false,
    hasData: true,
  });

  // Live support economics fed by Onboarding Checklist
  const [economics, setEconomics] = useState({
    averageHandleTimeMinutes: 11.8,
    agentHourlyCostUsd: 30.0,
  });

  useEffect(() => {
    fetch("/api/organization/phase")
      .then((r) => (r.ok ? r.json() : null))
      .then((res) => {
        if (res) {
          setPhaseInfo(res);
        }
      })
      .catch(() => {});
  }, []);

  const handleEconomicsUpdate = (eco: { averageHandleTimeMinutes: number; agentHourlyCostUsd: number }) => {
    setEconomics(eco);
  };

  // ONE SET OF NUMBERS: Derived strictly from calculateProjectedSavings
  // approved-as-is drafts in current window: 1,090
  const approvedDraftsCount = 1090;
  const savings = calculateProjectedSavings({
    approvedAsIsCount: approvedDraftsCount,
    avgHandleMinutes: economics.averageHandleTimeMinutes,
    agentHourlyCost: economics.agentHourlyCostUsd,
  });

  if (viewState === "loading") {
    return (
      <div className="space-y-4">
        <div className="flex justify-end gap-2 text-xs font-mono">
          <button onClick={() => setViewState("normal")} className="text-[var(--text-dim)] hover:underline">
            View Normal
          </button>
        </div>
        <DashboardSkeleton />
      </div>
    );
  }

  if (viewState === "error") {
    return (
      <div className="space-y-4">
        <DashboardErrorState
          message="Failed to synchronize PostgreSQL stream: connection timed out."
          onRetry={() => setViewState("normal")}
        />
        <DashboardSkeleton />
      </div>
    );
  }

  // Real organization with no data yet shows calm empty state
  if (viewState === "empty" || (!phaseInfo.isDemo && !phaseInfo.hasData)) {
    return (
      <div className="space-y-6">
        <PhaseBanner
          shadowEndsAt={phaseInfo.shadow_ends_at}
          isSettled={phaseInfo.isSettled}
          settledAt={phaseInfo.settledAt}
          serverTime={phaseInfo.serverTime}
          onApprovalsDisabled={setApprovalsDisabled}
        />
        <DashboardEmptyState
          title="No customer support tickets received yet"
          description="Once your Zendesk, Freshdesk, or Gorgias webhook integration is configured, live tickets and shadow-mode draft evaluations will stream into this control room."
          actionLabel="Connect Helpdesk Webhook"
          onAction={() => {
            const checklist = document.getElementById("onboarding-checklist");
            checklist?.scrollIntoView({ behavior: "smooth" });
          }}
        />
        <div id="onboarding-checklist">
          <OnboardingChecklist onEconomicsChange={handleEconomicsUpdate} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Demo Workspace Slim Banner */}
      {phaseInfo.isDemo && (
        <div className="w-full bg-[var(--surface-2)] border border-[rgba(227,179,65,0.3)] py-1.5 px-4 text-center font-mono text-[12px] text-[var(--warn)] rounded-[8px]">
          Demo workspace · sample data
        </div>
      )}

      {/* Simulation state switcher for verifying empty/error/loading requirements */}
      <InspectStatesBar label="Workspace Telemetry Window" onSelectState={setViewState} />

      {/* =================================================================== */}
      {/* 1. TOP PHASE BANNER (Driven by server clock and shadow_ends_at)     */}
      {/* =================================================================== */}
      <PhaseBanner
        shadowEndsAt={phaseInfo.shadow_ends_at}
        isSettled={phaseInfo.isSettled}
        settledAt={phaseInfo.settledAt}
        serverTime={phaseInfo.serverTime}
        onApprovalsDisabled={setApprovalsDisabled}
      />

      {/* =================================================================== */}
      {/* 1.5. CLIENT ONBOARDING CHECKLIST (Values feed metric estimates)      */}
      {/* =================================================================== */}
      <section aria-label="Client Onboarding Checklist">
        <OnboardingChecklist onEconomicsChange={handleEconomicsUpdate} />
      </section>

      {/* Dynamic Support Economics & ROI Banner */}
      <section
        aria-label="Calibrated Support Economics Telemetry"
        className="rounded-[10px] bg-[var(--surface-2)] border border-[var(--line)] p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-[13px]"
      >
        <div className="flex items-center gap-3">
          <span className="font-mono text-[11px] uppercase tracking-wider px-2 py-0.5 rounded bg-[var(--canvas)] border border-[var(--line)] text-[var(--verified)]">
            Economics Calibrated
          </span>
          <span className="text-[var(--text-dim)]">
            AHT: <strong className="text-[var(--text)] font-mono">{economics.averageHandleTimeMinutes}m</strong> · Agent Cost: <strong className="text-[var(--text)] font-mono">${economics.agentHourlyCostUsd}/hr</strong>
          </span>
        </div>
        <div className="font-mono text-[var(--text-dim)] flex items-center gap-3 group relative cursor-help" title={savings.formula}>
          <span>Autonomous Yield: <span className="text-[var(--text)]">{approvedDraftsCount.toLocaleString()} tickets ({savings.hoursSaved} hrs)</span></span>
          <span className="text-[var(--verified)] font-medium">~${savings.monthlySavingsUsd.toLocaleString()}/mo Net Savings</span>
          <div className="absolute top-full mt-1 right-0 hidden group-hover:block w-72 p-2.5 rounded-[8px] bg-[var(--surface)] border border-[var(--line)] shadow-xl text-[12px] font-sans text-[var(--text)] normal-case z-40">
            {savings.formula}
          </div>
        </div>
      </section>

      {/* =================================================================== */}
      {/* 2. SIX HEADLINE TILES (with sparklines & exact metric names)         */}
      {/* =================================================================== */}
      <section aria-label="Headline Metrics">
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2.5">
          {data.headlineTiles.map((tile) => (
            <div
              key={tile.id}
              className="p-3.5 rounded-[8px] bg-[var(--surface)] border border-[var(--line)] flex flex-col justify-between hover:border-[var(--line-strong)] transition-colors"
            >
              <div>
                <div className="mb-2">
                  <span className="text-[12px] font-mono text-[var(--text-dim)] leading-snug block whitespace-normal break-words">
                    {tile.label}
                  </span>
                </div>
                <div className="text-[20px] font-mono font-medium tabular-nums tracking-tight text-[var(--text)]">
                  {tile.value}
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-[var(--line)] flex items-end justify-between gap-2">
                <span className="text-[12px] font-mono text-[var(--text-faint)] leading-tight truncate">
                  {tile.delta}
                </span>
                <Sparkline data={tile.sparkline} width={48} height={18} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* =================================================================== */}
      {/* 3. ESCALATED TO TEAM (SPLIT BY REASON) & NEXT PAYMENT               */}
      {/* =================================================================== */}
      <section aria-label="Handoff Reasons" className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-[10px] bg-[var(--surface)] border border-[var(--line)] p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-[15px] font-medium text-[var(--text)]">
                  Escalated to Team — Split by reason
                </h3>
              </div>
              <p className="text-[13px] text-[var(--text-dim)] mt-0.5">
                Exact breakdown of why queries were escalated to human agents instead of auto-answered.
              </p>
            </div>
            <span className="text-[12px] font-mono tabular-nums text-[var(--text-dim)]">
              Total: 258 escalations
            </span>
          </div>

          {/* Stacked Progress Bar */}
          <div className="w-full h-3 rounded-full bg-[var(--surface-2)] overflow-hidden flex" aria-hidden="true">
            {data.handoffReasons.map((reason) => (
              <div
                key={reason.reason}
                style={{ width: `${reason.percentage}%`, backgroundColor: reason.color }}
                title={`${reason.label}: ${reason.percentage}%`}
                className="h-full border-r border-[var(--surface)] last:border-0"
              />
            ))}
          </div>

          {/* Reason Detail Rows */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            {data.handoffReasons.map((reason) => (
              <div
                key={reason.reason}
                className="p-2.5 rounded-[6px] bg-[var(--surface-2)] border border-[var(--line)] flex items-center justify-between text-[13px]"
              >
                <div className="flex items-center gap-2 truncate pr-2">
                  <span
                    className="w-2.5 h-2.5 rounded-sm shrink-0"
                    style={{ backgroundColor: reason.color }}
                  />
                  <span className="text-[var(--text-dim)] truncate">{reason.label}</span>
                </div>
                <div className="text-right shrink-0 font-mono tabular-nums">
                  <span className="text-[var(--text)] font-medium">{reason.count}</span>
                  <span className="text-[var(--text-faint)] ml-1">({reason.percentage}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* =================================================================== */}
        {/* 5. NEXT PAYMENT (Commercial status & retainer)                     */}
        {/* =================================================================== */}
        <div className="rounded-[10px] bg-[var(--surface)] border border-[var(--line)] p-4 sm:p-5 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[var(--glow)]" />
                <h3 className="text-[15px] font-medium text-[var(--text)]">Next Payment</h3>
              </div>
            </div>
            <p className="text-[13px] text-[var(--text-dim)]">
              Deterministic B2B Retainer covering daily retrieval recalibrations and zero-drift monitoring.
            </p>
          </div>

          <div className="p-3.5 rounded-[8px] bg-[var(--surface-2)] border border-[var(--line)] space-y-2">
            <div className="flex items-baseline justify-between">
              <span className="text-[12px] font-mono text-[var(--text-faint)] uppercase">
                {data.nextPayment.planLabel}
              </span>
              <span className="text-[18px] font-mono font-medium tabular-nums text-[var(--text)]">
                ${data.nextPayment.amount.toLocaleString()} / mo
              </span>
            </div>
            <div className="flex items-center justify-between text-[12px] font-mono text-[var(--text-dim)] pt-1 border-t border-[var(--line)]">
              <span>Next billing date:</span>
              <span className="text-[var(--text)] tabular-nums">2026-11-05</span>
            </div>
            <div className="flex items-center justify-between text-[12px] font-mono text-[var(--text-faint)]">
              <span>Status:</span>
              <span className="text-[var(--verified)] uppercase">{data.nextPayment.status}</span>
            </div>
          </div>

          <Link
            href="/dashboard/billing"
            className="w-full h-8 rounded-[6px] bg-[var(--surface-2)] hover:bg-[var(--surface-2)]/80 border border-[var(--line)] text-[12px] font-mono text-[var(--text)] flex items-center justify-center gap-1.5 transition-colors"
          >
            <span>View Invoices &amp; Mandate</span>
            <ArrowRight className="w-3.5 h-3.5 text-[var(--text-dim)]" />
          </Link>
        </div>
      </section>

      {/* =================================================================== */}
      {/* 4. POLICY GAPS WITH "ADD A DOCUMENT" ACTION                         */}
      {/* =================================================================== */}
      <section aria-label="Policy Gaps" className="rounded-[10px] bg-[var(--surface)] border border-[var(--line)] p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-[15px] font-medium text-[var(--text)]">
                Policy gaps — Handed-over tickets with reason &apos;no source&apos;
              </h3>
            </div>
            <p className="text-[13px] text-[var(--text-dim)] mt-0.5">
              Customer queries where no company SOP covered the issue. Upload a source document to resolve future escalations.
            </p>
          </div>

          <Link
            href="/dashboard/knowledge-base"
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[6px] bg-[var(--paper)] text-[var(--paper-ink)] hover:bg-white text-[12px] font-medium transition-colors shrink-0"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Add a document</span>
          </Link>
        </div>

        {/* Policy Gaps Table */}
        <div className="overflow-x-auto border border-[var(--line)] rounded-[8px]">
          <table className="w-full text-left text-[13px]">
            <thead className="bg-[var(--surface-2)] border-b border-[var(--line)] font-mono text-[11px] text-[var(--text-dim)] uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Topic / Customer Query</th>
                <th className="py-2.5 px-3">Unmatched Clause</th>
                <th className="py-2.5 px-3 text-right">Escalations</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)] font-mono">
              {data.policyGaps.map((gap) => (
                <tr key={gap.id} className="hover:bg-[var(--surface-2)]/40 transition-colors">
                  <td className="py-3 px-3 max-w-xs">
                    <p className="text-[13px] font-sans font-medium text-[var(--text)] line-clamp-1">
                      {gap.topic}
                    </p>
                    <p className="text-[12px] font-sans text-[var(--text-dim)] line-clamp-1 mt-0.5">
                      &ldquo;{gap.query}&rdquo;
                    </p>
                  </td>
                  <td className="py-3 px-3 text-[12px] font-sans text-[var(--text-dim)] max-w-sm line-clamp-2">
                    {gap.unmatchedClause}
                  </td>
                  <td className="py-3 px-3 text-right text-[var(--blocked)] font-medium tabular-nums">
                    {gap.frequency} tickets
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTopicForDoc(gap.topic);
                        setShowUploadModal(true);
                      }}
                      className="inline-flex items-center gap-1 text-[12px] font-mono text-[var(--glow)] hover:underline"
                    >
                      <span>+ Add document</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Add Document Quick Action Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[12px] max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h4 className="text-[15px] font-medium text-[var(--text)]">
                Add Knowledge Base Document
              </h4>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-[var(--text-dim)] hover:text-[var(--text)] text-sm"
              >
                ✕
              </button>
            </div>
            <p className="text-[13px] text-[var(--text-dim)]">
              Upload a PDF policy or markdown SOP to resolve:{" "}
              <strong className="text-[var(--text)] font-normal">{selectedTopicForDoc}</strong>
            </p>

            <div className="border border-dashed border-[var(--line)] rounded-[8px] p-6 text-center space-y-2 bg-[var(--surface-2)]">
              <FileText className="w-8 h-8 text-[var(--text-dim)] mx-auto" />
              <p className="text-[13px] text-[var(--text)] font-medium">
                Drag &amp; drop PDF (max 15MB)
              </p>
              <p className="text-[12px] text-[var(--text-dim)]">
                Document will be indexed and verified against hallucination invariants.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="px-3 h-8 rounded-[6px] text-[13px] text-[var(--text-dim)] hover:bg-[var(--surface-2)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowUploadModal(false);
                }}
                className="px-3 h-8 rounded-[6px] bg-[var(--paper)] text-[var(--paper-ink)] text-[13px] font-medium"
              >
                Upload &amp; Reindex
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
