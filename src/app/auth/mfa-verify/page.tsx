"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, KeyRound, ShieldAlert, Check, Copy } from "lucide-react";

function MfaVerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect") || "/operator";

  const [code, setCode] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingSetup, setLoadingSetup] = useState(true);
  const [setupData, setSetupData] = useState<{
    isFirstTimeSetup: boolean;
    secret?: string;
    recoveryCodes?: string[];
  } | null>(null);
  const [copiedCodes, setCopiedCodes] = useState(false);

  useEffect(() => {
    fetch("/api/auth/mfa")
      .then((res) => {
        if (!res.ok) {
          // If no pending MFA, redirect back to login
          router.replace("/login");
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data) {
          setSetupData(data);
        }
      })
      .catch(() => {
        router.replace("/login");
      })
      .finally(() => {
        setLoadingSetup(false);
      });
  }, [router]);

  const handleCopyRecoveryCodes = () => {
    if (setupData?.recoveryCodes) {
      navigator.clipboard.writeText(setupData.recoveryCodes.join("\n"));
      setCopiedCodes(true);
      setTimeout(() => setCopiedCodes(false), 2000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    const clean = code.trim();
    if (!clean) {
      setErrorMessage("Please enter your 6-digit authenticator code or recovery key.");
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/mfa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: clean }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "Invalid authentication code. Please check your authenticator app.");
        return;
      }

      router.push(redirectPath);
    } catch {
      setErrorMessage("Authentication failed. Please retry.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingSetup) {
    return (
      <div className="min-h-screen bg-[var(--canvas)] flex items-center justify-center text-[var(--text-dim)]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-5 h-5 rounded-full border-2 border-[var(--paper)] border-t-transparent animate-spin" />
          <span className="font-mono text-xs uppercase tracking-wider">Verifying security state...</span>
        </div>
      </div>
    );
  }

  const isFirstTime = setupData?.isFirstTimeSetup;

  return (
    <div className="min-h-screen bg-[var(--canvas)] text-[var(--text)] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 selection:bg-[var(--verified)]/20">
      <div className="mx-auto w-full max-w-[460px]">
        {/* Brand Lockup */}
        <div className="flex justify-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--verified)]" />
            <span className="font-medium text-lg tracking-tight text-[var(--text)] group-hover:text-white transition-colors">
              AegisDesk
            </span>
          </Link>
        </div>

        {/* Panel: 16px radius, --surface background, 1px border --line */}
        <div className="rounded-[16px] border border-[var(--line)] bg-[var(--surface)] p-6 sm:p-8 shadow-[0_8px_32px_rgba(0,0,0,0.36)]">
          <div className="mb-6">
            <p className="font-mono text-[12px] uppercase tracking-[0.08em] text-[var(--text-dim)] flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-[var(--warn)]" />
              {isFirstTime ? "Mandatory TOTP Enrollment" : "Step 2: Authenticator App"}
            </p>
            <h1 className="mt-1 font-sans text-2xl font-light tracking-[-0.03em] text-[var(--text)]">
              {isFirstTime ? "Configure Authenticator" : "Enter Verification Code"}
            </h1>
            <p className="mt-1 text-xs text-[var(--text-dim)]">
              {isFirstTime
                ? "Add this key to your authenticator app (1Password, Google Authenticator) and store recovery codes."
                : "Enter the current 6-digit TOTP code from your authenticator app or an unused emergency recovery code."}
            </p>
          </div>

          {errorMessage && (
            <div
              role="alert"
              className="mb-5 p-3 rounded-[10px] border border-[var(--blocked)]/30 bg-[var(--blocked)]/10 text-[var(--blocked)] text-xs flex items-center gap-2.5"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {isFirstTime && (
            <div className="mb-6 space-y-4">
              {/* Secret Key Display */}
              <div className="p-3.5 rounded-[10px] border border-[var(--line)] bg-[var(--surface-2)]">
                <span className="text-[11px] font-mono uppercase text-[var(--text-faint)] block mb-1">
                  Manual Setup Secret Key
                </span>
                <code className="text-[13px] font-mono text-[var(--verified)] select-all tracking-wider break-all">
                  {setupData?.secret}
                </code>
              </div>

              {/* Recovery Codes Paper Card (shown once) */}
              <div className="p-4 rounded-[12px] border border-[var(--paper-line)] bg-[var(--paper)] text-[var(--paper-ink)] shadow-md">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-mono uppercase font-bold tracking-wider">
                    Emergency Recovery Codes (Shown Once)
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyRecoveryCodes}
                    className="inline-flex items-center gap-1 text-[11px] font-mono bg-black/10 px-2 py-0.5 rounded hover:bg-black/15 transition-colors"
                  >
                    {copiedCodes ? <Check className="w-3 h-3 text-emerald-700" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedCodes ? "Copied" : "Copy All"}</span>
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-1.5 font-mono text-[12px]">
                  {setupData?.recoveryCodes?.map((rc, idx) => (
                    <div key={idx} className="p-1 bg-black/5 rounded text-center tracking-wider font-semibold">
                      {rc}
                    </div>
                  ))}
                </div>
                <p className="text-[11px] mt-2 opacity-80 leading-tight">
                  Save these codes now in a password manager. If you lose your authenticator app, these are the only way to recover access.
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="totp-code"
                className="block font-mono text-[12px] uppercase tracking-[0.08em] text-[var(--text-dim)] mb-1.5"
              >
                {isFirstTime ? "Confirm 6-Digit Code" : "Authenticator or Recovery Code"}
              </label>
              <input
                id="totp-code"
                type="text"
                required
                autoFocus
                autoComplete="one-time-code"
                maxLength={15}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full rounded-[10px] border border-[var(--line)] bg-[var(--surface-2)] px-3.5 py-2.5 text-center font-mono text-lg tracking-[0.2em] text-[var(--text)] placeholder-[var(--text-faint)] focus:border-[var(--line-strong)] focus:outline-none focus:ring-1 focus:ring-[var(--paper)] transition-colors"
                placeholder={isFirstTime ? "000000" : "6-digit code or code-key"}
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full inline-flex items-center justify-center rounded-[10px] bg-[var(--paper)] py-3 px-4 text-center font-sans text-[15px] font-medium text-[var(--paper-ink)] shadow-[0_2px_8px_rgba(0,0,0,0.18)] transition-opacity duration-150 hover:opacity-90 active:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <span className="font-mono text-xs uppercase tracking-wider">Verifying TOTP...</span>
                ) : (
                  <span>{isFirstTime ? "Confirm & Activate Console" : "Verify & Open Console"}</span>
                )}
              </button>
            </div>
          </form>
        </div>

        <p className="mt-8 text-center text-xs text-[var(--text-faint)] font-mono">
          Session expires after 8 hours or 30 minutes of idle inactivity.
        </p>
      </div>
    </div>
  );
}

export default function MfaVerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[var(--canvas)] flex items-center justify-center">
          <div className="w-4 h-4 rounded-full border-2 border-[var(--paper)] border-t-transparent animate-spin" />
        </div>
      }
    >
      <MfaVerifyContent />
    </Suspense>
  );
}
