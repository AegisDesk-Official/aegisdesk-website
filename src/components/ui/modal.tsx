"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl";
}

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Dark liquid-glass dialog.
 *
 *  - Phones: slides up as a bottom sheet with safe-area padding, so it never
 *    sits under the iOS home bar or gets clipped by the keyboard.
 *  - Desktop: centered card.
 *  - `data-lenis-prevent` tells the smooth-scroll library to leave this layer
 *    alone, so a tall dialog scrolls natively with the finger or wheel.
 *  - On touch screens focus goes to the dialog, not the first field, so the
 *    keyboard does not pop up and push the form out of view.
 */
export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = "lg",
}: ModalProps) {
  const dialogRef = React.useRef<HTMLDivElement>(null);
  const titleId = React.useId();
  const descId = React.useId();

  React.useEffect(() => {
    if (!isOpen) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const dialog = dialogRef.current;
    const touchFirst = window.matchMedia("(pointer: coarse)").matches;
    const first = touchFirst
      ? null
      : dialog?.querySelector<HTMLElement>(
          'input:not([disabled]):not([type="hidden"]), textarea, select'
        );
    (first ?? dialog)?.focus({ preventScroll: true });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        return;
      }
      // Keep Tab inside the dialog.
      if (e.key === "Tab" && dialog) {
        const items = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
          (el) => el.offsetParent !== null
        );
        if (items.length === 0) {
          e.preventDefault();
          return;
        }
        const firstItem = items[0];
        const lastItem = items[items.length - 1];
        if (e.shiftKey && document.activeElement === firstItem) {
          e.preventDefault();
          lastItem.focus();
        } else if (!e.shiftKey && document.activeElement === lastItem) {
          e.preventDefault();
          firstItem.focus();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      previouslyFocused?.focus?.({ preventScroll: true });
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: "sm:max-w-sm",
    md: "sm:max-w-md",
    lg: "sm:max-w-lg",
    xl: "sm:max-w-xl",
    "2xl": "sm:max-w-2xl",
  };

  return (
    <div data-lenis-prevent className="fixed inset-0 z-50 overflow-y-auto overscroll-contain">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* `min-h-full` + `items-end sm:items-center` keeps tall dialogs reachable from the top. */}
      <div className="relative flex min-h-full items-end justify-center p-0 sm:items-center sm:p-6">
        <div
          ref={dialogRef}
          tabIndex={-1}
          className={cn(
            "relative z-10 w-full animate-fade-in overflow-hidden rounded-t-2xl border border-b-0 border-white/10 bg-slate-900/90 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_-24px_64px_-16px_rgba(0,0,0,0.7)] outline-none backdrop-blur-2xl",
            "pb-[max(1.25rem,env(safe-area-inset-bottom))]",
            "sm:rounded-2xl sm:border-b sm:p-6 sm:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_24px_64px_-16px_rgba(0,0,0,0.7)]",
            maxWidthClasses[maxWidth]
          )}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={description ? descId : undefined}
        >
          <div className="flex items-start justify-between gap-4 pb-3">
            <div>
              <h3 id={titleId} className="text-lg font-semibold tracking-tight text-foreground">
                {title}
              </h3>
              {description && (
                <p id={descId} className="mt-0.5 text-sm text-slate-400">
                  {description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="-mr-2 -mt-2 grid h-11 w-11 shrink-0 touch-manipulation place-items-center rounded-lg text-slate-400 transition-all duration-150 [-webkit-tap-highlight-color:transparent] hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/70 active:scale-[0.98]"
              aria-label="Close"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <div className="mt-3">{children}</div>
        </div>
      </div>
    </div>
  );
}
