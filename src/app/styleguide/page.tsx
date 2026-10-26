import React from "react";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { SectionShell } from "@/components/ui/section-shell";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { PaperCard } from "@/components/ui/paper-card";
import { Label } from "@/components/ui/label";
import { StatusChip } from "@/components/ui/status-chip";
import { LogoLockup, LogoMark } from "@/components/brand/logo";

export const metadata = {
  title: "Design Foundation Styleguide | AegisDesk",
  description: "Living design system primitives derived from DESIGN.md.",
};

export default function StyleguidePage() {
  return (
    <div className="min-h-screen overflow-x-clip bg-[var(--canvas)] text-[var(--text)]">
      {/* Top bar */}
      <header className="border-b border-[var(--line)] bg-[var(--surface)] py-3 sm:py-4">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-3 px-4 sm:px-6 md:px-12">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <LogoLockup className="h-5 sm:h-6 w-[80px] sm:w-[96px] text-[var(--paper)]" />
          </Link>
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <StatusChip variant="verified" className="hidden sm:inline-flex">Foundation V1</StatusChip>
            <Link
              href="/"
              className="inline-flex items-center gap-1 rounded-[6px] border border-[var(--line)] bg-[var(--surface-2)] px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider text-[var(--text)] hover:border-[var(--line-strong)] transition-colors"
            >
              <span>Back</span>
              <span className="hidden sm:inline">to site</span>
              <span>&rarr;</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Section */}
      <SectionShell>
        <Container>
          {/* Section: Typography */}
          <div className="mb-20 space-y-4">
            <Label faint>Design Foundation &bull; Source of Truth</Label>
            <h1 className="type-display text-[var(--text)]">
              Quiet control room.
            </h1>
            <p className="type-body text-[var(--text-dim)]">
              Display text uses Geist 300 at -0.03em tracking. Body copy is 17px with 1.6 line height in --text-dim, strictly capped at 62ch width for calm, exact, evidence-led scanning by operational leaders.
            </p>
          </div>

          <div className="grid gap-16 md:grid-cols-2">
            {/* Primitives: Buttons */}
            <div className="space-y-6">
              <div className="border-b border-[var(--line)] pb-2">
                <Label dim>1. Buttons (10px Radius &bull; No Pills)</Label>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <Button variant="primary">Book 15-min call</Button>
                <Button variant="secondary">View safeguards</Button>
                <Button variant="link">Scoping documentation &rarr;</Button>
              </div>

              {/* Button on Brand Field */}
              <div className="rounded-[16px] bg-[var(--brand)] p-6 text-[var(--paper)]">
                <Label className="mb-2 block text-[var(--paper)]/60">
                  On a --brand Field
                </Label>
                <p className="mb-4 text-sm text-[var(--paper)]/80">
                  Primary button remains paper on brand surfaces. No bright green buttons.
                </p>
                <div className="flex flex-wrap items-center gap-4">
                  <Button variant="primary">Schedule onboarding</Button>
                  <Button variant="link" className="text-[var(--paper)]">
                    Terms of service &rarr;
                  </Button>
                </div>
              </div>
            </div>

            {/* Primitives: Status Chips & Labels */}
            <div className="space-y-6">
              <div className="border-b border-[var(--line)] pb-2">
                <Label dim>2. Status Chips (6px Radius)</Label>
              </div>
              <div className="flex flex-wrap items-center gap-2.5">
                <StatusChip variant="verified">99.4% Grounded</StatusChip>
                <StatusChip variant="warn">Threshold &lt; 92%</StatusChip>
                <StatusChip variant="blocked">Escalated</StatusChip>
                <StatusChip variant="neutral">Latency 284ms</StatusChip>
              </div>

              <div className="border-b border-[var(--line)] pb-2 pt-4">
                <Label dim>3. Mono Labels (Geist Mono 12px)</Label>
              </div>
              <div className="space-y-2">
                <div>
                  <Label>Telemetry ID: #ZD-8492 &bull; Active Route</Label>
                </div>
                <div>
                  <Label dim>Confidence Score: 0.987 &bull; Calibrated</Label>
                </div>
                <div>
                  <Label faint>Audit Timestamp: 2026-10-25T00:00:00Z</Label>
                </div>
              </div>
            </div>
          </div>

          {/* Primitives: Panels & PaperCard */}
          <div className="mt-20 grid gap-8 md:grid-cols-2">
            {/* Panel */}
            <div className="space-y-4">
              <Label dim>4. Panel (16px Radius &bull; --surface)</Label>
              <Panel className="p-6">
                <div className="flex items-center justify-between pb-4">
                  <Label>Telemetry Panel</Label>
                  <StatusChip variant="verified">Live</StatusChip>
                </div>
                <p className="text-sm leading-relaxed text-[var(--text-dim)]">
                  Panels represent system components. Dark surface with 1px border in --line. No drop shadows. Border brightens by 150ms transition on hover.
                </p>
              </Panel>
            </div>

            {/* PaperCard */}
            <div className="space-y-4">
              <Label dim>5. PaperCard (16px Radius &bull; --paper)</Label>
              <PaperCard sampleLabel="Sample">
                <div className="mb-2">
                  <span className="font-mono text-xs uppercase tracking-wider text-[var(--paper-ink)]/70">
                    Source: Refund_SLA_Schedule.pdf (p. 4)
                  </span>
                </div>
                <h3 className="text-lg font-normal tracking-tight text-[var(--paper-ink)]">
                  RMA Return Policy &sect; 3.2
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--paper-ink)]/85">
                  &ldquo;Approved RMA settlements are credited to the customer&apos;s original payment instrument within 3 business days of warehouse scan.&rdquo;
                </p>
              </PaperCard>
            </div>
          </div>

          {/* Primitives: Brand Assets */}
          <div className="mt-20 space-y-6">
            <div className="border-b border-[var(--line)] pb-2">
              <Label dim>6. Brand Assets (public/brand &bull; CurrentColor)</Label>
            </div>
            <div className="grid gap-6 sm:grid-cols-3">
              <Panel className="flex flex-col items-center justify-center gap-4 p-8 text-center">
                <LogoMark className="h-10 w-10 text-[var(--paper)]" />
                <Label faint>Mark in Cream</Label>
              </Panel>

              <Panel className="flex flex-col items-center justify-center gap-4 p-8 text-center">
                <LogoLockup className="h-7 w-auto text-[var(--paper)]" />
                <Label faint>Lockup in Cream</Label>
              </Panel>

              <div className="flex flex-col items-center justify-center gap-4 rounded-[16px] bg-[var(--paper)] p-8 text-center">
                <LogoLockup className="h-7 w-auto text-[var(--brand)]" />
                <span className="font-mono text-xs uppercase tracking-wider text-[var(--brand)]">
                  Lockup in Deep Green
                </span>
              </div>
            </div>
          </div>
        </Container>
      </SectionShell>

      {/* Brand Section Demo */}
      <SectionShell variant="brand">
        <Container>
          <div className="max-w-[62ch] space-y-4">
            <Label className="text-[var(--paper)]/60">Full-Bleed Brand Field</Label>
            <h2 className="text-3xl font-light tracking-tight text-[var(--paper)] sm:text-4xl">
              Start with a 14-day human-supervised shadow mode.
            </h2>
            <p className="text-base leading-relaxed text-[var(--paper)]/80">
              The AI drafts responses alongside your human agents for calibration and approval before answering customers live.
            </p>
            <div className="pt-4">
              <Button variant="primary">Schedule a 15-minute walkthrough</Button>
            </div>
          </div>
        </Container>
      </SectionShell>
    </div>
  );
}
