"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

function ForgotPasswordContent() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
    } catch {
      // Intentionally silent
    } finally {
      setIsSubmitting(false);
      setSubmitted(true);
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
              Account Recovery
            </p>
            <h1 className="mt-1 font-sans text-2xl font-light tracking-[-0.03em] text-[var(--text)]">
              Reset Your Password
            </h1>
            <p className="mt-1 text-xs text-[var(--text-dim)]">
              Enter your corporate email address to receive secure password recovery instructions.
            </p>
          </div>

          {submitted ? (
            <div className="space-y-5">
              <div
                role="status"
                className="p-3.5 rounded-[10px] border border-[var(--verified)]/30 bg-[var(--verified)]/10 text-[var(--verified)] text-xs flex items-start gap-2.5"
              >
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="text-[13px] leading-relaxed">
                  If an account exists for this address, password reset instructions have been sent. For security, we never reveal whether an account is registered.
                </span>
              </div>
              <div className="pt-2 text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-[10px] bg-[var(--paper)] py-2.5 px-4 text-center font-sans text-sm font-medium text-[var(--paper-ink)] hover:opacity-90 transition-opacity"
                >
                  Return to Sign In
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="reset-email"
                  className="block font-mono text-[12px] uppercase tracking-[0.08em] text-[var(--text-dim)] mb-1.5"
                >
                  Corporate Email
                </label>
                <input
                  id="reset-email"
                  type="email"
                  required
                  autoFocus
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-[10px] border border-[var(--line)] bg-[var(--surface-2)] px-3.5 py-2.5 text-[15px] text-[var(--text)] placeholder-[var(--text-faint)] focus:border-[var(--line-strong)] focus:outline-none focus:ring-1 focus:ring-[var(--paper)] transition-colors"
                  placeholder="name@company.com"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full inline-flex items-center justify-center rounded-[10px] bg-[var(--paper)] py-3 px-4 text-center font-sans text-[15px] font-medium text-[var(--paper-ink)] shadow-[0_2px_8px_rgba(0,0,0,0.18)] transition-opacity duration-150 hover:opacity-90 active:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <span className="font-mono text-xs uppercase tracking-wider">Sending instructions...</span>
                  ) : (
                    <span>Send Reset Instructions</span>
                  )}
                </button>
              </div>

              <div className="pt-2 text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 font-mono text-xs text-[var(--text-dim)] hover:text-[var(--text)] transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to login</span>
                </Link>
              </div>
            </form>
          )}
        </div>

        <p className="mt-8 text-center text-xs text-[var(--text-faint)] font-mono">
          Reset tokens are single-use and expire within 60 minutes.
        </p>
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[var(--canvas)] flex items-center justify-center">
          <div className="w-4 h-4 rounded-full border-2 border-[var(--paper)] border-t-transparent animate-spin" />
        </div>
      }
    >
      <ForgotPasswordContent />
    </Suspense>
  );
}
