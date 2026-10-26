"use client";

import React, { useState } from "react";
import {
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileText,
  User,
  ArrowRight,
  Clock,
  ExternalLink,
  Check,
  X,
  Edit3,
} from "lucide-react";
import { DemoTag } from "@/components/portal/demo-tag";
import { InspectStatesBar } from "@/components/portal/inspect-states-bar";
import { DashboardSkeleton, DashboardEmptyState, DashboardErrorState } from "@/components/portal/state-views";

interface DraftTicket {
  id: string;
  ticketId: string;
  customerName: string;
  customerEmail: string;
  channel: string;
  query: string;
  draftReply: string;
  confidenceScore: number;
  groundedScore: number;
  citations: { doc: string; chunk: string }[];
  gateStatus: {
    retrieval: boolean;
    hallucinationFree: boolean;
    invariantsPassed: boolean;
  };
  timeAgo: string;
  status: "pending_approval" | "approved" | "edited" | "escalated";
}

const DEMO_TICKETS: DraftTicket[] = [
  {
    id: "t-001",
    ticketId: "ZEN-88412",
    customerName: "Claire Dupont",
    customerEmail: "c.dupont@meridian.fr",
    channel: "Zendesk",
    query: "Can I return an item purchased during the Black Friday promotion after 30 days if it remains in original shrink-wrap?",
    draftReply: "Thank you for reaching out, Claire. According to our Return and Exchange Policy (Section 4.2), promotional and seasonal items must be returned strictly within 30 calendar days of delivery. Because your order was delivered 34 days ago, we cannot generate a return postage label. However, you may exchange the unopened merchandise for store credit within 45 days at any of our flagship retail stores.",
    confidenceScore: 95.8,
    groundedScore: 98.2,
    citations: [
      { doc: "Apex_Return_Policy_v4.pdf", chunk: "Section 4.2: Promotional items are eligible for refund within 30 days; exchange for store credit permitted up to 45 days in original packaging." },
    ],
    gateStatus: { retrieval: true, hallucinationFree: true, invariantsPassed: true },
    timeAgo: "4m ago",
    status: "pending_approval",
  },
  {
    id: "t-002",
    ticketId: "ZEN-88410",
    customerName: "Taro Tanaka",
    customerEmail: "tanaka@tokyo-import.jp",
    channel: "Freshdesk",
    query: "Our cargo shipment package arrived damaged with broken seals. What documentation is required for filing an insurance reimbursement?",
    draftReply: "Hello Taro. For freight shipments received with breached tamper seals or structural damage, Section 8.1 of our Carriage Terms requires: (1) high-resolution photographs of the intact shipping label and pallet seal before unpacking, (2) an annotated Bill of Lading noting exterior damage upon carrier receipt, and (3) a formal damaged-goods report submitted within 72 hours of delivery. I have flagged this ticket for your dedicated freight agent to dispatch a surveyor.",
    confidenceScore: 94.2,
    groundedScore: 96.0,
    citations: [
      { doc: "Beacon_Freight_SLA_2026.pdf", chunk: "Clause 8.1: Seal breaches require photographic documentation, annotated BOL, and notification within 72h." },
    ],
    gateStatus: { retrieval: true, hallucinationFree: true, invariantsPassed: true },
    timeAgo: "12m ago",
    status: "pending_approval",
  },
  {
    id: "t-003",
    ticketId: "ZEN-88408",
    customerName: "Sarah Jenkins",
    customerEmail: "s.jenkins@acme.org",
    channel: "Zendesk",
    query: "We want to renew our annual enterprise retainer but need an updated W-9 and tax residency certificate.",
    draftReply: "Hi Sarah. Our billing operations team provides updated W-9 documentation and Certificate of Tax Residency upon request. I am handing this ticket directly to Alex in Finance, who will attach the signed forms to this thread within 2 business hours.",
    confidenceScore: 92.5,
    groundedScore: 93.0,
    citations: [
      { doc: "Aegis_Commercial_Terms_v2.pdf", chunk: "Section 11: Tax certifications (W-9 / Form 6166) are issued within 2 business hours via Finance escalation." },
    ],
    gateStatus: { retrieval: true, hallucinationFree: true, invariantsPassed: true },
    timeAgo: "26m ago",
    status: "pending_approval",
  },
];

