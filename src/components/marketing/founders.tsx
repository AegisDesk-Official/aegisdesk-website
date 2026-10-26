'use client';

import React from 'react';
import { ClipboardCheck, FileSearch, ShieldCheck, type LucideIcon } from 'lucide-react';
import { copy } from '@/lib/site-copy';
import { siteConfig } from '@/lib/site-config';
import { SectionHeading } from './section-heading';

const TEAM_NAME = 'Dedicated AI Retrieval, Security & Support Operations Team';

const DISCIPLINES: ReadonlyArray<{
  badge: string;
  icon: LucideIcon;
  title: string;
  body: string;
}> = [
  {
    badge: 'Grounded Retrieval',
    icon: FileSearch,
    title: 'Knowledge & RAG Architecture',
    body: 'Designs how your policy documents, help articles, and past tickets are indexed, searched, and verified so every answer cites its exact source.',
  },
  {
    badge: 'Tenant Privacy',
    icon: ShieldCheck,
    title: 'Security & Data Isolation',
    body: 'Maintains strict workspace isolation so your documents, customer conversations, and audit logs remain private and never train public models.',
  },
  {
    badge: 'Shadow Calibration',
    icon: ClipboardCheck,
    title: 'Support Operations & Tuning',
    body: 'Leads your 14-day Shadow Validation rollout alongside your agents, reviews escalated tickets every week, and closes gaps in your knowledge base.',
  },
];

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

export function Founders() {
  const { founders } = siteConfig;
  const slackLine = copy.pilot.included.find((line) => /slack/i.test(line));

  return (
    <section
      id="about"
      aria-labelledby="about-title"
      className="relative border-t border-white/[0.06] bg-[#070908] py-24 sm:py-28"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          id="about-title"
          eyebrow="Managed By Specialists"
          title={copy.founders.title}
          intro="You work directly with the engineers and support specialists who configure your workspace, review your weekly quality reports, and tune your knowledge base."
        />

        {founders.length > 0 ? (
          <ul className="mt-12 grid gap-6 md:grid-cols-2">
            {founders.map((founder) => (
              <li
                key={founder.name}
                className="flex flex-col rounded-[30px] border border-white/[0.08] bg-[#0c100d]/90 p-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
              >
                {founder.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={founder.photo}
                    alt={founder.name}
                    width={64}
                    height={64}
                    className="h-16 w-16 shrink-0 rounded-2xl object-cover ring-1 ring-white/10"
                  />
                ) : (
                  <div
                    aria-hidden="true"
                    className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-lg font-medium tracking-tight text-[#EFF2EC]"
                  >
                    {initials(founder.name)}
                  </div>
                )}

                <h3 className="mt-6 text-xl font-normal tracking-[-0.02em] text-[#EFF2EC]">
                  {founder.name}
                </h3>

                <p className="mt-2.5">
                  <span className="inline-block rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-xs font-normal text-emerald-200">
                    {founder.role}
                  </span>
                </p>

                <p className="mt-6 max-w-[60ch] border-t border-white/[0.08] pt-6 text-[14.5px] font-light leading-relaxed text-[#EFF2EC]/75">
                  {founder.bio}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-12">
            {/* Team banner */}
            <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 rounded-[28px] border border-white/[0.08] bg-[#0c100d]/90 px-6 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
              <p className="flex items-center gap-3.5 text-base font-light tracking-[-0.015em] text-[#EFF2EC] sm:text-lg">
                <span
                  aria-hidden="true"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-400/10"
                >
                  <ShieldCheck className="h-5 w-5 text-emerald-300" />
                </span>
                {TEAM_NAME}
              </p>
              {slackLine && (
                <p className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs font-light text-[#EFF2EC]/80">
                  {slackLine}
                </p>
              )}
            </div>

            <ul className="mt-6 grid gap-6 md:grid-cols-3">
              {DISCIPLINES.map(({ badge, icon: Icon, title, body }) => (
                <li
                  key={badge}
                  className="flex flex-col rounded-[30px] border border-white/[0.08] bg-[#0c100d]/90 p-7 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition-colors hover:border-white/15"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span
                      aria-hidden="true"
                      className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-emerald-300"
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] font-light text-[#EFF2EC]/65">
                      {badge}
                    </span>
                  </div>
                  <h3 className="mt-6 text-lg font-normal tracking-[-0.02em] text-[#EFF2EC]">
                    {title}
                  </h3>
                  <p className="mt-2.5 text-[14px] font-light leading-relaxed text-[#EFF2EC]/68">
                    {body}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}

export default Founders;
