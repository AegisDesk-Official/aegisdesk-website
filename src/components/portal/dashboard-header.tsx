"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Menu,
  Copy,
  Check,
  Bot,
  ExternalLink,
  Shield,
  Info,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/providers/toast-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface DashboardHeaderProps {
  onToggleSidebar: () => void;
}

export function DashboardHeader({ onToggleSidebar }: DashboardHeaderProps) {
  const { tenant, user } = useAuth();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [showTenantInfo, setShowTenantInfo] = useState(false);

  const copyTenantId = () => {
    if (tenant?.id) {
      navigator.clipboard.writeText(tenant.id);
      setCopied(true);
      toast({
        title: "Tenant ID Copied",
        description: "Your unique tenant workspace identifier is in your clipboard.",
        type: "info",
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 w-full border-b border-[var(--line)] bg-[var(--surface)]/95 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between">
      {/* Left items: Menu button & Tenant ID Display */}
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-[6px] text-[var(--text-dim)] hover:bg-[var(--surface-2)] hover:text-[var(--text)] transition-colors shrink-0"
          aria-label="Toggle navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Tenant identifier chip with copy button */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-[var(--surface-2)] border border-[var(--line)] text-xs">
            <span className="text-[11px] text-[var(--text-faint)] font-mono hidden sm:inline">Tenant:</span>
            <span className="font-mono font-semibold text-[var(--verified)] text-[12px] truncate max-w-[120px] sm:max-w-none">
              {tenant?.id || "tnt_apex_9921"}
            </span>
            <button
              onClick={copyTenantId}
              className="p-1 rounded-[4px] hover:bg-[var(--surface)] text-[var(--text-dim)] hover:text-[var(--text)] transition-colors shrink-0"
              title="Copy Tenant ID"
              aria-label="Copy Tenant ID"
            >
              {copied ? <Check className="h-3 w-3 text-[var(--verified)]" /> : <Copy className="h-3 w-3" />}
            </button>
            <button
              onClick={() => setShowTenantInfo(!showTenantInfo)}
              className="p-1 rounded-[4px] hover:bg-[var(--surface)] text-[var(--text-dim)] hover:text-[var(--text)] transition-colors shrink-0"
              title="Tenant Security Policy"
              aria-label="Tenant Security Policy"
            >
              <Info className="h-3 w-3" />
            </button>
          </div>

          <Badge variant="verified" className="hidden md:inline-flex text-[10px] items-center gap-1.5 shrink-0">
            <span className="w-1.5 h-1.5 rounded-[1px] bg-[var(--verified)]" />
            AI Assistant Active
          </Badge>
        </div>

        {/* Tenant ID Security Note popover */}
        {showTenantInfo && (
          <div className="absolute top-16 left-4 sm:left-6 z-50 max-w-sm p-4 rounded-[12px] border border-[var(--line-strong)] bg-[var(--surface-2)] shadow-2xl text-xs space-y-2 animate-in fade-in slide-in-from-top-1">
            <div className="font-semibold text-[var(--text)] flex items-center gap-1.5">
              <Shield className="h-4 w-4 text-[var(--verified)]" />
              Tenant ID Architecture
            </div>
            <p className="text-[var(--text-dim)] text-[11px] leading-relaxed font-light">
              &quot;The Tenant ID identifies your company&apos;s workspace. It is not a password, API key, or proof of authorization.&quot;
            </p>
            <p className="text-[10px] text-[var(--text-faint)] font-mono">
              All backend endpoints require a valid JWT token signed for your user membership.
            </p>
            <button
              onClick={() => setShowTenantInfo(false)}
              className="text-[11px] text-[var(--verified)] hover:underline font-mono uppercase tracking-[0.06em] block pt-1"
            >
              Close
            </button>
          </div>
        )}
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
        {/* Customer chat preview shortcut */}
        <Link href={`/widget/${tenant?.id || "tnt_apex_9921"}`} target="_blank" rel="noopener noreferrer">
          <Button size="sm" variant="secondary" className="hidden sm:inline-flex gap-1.5 text-xs h-8 px-3 rounded-[8px]">
            <Bot className="h-3.5 w-3.5 text-[var(--verified)]" />
            <span>Preview Chat</span>
            <ExternalLink className="h-3 w-3 text-[var(--text-dim)]" />
          </Button>
        </Link>

        {/* User Role & Name */}
        <div className="flex items-center gap-2 pl-2 border-l border-[var(--line)]">
          <div className="w-8 h-8 rounded-[8px] bg-[var(--surface-2)] text-[var(--text)] font-mono font-semibold flex items-center justify-center text-xs border border-[var(--line)]">
            {user?.name?.[0] || "A"}
          </div>
          <div className="hidden sm:flex flex-col text-left">
            <span className="text-[12px] font-medium text-[var(--text)] leading-none truncate max-w-[120px]">
              {user?.name || "Alex Morgan"}
            </span>
            <span className="text-[10px] font-mono text-[var(--text-dim)] uppercase tracking-[0.06em] mt-1">
              {user?.role || "Admin"}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}

export default DashboardHeader;
