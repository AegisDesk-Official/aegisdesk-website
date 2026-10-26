import type { Metadata } from "next";
import { LegalPage, TocItem } from "@/components/ui/legal-page";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Terms of Service | AegisDesk",
  description: "B2B Terms of Service governing the AegisDesk customer support platform, 14-day Shadow Validation calibration, and hosted Razorpay payments.",
};

const TOC: TocItem[] = [
  { id: "legal-entity", label: "Parties & Acceptance of Terms" },
  { id: "scope-of-services", label: "Scope of Services & Shadow Validation" },
  { id: "commercial-terms", label: "Pricing, Invoicing & Payment Terms" },
  { id: "intellectual-property", label: "Intellectual Property & Data Ownership" },
  { id: "confidentiality-security", label: "Confidentiality & Data Handling" },
  { id: "service-levels", label: "Service Levels & Verification Benchmarks" },
  { id: "limitation-of-liability", label: "Limitation of Liability & Indemnification" },
  { id: "term-and-termination", label: "Term, Suspension & Termination" },
  { id: "governing-law", label: "Governing Law & Dispute Resolution" },
];

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      updated="26 October 2026"
      toc={TOC}
      summaryTitle="B2B COMMERCIAL FRAMEWORK SUMMARY"
      summaryText={
        <div className="space-y-2 text-[13px] leading-relaxed text-[var(--paper-ink)]">
          <p>
            <strong>Enterprise Commercial Terms:</strong> AegisDesk services are provided exclusively under written B2B agreements.
            Deployments begin with our 14-day Shadow Validation (setup fee starting at $2,500 split into 50% deposit and 50% balance + $1,000/mo retainer) where human agents approve replies before live autonomous customer routing is enabled.
          </p>
          <p className="text-[12px] opacity-80">
            Clients retain 100% ownership of their source documents, manuals, and customer support data.
          </p>
        </div>
      }
    >
      {/* 1. Parties & Acceptance */}
      <section id="legal-entity" className="scroll-mt-32 space-y-4">
        <h2 className="flex items-baseline gap-2.5 font-sans text-xl font-normal tracking-tight text-[var(--text)] sm:text-2xl">
          <span className="font-mono text-xs uppercase tracking-[0.08em] text-[var(--verified)] tabular-nums">
            §01 //
          </span>
          <span>Parties &amp; Acceptance of Terms</span>
        </h2>
        <p className="text-[15px] leading-relaxed text-[var(--text-dim)]">
          These Terms of Service (&ldquo;Terms&rdquo;) constitute a legally binding agreement entered into between{" "}
          <strong>{siteConfig.legalName || siteConfig.brandName}</strong> (&ldquo;AegisDesk&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;),
          {siteConfig.registeredAddress ? ` having its registered office at ${siteConfig.registeredAddress},` : ""}{" "}
          and the business entity subscribing to or accessing the AegisDesk services (&ldquo;Client&rdquo;, &ldquo;you&rdquo;, or &ldquo;your&rdquo;) [CONFIRM].
        </p>
        <p className="text-[15px] leading-relaxed text-[var(--text-dim)]">
          By signing an Order Form, executing a digital payment via our hosted payment gateway, or accessing the AegisDesk client portal, you confirm that you have the legal authority to bind the Client to these Terms [CONFIRM].
        </p>
      </section>

      {/* 2. Scope & Shadow Validation */}
      <section id="scope-of-services" className="scroll-mt-32 space-y-4">
        <h2 className="flex items-baseline gap-2.5 font-sans text-xl font-normal tracking-tight text-[var(--text)] sm:text-2xl">
          <span className="font-mono text-xs uppercase tracking-[0.08em] text-[var(--verified)] tabular-nums">
            §02 //
          </span>
          <span>Scope of Services &amp; 14-Day Shadow Validation</span>
        </h2>
        <p className="text-[15px] leading-relaxed text-[var(--text-dim)]">
          AegisDesk provides a proprietary Corrective Retrieval-Augmented Generation (Corrective-RAG) software platform and technical integration service that ingests Client documents, manuals, policies, and ticket history to generate grounded customer support answers with page-level citations.
        </p>
        <p className="text-[15px] leading-relaxed text-[var(--text-dim)]">
          Every deployment is subject to our mandatory 14-day Shadow Validation calibration period [CONFIRM]:
        </p>
        <ul className="list-disc pl-5 space-y-2 text-[14px] text-[var(--text-dim)] font-sans">
          <li>
            <strong>Shadow Validation Calibration:</strong> For the initial 14 calendar days following technical connection, the AI will generate draft responses alongside human support agents for review and approval. Autonomous sending directly to Client&apos;s end-customers is strictly disabled during this phase [CONFIRM].
          </li>
          <li>
            <strong>Go-Live Authorization:</strong> Autonomous resolution is activated only after the Client approves the 14-day calibration report, achieves a retrieval benchmark clearing our safety threshold (&ge; 92.0%), and executes written sign-off [CONFIRM].
          </li>
          <li>
            <strong>Human Escalation Safeguard:</strong> Any query failing to clear the deterministic confidence threshold or lacking source attribution in Client documents must automatically route to human agents.
          </li>
        </ul>
      </section>

      {/* 3. Commercial Terms */}
      <section id="commercial-terms" className="scroll-mt-32 space-y-4">
        <h2 className="flex items-baseline gap-2.5 font-sans text-xl font-normal tracking-tight text-[var(--text)] sm:text-2xl">
          <span className="font-mono text-xs uppercase tracking-[0.08em] text-[var(--verified)] tabular-nums">
            §03 //
          </span>
          <span>Pricing, Invoicing &amp; Payment Terms</span>
        </h2>
        <p className="text-[15px] leading-relaxed text-[var(--text-dim)]">
          Commercial terms are structured as follows:
        </p>
        <ul className="list-disc pl-5 space-y-2 text-[14px] text-[var(--text-dim)] font-sans">
          <li>
            <strong>Implementation Setup Fee (Starting at $2,500 total):</strong> Split into two equal milestones: (a) a 50% Kickoff Deposit ($1,250 base) due prior to document ingestion; and (b) a 50% Final Calibration Balance ($1,250 base) due upon completion of the 14-day Shadow Validation and Go-Live authorization [CONFIRM].
          </li>
          <li>
            <strong>Monthly Managed Retainer (Starting at $1,000/month):</strong> Billed monthly in advance, commencing upon completion of the Shadow Validation [CONFIRM]. Covers vector store hosting, model compute, continuous retrieval calibration, and ongoing engineering support.
          </li>
          <li>
            <strong>Payment Processing via Razorpay:</strong> All electronic credit card, debit card, Netbanking, NEFT, and corporate payment orders are processed securely through Razorpay Software Private Limited (&ldquo;Razorpay&rdquo;), a certified PCI-DSS Level 1 payment aggregator [CONFIRM]. Payment details are handled by Razorpay and not stored by us. AegisDesk does not store, capture, or have access to raw card numbers, CVVs, or banking authentication credentials [CONFIRM].
          </li>
          <li>
            <strong>Currencies &amp; Statutory Taxes:</strong> Domestic Indian transactions are charged in Indian Rupees (INR) subject to applicable Goods and Services Tax (18% GST under SAC 998313) [CONFIRM]. International transactions are charged in US Dollars (USD) under export of services statutory provisions [CONFIRM].
          </li>
          <li>
            <strong>Late Payments &amp; Grace Period:</strong> If a monthly retainer invoice remains unpaid for more than 7 calendar days past the due date, AegisDesk reserves the right to suspend autonomous answering and fail-soft to Shadow Validation draft-only operations until the account is brought current [CONFIRM].
          </li>
        </ul>
      </section>

      {/* 4. Intellectual Property */}
      <section id="intellectual-property" className="scroll-mt-32 space-y-4">
        <h2 className="flex items-baseline gap-2.5 font-sans text-xl font-normal tracking-tight text-[var(--text)] sm:text-2xl">
          <span className="font-mono text-xs uppercase tracking-[0.08em] text-[var(--verified)] tabular-nums">
            §04 //
          </span>
          <span>Intellectual Property &amp; Data Ownership</span>
        </h2>
        <p className="text-[15px] leading-relaxed text-[var(--text-dim)]">
          <strong>Client Ownership:</strong> Client retains sole and exclusive ownership of all proprietary data, policy manuals, product specifications, standard operating procedures, customer support tickets, and intellectual property uploaded to or processed through the service (&ldquo;Client Content&rdquo;) [CONFIRM].
        </p>
        <p className="text-[15px] leading-relaxed text-[var(--text-dim)]">
          <strong>Zero Model Training Guarantee:</strong> AegisDesk guarantees that Client Content is never used, shared, or retained to train, retrain, or fine-tune public or third-party foundational language models [CONFIRM]. All retrieval operates within isolated cryptographic tenant namespaces.
        </p>
        <p className="text-[15px] leading-relaxed text-[var(--text-dim)]">
          <strong>AegisDesk Platform IP:</strong> AegisDesk retains all rights, title, and interest in and to the platform, underlying Corrective-RAG algorithms, user interfaces, verification heuristics, and API architecture [CONFIRM].
        </p>
      </section>

      {/* 5. Confidentiality & Security */}
      <section id="confidentiality-security" className="scroll-mt-32 space-y-4">
        <h2 className="flex items-baseline gap-2.5 font-sans text-xl font-normal tracking-tight text-[var(--text)] sm:text-2xl">
          <span className="font-mono text-xs uppercase tracking-[0.08em] text-[var(--verified)] tabular-nums">
            §05 //
          </span>
          <span>Confidentiality &amp; Data Handling</span>
        </h2>
        <p className="text-[15px] leading-relaxed text-[var(--text-dim)]">
          Each party agrees to protect the other party&apos;s Confidential Information with the same degree of care it uses for its own confidential assets (and not less than reasonable care) [CONFIRM].
        </p>
        <p className="text-[15px] leading-relaxed text-[var(--text-dim)]">
          AegisDesk enforces bank-grade security standards, including TLS 1.3 transport encryption, AES-256 at-rest storage encryption, automated PII token redaction prior to vector indexing, and immutable administrative audit trails. Full details are set forth in our <a href="/security" className="text-[var(--glow)] underline underline-offset-4">Security &amp; Data Handling Posture</a>.
        </p>
      </section>

      {/* 6. Service Levels */}
      <section id="service-levels" className="scroll-mt-32 space-y-4">
        <h2 className="flex items-baseline gap-2.5 font-sans text-xl font-normal tracking-tight text-[var(--text)] sm:text-2xl">
          <span className="font-mono text-xs uppercase tracking-[0.08em] text-[var(--verified)] tabular-nums">
            §06 //
          </span>
          <span>Service Levels &amp; Verification Benchmarks</span>
        </h2>
        <p className="text-[15px] leading-relaxed text-[var(--text-dim)]">
          AegisDesk targets 99.9% platform availability during each calendar month, excluding scheduled maintenance announced with at least 48 hours notice [CONFIRM].
        </p>
        <p className="text-[15px] leading-relaxed text-[var(--text-dim)]">
          The software will not dispatch an autonomous response to an end-customer unless the system achieves a calculated confidence score equal to or exceeding 92.0% with verified document citation metadata.
        </p>
      </section>

      {/* 7. Limitation of Liability */}
      <section id="limitation-of-liability" className="scroll-mt-32 space-y-4">
        <h2 className="flex items-baseline gap-2.5 font-sans text-xl font-normal tracking-tight text-[var(--text)] sm:text-2xl">
          <span className="font-mono text-xs uppercase tracking-[0.08em] text-[var(--verified)] tabular-nums">
            §07 //
          </span>
          <span>Limitation of Liability &amp; Indemnification</span>
        </h2>
        <p className="text-[15px] leading-relaxed text-[var(--text-dim)]">
          To the maximum extent permitted by applicable law, neither party shall be liable for any indirect, incidental, consequential, special, or punitive damages, including loss of profits, revenue, data, or business opportunities, arising out of or related to these Terms [CONFIRM].
        </p>
        <p className="text-[15px] leading-relaxed text-[var(--text-dim)]">
          Except for gross negligence, willful misconduct, or breach of confidentiality obligations, each party&apos;s total aggregate liability under or in connection with these Terms shall be limited to the total fees actually paid by Client to AegisDesk in the twelve (12) months preceding the event giving rise to the claim [CONFIRM].
        </p>
      </section>

      {/* 8. Term & Termination */}
      <section id="term-and-termination" className="scroll-mt-32 space-y-4">
        <h2 className="flex items-baseline gap-2.5 font-sans text-xl font-normal tracking-tight text-[var(--text)] sm:text-2xl">
          <span className="font-mono text-xs uppercase tracking-[0.08em] text-[var(--verified)] tabular-nums">
            §08 //
          </span>
          <span>Term, Suspension &amp; Termination</span>
        </h2>
        <p className="text-[15px] leading-relaxed text-[var(--text-dim)]">
          These Terms commence on the date Client first accesses the service or signs an Order Form, and continue on a month-to-month basis until terminated [CONFIRM].
        </p>
        <p className="text-[15px] leading-relaxed text-[var(--text-dim)]">
          Either party may terminate the monthly managed retainer by providing at least thirty (30) calendar days written notice prior to the end of the current billing cycle [CONFIRM].
        </p>
        <p className="text-[15px] leading-relaxed text-[var(--text-dim)]">
          Upon termination, Client access to the dashboard is revoked, and all Client Content, embeddings, and vector namespaces are scheduled for permanent cryptographic purge within thirty (30) days in accordance with our data retention schedule [CONFIRM].
        </p>
      </section>

      {/* 9. Governing Law */}
      <section id="governing-law" className="scroll-mt-32 space-y-4">
        <h2 className="flex items-baseline gap-2.5 font-sans text-xl font-normal tracking-tight text-[var(--text)] sm:text-2xl">
          <span className="font-mono text-xs uppercase tracking-[0.08em] text-[var(--verified)] tabular-nums">
            §09 //
          </span>
          <span>Governing Law &amp; Dispute Resolution</span>
        </h2>
        <p className="text-[15px] leading-relaxed text-[var(--text-dim)]">
          For domestic Indian transactions, these Terms shall be governed by and construed in accordance with the laws of India, and the courts having jurisdiction in India shall have exclusive jurisdiction over any disputes [CONFIRM].
        </p>
        <p className="text-[15px] leading-relaxed text-[var(--text-dim)]">
          For international enterprise contracts executed in US Dollars, the governing law shall be the State of Delaware, United States, without regard to conflict of law principles, and disputes shall be resolved by binding commercial arbitration [CONFIRM].
        </p>
      </section>
    </LegalPage>
  );
}
