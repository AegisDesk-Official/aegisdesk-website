'use client';

import React, { useId, useRef, useState, type KeyboardEvent } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { copy } from "@/lib/site-copy";
import { Container } from "@/components/ui/container";
import { Label } from "@/components/ui/label";

const stepNumFor = (index: number) => String(index + 1).padStart(2, "0");

export function Faq() {
  const { faq } = copy;
  const baseId = useId();
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const triggers = useRef<Array<HTMLButtonElement | null>>([]);

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const last = faq.items.length - 1;
    let next = -1;
    if (event.key === "ArrowDown") next = index === last ? 0 : index + 1;
    else if (event.key === "ArrowUp") next = index === 0 ? last : index - 1;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = last;
    if (next < 0) return;
    event.preventDefault();
    triggers.current[next]?.focus();
  };

  return (
    <section
      id="faq"
      aria-labelledby="faq-heading"
      className="relative w-full border-t border-[var(--line)] bg-[var(--canvas)] py-[88px] lg:py-[140px]"
    >
      <Container>
        {/* Section Header */}
        <div className="mx-auto max-w-[760px] text-center space-y-4 flex flex-col items-center">
          <Label>06 // FREQUENTLY ASKED QUESTIONS</Label>
          <h2
            id="faq-heading"
            className="font-sans text-[36px] font-light leading-[1.05] tracking-[-0.03em] text-[var(--text)] sm:text-[44px] md:text-[52px]"
          >
            {faq.title}
          </h2>
          <p className="mx-auto max-w-[62ch] text-[17px] leading-[1.6] text-[var(--text-dim)]">
            {faq.intro}
          </p>
        </div>

        {/* Accordion Container (Centered, one item open at a time, smooth height animation) */}
        <div className="mt-14 mx-auto max-w-4xl space-y-3.5">
          {faq.items.map((item, index) => {
            const isOpen = openIndex === index;
            const triggerId = `${baseId}-trigger-${index}`;
            const panelId = `${baseId}-panel-${index}`;

            return (
              <div
                key={item.q}
                className={cn(
                  "overflow-hidden rounded-[16px] border transition-colors duration-150",
                  isOpen
                    ? "border-[var(--line-strong)] bg-[var(--surface-2)]"
                    : "border-[var(--line)] bg-[var(--surface)] hover:border-[var(--line-strong)]"
                )}
              >
                <h3>
                  <button
                    type="button"
                    id={triggerId}
                    ref={(node) => {
                      triggers.current[index] = node;
                    }}
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                    onKeyDown={(event) => onKeyDown(event, index)}
                    className="flex min-h-[64px] w-full items-center justify-between gap-4 p-5 sm:p-6 text-left focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--line-strong)]"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <span className="font-mono text-[12px] uppercase text-[var(--text-faint)] tabular-nums shrink-0">
                        {stepNumFor(index)}
                      </span>
                      <span className="font-sans text-[16px] sm:text-[17px] font-normal leading-snug tracking-[-0.015em] text-[var(--text)]">
                        {item.q}
                      </span>
                    </div>

                    {/* Geometric Plus/Close Icon (No circle, clean rotation) */}
                    <span className="shrink-0 text-[var(--text-dim)]">
                      <Plus
                        className={cn(
                          "h-4 w-4 transition-transform duration-200",
                          isOpen ? "rotate-45 text-[var(--text)]" : "rotate-0"
                        )}
                      />
                    </span>
                  </button>
                </h3>

                {/* Smooth Height Animated Region via CSS Grid 0fr -> 1fr */}
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={triggerId}
                  className={cn(
                    "grid transition-[grid-template-rows,opacity] duration-200 ease-out",
                    isOpen
                      ? "grid-rows-[1fr] opacity-100"
                      : "grid-rows-[0fr] opacity-0"
                  )}
                >
                  <div className="overflow-hidden">
                    <div className="px-5 pb-6 pt-0 sm:px-6 sm:pl-[3.25rem]">
                      <p className="max-w-[62ch] text-[15px] font-light leading-[1.65] text-[var(--text-dim)]">
                        {item.a}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}

export default Faq;
