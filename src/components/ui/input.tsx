"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
}

/**
 * Dark glass text field.
 *  - 44px minimum height for thumbs.
 *  - 16px text on phones. iOS Safari zooms the whole page when a field with
 *    smaller text gets focus, so `text-base` is below `sm` and `text-sm` above.
 *  - The label and the error message are tied to the field for screen readers
 *    even when the caller does not pass an `id`.
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, label, id, ...props }, ref) => {
    const autoId = React.useId();
    const inputId = id ?? autoId;
    const errorId = `${inputId}-error`;

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-medium text-slate-300">
            {label}
          </label>
        )}
        <input
          id={inputId}
          type={type}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : props["aria-describedby"]}
          className={cn(
            "flex min-h-[44px] w-full rounded-lg border border-white/10 bg-slate-950/70 px-3 py-2 text-base text-slate-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-colors sm:text-sm",
            "ring-offset-slate-950 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500",
            "hover:border-white/20 focus-visible:border-blue-400/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/50 focus-visible:ring-offset-1",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-red-400/50 focus-visible:border-red-400/60 focus-visible:ring-red-400/40",
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p id={errorId} role="alert" className="text-xs text-red-400">
            {error}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";
