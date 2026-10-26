import type { Metadata } from "next";
import Link from "next/link";
import { LogoMark } from "@/components/brand/logo";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Scheduled Maintenance | AegisDesk",
  description: "AegisDesk systems are undergoing scheduled infrastructure maintenance and vector index calibration.",
};

export default function MaintenancePage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-16 bg-[var(--canvas)] text-[var(--text)]">
      <div className="hero-grid pointer-events-none absolute inset-0 -z-10" aria-hidden="true" />
      <div className="w-full max-w-lg text-center space-y-6">
        <LogoMark className="mx-auto h-12 w-12 text-[var(--paper)]" />

        <div className="space-y-2">
          <p className="font-mono text-xs uppercase tracking-widest text-[var(--warn)]">
            503 // SCHEDULED_MAINTENANCE_WINDOW
          </p>
          <h1 className="text-3xl sm:text-4xl font-light tracking-tight text-[var(--text)]">
            Platform Maintenance in Progress
          </h1>
          <p className="text-sm sm:text-base text-[var(--text-dim)] leading-relaxed max-w-md mx-auto">
            Our engineering desk is performing scheduled PostgreSQL maintenance and vector index re-indexing.
            All client document embeddings and ticket histories remain encrypted and protected.
          </p>
        </div>

        {/* Maintenance telemetry card */}
        <div className="rounded-[10px] border border-[var(--line)] bg-[var(--surface)] p-4 text-left font-mono text-xs space-y-2 max-w-md mx-auto">
          <div className="flex justify-between text-[var(--text-dim)]">
            <span>Window Status:</span>
            <span className="text-[var(--warn)]">Active Execution</span>
          </div>
          <div className="flex justify-between text-[var(--text-dim)]">
            <span>Target Completion:</span>
            <span className="text-[var(--text)]">03:30 UTC</span>
          </div>
          <div className="flex justify-between text-[var(--text-dim)]">
            <span>Customer Ticket Queues:</span>
            <span className="text-[var(--verified)]">Buffered (Zero Loss)</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/status"
            className={buttonVariants({ variant: "default", size: "lg", className: "w-full sm:w-auto" })}
          >
            View Live System Status
          </Link>
          <Link
            href="/"
            className={buttonVariants({ variant: "outline", size: "lg", className: "w-full sm:w-auto" })}
          >
            Back to Home
          </Link>
        </div>

        <p className="text-xs font-mono text-[var(--text-faint)]">
          Need immediate operational assistance? Contact{" "}
          <a href="mailto:ops@aegisdesk.ai" className="underline text-[var(--text-dim)] hover:text-[var(--text)]">
            ops@aegisdesk.ai
          </a>
        </p>
      </div>
    </main>
  );
}
