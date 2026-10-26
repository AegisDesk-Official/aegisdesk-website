'use client';

import React, { Fragment, useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Layers, RefreshCw, ShieldCheck, ShoppingCart, Webhook } from "lucide-react";
import { copy } from "@/lib/site-copy";
import { siteConfig } from "@/lib/site-config";
import { SectionHeading } from "./section-heading";

gsap.registerPlugin(useGSAP);

const CORE_NODE = {
  name: "AegisDesk Private RAG Core",
  tags: ["Source-Cited Drafts", "Bi-Directional Sync", "Isolated Client Data"],
} as const;

const NODE_HEIGHT = 64;
const NODE_GAP = 16;
const VIEW_WIDTH = 220;
const LANE_OFFSET = 3;

function curve(x1: number, y1: number, x2: number, y2: number) {
  const mid = VIEW_WIDTH / 2;
  return `M ${x1} ${y1} C ${mid} ${y1}, ${mid} ${y2}, ${x2} ${y2}`;
}

function getIcon(name: string) {
  if (/shopify/i.test(name)) return ShoppingCart;
  if (/gorgias/i.test(name)) return RefreshCw;
  if (/webhook|api/i.test(name)) return Webhook;
  return Layers;
}

export function Integrations() {
  const { integrations } = copy;
  const containerRef = useRef<HTMLElement>(null);
  const names: readonly string[] = siteConfig.integrations;
  const height = names.length * NODE_HEIGHT + (names.length - 1) * NODE_GAP;
  const center = height / 2;

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const pulses = gsap.utils.toArray<SVGPathElement>(".gsap-data-packet");
      pulses.forEach((pkt, idx) => {
        gsap.fromTo(
          pkt,
          { strokeDashoffset: 320 },
          {
            strokeDashoffset: 0,
            duration: 2.2,
            repeat: -1,
            ease: "power1.inOut",
            delay: idx * 0.35,
          }
        );
      });
    },
    { scope: containerRef }
  );

  if (names.length === 0) return null;

  return (
    <section
      id="integrations"
      ref={containerRef}
      aria-labelledby="integrations-title"
      className="border-t border-white/[0.06] bg-[#0B0F0D] py-24"
    >
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <SectionHeading
          id="integrations-title"
          eyebrow="Helpdesk & Commerce Sync"
          title={integrations.title}
          intro={integrations.note}
        />

        <div className="relative isolate mt-12 overflow-hidden rounded-[36px] border border-white/10 bg-[#121815] p-6 shadow-2xl sm:p-10 lg:p-14">
          <div className="grid items-center md:grid-cols-[16rem_minmax(5rem,1fr)_21rem] lg:grid-cols-[18rem_minmax(7rem,1fr)_24rem]">
            {/* Left Source Nodes */}
            <ul aria-label="Supported integrations" className="flex flex-col" style={{ gap: NODE_GAP }}>
              {names.map((name) => {
                const Icon = getIcon(name);
                return (
                  <li
                    key={name}
                    style={{ height: NODE_HEIGHT }}
                    className="relative flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/40 px-4"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        aria-hidden="true"
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-emerald-400/25 bg-emerald-500/10 text-emerald-300"
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="truncate text-sm font-normal text-white">{name}</span>
                    </div>
                    <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-400" />
                  </li>
                );
              })}
            </ul>

            {/* Desktop SVG Traveling Data Packets */}
            <div className="hidden md:block" style={{ height }} aria-hidden="true">
              <svg
                className="h-full w-full overflow-visible"
                viewBox={`0 0 ${VIEW_WIDTH} ${height}`}
                preserveAspectRatio="none"
                fill="none"
              >
                {names.map((name, index) => {
                  const y = index * (NODE_HEIGHT + NODE_GAP) + NODE_HEIGHT / 2;
                  const inPath = curve(0, y - LANE_OFFSET, VIEW_WIDTH, center - LANE_OFFSET);
                  const outPath = curve(VIEW_WIDTH, center + LANE_OFFSET, 0, y + LANE_OFFSET);
                  return (
                    <g key={name}>
                      <path d={inPath} stroke="rgba(255,255,255,0.08)" strokeWidth={1.5} />
                      <path d={outPath} stroke="rgba(255,255,255,0.08)" strokeWidth={1.5} />
                      <path
                        className="gsap-data-packet"
                        d={inPath}
                        stroke="#86efac"
                        strokeWidth={2.2}
                        strokeDasharray="36 284"
                        strokeDashoffset={320}
                      />
                      <path
                        className="gsap-data-packet"
                        d={outPath}
                        stroke="#F2F3EF"
                        strokeWidth={2.2}
                        strokeDasharray="36 284"
                        strokeDashoffset={320}
                      />
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Mobile Vertical Pipeline Connector */}
            <div className="flex justify-center py-5 md:hidden" aria-hidden="true">
              <svg width="28" height="64" viewBox="0 0 28 64" fill="none">
                <path d="M10 0 V64" stroke="rgba(134,239,172,0.45)" strokeWidth="2" strokeDasharray="4 4" />
                <path d="M18 64 V0" stroke="rgba(242,243,239,0.45)" strokeWidth="2" strokeDasharray="4 4" />
              </svg>
            </div>

            {/* Right Central RAG Core (Sylva Tactile Warm Ivory Card) */}
            <div className="sylva-ivory-card p-6 sm:p-7">
              <div className="flex items-center gap-4">
                <span
                  aria-hidden="true"
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#161E19] text-emerald-300"
                >
                  <ShieldCheck className="h-6 w-6" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-[0.08em] text-[#6E746B]">
                    Private Knowledge Engine
                  </p>
                  <h3 className="font-display text-lg font-normal tracking-tight text-[#1C201B]">
                    {CORE_NODE.name}
                  </h3>
                </div>
              </div>
              <p className="mt-5 border-t border-[#DCDFD6] pt-4 text-xs font-medium leading-relaxed text-[#4A5048]">
                {CORE_NODE.tags.map((tag, index) => (
                  <Fragment key={tag}>
                    {index > 0 && (
                      <span aria-hidden="true" className="mx-2 text-[#6E746B]">
                        •
                      </span>
                    )}
                    {tag}
                  </Fragment>
                ))}
              </p>
            </div>
          </div>

          <ul
            aria-hidden="true"
            className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-xs font-light text-white/60"
          >
            <li className="flex items-center gap-2.5">
              <span className="h-2 w-2 rounded-full bg-emerald-300" />
              Inbound Customer Question &amp; Order Context
            </li>
            <li className="flex items-center gap-2.5">
              <span className="h-2 w-2 rounded-full bg-[#F2F3EF]" />
              Source-Cited Drafts &amp; 1-Click Agent Approvals
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}

export default Integrations;
