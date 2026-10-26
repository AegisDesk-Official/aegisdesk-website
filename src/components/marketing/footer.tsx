'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, FileText } from 'lucide-react';
import { LogoLockup } from '@/components/brand/logo';
import { siteConfig } from '@/lib/site-config';
import { Container } from '@/components/ui/container';

export function Footer() {
  const currentYear = new Date().getFullYear();

  const linkClass =
    'font-sans text-[13.5px] font-light text-[var(--paper)]/75 transition-colors hover:text-[var(--paper)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--paper)]';
  const headingClass =
    'font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--paper)]/55';

  const productLinks = [
    { href: '/#workbench', label: 'Verification Workbench' },
    { href: '/#safeguards', label: 'Safeguards' },
    { href: '/#shadow-validation', label: '14-Day Shadow Validation' },
    { href: '/#faq', label: 'Frequently Asked Questions' },
    { href: '/login', label: 'Client login' },
  ];

  const commercialLinks = [
    { href: '/pricing', label: 'Pricing & Terms' },
    { href: '/shipping-delivery', label: 'Shipping & Delivery Policy' },
    { href: '/cancellation-refunds', label: 'Cancellation & Refunds' },
    { href: '/api/billing/invoices/sample/pdf', label: 'Sample Tax Invoice (PDF)', external: true },
  ];

  const legalAndCompanyLinks = [
    { href: '/about', label: 'About Us' },
    { href: '/contact', label: 'Contact Directory' },
    { href: '/privacy', label: 'Privacy Policy' },
    { href: '/terms', label: 'Terms of Service' },
    { href: '/dpa', label: 'Data Processing Agreement (DPA)' },
    { href: '/security', label: 'Security & Data Handling' },
    { href: '/status', label: 'System Status' },
  ];

  return (
    <div className="relative w-full bg-[var(--brand)] text-[var(--paper)] overflow-hidden">
      {/* ------------------------------------------------------------------ */}
      {/* FOOTER: Cream lockup, 4-column responsive grid, computed year      */}
      {/* ------------------------------------------------------------------ */}
      <footer id="footer" className="py-14 sm:py-18">
        <Container>
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-12">
            {/* Column 1: Cream Lockup & Corporate Info */}
            <div className="space-y-4">
              <LogoLockup color="cream" className="h-6 w-auto" />

              <p className="max-w-[32ch] text-[13px] font-light leading-relaxed text-[var(--paper)]/75">
                Support answers checked against your company documents. Backed by quoted sources,
                a 14-day Shadow Validation, and hosted Razorpay payments.
              </p>

              {siteConfig.registeredAddress && (
                <div className="pt-1 text-[11px] font-mono text-[var(--paper)]/50 space-y-1">
                  <p>{siteConfig.registeredAddress}</p>
                </div>
              )}

              {/* Automatically Computed Year */}
              <p className="pt-2 font-mono text-[11px] text-[var(--paper)]/50 tabular-nums">
                {siteConfig.legalName
                  ? `© 2026 ${siteConfig.legalName}`
                  : "© 2026 AegisDesk. All rights reserved."}
              </p>
            </div>

            {/* Column 2: Product & Architecture */}
            <nav aria-label="Product navigation" className="space-y-3.5">
              <p className={headingClass}>PRODUCT &amp; PROOF</p>
              <ul className="space-y-2">
                {productLinks.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className={linkClass}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Column 3: Commercial & Delivery */}
            <nav aria-label="Commercial and delivery" className="space-y-3.5">
              <p className={headingClass}>PRICING &amp; DELIVERY</p>
              <ul className="space-y-2">
                {commercialLinks.map((link) => (
                  <li key={link.href}>
                    {link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`${linkClass} inline-flex items-center gap-1`}
                      >
                        <span>{link.label}</span>
                        <FileText className="w-3 h-3 opacity-70" />
                      </a>
                    ) : (
                      <Link href={link.href} className={linkClass}>
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </nav>

            {/* Column 4: Legal & Contact */}
            <nav aria-label="Legal and contact" className="space-y-3.5">
              <p className={headingClass}>LEGAL &amp; CONTACT</p>
              <ul className="space-y-2">
                {legalAndCompanyLinks.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className={linkClass}>
                      {link.label}
                    </Link>
                  </li>
                ))}
                <li className="pt-1">
                  <a
                    href="mailto:support@aegisdesk.ai"
                    className="inline-flex items-center gap-1.5 font-mono text-[11.5px] uppercase tracking-[0.06em] text-[var(--paper)] underline underline-offset-4 hover:opacity-80"
                  >
                    <span>support@aegisdesk.ai</span>
                    <ArrowRight className="h-3 w-3" />
                  </a>
                </li>
              </ul>
            </nav>
          </div>
        </Container>
      </footer>
    </div>
  );
}

export default Footer;
