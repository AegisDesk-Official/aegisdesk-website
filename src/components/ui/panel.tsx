import * as React from "react";
import { cn } from "@/lib/utils";

export interface PanelProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "surface" | "surface-2";
  interactive?: boolean;
}

/**
 * Panel primitive per DESIGN.md:
 * - 16px radius (rounded-[16px])
 * - 1px border in --line
 * - Background in --surface (default) or --surface-2
 * - No drop shadows (drop shadows are reserved strictly for paper cards)
 * - 150ms border brightens on hover when interactive
 */
export const Panel = React.forwardRef<HTMLDivElement, PanelProps>(
  ({ className, variant = "surface", interactive = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-[16px] border border-[var(--line)] transition-colors duration-150",
          variant === "surface" ? "bg-[var(--surface)]" : "bg-[var(--surface-2)]",
          interactive && "hover:border-[var(--line-strong)]",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Panel.displayName = "Panel";

export default Panel;
