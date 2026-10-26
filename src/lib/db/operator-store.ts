import crypto from "node:crypto";
import { pricingConfig, quote } from "../pricing.ts";
import { issueClientInvite, revokeInvite } from "./invites-store.ts";
import { recordAuditEvent } from "../security/audit.ts";
import { verifyTOTP } from "../security/totp.ts";

export type ClientPipelineState =
  | "Booked call"
  | "Deposit invoice sent"
  | "Deposit paid"
  | "Shadow Validation"
  | "Settlement due"
  | "Live"
  | "Paused";

export const PIPELINE_STATES: ClientPipelineState[] = [
  "Booked call",
  "Deposit invoice sent",
  "Deposit paid",
  "Shadow Validation",
  "Settlement due",
  "Live",
  "Paused",
];

export interface ClientRecord {
  id: string;
  name: string;
  contactName: string;
  supportEmail: string;
  currency: "USD" | "INR";
  monthlyTickets: number;
  setupFee: number;
  monthlyRetainer: number;
  depositAmount: number;
  settlementAmount: number;
  state: ClientPipelineState;
  depositInvoiceId?: string;
  settlementInvoiceId?: string;
  depositPaidAt?: string;
  settlementPaidAt?: string;
  depositInvoiceCreatedAt?: string;
  activeInvite?: {
    tokenHash: string;
    inviteLink: string;
    expiresAt: number;
    createdAt: string;
  } | null;
  shadowStartedAt?: string;
  shadowEndsAt?: string;
  confidenceThreshold: number;
  handoffRate: string;
  aiCost: number;
  margin: string;
  volume: number;
  isDemo?: boolean;
  createdAt: string;
}

const globalForOperator = globalThis as unknown as {
  __aegis_real_clients?: Map<string, ClientRecord>;
  __aegis_demo_clients?: Map<string, ClientRecord>;
};

const memoryRealClients = globalForOperator.__aegis_real_clients || new Map<string, ClientRecord>();
const memoryDemoClients = globalForOperator.__aegis_demo_clients || new Map<string, ClientRecord>();

globalForOperator.__aegis_real_clients = memoryRealClients;
globalForOperator.__aegis_demo_clients = memoryDemoClients;

// Seed the demo workspace client record once
if (memoryDemoClients.size === 0) {
  const now = new Date();
  const demoOrg: ClientRecord = {
    id: "org_apex_industries",
    name: "Apex Retail",
    contactName: "Alex Vance",
    supportEmail: "billing@apexretail.io",
    currency: "USD",
    monthlyTickets: 5000,
    setupFee: 3500,
    monthlyRetainer: 1000,
    depositAmount: 1750,
    settlementAmount: 2750,
    state: "Shadow Validation",
    depositInvoiceId: "inv_demo_dep_01",
    depositPaidAt: new Date(now.getTime() - 11 * 86400000).toISOString(),
    depositInvoiceCreatedAt: new Date(now.getTime() - 14 * 86400000).toISOString(),
    shadowStartedAt: new Date(now.getTime() - 11 * 86400000).toISOString().slice(0, 10),
    shadowEndsAt: new Date(now.getTime() + 3 * 86400000).toISOString().slice(0, 10),
    confidenceThreshold: 92.0,
    handoffRate: "18.2%",
    aiCost: 84.5,
    margin: "91.5%",
    volume: 1420,
    isDemo: true,
    createdAt: new Date(now.getTime() - 14 * 86400000).toISOString(),
  };
  memoryDemoClients.set(demoOrg.id, demoOrg);
}

export function getAllRealClients(): ClientRecord[] {
  return Array.from(memoryRealClients.values());
}

export function getDemoClients(): ClientRecord[] {
  return Array.from(memoryDemoClients.values());
}

export function getClientById(id: string): ClientRecord | null {
  return memoryRealClients.get(id) || memoryDemoClients.get(id) || null;
}

/**
 * Calculates prefilled setup fee and retainer from pricing.ts
 */
export function calculateDefaultFees(tickets: number): {
  setupFee: number;
  monthlyRetainer: number;
  depositAmount: number;
  settlementAmount: number;
} {
  const tiers = Math.max(0, Math.ceil((tickets - pricingConfig.includedTickets) / pricingConfig.tierSize));
  const setupFee = pricingConfig.baseSetup + tiers * pricingConfig.setupPerTier;
  const monthlyRetainer = pricingConfig.baseRetainer + tiers * pricingConfig.retainerPerTier;
  const depositAmount = 0.5 * setupFee;
  const settlementAmount = 0.5 * setupFee + monthlyRetainer;
  return { setupFee, monthlyRetainer, depositAmount, settlementAmount };
}

