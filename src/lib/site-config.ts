import { siteConfig as baseSiteConfig } from "@/config/site.config";

export interface Founder {
  name: string;
  role: string;
  bio: string;
  photo?: string;
}

const DEFAULT_CAL_LINK = "https://cal.com/aegis-desk-le98cq/15min";

function resolveCalLink(): string {
  const value = process.env.NEXT_PUBLIC_CAL_LINK?.trim();
  return value && /^https:\/\//i.test(value) ? value : DEFAULT_CAL_LINK;
}

function resolveSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/+$/, "");
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercel) return `https://${vercel}`;
  return "http://localhost:3000";
}

export const siteConfig = {
  ...baseSiteConfig,
  brandName: "AegisDesk",
  legalName: baseSiteConfig.legalName,
  registeredAddress: baseSiteConfig.registeredAddress,
  phone: baseSiteConfig.phone,
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || baseSiteConfig.supportEmail || "hello@aegisdesk.ai",
  siteUrl: resolveSiteUrl(),
  calLink: resolveCalLink(),

  setupPriceLabel: "Starting at $2,500",
  monthlyServiceLabel: "Starting at $1,000 / month",

  integrations: [
    "Zendesk Enterprise",
    "Gorgias Commerce",
    "Shopify Plus",
    "Custom webhook / REST API",
  ],

  founders: [] as Founder[],

  showClientLogin: false,
  clientLoginHref: "/dashboard/login",

  loomUrl: process.env.NEXT_PUBLIC_LOOM_URL?.trim() || "",
  turnstileSiteKey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() || "",

  savingsExample: {
    ticketsPerMonth: 1500,
    costPerTicket: 6,
    shareHandledByAi: 0.5,
    minTickets: 500,
    maxTickets: 25000,
    minCost: 3,
    maxCost: 15,
    minRate: 40,
    maxRate: 70,
  },
} as const;

export type SiteConfig = typeof siteConfig;

export function copyrightLine(year = new Date().getFullYear()): string {
  const { brandName, legalName } = siteConfig;
  return legalName ? `© ${year} ${brandName}, ${legalName}` : `© ${year} ${brandName}`;
}

export function getLoomEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.protocol !== "https:") return null;
    if (u.hostname !== "www.loom.com" && u.hostname !== "loom.com") return null;
    const match = u.pathname.match(/^\/(?:share|embed)\/([a-zA-Z0-9]+)/);
    return match ? `https://www.loom.com/embed/${match[1]}` : null;
  } catch {
    return null;
  }
}

export function formatUsd(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}
