"use client";

import React from "react";
import { AlertCircle, RotateCcw, PlusCircle, Inbox } from "lucide-react";

/**
 * Reusable control-room loading skeleton.
 * Denser than marketing site: 14px base, 8px rhythm, hairline borders.
 */
export function DashboardSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-4 animate-pulse" aria-label="Loading telemetry">
      {/* Top Banner Skeleton */}
      <div className="h-16 rounded-[10px] bg-[var(--surface)] border border-[var(--line)]" />

      {/* 6 Headline Tiles Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2">
        {Array.from({ length: 6 }).map((_, idx) => (
          <div
            key={idx}
            className="h-28 rounded-[8px] bg-[var(--surface)] border border-[var(--line)] p-3 flex flex-col justify-between"
          >
            <div className="h-3 w-16 bg-[var(--surface-2)] rounded" />
            <div className="h-7 w-20 bg-[var(--surface-2)] rounded" />
            <div className="h-2 w-24 bg-[var(--surface-2)] rounded" />
          </div>
        ))}
      </div>

      {/* Main Content Area Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 h-72 rounded-[10px] bg-[var(--surface)] border border-[var(--line)]" />
        <div className="h-72 rounded-[10px] bg-[var(--surface)] border border-[var(--line)]" />
      </div>

      {/* Table rows skeleton */}
      <div className="rounded-[10px] bg-[var(--surface)] border border-[var(--line)] p-4 space-y-3">
        <div className="h-4 w-32 bg-[var(--surface-2)] rounded" />
        {Array.from({ length: rows }).map((_, idx) => (
          <div key={idx} className="h-10 rounded bg-[var(--surface-2)]/60" />
        ))}
      </div>
    </div>
  );
}

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

/**
 * Empty state that says what will appear and how to add the first item.
 */
export function DashboardEmptyState({
  title,
  description,
  actionLabel,
  onAction,
  icon,
}: EmptyStateProps) {
  return (
    <div className="py-12 px-6 rounded-[10px] bg-[var(--surface)] border border-[var(--line)] text-center flex flex-col items-center justify-center">
      <div className="w-10 h-10 rounded-full bg-[var(--surface-2)] border border-[var(--line)] flex items-center justify-center text-[var(--text-dim)] mb-3">
        {icon || <Inbox className="w-5 h-5" />}
      </div>
      <h3 className="text-[14px] font-medium text-[var(--text)] mb-1">{title}</h3>
      <p className="text-[12px] text-[var(--text-dim)] max-w-md mx-auto leading-relaxed mb-4">
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[6px] bg-[var(--paper)] text-[var(--paper-ink)] hover:bg-white text-[12px] font-medium transition-colors"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>{actionLabel}</span>
        </button>
      )}
    </div>
  );
}

interface ErrorStateProps {
  message?: string;
  onRetry: () => void;
}

/**
 * Error state with a retry button for control room telemetry feeds.
 */
export function DashboardErrorState({
  message = "Failed to synchronize live telemetry feed from PostgreSQL events stream.",
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="p-4 rounded-[10px] bg-[rgba(229,100,92,0.08)] border border-[rgba(229,100,92,0.25)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
      <div className="flex items-center gap-2.5 text-[13px] text-[var(--blocked)]">
        <AlertCircle className="w-4 h-4 shrink-0" />
        <span className="font-mono text-[12px]">{message}</span>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center gap-1.5 h-7 px-3 rounded-[6px] bg-[var(--surface)] hover:bg-[var(--surface-2)] border border-[rgba(229,100,92,0.30)] text-[11px] font-mono text-[var(--text)] transition-colors shrink-0"
      >
        <RotateCcw className="w-3 h-3 text-[var(--blocked)]" />
        <span>Retry Feed</span>
      </button>
    </div>
  );
}

export default DashboardSkeleton;
