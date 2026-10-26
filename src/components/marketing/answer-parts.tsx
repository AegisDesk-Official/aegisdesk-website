"use client";

import { Fragment, useState } from "react";
import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle2, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DemoCitation } from "@/lib/validation/demo-types";

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950";

/** Verified (emerald) or "Escalated to Human: Low Evidence" (amber). */
export function GroundingBadge({
  escalated,
  score,
  className,
}: {
  escalated: boolean;
  /** 0 to 1. Shown only when the backend sent one. */
  score?: number;
  className?: string;
}) {
  if (escalated) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md border border-amber-400/30 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-300",
          className
        )}
      >
        <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
        Escalated to Human: Low Evidence
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-300",
        className
      )}
    >
      <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
      Verified
      {typeof score === "number" && (
        <span className="font-mono font-normal tabular-nums opacity-90">· Grounding {Math.round(score * 100)}%</span>
      )}
    </span>
  );
}

function pillLabel(c: DemoCitation): string {
  return c.page ? `${c.source} · page ${c.page}` : c.source;
}

/** The highlighted passage an answer was grounded on. */
function SourceExcerpt({ snippet }: { snippet: string }) {
  return (
    <blockquote className="rounded-lg border border-white/[0.08] bg-slate-950/90 p-3.5 font-mono text-xs leading-relaxed text-slate-300">
      <span className="rounded-sm bg-emerald-400/15 px-0.5 text-emerald-100 [box-decoration-break:clone]">{snippet}</span>
    </blockquote>
  );
}

/** A clickable source pill that opens the exact passage the answer came from. */
export function CitationPill({
  citation,
  defaultOpen = false,
}: {
  citation: DemoCitation;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={cn(
          "inline-flex max-w-full items-center gap-1.5 rounded-lg border border-blue-500/40 bg-blue-950/70 px-2.5 py-1.5 text-left font-mono text-xs text-blue-300 transition-all duration-150 hover:border-emerald-400/60 hover:text-emerald-300 active:scale-[0.98]",
          open && "border-emerald-400/60 text-emerald-300",
          FOCUS_RING
        )}
      >
        <FileText className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span className="shrink-0">Source:</span>
        <span className="truncate tabular-nums">{pillLabel(citation)}</span>
      </button>
      {open && citation.snippet && <SourceExcerpt snippet={citation.snippet} />}
    </div>
  );
}

/**
 * One citation token. Renders as `[1]`, or as `[1] Return_Policy.pdf · p.3`
 * when children are passed. Hover and keyboard focus preview the source,
 * click pins it. The parent owns the state.
 */
export function CitationToken({
  index,
  active = false,
  controlsId,
  onHover,
  onSelect,
  label,
  children,
  className,
}: {
  /** Zero-based position in the citations array. The token shows index + 1. */
  index: number;
  active?: boolean;
  controlsId?: string;
  onHover?: (index: number | null) => void;
  onSelect?: (index: number) => void;
  /** Accessible name, e.g. "Citation 1: Return_Policy.pdf, page 3". */
  label: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-expanded={active}
      aria-controls={controlsId}
      onMouseEnter={() => onHover?.(index)}
      onMouseLeave={() => onHover?.(null)}
      onFocus={() => onHover?.(index)}
      onBlur={() => onHover?.(null)}
      onClick={() => onSelect?.(index)}
      className={cn(
        "group inline-flex items-center gap-1.5 rounded border border-blue-500/40 bg-blue-950/70 px-1.5 py-0.5 font-mono text-xs tabular-nums text-blue-300 transition-all duration-150 hover:border-emerald-400/60 hover:text-emerald-300 active:scale-[0.98]",
        active && "border-emerald-400/60 text-emerald-300",
        FOCUS_RING,
        className
      )}
    >
      <span aria-hidden="true">[{index + 1}]</span>
      {children && (
        <span
          className={cn(
            "text-slate-400 transition-colors group-hover:text-emerald-300",
            active && "text-emerald-300"
          )}
        >
          {children}
        </span>
      )}
    </button>
  );
}

// `[1]`, `[12]` map to citations. `[DOC-104]` style policy codes render as static tokens.
const MARKER = /(\[[A-Za-z0-9-]{1,12}\])/g;
const NUMERIC = /^\[(\d{1,2})\]$/;
const POLICY_CODE = /^\[[A-Za-z]{2,8}-\d{1,6}\]$/;

/**
 * Renders an answer with its inline `[n]` markers turned into interactive
 * monospace tokens. Markers are 1-based indexes into `citations`.
 */
export function AnswerParts({
  text,
  citations,
  activeIndex = null,
  onHover,
  onSelect,
  controlsId,
  className,
}: {
  text: string;
  citations: DemoCitation[];
  /** Zero-based index of the citation currently shown, if any. */
  activeIndex?: number | null;
  onHover?: (index: number | null) => void;
  onSelect?: (index: number) => void;
  controlsId?: string;
  className?: string;
}) {
  const parts = text.split(MARKER);

  return (
    <p className={className}>
      {parts.map((part, i) => {
        const numeric = NUMERIC.exec(part);
        if (numeric) {
          const idx = Number(numeric[1]) - 1;
          const citation = citations[idx];
          if (citation) {
            return (
              <CitationToken
                key={i}
                index={idx}
                active={activeIndex === idx}
                controlsId={controlsId}
                onHover={onHover}
                onSelect={onSelect}
                label={`Citation ${idx + 1}: ${pillLabel(citation)}`}
                className="relative -top-px mx-0.5 align-baseline"
              />
            );
          }
        }
        if (POLICY_CODE.test(part)) {
          return (
            <span
              key={i}
              className="relative -top-px mx-0.5 inline-flex items-center rounded border border-blue-500/40 bg-blue-950/70 px-1.5 py-0.5 align-baseline font-mono text-xs tabular-nums text-blue-300"
            >
              {part}
            </span>
          );
        }
        return <Fragment key={i}>{part}</Fragment>;
      })}
    </p>
  );
}