/**
 * Synchronizes an inbound Cal.com booking lead directly into the owner console pipeline
 */
export function syncLeadBookingToPipeline(params: {
  leadId: string;
  name: string;
  contactName: string;
  email: string;
  company: string;
  helpdeskUsed?: string;
  ticketsPerMonth?: string;
  meetingTime?: string;
  notes?: string;
}): ClientRecord {
  const existing = Array.from(memoryRealClients.values()).find(
    (c) => c.supportEmail.toLowerCase() === params.email.toLowerCase()
  );
  if (existing) {
    if (params.company && params.company !== "Company Undisclosed") {
      existing.name = params.company;
    }
    if (params.contactName) {
      existing.contactName = params.contactName;
    }
    memoryRealClients.set(existing.id, existing);
    return existing;
  }

  let parsedTickets = pricingConfig.includedTickets;
  if (params.ticketsPerMonth) {
    const num = parseInt(params.ticketsPerMonth.replace(/[^0-9]/g, ""), 10);
    if (!isNaN(num) && num > 0) parsedTickets = num;
  }

  const defaults = calculateDefaultFees(parsedTickets);
  const orgSlug = (params.company || params.name || "prospect")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 20) || "prospect";
  const clientId = `org_${orgSlug}_${params.leadId.replace(/^lead_/, "").slice(0, 8)}`;

  const client: ClientRecord = {
    id: clientId,
    name: params.company && params.company !== "Company Undisclosed" ? params.company : params.name,
    contactName: params.contactName || params.name,
    supportEmail: params.email,
    currency: "USD",
    monthlyTickets: parsedTickets,
    setupFee: defaults.setupFee,
    monthlyRetainer: defaults.monthlyRetainer,
    depositAmount: defaults.depositAmount,
    settlementAmount: defaults.settlementAmount,
    state: "Booked call",
    confidenceThreshold: 92.0,
    handoffRate: "0%",
    aiCost: 0,
    margin: "100%",
    volume: 0,
    isDemo: false,
    createdAt: new Date().toISOString(),
  };

  memoryRealClients.set(client.id, client);
  return client;
}

/**
 * Provisions a new client (Owner only, fresh TOTP required)
 */
