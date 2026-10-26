/**
 * Single source of truth for AegisDesk pricing, tier calculation, and ROI quotation.
 * ROUND 3 RULES:
 * - A number may appear only if it is (a) a price or term from src/lib/pricing,
 *   (b) computed from what the visitor typed, (c) a fact about how the product is built,
 *   or (d) real data from the database.
 * - This module is the only place pricing configuration is defined.
 */

export interface PricingConfig {
  baseSetup: number;
  baseRetainer: number;
  includedTickets: number;
  tierSize: number;
  setupPerTier: number;
  retainerPerTier: number;
}

export const pricingConfig: PricingConfig = {
  baseSetup: 2500,
  baseRetainer: 1000,
  includedTickets: 1500,
  tierSize: 1000,
  setupPerTier: 250,
  retainerPerTier: 150,
};

export interface QuoteInput {
  tickets: number;
  costPerTicket: number;
  automationPct: number;
}

export interface QuoteResult {
  tickets: number;
  costPerTicket: number;
  automationPct: number;
  tiers: number;
  setupFee: number;
  monthlyRetainer: number;
  currentMonthlyCost: number;
  grossMonthlySavings: number;
  netMonthlyRoi: number;
  annualSavings: number;
  paybackMonths: number | null;
}

/**
 * Pure calculation function for setup fees, retainers, and customer ROI.
 * tiers = max(0, ceil((tickets - includedTickets) / tierSize))
 * setupFee = baseSetup + tiers * setupPerTier
 * monthlyRetainer = baseRetainer + tiers * retainerPerTier
 * currentMonthlyCost = tickets * costPerTicket
 * grossMonthlySavings = currentMonthlyCost * automationPct / 100
 * netMonthlyRoi = grossMonthlySavings - monthlyRetainer
 * annualSavings = netMonthlyRoi * 12
 * paybackMonths = netMonthlyRoi > 0 ? setupFee / netMonthlyRoi : null
 */
export function quote(
  { tickets, costPerTicket, automationPct }: QuoteInput,
  config: PricingConfig = pricingConfig
): QuoteResult {
  const safeTickets = Number.isFinite(tickets) ? Math.max(0, tickets) : 0;
  const safeCost = Number.isFinite(costPerTicket) ? Math.max(0, costPerTicket) : 0;
  const safePct = Number.isFinite(automationPct)
    ? Math.max(0, Math.min(100, automationPct))
    : 0;
  const tiers = Math.max(
    0,
    Math.ceil((safeTickets - config.includedTickets) / config.tierSize)
  );
  const setupFee = config.baseSetup + tiers * config.setupPerTier;
  const monthlyRetainer = config.baseRetainer + tiers * config.retainerPerTier;
  const currentMonthlyCost = safeTickets * safeCost;
  const grossMonthlySavings = (currentMonthlyCost * safePct) / 100;
  const netMonthlyRoi = grossMonthlySavings - monthlyRetainer;
  const annualSavings = netMonthlyRoi * 12;
  const paybackMonths =
    netMonthlyRoi > 0 ? setupFee / netMonthlyRoi : null;

  return {
    tickets: safeTickets,
    costPerTicket: safeCost,
    automationPct: safePct,
    tiers,
    setupFee,
    monthlyRetainer,
    currentMonthlyCost,
    grossMonthlySavings,
    netMonthlyRoi,
    annualSavings,
    paybackMonths,
  };
}

export default quote;
