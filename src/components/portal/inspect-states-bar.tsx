"use client";

import React, { useEffect, useState } from "react";

export interface InspectStatesBarProps {
  label?: string;
  onSelectState: (state: "loading" | "empty" | "error") => void;
}

/**
 * Inspection bar for testing Loading, Empty, and Error states.
 * Only shown in development when ?devstates=1 is in the URL.
 * Never rendered in production.
 */
export function InspectStatesBar({ label, onSelectState }: InspectStatesBarProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      try {
        const params = new URLSearchParams(window.location.search);
        if (params.get("devstates") === "1") {
          setShow(true);
        }
      } catch {}
    }
  }, []);

  if (!show) return null;

  return (
    <div className="flex items-center justify-between text-[11px] font-mono text-[var(--text-faint)] border-b border-[var(--line)] pb-2">
      <span>{label || "Simulation Control"}</span>
      <div className="flex items-center gap-3">
        <span>Inspect states:</span>
        <button onClick={() => onSelectState("loading")} className="hover:text-[var(--text)] underline">
          Loading
        </button>
        <span>•</span>
        <button onClick={() => onSelectState("empty")} className="hover:text-[var(--text)] underline">
          Empty
        </button>
        <span>•</span>
        <button onClick={() => onSelectState("error")} className="hover:text-[var(--text)] underline">
          Error
        </button>
      </div>
    </div>
  );
}

export default InspectStatesBar;
