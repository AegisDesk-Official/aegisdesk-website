"use client";

import { useState } from "react";
import Link from "next/link";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DEMO_LIMITS } from "@/lib/validation/demo-types";

export interface DemoGateValues {
  email: string;
  phone: string;
  company: string;
  /** Hidden field. Real visitors never fill it in. */
  honeypot: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: DemoGateValues) => void;
}

type Errors = Partial<Record<"email" | "phone" | "consent", string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Shown on the first Send. Collects lead details; real protection is on the server. */
export function DemoGateModal({ isOpen, onClose, onSubmit }: Props) {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Errors>({});

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const next: Errors = {};
    if (!EMAIL_RE.test(email.trim())) next.email = "Enter a valid work email.";
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 8 || digits.length > 15) next.phone = "Enter a phone number with 8 to 15 digits.";
    if (!consent) next.consent = "Please accept the privacy notice to continue.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    onSubmit({ email: email.trim(), phone: phone.trim(), company: company.trim(), honeypot });
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Try the sample workbench"
      description="Enter your work email and phone number to test questions against the sample documents."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {/* Session limits, read straight from the shared demo limits */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 rounded-[10px] border border-[var(--line)] bg-[var(--surface)] px-3 py-2 font-mono text-[12px] uppercase tracking-[0.08em] text-[var(--text-dim)] tabular-nums">
          <span>
            QUOTA: <span className="text-[var(--verified)]">{DEMO_LIMITS.perEmail}</span> QUESTIONS
          </span>
          <span>
            MESSAGE_CAP: <span className="text-[var(--verified)]">{DEMO_LIMITS.maxMessageChars}</span> CHARS
          </span>
        </div>

        <Input
          id="demo-email"
          name="email"
          type="email"
          label="Work email"
          autoComplete="email"
          placeholder="you@company.com"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
        />
        <Input
          id="demo-phone"
          name="phone"
          type="tel"
          inputMode="tel"
          label="Phone number"
          autoComplete="tel"
          placeholder="+1 555 123 4567"
          required
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          error={errors.phone}
        />
        <Input
          id="demo-company"
          name="company"
          type="text"
          label="Company (optional)"
          autoComplete="organization"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
        />

        {/* Honeypot: hidden from people, tempting to bots. */}
        <div style={{ position: "absolute", left: "-9999px", width: 1, height: 1, overflow: "hidden" }} aria-hidden="true">
          <label htmlFor="demo-website">Website</label>
          <input
            id="demo-website"
            name="website"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
          />
        </div>

        <div>
          <label className="flex items-start gap-3 rounded-lg border border-white/10 bg-slate-950/60 p-3 text-sm text-slate-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-white/20 bg-slate-950 accent-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 focus-visible:outline-none"
              aria-describedby={errors.consent ? "demo-consent-error" : undefined}
            />
            <span>
              I agree that AegisDesk may contact me about the product. I have read the{" "}
              <Link
                href="/privacy"
                target="_blank"
                className="text-blue-400 underline underline-offset-2 hover:text-blue-300"
              >
                privacy notice
              </Link>
              .
            </span>
          </label>
          {errors.consent && (
            <p id="demo-consent-error" className="mt-1.5 font-mono text-xs text-red-400">
              {errors.consent}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="rounded-[10px] font-mono text-[12px] uppercase tracking-[0.08em] text-[var(--text-dim)] hover:bg-white/5 hover:text-white"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="rounded-[10px] bg-[var(--paper)] font-mono text-[12px] font-medium uppercase tracking-[0.08em] text-[var(--paper-ink)] transition-colors hover:bg-white"
          >
            Open test chat
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default DemoGateModal;
