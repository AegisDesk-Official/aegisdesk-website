'use client';

import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Container } from '@/components/ui/container';
import { siteConfig } from '@/lib/site-config';

export function FinalCta() {
  return (
    <section
      id="final-cta"
      aria-labelledby="final-cta-heading"
      className="relative w-full border-t border-[var(--line)] bg-[var(--brand)] py-[96px] lg:py-[120px] text-[var(--paper)]"
    >
      <Container>
        <div className="mx-auto max-w-[760px] text-center space-y-6 flex flex-col items-center">
          <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--paper)]/70">
            07 // FINAL ONBOARDING
          </span>

          <h2
            id="final-cta-heading"
            className="font-sans text-[36px] sm:text-[48px] lg:text-[56px] font-light leading-[1.05] tracking-[-0.03em] text-[var(--paper)]"
          >
            Put verified answers into your helpdesk.
          </h2>

          <p className="max-w-[54ch] text-[16px] sm:text-[18px] font-light leading-[1.6] text-[var(--paper)]/80">
            Start with a 14-day Shadow Validation. Your team approves every reply before going live.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
            {/* Canonical booking button 2 of 2 on the site */}
            <a
              href={siteConfig.calLink}
              data-cal-link={siteConfig.calLink.replace(/^https?:\/\/cal\.com\//i, "").replace(/\/+$/, "") || "aegis-desk-le98cq/15min"}
              data-cal-namespace="15min"
              data-cal-config='{"layout":"month_view","theme":"dark"}'
              className="inline-flex h-[48px] w-full sm:w-auto items-center justify-center rounded-[10px] bg-[var(--paper)] px-7 font-sans text-[15px] font-medium text-[var(--paper-ink)] shadow-[0_4px_16px_rgba(0,0,0,0.2)] transition-opacity duration-150 hover:opacity-90 cursor-pointer"
            >
              Book a 15-min scoping call
            </a>
          </div>

          <p className="pt-2 font-mono text-[11px] text-[var(--paper)]/60 uppercase tracking-[0.08em]">
            SETUP FROM $2,500 · RETAINER FROM $1,000/MO · 14-DAY SHADOW VALIDATION
          </p>
        </div>
      </Container>
    </section>
  );
}

export default FinalCta;
