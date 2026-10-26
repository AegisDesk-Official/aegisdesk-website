'use client';

import { useId, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import {
  AlertTriangle,
  Check,
  FileCheck2,
  Lock,
  RotateCcw,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { DemoCitation } from "@/lib/validation/demo-types";
import { AnswerParts, CitationToken } from "./answer-parts";

gsap.registerPlugin(useGSAP);

type ConsoleMode = "verified" | "escalated";

const VERIFIED_EXAMPLE: {
  ticketId: string;
  confidence: number;
  latencyMs: number;
  question: string;
  answer: string;
  citations: DemoCitation[];
} = {
  ticketId: "ZD-8492",
  confidence: 98.7,
  latencyMs: 284,
  question: "Can I return opened wireless headphones if I still have the box?",
  answer:
    "Yes. Opened headphones and audio gear qualify for return within 14 days of delivery when returned in the original serialized box with a 10% restocking inspection fee [1]. Once depot inspection passes, the credit is issued back to your original payment method within 3 business days [2].",
  citations: [
    {
      source: "Return_Policy_SOP.pdf",
      page: 3,
      snippet:
        "Section 3.2 — Opened Audio Hardware: Eligible within 14 calendar days of carrier delivery. Requires original serialized packaging and 10% inspection fee.",
    },
    {
      source: "Refund_SLA_Schedule.pdf",
      page: 4,
      snippet:
        "Section 4.1 — Approved RMA settlements are credited to the customer's original payment instrument within 3 business days of warehouse scan.",
    },
  ],
};

const ESCALATED_EXAMPLE = {
  ticketId: "ZD-8499",
  confidence: 38.0,
  threshold: 92.0,
  latencyMs: 192,
  question:
    "We bought 40 units on a custom enterprise PO 47 days ago—can you waive the restocking fee and swap them for the Pro model?",
  reason:
    "Custom B2B Purchase Order (>30 days) is not covered by standard return rules in Return_Policy_SOP.pdf §3.2.",
  handoffSummary: [
    "Customer: Enterprise Account (40 units, Day 47 post-delivery)",
    "Policy Note: Custom B2B hardware swaps past 30 days require account manager approval",
    "Action Taken: AI held back from guessing and routed full context to your Tier-2 Lead in Zendesk",
  ],
};

export function AnswerPreview() {
  const rootRef = useRef<HTMLDivElement>(null);
  const confidenceRef = useRef<HTMLSpanElement>(null);
  const drawerId = useId();

  const [mode, setMode] = useState<ConsoleMode>("verified");
  const [hovered, setHovered] = useState<number | null>(null);
  const [pinned, setPinned] = useState<number | null>(0);
  const [unlocked, setUnlocked] = useState(false);
  const [approved, setApproved] = useState(false);
  const [replayKey, setReplayKey] = useState(0);

  const shown = hovered ?? pinned;
  const activeCitation = shown !== null ? VERIFIED_EXAMPLE.citations[shown] : null;

  useGSAP(
    () => {
      const targetScore =
        mode === "verified" ? VERIFIED_EXAMPLE.confidence : ESCALATED_EXAMPLE.confidence;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        if (confidenceRef.current) confidenceRef.current.textContent = targetScore.toFixed(1);
        setUnlocked(true);
        return;
      }

      setUnlocked(false);
      const scoreObj = { val: 0 };
      if (confidenceRef.current) confidenceRef.current.textContent = "0.0";

      const tl = gsap.timeline({ defaults: { ease: "power2.out" } });
      tl.fromTo(
        "[data-console-body]",
        { opacity: 0, y: 8 },
        { opacity: 1, y: 0, duration: 0.35 }
      )
        .to(
          scoreObj,
          {
            val: targetScore,
            duration: 0.85,
            ease: "power3.out",
            onUpdate: () => {
              if (confidenceRef.current) {
                confidenceRef.current.textContent = scoreObj.val.toFixed(1);
              }
            },
          },
          0.05
        )
        .call(() => setUnlocked(true), undefined, 0.75);
    },
    { scope: rootRef, dependencies: [mode, replayKey] }
  );

  const onSelectCitation = (index: number) =>
    setPinned((curr) => (curr === index ? null : index));

  return (
    <div
      ref={rootRef}
      className="relative overflow-hidden rounded-[32px] border border-white/12 bg-[#111714]/95 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12),0_28px_64px_-20px_rgba(0,0,0,0.75)] backdrop-blur-2xl"
    >
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.08] bg-[#0B0F0D]/90 px-5 py-3.5">
        <div className="flex items-center gap-2 text-xs font-medium text-white/85">
          <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-400" aria-hidden="true" />
          <span>Grounded RAG Resolution Preview</span>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium tabular-nums",
              mode === "verified"
                ? "border-emerald-500/35 bg-emerald-500/10 text-emerald-300"
                : "border-amber-500/35 bg-amber-500/10 text-amber-200"
            )}
          >
            <span ref={confidenceRef}>
              {(mode === "verified"
                ? VERIFIED_EXAMPLE.confidence
                : ESCALATED_EXAMPLE.confidence
              ).toFixed(1)}
            </span>
            % {mode === "verified" ? "Policy Match" : "Uncovered Edge Case"}
          </span>
          <button
            type="button"
            onClick={() => {
              setApproved(false);
              setReplayKey((k) => k + 1);
            }}
            title="Replay verification trace"
            aria-label="Replay verification trace"
            className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/60 transition-colors hover:border-white/25 hover:text-white"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* 2-Mode Switcher Tabs */}
      <div
        role="tablist"
        aria-label="Resolution preview modes"
        className="grid grid-cols-2 gap-2 border-b border-white/[0.08] bg-[#0B0F0D]/60 p-2.5"
      >
        <button
          type="button"
          role="tab"
          aria-selected={mode === "verified"}
          onClick={() => {
            setMode("verified");
            setApproved(false);
          }}
          className={cn(
            "min-h-[44px] rounded-2xl px-4 py-2 text-left text-xs transition-all",
            mode === "verified"
              ? "bg-[#F2F3EF] font-medium text-[#1C201B] shadow-md"
              : "bg-white/[0.03] font-light text-white/65 hover:bg-white/[0.07] hover:text-white"
          )}
        >
          <span className="block text-[10px] uppercase tracking-wider opacity-70">
            Scenario 01 · On-Policy
          </span>
          <span>Source-Cited Auto-Draft</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={mode === "escalated"}
          onClick={() => {
            setMode("escalated");
            setApproved(false);
          }}
          className={cn(
            "min-h-[44px] rounded-2xl px-4 py-2 text-left text-xs transition-all",
            mode === "escalated"
              ? "bg-[#F2F3EF] font-medium text-[#1C201B] shadow-md"
              : "bg-white/[0.03] font-light text-white/65 hover:bg-white/[0.07] hover:text-white"
          )}
        >
          <span className="block text-[10px] uppercase tracking-wider opacity-70">
            Scenario 02 · Edge Case
          </span>
          <span>Safe Human Handoff</span>
        </button>
      </div>

      {/* Console Body */}
      <div data-console-body className="space-y-4 p-5 sm:p-6">
        {mode === "verified" ? (
          <>
            <div>
              <div className="mb-1.5 flex items-center justify-between text-xs text-white/55">
                <span>Customer Question · Ticket #{VERIFIED_EXAMPLE.ticketId}</span>
                <span className="text-emerald-300">2 policy passages cited</span>
              </div>
              <div className="rounded-2xl border border-white/[0.08] bg-black/35 px-4 py-3 text-sm font-light text-white/90">
                {VERIFIED_EXAMPLE.question}
              </div>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <p className="flex items-center gap-2 text-xs font-medium text-emerald-300">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <span>Grounded RAG Draft Reply</span>
                </p>
                <span className="text-[11px] font-light text-white/45">
                  Verified against company SOPs
                </span>
              </div>
              <div className="rounded-2xl border border-emerald-500/25 bg-black/40 p-4">
                <AnswerParts
                  text={VERIFIED_EXAMPLE.answer}
                  citations={VERIFIED_EXAMPLE.citations}
                  activeIndex={shown}
                  onHover={setHovered}
                  onSelect={onSelectCitation}
                  controlsId={drawerId}
                  className="text-sm font-light leading-relaxed text-white/95"
                />
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-light text-white/55">
                Click or hover a source pill to inspect the exact policy passage:
              </p>
              <div className="flex flex-wrap gap-2">
                {VERIFIED_EXAMPLE.citations.map((c, i) => (
                  <CitationToken
                    key={`${c.source}-${i}`}
                    index={i}
                    active={shown === i}
                    controlsId={drawerId}
                    onHover={setHovered}
                    onSelect={onSelectCitation}
                    label={`Citation ${i + 1}: ${c.source}, page ${c.page}`}
                    className="px-3 py-1"
                  >
                    <span className="truncate">
                      {c.source} · p.{c.page}
                    </span>
                  </CitationToken>
                ))}
              </div>
            </div>

            {/* Tactile Ivory Dossier Card: Policy Excerpt Inspector */}
            <div
              id={drawerId}
              role="region"
              aria-live="polite"
              className="rounded-2xl border border-[#DCDFD6] bg-[#F2F3EF] p-4 text-xs text-[#1C201B] shadow-md"
            >
              <div className="mb-2 flex items-center justify-between border-b border-[#DCDFD6] pb-2 text-[11px]">
                <span className="inline-flex items-center gap-1.5 font-medium text-[#1C201B]">
                  <FileCheck2 className="h-3.5 w-3.5 text-emerald-700" aria-hidden="true" />
                   Exact Policy Document Excerpt
                </span>
                {shown !== null && (
                  <span className="rounded-full bg-emerald-900/10 px-2.5 py-0.5 font-medium text-emerald-800">
                    Source [{shown + 1}] Verified
                  </span>
                )}
              </div>
              {activeCitation ? (
                <p className="border-l-2 border-[#1C201B] pl-3 font-normal leading-relaxed text-[#1C201B]">
                  {activeCitation.snippet}
                </p>
              ) : (
                <p className="text-[#6E746B]">
                  Select any source pill above to read the exact paragraph from your policy PDF.
                </p>
              )}
            </div>
          </>
        ) : (
          <>
            <div>
              <div className="mb-1.5 flex items-center justify-between text-xs text-white/55">
                <span>Customer Question · Ticket #{ESCALATED_EXAMPLE.ticketId}</span>
                <span className="text-amber-300">Outside automated policy rules</span>
              </div>
              <div className="rounded-2xl border border-white/[0.08] bg-black/35 px-4 py-3 text-sm font-light text-white/90">
                {ESCALATED_EXAMPLE.question}
              </div>
            </div>

            <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-4">
              <div className="flex items-center gap-2 text-xs font-medium text-amber-200">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
                <span>AI Held Back From Guessing · Escalated to Human Team</span>
              </div>
              <p className="mt-1.5 text-xs font-light leading-relaxed text-white/75">
                {ESCALATED_EXAMPLE.reason}
              </p>
            </div>

            {/* Tactile Ivory Escalation Summary */}
            <div className="rounded-2xl border border-[#DCDFD6] bg-[#F2F3EF] p-4 text-xs text-[#1C201B] shadow-md">
              <div className="mb-2 flex items-center justify-between border-b border-[#DCDFD6] pb-2 text-[11px] font-medium">
                <span>Internal Summary Attached for Your Support Agent</span>
                <span className="rounded-full bg-amber-900/15 px-2.5 py-0.5 text-amber-900">
                  Zendesk Note Staged
                </span>
              </div>
              <ul className="space-y-1.5 text-[#1C201B]">
                {ESCALATED_EXAMPLE.handoffSummary.map((line) => (
                  <li key={line} className="flex items-start gap-2">
                    <span className="font-semibold text-emerald-800">•</span>
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </div>

      {/* Footer Control Bar */}
      <div className="space-y-3 border-t border-white/[0.08] bg-[#0B0F0D]/90 px-5 py-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-light text-white/55">
          <span>
            Response time:{" "}
            <strong className="font-medium text-white/85">
              {mode === "verified" ? VERIFIED_EXAMPLE.latencyMs : ESCALATED_EXAMPLE.latencyMs}ms
            </strong>{" "}
            · Private client knowledge base
          </span>
          <span className="font-medium text-emerald-300">14-Day Shadow Validation</span>
        </div>

        {mode === "verified" ? (
          <button
            type="button"
            disabled={!unlocked || approved}
            onClick={() => setApproved(true)}
            className={cn(
              "flex min-h-[46px] w-full items-center justify-center gap-2 rounded-full border px-5 py-2.5 text-xs font-medium transition-all duration-200",
              !unlocked && "cursor-not-allowed border-white/10 bg-white/5 text-white/40",
              unlocked &&
                !approved &&
                "border-[#DCDFD6] bg-[#F2F3EF] text-[#1C201B] shadow-lg hover:bg-white active:scale-[0.99]",
              approved && "border-emerald-400/50 bg-emerald-500/20 text-emerald-200"
            )}
          >
            {approved ? (
              <>
                <Check className="h-4 w-4" />
                <span>Approved & Sent via Helpdesk (284ms)</span>
              </>
            ) : (
              <>
                {unlocked ? <Check className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                <span>14-Day Shadow Validation: 1-Click Approve Draft</span>
              </>
            )}
          </button>
        ) : (
          <div className="flex min-h-[46px] w-full items-center justify-center gap-2 rounded-full border border-amber-400/35 bg-amber-500/15 px-5 py-2.5 text-xs font-medium text-amber-200">
            <UserCheck className="h-4 w-4 shrink-0" />
            <span>Safely Routed to Human Agent Queue · Zero Guessing</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default AnswerPreview;
