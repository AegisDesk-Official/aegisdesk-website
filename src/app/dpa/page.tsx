import type { Metadata } from "next";
import { LegalPage, TocItem } from "@/components/ui/legal-page";

export const metadata: Metadata = {
  title: "Data Processing Agreement (DPA) | AegisDesk",
  description: "B2B Data Processing Agreement for GDPR Art. 28 and India DPDP Act 2023 governing private RAG customer support processing.",
};

const TOC: TocItem[] = [
  { id: "scope-roles", label: "Scope & Processing Roles" },
  { id: "processor-obligations", label: "Data Processor Obligations" },
  { id: "zero-model-training", label: "Zero Public Model Training Guarantee" },
  { id: "subprocessors", label: "Approved Sub-processors" },
  { id: "security-measures", label: "Technical & Organizational Measures (TOMs)" },
  { id: "incident-notification", label: "Security Incident Notification (72h)" },
  { id: "international-transfers", label: "Cross-Border Data Transfers" },
  { id: "audit-rights", label: "Audit & Compliance Verification" },
  { id: "return-deletion", label: "Data Return & Cryptographic Erasure" },
];

export default function DpaPage() {
  return (
    <LegalPage
      title="Data Processing Agreement (DPA)"
      updated="26 October 2026 · Version 1.0"
      toc={TOC}
      summaryTitle="DATA PROCESSING ADDENDUM SUMMARY"
      summaryText={
        <div className="space-y-2 text-[13px] leading-relaxed text-[var(--paper-ink)]">
          <p>
            <strong>Statutory B2B Processing Addendum:</strong> This Data Processing Agreement (&ldquo;DPA&rdquo;) forms part of the Master Terms of Service between AegisDesk and the Client, ensuring compliance with <strong>GDPR Article 28</strong> and the <strong>India Digital Personal Data Protection (DPDP) Act 2023</strong>.
          </p>
          <p className="text-[12px] opacity-80">
            Jurisdiction-specific clauses, transfer impact assessments (TIAs), and sub-processor commitments are governed by our enterprise data protection framework.
          </p>
        </div>
      }
    >
      {/* 1. Scope & Roles */}
      <section id="scope-roles" className="scroll-mt-32 space-y-4">
        <h2 className="flex items-baseline gap-2.5 font-sans text-xl font-normal tracking-tight text-[var(--text)] sm:text-2xl">
          <span className="font-mono text-xs uppercase tracking-[0.08em] text-[var(--verified)] tabular-nums">
            §01 //
          </span>
          <span>Scope &amp; Processing Roles</span>
        </h2>
        <p className="text-[15px] leading-relaxed text-[var(--text-dim)]">
          The Client acts as the <strong>Data Fiduciary</strong> (under the India DPDP Act 2023) and <strong>Data Controller</strong> (under the General Data Protection Regulation (EU) 2016/679). AegisDesk operates strictly as the <strong>Data Processor</strong> on behalf of the Client.
        </p>
        <p className="text-[15px] leading-relaxed text-[var(--text-dim)]">
          AegisDesk processes customer support tickets, knowledge base documents, and metadata solely in accordance with documented instructions from the Client, as set forth in the Master Agreement and this DPA.
        </p>
      </section>

      {/* 2. Processor Obligations */}
      <section id="processor-obligations" className="scroll-mt-32 space-y-4">
        <h2 className="flex items-baseline gap-2.5 font-sans text-xl font-normal tracking-tight text-[var(--text)] sm:text-2xl">
          <span className="font-mono text-xs uppercase tracking-[0.08em] text-[var(--verified)] tabular-nums">
            §02 //
          </span>
          <span>Data Processor Obligations</span>
        </h2>
        <p className="text-[15px] leading-relaxed text-[var(--text-dim)]">
          AegisDesk covenants to:
        </p>
        <ul className="list-disc pl-6 space-y-2 text-[14px] text-[var(--text-dim)]">
          <li>Process Personal Data only on documented instructions from the Client.</li>
          <li>Ensure that persons authorized to process Personal Data have committed themselves to confidentiality or are under an appropriate statutory obligation of confidentiality.</li>
          <li>Assist the Client in fulfilling their statutory obligations to respond to Data Subject requests (access, rectification, erasure, grievance redressal).</li>
        </ul>
      </section>

      {/* 3. Zero Model Training */}
      <section id="zero-model-training" className="scroll-mt-32 space-y-4">
        <h2 className="flex items-baseline gap-2.5 font-sans text-xl font-normal tracking-tight text-[var(--text)] sm:text-2xl">
          <span className="font-mono text-xs uppercase tracking-[0.08em] text-[var(--verified)] tabular-nums">
            §03 //
          </span>
          <span>Zero Public Model Training Guarantee</span>
        </h2>
        <div className="rounded-[10px] border border-[var(--line)] bg-[var(--surface)] p-4 text-[14px] text-[var(--text)] space-y-2">
          <p className="font-semibold text-[var(--verified)] font-mono text-xs uppercase tracking-wider">
            Enterprise Model Isolation Covenant
          </p>
          <p className="text-[var(--text-dim)]">
            AegisDesk irrevocably warrants that <strong>no client documentation, support ticket metadata, or customer conversations</strong> will ever be used to train, retrain, fine-tune, or calibrate public commercial foundation models (including OpenAI, Anthropic, or proprietary base models).
          </p>
        </div>
      </section>

      {/* 4. Sub-processors */}
      <section id="subprocessors" className="scroll-mt-32 space-y-4">
        <h2 className="flex items-baseline gap-2.5 font-sans text-xl font-normal tracking-tight text-[var(--text)] sm:text-2xl">
          <span className="font-mono text-xs uppercase tracking-[0.08em] text-[var(--verified)] tabular-nums">
            §04 //
          </span>
          <span>Approved Sub-processors</span>
        </h2>
        <p className="text-[15px] leading-relaxed text-[var(--text-dim)]">
          The Client grants general authorization for AegisDesk to engage the following infrastructure sub-processors:
        </p>
        <div className="overflow-x-auto rounded-[10px] border border-[var(--line)]">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[var(--surface-2)] text-[var(--text)] border-b border-[var(--line)]">
              <tr>
                <th className="p-3">Sub-processor</th>
                <th className="p-3">Purpose</th>
                <th className="p-3">Hosting Location</th>
                <th className="p-3">Certification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)] text-[var(--text-dim)]">
              <tr>
                <td className="p-3 text-[var(--text)]">Supabase / AWS</td>
                <td className="p-3">Encrypted PostgreSQL database &amp; document storage</td>
                <td className="p-3">EU (Frankfurt) / US-East (N. Virginia)</td>
                <td className="p-3">SOC 2 Type II, ISO 27001</td>
              </tr>
              <tr>
                <td className="p-3 text-[var(--text)]">Upstash Redis</td>
                <td className="p-3">Rate limiting &amp; session counters</td>
                <td className="p-3">AWS us-east-1 / eu-central-1</td>
                <td className="p-3">SOC 2 Type II</td>
              </tr>
              <tr>
                <td className="p-3 text-[var(--text)]">Razorpay</td>
                <td className="p-3">Payment tokenization &amp; billing webhooks</td>
                <td className="p-3">PCI-DSS Level 1 Hosted Infrastructure</td>
                <td className="p-3">PCI-DSS v4.0, ISO 27001</td>
              </tr>
              <tr>
                <td className="p-3 text-[var(--text)]">Resend / AWS SES</td>
                <td className="p-3">Transactional billing receipts &amp; owner alerts</td>
                <td className="p-3">US-East (N. Virginia)</td>
                <td className="p-3">SOC 2 Type II</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 5. Security Measures (TOMs) */}
      <section id="security-measures" className="scroll-mt-32 space-y-4">
        <h2 className="flex items-baseline gap-2.5 font-sans text-xl font-normal tracking-tight text-[var(--text)] sm:text-2xl">
          <span className="font-mono text-xs uppercase tracking-[0.08em] text-[var(--verified)] tabular-nums">
            §05 //
          </span>
          <span>Technical &amp; Organizational Measures (TOMs)</span>
        </h2>
        <p className="text-[15px] leading-relaxed text-[var(--text-dim)]">
          AegisDesk enforces TLS 1.3 in transit, AES-256 encryption at rest, tenant-isolated vector namespaces, role-based access control (RBAC), and automated PII scrubbing (phone, email, PAN) prior to vector indexing.
        </p>
      </section>

      {/* 6. Incident Notification */}
      <section id="incident-notification" className="scroll-mt-32 space-y-4">
        <h2 className="flex items-baseline gap-2.5 font-sans text-xl font-normal tracking-tight text-[var(--text)] sm:text-2xl">
          <span className="font-mono text-xs uppercase tracking-[0.08em] text-[var(--verified)] tabular-nums">
            §06 //
          </span>
          <span>Security Incident Notification (72 Hours)</span>
        </h2>
        <p className="text-[15px] leading-relaxed text-[var(--text-dim)]">
          AegisDesk shall notify the Client without undue delay and in any event within <strong>72 hours</strong> after becoming aware of any confirmed security incident leading to unauthorized access, disclosure, or alteration of Client Personal Data.
        </p>
      </section>

      {/* 7. International Transfers */}
      <section id="international-transfers" className="scroll-mt-32 space-y-4">
        <h2 className="flex items-baseline gap-2.5 font-sans text-xl font-normal tracking-tight text-[var(--text)] sm:text-2xl">
          <span className="font-mono text-xs uppercase tracking-[0.08em] text-[var(--verified)] tabular-nums">
            §07 //
          </span>
          <span>Cross-Border Data Transfers</span>
        </h2>
        <p className="text-[15px] leading-relaxed text-[var(--text-dim)]">
          Cross-border data transfers are governed by European Commission Standard Contractual Clauses (SCCs 2021/914 Module 2) and applicable notification provisions under Section 16 of the India DPDP Act 2023.
        </p>
      </section>

      {/* 8. Audit Rights */}
      <section id="audit-rights" className="scroll-mt-32 space-y-4">
        <h2 className="flex items-baseline gap-2.5 font-sans text-xl font-normal tracking-tight text-[var(--text)] sm:text-2xl">
          <span className="font-mono text-xs uppercase tracking-[0.08em] text-[var(--verified)] tabular-nums">
            §08 //
          </span>
          <span>Audit &amp; Compliance Verification</span>
        </h2>
        <p className="text-[15px] leading-relaxed text-[var(--text-dim)]">
          Upon reasonable written notice (not less than thirty (30) business days), AegisDesk shall provide its SOC 2 Type II and third-party penetration test executive summaries to the Client&rsquo;s security audit team.
        </p>
      </section>

      {/* 9. Return & Deletion */}
      <section id="return-deletion" className="scroll-mt-32 space-y-4">
        <h2 className="flex items-baseline gap-2.5 font-sans text-xl font-normal tracking-tight text-[var(--text)] sm:text-2xl">
          <span className="font-mono text-xs uppercase tracking-[0.08em] text-[var(--verified)] tabular-nums">
            §09 //
          </span>
          <span>Data Return &amp; Cryptographic Erasure</span>
        </h2>
        <p className="text-[15px] leading-relaxed text-[var(--text-dim)]">
          Upon termination of services, AegisDesk shall, at the choice of the Client, export and return all ingested client documentation and delete all existing copies and vector embeddings within thirty (30) days, certifying cryptographic erasure under NIST SP 800-88 standards.
        </p>
      </section>
    </LegalPage>
  );
}
