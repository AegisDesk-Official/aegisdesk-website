'use client';

import React, { useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  ChevronDown,
  ChevronUp,
  CornerDownRight,
  Edit3,
  FileText,
  Send,
  ShieldAlert,
  ShieldCheck,
  User,
  Users,
} from "lucide-react";
import { Container } from "@/components/ui/container";
import { Panel } from "@/components/ui/panel";
import { PaperCard } from "@/components/ui/paper-card";
import { Label } from "@/components/ui/label";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

type TabType = "verified" | "generic" | "escalated" | "try";

interface PolicyClause {
  id: string;
  section: string;
  title: string;
  text: string;
}

const POLICY_CLAUSES: PolicyClause[] = [
  {
    id: "3.1",
    section: "Section 3.1",
    title: "Sealed & Unopened Hardware",
    text: "Standard hardware returns are accepted within 30 calendar days of delivery for unopened items in factory shrink-wrap. Full refund is credited to original payment method upon receipt.",
  },
  {
    id: "3.2",
    section: "Section 3.2",
    title: "Opened Audio Hardware",
    text: "Eligible within 14 calendar days of carrier delivery. Requires original serialized packaging, complete included accessories, and a 10% inspection and restocking fee.",
  },
  {
    id: "3.3",
    section: "Section 3.3",
    title: "Software & Digital Licenses",
    text: "Digital licenses, provisioned API keys, and custom seat allocations are strictly non-refundable once deployed to production.",
  },
  {
    id: "4.1",
    section: "Section 4.1",
    title: "Refund Settlement Timing",
    text: "Approved RMA settlements are credited to the customer's original payment method within 3 business days of warehouse receipt and serial scan.",
  },
];

const PREPARED_QUESTIONS = [
  {
    id: "opened-headphones",
    chipLabel: "Can I return opened headphones?",
    customer: {
      initials: "SC",
      name: "Sarah Chen",
      role: "Customer",
      question: "Can I return opened wireless headphones if I still have the box?",
    },
    covered: true,
    clauseId: "3.2",
    reply: {
      lead: "Yes. Opened headphones and audio gear qualify for return within 14 days of delivery when returned in the original serialized box with a 10% restocking inspection fee ",
      chip1: { label: "Return Policy §3.2", clauseId: "3.2" },
      mid: ". Once depot inspection passes, the credit is issued back to your original payment method within 3 business days ",
      chip2: { label: "Return Policy §4.1", clauseId: "4.1" },
      tail: ".",
    },
  },
  {
    id: "refund-timing",
    chipLabel: "How long until my refund appears?",
    customer: {
      initials: "MR",
      name: "Marcus Reid",
      role: "Customer",
      question: "My return was received at your depot yesterday. When will the refund hit my card?",
    },
    covered: true,
    clauseId: "4.1",
    reply: {
      lead: "Your refund is scheduled within 3 business days of warehouse receipt and serial inspection ",
      chip1: { label: "Return Policy §4.1", clauseId: "4.1" },
      mid: ". Credits return automatically to your original payment method",
      chip2: null,
      tail: ".",
    },
  },
  {
    id: "wholesale-pricing",
    chipLabel: "Do you offer wholesale bulk discounts?",
    customer: {
      initials: "EL",
      name: "Elena Rostova",
      role: "Operations Director",
      question: "Can you provide custom wholesale pricing tiers if we order 150 hardware units next month?",
    },
    covered: false,
    clauseId: null,
    summary: {
      status: "Wholesale discount tiers are not covered in your public Return Policy.",
      action: "AegisDesk stepped aside from guessing and routed this inquiry directly to your commercial sales team.",
    },
  },
];

