'use client';

import React, { useState, useEffect, useRef } from "react";
import gsap from "gsap";
import { ArrowRight, Check, ShieldCheck, Calculator } from "lucide-react";
import { copy } from "@/lib/site-copy";
import { siteConfig } from "@/lib/site-config";
import { quote } from "@/lib/pricing";
import { Container } from "@/components/ui/container";
import { Panel } from "@/components/ui/panel";
import { PaperCard } from "@/components/ui/paper-card";
import { StatusChip } from "@/components/ui/status-chip";
import { Label } from "@/components/ui/label";

const PRESETS = [
  { label: "Mid-Market", tickets: 1500 },
  { label: "Growth", tickets: 5000 },
  { label: "Large", tickets: 15000 },
] as const;

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export function SavingsExample() {
  const { pilot } = copy;

  // Sliders state with 50% default automation per Round 3 specification
  const [tickets, setTickets] = useState<number>(1500);
  const [costPerTicket, setCostPerTicket] = useState<number>(6.0);
  const [resolutionPct, setResolutionPct] = useState<number>(50);

  // Scope & deliverables tab (segmented control with 8px radius)
  const [activePlanTab, setActivePlanTab] = useState<"setup" | "retainer">("setup");

  // Pure single-source quote calculation from src/lib/pricing.ts
  const q = quote({
    tickets,
    costPerTicket,
    automationPct: resolutionPct,
  });

  // Short GSAP count-up animation on the big annual savings number (respecting reduced motion)
  const displayValueRef = useRef<{ val: number }>({ val: q.annualSavings });
  const [displayVal, setDisplayVal] = useState<number>(q.annualSavings);

  useEffect(() => {
    if (q.netMonthlyRoi <= 0) return;

    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      displayValueRef.current.val = q.annualSavings;
      setDisplayVal(q.annualSavings);
      return;
    }

    const tween = gsap.to(displayValueRef.current, {
      val: q.annualSavings,
      duration: 0.35,
      ease: "power2.out",
      onUpdate: () => {
        setDisplayVal(Math.round(displayValueRef.current.val));
      },
    });

    return () => {
      tween.kill();
    };
  }, [q.annualSavings, q.netMonthlyRoi]);

  const paybackText =
    q.paybackMonths === null
      ? null
      : q.paybackMonths < 1
      ? "under 30 days"
      : `about ${Math.round(q.paybackMonths)} months`;

  return (
    <section
      id="pricing"
      aria-labelledby="pricing-heading"
      className="relative w-full border-t border-[var(--line)] bg-[var(--canvas)] py-[88px] lg:py-[140px]"
    >
      <div id="savings" className="sr-only" aria-hidden="true" />

      <Container>
        {/* Section Header */}
        <div className="max-w-[760px] space-y-4">
          <Label>05 // PRICING AND ROI</Label>
          <h2
            id="pricing-heading"
            className="font-sans text-[36px] font-light leading-[1.05] tracking-[-0.03em] text-[var(--text)] sm:text-[44px] md:text-[52px]"
          >
            See what you save with documented support answers.
          </h2>
          <p className="max-w-[62ch] text-[17px] leading-[1.6] text-[var(--text-dim)]">
            Pricing starts at $2,500 setup and $1,000 a month and scales with your ticket volume. Your exact fees are confirmed after your scoping call.
          </p>
        </div>

        {/* 12-Column Grid: Left Dark Sliders Panel + Right Tactile Invoice PaperCard */}
        <div className="mt-14 grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
          {/* ------------------------------------------------------------------ */}
          {/* LEFT COLUMN (7 Cols): Calculator Sliders on a Dark Panel           */}
          {/* ------------------------------------------------------------------ */}
          <div className="min-w-0 w-full lg:col-span-7 space-y-6">
            <Panel className="p-6 sm:p-8">
              {/* Top Controls: Presets Segmented Control (8px radius) */}
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] pb-5">
                <div className="flex items-center gap-2">
                  <Calculator className="h-4 w-4 text-[var(--verified)]" />
                  <span className="font-mono text-[12px] uppercase tracking-[0.08em] text-[var(--text-dim)]">
                    VOLUME BENCHMARKS
                  </span>
                </div>

                {/* Segmented Control (8px radius) setting tickets to 1,500, 5,000, 15,000 */}
                <div
                  role="group"
                  aria-label="Preset volume benchmarks"
                  className="inline-flex rounded-[8px] border border-[var(--line)] bg-[var(--surface-2)] p-1"
                >
                  {PRESETS.map((preset) => {
                    const isSelected = tickets === preset.tickets;
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => setTickets(preset.tickets)}
                        className={`rounded-[6px] px-3 py-1 font-mono text-[11px] transition-colors ${
                          isSelected
                            ? "bg-[var(--surface)] text-[var(--text)] shadow-sm font-medium"
                            : "bg-transparent text-[var(--text-dim)] hover:text-[var(--text)]"
                        }`}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sliders Block */}
              <div className="space-y-6">
                {/* Slider 1: Support Volume */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between font-mono text-xs">
                    <label htmlFor="slider-tickets" className="text-[var(--text-dim)]">
                      Monthly ticket volume:
                    </label>
                    <span className="text-[var(--text)] font-medium tabular-nums">
                      {tickets.toLocaleString()} tickets / mo
                    </span>
                  </div>
                  <input
                    id="slider-tickets"
                    type="range"
                    min={500}
                    max={25000}
                    step={250}
                    value={tickets}
                    onChange={(e) => setTickets(Number(e.target.value))}
                    className="w-full h-1.5 bg-[var(--surface-2)] rounded-lg appearance-none cursor-pointer accent-[var(--verified)]"
                  />
                  <div className="flex justify-between font-mono text-[10px] text-[var(--text-faint)]">
                    <span>500</span>
                    <span>10,000</span>
                    <span>25,000</span>
                  </div>
                </div>

                {/* Slider 2: Cost Per Ticket */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between font-mono text-xs">
                    <label htmlFor="slider-cost" className="text-[var(--text-dim)]">
                      Cost per resolution:
                    </label>
                    <span className="text-[var(--text)] font-medium tabular-nums">
                      ${costPerTicket.toFixed(2)} / ticket
                    </span>
                  </div>
                  <input
                    id="slider-cost"
                    type="range"
                    min={3}
                    max={15}
                    step={0.5}
                    value={costPerTicket}
                    onChange={(e) => setCostPerTicket(Number(e.target.value))}
                    className="w-full h-1.5 bg-[var(--surface-2)] rounded-lg appearance-none cursor-pointer accent-[var(--verified)]"
                  />
                  <div className="flex justify-between font-mono text-[10px] text-[var(--text-faint)]">
                    <span>$3.00</span>
                    <span>$9.00</span>
                    <span>$15.00</span>
                  </div>
                </div>

                {/* Slider 3: Automated Resolution Rate */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between font-mono text-xs">
                    <label htmlFor="slider-rate" className="text-[var(--text-dim)]">
                      Target automated answers:
                    </label>
                    <span className="text-[var(--verified)] font-medium tabular-nums">
                      {resolutionPct}% automated
                    </span>
                  </div>
                  <input
                    id="slider-rate"
                    type="range"
                    min={20}
                    max={80}
                    step={5}
                    value={resolutionPct}
                    onChange={(e) => setResolutionPct(Number(e.target.value))}
                    className="w-full h-1.5 bg-[var(--surface-2)] rounded-lg appearance-none cursor-pointer accent-[var(--verified)]"
                  />
                  <div className="flex justify-between font-mono text-[10px] text-[var(--text-faint)]">
                    <span>20% (Conservative)</span>
                    <span>50% (Standard)</span>
                    <span>80% (Aggressive)</span>
                  </div>
                </div>
              </div>
            </Panel>

            {/* Scope & Deliverables Segmented Control (8px radius) */}
            <Panel className="p-6">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] pb-4">
                <span className="font-mono text-[12px] uppercase tracking-[0.08em] text-[var(--text-dim)]">
                  SCOPE &amp; DELIVERABLES
                </span>

                {/* Segmented Control with 8px radius */}
                <div
                  role="tablist"
                  className="inline-flex rounded-[8px] border border-[var(--line)] bg-[var(--surface-2)] p-1"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activePlanTab === "setup"}
                    onClick={() => setActivePlanTab("setup")}
                    className={`rounded-[6px] px-3 py-1 font-mono text-[11px] transition-colors ${
                      activePlanTab === "setup"
                        ? "bg-[var(--surface)] text-[var(--text)] font-medium shadow-sm"
                        : "bg-transparent text-[var(--text-dim)] hover:text-[var(--text)]"
                    }`}
                  >
                    Setup &amp; Shadow Validation
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activePlanTab === "retainer"}
                    onClick={() => setActivePlanTab("retainer")}
                    className={`rounded-[6px] px-3 py-1 font-mono text-[11px] transition-colors ${
                      activePlanTab === "retainer"
                        ? "bg-[var(--surface)] text-[var(--text)] font-medium shadow-sm"
                        : "bg-transparent text-[var(--text-dim)] hover:text-[var(--text)]"
                    }`}
                  >
                    Monthly retainer
                  </button>
                </div>
              </div>

              {/* Deliverable Items List */}
              <ul className="mt-4 space-y-2.5">
                {(activePlanTab === "setup" ? pilot.included : pilot.monthly).map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-xs font-light text-[var(--text-dim)] leading-relaxed">
                    <Check className="h-3.5 w-3.5 shrink-0 text-[var(--verified)] mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Panel>
          </div>

          {/* ------------------------------------------------------------------ */}
          {/* RIGHT COLUMN (5 Cols): Result & Quote on ONE Tactile PaperCard     */}
          {/* ------------------------------------------------------------------ */}
          <div className="min-w-0 w-full lg:col-span-5">
            <PaperCard className="font-mono p-6 sm:p-7 shadow-[0_8px_30px_rgba(0,0,0,0.18)]">
              {/* Quote/Invoice Header */}
              <div className="border-b border-[var(--paper-line)] pb-4 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--paper-ink)]">
                    ESTIMATED QUOTE
                  </span>
                  <span className="rounded bg-[var(--paper-ink)]/10 px-2 py-0.5 text-[10px] uppercase font-mono tracking-[0.06em] text-[var(--paper-ink)]">
                    ESTIMATE
                  </span>
                </div>
                <p className="text-[11px] text-[var(--paper-ink)]/60">
                  AegisDesk Support Partnership Quote
                </p>
              </div>

              {/* Invoice Line Items */}
              <div className="py-4 space-y-3 text-[12px] tabular-nums divide-y divide-[var(--paper-line)]">
                <div className="pt-2 flex justify-between items-baseline gap-2">
                  <div>
                    <p className="font-semibold text-[var(--paper-ink)]">01 Onboarding &amp; 14-day Shadow Validation</p>
                    <p className="text-[11px] text-[var(--paper-ink)]/65 font-sans">
                      Document indexing, helpdesk connection, 14-day Shadow Validation
                    </p>
                  </div>
                  <span className="font-bold text-[var(--paper-ink)] shrink-0 tabular-nums">
                    {currencyFormatter.format(q.setupFee)}
                  </span>
                </div>

                <div className="pt-3 flex justify-between items-baseline gap-2">
                  <div>
                    <p className="font-semibold text-[var(--paper-ink)]">02 Managed monthly retainer</p>
                    <p className="text-[11px] text-[var(--paper-ink)]/65 font-sans">
                      Private hosting, model compute, continuous calibration
                    </p>
                  </div>
                  <span className="font-bold text-[var(--paper-ink)] shrink-0 tabular-nums">
                    {currencyFormatter.format(q.monthlyRetainer)} / mo
                  </span>
                </div>

                <div className="pt-3 flex justify-between items-baseline gap-2">
                  <div>
                    <p className="text-[var(--paper-ink)]/80">03 Current monthly support cost</p>
                    <p className="text-[11px] text-[var(--paper-ink)]/55 font-sans">
                      {tickets.toLocaleString()} tickets @ ${costPerTicket.toFixed(2)}/ticket
                    </p>
                  </div>
                  <span className="text-[var(--paper-ink)]/80 shrink-0 tabular-nums">
                    {currencyFormatter.format(q.currentMonthlyCost)} / mo
                  </span>
                </div>

                <div className="pt-3 flex justify-between items-baseline gap-2">
                  <div>
                    <p className="text-[var(--paper-ink)]/80">04 Projected savings from automated answers</p>
                    <p className="text-[11px] text-[var(--paper-ink)]/55 font-sans">
                      {resolutionPct}% deflection of standard policy tickets
                    </p>
                  </div>
                  <span className="font-medium text-[var(--paper-ink)] shrink-0 tabular-nums">
                    -{currencyFormatter.format(q.grossMonthlySavings)} / mo
                  </span>
                </div>
              </div>

              {/* Net Estimated Annual Savings Callout */}
              <div className="mt-2 border-t-2 border-[var(--paper-ink)] pt-4 space-y-2">
                <span className="font-bold uppercase tracking-[0.06em] text-[11px] text-[var(--paper-ink)] block">
                  ESTIMATED ANNUAL SAVINGS (after retainer)
                </span>

                {q.netMonthlyRoi <= 0 ? (
                  <p className="text-[13px] font-sans leading-relaxed text-[var(--paper-ink)]/85 pt-1">
                    At this volume the retainer is larger than the estimated savings. Book a call and we will tell you honestly whether AegisDesk fits.
                  </p>
                ) : (
                  <>
                    <div className="text-3xl sm:text-4xl font-extrabold text-[var(--paper-ink)] tabular-nums">
                      {currencyFormatter.format(displayVal)}
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[var(--paper-ink)]/65 font-mono tabular-nums pt-1">
                      <span>Net Monthly ROI: {currencyFormatter.format(q.netMonthlyRoi)} / mo</span>
                      <span>Payback: {paybackText}</span>
                    </div>
                  </>
                )}
              </div>
            </PaperCard>
          </div>
        </div>
      </Container>
    </section>
  );
}

export default SavingsExample;
