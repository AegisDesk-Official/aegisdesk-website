"use client";

import React, { useEffect } from "react";
import Script from "next/script";
import { siteConfig } from "@/lib/site-config";

// Derive the Cal event slug from siteConfig.calLink (e.g. "aegis-desk-le98cq/15min")
export function getCalLinkSlug(): string {
  try {
    const url = new URL(siteConfig.calLink);
    return url.pathname.replace(/^\/+/, "");
  } catch {
    return "aegis-desk-le98cq/15min";
  }
}

export function CalEmbedProvider() {
  useEffect(() => {
    // Initialize Cal.com official embed loader snippet
    if (typeof window === "undefined") return;

    (function (C: any, A: string, L: string) {
      const p = function (a: any, ar: any) {
        a.q.push(ar);
      };
      const d = C.document;
      C.Cal =
        C.Cal ||
        function () {
          const cal = C.Cal;
          const ar = arguments;
          if (!cal.loaded) {
            cal.ns = {};
            cal.q = cal.q || [];
            const script = d.createElement("script");
            script.src = A;
            d.head.appendChild(script);
            cal.loaded = true;
          }
          if (ar[0] === L) {
            const api: any = function () {
              p(api, arguments);
            };
            const namespace = ar[1];
            api.q = api.q || [];
            if (typeof namespace === "string") {
              cal.ns[namespace] = cal.ns[namespace] || api;
              p(cal.ns[namespace], ar);
              p(cal, ["initNamespace", namespace]);
            } else p(cal, ar);
            return;
          }
          p(cal, ar);
        };
    })(window, "https://app.cal.com/embed/embed.js", "init");

    const Cal = (window as any).Cal;
    if (Cal) {
      Cal("init", { origin: "https://cal.com" });
      Cal("init", "15min", { origin: "https://cal.com" });

      if (Cal.ns && Cal.ns["15min"]) {
        Cal.ns["15min"]("ui", {
          styles: { branding: { brandColor: "#0A433A" } },
          hideEventTypeDetails: false,
          layout: "month_view",
          theme: "dark",
        });
        Cal.ns["15min"]("preload", { calLink: getCalLinkSlug() });
      }

      Cal("ui", {
        styles: { branding: { brandColor: "#0A433A" } },
        hideEventTypeDetails: false,
        layout: "month_view",
        theme: "dark",
      });
      Cal("preload", { calLink: getCalLinkSlug() });
    }

    const handleDocumentClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest("[data-cal-link]");
      if (!target) return;
      const calLink = target.getAttribute("data-cal-link") || getCalLinkSlug();
      const namespace = target.getAttribute("data-cal-namespace");
      const CalFn = (window as any).Cal;
      if (CalFn) {
        e.preventDefault();
        if (namespace && CalFn.ns && CalFn.ns[namespace]) {
          CalFn.ns[namespace]("modal", {
            calLink,
            config: { layout: "month_view", theme: "dark" },
          });
        } else {
          CalFn("modal", {
            calLink,
            config: { layout: "month_view", theme: "dark" },
          });
        }
      }
    };

    document.addEventListener("click", handleDocumentClick);
    return () => {
      document.removeEventListener("click", handleDocumentClick);
    };
  }, []);

  return null;
}

export default CalEmbedProvider;
