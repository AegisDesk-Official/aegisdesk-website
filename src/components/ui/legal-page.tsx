"use client";

import React, { useEffect, useState } from "react";
import { Navbar } from "@/components/marketing/navbar";
import { Footer } from "@/components/marketing/footer";
import { Container } from "@/components/ui/container";
import { PaperCard } from "@/components/ui/paper-card";
import { Label } from "@/components/ui/label";
import { ShieldCheck, ArrowRight } from "lucide-react";

export interface TocItem {
  id: string;
  label: string;
}

export interface LegalPageProps {
  title: string;
  updated: string;
  summaryTitle?: string;
  summaryText?: React.ReactNode;
  toc?: TocItem[];
  children: React.ReactNode;
}

export function LegalPage({
  title,
  updated,
  summaryTitle = "EXECUTIVE SUMMARY · B2B COMPLIANCE POSTURE",
  summaryText,
  toc = [],
  children,
}: LegalPageProps) {
  const [activeSection, setActiveSection] = useState<string>(toc[0]?.id || "");

  // Detect active section on scroll for the sticky mini table of contents
  useEffect(() => {
    if (toc.length === 0) return;

    const handleScroll = () => {
      const scrollPosition = window.scrollY + 200;
      for (let i = toc.length - 1; i >= 0; i--) {
        const el = document.getElementById(toc[i].id);
        if (el && el.offsetTop <= scrollPosition) {
          setActiveSection(toc[i].id);
          break;
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [toc]);

  const defaultSummary = (
    <p className="text-[13.5px] leading-relaxed text-[var(--paper-ink)] font-normal">
      This document outlines the operational, data handling, and legal commitments of AegisDesk.
      Under our Corrective-RAG architecture, client data is never used to train public foundation models,
      all retrieval is strictly tenant-isolated, and human agent sign-off is preserved throughout the 14-day Shadow Validation.
    </p>
  );

  return (
    <div className="flex min-h-screen flex-col bg-[var(--canvas)] text-[var(--text)] antialiased">
      <Navbar />

      <main id="main" className="flex-1 border-t border-[var(--line)] py-16 sm:py-24 lg:py-32">
        <Container>
          {/* Header */}
          <div className="mb-12 sm:mb-16 max-w-3xl space-y-4">
            <Label>LEGAL &amp; COMPLIANCE ARCHITECTURE</Label>
            <h1 className="font-sans text-3xl font-light tracking-[-0.03em] text-[var(--text)] sm:text-4xl md:text-5xl lg:text-6xl">
              {title}
            </h1>
            <div className="flex items-center gap-3 pt-1">
              <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--verified)]">
                STRICT VERIFICATION STATUS: ACTIVE
              </span>
              <span className="text-[var(--text-faint)]">•</span>
              <p className="font-mono text-[11px] text-[var(--text-dim)]">
                Last revised {updated}
              </p>
            </div>
          </div>

          {/* Desktop Layout: Sticky mini TOC + Single reading column (62ch) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 lg:gap-12 xl:gap-16">
            {/* Sticky Mini Table of Contents on Desktop */}
            {toc.length > 0 && (
              <aside className="hidden lg:block lg:col-span-4 xl:col-span-3">
                <div className="sticky top-28 space-y-4 rounded-[12px] border border-[var(--line)] bg-[var(--surface)] p-5">
                  <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
                    <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--text-dim)]">
                      CONTENTS
                    </span>
                    <span className="font-mono text-[10px] text-[var(--verified)]">
                      {toc.length} CLAUSES
                    </span>
                  </div>

                  <nav aria-label="Table of contents" className="space-y-1">
                    {toc.map((item, index) => {
                      const num = String(index + 1).padStart(2, "0");
                      const isActive = activeSection === item.id;

                      return (
                        <a
                          key={item.id}
                          href={`#${item.id}`}
                          className={`group flex items-start gap-2.5 rounded-[6px] px-2.5 py-1.5 text-xs transition-colors ${
                            isActive
                              ? "bg-[var(--surface-2)] text-[var(--text)] font-medium"
                              : "text-[var(--text-dim)] hover:bg-[var(--surface-2)]/60 hover:text-[var(--text)]"
                          }`}
                        >
                          <span className={`font-mono tabular-nums text-[11px] shrink-0 ${
                            isActive ? "text-[var(--verified)]" : "text-[var(--text-faint)] group-hover:text-[var(--text-dim)]"
                          }`}>
                            §{num}
                          </span>
                          <span className="truncate leading-relaxed">{item.label}</span>
                        </a>
                      );
                    })}
                  </nav>
                </div>
              </aside>
            )}

            {/* Single Reading Column: Exactly 62ch max width */}
            <article className={`w-full min-w-0 ${toc.length > 0 ? "lg:col-span-8 xl:col-span-9" : "col-span-12"}`}>
              <div className="max-w-[62ch]">
                {/* Summary Box as ONE Tactile PaperCard */}
                <div className="mb-12">
                  <PaperCard className="font-sans p-6 sm:p-7 shadow-[0_8px_30px_rgba(0,0,0,0.18)]">
                    <div className="flex items-start gap-3.5">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[6px] border border-[var(--paper-line)] bg-[var(--paper-ink)]/5 text-[var(--paper-ink)]">
                        <ShieldCheck className="h-4 w-4" />
                      </span>
                      <div className="space-y-2 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--paper-line)] pb-2.5">
                          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--paper-ink)]">
                            {summaryTitle}
                          </span>
                          <span className="rounded-[4px] bg-[var(--paper-ink)]/10 px-2 py-0.5 font-mono text-[10px] text-[var(--paper-ink)]">
                            BINDING COMMITMENT
                          </span>
                        </div>
                        {summaryText || defaultSummary}
                      </div>
                    </div>
                  </PaperCard>
                </div>

                {/* Body Content with Mono Type for Clause Numbers & 62ch reading width */}
                <div className="space-y-12 text-[16px] sm:text-[17px] font-light leading-[1.65] text-[var(--text-dim)] [&_p]:mb-4 [&_p]:text-[var(--text-dim)] [&_ul]:list-none [&_ul]:space-y-3 [&_ul]:my-4 [&_li]:relative [&_li]:pl-6 [&_li]:before:absolute [&_li]:before:left-0 [&_li]:before:top-2 [&_li]:before:h-1.5 [&_li]:before:w-1.5 [&_li]:before:rounded-[1px] [&_li]:before:bg-[var(--verified)] [&_strong]:font-medium [&_strong]:text-[var(--text)] [&_a]:text-[var(--verified)] [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-white [&_code]:rounded-[4px] [&_code]:border [&_code]:border-[var(--line)] [&_code]:bg-[var(--surface-2)] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-xs [&_code]:text-[var(--text)]">
                  {children}
                </div>
              </div>
            </article>
          </div>
        </Container>
      </main>

      <Footer />
    </div>
  );
}

export default LegalPage;
