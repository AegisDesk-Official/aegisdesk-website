"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, CheckCircle2, ShieldCheck } from "lucide-react";

function InviteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [orgName, setOrgName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);

  useEffect(() => {
    if (!token) {
      setTokenValid(false);
      setErrorMessage("Invalid credentials or expired access link.");
      return;
    }

    fetch(`/api/auth/invite?token=${encodeURIComponent(token)}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.valid) {
          setTokenValid(false);
          setErrorMessage(data.error || "Invalid credentials or expired access link.");
        } else {
          setTokenValid(true);
          setOrgName(data.orgName || "Enterprise Workspace");
          setEmail(data.email || "");
        }
      })
      .catch(() => {
        setTokenValid(false);
        setErrorMessage("Invalid credentials or expired access link.");
      });
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match. Please re-enter.");
      return;
    }

    if (password.length < 12) {
      setErrorMessage("Password must be at least 12 characters long.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/auth/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "Invalid credentials or expired access link.");
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/dashboard");
      }, 1000);
    } catch {
      setErrorMessage("Activation failed. Please retry.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--canvas)] text-[var(--text)] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 selection:bg-[var(--verified)]/20">
      <div className="mx-auto w-full max-w-[420px]">
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
            <p className="font-mono text-[12px] uppercase tracking-[0.08em] text-[var(--text-dim)]">
              Workspace Activation
            </p>
            <h1 className="mt-1 font-sans text-2xl font-light tracking-[-0.03em] text-[var(--text)]">
              Accept Client Invitation
            </h1>
            {orgName && (
              <p className="mt-1 text-xs text-[var(--text-dim)] font-mono">
                Organization: <span className="text-[var(--text)] font-semibold">{orgName}</span>
                {email && <span> ({email})</span>}
              </p>
            )}
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

          {success && (
            <div className="mb-5 p-3 rounded-[10px] border border-[var(--verified)]/30 bg-[var(--verified)]/10 text-[var(--verified)] text-xs flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Invitation accepted. Initializing 14-day Shadow Validation workspace...</span>
            </div>
          )}

          {tokenValid === false ? (
            <div className="pt-2 text-center">
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-[10px] bg-[var(--paper)] py-2.5 px-4 text-center font-sans text-sm font-medium text-[var(--paper-ink)] hover:opacity-90 transition-opacity"
              >
                Return to Login
              </Link>
            </div>
          ) : tokenValid === null ? (
            <div className="py-8 text-center text-xs font-mono text-[var(--text-dim)] flex items-center justify-center gap-2">
              <div className="w-4 h-4 rounded-full border-2 border-[var(--paper)] border-t-transparent animate-spin" />
              <span>Verifying cryptographic link...</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="new-password"
                  className="block font-mono text-[12px] uppercase tracking-[0.08em] text-[var(--text-dim)] mb-1.5"
                >
                  Create Password (min 12 chars)
                </label>
                <input
                  id="new-password"
                  type="password"
                  required
                  autoFocus
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-[10px] border border-[var(--line)] bg-[var(--surface-2)] px-3.5 py-2.5 text-[15px] text-[var(--text)] placeholder-[var(--text-faint)] focus:border-[var(--line-strong)] focus:outline-none focus:ring-1 focus:ring-[var(--paper)] transition-colors"
                  placeholder="••••••••••••"
                />
              </div>

              <div>
                <label
                  htmlFor="confirm-password"
                  className="block font-mono text-[12px] uppercase tracking-[0.08em] text-[var(--text-dim)] mb-1.5"
                >
                  Confirm Password
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  required
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-[10px] border border-[var(--line)] bg-[var(--surface-2)] px-3.5 py-2.5 text-[15px] text-[var(--text)] placeholder-[var(--text-faint)] focus:border-[var(--line-strong)] focus:outline-none focus:ring-1 focus:ring-[var(--paper)] transition-colors"
                  placeholder="••••••••••••"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting || success}
                  className="w-full inline-flex items-center justify-center rounded-[10px] bg-[var(--paper)] py-3 px-4 text-center font-sans text-[15px] font-medium text-[var(--paper-ink)] shadow-[0_2px_8px_rgba(0,0,0,0.18)] transition-opacity duration-150 hover:opacity-90 active:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <span className="font-mono text-xs uppercase tracking-wider">Activating account...</span>
                  ) : (
                    <span>Set Password &amp; Open Dashboard</span>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        <p className="mt-8 text-center text-xs text-[var(--text-faint)] font-mono">
          Single-use invitation links expire after 7 days from issuance.
        </p>
      </div>
    </div>
  );
}

export default function InvitePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[var(--canvas)] flex items-center justify-center">
          <div className="w-4 h-4 rounded-full border-2 border-[var(--paper)] border-t-transparent animate-spin" />
        </div>
      }
    >
      <InviteContent />
    </Suspense>
  );
}
