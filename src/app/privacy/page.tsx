import type { Metadata } from "next";
import { LegalPage, TocItem } from "@/components/ui/legal-page";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Privacy Policy | AegisDesk",
  description: "Enterprise privacy notice covering data minimization, DPDP Act 2023 & GDPR compliance, and hosted Razorpay payment data handling.",
};

const TOC: TocItem[] = [
  { id: "data-controller", label: "Data Fiduciary & Scope" },
  { id: "payment-security", label: "Razorpay Payment Data Handling" },
  { id: "what-we-collect", label: "Categories of Data Collected" },
  { id: "how-we-use", label: "Lawful Grounds & Purpose Limitation" },
  { id: "zero-training", label: "Zero Public Model Training Guarantee" },
  { id: "sub-processors", label: "Sub-Processors & Infrastructure" },
  { id: "retention-and-erasure", label: "Data Retention & Cryptographic Purge" },
  { id: "data-principal-rights", label: "Your Rights (DPDP & GDPR)" },
  { id: "grievance-officer", label: "Statutory Grievance Officer" },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated="26 October 2026"
      toc={TOC}
      summaryTitle="DATA PROTECTION &amp; PRIVACY POSTURE"
      summaryText={
        <div className="space-y-2 text-[13px] leading-relaxed text-[var(--paper-ink)]">
          <p>
            <strong>Payment Security Guarantee:</strong> Payment details are handled by Razorpay and not stored by us [CONFIRM]. All payment transactions are processed directly by Razorpay (PCI-DSS Level 1 certified).
            AegisDesk never collects, inspects, or stores credit/debit card numbers, CVVs, or banking credentials [CONFIRM].
          </p>
          <p className="text-[12px] opacity-80">
            Compliant with the India Digital Personal Data Protection (DPDP) Act 2023 and EU/UK GDPR principles [CONFIRM].
          </p>
        </div>
      }
    >
      {/* 1. Data Fiduciary & Scope */}
      <section id="data-controller" className="scroll-mt-32 space-y-4">
        <h2 className="flex items-baseline gap-2.5 font-sans text-xl font-normal tracking-tight text-[var(--text)] sm:text-2xl">
          <span className="font-mono text-xs uppercase tracking-[0.08em] text-[var(--verified)] tabular-nums">
            §01 //
          </span>
          <span>Data Fiduciary &amp; Scope</span>
        </h2>
        <p className="text-[15px] leading-relaxed text-[var(--text-dim)]">
          This Privacy Policy describes how <strong>{siteConfig.legalName || siteConfig.brandName}</strong> (&ldquo;AegisDesk&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;) acts as a Data Fiduciary / Data Controller with respect to website visitors and client account administrators, and as a Data Processor with respect to client support ticket data ingested into our Corrective-RAG platform [CONFIRM].
        </p>
        <p className="text-[15px] leading-relaxed text-[var(--text-dim)]">
          {siteConfig.registeredAddress ? `Registered Office: ${siteConfig.registeredAddress}. ` : ""}Contact: <a href={`mailto:${siteConfig.supportEmail}`} className="text-[var(--glow)] underline underline-offset-4">{siteConfig.supportEmail}</a>.
        </p>
      </section>

      {/* 2. Razorpay Payment Data Handling */}
      <section id="payment-security" className="scroll-mt-32 space-y-4">
        <h2 className="flex items-baseline gap-2.5 font-sans text-xl font-normal tracking-tight text-[var(--text)] sm:text-2xl">
          <span className="font-mono text-xs uppercase tracking-[0.08em] text-[var(--verified)] tabular-nums">
            §02 //
          </span>
          <span>Razorpay Payment Data Handling</span>
        </h2>
        <div className="p-4 rounded-[10px] bg-[rgba(111,216,166,0.06)] border border-[rgba(111,216,166,0.25)] space-y-2 text-[14px] font-sans text-[var(--text)]">
          <p className="font-semibold text-[var(--verified)]">
            Mandatory Payment Gateway Disclosure:
          </p>
          <p className="text-[13.5px] leading-relaxed text-[var(--text-dim)]">
            <strong>Payment details are handled by Razorpay and not stored by us [CONFIRM].</strong> All digital payments for AegisDesk setup fees and recurring retainers are processed exclusively by <strong>Razorpay Software Private Limited (&ldquo;Razorpay&rdquo;)</strong>, a certified Payment Card Industry Data Security Standard (PCI-DSS) Level 1 service provider.
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-[13px] text-[var(--text-dim)]">
            <li>
              <strong>Zero Card Data on Our Servers:</strong> When you complete checkout via Razorpay hosted modal, your payment card numbers, expiry dates, CVVs, Netbanking credentials, and UPI authentication PINs are transmitted directly from your browser to Razorpay&apos;s encrypted servers over TLS 1.3 [CONFIRM].
            </li>
            <li>
              <strong>AegisDesk Never Stores Payment Credentials:</strong> AegisDesk never collects, receives, logs, processes, or stores raw payment instrument details on our application servers or in database storage [CONFIRM].
            </li>
            <li>
              <strong>Telemetry Received:</strong> AegisDesk receives only non-sensitive transaction tokens from Razorpay to verify invoice settlement: payment ID, masked card brand / last 4 digits (e.g. <code>•••• 8491</code>), currency, amount, and timestamp.
            </li>
          </ul>
        </div>
      </section>

      {/* 3. Categories of Data Collected */}
      <section id="what-we-collect" className="scroll-mt-32 space-y-4">
        <h2 className="flex items-baseline gap-2.5 font-sans text-xl font-normal tracking-tight text-[var(--text)] sm:text-2xl">
          <span className="font-mono text-xs uppercase tracking-[0.08em] text-[var(--verified)] tabular-nums">
            §03 //
          </span>
          <span>Categories of Data Collected</span>
        </h2>
        <ul className="space-y-2 text-[14px] text-[var(--text-dim)] font-sans">
          <li>
            <strong>Account &amp; Onboarding Details:</strong> Business name, domain, work email, phone number, and billing address provided during scoping and contract setup.
          </li>
          <li>
            <strong>Proprietary Knowledge Base Documents:</strong> Company standard operating procedures, PDF manuals, product documentation, and policy files uploaded to calibrate the retrieval engine.
          </li>
          <li>
            <strong>Support Ticket Streams:</strong> Incoming tickets routed through helpdesk integrations (Zendesk, Freshdesk, Gorgias, Intercom). We enforce automated PII redaction (scrubbing credit cards, social security tokens, passwords) before chunking and embedding.
          </li>
          <li>
            <strong>Technical Telemetry:</strong> Anonymized latency metrics, model confidence scores, cryptographic citation hashes, and IP addresses used solely for bot mitigation and security audit logging.
          </li>
        </ul>
      </section>

      {/* 4. Purpose Limitation */}
      <section id="how-we-use" className="scroll-mt-32 space-y-4">
        <h2 className="flex items-baseline gap-2.5 font-sans text-xl font-normal tracking-tight text-[var(--text)] sm:text-2xl">
          <span className="font-mono text-xs uppercase tracking-[0.08em] text-[var(--verified)] tabular-nums">
            §04 //
          </span>
          <span>Lawful Grounds &amp; Purpose Limitation</span>
        </h2>
        <p className="text-[15px] leading-relaxed text-[var(--text-dim)]">
          We process personal and corporate data strictly under the following lawful bases:
        </p>
        <ul className="list-disc pl-5 space-y-1.5 text-[14px] text-[var(--text-dim)] font-sans">
          <li><strong>Contractual Performance:</strong> To provision the client portal, index document vectors, generate verified draft responses, and process milestone invoices.</li>
          <li><strong>Legitimate Interests:</strong> To detect malicious bot activity, monitor API latency, enforce security thresholds, and prevent service abuse.</li>
          <li><strong>Statutory Compliance:</strong> To issue GST tax-compliant invoices and preserve audit logs as mandated by Indian tax and cyber regulations.</li>
        </ul>
      </section>

      {/* 5. Zero Public Model Training Guarantee */}
      <section id="zero-training" className="scroll-mt-32 space-y-4">
        <h2 className="flex items-baseline gap-2.5 font-sans text-xl font-normal tracking-tight text-[var(--text)] sm:text-2xl">
          <span className="font-mono text-xs uppercase tracking-[0.08em] text-[var(--verified)] tabular-nums">
            §05 //
          </span>
          <span>Zero Public Model Training Guarantee</span>
        </h2>
        <div className="p-4 rounded-[10px] bg-[var(--surface)] border border-[var(--line)] space-y-2 font-mono text-[12px]">
          <div className="flex items-center gap-2 text-[var(--verified)] font-medium">
            <span className="w-2 h-2 rounded-full bg-[var(--verified)]" />
            <span>Cryptographic Tenant Isolation Assurance</span>
          </div>
          <p className="font-sans text-[13.5px] text-[var(--text-dim)] leading-relaxed">
            Client documentation, manuals, customer tickets, and human agent feedback are <strong>never used to train, retrain, or improve public foundation models</strong> (such as OpenAI GPT, Anthropic Claude, or Google Gemini). Vector embeddings reside in tenant-isolated namespaces protected by Row Level Security (RLS) and AES-256 encryption.
          </p>
        </div>
      </section>

      {/* 6. Sub-Processors */}
      <section id="sub-processors" className="scroll-mt-32 space-y-4">
        <h2 className="flex items-baseline gap-2.5 font-sans text-xl font-normal tracking-tight text-[var(--text)] sm:text-2xl">
          <span className="font-mono text-xs uppercase tracking-[0.08em] text-[var(--verified)] tabular-nums">
            §06 //
          </span>
          <span>Authorized Sub-Processors</span>
        </h2>
        <p className="text-[15px] leading-relaxed text-[var(--text-dim)]">
          AegisDesk contracts with enterprise-grade sub-processors bound by data processing agreements requiring strict confidentiality and encryption:
        </p>
        <div className="border border-[var(--line)] rounded-[8px] overflow-x-auto font-mono text-[11px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[var(--surface-2)] border-b border-[var(--line)] text-[var(--text-faint)] uppercase text-[10px]">
                <th className="p-2.5 font-normal">Sub-Processor</th>
                <th className="p-2.5 font-normal">Function</th>
                <th className="p-2.5 font-normal">Data Location</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)] text-[var(--text)]">
              <tr>
                <td className="p-2.5 font-semibold">Razorpay Software Pvt Ltd</td>
                <td className="p-2.5 text-[var(--text-dim)] font-sans">Payment gateway, checkout processing, GST invoicing</td>
                <td className="p-2.5 font-mono">India</td>
              </tr>
              <tr>
                <td className="p-2.5 font-semibold">Supabase Inc.</td>
                <td className="p-2.5 text-[var(--text-dim)] font-sans">PostgreSQL database, Row Level Security, vector storage</td>
                <td className="p-2.5 font-mono">US-East / AWS Mumbai</td>
              </tr>
              <tr>
                <td className="p-2.5 font-semibold">Cloudflare Inc.</td>
                <td className="p-2.5 text-[var(--text-dim)] font-sans">Turnstile bot deterrence, edge CDN, TLS termination</td>
                <td className="p-2.5 font-mono">Global Edge</td>
              </tr>
              <tr>
                <td className="p-2.5 font-semibold">Resend Inc.</td>
                <td className="p-2.5 text-[var(--text-dim)] font-sans">Transactional email delivery (invoices, receipts, 2FA alerts)</td>
                <td className="p-2.5 font-mono">United States</td>
              </tr>
              <tr>
                <td className="p-2.5 font-semibold">Cal.com Inc.</td>
                <td className="p-2.5 text-[var(--text-dim)] font-sans">Scoping call calendar scheduling</td>
                <td className="p-2.5 font-mono">United States / EU</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 7. Retention & Erasure */}
      <section id="retention-and-erasure" className="scroll-mt-32 space-y-4">
        <h2 className="flex items-baseline gap-2.5 font-sans text-xl font-normal tracking-tight text-[var(--text)] sm:text-2xl">
          <span className="font-mono text-xs uppercase tracking-[0.08em] text-[var(--verified)] tabular-nums">
            §07 //
          </span>
          <span>Data Retention &amp; Cryptographic Purge</span>
        </h2>
        <p className="text-[15px] leading-relaxed text-[var(--text-dim)]">
          Client Content is retained for the duration of the active subscription. Upon termination of service, all document vectors, embeddings, and workspace indexes are irrevocably purged from all live databases within thirty (30) days. Inactive demo data is purged after 14 days.
        </p>
      </section>

      {/* 8. Your Rights */}
      <section id="data-principal-rights" className="scroll-mt-32 space-y-4">
        <h2 className="flex items-baseline gap-2.5 font-sans text-xl font-normal tracking-tight text-[var(--text)] sm:text-2xl">
          <span className="font-mono text-xs uppercase tracking-[0.08em] text-[var(--verified)] tabular-nums">
            §08 //
          </span>
          <span>Your Rights (DPDP Act &amp; GDPR)</span>
        </h2>
        <p className="text-[15px] leading-relaxed text-[var(--text-dim)]">
          Under the India Digital Personal Data Protection Act 2023 and EU/UK GDPR, you have the following rights [CONFIRM]:
        </p>
        <ul className="list-disc pl-5 space-y-1.5 text-[14px] text-[var(--text-dim)] font-sans">
          <li><strong>Access &amp; Summary:</strong> Request a summary of personal data held about you and processing activities [CONFIRM].</li>
          <li><strong>Correction &amp; Erasure:</strong> Request correction of inaccurate information or deletion of unnecessary personal data [CONFIRM].</li>
          <li><strong>Consent Withdrawal:</strong> Withdraw previously granted consent at any time without affecting past lawful processing [CONFIRM].</li>
          <li><strong>Grievance Redressal:</strong> File a grievance with our designated Grievance Officer or escalate to the Data Protection Board of India [CONFIRM].</li>
        </ul>
      </section>

      {/* 9. Grievance Officer */}
      <section id="grievance-officer" className="scroll-mt-32 space-y-4">
        <h2 className="flex items-baseline gap-2.5 font-sans text-xl font-normal tracking-tight text-[var(--text)] sm:text-2xl">
          <span className="font-mono text-xs uppercase tracking-[0.08em] text-[var(--verified)] tabular-nums">
            §09 //
          </span>
          <span>Statutory Grievance Officer</span>
        </h2>
        <p className="text-[15px] leading-relaxed text-[var(--text-dim)]">
          For privacy concerns, data principal requests, or statutory inquiries under the DPDP Act 2023, please contact our Grievance Officer [CONFIRM]:
        </p>
        <div className="p-4 rounded-[10px] bg-[var(--surface)] border border-[var(--line)] font-mono text-[13px] space-y-1.5">
          <div className="flex justify-between">
            <span className="text-[var(--text-faint)]">Designation:</span>
            <span className="text-[var(--text)]">Grievance Officer</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--text-faint)]">Email:</span>
            <a href="mailto:grievance@aegisdesk.ai" className="text-[var(--glow)] hover:underline">
              grievance@aegisdesk.ai
            </a>
          </div>
          {siteConfig.registeredAddress && (
            <div className="flex justify-between">
              <span className="text-[var(--text-faint)]">Corporate Address:</span>
              <span className="text-[var(--text)]">{siteConfig.registeredAddress}</span>
            </div>
          )}
          <div className="flex justify-between pt-1 border-t border-[var(--line)]">
            <span className="text-[var(--text-faint)]">Response SLA:</span>
            <span className="text-[var(--verified)]">Acknowledged within 24h; resolved within 15 days [CONFIRM]</span>
          </div>
        </div>
      </section>
    </LegalPage>
  );
}
