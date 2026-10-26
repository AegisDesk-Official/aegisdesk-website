import type { Metadata } from "next";
import { LegalPage, TocItem } from "@/components/ui/legal-page";
import { siteConfig } from "@/lib/site-config";
import { ShieldCheck, Target, Users, Building, ArrowRight } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About Us | AegisDesk",
  description: "Learn about AegisDesk: our engineering mission, Corrective-RAG architecture, corporate registration details, and leadership team.",
};

const TOC: TocItem[] = [
  { id: "mission", label: "Mission & Architecture" },
  { id: "why-grounded", label: "Why We Built AegisDesk" },
  { id: "corporate-entity", label: "Registered Corporate Details" },
  { id: "leadership", label: "Leadership & Engineering Team" },
  { id: "contact-links", label: "Connect with Our Team" },
];

export default function AboutPage() {
  return (
    <LegalPage
      title="About AegisDesk"
      updated="26 October 2026"
      toc={TOC}
      summaryTitle="COMPANY OVERVIEW &amp; MISSION"
      summaryText={
        <div className="space-y-2 text-[13px] leading-relaxed text-[var(--paper-ink)]">
          <p>
            <strong>Evidence-Led Support AI:</strong> AegisDesk replaces probabilistic guessing in customer support with deterministic, document-backed answers.
            Every claim is verified against approved source manuals before it can reach a customer.
          </p>
          <p className="text-[12px] opacity-80">
            Founded by systems engineers and support operations veterans. Based in Bengaluru, India.
          </p>
        </div>
      }
    >
      {/* 1. Mission & Architecture */}
      <section id="mission" className="scroll-mt-32 space-y-4">
        <h2 className="flex items-baseline gap-2.5 font-sans text-xl font-normal tracking-tight text-[var(--text)] sm:text-2xl">
          <span className="font-mono text-xs uppercase tracking-[0.08em] text-[var(--verified)] tabular-nums">
            §01 //
          </span>
          <span>Mission &amp; Architecture</span>
        </h2>
        <p className="text-[15px] leading-relaxed text-[var(--text-dim)]">
          Support leaders distrust chatbots with good reason: generic language models guess, fabricate return rules, invent warranty coverage, and erode customer trust.
        </p>
        <p className="text-[15px] leading-relaxed text-[var(--text-dim)]">
          AegisDesk was built on a single premise: <strong>an AI support agent should only state what is written in your approved company documents, or escalate to a human.</strong> Using Corrective Retrieval-Augmented Generation (Corrective-RAG), our platform checks every answer against your company manuals, SOPs, and past resolution tickets, attaching page-level citations to every factual sentence.
        </p>
      </section>

      {/* 2. Why We Built AegisDesk */}
      <section id="why-grounded" className="scroll-mt-32 space-y-4">
        <h2 className="flex items-baseline gap-2.5 font-sans text-xl font-normal tracking-tight text-[var(--text)] sm:text-2xl">
          <span className="font-mono text-xs uppercase tracking-[0.08em] text-[var(--verified)] tabular-nums">
            §02 //
          </span>
          <span>Core Engineering Principles</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[13px] font-mono">
          <div className="p-4 rounded-[10px] bg-[var(--surface)] border border-[var(--line)] space-y-2">
            <span className="text-[var(--verified)] font-medium text-[11px] uppercase tracking-wider block">
              01 · Strict Verification
            </span>
            <p className="font-sans text-[13px] text-[var(--text-dim)]">
              Answers must clear a 92.0% deterministic confidence threshold and link to an exact page in your approved documents. If a question isn&apos;t covered, the AI does not guess—it routes to human agents.
            </p>
          </div>

          <div className="p-4 rounded-[10px] bg-[var(--surface)] border border-[var(--line)] space-y-2">
            <span className="text-[var(--warn)] font-medium text-[11px] uppercase tracking-wider block">
              02 · 14-Day Shadow Validation
            </span>
            <p className="font-sans text-[13px] text-[var(--text-dim)]">
              No client goes live blind. For 14 days, the AI runs quietly in your agent queue, drafting replies for human inspection before autonomous answering is ever enabled.
            </p>
          </div>

          <div className="p-4 rounded-[10px] bg-[var(--surface)] border border-[var(--line)] space-y-2">
            <span className="text-[var(--glow)] font-medium text-[11px] uppercase tracking-wider block">
              03 · Zero Public Training
            </span>
            <p className="font-sans text-[13px] text-[var(--text-dim)]">
              Client documentation and customer support tickets are isolated in private cryptographic namespaces and are never used to train public foundation models.
            </p>
          </div>

          <div className="p-4 rounded-[10px] bg-[var(--surface)] border border-[var(--line)] space-y-2">
            <span className="text-[var(--text)] font-medium text-[11px] uppercase tracking-wider block">
              04 · Calm Control Room Design
            </span>
            <p className="font-sans text-[13px] text-[var(--text-dim)]">
              We reject flashy, deceptive chatbot interfaces. Our telemetry dashboard provides calm, exact instrumentation, real-time latency stats, and citation verification audits.
            </p>
          </div>
        </div>
      </section>

      {/* 3. Corporate Entity */}
      <section id="corporate-entity" className="scroll-mt-32 space-y-4">
        <h2 className="flex items-baseline gap-2.5 font-sans text-xl font-normal tracking-tight text-[var(--text)] sm:text-2xl">
          <span className="font-mono text-xs uppercase tracking-[0.08em] text-[var(--verified)] tabular-nums">
            §03 //
          </span>
          <span>Registered Corporate Details</span>
        </h2>
        <p className="text-[15px] leading-relaxed text-[var(--text-dim)]">
          AegisDesk operates as an enterprise software platform:
        </p>

        <div className="p-4 rounded-[10px] bg-[var(--surface)] border border-[var(--line)] font-mono text-[12px] space-y-2">
          <div className="flex justify-between py-1">
            <span className="text-[var(--text-faint)]">Brand Name:</span>
            <span className="text-[var(--text)] font-semibold">{siteConfig.brandName}</span>
          </div>
          {siteConfig.legalName && (
            <div className="flex justify-between py-1 border-t border-[var(--line)]">
              <span className="text-[var(--text-faint)]">Legal Entity Name:</span>
              <span className="text-[var(--text)] font-semibold">{siteConfig.legalName}</span>
            </div>
          )}
          {siteConfig.registeredAddress && (
            <div className="flex justify-between py-1 border-t border-[var(--line)]">
              <span className="text-[var(--text-faint)]">Registered Corporate Office:</span>
              <span className="text-[var(--text)] text-right font-sans max-w-sm">
                {siteConfig.registeredAddress}
              </span>
            </div>
          )}
          {siteConfig.phone && (
            <div className="flex justify-between py-1 border-t border-[var(--line)]">
              <span className="text-[var(--text-faint)]">Corporate Telephone:</span>
              <span className="text-[var(--text)] font-semibold">{siteConfig.phone}</span>
            </div>
          )}
        </div>
      </section>

      {/* 4. Leadership */}
      <section id="leadership" className="scroll-mt-32 space-y-4">
        <h2 className="flex items-baseline gap-2.5 font-sans text-xl font-normal tracking-tight text-[var(--text)] sm:text-2xl">
          <span className="font-mono text-xs uppercase tracking-[0.08em] text-[var(--verified)] tabular-nums">
            §04 //
          </span>
          <span>Leadership &amp; Engineering Team</span>
        </h2>
        <p className="text-[15px] leading-relaxed text-[var(--text-dim)]">
          AegisDesk was founded by engineers and operations specialists with background in distributed systems, vector retrieval, and high-volume e-commerce customer support:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-[12px]">
          <div className="p-4 rounded-[8px] bg-[var(--surface)] border border-[var(--line)] space-y-1.5">
            <span className="text-[var(--text)] font-semibold text-[13px] block">Adit Gupta / Founder &amp; CEO</span>
            <span className="text-[var(--text-faint)] text-[11px] block">Systems Architecture &amp; RAG Engineering</span>
            <p className="font-sans text-[12px] text-[var(--text-dim)] pt-1 border-t border-[var(--line)]">
              Focused on Corrective RAG pipelines, cryptographic citation verification, and low-latency vector databases.
            </p>
          </div>

          <div className="p-4 rounded-[8px] bg-[var(--surface)] border border-[var(--line)] space-y-1.5">
            <span className="text-[var(--text)] font-semibold text-[13px] block">Technical Operations Lead</span>
            <span className="text-[var(--text-faint)] text-[11px] block">Support Automation &amp; Calibration</span>
            <p className="font-sans text-[12px] text-[var(--text-dim)] pt-1 border-t border-[var(--line)]">
              Oversees 14-day Shadow Validation calibration, helpdesk webhook integrations, and client escalation protocols.
            </p>
          </div>
        </div>
      </section>

      {/* 5. Connect */}
      <section id="contact-links" className="scroll-mt-32 space-y-4">
        <h2 className="flex items-baseline gap-2.5 font-sans text-xl font-normal tracking-tight text-[var(--text)] sm:text-2xl">
          <span className="font-mono text-xs uppercase tracking-[0.08em] text-[var(--verified)] tabular-nums">
            §05 //
          </span>
          <span>Connect with Our Team</span>
        </h2>
        <p className="text-[15px] leading-relaxed text-[var(--text-dim)]">
          Explore our pricing model, test our live verification workbench, or get in touch with our operations desk:
        </p>

        <div className="flex flex-wrap gap-3 font-mono text-[12px] pt-1">
          <Link
            href="/contact"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[6px] bg-[var(--surface)] border border-[var(--line)] hover:border-[var(--line-strong)] text-[var(--text)] hover:text-white transition-colors"
          >
            <span>Contact Directory</span>
            <ArrowRight className="w-3.5 h-3.5 text-[var(--glow)]" />
          </Link>
          <Link
            href="/pricing"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[6px] bg-[var(--surface)] border border-[var(--line)] hover:border-[var(--line-strong)] text-[var(--text)] hover:text-white transition-colors"
          >
            <span>Pricing &amp; Terms</span>
            <ArrowRight className="w-3.5 h-3.5 text-[var(--glow)]" />
          </Link>
          <Link
            href="/#demo"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[6px] bg-[var(--surface)] border border-[var(--line)] hover:border-[var(--line-strong)] text-[var(--text)] hover:text-white transition-colors"
          >
            <span>Test Live Workbench</span>
            <ArrowRight className="w-3.5 h-3.5 text-[var(--glow)]" />
          </Link>
        </div>
      </section>
    </LegalPage>
  );
}
