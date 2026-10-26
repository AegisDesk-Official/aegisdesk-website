import type { Metadata } from "next";
import { LegalPage, TocItem } from "@/components/ui/legal-page";
import { siteConfig } from "@/lib/site-config";
import { CheckCircle2, Clock, Globe, ArrowRight, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Shipping & Delivery Policy | AegisDesk",
  description: "Official delivery policy for AegisDesk B2B digital software services, portal account provisioning, and onboarding delivery timelines.",
};

const TOC: TocItem[] = [
  { id: "digital-declaration", label: "Purely Digital Service Declaration" },
  { id: "delivery-mechanism", label: "Electronic Delivery Mechanism" },
  { id: "delivery-timelines", label: "Delivery Phases & Service Timelines" },
  { id: "confirmation-of-delivery", label: "Proof & Confirmation of Delivery" },
  { id: "delivery-support", label: "Technical Delivery Inquiries & Delays" },
];

export default function ShippingDeliveryPage() {
  return (
    <LegalPage
      title="Shipping &amp; Delivery Policy"
      updated="26 October 2026"
      toc={TOC}
      summaryTitle="DIGITAL SERVICE DELIVERY COMMITMENTS"
      summaryText={
        <div className="space-y-2 text-[13px] leading-relaxed text-[var(--paper-ink)]">
          <p>
            <strong>Purely Digital SaaS &amp; Integration Service:</strong> AegisDesk provides cloud-hosted enterprise software.
            No physical goods, hardware, or packages are shipped or transported.
          </p>
          <p className="text-[12px] opacity-80">
            Account provisioning occurs within 1 business day of deposit settlement; full document ingestion completes in 3–5 business days.
          </p>
        </div>
      }
    >
      {/* 1. Digital Declaration */}
      <section id="digital-declaration" className="scroll-mt-32 space-y-4">
        <h2 className="flex items-baseline gap-2.5 font-sans text-xl font-normal tracking-tight text-[var(--text)] sm:text-2xl">
          <span className="font-mono text-xs uppercase tracking-[0.08em] text-[var(--verified)] tabular-nums">
            §01 //
          </span>
          <span>Purely Digital Service Declaration</span>
        </h2>
        <div className="p-4 rounded-[10px] bg-[rgba(56,189,248,0.06)] border border-[rgba(56,189,248,0.2)] font-mono text-[13px] text-[var(--text)] space-y-2">
          <div className="flex items-center gap-2 text-[var(--glow)] font-semibold uppercase text-[11px]">
            <Globe className="w-4 h-4" />
            <span>Statutory Delivery Disclosure</span>
          </div>
          <p className="font-sans text-[13.5px] leading-relaxed text-[var(--text-dim)]">
            AegisDesk, operated by <strong>{siteConfig.legalName || siteConfig.brandName}</strong>, is an enterprise B2B Software-as-a-Service (SaaS) and technical integration provider [CONFIRM]. <strong>We do not manufacture, package, ship, or deliver any physical goods, hardware, or tangible items [CONFIRM].</strong> Consequently, standard shipping fees, physical logistics, parcel tracking, and postal carrier delays are not applicable to our services.
          </p>
        </div>
      </section>

      {/* 2. Delivery Mechanism */}
      <section id="delivery-mechanism" className="scroll-mt-32 space-y-4">
        <h2 className="flex items-baseline gap-2.5 font-sans text-xl font-normal tracking-tight text-[var(--text)] sm:text-2xl">
          <span className="font-mono text-xs uppercase tracking-[0.08em] text-[var(--verified)] tabular-nums">
            §02 //
          </span>
          <span>Electronic Delivery Mechanism</span>
        </h2>
        <p className="text-[15px] leading-relaxed text-[var(--text-dim)]">
          All services, software capabilities, analytical dashboards, and API access are delivered electronically via the Internet:
        </p>
        <ul className="list-disc pl-5 space-y-2 text-[14px] text-[var(--text-dim)] font-sans">
          <li>
            <strong>Electronic Account Provisioning:</strong> Delivered via secure email transmission containing one-time administrator invite credentials from <code>auth@aegisdesk.ai</code> to the designated Client administrative contact [CONFIRM].
          </li>
          <li>
            <strong>Cloud Application Access:</strong> Provided through our web portal (<code>localhost:3000/dashboard</code>) secured by Transport Layer Security (TLS 1.3) and multi-factor authentication.
          </li>
          <li>
            <strong>API &amp; Webhook Integration:</strong> Programmatic delivery directly into Client&apos;s customer support helpdesk software (Zendesk, Freshdesk, Gorgias, Intercom, or custom API).
          </li>
        </ul>
      </section>

      {/* 3. Delivery Timelines */}
      <section id="delivery-timelines" className="scroll-mt-32 space-y-4">
        <h2 className="flex items-baseline gap-2.5 font-sans text-xl font-normal tracking-tight text-[var(--text)] sm:text-2xl">
          <span className="font-mono text-xs uppercase tracking-[0.08em] text-[var(--verified)] tabular-nums">
            §03 //
          </span>
          <span>Delivery Phases &amp; Service Timelines</span>
        </h2>
        <p className="text-[15px] leading-relaxed text-[var(--text-dim)]">
          Service delivery follows an orderly, predictable timeline:
        </p>

        <div className="space-y-3 font-mono text-[12px]">
          <div className="p-4 rounded-[8px] bg-[var(--surface)] border border-[var(--line)] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[var(--text)] font-semibold">1. Portal Workspace Provisioning</span>
              <span className="text-[10px] text-[var(--verified)] uppercase">Within 1 Business Day</span>
            </div>
            <p className="font-sans text-[13px] text-[var(--text-dim)]">
              Upon successful payment of the 50% Kickoff Deposit ($1,250 base), Client administrators receive invite tokens and full access to the Knowledge Base upload console within twenty-four (24) hours [CONFIRM].
            </p>
          </div>

          <div className="p-4 rounded-[8px] bg-[var(--surface)] border border-[var(--line)] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[var(--text)] font-semibold">2. Document Ingestion &amp; Vector Indexing</span>
              <span className="text-[10px] text-[var(--glow)] uppercase">3 to 5 Business Days</span>
            </div>
            <p className="font-sans text-[13px] text-[var(--text-dim)]">
              Following receipt of Client SOPs, return policies, and manuals, our document engineering pipeline performs cleaning, chunking, embedding generation, and initial benchmark testing.
            </p>
          </div>

          <div className="p-4 rounded-[8px] bg-[var(--surface)] border border-[var(--line)] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[var(--text)] font-semibold">3. 14-Day Shadow Validation Calibration</span>
              <span className="text-[10px] text-[var(--warn)] uppercase">14 Calendar Days</span>
            </div>
            <p className="font-sans text-[13px] text-[var(--text-dim)]">
              Begins the moment helpdesk webhooks are active. During these 14 days, the AI streams draft answers into your agent queue for human review. Real-time telemetry is accessible in the client portal.
            </p>
          </div>

          <div className="p-4 rounded-[8px] bg-[var(--surface)] border border-[var(--line)] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[var(--text)] font-semibold">4. Live Autonomous Answering Activation</span>
              <span className="text-[10px] text-[var(--verified)] uppercase">Within 24 Hours of Sign-off</span>
            </div>
            <p className="font-sans text-[13px] text-[var(--text-dim)]">
              Upon receipt of written Go-Live approval and settlement of the final 50% balance, autonomous direct answering for verified tickets is activated within twenty-four (24) hours [CONFIRM].
            </p>
          </div>
        </div>
      </section>

      {/* 4. Confirmation of Delivery */}
      <section id="confirmation-of-delivery" className="scroll-mt-32 space-y-4">
        <h2 className="flex items-baseline gap-2.5 font-sans text-xl font-normal tracking-tight text-[var(--text)] sm:text-2xl">
          <span className="font-mono text-xs uppercase tracking-[0.08em] text-[var(--verified)] tabular-nums">
            §04 //
          </span>
          <span>Proof &amp; Confirmation of Delivery</span>
        </h2>
        <p className="text-[15px] leading-relaxed text-[var(--text-dim)]">
          Proof of digital service delivery is substantiated by:
        </p>
        <ul className="list-disc pl-5 space-y-1.5 text-[14px] text-[var(--text-dim)] font-sans">
          <li>Automated email delivery confirmation timestamps sent to the Client administrative email.</li>
          <li>System event logs recording successful API webhook handshakes with Client&apos;s helpdesk software.</li>
          <li>Client portal telemetry reflecting active vector chunks, test queries, and ingested tickets.</li>
        </ul>
      </section>

      {/* 5. Support & Inquiries */}
      <section id="delivery-support" className="scroll-mt-32 space-y-4">
        <h2 className="flex items-baseline gap-2.5 font-sans text-xl font-normal tracking-tight text-[var(--text)] sm:text-2xl">
          <span className="font-mono text-xs uppercase tracking-[0.08em] text-[var(--verified)] tabular-nums">
            §05 //
          </span>
          <span>Technical Delivery Inquiries &amp; Assistance</span>
        </h2>
        <p className="text-[15px] leading-relaxed text-[var(--text-dim)]">
          If you have not received your account provisioning invitation within 1 business day of payment, or experience technical delays during helpdesk webhook integration, contact our engineering deployment team immediately:
        </p>
        <div className="p-4 rounded-[8px] bg-[var(--surface)] border border-[var(--line)] font-mono text-[13px] space-y-1">
          <p className="text-[var(--text-dim)]">Deployment Team Email: <a href={`mailto:${siteConfig.supportEmail}`} className="text-[var(--text)] underline hover:text-white">{siteConfig.supportEmail}</a></p>
          <p className="text-[var(--text-dim)]">Hours: Monday – Friday, 09:00 – 18:00 IST</p>
        </div>
      </section>
    </LegalPage>
  );
}
