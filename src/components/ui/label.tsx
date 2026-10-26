import * as React from "react";
import { cn } from "@/lib/utils";

export interface LabelProps extends React.HTMLAttributes<HTMLSpanElement> {
  dim?: boolean;
  faint?: boolean;
  as?: "span" | "p" | "label" | "div";
}

/**
 * Label primitive per DESIGN.md:
 * - Geist Mono 12px
 * - Uppercase
 * - Letter-spacing 0.08em
 * - Tabular numbers
 * - Responsive break-words to avoid blowing out mobile viewport
 */
export const Label = React.forwardRef<HTMLElement, LabelProps>(
  ({ className, dim = false, faint = false, as: Component = "span", children, ...props }, ref) => {
    return React.createElement(
      Component,
      {
        ref,
        className: cn(
          "font-mono text-[12px] uppercase tracking-[0.08em] tabular-nums leading-normal break-words",
          faint
            ? "text-[var(--text-faint)]"
            : dim
            ? "text-[var(--text-dim)]"
            : "text-[var(--text)]",
          className
        ),
        ...props,
      },
      children
    );
  }
);
Label.displayName = "Label";

export default Label;
