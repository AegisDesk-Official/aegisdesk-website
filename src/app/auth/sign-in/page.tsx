"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, ShieldCheck, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/db/client";
import { siteConfig } from "@/lib/site-config";
import { useTurnstile } from "@/lib/security/use-turnstile";

function SignInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const turnstile = useTurnstile(siteConfig.turnstileSiteKey || "1x00000000000000000000AA");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Silent drop on bot honeypot trap
    if (honeypot) {
      setIsSubmitting(true);
      setTimeout(() => {
        setIsSubmitting(false);
        setErrorMessage("Access denied. Please contact support.");
      }, 500);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Fallback for local demo simulation if Supabase is in placeholder mode
        if (
          process.env.NODE_ENV !== "production" &&
          (email.includes("admin@orga.com") || email.includes("owner@aegisdesk.ai") || email.includes("apexretail.io"))
        ) {
          // Set preview cookie for development preview
          document.cookie = "aegis_session_token=mock-preview-session; path=/; max-age=28800; SameSite=Lax";
          document.cookie = "aegis_user_role=" + (email.includes("owner@aegisdesk.ai") ? "owner" : "admin") + "; path=/; max-age=28800; SameSite=Lax";
          document.cookie = "aegis_org_id=org_apex_industries; path=/; max-age=28800; SameSite=Lax";
          document.cookie = "aegis_session_created_at=" + Date.now() + "; path=/; max-age=28800; SameSite=Lax";

          if (email.includes("owner@aegisdesk.ai")) {
            router.push(`/auth/mfa-verify?redirect=${encodeURIComponent(redirectPath)}`);
          } else {
            router.push(redirectPath);
          }
          return;
        }
        throw error;
      }

      const user = data.user;
      const isOwner =
        user?.app_metadata?.role === "owner" ||
        user?.user_metadata?.role === "owner" ||
        user?.email?.toLowerCase().includes("owner@aegisdesk.ai");

      if (isOwner) {
        router.push(`/auth/mfa-verify?redirect=${encodeURIComponent(redirectPath)}`);
      } else {
        router.push(redirectPath);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Invalid credentials or unauthorized organization access.");
    } finally {
      setIsSubmitting(false);
      turnstile.reset();
    }
  };

  const handlePrefill = (role: "admin" | "owner") => {
    if (role === "admin") {
      setEmail("admin@orga.com");
      setPassword("Password123!");
    } else {
      setEmail("owner@aegisdesk.ai");
      setPassword("OwnerMasterPass123!");
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F0D] text-[#E8EDE8] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 selection:bg-[#6FD8A6]/20">
      <div className="mx-auto w-full max-w-md">
        {/* Brand Lockup */}
        <div className="flex justify-center mb-6">
          <Link href="/" className="inline-flex items-center gap-2.5 group">
            <span className="w-2.5 h-2.5 rounded-full bg-[#6FD8A6]" />
            <span className="font-medium text-lg tracking-tight text-[#E8EDE8] group-hover:text-white transition-colors">
              AegisDesk
            </span>
          </Link>
        </div>

        <div className="text-center">
          <p className="font-mono text-xs uppercase tracking-wider text-[#9AA8A0] mb-2">
            Client Portal Authentication
          </p>
          <h1 className="text-2xl sm:text-3xl font-light tracking-tight text-[#E8EDE8]">
            Sign in to your portal
          </h1>
          <p className="text-sm text-[#9AA8A0] mt-2 max-w-sm mx-auto">
            Access is restricted to authorized tenant members. Public registration is closed.
          </p>
        </div>
      </div>

      <div className="mt-8 mx-auto w-full max-w-md">
        <div className="bg-[#111713] rounded-2xl border border-[rgba(214,235,224,0.10)] p-5 sm:p-8 shadow-2xl">
          {errorMessage && (
            <div className="mb-6 p-3 rounded-lg border border-[#E5645C]/30 bg-[#E5645C]/10 text-[#E5645C] text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block font-mono text-[11px] uppercase tracking-wider text-[#9AA8A0] mb-1.5"
              >
                Work Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full h-11 px-3.5 rounded-[10px] bg-[#17201B] border border-[rgba(214,235,224,0.12)] text-[#E8EDE8] text-sm placeholder:text-[#62706A] focus:outline-none focus:border-[#6FD8A6]/60 transition-colors"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="password"
                  className="font-mono text-[11px] uppercase tracking-wider text-[#9AA8A0]"
                >
                  Password
                </label>
                <Link
                  href="/auth/forgot-password"
                  className="text-xs text-[#9AA8A0] hover:text-[#E8EDE8] transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full h-11 px-3.5 rounded-[10px] bg-[#17201B] border border-[rgba(214,235,224,0.12)] text-[#E8EDE8] text-sm placeholder:text-[#62706A] focus:outline-none focus:border-[#6FD8A6]/60 transition-colors font-mono"
              />
            </div>

            {/* Invisible Honeypot Field */}
            <div className="opacity-0 absolute -z-10 pointer-events-none h-0 w-0 overflow-hidden" aria-hidden="true">
              <label htmlFor="company_fax_number">Company Fax</label>
              <input
                id="company_fax_number"
                name="company_fax_number"
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
              />
            </div>

            {/* Cloudflare Turnstile Container */}
            <div ref={turnstile.containerRef} className="my-2 min-h-[40px] flex justify-center" />

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 h-11 rounded-[10px] bg-[#F4EFE9] text-[#111311] hover:bg-white font-medium text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Verifying credentials...</span>
              ) : (
                <>
                  <span>Sign in</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Fill Buttons for Testing */}
          <div className="mt-6 pt-5 border-t border-[rgba(214,235,224,0.08)]">
            <p className="font-mono text-[10px] uppercase tracking-wider text-[#62706A] mb-2.5 text-center">
              Fast test credentials
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handlePrefill("admin")}
                className="h-8 rounded-[8px] bg-[#17201B] border border-[rgba(214,235,224,0.08)] hover:border-[rgba(214,235,224,0.18)] text-[11px] font-mono text-[#9AA8A0] hover:text-[#E8EDE8] transition-colors"
              >
                Org A Admin
              </button>
              <button
                type="button"
                onClick={() => handlePrefill("owner")}
                className="h-8 rounded-[8px] bg-[#17201B] border border-[rgba(214,235,224,0.08)] hover:border-[rgba(214,235,224,0.18)] text-[11px] font-mono text-[#9AA8A0] hover:text-[#E8EDE8] transition-colors"
              >
                Owner (2FA)
              </button>
            </div>
          </div>
        </div>

        {/* Security and Invitation notice */}
        <div className="mt-6 text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 text-xs text-[#9AA8A0]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#6FD8A6]" />
            <span>Row-level tenant isolation enforced</span>
          </div>
          <p className="text-xs text-[#62706A]">
            Have an invite link? Check your corporate email inbox.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0B0F0D]" />}>
      <SignInContent />
    </Suspense>
  );
}
