import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site-config";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const siteUrl = siteConfig.siteUrl.replace(/\/$/, "");

  const routes: Array<{ path: string; priority: number; changeFrequency: "daily" | "weekly" | "monthly" }> = [
    { path: "", priority: 1.0, changeFrequency: "daily" },
    { path: "/pricing", priority: 0.9, changeFrequency: "weekly" },
    { path: "/security", priority: 0.9, changeFrequency: "weekly" },
    { path: "/status", priority: 0.8, changeFrequency: "daily" },
    { path: "/privacy", priority: 0.7, changeFrequency: "monthly" },
    { path: "/terms", priority: 0.7, changeFrequency: "monthly" },
    { path: "/dpa", priority: 0.7, changeFrequency: "monthly" },
    { path: "/contact", priority: 0.7, changeFrequency: "monthly" },
    { path: "/about", priority: 0.6, changeFrequency: "monthly" },
    { path: "/cancellation-refunds", priority: 0.5, changeFrequency: "monthly" },
    { path: "/shipping-delivery", priority: 0.5, changeFrequency: "monthly" },
  ];

  return routes.map((r) => ({
    url: `${siteUrl}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));
}