export default function ConversationsPage() {
  const [tickets, setTickets] = useState<DraftTicket[]>(DEMO_TICKETS);
  const [selectedTicket, setSelectedTicket] = useState<DraftTicket | null>(DEMO_TICKETS[0]);
  const [activeTab, setActiveTab] = useState<"shadow" | "live">("shadow");
  const [viewState, setViewState] = useState<"normal" | "loading" | "empty" | "error">("normal");
  const [approvalsDisabled, setApprovalsDisabled] = useState(false);

  React.useEffect(() => {
    fetch("/api/organization/phase")
      .then((r) => (r.ok ? r.json() : null))
      .then((res) => {
        if (res) {
          const msLeft = new Date(res.shadow_ends_at).getTime() - res.serverTime;
          if (msLeft <= 0 && !res.isSettled) {
            setApprovalsDisabled(true);
          }
          if (!res.isDemo && !res.hasData) {
            setViewState("empty");
          }
        }
      })
      .catch(() => {});
  }, []);

  const handleAction = (ticketId: string, action: "approve" | "reject") => {
    setTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, status: action === "approve" ? "approved" : "escalated" } : t))
    );
    if (selectedTicket?.id === ticketId) {
      setSelectedTicket((prev) =>
        prev ? { ...prev, status: action === "approve" ? "approved" : "escalated" } : null
      );
    }
  };

  if (viewState === "loading") {
    return (
      <div className="space-y-4">
        <div className="flex justify-end gap-2 text-xs font-mono">
          <button onClick={() => setViewState("normal")} className="text-[var(--text-dim)] hover:underline">
            View Normal
          </button>
        </div>
        <DashboardSkeleton rows={5} />
      </div>
    );
  }

  if (viewState === "error") {
    return (
      <div className="space-y-4">
        <DashboardErrorState
          message="Failed to fetch incoming helpdesk webhook events."
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
          title="No draft tickets awaiting approval"
          description="In 14-day Shadow Validation, every incoming ticket generates an AI-verified draft alongside human agent queues. All pending items have been cleared."
          actionLabel="Simulate Incoming Ticket"
          onAction={() => setViewState("normal")}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* State toggle inspector */}
      <InspectStatesBar label="Shadow Queue: 14 Drafts Evaluated" onSelectState={setViewState} />

      {/* Header and Queue Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-[18px] font-medium text-[var(--text)] tracking-tight">
              Conversations &amp; Verification Queue
            </h1>
            <DemoTag />
          </div>
          <p className="text-[12px] text-[var(--text-dim)] mt-0.5">
            Audit AI-generated drafts against source SOP citations before final customer dispatch.
          </p>
        </div>

        {/* Tab switcher: Shadow queue vs Live */}
        <div className="flex items-center gap-1 p-1 rounded-[8px] bg-[var(--surface-2)] border border-[var(--line)] text-[12px] font-mono shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("shadow")}
            className={`px-3 py-1.5 rounded-[6px] transition-colors ${
              activeTab === "shadow"
                ? "bg-[var(--surface)] text-[var(--text)] font-medium shadow-sm border border-[var(--line)]"
                : "text-[var(--text-dim)] hover:text-[var(--text)]"
            }`}
          >
            Shadow Queue ({tickets.filter((t) => t.status === "pending_approval").length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("live")}
            className={`px-3 py-1.5 rounded-[6px] transition-colors ${
              activeTab === "live"
                ? "bg-[var(--surface)] text-[var(--text)] font-medium shadow-sm border border-[var(--line)]"
                : "text-[var(--text-dim)] hover:text-[var(--text)]"
            }`}
          >
            Live Stream (Auto-Resolved)
          </button>
        </div>
      </div>

      {/* Main split-screen: Queue list on left, Inspection pane on right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Ticket List Pane */}
        <div className="lg:col-span-5 rounded-[10px] bg-[var(--surface)] border border-[var(--line)] overflow-hidden">
          <div className="p-3 border-b border-[var(--line)] bg-[var(--surface-2)] flex items-center justify-between text-[12px] font-mono text-[var(--text-dim)]">
            <span>Ticket Queue</span>
            <span>Confidence bar: 92%</span>
          </div>

          <div className="divide-y divide-[var(--line)] max-h-[620px] overflow-y-auto">
            {tickets.map((t) => {
              const isSelected = selectedTicket?.id === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedTicket(t)}
                  className={`w-full text-left p-3.5 transition-colors block ${
                    isSelected ? "bg-[var(--surface-2)]" : "hover:bg-[var(--surface-2)]/50"
                  }`}
                >
                  <div className="flex items-center justify-between font-mono text-[11px] mb-1">
                    <span className="text-[var(--text-dim)]">{t.ticketId} • {t.channel}</span>
                    <span className="text-[var(--text-faint)] tabular-nums">{t.timeAgo}</span>
                  </div>
                  <p className="text-[13px] font-medium text-[var(--text)] line-clamp-1 mb-1">
                    {t.query}
                  </p>
                  <div className="flex items-center justify-between text-[11px] font-mono pt-1">
                    <span className="text-[var(--text-faint)] truncate max-w-[140px]">{t.customerName}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[var(--glow)] tabular-nums">{t.confidenceScore}%</span>
                      <span
                        className={`inline-block px-1.5 py-0.2 rounded text-[9px] uppercase ${
                          t.status === "approved"
                            ? "bg-[rgba(111,216,166,0.1)] text-[var(--verified)]"
                            : t.status === "escalated"
                            ? "bg-[rgba(229,100,92,0.1)] text-[var(--blocked)]"
                            : "bg-[rgba(227,179,65,0.1)] text-[var(--warn)]"
                        }`}
                      >
                        {t.status.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Ticket Inspection Pane */}
        {selectedTicket && (
          <div className="lg:col-span-7 rounded-[10px] bg-[var(--surface)] border border-[var(--line)] p-5 space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-[var(--line)] pb-3">
              <div>
                <div className="flex items-center gap-2 font-mono text-[11px] text-[var(--text-faint)] mb-1">
                  <span>{selectedTicket.ticketId}</span>
                  <span>•</span>
                  <span>{selectedTicket.channel} Webhook</span>
                  <span>•</span>
                  <DemoTag />
                </div>
                <h2 className="text-[15px] font-medium text-[var(--text)]">
                  {selectedTicket.customerName}{" "}
                  <span className="text-[12px] font-mono text-[var(--text-dim)] font-normal">
                    &lt;{selectedTicket.customerEmail}&gt;
                  </span>
                </h2>
              </div>

              <div className="text-right font-mono text-[11px]">
                <p className="text-[var(--text-faint)]">Confidence Score</p>
                <p className="text-[16px] font-medium tabular-nums text-[var(--glow)]">
                  {selectedTicket.confidenceScore}%
                </p>
              </div>
            </div>

            {/* Customer Query */}
            <div className="p-3.5 rounded-[8px] bg-[var(--surface-2)] border border-[var(--line)] space-y-1">
              <span className="text-[10px] font-mono uppercase text-[var(--text-faint)] block">
                Incoming Customer Query
              </span>
              <p className="text-[13px] text-[var(--text)] leading-relaxed">
                {selectedTicket.query}
              </p>
            </div>

            {/* AI Draft Response */}
            <div className="p-3.5 rounded-[8px] bg-[var(--canvas)] border border-[var(--line)] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase text-[var(--glow)] font-medium">
                  Verified Draft Response (Shadow Validation)
                </span>
                <span className="text-[10px] font-mono text-[var(--text-faint)]">
                  Edit distance: 0 characters
                </span>
              </div>
              <p className="text-[13px] text-[var(--text)] leading-relaxed font-sans">
                {selectedTicket.draftReply}
              </p>
            </div>

            {/* 3-Gate Deterministic Verification Invariants */}
            <div className="p-3 rounded-[8px] bg-[var(--surface-2)] border border-[var(--line)] space-y-2">
              <span className="text-[10px] font-mono uppercase text-[var(--text-faint)] block">
                3-Gate Safety Invariants Verification
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono text-[11px]">
                <div className="flex items-center gap-1.5 text-[var(--verified)]">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Gate 1: Grounded</span>
                </div>
                <div className="flex items-center gap-1.5 text-[var(--verified)]">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Gate 2: Zero Hallucination</span>
                </div>
                <div className="flex items-center gap-1.5 text-[var(--verified)]">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Gate 3: Invariants Passed</span>
                </div>
              </div>
            </div>

            {/* Source Citations */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono uppercase text-[var(--text-faint)] block">
                Source Document Citations
              </span>
              {selectedTicket.citations.map((c, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-[6px] bg-[var(--surface-2)] border border-[var(--line)] font-mono text-[11px] space-y-1"
                >
                  <div className="flex items-center gap-1.5 text-[var(--glow)]">
                    <FileText className="w-3.5 h-3.5" />
                    <span className="font-semibold">{c.doc}</span>
                  </div>
                  <p className="text-[var(--text-dim)] text-[11px] font-sans italic pl-5">
                    &ldquo;{c.chunk}&rdquo;
                  </p>
                </div>
              ))}
            </div>

            {/* Shadow Validation Actions */}
            <div className="pt-2 border-t border-[var(--line)] flex flex-wrap items-center justify-between gap-2">
              <div className="text-[11px] font-mono text-[var(--text-faint)]">
                Status: <strong className="text-[var(--text)] font-medium uppercase">{selectedTicket.status.replace("_", " ")}</strong>
              </div>

              <div className="flex items-center gap-2">
                {approvalsDisabled ? (
                  <span className="text-[12px] font-mono text-[var(--blocked)]">
                    Approvals disabled (Shadow Validation ended · Settle in Billing)
                  </span>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => handleAction(selectedTicket.id, "reject")}
                      className="h-8 px-3 rounded-[6px] bg-[var(--surface-2)] hover:bg-[var(--surface-2)]/80 border border-[rgba(229,100,92,0.3)] text-[var(--blocked)] text-[12px] font-mono flex items-center gap-1.5 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Escalate to Human</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAction(selectedTicket.id, "approve")}
                      className="h-8 px-3.5 rounded-[6px] bg-[var(--paper)] text-[var(--paper-ink)] hover:bg-white text-[12px] font-medium flex items-center gap-1.5 transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Approve Draft as is</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


