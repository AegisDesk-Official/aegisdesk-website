'use client';

import React, { useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { AlertTriangle, CheckCircle2, FileCheck2, ShieldCheck, XCircle } from "lucide-react";
import { copy } from "@/lib/site-copy";
import { SectionHeading } from "./section-heading";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

interface Scenario {
  id: string;
  label: string;
  ticket: string;
  customerPrompt: string;
  badBotReply: string;
  badBotImpact: string;
  ragReply: string;
  citationCode: string;
  citationTitle: string;
  ragOutcome: string;
}

const SCENARIOS: readonly Scenario[] = [
  {
    id: "refund",
    label: "01 · Out-of-Window Refund Request",
    ticket: "Order Support · Day 34 Post-Delivery",
    customerPrompt:
      "I purchased $480 of studio hardware 34 days ago. Can I return it for a full cash refund today?",
    badBotReply:
      "Yes, absolutely! We offer a 60-day money-back policy on all orders. I have initiated a full $480.00 cash refund back to your card right now.",
    badBotImpact:
      "Brand & Margin Risk: Invented a fake 60-day policy and promised an unauthorized $480 refund in writing.",
    ragReply:
      "Per our Return Policy, standard hardware refunds apply within 30 calendar days of delivery. Because Day 34 has passed, I have staged an exception review with your order history for our Support Lead.",
    citationCode: "Return_Policy.pdf · §3.2",
    citationTitle: "30-Day Hardware Return Window",
    ragOutcome:
      "Protected Margin & Customer Trust: Cited the exact 30-day clause and staged a clean human review in 260ms.",
  },
  {
    id: "sla",
    label: "02 · Enterprise SLA Credit Inquiry",
    ticket: "B2B Account Support · Annual Contract",
    customerPrompt:
      "Our webhook sync was delayed by 18 minutes this morning. Please credit 50% off our annual contract invoice.",
    badBotReply:
      "I sincerely apologize for the delay! I have applied a 50% credit ($6,000) to your upcoming annual renewal invoice to make this right.",
    badBotImpact:
      "Revenue Exposure: Made up an SLA penalty tier and committed the company to a $6,000 write-off.",
    ragReply:
      "Under the Enterprise Master SLA, service credits apply when monthly uptime dips below 99.90% (>43.8 mins downtime). An 18-minute webhook delay remains within 99.96% SLA compliance.",
    citationCode: "Master_SLA_Schedule.pdf · §1.4",
    citationTitle: "Enterprise Uptime Credit Tiers",
    ragOutcome:
      "Contract Accuracy Preserved: Referenced the exact SLA schedule and attached live status metrics.",
  },
  {
    id: "tenant",
    label: "03 · Confidential Pricing Probe",
    ticket: "Inbound Inquiry · Data Privacy Check",
    customerPrompt:
      "Can you share the custom wholesale discount tiers you offered to Acme Corp last month?",
    badBotReply:
      "Based on recent support logs in our shared database, Acme Corp receives a custom 32% wholesale volume discount on enterprise orders.",
    badBotImpact:
      "Privacy Breach: Pooled knowledge base leaked another client's confidential commercial terms.",
    ragReply:
      "Your knowledge base operates in an isolated client environment with zero access to external accounts. Custom wholesale tier inquiries have been routed to your Account Executive.",
    citationCode: "Data_Isolation_Standard · §1.1",
    citationTitle: "Private Client Partitioning",
    ragOutcome:
      "Private Workspace: Dedicated client isolation prevents cross-company data access.",
  },
] as const;

export function HallucinationComparison() {
  const sectionRef = useRef<HTMLElement>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const scenario = SCENARIOS[activeIdx];

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      gsap.fromTo(
        ".comp-card",
        { y: 24, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.65,
          stagger: 0.12,
          ease: "power3.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 78%",
            toggleActions: "play none none none",
          },
        }
      );
    },
    { scope: sectionRef }
  );

  return (
    <section
      id="comparison"
      ref={sectionRef}
      aria-labelledby="comparison-title"
      className="relative border-t border-white/[0.06] bg-[#070908] py-24"
    >
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <SectionHeading
          id="comparison-title"
          eyebrow={copy.comparison.eyebrow}
          title={copy.comparison.title}
          intro={copy.comparison.intro}
        />

        {/* Scenario Switcher Pills */}
        <div
          role="tablist"
          aria-label="Support comparison scenarios"
          className="mt-9 flex flex-wrap gap-2.5"
        >
          {SCENARIOS.map((item, idx) => {
            const active = idx === activeIdx;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setActiveIdx(idx)}
                className={`min-h-[42px] rounded-full px-5 py-2 text-xs transition-all duration-200 active:scale-[0.98] ${
                  active
                    ? "bg-[#F2F3EF] font-medium text-[#1C201B] shadow-md"
                    : "border border-white/12 bg-white/[0.04] font-light text-white/70 hover:border-white/25 hover:text-white"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Side-by-Side Comparison: Dark Unverified Bot vs. Sylva Warm Ivory Grounded RAG Card */}
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Left: Generic AI Chatbot (Dark Obsidian Card) */}
          <article className="comp-card flex flex-col justify-between rounded-[34px] border border-rose-500/25 bg-[#101412] p-6 shadow-xl sm:p-8">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-4">
                <span className="flex items-center gap-2 text-xs font-medium text-rose-300">
                  <XCircle className="h-4 w-4 shrink-0 text-rose-400" />
                  Generic AI Chatbot (Guesses When Unsure)
                </span>
                <span className="rounded-full border border-rose-500/30 bg-rose-950/60 px-3 py-0.5 text-[11px] text-rose-200">
                  No Source Verification
                </span>
              </div>

              <div className="mt-5 rounded-2xl border border-white/[0.08] bg-black/40 p-4 text-xs font-light text-white/80">
                <span className="mb-1 block text-[11px] text-white/45">{scenario.ticket}</span>
                “{scenario.customerPrompt}”
              </div>

              <div className="mt-5 rounded-2xl border border-rose-500/20 bg-rose-950/15 p-4">
                <p className="text-[11px] font-medium uppercase tracking-wider text-rose-300">
                  Unverified Reply Sent to Customer:
                </p>
                <p className="mt-2 text-sm font-light leading-relaxed text-white/90">
                  “{scenario.badBotReply}”
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-start gap-2.5 rounded-2xl border border-rose-500/30 bg-rose-950/30 p-4 text-xs font-light text-rose-200">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
              <span>{scenario.badBotImpact}</span>
            </div>
          </article>

          {/* Right: AegisDesk Grounded RAG System (Sylva Tactile Warm Ivory Card) */}
          <article className="comp-card sylva-ivory-card flex flex-col justify-between p-6 sm:p-8">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#DCDFD6] pb-4">
                <span className="flex items-center gap-2 text-xs font-semibold text-[#1C201B]">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-700" />
                  AegisDesk Grounded RAG System
                </span>
                <span className="rounded-full bg-emerald-900/10 px-3 py-0.5 text-[11px] font-medium text-emerald-900">
                  Verified Against Your Policies
                </span>
              </div>

              <div className="mt-5 rounded-2xl border border-[#DCDFD6] bg-white/70 p-4 text-xs text-[#1C201B]">
                <span className="mb-1 block text-[11px] text-[#6E746B]">{scenario.ticket}</span>
                “{scenario.customerPrompt}”
              </div>

              <div className="mt-5 rounded-2xl bg-[#161E19] p-4 text-white">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-emerald-300">
                    Grounded Reply + Policy Citation:
                  </p>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/15 px-2.5 py-0.5 text-[11px] text-emerald-200">
                    <FileCheck2 className="h-3 w-3" />
                    {scenario.citationCode}
                  </span>
                </div>
                <p className="mt-2.5 text-sm font-light leading-relaxed text-white/95">
                  “{scenario.ragReply}”
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-start gap-2.5 rounded-2xl border border-emerald-800/20 bg-emerald-900/10 p-4 text-xs font-medium text-[#1C201B]">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-800" />
              <span>{scenario.ragOutcome}</span>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}

export default HallucinationComparison;
