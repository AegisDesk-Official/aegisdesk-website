"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Cookie, ShieldCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * CookieNotice:
 * Renders ONLY IF a non-essential cookie (e.g. analytics or ad pixel) is detected.
 * In default production mode, AegisDesk sets zero non-essential cookies, keeping the UI clean.
 */
export function CookieNotice() {
  const [shouldDisplay, setShouldDisplay] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check if user already dismissed notice
    const hasConsented = localStorage.getItem("aegis_cookie_consent");
    if (hasConsented) return;

    // Check if any non-essential cookies exist in document.cookie
    const nonEssentialPrefixes = ["_ga", "_gid", "_gat", "_fbp", "_hj", "ajs_", "mp_"];
    const currentCookies = document.cookie || "";

    const hasNonEssential = nonEssentialPrefixes.some((prefix) => currentCookies.includes(prefix));

    if (hasNonEssential) {
      setShouldDisplay(true);
    }
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem("aegis_cookie_consent", "accepted");
    setShouldDisplay(false);
    setDismissed(true);
  };

  const handleEssentialOnly = () => {
    localStorage.setItem("aegis_cookie_consent", "essential_only");
    // Clear any non-essential cookies
    const nonEssentialPrefixes = ["_ga", "_gid", "_gat", "_fbp", "_hj", "ajs_", "mp_"];
    const cookieNames = document.cookie.split(";").map((c) => c.trim().split("=")[0]);
    cookieNames.forEach((name) => {
      if (nonEssentialPrefixes.some((p) => name.startsWith(p))) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      }
    });
    setShouldDisplay(false);
    setDismissed(true);
  };

  if (!shouldDisplay || dismissed) return null;

  return (
    <div
      role="region"
      aria-label="Cookie Preferences"
      className="fixed bottom-4 right-4 z-50 max-w-sm rounded-[12px] border border-[var(--line-strong)] bg-[var(--surface-2)] p-4 shadow-2xl text-[var(--text)] text-xs space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-300"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Cookie className="w-4 h-4 text-[var(--verified)]" />
          <span className="font-mono text-xs uppercase tracking-wider text-[var(--verified)]">
            Privacy Telemetry
          </span>
        </div>
        <button
          onClick={handleEssentialOnly}
          className="text-[var(--text-faint)] hover:text-[var(--text)] transition-colors p-1"
          aria-label="Close cookie notice"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <p className="text-[var(--text-dim)] leading-relaxed text-[12px]">
        AegisDesk uses strictly essential session and security cookies (Cloudflare Turnstile, Supabase Auth).
        Non-essential performance analytics require your explicit consent.
      </p>

      <div className="flex items-center gap-2 pt-1">
        <Button size="sm" onClick={handleAcceptAll} className="text-xs h-7 flex-1">
          Accept All
        </Button>
        <Button size="sm" variant="outline" onClick={handleEssentialOnly} className="text-xs h-7 flex-1">
          Essential Only
        </Button>
      </div>

      <div className="text-[11px] font-mono text-center">
        <Link href="/privacy" className="text-[var(--text-faint)] hover:text-[var(--text)] underline">
          Read Privacy Policy &amp; Cookie Audit
        </Link>
      </div>
    </div>
  );
}

export default CookieNotice;
