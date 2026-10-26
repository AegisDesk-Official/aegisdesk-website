'use client';

import React from "react";
import { Container } from "@/components/ui/container";

interface StatItem {
  id: string;
  metric: string;
  label: string;
  description: string;
  tag: string;
}

const STATS: StatItem[] = [
  {
    id: "accuracy",
    metric: "99.4%",
    label: "Grounded Accuracy",
    description:
      "Strict Corrective-RAG verification. Every factual statement maps to approved company source text.",
    tag: "Sample",
  },
  {
    id: "latency",
    metric: "<300ms",
    label: "Citation Latency",
    description:
      "Fast retrieval over your policy pages, technical manuals, and SOPs.",
    tag: "Sample",
  },
  {
    id: "onboarding",
    metric: "14-Day",
    label: "Shadow Validation Calibration",
    description:
      "AI drafts replies quietly inside your helpdesk for human agent approval before going live.",
    tag: "Signature",
  },
];

export function ProofStrip() {
  return (
    <section
      aria-label="System Telemetry & Proof"
      className="relative z-10 w-full border-y border-[var(--line)] bg-[var(--surface)] py-10 lg:py-12"
    >
      <Container>
        <div className="grid grid-cols-1 divide-y divide-[var(--line)] md:grid-cols-3 md:divide-x md:divide-y-0 min-w-0">
          {STATS.map((stat, idx) => (
            <div
              key={stat.id}
              className={`flex flex-col justify-between min-w-0 ${
                idx === 0
                  ? "pb-8 md:pb-0 md:pr-10"
                  : idx === 1
                  ? "py-8 md:py-0 md:px-10"
                  : "pt-8 md:pt-0 md:pl-10"
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono uppercase tracking-[0.08em] text-[var(--text-faint)]">
                    {"// "}0{idx + 1} TELEMETRY
                  </span>
                  <span className="rounded-[4px] border border-[var(--line)] px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-[0.08em] text-[var(--text-faint)]">
                    {stat.tag}
                  </span>
                </div>

                <div className="mt-3 text-[42px] font-light leading-none tracking-tight text-[var(--text)] tabular-nums lg:text-[48px]">
                  {stat.metric}
                </div>

                <div className="mt-2 text-[12px] font-mono font-medium uppercase tracking-[0.08em] text-[var(--text)]">
                  {stat.label}
                </div>
              </div>

              <p className="mt-4 text-[14px] leading-relaxed text-[var(--text-dim)]">
                {stat.description}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

export default ProofStrip;
