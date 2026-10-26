"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MessageSquare,
  FileText,
  BarChart2,
  CreditCard,
  Settings,
  LogOut,
  Layers,
} from "lucide-react";
import { LogoLockup } from "@/components/brand/logo";

interface DashboardSidebarProps {
  tenantName?: string;
}

export function DashboardSidebar({
  tenantName = "Apex Retail",
}: DashboardSidebarProps) {
  const pathname = usePathname();

  const navItems = [
    { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { label: "Conversations", href: "/dashboard/conversations", icon: MessageSquare },
    { label: "Knowledge", href: "/dashboard/knowledge-base", icon: FileText },
    { label: "Performance", href: "/dashboard/analytics", icon: BarChart2 },
    { label: "Billing", href: "/dashboard/billing", icon: CreditCard },
    { label: "Team & Settings", href: "/dashboard/settings", icon: Settings },
  ];

  return (
    <>
      {/* =================================================================== */}
      {/* DESKTOP (>= 1100px) & TABLET (640px - 1099px) COLLAPSIBLE SIDEBAR   */}
      {/* =================================================================== */}
      <aside className="hidden sm:flex fixed top-0 bottom-0 left-0 z-40 border-r border-[var(--line)] bg-[var(--surface)] flex-col justify-between transition-all duration-150 w-16 min-[1100px]:w-56">
        <div className="flex flex-col">
          {/* Logo & Header */}
          <div className="h-14 px-3 min-[1100px]:px-4 border-b border-[var(--line)] flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 overflow-hidden">
              <span className="w-2.5 h-2.5 rounded-full bg-[var(--verified)] shrink-0" />
              <span className="hidden min-[1100px]:inline text-[13px] font-medium tracking-tight text-[var(--text)] truncate">
                AegisDesk
              </span>
            </Link>
            <span className="hidden min-[1100px]:inline text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-[var(--surface-2)] text-[var(--text-faint)] border border-[var(--line)]">
              Portal
            </span>
          </div>

          {/* Active Tenant / Workspace Badge */}
          <div className="p-2 min-[1100px]:p-3 border-b border-[var(--line)]">
            <div className="hidden min-[1100px]:flex items-center justify-between text-[11px] mb-1">
              <span className="text-[var(--text-faint)] uppercase font-mono text-[9px]">Workspace</span>
              <span className="text-[var(--verified)] font-mono text-[9px] uppercase">Shadow Validation</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-[var(--surface-2)] border border-[var(--line)] flex items-center justify-center text-[var(--text-dim)] shrink-0">
                <Layers className="w-3.5 h-3.5" />
              </div>
              <div className="hidden min-[1100px]:block truncate">
                <p className="text-[12px] font-medium text-[var(--text)] truncate leading-tight">
                  {tenantName}
                </p>
                <p className="text-[10px] font-mono text-[var(--text-faint)] truncate leading-tight mt-0.5">
                  org-apex-01 • Zendesk
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-2 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={item.label}
                  className={`flex items-center gap-3 px-2.5 py-2 rounded-[6px] text-[13px] transition-colors ${
                    isActive
                      ? "bg-[var(--surface-2)] text-[var(--text)] font-medium border border-[var(--line)]"
                      : "text-[var(--text-dim)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]/60"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? "text-[var(--glow)]" : "text-[var(--text-dim)]"
                    }`}
                  />
                  <span className="hidden min-[1100px]:inline truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer Area: Client Sign Out */}
        <div className="p-2 border-t border-[var(--line)] space-y-1">
          <button
            type="button"
            onClick={async () => {
              try {
                await fetch("/api/auth/sign-out", { method: "POST" });
              } finally {
                window.location.href = "/login";
              }
            }}
            title="Sign Out"
            className="flex w-full items-center gap-3 px-2.5 py-2 rounded-[6px] text-[12px] text-[var(--text-faint)] hover:text-[var(--blocked)] hover:bg-[var(--surface-2)]/60 transition-colors"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span className="hidden min-[1100px]:inline">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* =================================================================== */}
      {/* MOBILE ( < 640px, e.g. 390px ) FIXED BOTTOM NAVIGATION BAR          */}
      {/* =================================================================== */}
      <nav
        aria-label="Mobile Bottom Navigation"
        className="sm:hidden fixed bottom-0 left-0 right-0 z-50 h-14 bg-[var(--surface)] border-t border-[var(--line)] px-2 flex items-center justify-around shadow-2xl"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-[6px] transition-colors ${
                isActive ? "text-[var(--glow)]" : "text-[var(--text-dim)]"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-[10px] mt-0.5 font-mono tracking-tight">{item.label.split(" ")[0]}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}

export default DashboardSidebar;
