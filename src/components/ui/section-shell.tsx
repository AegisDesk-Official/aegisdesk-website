import * as React from "react";
import { cn } from "@/lib/utils";

export interface SectionShellProps extends React.HTMLAttributes<HTMLElement> {
  variant?: "default" | "brand";
  as?: React.ElementType;
}

/**
 * SectionShell primitive per DESIGN.md:
 * - Section padding: 140px desktop, 88px mobile (py-[88px] lg:py-[140px])
 * - One idea per section
 * - Variant "default": canvas background
 * - Variant "brand": full-bleed --brand field (#0A433A) with cream text
 */
export const SectionShell = React.forwardRef<HTMLElement, SectionShellProps>(
  ({ className, variant = "default", as: Component = "section", children, ...props }, ref) => {
    return React.createElement(
      Component,
      {
        ref,
        className: cn(
          "relative w-full py-[88px] lg:py-[140px]",
          variant === "brand"
            ? "bg-[var(--brand)] text-[var(--paper)]"
            : "bg-[var(--canvas)] text-[var(--text)]",
          className
        ),
        ...props,
      },
      children
    );
  }
);
SectionShell.displayName = "SectionShell";

export default SectionShell;
