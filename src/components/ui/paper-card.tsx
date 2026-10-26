import * as React from "react";
import { cn } from "@/lib/utils";

export interface PaperCardProps extends React.HTMLAttributes<HTMLDivElement> {
  sampleLabel?: string;
}

/**
 * PaperCard primitive per DESIGN.md:
 * - "Paper means evidence: source PDFs, citations, the pricing quote. Dark means the system. Never use paper for decoration."
 * - Background in --paper (#F4EFE9)
 * - Text in --paper-ink (#111311)
 * - Border in --paper-line (rgba(17,19,17,0.14))
 * - Soft, low drop shadow
 * - 16px radius (rounded-[16px])
 */
export const PaperCard = React.forwardRef<HTMLDivElement, PaperCardProps>(
  ({ className, sampleLabel, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-[16px] border border-[var(--paper-line)] bg-[var(--paper)] p-6 text-[var(--paper-ink)] shadow-[0_6px_24px_rgba(0,0,0,0.14)]",
          className
        )}
        {...props}
      >
        {sampleLabel && (
          <div className="mb-3 flex items-center justify-end">
            <span className="rounded-[4px] border border-[var(--paper-line)] px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--paper-ink)]/70">
              {sampleLabel}
            </span>
          </div>
        )}
        {children}
      </div>
    );
  }
);
PaperCard.displayName = "PaperCard";

export default PaperCard;
