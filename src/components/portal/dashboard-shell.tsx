"use client";

import React from "react";
import Link from "next/link";
import { DashboardSidebar } from "@/components/portal/dashboard-sidebar";
import { Activity, ShieldCheck, ChevronRight } from "lucide-react";
import DemoTag from "@/components/portal/demo-tag";
import { AuthProvider } from "@/lib/auth";

interface DashboardShellProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export function DashboardShell({
  children,
  title = "Client Portal",
  subtitle = "Apex Retail Hub",
}: DashboardShellProps) {
  const [viewAsClient, setViewAsClient] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const match = document.cookie.match(/aegis_view_as=([^;]+)/);
      if (match) {
        setViewAsClient(decodeURIComponent(match[1]));
      }
    }
  }, []);

  return (
    <AuthProvider>
      <div className="min-h-screen bg-[var(--canvas)] text-[var(--text)] text-[14px] antialiased selection:bg-[var(--glow)]/20">
        <DashboardSidebar tenantName={viewAsClient || subtitle} />

        {/* Main Content Area */}
        <div className="flex flex-col min-h-screen transition-all duration-150 sm:pl-16 min-[1100px]:pl-56 pb-16 sm:pb-0">
          {viewAsClient && (
            <div className="w-full bg-[var(--surface-2)] border-b border-[var(--glow)]/30 py-2 px-4 text-center font-mono text-[13px] text-[var(--glow)] flex items-center justify-center gap-3">
              <span>Viewing as {viewAsClient} · read-only</span>
              <button
                type="button"
                onClick={() => {
                  document.cookie = "aegis_view_as=; max-age=0; path=/";
                  document.cookie = "aegis_read_only=; max-age=0; path=/";
                  window.location.reload();
                }}
                className="underline hover:text-white text-[12px]"
              >
                Exit read-only view
              </button>
            </div>
          )}
          {/* Control Room Hairline Header */}
          <header className="h-14 px-4 sm:px-6 border-b border-[var(--line)] bg-[var(--surface)] flex items-center justify-between sticky top-0 z-30">
            <div className="flex items-center gap-2 text-[13px] font-mono">
              <span className="text-[var(--text-faint)]">AegisDesk</span>
              <ChevronRight className="w-3 h-3 text-[var(--text-faint)]" />
              <span className="text-[var(--text-dim)]">{title}</span>
              <ChevronRight className="w-3 h-3 text-[var(--text-faint)]" />
              <span className="text-[var(--text)] font-medium truncate max-w-[140px] sm:max-w-none">
                {subtitle}
              </span>
            </div>

            <div className="flex items-center gap-4 text-[13px] font-mono">
              <div
                className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-[6px] bg-[var(--surface-2)] border border-[var(--line)] text-[var(--text-dim)] group relative cursor-help"
                title="An answer must clear this bar before it can be sent."
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[var(--verified)]" />
                <span>Confidence bar:</span>
                <span className="text-[var(--verified)] font-semibold tabular-nums">92%</span>
                <div className="absolute top-full mt-1.5 right-0 hidden group-hover:block w-56 p-2 rounded-[6px] bg-[var(--surface)] border border-[var(--line)] shadow-xl text-[12px] text-[var(--text)] font-sans normal-case z-50">
                  An answer must clear this bar before it can be sent.
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[var(--verified)] animate-pulse" />
                <span className="text-[12px] text-[var(--text-faint)] tabular-nums">
                  24ms
                </span>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
            {children}
          </main>
        </div>
      </div>
    </AuthProvider>
  );
}

export default DashboardShell;
