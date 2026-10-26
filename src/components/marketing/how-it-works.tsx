'use client';

import React, { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { ShieldCheck, CheckCircle2 } from "lucide-react";
import { copy } from "@/lib/site-copy";
import { Container } from "@/components/ui/container";
import { Panel } from "@/components/ui/panel";
import { PaperCard } from "@/components/ui/paper-card";
import { StatusChip } from "@/components/ui/status-chip";
import { Label } from "@/components/ui/label";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

export function HowItWorks() {
  const { howItWorks } = copy;
  const sectionRef = useRef<HTMLElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const beamRef = useRef<SVGLineElement>(null);

  const note =
    typeof howItWorks.note === "string" && howItWorks.note
      ? howItWorks.note
      : "From day one, AegisDesk only writes internal drafts inside your helpdesk. Your agents approve with one click, and you only switch on live replies when you are completely satisfied with the accuracy.";

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      // The line draws as you scroll
      if (beamRef.current && timelineRef.current) {
        gsap.fromTo(
          beamRef.current,
          { strokeDashoffset: 1000 },
          {
            strokeDashoffset: 0,
            ease: "none",
            scrollTrigger: {
              trigger: timelineRef.current,
              start: "top 75%",
              end: "bottom 70%",
              scrub: 0.5,
            },
          }
        );
      }

      // Step cards fade and rise on entry
      const steps = gsap.utils.toArray<HTMLElement>(".timeline-step-card");
      steps.forEach((step) => {
        gsap.fromTo(
          step,
          { opacity: 0.4, y: 16 },
          {
            opacity: 1,
            y: 0,
            duration: 0.5,
            ease: "power2.out",
            scrollTrigger: {
              trigger: step,
              start: "top 85%",
              toggleActions: "play none none reverse",
            },
          }
        );
      });
    },
    { scope: sectionRef }
  );

  return (
    <section
      id="shadow-validation"
      ref={sectionRef}
      aria-labelledby="how-heading"
      className="relative w-full border-t border-[var(--line)] bg-[var(--canvas)] py-[88px] lg:py-[140px]"
    >
      <div id="how-it-works" className="sr-only" aria-hidden="true" />
      <Container>
        {/* Section Header */}
        <div className="max-w-[760px] space-y-4">
          <Label>04 // 14-DAY SHADOW VALIDATION</Label>
          <h2
            id="how-heading"
            className="font-sans text-[36px] font-light leading-[1.05] tracking-[-0.03em] text-[var(--text)] sm:text-[44px] md:text-[52px]"
          >
            {howItWorks.title}
          </h2>
          <p className="max-w-[62ch] text-[17px] leading-[1.6] text-[var(--text-dim)]">
            {howItWorks.intro}
          </p>
        </div>

        {/* Vertical Timeline with the Four Steps */}
        <div ref={timelineRef} className="relative mt-14">
          {/* Scroll-Drawn Background Track Line */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute bottom-6 left-4 top-6 w-0.5 -translate-x-1/2 sm:left-6"
          >
            <svg className="h-full w-full overflow-visible" preserveAspectRatio="none">
              <line
                x1="1"
                y1="0"
                x2="1"
                y2="100%"
                stroke="var(--line)"
                strokeWidth="1.5"
              />
              <line
                ref={beamRef}
                x1="1"
                y1="0"
                x2="1"
                y2="100%"
                stroke="var(--verified)"
                strokeWidth="2"
                strokeDasharray="1000"
                strokeDashoffset="0"
                pathLength={1000}
              />
            </svg>
          </div>

          {/* Steps List */}
          <ol className="space-y-6 pl-10 sm:pl-16">
            {howItWorks.steps.map((step) => {
              return (
                <li key={step.title} className="timeline-step-card relative">
                  {/* Subtle Timeline Node (No glow, clean 10px node) */}
                  <span
                    aria-hidden="true"
                    className="absolute -left-[31px] top-6 flex h-3 w-3 items-center justify-center rounded-full border border-[var(--line-strong)] bg-[var(--surface-2)] sm:-left-[47px]"
                  >
                    <span className="h-1 w-1 rounded-full bg-[var(--verified)]" />
                  </span>

                  {/* Plain Panel Step Card (No glow per DESIGN.md) */}
                  <Panel className="p-6 sm:p-8">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--line)] pb-3">
                      <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--verified)]">
                        {step.phase}
                      </span>
                      <StatusChip variant="neutral">
                        {step.pill}
                      </StatusChip>
                    </div>

                    <h3 className="mt-4 font-sans text-xl font-normal tracking-tight text-[var(--text)] sm:text-2xl">
                      {step.title}
                    </h3>

                    <p className="mt-2.5 max-w-[62ch] text-[15px] font-light leading-[1.6] text-[var(--text-dim)]">
                      {step.body}
                    </p>
                  </Panel>
                </li>
              );
            })}
          </ol>
        </div>

        {/* "Your team stays in full control" note: ONE TACTILE PAPER CARD */}
        <div className="mt-12">
          <PaperCard className="font-sans">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] border border-[var(--paper-line)] bg-[var(--paper-ink)]/5 text-[var(--paper-ink)]">
                <ShieldCheck className="h-4 w-4" />
              </span>
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--paper-ink)]">
                    HUMAN APPROVAL FLOOR
                  </p>
                  <span className="rounded-[4px] bg-[var(--paper-ink)]/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--paper-ink)]">
                    DRAFT-ONLY UNTIL SIGN-OFF
                  </span>
                </div>
                <h4 className="font-sans text-base font-semibold text-[var(--paper-ink)]">
                  Your team stays in full control
                </h4>
                <p className="text-[13.5px] font-normal leading-[1.65] text-[var(--paper-ink)]/85">
                  {note}
                </p>
              </div>
            </div>
          </PaperCard>
        </div>
      </Container>
    </section>
  );
}

export default HowItWorks;
