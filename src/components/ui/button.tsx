import * as React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "link"
  // Legacy aliases
  | "default"
  | "outline"
  | "ghost"
  | "destructive";

export type ButtonSize = "default" | "sm" | "lg" | "icon";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
}

/**
 * Base button per DESIGN.md:
 * - 10px radius (rounded-[10px])
 * - 150ms hover transition
 * - No pill buttons
 */
const baseStyles =
  "inline-flex touch-manipulation select-none items-center justify-center whitespace-nowrap rounded-[10px] text-sm font-medium transition-all duration-150 [-webkit-tap-highlight-color:transparent] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--paper)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--canvas)] disabled:pointer-events-none disabled:opacity-50";

const variantStyles: Record<ButtonVariant, string> = {
  // Primary per DESIGN.md: paper background, paper-ink text. On a --brand field the button is paper too.
  primary:
    "border border-transparent bg-[var(--paper)] text-[var(--paper-ink)] shadow-[0_2px_8px_rgba(0,0,0,0.18)] hover:bg-white active:opacity-90",
  default:
    "border border-transparent bg-[var(--paper)] text-[var(--paper-ink)] shadow-[0_2px_8px_rgba(0,0,0,0.18)] hover:bg-white active:opacity-90",

  // Secondary per DESIGN.md: dark surface, 1px border in --line, text --text, hover border brightens to --line-strong
  secondary:
    "border border-[var(--line)] bg-[var(--surface)] text-[var(--text)] hover:border-[var(--line-strong)] hover:bg-[var(--surface-2)] active:opacity-90",

  // Text link per DESIGN.md: quiet inline link
  link:
    "border-transparent bg-transparent text-[var(--text)] underline-offset-4 hover:underline hover:text-[var(--paper)] !min-h-0 !p-0",

  // Legacy variants preserved for portal / existing components
  outline:
    "border border-[var(--line)] bg-[var(--surface)] text-[var(--text)] hover:border-[var(--line-strong)] hover:bg-[var(--surface-2)]",
  ghost:
    "border-transparent text-[var(--text-dim)] hover:bg-[var(--surface)] hover:text-[var(--text)]",
  destructive:
    "border border-[var(--blocked)]/30 bg-[var(--blocked)]/20 text-[#ff8e88] hover:bg-[var(--blocked)]/30",
};

const sizeStyles: Record<ButtonSize, string> = {
  default: "min-h-[44px] px-5 py-2.5",
  sm: "min-h-[36px] px-3.5 py-1.5 text-xs",
  lg: "min-h-[48px] px-7 py-3 text-base font-semibold",
  icon: "h-11 min-h-[44px] w-11 min-w-[44px] p-0",
};

export function buttonVariants({
  variant = "primary",
  size = "default",
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}) {
  return cn(baseStyles, variantStyles[variant], sizeStyles[size], className);
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "default", isLoading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={buttonVariants({ variant, size, className })}
        disabled={disabled || isLoading}
        aria-busy={isLoading || undefined}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

export default Button;
