'use client';

import React, { useRef, Suspense } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ArrowRight, CheckCircle2, FileText } from "lucide-react";
import { siteConfig } from "@/lib/site-config";
import { Container } from "@/components/ui/container";
import { HeroBackground } from "@/components/scenes/hero-background";

gsap.registerPlugin(useGSAP);

// ROUND 3 RULES:
// - "Shadow Mode" is now called "Shadow Validation" everywhere.
// - Stats bar: three columns, no tags.
const HERO_STATS = [
  {
    id: "safeguards",
    tagline: "// 01 SAFEGUARDS",
    metric: "3",
    label: "Checks before any reply reaches a customer",
  },
  {
    id: "human-approval",
    tagline: "// 02 HUMAN APPROVAL",
    metric: "0",
    label: "Replies sent without your team's approval during Shadow Validation",
  },
  {
    id: "shadow-validation",
    tagline: "// 03 SHADOW VALIDATION",
    metric: "14-Day",
    label: "Parallel run before anything goes live",
  },
];

export interface HeroProps {
  demoEnabled?: boolean;
}

export function Hero({ demoEnabled }: HeroProps) {
  const heroRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (typeof window === "undefined") return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      if (window.matchMedia("(max-width: 767px)").matches) return;

      const tl = gsap.timeline({
        defaults: { ease: "power3.out" },
      });

      // 1. Headline lines rise out of mask
      tl.from(
        ".hero-headline-line",
        {
          yPercent: 120,
          duration: 1.0,
          stagger: 0.12,
          ease: "power3.out",
        },
        0.05
      );

      // 2. Status label, lede sentence, and CTA buttons rise gently
      tl.from(
        [".hero-status-label", ".hero-lede-text", ".hero-actions-row"],
        {
          y: 16,
          duration: 0.8,
          stagger: 0.1,
          ease: "power2.out",
        },
        0.15
      );

      // 4. Single Paper evidence card slides up 24px
      tl.from(
        ".hero-paper-card",
        {
          opacity: 0,
          y: 24,
          duration: 1.1,
          ease: "power3.out",
        },
        0.25
      );

      // 5. Proof stats dock fades in
      tl.from(
        ".hero-proof-dock",
        {
          opacity: 0,
          y: 16,
          duration: 0.9,
          ease: "power2.out",
        },
        0.4
      );
    },
    { scope: heroRef }
  );

  return (
    <section
      ref={heroRef}
      className="relative isolate flex min-h-[100svh] lg:h-[100svh] lg:max-h-[100svh] w-full flex-col justify-between overflow-x-hidden lg:overflow-hidden bg-[var(--canvas)] pt-20 sm:pt-24 lg:pt-20"
    >
      {/* 8-Frame Still Camera-Move Background Stack */}
      <div className="hero-scene-wrap pointer-events-none absolute inset-0 -z-10">
        <Suspense fallback={null}>
          <HeroBackground />
        </Suspense>
      </div>

      {/* Main Hero Middle Content */}
      <Container className="relative z-10 w-full min-w-0 lg:my-auto py-6 sm:py-8 lg:py-4">
        <div className="grid grid-cols-1 min-w-0 w-full items-center gap-8 lg:grid-cols-12 lg:gap-10">
          {/* LEFT COLUMN: Copy with soft dark readability gradient behind */}
          <div className="lg:col-span-7 min-w-0 w-full relative">
            {/* Soft dark readability gradient behind text to ensure contrast */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -inset-8 sm:-inset-12 -z-10 rounded-3xl bg-[radial-gradient(ellipse_at_center,rgba(11,15,13,0.92)_0%,rgba(11,15,13,0.78)_55%,transparent_90%)] backdrop-blur-[6px]"
            />

            {/* Small status label */}
            <div className="hero-status-label mb-5 inline-flex max-w-[calc(100vw-64px)] sm:max-w-full min-w-0 items-center gap-2 rounded-[6px] border border-[var(--line)] bg-[var(--surface)] px-2.5 py-1 text-[11px] sm:text-[12px] font-mono uppercase tracking-[0.08em] text-[var(--text-dim)]">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--verified)]" aria-hidden="true" />
              <span className="truncate min-w-0">VERIFIED AGAINST YOUR SOPs · 14-DAY SHADOW VALIDATION</span>
            </div>

            {/* Headline: max 3 lines, masked reveal */}
            <h1 className="text-[clamp(32px,5.2vw,70px)] font-light leading-[1.04] tracking-[-0.03em] text-[var(--text)]">
              <span className="block overflow-hidden pb-1">
                <span className="hero-headline-line block">Support answers</span>
              </span>
              <span className="block overflow-hidden pb-1">
                <span className="hero-headline-line block">backed by your documents.</span>
              </span>
            </h1>

            {/* One supporting sentence (max 62ch) */}
            <p className="hero-lede-text mt-5 max-w-[54ch] text-[15px] sm:text-[16px] lg:text-[17px] font-normal leading-[1.6] text-[var(--text-dim)]">
              We turn your policies and tickets into support answers that quote your documents. Edge
              cases route straight to your team.
            </p>

            {/* CTA row: Geist 15px, weight 500, sentence case per prompt */}
            <div className="hero-actions-row mt-7 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
              {/* Primary button: Geist 15px, weight 500, sentence case, paper background, paper-ink text, 10px radius */}
              <a
                href={siteConfig.calLink}
                data-cal-link={siteConfig.calLink.replace(/^https?:\/\/cal\.com\//i, "").replace(/\/+$/, "") || "aegis-desk-le98cq/15min"}
                data-cal-namespace="15min"
                data-cal-config='{"layout":"month_view","theme":"dark"}'
                className="inline-flex h-[48px] w-full sm:w-auto items-center justify-center rounded-[10px] bg-[var(--paper)] px-6 font-sans text-[15px] font-medium text-[var(--paper-ink)] shadow-[0_4px_16px_rgba(0,0,0,0.18)] transition-opacity duration-150 hover:opacity-90 cursor-pointer"
              >
                Book a 15-min scoping call
              </a>

              {/* Text link: Geist 15px, weight 500, sentence case */}
              <a
                href="#demo"
                className="group inline-flex items-center gap-2 font-sans text-[15px] font-medium text-[var(--text-dim)] transition-colors duration-150 hover:text-[var(--text)]"
              >
                <span>Test the workbench</span>
                <ArrowRight className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-1" />
              </a>
            </div>
          </div>

          {/* RIGHT COLUMN: ONE paper evidence card */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end min-w-0 w-full mt-4 lg:mt-0">
            <article
              aria-label="Verified Policy Citation"
              className="hero-paper-card relative w-full max-w-[420px] min-w-0 rounded-[16px] border border-[var(--paper-line)] bg-[var(--paper)] p-4 sm:p-5 text-[var(--paper-ink)] shadow-[0_16px_40px_rgba(0,0,0,0.22)]"
            >
              {/* Card Header with Status Chip */}
              <div className="flex items-center justify-between border-b border-[var(--paper-line)] pb-3">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[var(--verified)]" aria-hidden="true" />
                  <span className="text-[11px] font-mono font-semibold uppercase tracking-[0.08em] text-[var(--paper-ink)]">
                    VERIFIED POLICY CITATION
                  </span>
                </div>
                <span className="rounded-[6px] border border-[var(--paper-line)] bg-black/[0.04] px-2 py-0.5 text-[10px] font-mono uppercase tracking-[0.08em] text-[var(--paper-ink)]/75">
                  CITED FROM SECTION 3.2
                </span>
              </div>

              {/* Customer Query Section */}
              <div className="mt-3.5">
                <div className="text-[11px] font-mono uppercase tracking-[0.08em] text-[var(--paper-ink)]/60">
                  Customer question
                </div>
                <p className="mt-1 text-[13px] sm:text-[14px] font-light italic leading-snug text-[var(--paper-ink)]">
                  “Can I return opened wireless headphones within 14 days?”
                </p>
              </div>

              {/* Grounded AI Answer Section */}
              <div className="mt-3.5 rounded-[12px] border border-[var(--paper-line)] bg-white/75 p-3.5">
                <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-[0.08em] text-[var(--paper-ink)]/60">
                  <span>Draft reply</span>
                  <span className="inline-flex items-center gap-1 text-[#0A433A] font-semibold text-[11px] font-mono">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#0A433A]" />
                    Backed by Section 3.2
                  </span>
                </div>
                <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--paper-ink)]">
                  Yes. Opened audio gear is eligible for return within 14 days in original packaging with a 10%
                  inspection fee.
                </p>
              </div>

              {/* Exact Source Citation Box (no file name, no timing) */}
              <div className="mt-3.5 flex items-center rounded-[10px] border border-[var(--paper-line)] bg-black/[0.03] px-3 py-2">
                <div className="flex items-center gap-2 truncate">
                  <FileText className="h-3.5 w-3.5 shrink-0 text-[#0A433A]" />
                  <span className="truncate text-[11px] sm:text-[12px] font-mono font-medium text-[var(--paper-ink)]">
                    Return Policy · §3.2
                  </span>
                </div>
              </div>

              {/* Footer Note */}
              <div className="mt-3.5 pt-2.5 border-t border-[var(--paper-line)] text-right">
                <span className="text-[10px] font-mono text-[var(--paper-ink)]/55">
                  Staged for your agent to review and approve
                </span>
              </div>
            </article>
          </div>
        </div>
      </Container>

      {/* BOTTOM EDGE: Three proof stats along the bottom edge of the 100svh hero */}
      <div className="hero-proof-dock relative z-10 w-full border-t border-[var(--line)] bg-[var(--surface)]/85 backdrop-blur-md">
        <Container>
          <div className="grid grid-cols-1 divide-y divide-[var(--line)] sm:grid-cols-3 sm:divide-x sm:divide-y-0 min-w-0 py-3 sm:py-3.5 lg:py-4">
            {HERO_STATS.map((stat, idx) => (
              <div
                key={stat.id}
                className={`flex flex-col justify-between min-w-0 ${
                  idx === 0
                    ? "pb-3 sm:pb-0 sm:pr-6 lg:pr-8"
                    : idx === 1
                    ? "py-3 sm:py-0 sm:px-6 lg:px-8"
                    : "pt-3 sm:pt-0 sm:pl-6 lg:pl-8"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] lg:text-[11px] font-mono uppercase tracking-[0.08em] text-[var(--text-faint)]">
                      {stat.tagline}
                    </span>
                  </div>

                  <div className="mt-1 sm:mt-1.5 flex items-baseline gap-2.5">
                    <span className="text-[26px] sm:text-[28px] lg:text-[34px] font-light leading-none tracking-tight text-[var(--text)] tabular-nums">
                      {stat.metric}
                    </span>
                    <span className="font-sans text-[13px] lg:text-[14px] font-medium text-[var(--text)]">
                      {stat.label}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </div>
    </section>
  );
}

export default Hero;
