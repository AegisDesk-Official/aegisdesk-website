import * as React from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Adds hover and press feedback. Use it when the whole card is clickable. */
  interactive?: boolean;
}

/**
 * Card primitive aligned with DESIGN.md:
 * - 16px radius (rounded-[16px])
 * - 1px border in --line
 * - Background in --surface
 * - No drop shadows (reserved strictly for paper cards)
 */
export function Card({ className, interactive = false, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-[16px] border border-[var(--line)] bg-[var(--surface)] text-[var(--text)] transition-colors duration-150",
        interactive &&
          "touch-manipulation cursor-pointer hover:border-[var(--line-strong)] hover:bg-[var(--surface-2)] active:scale-[0.99]",
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col space-y-1.5 p-5 sm:p-6", className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("text-base sm:text-lg font-medium tracking-tight text-[var(--text)]", className)}
      {...props}
    />
  );
}

export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-xs sm:text-[13px] text-[var(--text-dim)] font-light", className)} {...props} />;
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5 pt-0 sm:p-6 sm:pt-0", className)} {...props} />;
}

export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex items-center p-5 pt-0 sm:p-6 sm:pt-0 border-t border-[var(--line)]", className)} {...props} />;
}

export default Card;
