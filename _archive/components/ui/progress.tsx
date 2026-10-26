import * as React from "react";
import { cn } from "@/lib/utils";

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number; // 0 to 100
  max?: number;
  indicatorClassName?: string;
}

export function Progress({ value, max = 100, className, indicatorClassName, ...props }: ProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div
      className={cn("relative h-2 w-full overflow-hidden rounded-[4px] bg-[var(--surface-2)] border border-[var(--line)]", className)}
      {...props}
    >
      <div
        className={cn("h-full bg-[var(--verified)] transition-all duration-300 ease-out", indicatorClassName)}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}

export default Progress;
