import * as React from "react";
import { cn } from "@/lib/utils";

export type StatusVariant = "verified" | "warn" | "blocked" | "neutral";

export interface StatusChipProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: StatusVariant;
  indicator?: boolean;
}

/**
 * StatusChip primitive per DESIGN.md:
 * - 6px radius (rounded-[6px])
 * - No pill buttons
 * - 1px border in --line
 * - No icons inside coloured circles
 * - Mono uppercase label (12px, 0.08em tracking, tabular-nums)
 * - Colours: --verified (#6FD8A6), --warn (#E3B341), --blocked (#E5645C), neutral
 */
export const StatusChip = React.forwardRef<HTMLSpanElement, StatusChipProps>(
  ({ className, variant = "neutral", indicator = true, children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-[6px] border border-[var(--line)] bg-[var(--surface)] px-2.5 py-1 font-mono text-[12px] uppercase tracking-[0.08em] tabular-nums",
          variant === "verified" && "text-[var(--verified)]",
          variant === "warn" && "text-[var(--warn)]",
          variant === "blocked" && "text-[var(--blocked)]",
          variant === "neutral" && "text-[var(--text-dim)]",
          className
        )}
        {...props}
      >
        {indicator && (
          <span
            aria-hidden="true"
            className={cn(
              "h-1.5 w-1.5 rounded-[1px]",
              variant === "verified" && "bg-[var(--verified)]",
              variant === "warn" && "bg-[var(--warn)]",
              variant === "blocked" && "bg-[var(--blocked)]",
              variant === "neutral" && "bg-[var(--text-dim)]"
            )}
          />
        )}
        {children}
      </span>
    );
  }
);
StatusChip.displayName = "StatusChip";

export default StatusChip;
