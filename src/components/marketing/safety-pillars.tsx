'use client';

import React, { useState } from "react";
import {
  FileText,
  FileCheck2,
  ShieldCheck,
  AlertTriangle,
  Lock,
  Layers,
  ArrowRight,
  Database,
} from "lucide-react";
import { Container } from "@/components/ui/container";
import { Panel } from "@/components/ui/panel";
import { PaperCard } from "@/components/ui/paper-card";
import { StatusChip } from "@/components/ui/status-chip";
import { Label } from "@/components/ui/label";
import { siteConfig } from "@/lib/site-config";

/* ------------------------------------------------------------------ */
/* Gates Content Data (from site copy & /security)                    */
/* ------------------------------------------------------------------ */

interface GateData {
  id: string;
  num: string;
  name: string;
  headline: string;
  body: string;
  telemetry: string;
  doc: {
    title: string;
    clauseId: string;
    clauseTitle: string;
    text: string;
    status: string;
    footer: string;
  };
  action: {
    chip: string;
    variant: "verified" | "warn" | "blocked";
    summary: string;
    details: Array<{ label: string; value: string }>;
    resultText: string;
  };
}

const GATES: readonly GateData[] = [
  {
    id: "gate-01",
    num: "01",
    name: "Check 01 · Private workspace search",
    headline: "Isolated from other accounts",
    body: "Every search stays inside your private workspace. The system cannot search the public web or view another company's data.",
    telemetry: "Dedicated private workspace · Isolated data partition",
    doc: {
      title: "Data_Isolation_Standard.pdf · p.1",
      clauseId: "§1.1",
      clauseTitle: "Section 1.1 — Private Workspace Isolation",
      text: "Client documents operate in private workspaces. Support instances cannot access external accounts, wholesale pricing, or peer contract terms.",
      status: "ISOLATION ACTIVE",
      footer: "AES-256 ENCRYPTION · PRIVATE PARTITION",
    },
    action: {
      chip: "CHECK 01 PASSED",
      variant: "verified",
      summary: "Restricted strictly to your private workspace",
      details: [
        { label: "Private Workspace", value: "Dedicated client partition" },
        { label: "External Web Search", value: "Blocked (0 sources)" },
        { label: "Account Isolation", value: "Enforced by database partition" },
      ],
      resultText: "Search stayed inside your approved documents. External data was blocked.",
    },
  },
  {
    id: "gate-02",
    num: "02",
    name: "Check 02 · Sentence-by-sentence source check",
    headline: "Every sentence backed by a source",
    body: "The system checks every sentence against your documents. If an answer cannot find source text, it is removed.",
    telemetry: "99.4% source match · 2 quoted sources",
    doc: {
      title: "Return_Policy_SOP.pdf · p.3",
      clauseId: "§3.2",
      clauseTitle: "Section 3.2 — Opened Audio Hardware",
      text: "Eligible within 14 calendar days of carrier delivery. Requires original serialized packaging, complete included accessories, and a 10% inspection and restocking fee.",
      status: "PAGE-LEVEL CITATION",
      footer: "STRICT SENTENCE-TO-SOURCE ATTESTATION",
    },
    action: {
      chip: "CHECK 02 PASSED",
      variant: "verified",
      summary: "All factual claims backed by your documents",
      details: [
        { label: "Return Window Sentence", value: "Verified · Return_Policy_SOP.pdf §3.2" },
        { label: "Depot SLA Sentence", value: "Verified · Refund_SLA_Schedule.pdf §4.1" },
        { label: "Unsupported Claims", value: "None detected" },
      ],
      resultText: "Two document citations attached. Answer checked against policy before delivery.",
    },
  },
  {
    id: "gate-03",
    num: "03",
    name: "Check 03 · The bar an answer must clear",
    headline: "Stops and routes edge cases",
    body: "When an answer falls below the confidence bar, the system does not guess. It routes the ticket to your team.",
    telemetry: "92.0% confidence bar · 192ms handoff",
    doc: {
      title: "Return_Policy_SOP.pdf · p.3",
      clauseId: "§3.2 Boundary",
      clauseTitle: "Section 3.2 — B2B Boundary Condition",
      text: "Standard hardware returns apply within 30 days. Custom B2B hardware orders (>30 days) require contract account manager approval and are outside standard support automation.",
      status: "BOUNDARY CHECK",
      footer: "AUTOMATED ESCALATION TRIGGER",
    },
    action: {
      chip: "CHECK 03 TRIGGERED · ROUTED TO TEAM",
      variant: "warn",
      summary: "AI held back from guessing · Routed to your team",
      details: [
        { label: "Ticket Match Score", value: "38.0% (below 92.0% bar)" },
        { label: "Trigger Cause", value: "Custom B2B order past 30 days" },
        { label: "Action Taken", value: "Sent to Zendesk team queue (192ms)" },
      ],
      resultText: "The system held back from guessing. The ticket and notes were sent to your team.",
    },
  },
];

