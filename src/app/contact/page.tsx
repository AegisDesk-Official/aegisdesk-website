import type { Metadata } from "next";
import { LegalPage, TocItem } from "@/components/ui/legal-page";
import { siteConfig } from "@/lib/site-config";
import { Mail, Phone, MapPin, Clock, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Contact Us | AegisDesk",
  description: "Official corporate contact information, registered entity address, support channels, and statutory Grievance Officer details for AegisDesk.",
};

const TOC: TocItem[] = [
  { id: "corporate-entity", label: "Legal Entity & Registered Office" },
  { id: "customer-support", label: "Customer Support & Operations" },
  { id: "statutory-officer", label: "Grievance Redressal Officer" },
  { id: "scoping-inquiries", label: "Commercial & Pilot Inquiries" },
];

export default function ContactPage() {
  return (
    <LegalPage
      title="Contact Us"
      updated="26 October 2026"
      toc={TOC}
      summaryTitle="CORPORATE CONTACT &amp; SUPPORT DIRECTORY"
      summaryText={
        <div className="space-y-2 text-[13px] leading-relaxed text-[var(--paper-ink)]">
          <p>
            <strong>Official Corporate Details:</strong> AegisDesk operates as a dedicated B2B enterprise service.
            Customer support, technical integration, and billing inquiries are handled directly by our engineering and operations team.
          </p>
          <p className="text-[12px] opacity-80">
            For rapid operational responses, support tickets are acknowledged within 4 business hours.
          </p>
        </div>
      }
    >
      {/* 1. Legal Entity & Registered Office */}
      <section id="corporate-entity" className="scroll-mt-32 space-y-4">
        <h2 className="flex items-baseline gap-2.5 font-sans text-xl font-normal tracking-tight text-[var(--text)] sm:text-2xl">
          <span className="font-mono text-xs uppercase tracking-[0.08em] text-[var(--verified)] tabular-nums">
            §01 //
          </span>
          <span>Legal Entity &amp; Registered Office</span>
        </h2>
        <p className="text-[15px] leading-relaxed text-[var(--text-dim)]">
          AegisDesk software and integration services are provided by the following organization:
        </p>

        <div className="p-5 rounded-[10px] bg-[var(--surface)] border border-[var(--line)] font-mono text-[13px] space-y-3">
          <div className="flex flex-col sm:flex-row sm:justify-between py-1">
            <span className="text-[var(--text-faint)] uppercase text-[11px]">Brand Name</span>
            <span className="text-[var(--text)] font-semibold">{siteConfig.brandName}</span>
          </div>
          {siteConfig.legalName && (
            <div className="flex flex-col sm:flex-row sm:justify-between py-1 border-t border-[var(--line)]">
              <span className="text-[var(--text-faint)] uppercase text-[11px]">Company Legal Name</span>
              <span className="text-[var(--text)] font-semibold">{siteConfig.legalName}</span>
            </div>
          )}
          {siteConfig.registeredAddress && (
            <div className="flex flex-col sm:flex-row sm:justify-between py-1 border-t border-[var(--line)]">
              <span className="text-[var(--text-faint)] uppercase text-[11px]">Registered Address</span>
              <span className="text-[var(--text)] text-right max-w-sm font-sans text-[13px]">
                {siteConfig.registeredAddress}
              </span>
            </div>
          )}
          {siteConfig.phone && (
            <div className="flex flex-col sm:flex-row sm:justify-between py-1 border-t border-[var(--line)]">
              <span className="text-[var(--text-faint)] uppercase text-[11px]">Telephone</span>
              <span className="text-[var(--text)] font-semibold">{siteConfig.phone}</span>
            </div>
          )}
        </div>
      </section>

      {/* 2. Customer Support & Operations */}
      <section id="customer-support" className="scroll-mt-32 space-y-4">
        <h2 className="flex items-baseline gap-2.5 font-sans text-xl font-normal tracking-tight text-[var(--text)] sm:text-2xl">
          <span className="font-mono text-xs uppercase tracking-[0.08em] text-[var(--verified)] tabular-nums">
            §02 //
          </span>
          <span>Customer Support &amp; Technical Operations</span>
        </h2>
        <p className="text-[15px] leading-relaxed text-[var(--text-dim)]">
          Our technical team provides direct integration assistance, helpdesk webhook calibration, and billing support:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[13px] font-mono">
          <div className="p-4 rounded-[8px] bg-[var(--surface)] border border-[var(--line)] space-y-2">
            <div className="flex items-center gap-2 text-[var(--glow)]">
              <Mail className="w-4 h-4" />
              <span className="text-[11px] uppercase tracking-wider text-[var(--text-faint)]">Support Email</span>
            </div>
            <a
              href={`mailto:${siteConfig.supportEmail}`}
              className="block text-[var(--text)] hover:text-white underline underline-offset-4"
            >
              {siteConfig.supportEmail}
            </a>
            <p className="text-[11px] text-[var(--text-faint)] font-sans">
              Expected response: within 4 business hours.
            </p>
          </div>

          <div className="p-4 rounded-[8px] bg-[var(--surface)] border border-[var(--line)] space-y-2">
            <div className="flex items-center gap-2 text-[var(--verified)]">
              <Mail className="w-4 h-4" />
              <span className="text-[11px] uppercase tracking-wider text-[var(--text-faint)]">Billing &amp; Invoices</span>
            </div>
            <a
              href="mailto:billing@aegisdesk.ai"
              className="block text-[var(--text)] hover:text-white underline underline-offset-4"
            >
              billing@aegisdesk.ai
            </a>
            <p className="text-[11px] text-[var(--text-faint)] font-sans">
              For invoice receipts, wire transfers, and refunds.
            </p>
          </div>

          {siteConfig.phone && (
            <div className="p-4 rounded-[8px] bg-[var(--surface)] border border-[var(--line)] space-y-2">
              <div className="flex items-center gap-2 text-[var(--warn)]">
                <Phone className="w-4 h-4" />
                <span className="text-[11px] uppercase tracking-wider text-[var(--text-faint)]">Phone Support</span>
              </div>
              <a
                href={`tel:${siteConfig.phone}`}
                className="block text-[var(--text)] hover:text-white underline underline-offset-4"
              >
                {siteConfig.phone}
              </a>
              <p className="text-[11px] text-[var(--text-faint)] font-sans">
                Corporate telephone desk.
              </p>
            </div>
          )}

          <div className="p-4 rounded-[8px] bg-[var(--surface)] border border-[var(--line)] space-y-2">
            <div className="flex items-center gap-2 text-[var(--text-dim)]">
              <Clock className="w-4 h-4" />
              <span className="text-[11px] uppercase tracking-wider text-[var(--text-faint)]">Operating Hours</span>
            </div>
            <span className="block text-[var(--text)]">
              Monday – Friday, 09:00 – 18:00 IST
            </span>
            <p className="text-[11px] text-[var(--text-faint)] font-sans">
              Automated system monitoring operates 24/7/365.
            </p>
          </div>
        </div>
      </section>

      {/* 3. Statutory Grievance Redressal Officer */}
      <section id="statutory-officer" className="scroll-mt-32 space-y-4">
        <h2 className="flex items-baseline gap-2.5 font-sans text-xl font-normal tracking-tight text-[var(--text)] sm:text-2xl">
          <span className="font-mono text-xs uppercase tracking-[0.08em] text-[var(--verified)] tabular-nums">
            §03 //
          </span>
          <span>Statutory Grievance Redressal Officer</span>
        </h2>
        <p className="text-[15px] leading-relaxed text-[var(--text-dim)]">
          In accordance with the Information Technology Act, 2000, the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021, and the Digital Personal Data Protection Act, 2023, the details of the designated Grievance Officer are provided below [CONFIRM]:
        </p>

        <div className="p-4 rounded-[10px] bg-[var(--surface)] border border-[var(--line)] text-[13px] font-mono space-y-2">
          <div className="flex justify-between py-1 border-b border-[var(--line)]">
            <span className="text-[var(--text-faint)]">Designated Officer:</span>
            <span className="text-[var(--text)]">Grievance Officer</span>
          </div>
          <div className="flex justify-between py-1 border-b border-[var(--line)]">
            <span className="text-[var(--text-faint)]">Email:</span>
            <a href="mailto:grievance@aegisdesk.ai" className="text-[var(--glow)] hover:underline">
              grievance@aegisdesk.ai
            </a>
          </div>
          {siteConfig.registeredAddress && (
            <div className="flex justify-between py-1 border-b border-[var(--line)]">
              <span className="text-[var(--text-faint)]">Physical Address:</span>
              <span className="text-[var(--text)] text-right">
                {siteConfig.registeredAddress}
              </span>
            </div>
          )}
          <div className="flex justify-between py-1">
            <span className="text-[var(--text-faint)]">Statutory Resolution Window:</span>
            <span className="text-[var(--verified)]">Within 15 calendar days of receipt [CONFIRM]</span>
          </div>
        </div>
      </section>

      {/* 4. Commercial & Pilot Inquiries */}
      <section id="scoping-inquiries" className="scroll-mt-32 space-y-4">
        <h2 className="flex items-baseline gap-2.5 font-sans text-xl font-normal tracking-tight text-[var(--text)] sm:text-2xl">
          <span className="font-mono text-xs uppercase tracking-[0.08em] text-[var(--verified)] tabular-nums">
            §04 //
          </span>
          <span>Commercial &amp; Pilot Scoping Inquiries</span>
        </h2>
        <p className="text-[15px] leading-relaxed text-[var(--text-dim)]">
          To schedule a 15-minute technical scoping call or evaluate your team&apos;s support policies against our Corrective-RAG verification benchmark, book a time directly with our founding engineering team:
        </p>
        <p className="font-mono text-[13px]">
          Direct Booking Link:{" "}
          <a
            href={siteConfig.calLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--glow)] underline underline-offset-4 hover:text-white"
          >
            {siteConfig.calLink.replace(/^https?:\/\//, "")}
          </a>
        </p>
      </section>
    </LegalPage>
  );
}
