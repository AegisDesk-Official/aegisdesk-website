'use client';

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  id?: string;
  title: string;
  intro?: string;
  eyebrow?: string;
  align?: "left" | "center";
  as?: "h2" | "h3";
  className?: string;
  children?: ReactNode;
}

function formatEyebrow(raw: string): string {
  return raw.replace(/_/g, " ");
}

export function SectionHeading({
  id,
  title,
  intro,
  eyebrow,
  align = "left",
  as: Tag = "h2",
  className,
  children,
}: SectionHeadingProps) {
  const centered = align === "center";

  return (
    <div className={cn("max-w-2xl", centered && "mx-auto text-center", className)}>
      {eyebrow && (
        <p
          className={cn(
            "mb-3.5 inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-3.5 py-1 text-xs font-light tracking-[0.06em] text-emerald-300/90 capitalize",
            centered && "mx-auto justify-center"
          )}
        >
          <span
            aria-hidden="true"
            className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-300"
          />
          {formatEyebrow(eyebrow)}
        </p>
      )}
      <Tag
        id={id}
        className="font-display text-[clamp(2rem,3vw,3rem)] font-light leading-[1.08] tracking-[-0.02em] text-balance text-[#F5F2EB]"
      >
        {title}
      </Tag>
      {intro && (
        <p
          className={cn(
            "mt-4 max-w-[60ch] text-base font-light leading-relaxed text-pretty text-white/65 sm:text-[17px]",
            centered && "mx-auto"
          )}
        >
          {intro}
        </p>
      )}
      {children && <div className="mt-6">{children}</div>}
    </div>
  );
}

export default SectionHeading;
