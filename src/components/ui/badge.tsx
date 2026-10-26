import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?:
    | "default"
    | "secondary"
    | "destructive"
    | "outline"
    | "success"
    | "warning"
    | "indigo"
    | "verified"
    | "warn"
    | "blocked"
    | "info";
}

/**
 * Status badge aligned with DESIGN.md:
 * - 6px radius (rounded-[6px])
 * - 1px border in --line
 * - Status colours only: --verified (#6FD8A6), --warn (#E3B341), --blocked (#E5645C), neutral
 * - Geist Mono, uppercase, tabular-nums
 */
const variantStyles: Record<NonNullable<BadgeProps["variant"]>, string> = {
  // Verified / Success / Grounded
  verified: "border-[var(--line)] bg-[var(--surface-2)] text-[var(--verified)]",
  success: "border-[var(--line)] bg-[var(--surface-2)] text-[var(--verified)]",

  // Warn / Pending
  warn: "border-[var(--line)] bg-[var(--surface-2)] text-[var(--warn)]",
  warning: "border-[var(--line)] bg-[var(--surface-2)] text-[var(--warn)]",

  // Blocked / Destructive / Failed
  blocked: "border-[var(--line)] bg-[var(--surface-2)] text-[var(--blocked)]",
  destructive: "border-[var(--line)] bg-[var(--surface-2)] text-[var(--blocked)]",

  // Neutral / Secondary / Outline / Indigo / Info fallback to quiet neutral
  default: "border-[var(--line)] bg-[var(--surface-2)] text-[var(--text-dim)]",
  secondary: "border-[var(--line)] bg-[var(--surface-2)] text-[var(--text-dim)]",
  outline: "border-[var(--line)] bg-transparent text-[var(--text-dim)]",
  indigo: "border-[var(--line)] bg-[var(--surface-2)] text-[var(--verified)]",
  info: "border-[var(--line)] bg-[var(--surface-2)] text-[var(--text-dim)]",
};

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-[6px] border px-2 py-0.5 font-mono text-[11px] uppercase tracking-[0.08em] tabular-nums transition-colors",
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
}

export default Badge;
