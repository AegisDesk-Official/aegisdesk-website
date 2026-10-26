'use client';

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Menu, X, ArrowUpRight } from "lucide-react";
import { siteConfig } from "@/lib/site-config";
import { LogoLockup } from "@/components/brand/logo";

export interface NavItem {
  id: string;
  label: string;
  href: string;
}

// Nav links in sentence case per prompt:
// "Buttons and nav links: Geist 15px, weight 500, sentence case, no monospace capitals. Monospace stays for small labels only."
const NAV_ITEMS: NavItem[] = [
  { id: "overview", label: "Overview", href: "/#main" },
  { id: "workbench", label: "Workbench", href: "/#workbench" },
  { id: "safeguards", label: "Safeguards", href: "/#safeguards" },
  { id: "shadow-validation", label: "Shadow Validation", href: "/#shadow-validation" },
  { id: "pricing", label: "Pricing & ROI", href: "/#pricing" },
];

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  // Lock background scroll when mobile full-screen sheet is open
  useEffect(() => {
    if (menuOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [menuOpen]);

  // Handle Escape key to close mobile menu sheet
  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40 pointer-events-none pt-4 sm:pt-5">
        <div className="mx-auto flex w-full max-w-[1200px] items-center justify-center px-4 sm:px-6 md:px-12">
          {/* Floating bar that never wraps at any viewport width */}
          <nav
            aria-label="Primary"
            className="pointer-events-auto flex w-full max-w-[1040px] items-center justify-between gap-3 sm:gap-6 rounded-[16px] border border-[var(--line)] bg-[var(--surface)]/90 px-4 py-2 sm:px-5 sm:py-2.5 shadow-[0_12px_32px_rgba(0,0,0,0.35)] backdrop-blur-md transition-colors duration-150"
          >
            {/* Logo Lockup in cream (min height 24px per DESIGN.md) */}
            <Link
              href="/"
              aria-label="AegisDesk — home"
              className="flex items-center text-[var(--paper)] transition-opacity duration-150 hover:opacity-90 shrink-0"
            >
              <LogoLockup className="h-6 w-auto text-[var(--paper)]" />
            </Link>

            {/* Desktop Navigation Links (900px+): Geist 15px, weight 500, sentence case */}
            <div className="hidden min-[900px]:flex items-center gap-6 shrink-0">
              <div className="flex items-center gap-6">
                {NAV_ITEMS.map((item) => (
                  <Link
                    key={item.id}
                    href={item.href}
                    className="whitespace-nowrap font-sans text-[15px] font-medium text-[var(--text-dim)] transition-colors duration-150 hover:text-[var(--text)]"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>

              {/* Dashboard button: Geist 15px, weight 500, sentence case, paper background, paper-ink text, 10px radius */}
              <Link
                href="/login"
                className="whitespace-nowrap rounded-[10px] bg-[var(--paper)] px-4 py-2 font-sans text-[15px] font-medium text-[var(--paper-ink)] shadow-[0_2px_8px_rgba(0,0,0,0.12)] transition-opacity duration-150 hover:opacity-90"
              >
                Dashboard
              </Link>
            </div>

            {/* Mobile / Tablet Menu Trigger (under 900px) */}
            <div className="flex min-[900px]:hidden items-center shrink-0">
              <button
                ref={menuButtonRef}
                type="button"
                onClick={() => setMenuOpen(true)}
                aria-label="Open menu"
                aria-expanded={menuOpen}
                aria-controls="mobile-menu-sheet"
                className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] border border-[var(--line)] bg-[var(--surface-2)] text-[var(--text)] transition-colors duration-150 hover:border-[var(--line-strong)] hover:text-white"
              >
                <Menu className="h-4 w-4" />
              </button>
            </div>
          </nav>
        </div>
      </header>

      {/* Under 900px: Simple full-screen sheet per DESIGN.md */}
      {menuOpen && (
        <div
          id="mobile-menu-sheet"
          role="dialog"
          aria-modal="true"
          aria-label="Site Navigation"
          className="fixed inset-0 z-50 flex flex-col justify-between bg-[var(--canvas)] p-6 sm:p-10 pointer-events-auto overflow-y-auto animate-in fade-in duration-200"
        >
          {/* Top Bar inside sheet */}
          <div className="flex items-center justify-between pb-6 border-b border-[var(--line)]">
            <Link
              href="/"
              onClick={() => setMenuOpen(false)}
              aria-label="AegisDesk — home"
              className="flex items-center text-[var(--paper)]"
            >
              <LogoLockup className="h-6 w-auto text-[var(--paper)]" />
            </Link>

            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              aria-label="Close menu"
              className="inline-flex h-10 w-10 items-center justify-center rounded-[10px] border border-[var(--line)] bg-[var(--surface)] text-[var(--text)] transition-colors hover:border-[var(--line-strong)] hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation Links list: sentence case */}
          <div className="py-10 flex-1 flex flex-col justify-center">
            <nav className="flex flex-col space-y-6">
              {NAV_ITEMS.map((item, idx) => (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="group flex items-baseline justify-between border-b border-[var(--line)] pb-4 text-2xl font-light tracking-tight text-[var(--text)] transition-colors duration-150 hover:text-[var(--paper)]"
                >
                  <span className="flex items-baseline gap-4">
                    <span className="text-xs font-mono text-[var(--text-faint)]">
                      0{idx + 1}
                    </span>
                    <span className="font-sans font-normal text-xl">{item.label}</span>
                  </span>
                  <ArrowUpRight className="h-4 w-4 text-[var(--text-faint)] transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[var(--text)]" />
                </Link>
              ))}
            </nav>
          </div>

          {/* Bottom Action Footer inside sheet */}
          <div className="pt-6 border-t border-[var(--line)] space-y-4">
            <Link
              href="/login"
              onClick={() => setMenuOpen(false)}
              className="flex w-full items-center justify-center rounded-[10px] bg-[var(--paper)] py-3.5 text-center font-sans text-[15px] font-medium text-[var(--paper-ink)] transition-opacity duration-150 hover:opacity-90"
            >
              Dashboard
            </Link>
            <div className="flex items-center justify-between text-xs font-mono text-[var(--text-faint)] uppercase tracking-[0.08em]">
              <span>14-Day Shadow Validation</span>
              <span>$2,500 setup + $1,000/mo</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export const SylvaNavbar = Navbar;
export default Navbar;
