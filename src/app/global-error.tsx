"use client";

import { useEffect } from "react";
import Link from "next/link";
import { LogoMark } from "@/components/brand/logo";
import { safeLog } from "@/lib/security/sanitize";

export function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    safeLog("Critical global error boundary triggered", {
      digest: error.digest || "none",
    });
  }, [error]);

  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#0B0F0D] text-[#E8EDE8] flex items-center justify-center p-4 antialiased font-sans">
        <div className="w-full max-w-md text-center space-y-6">
          <LogoMark className="mx-auto h-12 w-12 text-[#F4EFE9]" />
          <div className="space-y-2">
            <p className="font-mono text-xs uppercase tracking-widest text-[#E3B341]">
              500 // ROOT_LAYOUT_FAULT
            </p>
            <h1 className="text-2xl sm:text-3xl font-light tracking-tight text-[#E8EDE8]">
              Critical Application Recovery
            </h1>
            <p className="text-sm text-[#9AA8A0] leading-relaxed">
              An unexpected condition halted the interface. No personal or ticket data was compromised.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={reset}
              className="w-full sm:w-auto px-5 py-2.5 rounded-[10px] bg-[#F4EFE9] text-[#111311] text-sm font-medium hover:bg-[#F4EFE9]/90 transition-colors"
            >
              Reload Application
            </button>
            <a
              href="/"
              className="w-full sm:w-auto px-5 py-2.5 rounded-[10px] border border-[rgba(214,235,224,0.18)] bg-[#111713] text-[#E8EDE8] text-sm hover:border-[rgba(214,235,224,0.3)] transition-colors"
            >
              Return Home
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}

export default GlobalError;
