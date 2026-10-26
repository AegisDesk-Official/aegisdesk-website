import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site-config";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = siteConfig.siteUrl.replace(/\/$/, "");

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/dashboard",
          "/dashboard/*",
          "/auth",
          "/auth/*",
          "/api",
          "/api/*",
          "/operator",
          "/operator/*",
          "/private",
        ],
      },
      // Generative AI Search & Citation Bots (GEO)
      {
        userAgent: [
          "OAI-SearchBot",
          "ChatGPT-User",
          "PerplexityBot",
          "ClaudeBot",
          "Applebot-Extended",
          "Google-Extended",
        ],
        allow: ["/", "/pricing", "/security", "/privacy", "/terms", "/dpa", "/status", "/about", "/contact"],
        disallow: ["/dashboard/*", "/auth/*", "/api/*", "/operator/*"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
