"use client";

import React, { useState } from "react";
import { HelpCircle } from "lucide-react";

interface EstimateTooltipProps {
  label: string;
  formula: string;
  parameters: {
    name: string;
    value: string;
  }[];
}

export function EstimateTooltip({ label, formula, parameters }: EstimateTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative inline-flex items-center gap-1.5 group">
      <span className="text-[11px] font-mono text-[var(--text-dim)]">{label}</span>
      <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-[rgba(227,179,65,0.12)] text-[var(--warn)] border border-[rgba(227,179,65,0.25)] uppercase tracking-wider">
        Estimate
      </span>
      <button
        type="button"
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Formula breakdown"
        className="text-[var(--text-faint)] hover:text-[var(--text)] transition-colors focus:outline-none"
      >
        <HelpCircle className="w-3.5 h-3.5" />
      </button>

      {isOpen && (
        <div
          role="tooltip"
          className="absolute left-0 bottom-full mb-2 w-72 p-3 rounded-[8px] bg-[var(--surface-2)] border border-[var(--line-strong)] text-[11px] font-mono shadow-2xl z-50 pointer-events-none"
        >
          <div className="text-[var(--text)] font-semibold mb-1 pb-1 border-b border-[var(--line)] flex items-center justify-between">
            <span>Formula Specification</span>
            <span className="text-[9px] text-[var(--warn)]">Verified Math</span>
          </div>
          <div className="text-[var(--text-dim)] mb-2 p-1.5 rounded bg-[var(--canvas)] border border-[var(--line)] break-words">
            {formula}
          </div>
          <div className="space-y-1 text-[10px] text-[var(--text-faint)]">
            <span className="text-[var(--text-dim)] block uppercase text-[9px]">Organization Calibration:</span>
            {parameters.map((p) => (
              <div key={p.name} className="flex justify-between items-center">
                <span>{p.name}:</span>
                <span className="text-[var(--text)] tabular-nums font-semibold">{p.value}</span>
              </div>
            ))}
          </div>
          <div className="mt-2 pt-1.5 border-t border-[var(--line)] text-[9px] text-[var(--text-faint)]">
            Adjustable under Workspace Settings.
          </div>
        </div>
      )}
    </div>
  );
}

export default EstimateTooltip;