export function VerificationWorkbench({ demoEnabled = true }: { demoEnabled?: boolean }) {
  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Active tab state: "verified" | "generic" | "escalated" | "try"
  const [activeTab, setActiveTab] = useState<TabType>("verified");

  // Highlighted clause in the Left Column
  const [highlightedClauseId, setHighlightedClauseId] = useState<string>("3.2");

  // Mobile policy toggle
  const [showFullPolicyMobile, setShowFullPolicyMobile] = useState<boolean>(false);

  // Action button states for "Verified reply" tab
  const [approved, setApproved] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editedReply, setEditedReply] = useState<string>(
    "Yes. Opened headphones and audio gear qualify for return within 14 days of delivery when returned in the original serialized box with a 10% restocking inspection fee. Once depot inspection passes, the credit is issued back to your original payment method within 3 business days."
  );
  const [escalated, setEscalated] = useState<boolean>(false);

  // "Try it yourself" tab state
  const [selectedTryIdx, setSelectedTryIdx] = useState<number>(0);

  // Live test flag per specification: rendered only when LIVE_TEST_ENABLED=true
  const liveTestEnabled =
    typeof process !== "undefined" &&
    (process.env.NEXT_PUBLIC_LIVE_TEST_ENABLED === "true" || process.env.LIVE_TEST_ENABLED === "true");
  const [liveQuestion, setLiveQuestion] = useState<string>("");
  const [liveSubmitting, setLiveSubmitting] = useState<boolean>(false);
  const [liveAnswer, setLiveAnswer] = useState<string | null>(null);

  // Section entrance animation per DESIGN.md:
  // "Sections: content fades and rises 16px once when it enters (trigger at top 85%). Content must be visible if JS fails."
  useGSAP(
    () => {
      if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        return;
      }
      if (!contentRef.current) return;

      gsap.fromTo(
        contentRef.current,
        { opacity: 0, y: 16 },
        {
          opacity: 1,
          y: 0,
          duration: 0.65,
          ease: "power2.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 85%",
            toggleActions: "play none none none",
          },
        }
      );
    },
    { scope: sectionRef }
  );

  const scrollToClause = (clauseId: string) => {
    setHighlightedClauseId(clauseId);
    if (typeof window !== "undefined") {
      const el = document.getElementById(`clause-${clauseId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setApproved(false);
    setIsEditing(false);
    setEscalated(false);
    if (tab === "verified") {
      setHighlightedClauseId("3.2");
    } else if (tab === "generic") {
      setHighlightedClauseId("3.2");
    } else if (tab === "escalated") {
      setHighlightedClauseId("3.2");
    } else if (tab === "try") {
      const current = PREPARED_QUESTIONS[selectedTryIdx];
      setHighlightedClauseId(current.clauseId || "3.2");
    }
  };

  const handleTryChipClick = (idx: number) => {
    setSelectedTryIdx(idx);
    const q = PREPARED_QUESTIONS[idx];
    if (q.clauseId) {
      setHighlightedClauseId(q.clauseId);
      scrollToClause(q.clauseId);
    }
  };

  const activeTryQuestion = PREPARED_QUESTIONS[selectedTryIdx];

  return (
    <section
      id="workbench"
      ref={sectionRef}
      aria-labelledby="workbench-heading"
      className="relative w-full border-t border-[var(--line)] bg-[var(--canvas)] py-[88px] lg:py-[140px]"
    >
      <div id="demo" className="sr-only" aria-hidden="true" />
      <div id="comparison" className="sr-only" aria-hidden="true" />

      <Container>
        <div ref={contentRef} className="space-y-12">
          {/* Section Header */}
          <div className="max-w-[760px] space-y-4">
            <Label>02 // VERIFICATION WORKBENCH</Label>
            <h2
              id="workbench-heading"
              className="font-sans text-[36px] font-light leading-[1.05] tracking-[-0.03em] text-[var(--text)] sm:text-[44px] md:text-[52px]"
            >
              See how every reply is checked against your documents before it is sent.
            </h2>
            <p className="max-w-[62ch] text-[17px] leading-[1.6] text-[var(--text-dim)]">
              Test the workbench below. Every sentence links to a quoted source, and questions your documents do not cover go to your team.
            </p>
          </div>

          {/* Two-Column Responsive Layout: Left Policy + Right Helpdesk */}
          <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
            {/* ================================================================== */}
            {/* LEFT COLUMN (5 Cols): Your policy (PaperCard Surface)              */}
            {/* ================================================================== */}
            <div className="min-w-0 w-full lg:col-span-5 order-1">
              <div className="mb-3 flex items-center justify-between">
                <span className="font-mono text-[12px] uppercase tracking-[0.08em] text-[var(--text-dim)]">
                  YOUR POLICY
                </span>
                <span className="font-mono text-[11px] text-[var(--text-faint)]">
                  SOURCE EVIDENCE
                </span>
              </div>

              {/* TACTILE PAPER SURFACE FOR POLICY */}
              <PaperCard className="relative font-sans p-6 sm:p-7 shadow-[0_8px_30px_rgba(0,0,0,0.18)]">
                {/* Header (No File Hashes) */}
                <div className="border-b border-[var(--paper-line)] pb-3.5 mb-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="h-4 w-4 shrink-0 text-[var(--paper-ink)]" />
                      <h3 className="font-mono text-[13px] font-bold text-[var(--paper-ink)] tracking-tight truncate">
                        Return &amp; Refund Policy
                      </h3>
                    </div>
                    <span className="rounded-[4px] bg-[var(--paper-ink)]/10 px-2 py-0.5 font-mono text-[10px] uppercase font-semibold tracking-[0.06em] text-[var(--paper-ink)]">
                      ACTIVE SOP
                    </span>
                  </div>
                  <p className="mt-1 text-[11.5px] text-[var(--paper-ink)]/65 font-sans">
                    Client knowledge base document indexed for automated verification.
                  </p>
                </div>

                {/* Mobile Collapsible View vs Desktop Full View */}
                <div className="space-y-3.5 text-[12.5px] leading-[1.65] text-[var(--paper-ink)]/90">
                  {POLICY_CLAUSES.map((clause) => {
                    const isCited = highlightedClauseId === clause.id;
                    // On mobile, if collapsed, show only the currently cited clause
                    return (
                      <div
                        key={clause.id}
                        id={`clause-${clause.id}`}
                        className={`rounded-[8px] p-3 transition-all duration-200 ${
                          isCited
                            ? "border-l-[3px] border-[var(--verified)] bg-[rgba(111,216,166,0.14)] text-[var(--paper-ink)] shadow-sm"
                            : "border-l border-[var(--paper-line)] bg-transparent opacity-75 hover:opacity-100"
                        } ${!showFullPolicyMobile && !isCited ? "hidden sm:block" : "block"}`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.04em] text-[var(--paper-ink)]">
                            {clause.section} — {clause.title}
                          </p>
                          {isCited && (
                            <span className="inline-flex items-center gap-1 rounded bg-[var(--paper-ink)]/10 px-1.5 py-0.5 font-mono text-[9.5px] font-bold tracking-[0.04em] text-[var(--paper-ink)]">
                              ★ CITED IN REPLY
                            </span>
                          )}
                        </div>
                        <p className={isCited ? "font-normal text-[var(--paper-ink)]" : "text-[var(--paper-ink)]/80"}>
                          {clause.text}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Mobile Collapse / Expand Button */}
                <div className="mt-3 block sm:hidden border-t border-[var(--paper-line)] pt-3">
                  <button
                    type="button"
                    onClick={() => setShowFullPolicyMobile((prev) => !prev)}
                    className="inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold text-[var(--paper-ink)] underline underline-offset-4"
                  >
                    {showFullPolicyMobile ? (
                      <>
                        <ChevronUp className="h-3.5 w-3.5" />
                        <span>Hide full policy</span>
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-3.5 w-3.5" />
                        <span>Show full policy ({POLICY_CLAUSES.length} clauses)</span>
                      </>
                    )}
                  </button>
                </div>
              </PaperCard>

              {/* Quiet Evidence Footnote */}
              <div className="mt-3.5 flex items-center gap-2 font-mono text-[11px] text-[var(--text-dim)]">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--verified)]" />
                <span>Isolated private workspace · Zero data shared across accounts</span>
              </div>
            </div>

            {/* ================================================================== */}
            {/* RIGHT COLUMN (7 Cols): Helpdesk Conversation (Zendesk / Intercom)  */}
            {/* ================================================================== */}
            <div className="min-w-0 w-full lg:col-span-7 order-2">
              <div className="mb-3 flex items-center justify-between">
                <span className="font-mono text-[12px] uppercase tracking-[0.08em] text-[var(--text-dim)]">
                  HELPDESK CONVERSATION
                </span>
                <span className="font-mono text-[11px] text-[var(--text-faint)]">
                  ZENDESK &amp; INTERCOM INTEGRATION
                </span>
              </div>

              {/* Main Helpdesk Panel */}
              <Panel className="p-5 sm:p-6 space-y-5">
                {/* 1. Tabs across top in plain words */}
                <div
                  role="tablist"
                  aria-label="Helpdesk conversation views"
                  className="grid grid-cols-2 sm:grid-cols-4 gap-2 border-b border-[var(--line)] pb-4"
                >
                  <button
                    type="button"
                    role="tab"
                    id="tab-verified"
                    aria-controls="panel-verified"
                    aria-selected={activeTab === "verified"}
                    onClick={() => handleTabChange("verified")}
                    className={`rounded-[8px] border px-3 py-2 text-center sm:text-left transition-colors font-mono text-[12px] ${
                      activeTab === "verified"
                        ? "border-[var(--verified)]/50 bg-[var(--surface-2)] text-[var(--text)] font-semibold shadow-sm"
                        : "border-transparent bg-transparent text-[var(--text-dim)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]/50"
                    }`}
                  >
                    Verified reply
                  </button>

                  <button
                    type="button"
                    role="tab"
                    id="tab-generic"
                    aria-controls="panel-generic"
                    aria-selected={activeTab === "generic"}
                    onClick={() => handleTabChange("generic")}
                    className={`rounded-[8px] border px-3 py-2 text-center sm:text-left transition-colors font-mono text-[12px] ${
                      activeTab === "generic"
                        ? "border-[var(--blocked)]/50 bg-[var(--surface-2)] text-[var(--text)] font-semibold shadow-sm"
                        : "border-transparent bg-transparent text-[var(--text-dim)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]/50"
                    }`}
                  >
                    Generic AI
                  </button>

                  <button
                    type="button"
                    role="tab"
                    id="tab-escalated"
                    aria-controls="panel-escalated"
                    aria-selected={activeTab === "escalated"}
                    onClick={() => handleTabChange("escalated")}
                    className={`rounded-[8px] border px-3 py-2 text-center sm:text-left transition-colors font-mono text-[12px] ${
                      activeTab === "escalated"
                        ? "border-[var(--warn)]/50 bg-[var(--surface-2)] text-[var(--text)] font-semibold shadow-sm"
                        : "border-transparent bg-transparent text-[var(--text-dim)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]/50"
                    }`}
                  >
                    Handed to your team
                  </button>

                  <button
                    type="button"
                    role="tab"
                    id="tab-try"
                    aria-controls="panel-try"
                    aria-selected={activeTab === "try"}
                    onClick={() => handleTabChange("try")}
                    className={`rounded-[8px] border px-3 py-2 text-center sm:text-left transition-colors font-mono text-[12px] ${
                      activeTab === "try"
                        ? "border-[var(--line-strong)] bg-[var(--surface-2)] text-[var(--text)] font-semibold shadow-sm"
                        : "border-transparent bg-transparent text-[var(--text-dim)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]/50"
                    }`}
                  >
                    Try it yourself
                  </button>
                </div>

                {/* ================================================================ */}
                {/* TAB 1: VERIFIED REPLY                                            */}
                {/* ================================================================ */}
                {activeTab === "verified" && (
                  <div id="panel-verified" role="tabpanel" aria-labelledby="tab-verified" className="space-y-4">
                    {/* Customer Message Bubble */}
                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 shrink-0 rounded-full bg-[var(--surface-2)] border border-[var(--line)] flex items-center justify-center font-mono text-[11px] font-bold text-[var(--text)]">
                        SC
                      </div>
                      <div className="space-y-1 max-w-[85%]">
                        <div className="flex items-center gap-2">
                          <span className="font-sans text-[12px] font-semibold text-[var(--text)]">Sarah Chen</span>
                          <span className="font-mono text-[10px] text-[var(--text-faint)]">Customer</span>
                        </div>
                        <div className="rounded-[12px] bg-[var(--surface-2)] border border-[var(--line)] p-3.5 text-[13.5px] font-light leading-relaxed text-[var(--text)]">
                          Can I return opened wireless headphones if I still have the box?
                        </div>
                      </div>
                    </div>

                    {/* AegisDesk Suggested Reply Bubble */}
                    <div className="flex items-start gap-3 pl-2 sm:pl-4">
                      <CornerDownRight className="h-4 w-4 shrink-0 text-[var(--verified)] mt-3" />
                      <div className="space-y-2 w-full">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-sans text-[12px] font-semibold text-[var(--verified)]">
                              AegisDesk suggested reply
                            </span>
                            <span className="rounded bg-[var(--verified)]/10 border border-[var(--verified)]/20 px-1.5 py-0.2 font-mono text-[9px] uppercase font-semibold text-[var(--verified)]">
                              DRAFT
                            </span>
                          </div>
                        </div>

                        {/* Bubble with soft green outline */}
                        <div className="rounded-[12px] border border-[var(--verified)]/40 bg-[var(--surface-2)]/80 p-4 space-y-3">
                          {isEditing ? (
                            <textarea
                              rows={4}
                              value={editedReply}
                              onChange={(e) => setEditedReply(e.target.value)}
                              className="w-full rounded-[6px] border border-[var(--line-strong)] bg-[var(--surface)] p-2.5 font-sans text-[13.5px] text-[var(--text)] focus:outline-none focus:border-[var(--verified)] leading-relaxed"
                            />
                          ) : (
                            <div className="text-[13.5px] font-light leading-[1.7] text-[var(--text)]">
                              Yes. Opened headphones and audio gear qualify for return within 14 days of delivery when returned in the original serialized box with a 10% restocking inspection fee{" "}
                              <button
                                type="button"
                                onClick={() => scrollToClause("3.2")}
                                title="Click to view Section 3.2 in your policy"
                                className="inline-flex items-center gap-1 rounded-[6px] border border-[var(--verified)]/40 bg-[rgba(111,216,166,0.12)] px-2 py-0.5 font-mono text-[11px] font-medium text-[var(--verified)] transition-colors hover:border-[var(--verified)]"
                              >
                                Return Policy §3.2
                              </button>
                              . Once depot inspection passes, the credit is issued back to your original payment method within 3 business days{" "}
                              <button
                                type="button"
                                onClick={() => scrollToClause("4.1")}
                                title="Click to view Section 4.1 in your policy"
                                className="inline-flex items-center gap-1 rounded-[6px] border border-[var(--verified)]/40 bg-[rgba(111,216,166,0.12)] px-2 py-0.5 font-mono text-[11px] font-medium text-[var(--verified)] transition-colors hover:border-[var(--verified)]"
                              >
                                Return Policy §4.1
                              </button>
                              .
                            </div>
                          )}

                          {/* Plain Status Line */}
                          <div className="flex items-center gap-1.5 border-t border-[var(--line)] pt-3 text-[12px] font-medium text-[var(--verified)] font-mono">
                            <Check className="h-4 w-4 shrink-0 text-[var(--verified)]" />
                            <span>Matches your Return Policy</span>
                          </div>
                        </div>

                        {/* Interactive Action Buttons */}
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              setApproved(true);
                              setIsEditing(false);
                            }}
                            className={`px-4 py-2 rounded-[10px] font-mono text-[11.5px] font-medium transition-colors ${
                              approved
                                ? "border border-[var(--verified)]/40 bg-[rgba(111,216,166,0.1)] text-[var(--verified)]"
                                : "bg-[var(--paper)] text-[var(--paper-ink)] hover:bg-white active:scale-[0.99]"
                            }`}
                          >
                            {approved ? "✓ Approved & sent via helpdesk" : "Approve & send"}
                          </button>

                          <button
                            type="button"
                            onClick={() => setIsEditing((prev) => !prev)}
                            className="px-3.5 py-2 rounded-[10px] font-mono text-[11.5px] font-medium border border-[var(--line)] bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors"
                          >
                            {isEditing ? "Save draft" : "Edit"}
                          </button>

                          <button
                            type="button"
                            onClick={() => setEscalated(true)}
                            className={`px-3.5 py-2 rounded-[10px] font-mono text-[11.5px] font-medium border transition-colors ${
                              escalated
                                ? "border-[var(--warn)]/40 bg-[rgba(227,179,65,0.08)] text-[var(--warn)]"
                                : "border-[var(--line)] bg-[var(--surface)] text-[var(--text-dim)] hover:text-white"
                            }`}
                          >
                            {escalated ? "Escalated to human support queue" : "Escalate to your team"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ================================================================ */}
                {/* TAB 2: GENERIC AI                                                */}
                {/* ================================================================ */}
                {activeTab === "generic" && (
                  <div id="panel-generic" role="tabpanel" aria-labelledby="tab-generic" className="space-y-4">
                    {/* Customer Message Bubble */}
                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 shrink-0 rounded-full bg-[var(--surface-2)] border border-[var(--line)] flex items-center justify-center font-mono text-[11px] font-bold text-[var(--text)]">
                        SC
                      </div>
                      <div className="space-y-1 max-w-[85%]">
                        <div className="flex items-center gap-2">
                          <span className="font-sans text-[12px] font-semibold text-[var(--text)]">Sarah Chen</span>
                          <span className="font-mono text-[10px] text-[var(--text-faint)]">Customer</span>
                        </div>
                        <div className="rounded-[12px] bg-[var(--surface-2)] border border-[var(--line)] p-3.5 text-[13.5px] font-light leading-relaxed text-[var(--text)]">
                          Can I return opened wireless headphones if I still have the box?
                        </div>
                      </div>
                    </div>

                    {/* Generic Chatbot Inventing Policy */}
                    <div className="flex items-start gap-3 pl-2 sm:pl-4">
                      <CornerDownRight className="h-4 w-4 shrink-0 text-[var(--blocked)] mt-3" />
                      <div className="space-y-2 w-full">
                        <div className="flex items-center gap-2">
                          <span className="font-sans text-[12px] font-semibold text-[var(--blocked)]">
                            Standard Unchecked Chatbot
                          </span>
                          <span className="rounded bg-[var(--blocked)]/10 border border-[var(--blocked)]/20 px-1.5 py-0.2 font-mono text-[9px] uppercase font-semibold text-[var(--blocked)]">
                            UNCHECKED
                          </span>
                        </div>

                        {/* Made-up sentence marked in red */}
                        <div className="rounded-[12px] border border-[var(--blocked)]/30 bg-[var(--surface-2)] p-4 space-y-3">
                          <div className="text-[13.5px] font-light leading-[1.7] text-[var(--text-dim)]">
                            Yes, absolutely!{" "}
                            <span className="text-[var(--blocked)] bg-[rgba(229,100,92,0.12)] px-1 py-0.5 rounded border border-[var(--blocked)]/30">
                              We offer a 60-day money-back policy on all headphone orders, even when opened, and I have initiated a full 100% cash refund with zero restocking fees back to your card right now.
                            </span>
                          </div>

                          {/* Caption */}
                          <div className="flex items-center gap-1.5 border-t border-[var(--line)] pt-3 text-[12px] font-medium text-[var(--blocked)] font-mono">
                            <AlertTriangle className="h-4 w-4 shrink-0" />
                            <span>No source found for this sentence.</span>
                          </div>
                        </div>

                        <p className="text-[12px] text-[var(--text-dim)] leading-relaxed pt-1">
                          Generic chatbots invent policies to sound helpful—promising refund windows and fee waivers that violate your real terms and create customer disputes.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* ================================================================ */}
                {/* TAB 3: HANDED TO YOUR TEAM                                       */}
                {/* ================================================================ */}
                {activeTab === "escalated" && (
                  <div id="panel-escalated" role="tabpanel" aria-labelledby="tab-escalated" className="space-y-4">
                    {/* Customer Message Bubble: Uncovered Question */}
                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 shrink-0 rounded-full bg-[var(--surface-2)] border border-[var(--line)] flex items-center justify-center font-mono text-[11px] font-bold text-[var(--text)]">
                        DM
                      </div>
                      <div className="space-y-1 max-w-[85%]">
                        <div className="flex items-center gap-2">
                          <span className="font-sans text-[12px] font-semibold text-[var(--text)]">David Miller</span>
                          <span className="font-mono text-[10px] text-[var(--text-faint)]">Enterprise Account</span>
                        </div>
                        <div className="rounded-[12px] bg-[var(--surface-2)] border border-[var(--line)] p-3.5 text-[13.5px] font-light leading-relaxed text-[var(--text)]">
                          We bought 40 units on a custom enterprise PO 47 days ago—can you waive the restocking fee and swap them for the Pro model?
                        </div>
                      </div>
                    </div>

                    {/* AI Stepping Aside with Summary */}
                    <div className="flex items-start gap-3 pl-2 sm:pl-4">
                      <CornerDownRight className="h-4 w-4 shrink-0 text-[var(--warn)] mt-3" />
                      <div className="space-y-2 w-full">
                        <div className="flex items-center gap-2">
                          <span className="font-sans text-[12px] font-semibold text-[var(--warn)]">
                            AegisDesk · Stepped aside
                          </span>
                          <span className="rounded bg-[var(--warn)]/10 border border-[var(--warn)]/20 px-1.5 py-0.2 font-mono text-[9px] uppercase font-semibold text-[var(--warn)]">
                            ROUTED TO TEAM
                          </span>
                        </div>

                        <div className="rounded-[12px] border border-[var(--warn)]/40 bg-[var(--surface-2)] p-4 space-y-3">
                          <p className="text-[13px] text-[var(--text)] font-light leading-relaxed">
                            This question is not covered in your documents. AegisDesk stepped aside instead of guessing.
                          </p>

                          <div className="border-t border-[var(--line)] pt-3 space-y-2 text-[12px] font-mono">
                            <div className="text-[var(--text-faint)] uppercase tracking-[0.06em] text-[10px]">
                              Agent Staging Summary:
                            </div>
                            <div className="space-y-1 text-[var(--text-dim)]">
                              <p>
                                <span className="text-[var(--text)] font-medium">Customer:</span> Enterprise PO (40 units, Day 47 post-delivery)
                              </p>
                              <p>
                                <span className="text-[var(--text)] font-medium">Policy rule:</span> Hardware returns past 30 days are not covered by Return Policy §3.2.
                              </p>
                              <p>
                                <span className="text-[var(--text)] font-medium">Action:</span> Draft held back from customer to prevent unauthorized promises. Handed to human support queue with purchase context.
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Agent Handoff Controls */}
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            type="button"
                            className="px-3.5 py-1.5 rounded-[8px] font-mono text-[11px] font-medium border border-[var(--line)] bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors"
                          >
                            Assign to me
                          </button>
                          <button
                            type="button"
                            className="px-3.5 py-1.5 rounded-[8px] font-mono text-[11px] font-medium border border-[var(--line)] bg-[var(--surface)] text-[var(--text-dim)] hover:text-white transition-colors"
                          >
                            Reply to David
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ================================================================ */}
                {/* TAB 4: TRY IT YOURSELF                                           */}
                {/* ================================================================ */}
                {activeTab === "try" && (
                  <div id="panel-try" role="tabpanel" aria-labelledby="tab-try" className="space-y-4">
                    {/* Header instruction line */}
                    <div className="space-y-2">
                      <p className="font-mono text-[12px] text-[var(--text-dim)]">
                        Example tickets on a sample policy.
                      </p>

                      {/* 3 suggested question chips */}
                      <div className="flex flex-wrap gap-2">
                        {PREPARED_QUESTIONS.map((q, idx) => (
                          <button
                            key={q.id}
                            type="button"
                            onClick={() => handleTryChipClick(idx)}
                            className={`rounded-[8px] border px-3 py-1.5 font-mono text-[11px] transition-colors text-left ${
                              selectedTryIdx === idx
                                ? "border-[var(--verified)] bg-[rgba(111,216,166,0.1)] text-[var(--verified)] font-medium"
                                : "border-[var(--line)] bg-[var(--surface-2)] text-[var(--text-dim)] hover:text-[var(--text)]"
                            }`}
                          >
                            {q.chipLabel}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Active Question Display */}
                    <div className="space-y-3 pt-2">
                      {/* Customer Question Bubble */}
                      <div className="flex items-start gap-3">
                        <div className="h-8 w-8 shrink-0 rounded-full bg-[var(--surface-2)] border border-[var(--line)] flex items-center justify-center font-mono text-[11px] font-bold text-[var(--text)]">
                          {activeTryQuestion.customer.initials}
                        </div>
                        <div className="space-y-1 max-w-[85%]">
                          <div className="flex items-center gap-2">
                            <span className="font-sans text-[12px] font-semibold text-[var(--text)]">
                              {activeTryQuestion.customer.name}
                            </span>
                            <span className="font-mono text-[10px] text-[var(--text-faint)]">
                              {activeTryQuestion.customer.role}
                            </span>
                          </div>
                          <div className="rounded-[12px] bg-[var(--surface-2)] border border-[var(--line)] p-3.5 text-[13.5px] font-light leading-relaxed text-[var(--text)]">
                            {activeTryQuestion.customer.question}
                          </div>
                        </div>
                      </div>

                      {/* Reply or Stepping Aside Display */}
                      <div className="flex items-start gap-3 pl-2 sm:pl-4">
                        <CornerDownRight className="h-4 w-4 shrink-0 text-[var(--verified)] mt-3" />
                        <div className="space-y-2 w-full">
                          <div className="flex items-center gap-2">
                            <span className="font-sans text-[12px] font-semibold text-[var(--verified)]">
                              AegisDesk
                            </span>
                            <span className="rounded bg-[var(--verified)]/10 border border-[var(--verified)]/20 px-1.5 py-0.2 font-mono text-[9px] uppercase font-semibold text-[var(--verified)]">
                              {activeTryQuestion.covered ? "VERIFIED REPLY" : "STEPPED ASIDE"}
                            </span>
                          </div>

                          {activeTryQuestion.covered && activeTryQuestion.reply ? (
                            <div className="rounded-[12px] border border-[var(--verified)]/40 bg-[var(--surface-2)]/80 p-4 space-y-3">
                              <div className="text-[13.5px] font-light leading-[1.7] text-[var(--text)]">
                                {activeTryQuestion.reply.lead}
                                {activeTryQuestion.reply.chip1 && (
                                  <button
                                    type="button"
                                    onClick={() => scrollToClause(activeTryQuestion.reply.chip1.clauseId)}
                                    className="inline-flex items-center gap-1 rounded-[6px] border border-[var(--verified)]/40 bg-[rgba(111,216,166,0.12)] px-2 py-0.5 font-mono text-[11px] font-medium text-[var(--verified)] transition-colors hover:border-[var(--verified)]"
                                  >
                                    {activeTryQuestion.reply.chip1.label}
                                  </button>
                                )}
                                {activeTryQuestion.reply.mid}
                                {activeTryQuestion.reply.chip2 && (
                                  <button
                                    type="button"
                                    onClick={() => scrollToClause(activeTryQuestion.reply.chip2!.clauseId)}
                                    className="inline-flex items-center gap-1 rounded-[6px] border border-[var(--verified)]/40 bg-[rgba(111,216,166,0.12)] px-2 py-0.5 font-mono text-[11px] font-medium text-[var(--verified)] transition-colors hover:border-[var(--verified)]"
                                  >
                                    {activeTryQuestion.reply.chip2.label}
                                  </button>
                                )}
                                {activeTryQuestion.reply.tail}
                              </div>

                              <div className="flex items-center gap-1.5 border-t border-[var(--line)] pt-3 text-[12px] font-medium text-[var(--verified)] font-mono">
                                <Check className="h-4 w-4 shrink-0 text-[var(--verified)]" />
                                <span>Matches your Return Policy</span>
                              </div>
                            </div>
                          ) : (
                            <div className="rounded-[12px] border border-[var(--warn)]/40 bg-[var(--surface-2)] p-4 space-y-2">
                              <p className="text-[13px] font-light text-[var(--text)] leading-relaxed">
                                {activeTryQuestion.summary?.status}
                              </p>
                              <p className="text-[12px] font-mono text-[var(--text-dim)] border-t border-[var(--line)] pt-2">
                                {activeTryQuestion.summary?.action}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Live Test Query Box: Rendered ONLY when LIVE_TEST_ENABLED=true */}
                    {liveTestEnabled && (
                      <div className="mt-4 border-t border-[var(--line)] pt-4 space-y-2">
                        <label htmlFor="live-custom-question" className="block font-mono text-[11px] uppercase tracking-[0.06em] text-[var(--text-dim)]">
                          Ask your own question (Max 200 chars):
                        </label>
                        <form
                          onSubmit={async (e) => {
                            e.preventDefault();
                            if (!liveQuestion.trim() || liveSubmitting) return;
                            setLiveSubmitting(true);
                            setLiveAnswer(null);
                            try {
                              const res = await fetch("/api/demo", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ message: liveQuestion.slice(0, 200) }),
                              });
                              const data = await res.json();
                              if (res.ok && data.answer) {
                                setLiveAnswer(data.answer);
                              } else {
                                setLiveAnswer(data.error || "Unable to process inquiry.");
                              }
                            } catch {
                              setLiveAnswer("Connection error. Please try again.");
                            } finally {
                              setLiveSubmitting(false);
                            }
                          }}
                          className="flex items-center gap-2"
                        >
                          <input
                            id="live-custom-question"
                            type="text"
                            maxLength={200}
                            value={liveQuestion}
                            onChange={(e) => setLiveQuestion(e.target.value)}
                            placeholder="Type a policy question..."
                            className="flex-1 rounded-[8px] border border-[var(--line)] bg-[var(--surface-2)] px-3 py-2 text-xs text-[var(--text)] placeholder:text-[var(--text-faint)] focus:outline-none focus:border-[var(--verified)]"
                          />
                          <button
                            type="submit"
                            disabled={liveSubmitting || !liveQuestion.trim()}
                            className="px-3 py-2 rounded-[8px] bg-[var(--paper)] text-[var(--paper-ink)] text-xs font-mono font-medium disabled:opacity-50"
                          >
                            {liveSubmitting ? "Checking..." : "Ask"}
                          </button>
                        </form>
                        {liveAnswer && (
                          <div className="p-3 rounded-[8px] bg-[var(--surface-2)] border border-[var(--line)] text-xs text-[var(--text)] mt-2">
                            {liveAnswer}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </Panel>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

export default VerificationWorkbench;
