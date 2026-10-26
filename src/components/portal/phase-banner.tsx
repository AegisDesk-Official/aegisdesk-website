"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, AlertTriangle, Clock, CheckCircle2 } from "lucide-react";

export interface PhaseBannerProps {
  shadowEndsAt?: string;
  isSettled?: boolean;
  settledAt?: string | null;
  serverTime?: number;
  onApprovalsDisabled?: (disabled: boolean) => void;
}

export function PhaseBanner({
  shadowEndsAt,
  isSettled = false,
  settledAt = null,
  serverTime = Date.now(),
  onApprovalsDisabled,
}: PhaseBannerProps) {
  const [now, setNow] = useState(serverTime);

  useEffect(() => {
    // Tick local clock every second
    const interval = setInterval(() => {
      setNow((prev) => prev + 1000);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const endTime = shadowEndsAt ? new Date(shadowEndsAt).getTime() : now + 14 * 24 * 3600 * 1000;
  const msRemaining = endTime - now;

  const isExpired = msRemaining <= 0;
  const isLast24Hours = !isExpired && msRemaining <= 24 * 3600 * 1000;
  const is48to24Hours = !isExpired && !isLast24Hours && msRemaining <= 48 * 3600 * 1000;
  const isMoreThan48Hours = !isExpired && msRemaining > 48 * 3600 * 1000;

  useEffect(() => {
    if (isExpired && !isSettled) {
      onApprovalsDisabled?.(true);
    } else {
      onApprovalsDisabled?.(false);
    }
  }, [isExpired, isSettled, onApprovalsDisabled]);

  // Format HH:MM:SS for countdown
  const hours = Math.floor(Math.max(0, msRemaining) / (1000 * 60 * 60));
  const minutes = Math.floor((Math.max(0, msRemaining) % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((Math.max(0, msRemaining) % (1000 * 60)) / 1000);
  const timeFormatted = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  // 1. After settlement: "Live", with the date.
  if (isSettled) {
    const formattedDate = settledAt
      ? new Date(settledAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
      : new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
    return (
      <section
        aria-label="Lifecycle Phase Banner"
        className="rounded-[10px] bg-[var(--surface)] border border-[rgba(111,216,166,0.3)] p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--verified)]" />
            <h2 className="text-[16px] font-medium text-[var(--text)] tracking-tight">
              Live — Activated on {formattedDate}
            </h2>
          </div>
          <p className="text-[13px] text-[var(--text-dim)] max-w-2xl leading-relaxed">
            Autonomous customer responses are active. Verified answers matching your documents are dispatched directly.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/dashboard/conversations"
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[6px] bg-[var(--surface-2)] hover:bg-[var(--surface-2)]/80 border border-[var(--line)] text-[13px] font-mono text-[var(--text)] transition-colors"
          >
            <span>Live Feed</span>
            <ArrowRight className="w-3.5 h-3.5 text-[var(--text-dim)]" />
          </Link>
        </div>
      </section>
    );
  }

  // 2. If the period ended unpaid: "Shadow Validation has ended. Settle in Billing to continue." and approvals are disabled (read-only).
  if (isExpired) {
    return (
      <section
        aria-label="Lifecycle Phase Banner"
        className="rounded-[10px] bg-[rgba(229,100,92,0.06)] border border-[rgba(229,100,92,0.3)] p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[var(--blocked)] shrink-0" />
            <h2 className="text-[16px] font-medium text-[var(--text)] tracking-tight">
              Shadow Validation has ended. Settle in Billing to continue.
            </h2>
          </div>
          <p className="text-[13px] text-[var(--text-dim)] max-w-2xl leading-relaxed">
            Draft approvals are currently paused in read-only mode until final settlement is completed.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/dashboard/billing"
            className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-[6px] bg-[var(--paper)] text-[var(--paper-ink)] hover:bg-white text-[13px] font-medium transition-colors"
          >
            <span>Settle balance &amp; go live</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>
    );
  }

  // 3. Last 24 hours: a live HH:MM:SS countdown and a button "Settle balance & go live" that opens Billing.
  if (isLast24Hours) {
    return (
      <section
        aria-label="Lifecycle Phase Banner"
        className="rounded-[10px] bg-[rgba(227,179,65,0.08)] border border-[rgba(227,179,65,0.3)] p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--warn)] animate-pulse" />
            <h2 className="text-[16px] font-medium text-[var(--text)] tracking-tight">
              Final Calibration Window Closing
            </h2>
            <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-[var(--surface)] border border-[var(--line)] font-mono text-[13px] tabular-nums text-[var(--warn)] font-medium">
              <Clock className="w-3 h-3 text-[var(--warn)]" />
              <span>{timeFormatted}</span>
            </div>
          </div>
          <p className="text-[13px] text-[var(--text-dim)] max-w-2xl leading-relaxed">
            Complete your settlement before the timer expires to smoothly transition to autonomous live replies.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/dashboard/billing"
            className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-[6px] bg-[var(--paper)] text-[var(--paper-ink)] hover:bg-white text-[13px] font-medium transition-colors"
          >
            <span>Settle balance &amp; go live</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>
    );
  }

  // 4. 48 to 24 hours left: an amber notice "Notice from the AegisDesk team: less than 48 hours remain in your Shadow Validation. Complete your final settlement in Billing to go live." with a link to Billing.
  if (is48to24Hours) {
    return (
      <section
        aria-label="Lifecycle Phase Banner"
        className="rounded-[10px] bg-[rgba(227,179,65,0.06)] border border-[rgba(227,179,65,0.25)] p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--warn)]" />
            <h2 className="text-[15px] font-medium text-[var(--text)] tracking-tight">
              Notice from the AegisDesk team: less than 48 hours remain in your Shadow Validation. Complete your final settlement in Billing to go live.
            </h2>
          </div>
          <p className="text-[13px] text-[var(--text-dim)] max-w-2xl leading-relaxed">
            Your calibration data has demonstrated strong deflection. Review your invoices and complete the balance settlement to activate live autonomous delivery.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/dashboard/billing"
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[6px] bg-[var(--surface-2)] hover:bg-[var(--surface-2)]/80 border border-[var(--line)] text-[13px] font-mono text-[var(--text)] transition-colors"
          >
            <span>Open Billing</span>
            <ArrowRight className="w-3.5 h-3.5 text-[var(--text-dim)]" />
          </Link>
        </div>
      </section>
    );
  }

  // 5. More than 48 hours left: "Parallel Shadow Validation — Active" and "AI drafts responses alongside your agents. Live replies switch on after final calibration sign-off." No day count, no timer, no "days left".
  return (
    <section
      aria-label="Lifecycle Phase Banner"
      className="rounded-[10px] bg-[var(--surface)] border border-[var(--line)] p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
    >
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[var(--verified)] animate-pulse" />
          <h2 className="text-[16px] font-medium text-[var(--text)] tracking-tight">
            Parallel Shadow Validation — Active
          </h2>
        </div>
        <p className="text-[13px] text-[var(--text-dim)] max-w-2xl leading-relaxed">
          AI drafts responses alongside your agents. Live replies switch on after final calibration sign-off.
        </p>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <Link
          href="/dashboard/conversations"
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[6px] bg-[var(--surface-2)] hover:bg-[var(--surface-2)]/80 border border-[var(--line)] text-[13px] font-mono text-[var(--text)] transition-colors"
        >
          <span>Inspect Shadow Queue</span>
          <ArrowRight className="w-3.5 h-3.5 text-[var(--text-dim)]" />
        </Link>
      </div>
    </section>
  );
}
