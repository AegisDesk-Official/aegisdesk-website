"use client";

import React, { useState } from "react";
import {
  Clock,
  TrendingUp,
  DollarSign,
  ShieldAlert,
  FileCheck,
  Smile,
  Layers,
  ArrowRight,
  Filter,
} from "lucide-react";
import { CLIENT_PERFORMANCE_DATA } from "@/lib/dashboard-seed-data";
import { calculateProjectedSavings } from "@/lib/metrics";
import { DemoTag } from "@/components/portal/demo-tag";
import { InspectStatesBar } from "@/components/portal/inspect-states-bar";
import { EstimateTooltip } from "@/components/portal/estimate-tooltip";
import { ControlRoomChart } from "@/components/portal/sparkline";
import { DashboardSkeleton, DashboardEmptyState, DashboardErrorState } from "@/components/portal/state-views";

export default function PerformanceAnalyticsPage() {
  const [data, setData] = useState(CLIENT_PERFORMANCE_DATA);
  const [viewState, setViewState] = useState<"normal" | "loading" | "empty" | "error">("normal");

  // Single unified calculation from metrics engine
  const savings = calculateProjectedSavings({
    approvedAsIsCount: 1090,
    avgHandleMinutes: 11.8,
    agentHourlyCost: 30.0,
  });

  if (viewState === "loading") {
    return (
      <div className="space-y-4">
        <div className="flex justify-end gap-2 text-xs font-mono">
          <button onClick={() => setViewState("normal")} className="text-[var(--text-dim)] hover:underline">
            View Normal
          </button>
        </div>
        <DashboardSkeleton rows={6} />
      </div>
    );
  }

  if (viewState === "error") {
    return (
      <div className="space-y-4">
        <DashboardErrorState
          message="Failed to compute analytics aggregation for current window."
          onRetry={() => setViewState("normal")}
        />
        <DashboardSkeleton rows={3} />
      </div>
    );
  }

  if (viewState === "empty") {
    return (
      <div className="space-y-4">
        <div className="flex justify-end gap-2 text-xs font-mono">
          <button onClick={() => setViewState("normal")} className="text-[var(--text-dim)] hover:underline">
            View Normal
          </button>
        </div>
        <DashboardEmptyState
          title="No analytics history available"
          description="Analytics telemetry accumulates as incoming tickets are evaluated through the 3-gate verification engine."
          actionLabel="Refresh Data Window"
          onAction={() => setViewState("normal")}
        />
      </div>
    );
  }

  // Chart data for daily tickets evaluated
  const chartSeries = [
    { label: "Mon", value: 142 },
    { label: "Tue", value: 168 },
    { label: "Wed", value: 155 },
    { label: "Thu", value: 184 },
    { label: "Fri", value: 210 },
    { label: "Sat", value: 130 },
    { label: "Sun", value: 145 },
    { label: "Today", value: 226 },
  ];

  return (
    <div className="space-y-6">
      {/* State toggle inspector */}
      <InspectStatesBar label="Performance Window: Last 30 Days" onSelectState={setViewState} />

      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-[18px] font-medium text-[var(--text)] tracking-tight">
            Performance &amp; Resolution Telemetry
          </h1>
          <DemoTag />
        </div>
        <p className="text-[12px] text-[var(--text-dim)] mt-0.5">
          Audited latency, labor savings, and knowledge grounding health.
        </p>
      </div>

      {/* =================================================================== */}
      {/* 1. FIRST RESPONSE TIME, TIME SAVED, COST SAVED                      */}
      {/* =================================================================== */}
      <section aria-label="Key Performance Indicators" className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* First response time: Cannot be real before go-live */}
        <div className="p-4 rounded-[10px] bg-[var(--surface)] border border-[var(--line)] space-y-2">
          <div className="flex items-center justify-between text-[12px] font-mono text-[var(--text-dim)]">
            <span>First response time</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-[18px] font-mono font-medium text-[var(--text-dim)]">
              Appears after go-live
            </span>
          </div>
          <p className="text-[12px] font-mono text-[var(--text-faint)] pt-1 border-t border-[var(--line)]">
            Requires live automated replies to compute customer-facing latency.
          </p>
        </div>

        {/* Time saved (Estimate) */}
        <div className="p-4 rounded-[10px] bg-[var(--surface)] border border-[var(--line)] space-y-2">
          <div className="flex items-center justify-between">
            <EstimateTooltip
              label="Time saved"
              formula={savings.formula}
              parameters={[
                { name: "avg_handle_minutes", value: "11.8 min" },
                { name: "approved_drafts", value: "1,090 tickets" },
              ]}
            />
          </div>
          <div className="text-[24px] font-mono font-medium tabular-nums text-[var(--glow)]">
            {savings.hoursSaved} hrs
          </div>
          <p className="text-[12px] font-mono text-[var(--text-faint)] pt-1 border-t border-[var(--line)] truncate" title={savings.formula}>
            {savings.formula}
          </p>
        </div>

        {/* Cost saved (Estimate) */}
        <div className="p-4 rounded-[10px] bg-[var(--surface)] border border-[var(--line)] space-y-2">
          <div className="flex items-center justify-between">
            <EstimateTooltip
              label="Cost saved"
              formula={savings.formula}
              parameters={[
                { name: "agent_hourly_cost", value: "$30.00 / hr" },
                { name: "hours_saved", value: `${savings.hoursSaved} hrs` },
                { name: "reporting_currency", value: "USD ($)" },
              ]}
            />
          </div>
          <div className="text-[24px] font-mono font-medium tabular-nums text-[var(--verified)]">
            ${savings.monthlySavingsUsd.toLocaleString()}
          </div>
          <p className="text-[12px] font-mono text-[var(--text-faint)] pt-1 border-t border-[var(--line)] truncate" title={savings.formula}>
            {savings.formula}
          </p>
        </div>
      </section>

      {/* =================================================================== */}
      {/* REPLIES CHECKED PER DAY TIME SERIES CHART                           */}
      {/* =================================================================== */}
      <section aria-label="Daily Evaluation Volume">
        <ControlRoomChart
          data={chartSeries}
          height={160}
          metricLabel="Replies checked per day"
          unit=" tickets"
        />
      </section>

      {/* =================================================================== */}
      {/* 2. BLOCKED DRAFTS BY CHECK 1, 2 OR 3                                */}
      {/* =================================================================== */}
      <section aria-label="Blocked Drafts" className="rounded-[10px] bg-[var(--surface)] border border-[var(--line)] p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-[14px] font-medium text-[var(--text)]">
                Blocked drafts — By check 1, 2 or 3
              </h3>
              <DemoTag />
            </div>
            <p className="text-[12px] text-[var(--text-dim)] mt-0.5">
              Drafts intercepted before human or customer review because one of the deterministic safety invariants failed.
            </p>
          </div>
          <span className="text-[12px] font-mono text-[var(--blocked)] font-medium tabular-nums">
            Total blocked: 42
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          {data.blockedDraftsBreakdown.map((item, idx) => (
            <div
              key={idx}
              className="p-3 rounded-[8px] bg-[var(--surface-2)] border border-[var(--line)] space-y-1"
            >
              <div className="flex items-center justify-between font-mono text-[11px]">
                <span className="text-[var(--text-faint)] uppercase">Gate {idx + 1}</span>
                <span className="text-[var(--blocked)] font-medium tabular-nums">{item.count} blocked</span>
              </div>
              <p className="text-[12px] font-medium text-[var(--text)] leading-tight">{item.check}</p>
              <p className="text-[11px] text-[var(--text-faint)] mt-1">{item.reason}</p>
            </div>
          ))}
        </div>
      </section>

      {/* =================================================================== */}
      {/* 3. TOP TOPICS: VOLUME & HANDOFF RATE PER TOPIC                      */}
      {/* =================================================================== */}
      <section aria-label="Top Topics" className="rounded-[10px] bg-[var(--surface)] border border-[var(--line)] p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-[14px] font-medium text-[var(--text)]">
                Top topics — Volume and handoff rate per topic
              </h3>
              <DemoTag />
            </div>
            <p className="text-[12px] text-[var(--text-dim)] mt-0.5">
              Clusters of incoming customer tickets mapped against grounding accuracy.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto border border-[var(--line)] rounded-[8px]">
          <table className="w-full text-left text-[12px] font-mono">
            <thead className="bg-[var(--surface-2)] border-b border-[var(--line)] text-[10px] text-[var(--text-faint)] uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Topic Cluster</th>
                <th className="py-2.5 px-3 text-right">Volume</th>
                <th className="py-2.5 px-3 text-right">Handoff Rate</th>
                <th className="py-2.5 px-3 text-right">Grounded Answer Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)]">
              {data.topTopics.map((t, idx) => (
                <tr key={idx} className="hover:bg-[var(--surface-2)]/40 transition-colors">
                  <td className="py-2.5 px-3 font-sans text-[var(--text)] font-medium">
                    {t.topic}
                  </td>
                  <td className="py-2.5 px-3 text-right text-[var(--text-dim)] tabular-nums">
                    {t.volume} tickets
                  </td>
                  <td className="py-2.5 px-3 text-right tabular-nums text-[var(--blocked)] font-medium">
                    {t.handoffRate}
                  </td>
                  <td className="py-2.5 px-3 text-right tabular-nums text-[var(--verified)]">
                    {t.groundedRate}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* =================================================================== */}
      {/* 4. KNOWLEDGE HEALTH, CHANNEL SPLIT, & CSAT                          */}
      {/* =================================================================== */}
      <section aria-label="Knowledge and Channels" className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Knowledge health */}
        <div className="p-4 rounded-[10px] bg-[var(--surface)] border border-[var(--line)] space-y-3">
          <div className="flex items-center justify-between text-[11px] font-mono text-[var(--text-dim)]">
            <div className="flex items-center gap-1.5">
              <FileCheck className="w-3.5 h-3.5 text-[var(--glow)]" />
              <span>Knowledge health</span>
            </div>
            <DemoTag />
          </div>

          <div className="space-y-2 pt-1 font-mono text-[12px]">
            <div className="flex items-center justify-between">
              <span className="text-[var(--text-dim)]">Document count:</span>
              <span className="text-[var(--text)] tabular-nums font-medium">
                {data.knowledgeHealth.documentCount} active PDFs
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[var(--text-dim)]">Days since last update:</span>
              <span className="text-[var(--text)] tabular-nums">
                {data.knowledgeHealth.daysSinceLastUpdate} days
              </span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-[var(--line)]">
              <span className="text-[var(--text-dim)]">Tickets with &ge;1 source:</span>
              <span className="text-[var(--verified)] tabular-nums font-medium">
                {data.knowledgeHealth.groundedShare}
              </span>
            </div>
          </div>
        </div>

        {/* Channel split */}
        <div className="p-4 rounded-[10px] bg-[var(--surface)] border border-[var(--line)] space-y-3">
          <div className="flex items-center justify-between text-[11px] font-mono text-[var(--text-dim)]">
            <div className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[var(--text-dim)]" />
              <span>Channel split</span>
            </div>
            <DemoTag />
          </div>

          <div className="space-y-1.5 font-mono text-[11px]">
            {data.channelSplit.map((ch, idx) => (
              <div key={idx} className="flex items-center justify-between py-1">
                <span className="text-[var(--text-dim)] truncate">{ch.channel}</span>
                <span className="text-[var(--text)] tabular-nums shrink-0">
                  {ch.count} <span className="text-[var(--text-faint)]">({ch.share}%)</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Customer satisfaction (CSAT): Cannot be real before go-live */}
        <div className="p-4 rounded-[10px] bg-[var(--surface)] border border-[var(--line)] space-y-3">
          <div className="flex items-center justify-between text-[12px] font-mono text-[var(--text-dim)]">
            <div className="flex items-center gap-1.5">
              <Smile className="w-3.5 h-3.5 text-[var(--verified)]" />
              <span>Customer satisfaction</span>
            </div>
          </div>

          <div className="space-y-2 pt-1 font-mono text-[13px]">
            <div className="text-[18px] font-mono font-medium text-[var(--text-dim)]">
              Appears after go-live
            </div>
            <p className="text-[12px] text-[var(--text-faint)] pt-1 border-t border-[var(--line)]">
              Customer satisfaction ratings will appear here once live customer interactions begin.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}


