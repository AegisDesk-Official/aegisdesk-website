"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, Lock } from "lucide-react";
import { useTurnstile } from "@/lib/security/use-turnstile";
import { siteConfig } from "@/lib/site-config";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get("redirect");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [turnstileRequired, setTurnstileRequired] = useState(false);

  const turnstile = useTurnstile(siteConfig.turnstileSiteKey || "1x00000000000000000000AA");

  // Check if visitor is already signed in
  useEffect(() => {
    const cookies = document.cookie;
    if (cookies.includes("aegis_session_token=")) {
      if (cookies.includes("aegis_user_role=owner") && cookies.includes("aegis_aal=aal2")) {
        router.replace("/operator");
      } else if (cookies.includes("aegis_user_role=")) {
        router.replace("/dashboard");
      }
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
          turnstileToken: turnstile.getToken() || "",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.turnstileRequired) {
          setTurnstileRequired(true);
        }
        setErrorMessage(data.error || "Invalid credentials or expired access link.");
        return;
      }

      if (data.requiresMfa) {
        router.push(data.redirect || "/auth/mfa-verify");
        return;
      }

      if (data.redirect) {
        const target = redirectParam || data.redirect;
        router.push(target);
      }
    } catch {
      setErrorMessage("Invalid credentials or expired access link.");
    } finally {
      setIsSubmitting(false);
      turnstile.reset();
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

        {/* Quiet Control Room Panel: 16px radius, --surface background, 1px border --line */}
        <div className="rounded-[16px] border border-[var(--line)] bg-[var(--surface)] p-6 sm:p-8 shadow-[0_8px_32px_rgba(0,0,0,0.36)]">
          <div className="mb-6">
            <p className="font-mono text-[12px] uppercase tracking-[0.08em] text-[var(--text-dim)]">
              Authentication Gate
            </p>
            <h1 className="mt-1 font-sans text-2xl font-light tracking-[-0.03em] text-[var(--text)]">
              Sign in to AegisDesk
            </h1>
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

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block font-mono text-[12px] uppercase tracking-[0.08em] text-[var(--text-dim)] mb-1.5"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-[10px] border border-[var(--line)] bg-[var(--surface-2)] px-3.5 py-2.5 text-[15px] text-[var(--text)] placeholder-[var(--text-faint)] focus:border-[var(--line-strong)] focus:outline-none focus:ring-1 focus:ring-[var(--paper)] transition-colors"
                placeholder="name@company.com"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="password"
                  className="block font-mono text-[12px] uppercase tracking-[0.08em] text-[var(--text-dim)]"
                >
                  Password
                </label>
                <Link
                  href="/auth/forgot-password"
                  className="font-mono text-[11px] text-[var(--text-dim)] hover:text-[var(--text)] transition-colors underline underline-offset-4"
                >
                  Forgot password?
                </Link>
              </div>
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-[10px] border border-[var(--line)] bg-[var(--surface-2)] px-3.5 py-2.5 text-[15px] text-[var(--text)] placeholder-[var(--text-faint)] focus:border-[var(--line-strong)] focus:outline-none focus:ring-1 focus:ring-[var(--paper)] transition-colors"
                placeholder="••••••••••••"
              />
            </div>

            {/* Turnstile widget: shown after 2 failures */}
            {turnstileRequired && (
              <div className="pt-2 flex justify-center">
                <div ref={turnstile.containerRef} className="min-h-[65px]" />
              </div>
            )}

            {/* Primary button: paper background, paper-ink text, 10px radius */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full inline-flex items-center justify-center rounded-[10px] bg-[var(--paper)] py-3 px-4 text-center font-sans text-[15px] font-medium text-[var(--paper-ink)] shadow-[0_2px_8px_rgba(0,0,0,0.18)] transition-opacity duration-150 hover:opacity-90 active:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <span className="font-mono text-xs uppercase tracking-wider">Verifying credentials...</span>
                ) : (
                  <span>Continue</span>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Minimal legal reassurance footer */}
        <p className="mt-8 text-center text-xs text-[var(--text-faint)] font-mono">
          Single sign-on protected by AES-256 session seals and multi-tenant RLS.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[var(--canvas)] flex items-center justify-center">
          <div className="w-4 h-4 rounded-full border-2 border-[var(--paper)] border-t-transparent animate-spin" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
