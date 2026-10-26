import type { Metadata } from "next";
import { LegalPage, TocItem } from "@/components/ui/legal-page";
import { siteConfig } from "@/lib/site-config";
import { CheckCircle2, AlertTriangle, ArrowRight, Clock, RefreshCcw } from "lucide-react";

export const metadata: Metadata = {
  title: "Cancellation & Refund Policy | AegisDesk",
  description: "Official cancellation and refund policy covering setup milestone deposits, 14-day Shadow Validation calibration exit terms, and Razorpay refund timelines.",
};

const TOC: TocItem[] = [
  { id: "overview", label: "Policy Scope & Principles" },
  { id: "setup-deposit", label: "50% Kickoff Deposit ($1,250 base)" },
  { id: "shadow-mode-exit", label: "14-Day Shadow Validation Calibration Exit" },
  { id: "retainer-cancellation", label: "Monthly Retainer Cancellation" },
  { id: "refund-processing", label: "Refund Timeline & Razorpay Payouts" },
  { id: "how-to-request", label: "How to Submit a Request" },
];

export default function CancellationRefundsPage() {
  return (
    <LegalPage
      title="Cancellation &amp; Refund Policy"
      updated="26 October 2026"
      toc={TOC}
      summaryTitle="CANCELLATION &amp; REFUND TERMS SUMMARY"
      summaryText={
        <div className="space-y-2 text-[13px] leading-relaxed text-[var(--paper-ink)]">
          <p>
            <strong>Risk-Reversed Milestone Model:</strong> AegisDesk aligns payments strictly with delivered value.
            If our 14-day Shadow Validation does not meet the agreed accuracy benchmark (&ge; 92.0%), you are never billed the final 50% setup balance ($1,250 base) [CONFIRM].
          </p>
          <p className="text-[12px] opacity-80">
            Approved refunds are credited to the original payment instrument via Razorpay within 5–7 business days [CONFIRM].
          </p>
        </div>
      }
    >
      {/* 1. Policy Scope */}
      <section id="overview" className="scroll-mt-32 space-y-4">
        <h2 className="flex items-baseline gap-2.5 font-sans text-xl font-normal tracking-tight text-[var(--text)] sm:text-2xl">
          <span className="font-mono text-xs uppercase tracking-[0.08em] text-[var(--verified)] tabular-nums">
            §01 //
          </span>
          <span>Policy Scope &amp; Principles</span>
        </h2>
        <p className="text-[15px] leading-relaxed text-[var(--text-dim)]">
          This Cancellation &amp; Refund Policy governs all commercial transactions, milestone invoices, and recurring retainers executed with{" "}
          <strong>{siteConfig.legalName || siteConfig.brandName}</strong> (&ldquo;AegisDesk&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;) [CONFIRM].
        </p>
        <p className="text-[15px] leading-relaxed text-[var(--text-dim)]">
          As an enterprise B2B provider, we understand that customer support automation requires rigorous calibration before going live. Our commercial framework is explicitly designed to minimize financial risk through a staged two-part setup fee and our signature 14-day Shadow Validation [CONFIRM].
        </p>
      </section>

      {/* 2. Setup Deposit */}
      <section id="setup-deposit" className="scroll-mt-32 space-y-4">
        <h2 className="flex items-baseline gap-2.5 font-sans text-xl font-normal tracking-tight text-[var(--text)] sm:text-2xl">
          <span className="font-mono text-xs uppercase tracking-[0.08em] text-[var(--verified)] tabular-nums">
            §02 //
          </span>
          <span>50% Kickoff Deposit ($1,250 base)</span>
        </h2>
        <p className="text-[15px] leading-relaxed text-[var(--text-dim)]">
          The initial 50% Kickoff Deposit ($1,250 base for international clients or commercial INR equivalent) funds the initial engineering resources, document cleaning, vector store chunking, and helpdesk integration setup [CONFIRM]:
        </p>
        <ul className="list-disc pl-5 space-y-2 text-[14px] text-[var(--text-dim)] font-sans">
          <li>
            <strong>Cancellation Prior to Work Ingestion:</strong> If Client requests cancellation in writing within forty-eight (48) hours of contract signing and before proprietary documents are ingested, a full 100% refund of the deposit will be issued [CONFIRM].
          </li>
          <li>
            <strong>Once Document Ingestion Begins:</strong> Once document engineering, vector embedding, and helpdesk API integration have commenced, the initial 50% deposit is non-refundable, as dedicated cloud infrastructure and engineering hours have been permanently deployed [CONFIRM].
          </li>
        </ul>
      </section>

      {/* 3. Shadow Validation Exit */}
      <section id="shadow-mode-exit" className="scroll-mt-32 space-y-4">
        <h2 className="flex items-baseline gap-2.5 font-sans text-xl font-normal tracking-tight text-[var(--text)] sm:text-2xl">
          <span className="font-mono text-xs uppercase tracking-[0.08em] text-[var(--verified)] tabular-nums">
            §03 //
          </span>
          <span>14-Day Shadow Validation Calibration Exit</span>
        </h2>
        <div className="p-4 rounded-[10px] bg-[rgba(111,216,166,0.06)] border border-[rgba(111,216,166,0.25)] space-y-2 font-mono text-[12px]">
          <div className="flex items-center gap-2 text-[var(--verified)] font-medium">
            <CheckCircle2 className="w-4 h-4" />
            <span>Zero-Risk Calibration Guarantee</span>
          </div>
          <p className="font-sans text-[13.5px] text-[var(--text-dim)] leading-relaxed">
            During the 14-day Shadow Validation, AI drafts are reviewed exclusively by your human support agents. If the system fails to achieve the agreed benchmark retrieval accuracy threshold (&ge; 92.0% grounded citation rate) or if Client reasonably determines that the software does not meet policy requirements [CONFIRM]:
          </p>
          <ul className="list-disc pl-5 space-y-1 font-sans text-[13px] text-[var(--text-dim)]">
            <li>The final 50% Shadow Validation Balance ($1,250 base) is completely waived and will never be billed [CONFIRM].</li>
            <li>No monthly retainer commitment will take effect [CONFIRM].</li>
            <li>All uploaded documents, embeddings, and workspace indexes are purged within thirty (30) days [CONFIRM].</li>
          </ul>
        </div>
      </section>

      {/* 4. Retainer Cancellation */}
      <section id="retainer-cancellation" className="scroll-mt-32 space-y-4">
        <h2 className="flex items-baseline gap-2.5 font-sans text-xl font-normal tracking-tight text-[var(--text)] sm:text-2xl">
          <span className="font-mono text-xs uppercase tracking-[0.08em] text-[var(--verified)] tabular-nums">
            §04 //
          </span>
          <span>Monthly Retainer Cancellation</span>
        </h2>
        <p className="text-[15px] leading-relaxed text-[var(--text-dim)]">
          The monthly managed infrastructure and maintenance retainer (starting at $1,000/month or INR equivalent + applicable statutory GST) operates on a recurring month-to-month basis [CONFIRM]:
        </p>
        <ul className="list-disc pl-5 space-y-2 text-[14px] text-[var(--text-dim)] font-sans">
          <li>
            <strong>Cancellation Notice:</strong> Client may cancel the recurring retainer at any time by providing at least thirty (30) calendar days written notice to <code>billing@aegisdesk.ai</code> prior to the next billing cycle [CONFIRM].
          </li>
          <li>
            <strong>Continued Access:</strong> Upon receipt of a cancellation notice, service remains fully active through the end of the paid billing month [CONFIRM].
          </li>
          <li>
            <strong>No Partial Month Refunds:</strong> Payments for active or past retainer cycles are non-refundable, and no pro-rata refunds are provided for unused portions of an active billing cycle unless mandated by applicable statutory law [CONFIRM].
          </li>
        </ul>
      </section>

      {/* 5. Refund Processing */}
      <section id="refund-processing" className="scroll-mt-32 space-y-4">
        <h2 className="flex items-baseline gap-2.5 font-sans text-xl font-normal tracking-tight text-[var(--text)] sm:text-2xl">
          <span className="font-mono text-xs uppercase tracking-[0.08em] text-[var(--verified)] tabular-nums">
            §05 //
          </span>
          <span>Refund Timeline &amp; Razorpay Payouts</span>
        </h2>
        <p className="text-[15px] leading-relaxed text-[var(--text-dim)]">
          Where a refund is approved by AegisDesk management or required by contractual agreement [CONFIRM]:
        </p>
        <div className="p-4 rounded-[10px] bg-[var(--surface)] border border-[var(--line)] font-mono text-[12px] space-y-2">
          <div className="flex items-center gap-2 text-[var(--text)] font-semibold">
            <RefreshCcw className="w-4 h-4 text-[var(--glow)]" />
            <span>Processing Timelines via Razorpay Gateway</span>
          </div>
          <p className="font-sans text-[13px] text-[var(--text-dim)]">
            Refunds are executed directly through the Razorpay Payment Gateway back to the original payment source (credit card, bank account, or corporate UPI) used for the initial transaction [CONFIRM]. Payment details are handled by Razorpay and not stored by us.
          </p>
          <div className="pt-2 border-t border-[var(--line)] space-y-1 text-[11px] text-[var(--text-faint)]">
            <p>• <strong>Approval Window:</strong> Refund requests are audited and authorized within 2 business days [CONFIRM].</p>
            <p>• <strong>Banking Credit Window:</strong> Once initiated, Razorpay credits funds to the Client&apos;s bank/card issuer within <strong>5 to 7 business days</strong> depending on the acquiring bank&apos;s settlement schedule [CONFIRM].</p>
            <p>• <strong>Refund Confirmation:</strong> An official credit receipt and transaction reference number are dispatched immediately to the Client&apos;s billing email.</p>
          </div>
        </div>
      </section>

      {/* 6. How to Request */}
      <section id="how-to-request" className="scroll-mt-32 space-y-4">
        <h2 className="flex items-baseline gap-2.5 font-sans text-xl font-normal tracking-tight text-[var(--text)] sm:text-2xl">
          <span className="font-mono text-xs uppercase tracking-[0.08em] text-[var(--verified)] tabular-nums">
            §06 //
          </span>
          <span>How to Submit a Cancellation or Refund Request</span>
        </h2>
        <p className="text-[15px] leading-relaxed text-[var(--text-dim)]">
          To initiate a cancellation or request a refund audit, send an email from your authorized corporate account to:
        </p>
        <div className="p-4 rounded-[8px] bg-[var(--surface)] border border-[var(--line)] font-mono text-[13px] space-y-1">
          <p className="text-[var(--text-dim)]">Email: <a href="mailto:billing@aegisdesk.ai" className="text-[var(--text)] underline hover:text-white">billing@aegisdesk.ai</a></p>
          <p className="text-[var(--text-dim)]">Subject Line: <code>Cancellation / Refund Request - [Your Company Name] - [Invoice #]</code></p>
          <p className="text-[var(--text-dim)]">Required Details: Invoice number, primary administrator contact, and brief summary of the request.</p>
        </div>
      </section>
    </LegalPage>
  );
}
