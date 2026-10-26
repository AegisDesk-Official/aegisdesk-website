import type { Metadata } from "next";
import { LegalPage, TocItem } from "@/components/ui/legal-page";
import { CheckCircle2, AlertCircle, ArrowRight, ShieldCheck, DollarSign } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Commercial Pricing & Terms | AegisDesk",
  description: "Transparent B2B commercial terms: starting at $2,500 total setup fee (50% deposit + 50% balance) and $1,000/month recurring retainer. Zero hidden fees.",
};

const TOC: TocItem[] = [
  { id: "commercial-overview", label: "Commercial Fee Structure" },
  { id: "milestone-schedule", label: "Milestone Billing & 14-Day Shadow Validation" },
  { id: "deliverables-included", label: "Complete Scope of Deliverables" },
  { id: "currency-and-taxes", label: "Currencies, Tax Lines & Razorpay Processing" },
  { id: "contract-and-renewal", label: "Contractual Terms & Cancellation" },
];

export default function PricingPage() {
  return (
    <LegalPage
      title="Pricing Details &amp; Commercial Terms"
      updated="26 October 2026"
      toc={TOC}
      summaryTitle="COMMERCIAL TRANSPARENCY &amp; SPECIFICATION"
      summaryText={
        <div className="space-y-2 text-[13px] leading-relaxed text-[var(--paper-ink)]">
          <p>
            <strong>Fixed Transparent Pricing:</strong> AegisDesk operates on predictable B2B commercial terms.
            A one-time implementation setup fee starting at $2,500 (split into two 50% milestones) plus a $1,000/month recurring maintenance retainer.
          </p>
          <p className="text-[12px] opacity-80">
            Every deployment begins with our signature 14-day Shadow Validation calibration before autonomous live answering is enabled.
          </p>
        </div>
      }
    >
      {/* 1. Fee Structure */}
      <section id="commercial-overview" className="scroll-mt-32 space-y-4">
        <h2 className="flex items-baseline gap-2.5 font-sans text-xl font-normal tracking-tight text-[var(--text)] sm:text-2xl">
          <span className="font-mono text-xs uppercase tracking-[0.08em] text-[var(--verified)] tabular-nums">
            §01 //
          </span>
          <span>Commercial Fee Structure</span>
        </h2>
        <p className="text-[15px] leading-relaxed text-[var(--text-dim)]">
          AegisDesk charges a predictable fixed implementation fee and an ongoing managed infrastructure retainer:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[13px] font-mono">
          <div className="p-5 rounded-[10px] bg-[var(--surface)] border border-[var(--line)] space-y-3 flex flex-col justify-between">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-[var(--text-faint)]">Milestone 01 &amp; 02</span>
              <h3 className="text-[24px] font-sans font-normal text-[var(--text)] mt-1">
                Starting at $2,500 <span className="text-[13px] font-mono text-[var(--text-dim)]">setup</span>
              </h3>
              <p className="text-[12px] text-[var(--text-dim)] font-sans mt-2">
                One-time integration fee covering proprietary document engineering, vector store chunking, helpdesk webhook connection, and 14-day calibration.
              </p>
            </div>
            <div className="pt-3 border-t border-[var(--line)] space-y-1.5 text-[11px] text-[var(--text-faint)]">
              <div className="flex justify-between">
                <span>Kickoff Deposit (50%):</span>
                <strong className="text-[var(--text)] font-normal">$1,250 (before onboarding)</strong>
              </div>
              <div className="flex justify-between">
                <span>Shadow Validation Balance (50%):</span>
                <strong className="text-[var(--text)] font-normal">$1,250 (post-calibration)</strong>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-[10px] bg-[var(--surface)] border border-[var(--line)] space-y-3 flex flex-col justify-between">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-[var(--text-faint)]">Ongoing Managed Tier</span>
              <h3 className="text-[24px] font-sans font-normal text-[var(--glow)] mt-1">
                Starting at $1,000 <span className="text-[13px] font-mono text-[var(--text-dim)]">/ month</span>
              </h3>
              <p className="text-[12px] text-[var(--text-dim)] font-sans mt-2">
                Recurring infrastructure and maintenance retainer covering vector store hosting, continuous retrieval calibration, weekly policy drift audits, and dedicated support.
              </p>
            </div>
            <div className="pt-3 border-t border-[var(--line)] space-y-1.5 text-[11px] text-[var(--text-faint)]">
              <div className="flex justify-between">
                <span>Billing Frequency:</span>
                <strong className="text-[var(--text)] font-normal">Monthly in advance [CONFIRM]</strong>
              </div>
              <div className="flex justify-between">
                <span>Cancellation Notice:</span>
                <strong className="text-[var(--text)] font-normal">30 days written notice [CONFIRM]</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Milestone Schedule */}
      <section id="milestone-schedule" className="scroll-mt-32 space-y-4">
        <h2 className="flex items-baseline gap-2.5 font-sans text-xl font-normal tracking-tight text-[var(--text)] sm:text-2xl">
          <span className="font-mono text-xs uppercase tracking-[0.08em] text-[var(--verified)] tabular-nums">
            §02 //
          </span>
          <span>Milestone Schedule &amp; 14-Day Shadow Validation</span>
        </h2>
        <p className="text-[15px] leading-relaxed text-[var(--text-dim)]">
          Payment is strictly aligned with technical delivery phases. Client organizations never pay the final setup balance until the AI has proven its accuracy during the 14-day Shadow Validation [CONFIRM]:
        </p>

        <div className="space-y-3 font-mono text-[12px]">
          <div className="p-4 rounded-[8px] bg-[var(--surface)] border border-[var(--line)] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[var(--verified)] font-medium">Phase 1: 50% Kickoff Deposit ($1,250 base)</span>
              <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-[var(--surface-2)] text-[var(--text-faint)]">Due at kickoff</span>
            </div>
            <p className="font-sans text-[13px] text-[var(--text-dim)]">
              Due upon contract signing prior to document ingestion. Unlocks the private tenant workspace, PDF policy ingestion, embedding benchmark analysis, and team invite access.
            </p>
          </div>

          <div className="p-4 rounded-[8px] bg-[var(--surface)] border border-[var(--line)] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[var(--warn)] font-medium">Phase 2: 14-Day Shadow Validation Calibration</span>
              <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-[rgba(227,179,65,0.12)] text-[var(--warn)]">Zero customer risk</span>
            </div>
            <p className="font-sans text-[13px] text-[var(--text-dim)]">
              For 14 days, the AI runs quietly in the background, drafting answers alongside your human support agents. Agents inspect citation accuracy and approve drafts. Autonomous sending to customers is strictly disabled.
            </p>
          </div>

          <div className="p-4 rounded-[8px] bg-[var(--surface)] border border-[var(--line)] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[var(--text)] font-medium">Phase 3: 50% Final Balance ($1,250 base) &amp; Live Go-Live</span>
              <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-[rgba(56,189,248,0.12)] text-[var(--glow)]">Unlocks live routing</span>
            </div>
            <p className="font-sans text-[13px] text-[var(--text-dim)]">
              Due only after the 14-day calibration report is approved and the retrieval benchmark exceeds 92.0% accuracy. Unlocks autonomous direct resolution to customers for verified tickets.
            </p>
          </div>
        </div>
      </section>

      {/* 3. Scope of Deliverables */}
      <section id="deliverables-included" className="scroll-mt-32 space-y-4">
        <h2 className="flex items-baseline gap-2.5 font-sans text-xl font-normal tracking-tight text-[var(--text)] sm:text-2xl">
          <span className="font-mono text-xs uppercase tracking-[0.08em] text-[var(--verified)] tabular-nums">
            §03 //
          </span>
          <span>Complete Scope of Deliverables</span>
        </h2>
        <p className="text-[15px] leading-relaxed text-[var(--text-dim)]">
          The following features and engineering services are included under the standard commercial agreement:
        </p>

        <ul className="space-y-2.5 text-[14px] font-sans text-[var(--text-dim)]">
          <li className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-[var(--verified)] shrink-0 mt-0.5" />
            <span><strong>Proprietary Document Ingestion:</strong> Chunking, cleaning, and vector embedding of your company manuals, SOPs, return policies, and historical ticket resolution logs.</span>
          </li>
          <li className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-[var(--verified)] shrink-0 mt-0.5" />
            <span><strong>Helpdesk Integration:</strong> Direct webhook and API integration with Zendesk, Freshdesk, Gorgias, Intercom, or custom CRM systems.</span>
          </li>
          <li className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-[var(--verified)] shrink-0 mt-0.5" />
            <span><strong>Corrective-RAG Safeguards:</strong> Cryptographic citation verification requiring every factual claim to link to an exact page in your approved documents.</span>
          </li>
          <li className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-[var(--verified)] shrink-0 mt-0.5" />
            <span><strong>Automatic Human Escalation:</strong> Unresolvable or out-of-policy edge cases route immediately to human agents with zero AI hallucinations.</span>
          </li>
          <li className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-[var(--verified)] shrink-0 mt-0.5" />
            <span><strong>Tenant Isolation:</strong> Dedicated cryptographic namespaces preventing any cross-tenant data leakage. Customer data is never used to train public foundation models.</span>
          </li>
          <li className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-[var(--verified)] shrink-0 mt-0.5" />
            <span><strong>Continuous Calibration:</strong> Ongoing model fine-tuning, weekly policy gap reports, and latency telemetry monitoring.</span>
          </li>
        </ul>
      </section>

      {/* 4. Currencies & Taxes */}
      <section id="currency-and-taxes" className="scroll-mt-32 space-y-4">
        <h2 className="flex items-baseline gap-2.5 font-sans text-xl font-normal tracking-tight text-[var(--text)] sm:text-2xl">
          <span className="font-mono text-xs uppercase tracking-[0.08em] text-[var(--verified)] tabular-nums">
            §04 //
          </span>
          <span>Currencies, Tax Lines &amp; Razorpay Processing</span>
        </h2>
        <p className="text-[15px] leading-relaxed text-[var(--text-dim)]">
          Payment collection and invoice settlement are governed by the statutory location of the client organization:
        </p>

        <div className="p-4 rounded-[10px] bg-[var(--surface)] border border-[var(--line)] font-mono text-[12px] space-y-3">
          <div>
            <span className="text-[var(--text)] font-semibold uppercase text-[11px] block mb-1">
              • International Clients (United States, Europe, UK, Worldwide)
            </span>
            <p className="font-sans text-[13px] text-[var(--text-dim)]">
              Invoiced and charged strictly in <strong>US Dollars (USD)</strong>. International corporate credit cards (Visa, MasterCard, American Express) are processed securely via Razorpay International Payment Gateway without foreign currency conversion fees from our end [CONFIRM]. Export of services is covered under statutory Letter of Undertaking procedures with 0.0% statutory IGST [CONFIRM].
            </p>
          </div>

          <div className="pt-2 border-t border-[var(--line)]">
            <span className="text-[var(--text)] font-semibold uppercase text-[11px] block mb-1">
              • Domestic Indian Clients
            </span>
            <p className="font-sans text-[13px] text-[var(--text-dim)]">
              Invoiced in <strong>Indian Rupees (INR)</strong> calculated from commercial contract tiers [CONFIRM]. Applicable Goods and Services Tax (18% GST under SAC 998313) is levied on domestic invoices [CONFIRM]. Corporate cards, Netbanking, NEFT/RTGS, and UPI are supported. B2B GST tax credit invoices are issued automatically with your company GSTIN [CONFIRM].
            </p>
          </div>

          <div className="pt-2 border-t border-[var(--line)] text-[11px] text-[var(--text-faint)]">
            Note: Payment details are handled by Razorpay and not stored by us. Payment card details and netbanking credentials are processed exclusively by Razorpay (PCI-DSS Level 1 compliant gateway) and are never stored on AegisDesk servers [CONFIRM].
          </div>
        </div>
      </section>

      {/* 5. Contract & Renewal */}
      <section id="contract-and-renewal" className="scroll-mt-32 space-y-4">
        <h2 className="flex items-baseline gap-2.5 font-sans text-xl font-normal tracking-tight text-[var(--text)] sm:text-2xl">
          <span className="font-mono text-xs uppercase tracking-[0.08em] text-[var(--verified)] tabular-nums">
            §05 //
          </span>
          <span>Contractual Terms &amp; Cancellation</span>
        </h2>
        <p className="text-[15px] leading-relaxed text-[var(--text-dim)]">
          Full details regarding contractual commitments, non-refundable deposit terms, and termination procedures are detailed in our dedicated policy documents:
        </p>

        <div className="flex flex-wrap gap-3 font-mono text-[12px] pt-1">
          <Link
            href="/cancellation-refunds"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[6px] bg-[var(--surface)] border border-[var(--line)] hover:border-[var(--line-strong)] text-[var(--text)] hover:text-white transition-colors"
          >
            <span>Cancellation &amp; Refund Policy</span>
            <ArrowRight className="w-3.5 h-3.5 text-[var(--glow)]" />
          </Link>
          <Link
            href="/shipping-delivery"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[6px] bg-[var(--surface)] border border-[var(--line)] hover:border-[var(--line-strong)] text-[var(--text)] hover:text-white transition-colors"
          >
            <span>Digital Delivery Timelines</span>
            <ArrowRight className="w-3.5 h-3.5 text-[var(--glow)]" />
          </Link>
          <Link
            href="/terms"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[6px] bg-[var(--surface)] border border-[var(--line)] hover:border-[var(--line-strong)] text-[var(--text)] hover:text-white transition-colors"
          >
            <span>Terms of Service</span>
            <ArrowRight className="w-3.5 h-3.5 text-[var(--glow)]" />
          </Link>
        </div>
      </section>
    </LegalPage>
  );
}