const SUPPORT_STACK: readonly string[] = siteConfig.integrations;

/* ------------------------------------------------------------------ */
/* SafetyPillars Component                                            */
/* ------------------------------------------------------------------ */

export function SafetyPillars() {
  const [activeGate, setActiveGate] = useState(0);

  const currentGateData = GATES[activeGate];

  return (
    <section
      id="safeguards"
      aria-labelledby="safety-heading"
      className="relative w-full border-t border-[var(--line)] bg-[var(--canvas)] py-[88px] lg:py-[140px]"
    >
      <div id="safety" className="sr-only" aria-hidden="true" />
      <Container>
        {/* Section Header */}
        <div className="max-w-[760px] space-y-4">
          <Label>03 // SAFEGUARDS</Label>
          <h2
            id="safety-heading"
            className="font-sans text-[36px] font-light leading-[1.05] tracking-[-0.03em] text-[var(--text)] sm:text-[44px] md:text-[52px]"
          >
            Three checks between your documents and the customer.
          </h2>
          <p className="max-w-[62ch] text-[17px] leading-[1.6] text-[var(--text-dim)]">
            Built so support leadership never has to wonder if an answer was made up or leaked from
            another account.
          </p>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* DESKTOP VIEW (>820px): INTERACTIVE CLICK TABS (NO PIN / NATURAL SCROLL) */}
        {/* ------------------------------------------------------------------ */}
        <div className="relative mt-14 hidden min-[821px]:block">
          <div className="grid grid-cols-12 items-start gap-8">
            {/* Left Column (5 Cols): Three Gate Clickable Selector Tabs */}
            <div
              role="tablist"
              aria-label="Enterprise Safeguard Stages"
              className="col-span-5 space-y-3.5"
            >
              <div className="mb-2 flex items-center justify-between font-mono text-[12px] uppercase tracking-[0.08em] text-[var(--text-dim)]">
                <span>SAFETY ARCHITECTURE</span>
                <span className="text-[var(--text-faint)]">
                  CHECK {activeGate + 1} OF 3
                </span>
              </div>

              {GATES.map((gate, idx) => {
                const isActive = activeGate === idx;
                return (
                  <button
                    key={gate.id}
                    type="button"
                    role="tab"
                    id={`gate-tab-${idx}`}
                    aria-selected={isActive}
                    aria-controls={`gate-panel-${idx}`}
                    onClick={() => setActiveGate(idx)}
                    className={`w-full text-left rounded-[16px] border p-5 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--verified)] ${
                      isActive
                        ? "border-[var(--line-strong)] bg-[var(--surface-2)] opacity-100 shadow-sm"
                        : "border-[var(--line)] bg-[var(--surface)]/50 opacity-40 hover:opacity-85 hover:bg-[var(--surface)]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <StatusChip variant={isActive ? "verified" : "neutral"}>
                        CHECK {gate.num}
                      </StatusChip>
                      <span className="font-mono text-[11px] text-[var(--text-faint)] tabular-nums">
                        {isActive ? "ACTIVE CHECK" : `CHECK 0${idx + 1}`}
                      </span>
                    </div>

                    <h3 className="mt-3 text-[16px] font-medium text-[var(--text)]">
                      {gate.name}
                    </h3>

                    <p className="mt-1.5 text-[13px] font-light leading-[1.6] text-[var(--text-dim)]">
                      {gate.body}
                    </p>

                    <div className="mt-3 border-t border-[var(--line)] pt-2.5 font-mono text-[11px] text-[var(--text-faint)]">
                      {gate.telemetry}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Right Column (7 Cols): One Paper Document + Small Dark Outcome Panel */}
            <div
              id={`gate-panel-${activeGate}`}
              role="tabpanel"
              aria-labelledby={`gate-tab-${activeGate}`}
              className="col-span-7 space-y-4"
            >
                <div className="mb-2 flex items-center justify-between font-mono text-[12px] uppercase tracking-[0.08em] text-[var(--text-dim)]">
                  <span>GROUNDED EVIDENCE &amp; AUDIT</span>
                  <span className="text-[var(--text-faint)]">LIVE PIPELINE</span>
                </div>

                {/* ONE PAPER DOCUMENT (Highlighted Matching Clause) */}
                <PaperCard className="relative overflow-hidden font-sans">
                  <div className="flex items-center justify-between border-b border-[var(--paper-line)] pb-2.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="h-4 w-4 shrink-0 text-[var(--paper-ink)]" />
                      <span className="truncate font-mono text-[12px] font-semibold text-[var(--paper-ink)]">
                        {currentGateData.doc.title}
                      </span>
                    </div>
                    <span className="shrink-0 rounded-[4px] bg-[var(--paper-ink)]/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--paper-ink)]">
                      {currentGateData.doc.status}
                    </span>
                  </div>

                  {/* Document Highlighted Clause */}
                  <div className="mt-3.5 rounded-r border-l-[3px] border-[var(--paper-ink)] bg-[var(--paper-ink)]/10 p-3.5 text-[13px] leading-[1.65] text-[var(--paper-ink)] shadow-sm transition-all duration-300">
                    <div className="flex items-center justify-between">
                      <p className="font-mono text-[11px] font-bold uppercase tracking-[0.04em] text-[var(--paper-ink)]">
                        {currentGateData.doc.clauseTitle}
                      </p>
                      <span className="font-mono text-[10px] font-medium text-[var(--paper-ink)]">
                        ★ VERIFIED BOUND
                      </span>
                    </div>
                    <p className="mt-1.5 font-medium text-[var(--paper-ink)]">
                      {currentGateData.doc.text}
                    </p>
                  </div>

                  <div className="mt-3.5 flex items-center justify-between border-t border-[var(--paper-line)] pt-2.5 font-mono text-[11px] text-[var(--paper-ink)]/70">
                    <span>{currentGateData.doc.footer}</span>
                    <span className="font-medium text-[var(--paper-ink)]">
                      CHECK {currentGateData.num} PASSED
                    </span>
                  </div>
                </PaperCard>

                {/* SMALL DARK PANEL: What That Gate Does to the Answer */}
                <Panel className="bg-[var(--surface-2)] p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--line)] pb-3">
                    <StatusChip variant={currentGateData.action.variant} indicator>
                      {currentGateData.action.chip}
                    </StatusChip>
                    <span className="font-mono text-[11px] text-[var(--text-faint)]">
                      CHECK VERDICT
                    </span>
                  </div>

                  <p className="pt-3 text-[14px] font-medium text-[var(--text)]">
                    {currentGateData.action.summary}
                  </p>

                  <div className="mt-3 space-y-1.5 font-mono text-[11px]">
                    {currentGateData.action.details.map((d) => (
                      <div
                        key={d.label}
                        className="flex flex-wrap items-center justify-between gap-2 text-[var(--text-dim)]"
                      >
                        <span className="text-[var(--text-faint)]">{d.label}:</span>
                        <span className="font-medium text-[var(--text)]">{d.value}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3.5 border-t border-[var(--line)] pt-2.5 text-[12px] font-light text-[var(--text-dim)] leading-relaxed">
                    {currentGateData.action.resultText}
                  </div>
                </Panel>
              </div>
            </div>
          </div>

        {/* ------------------------------------------------------------------ */}
        {/* MOBILE & REDUCED MOTION VIEW (<=820px): THREE STACKED NORMAL BLOCKS */}
        {/* ------------------------------------------------------------------ */}
        <div className="mt-12 block space-y-10 min-[821px]:hidden">
          {GATES.map((gate) => (
            <div key={gate.id} className="space-y-4">
              {/* Gate Header Block */}
              <div className="rounded-[16px] border border-[var(--line)] bg-[var(--surface-2)] p-5">
                <div className="flex items-center justify-between">
                  <StatusChip variant={gate.action.variant}>
                    CHECK {gate.num}
                  </StatusChip>
                  <span className="font-mono text-[11px] text-[var(--text-faint)]">
                    CHECK {gate.num}
                  </span>
                </div>

                <h3 className="mt-3 text-[17px] font-medium text-[var(--text)]">
                  {gate.name}
                </h3>

                <p className="mt-1 text-[13px] font-light leading-[1.6] text-[var(--text-dim)]">
                  {gate.body}
                </p>

                <div className="mt-3 border-t border-[var(--line)] pt-2.5 font-mono text-[11px] text-[var(--text-faint)]">
                  {gate.telemetry}
                </div>
              </div>

              {/* Paper Evidence Document */}
              <PaperCard className="p-4 sm:p-5">
                <div className="flex items-center justify-between border-b border-[var(--paper-line)] pb-2 text-[11px]">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="h-3.5 w-3.5 shrink-0 text-[var(--paper-ink)]" />
                    <span className="truncate font-mono font-semibold text-[var(--paper-ink)]">
                      {gate.doc.title}
                    </span>
                  </div>
                  <span className="shrink-0 rounded bg-[var(--paper-ink)]/10 px-2 py-0.5 font-mono text-[10px] text-[var(--paper-ink)]">
                    {gate.doc.status}
                  </span>
                </div>

                <div className="mt-3 rounded-r border-l-[3px] border-[var(--paper-ink)] bg-[var(--paper-ink)]/10 p-3 text-[12px] leading-relaxed text-[var(--paper-ink)]">
                  <p className="font-mono text-[11px] font-bold uppercase">
                    {gate.doc.clauseTitle}
                  </p>
                  <p className="mt-1 font-medium">{gate.doc.text}</p>
                </div>

                <div className="mt-3 border-t border-[var(--paper-line)] pt-2 font-mono text-[10px] text-[var(--paper-ink)]/60">
                  {gate.doc.footer}
                </div>
              </PaperCard>

              {/* Dark Outcome Panel */}
              <Panel className="bg-[var(--surface-2)] p-4 sm:p-5">
                <div className="flex items-center justify-between border-b border-[var(--line)] pb-2">
                  <StatusChip variant={gate.action.variant} indicator>
                    {gate.action.chip}
                  </StatusChip>
                  <span className="font-mono text-[10px] text-[var(--text-faint)]">
                    CHECK OUTCOME
                  </span>
                </div>

                <p className="mt-2 text-xs font-medium text-[var(--text)]">
                  {gate.action.summary}
                </p>

                <div className="mt-2 space-y-1 font-mono text-[11px] text-[var(--text-dim)]">
                  {gate.action.details.map((d) => (
                    <div key={d.label} className="flex justify-between">
                      <span className="text-[var(--text-faint)]">{d.label}:</span>
                      <span className="text-[var(--text)]">{d.value}</span>
                    </div>
                  ))}
                </div>

                <p className="mt-2.5 border-t border-[var(--line)] pt-2 text-[11px] text-[var(--text-dim)]">
                  {gate.action.resultText}
                </p>
              </Panel>
            </div>
          ))}
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* BELOW THE PINNED PART: "WORKS WITH YOUR HELPDESK" AS A PLAIN LIST  */}
        {/* ------------------------------------------------------------------ */}
        <div className="mt-16 border-t border-[var(--line)] pt-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-[1px] bg-[var(--verified)]" />
              <span className="font-mono text-[12px] uppercase tracking-[0.08em] text-[var(--text-dim)]">
                Works with your helpdesk
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-[12px] text-[var(--text)]">
              {SUPPORT_STACK.map((name, i) => (
                <span key={name} className="flex items-center gap-2">
                  {i > 0 && (
                    <span className="text-[var(--line-strong)] select-none">/</span>
                  )}
                  <span>{name}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

export default SafetyPillars;
