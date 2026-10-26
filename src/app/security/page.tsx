import type { Metadata } from "next";
import { LegalPage, TocItem } from "@/components/ui/legal-page";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Security & Data Handling Architecture | AegisDesk",
  description:
    "Security dossier: private workspace isolation, quoted citation verification, PII redaction, and 14-day Shadow Validation guardrails.",
};

const TOC: TocItem[] = [
  { id: "tenant-isolation", label: "Private Workspace Data Isolation" },
  { id: "corrective-rag-gates", label: "Three-Check Verification Architecture" },
  { id: "pii-redaction", label: "PII & PCI Redaction Pipeline" },
  { id: "encryption-infrastructure", label: "Encryption & Infrastructure" },
  { id: "shadow-mode-guardrails", label: "14-Day Shadow Validation Floor" },
  { id: "compliance-reporting", label: "Audit Trails & Reporting" },
];

export default function SecurityPage() {
  const contact = (
    <a href="mailto:security@aegisdesk.com" className="underline underline-offset-4 hover:text-[var(--paper)]">
      our security team by email
    </a>
  );

  return (
    <LegalPage
      title="Security & Data Handling Dossier"
      updated="24 October 2026"
      toc={TOC}
      summaryTitle="SECURITY & DATA HANDLING COMMITMENT"
      summaryText={
        <div className="space-y-2 text-[13px] leading-relaxed text-[var(--paper-ink)]">
          <p>
            <strong>Document Verification Floor:</strong> AegisDesk does not guess answers. Every reply is checked against approved documents through three safety checks before it can be sent: Scoped Private Workspace Retrieval, Sentence-Level Citation Check, and Confidence Thresholding.
          </p>
          <p className="text-[12px] opacity-80">
            Client data is kept in your private workspace, is not used to train public models, and is encrypted with AES-256 at rest and TLS 1.3 in transit.
          </p>
        </div>
      }
    >
      <section id="tenant-isolation" className="scroll-mt-32 space-y-4">
        <h2 className="flex items-baseline gap-2.5 font-sans text-xl font-normal tracking-tight text-[var(--text)] sm:text-2xl">
          <span className="font-mono text-xs uppercase tracking-[0.08em] text-[var(--verified)] tabular-nums">
            §01 //
          </span>
          <span>Private Workspace Data Isolation</span>
        </h2>
        <p>
          Each client workspace is provisioned with an isolated tenant namespace. Knowledge base documents, vector embeddings, and conversation records are strictly partitioned at the database and application levels.
        </p>
        <ul>
          <li>
            <strong>Workspace Partitioning:</strong> Retrieval queries execute strictly within your authenticated workspace&apos;s isolated vector namespace.
          </li>
          <li>
            <strong>Workspace Isolation:</strong> Database queries filter strictly by account so workspaces cannot read peer data.
          </li>
          <li>
            <strong>No Model Training:</strong> Your documents, standard procedures, and tickets are not used to train public foundation models.
          </li>
        </ul>
      </section>

      <section id="corrective-rag-gates" className="scroll-mt-32 space-y-4">
        <h2 className="flex items-baseline gap-2.5 font-sans text-xl font-normal tracking-tight text-[var(--text)] sm:text-2xl">
          <span className="font-mono text-xs uppercase tracking-[0.08em] text-[var(--verified)] tabular-nums">
            §02 //
          </span>
          <span>Three-Check Verification Architecture</span>
        </h2>
        <p>
          Unlike conventional conversational chatbots that make up answers when knowledge is missing, AegisDesk evaluates answers through three sequential validation checks before any text is shown:
        </p>
        <ul>
          <li>
            <strong>Check 01 · Scoped Private Workspace Retrieval:</strong> Fetches only verified policy chunks from your approved documentation. If relevance is low, retrieval aborts immediately.
          </li>
          <li>
            <strong>Check 02 · Sentence-Level Citation Check:</strong> Every single claim in the generated draft must link directly to an exact clause and page number in the source material.
          </li>
          <li>
            <strong>Check 03 · Confidence Threshold:</strong> Answers meeting the confidence floor (standardized at 92.0%) pass for staging or resolution; borderline answers are routed instantly to your team with full context.
          </li>
        </ul>
      </section>

      <section id="pii-redaction" className="scroll-mt-32 space-y-4">
        <h2 className="flex items-baseline gap-2.5 font-sans text-xl font-normal tracking-tight text-[var(--text)] sm:text-2xl">
          <span className="font-mono text-xs uppercase tracking-[0.08em] text-[var(--verified)] tabular-nums">
            §03 //
          </span>
          <span>PII &amp; PCI Redaction Pipeline</span>
        </h2>
        <p>
          Before customer queries enter our inference graph, an inline scrubbing layer removes personally identifiable information (PII) including credit card numbers, tax identifiers, passwords, and sensitive account credentials.
        </p>
        <p>
          Masked tokens are preserved in memory solely to re-hydrate the reply before handoff to your helpdesk, preventing plaintext PII from persisting in third-party model logs.
        </p>
      </section>

      <section id="encryption-infrastructure" className="scroll-mt-32 space-y-4">
        <h2 className="flex items-baseline gap-2.5 font-sans text-xl font-normal tracking-tight text-[var(--text)] sm:text-2xl">
          <span className="font-mono text-xs uppercase tracking-[0.08em] text-[var(--verified)] tabular-nums">
            §04 //
          </span>
          <span>Encryption &amp; Infrastructure Standards</span>
        </h2>
        <p>
          AegisDesk runs on cloud infrastructure complying with SOC 2 Type II and ISO 27001 data center physical security standards.
        </p>
        <ul>
          <li>
            <strong>In Transit:</strong> All communication between customer browsers, helpdesk webhooks, and AegisDesk APIs requires TLS 1.3 encryption with strict HTTP Strict Transport Security (HSTS).
          </li>
          <li>
            <strong>At Rest:</strong> Vector embeddings, cached prompts, and metadata storage are encrypted with AES-256 with automated key rotation.
          </li>
          <li>
            <strong>Edge Protection:</strong> Cloudflare Turnstile bot deterrence and distributed DDoS mitigation protect all public entrypoints.
          </li>
        </ul>
      </section>

      <section id="shadow-mode-guardrails" className="scroll-mt-32 space-y-4">
        <h2 className="flex items-baseline gap-2.5 font-sans text-xl font-normal tracking-tight text-[var(--text)] sm:text-2xl">
          <span className="font-mono text-xs uppercase tracking-[0.08em] text-[var(--verified)] tabular-nums">
            §05 //
          </span>
          <span>14-Day Shadow Validation Safety Floor</span>
        </h2>
        <p>
          Every new deployment begins with a mandatory 14-day supervised Shadow Validation. During this window, AegisDesk operates in draft-only mode inside your Zendesk, Gorgias, or custom helpdesk workspace.
        </p>
        <p>
          The system does not send live replies to an external customer until your team reviews calibration metrics, verifies accuracy on live edge cases, and provides explicit written authorization to switch on live resolution.
        </p>
      </section>

      <section id="compliance-reporting" className="scroll-mt-32 space-y-4">
        <h2 className="flex items-baseline gap-2.5 font-sans text-xl font-normal tracking-tight text-[var(--text)] sm:text-2xl">
          <span className="font-mono text-xs uppercase tracking-[0.08em] text-[var(--verified)] tabular-nums">
            §06 //
          </span>
          <span>Audit Trails &amp; Vulnerability Reporting</span>
        </h2>
        <p>
          Clients receive immutable audit records tracking all assistant prompt updates, document ingestions, and member invitations.
        </p>
        <p>
          To report a vulnerability or request a copy of our security documentation, contact our engineering team via {contact}.
        </p>
      </section>
    </LegalPage>
  );
}