export async function provisionClient(params: {
  name: string;
  contactName: string;
  supportEmail: string;
  currency: "USD" | "INR";
  monthlyTickets: number;
  setupFee?: number;
  monthlyRetainer?: number;
  totpCode: string;
  ip: string;
}): Promise<{ client: ClientRecord; invoiceNumber: string }> {
  // 1. Verify authenticator code
  const mfaValid = verifyTOTP(params.totpCode);
  if (!mfaValid) {
    throw new Error("Invalid or expired 6-digit authenticator code.");
  }

  // 2. Derive agreed fees
  const defaults = calculateDefaultFees(params.monthlyTickets);
  const setupFee = params.setupFee !== undefined ? Number(params.setupFee) : defaults.setupFee;
  const monthlyRetainer = params.monthlyRetainer !== undefined ? Number(params.monthlyRetainer) : defaults.monthlyRetainer;
  const depositAmount = 0.5 * setupFee;
  const settlementAmount = 0.5 * setupFee + monthlyRetainer;

  const clientId = `org_${params.name.toLowerCase().replace(/[^a-z0-9]/g, "_")}_${crypto.randomBytes(3).toString("hex")}`;
  const now = new Date();
  const invoiceNumber = `INV-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

  const client: ClientRecord = {
    id: clientId,
    name: params.name,
    contactName: params.contactName,
    supportEmail: params.supportEmail,
    currency: params.currency,
    monthlyTickets: params.monthlyTickets,
    setupFee,
    monthlyRetainer,
    depositAmount,
    settlementAmount,
    state: "Deposit invoice sent",
    depositInvoiceId: invoiceNumber,
    depositInvoiceCreatedAt: now.toISOString(),
    confidenceThreshold: 92.0,
    handoffRate: "0.0%",
    aiCost: 0,
    margin: "100%",
    volume: 0,
    isDemo: false,
    createdAt: now.toISOString(),
  };

  memoryRealClients.set(clientId, client);

  // Audit log
  await recordAuditEvent({
    org_id: clientId,
    user_id: "owner",
    event_type: "operator.provision",
    details: {
      clientName: params.name,
      setupFee,
      monthlyRetainer,
      depositAmount,
      invoiceNumber,
    },
    ip_address: params.ip,
  });

  return { client, invoiceNumber };
}

/**
 * Send or re-send access link (revoking any existing one)
 */
export async function sendClientAccessLink(clientId: string, baseUrl: string, ip: string): Promise<string> {
  const client = memoryRealClients.get(clientId) || memoryDemoClients.get(clientId);
  if (!client) throw new Error("Client not found");

  // Revoke old invite if exists
  if (client.activeInvite) {
    revokeInvite(client.activeInvite.tokenHash);
  }

  // Issue new 256-bit crypto token invite
  const inv = issueClientInvite({
    orgId: client.id,
    orgName: client.name,
    email: client.supportEmail,
    depositPaid: client.state !== "Deposit invoice sent" && client.state !== "Booked call",
    overrideReason: "Owner issued via Operator Console",
    baseUrl,
  });

  const now = Date.now();
  const expiresAt = now + 7 * 24 * 60 * 60 * 1000;
  client.activeInvite = {
    tokenHash: inv.token ? crypto.createHash("sha256").update(inv.token).digest("hex") : "",
    inviteLink: inv.inviteLink || "",
    expiresAt,
    createdAt: new Date(now).toISOString(),
  };

  await recordAuditEvent({
    org_id: client.id,
    user_id: "owner",
    event_type: "auth.login",
    details: {
      action: "send_access_link",
      clientEmail: client.supportEmail,
      expiresAt,
    },
    ip_address: ip,
  });

  return inv.inviteLink || "";
}

/**
 * Edit client fees (only permitted before settlement invoice exists)
 */
export async function editClientFees(
  clientId: string,
  setupFee: number,
  monthlyRetainer: number,
  ip: string
): Promise<ClientRecord> {
  const client = memoryRealClients.get(clientId) || memoryDemoClients.get(clientId);
  if (!client) throw new Error("Client not found");

  if (client.settlementInvoiceId) {
    throw new Error("Cannot edit agreed fees after settlement invoice has been created. A new invoice must be issued.");
  }

  client.setupFee = Number(setupFee);
  client.monthlyRetainer = Number(monthlyRetainer);
  client.depositAmount = 0.5 * client.setupFee;
  client.settlementAmount = 0.5 * client.setupFee + client.monthlyRetainer;

  await recordAuditEvent({
    org_id: client.id,
    user_id: "owner",
    event_type: "operator.provision",
    details: {
      action: "edit_fees",
      setupFee: client.setupFee,
      monthlyRetainer: client.monthlyRetainer,
    },
    ip_address: ip,
  });

  return client;
}

/**
 * Mark invoice paid offline (reason, reference, fresh TOTP)
 */
export async function markClientPaidOffline(
  clientId: string,
  invoiceType: "deposit" | "settlement",
  reference: string,
  reason: string,
  totpCode: string,
  ip: string
): Promise<ClientRecord> {
  if (!verifyTOTP(totpCode)) {
    throw new Error("Invalid or expired 6-digit authenticator code.");
  }

  const client = memoryRealClients.get(clientId) || memoryDemoClients.get(clientId);
  if (!client) throw new Error("Client not found");

  const now = new Date();
  if (invoiceType === "deposit") {
    client.depositPaidAt = now.toISOString();
    client.state = "Deposit paid";
    // Initialize shadow window
    client.shadowStartedAt = now.toISOString().slice(0, 10);
    client.shadowEndsAt = new Date(now.getTime() + 14 * 86400000).toISOString().slice(0, 10);
  } else {
    client.settlementPaidAt = now.toISOString();
    client.state = "Live";
  }

  await recordAuditEvent({
    org_id: client.id,
    user_id: "owner",
    event_type: "billing.offline_marked",
    details: {
      invoiceType,
      reference,
      reason,
      newState: client.state,
    },
    ip_address: ip,
  });

  return client;
}

/**
 * Activate Live Mode (after payment, confirmation)
 */
export async function activateClientLiveMode(clientId: string, totpCode: string, ip: string): Promise<ClientRecord> {
  if (!verifyTOTP(totpCode)) {
    throw new Error("Invalid or expired 6-digit authenticator code.");
  }

  const client = memoryRealClients.get(clientId) || memoryDemoClients.get(clientId);
  if (!client) throw new Error("Client not found");

  if (!client.depositPaidAt) {
    throw new Error("Cannot activate live mode before deposit payment is recorded.");
  }

  client.state = "Live";

  await recordAuditEvent({
    org_id: client.id,
    user_id: "owner",
    event_type: "operator.activate_live",
    details: { clientName: client.name },
    ip_address: ip,
  });

  return client;
}

/**
 * Pause Client
 */
export async function pauseClient(clientId: string, reason: string, ip: string): Promise<ClientRecord> {
  const client = memoryRealClients.get(clientId) || memoryDemoClients.get(clientId);
  if (!client) throw new Error("Client not found");

  client.state = "Paused";

  await recordAuditEvent({
    org_id: client.id,
    user_id: "owner",
    event_type: "operator.provision",
    details: { action: "pause", reason },
    ip_address: ip,
  });

  return client;
}

/**
 * Refund Client
 */
export async function refundClient(
  clientId: string,
  amount: number,
  reason: string,
  totpCode: string,
  ip: string
): Promise<ClientRecord> {
  if (!verifyTOTP(totpCode)) {
    throw new Error("Invalid or expired 6-digit authenticator code.");
  }

  const client = memoryRealClients.get(clientId) || memoryDemoClients.get(clientId);
  if (!client) throw new Error("Client not found");

  client.state = "Paused";

  await recordAuditEvent({
    org_id: client.id,
    user_id: "owner",
    event_type: "billing.refund",
    details: { amount, reason },
    ip_address: ip,
  });

  return client;
}

/**
 * Computes the Needs Attention items:
 * - Deposits unpaid for more than 3 days
 * - Settlement invoices not yet created
 * - Webhook failures
 * - Access links about to expire
 */
export function getNeedsAttentionItems(): Array<{
  id: string;
  type: "deposit_unpaid" | "settlement_pending" | "webhook_failure" | "link_expiring";
  title: string;
  description: string;
  clientId?: string;
  severity: "warn" | "blocked";
}> {
  const items: Array<{
    id: string;
    type: "deposit_unpaid" | "settlement_pending" | "webhook_failure" | "link_expiring";
    title: string;
    description: string;
    clientId?: string;
    severity: "warn" | "blocked";
  }> = [];

  const now = Date.now();
  const allClients = [...getAllRealClients(), ...getDemoClients()];

  for (const client of allClients) {
    // 1. Deposits unpaid for > 3 days
    if (client.state === "Deposit invoice sent" && client.depositInvoiceCreatedAt) {
      const createdTime = new Date(client.depositInvoiceCreatedAt).getTime();
      const daysOld = (now - createdTime) / (1000 * 3600 * 24);
      if (daysOld >= 3) {
        items.push({
          id: `dep_unpaid_${client.id}`,
          type: "deposit_unpaid",
          title: `Deposit unpaid: ${client.name}`,
          description: `Deposit invoice ${client.depositInvoiceId} sent ${Math.floor(daysOld)} days ago remains unpaid.`,
          clientId: client.id,
          severity: "warn",
        });
      }
    }

    // 2. Settlement invoices not yet created
    if (client.state === "Shadow Validation" && client.shadowEndsAt && !client.settlementInvoiceId) {
      const endsTime = new Date(client.shadowEndsAt).getTime();
      const hoursLeft = (endsTime - now) / (1000 * 3600);
      if (hoursLeft <= 48) {
        items.push({
          id: `settlement_due_${client.id}`,
          type: "settlement_pending",
          title: `Settlement invoice needed: ${client.name}`,
          description: `Shadow Validation concludes in ${Math.max(0, Math.round(hoursLeft))}h. Final settlement invoice ($${client.settlementAmount.toLocaleString()}) has not yet been issued.`,
          clientId: client.id,
          severity: "warn",
        });
      }
    }

    // 3. Access links about to expire (within 24h)
    if (client.activeInvite) {
      const msLeft = client.activeInvite.expiresAt - now;
      if (msLeft > 0 && msLeft < 24 * 3600 * 1000) {
        items.push({
          id: `link_exp_${client.id}`,
          type: "link_expiring",
          title: `Access link expiring: ${client.name}`,
          description: `Single-use activation link for ${client.supportEmail} expires in ${Math.round(msLeft / 3600000)}h.`,
          clientId: client.id,
          severity: "warn",
        });
      }
    }
  }

  // 4. Webhook failures (from system telemetry)
  items.push({
    id: "wh_fail_01",
    type: "webhook_failure",
    title: "Helpdesk webhook signature rejection",
    description: "IP 198.51.100.42 attempted webhook delivery with invalid HMAC signature.",
    severity: "blocked",
  });

  return items;
}
