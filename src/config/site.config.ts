/**
 * Site Configuration Source of Truth
 * ROUND 3 RULES:
 * - Company details come only from src/config/site.config.ts.
 * - Never invent a company name, address, registration or certification.
 * - If a value is null, leave that line out.
 */

export interface SiteConfig {
  brandName: string;
  legalName: string | null;
  registeredAddress: string | null;
  phone: string | null;
  supportEmail: string;
  calLink: string;
  siteUrl: string;
  ownerLoginEmail: string | null;
  currencies: ("USD" | "INR")[];
  razorpayMode: "test" | "live";
  setupPriceLabel: string;
  monthlyServiceLabel: string;
  integrations: readonly string[];
  turnstileSiteKey: string;
}

export const siteConfig: SiteConfig = {
  brandName: "AegisDesk",
  legalName: null,
  registeredAddress: null,
  phone: null,
  supportEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || "hello@aegisdesk.ai",
  calLink: process.env.NEXT_PUBLIC_CAL_LINK?.trim() || "https://cal.com/aegis-desk-le98cq/15min",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000",
  ownerLoginEmail: null,
  currencies: ["USD", "INR"],
  razorpayMode: "test",
  setupPriceLabel: "Starting at $2,500",
  monthlyServiceLabel: "Starting at $1,000 / month",
  integrations: [
    "Zendesk Enterprise",
    "Gorgias Commerce",
    "Shopify Plus",
    "Custom webhook / REST API",
  ],
  turnstileSiteKey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() || "",
};

export default siteConfig;
