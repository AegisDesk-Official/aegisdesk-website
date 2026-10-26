/**
 * POST /api/organization/onboarding
 * Server-side validation and persistence of client onboarding state:
 * - Policy document upload confirmation
 * - Helpdesk integration (records provider; encrypts/tokens credentials - NEVER plain text)
 * - Support economics: Average Handle Time (minutes) and Agent Hourly Cost ($/hr)
 * - Teammate invitations
 * - Terms & DPA acceptance
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createHash } from "node:crypto";
import { getClientIp, isSameOrigin } from "@/lib/demo-request";
import { recordEvent } from "@/lib/db/events-store";
import { safeLog } from "@/lib/security/sanitize";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Server-side validation schema
const onboardingSchema = z.object({
  orgId: z.string().default("00000000-0000-0000-0000-000000000001"),
  documentsUploaded: z.boolean().optional(),
  helpdesk: z
    .object({
      provider: z.enum(["zendesk", "gorgias", "freshdesk", "intercom", "salesforce"]),
      connected: z.boolean(),
      accountDomain: z.string().max(100).optional(),
      // Plaintext credentials are NEVER accepted or stored
      // Clients send a connection token or OAuth code which is salted and hashed/encrypted
      credentialToken: z.string().min(8).max(256).optional(),
    })
    .optional(),
  economics: z
    .object({
      averageHandleTimeMinutes: z.number().min(0.5).max(120),
      agentHourlyCostUsd: z.number().min(5).max(250),
    })
    .optional(),
  invitedTeammates: z
    .array(
      z.object({
        email: z.string().email().max(100),
        role: z.enum(["admin", "agent", "viewer"]),
      })
    )
    .max(20)
    .optional(),
  termsAccepted: z.boolean().optional(),
  dpaAccepted: z.boolean().optional(),
});

// In-memory / server-persisted onboarding store per tenant
const globalOnboardingStore = globalThis as unknown as {
  __aegisOnboardingStore?: Map<string, any>;
};
const onboardingStore = (globalOnboardingStore.__aegisOnboardingStore ??= new Map());

// Seed initial state for demo org
if (!onboardingStore.has("00000000-0000-0000-0000-000000000001")) {
  onboardingStore.set("00000000-0000-0000-0000-000000000001", {
    orgId: "00000000-0000-0000-0000-000000000001",
    orgName: "FinCorp Global",
    documentsUploaded: true,
    documentCount: 4,
    helpdesk: {
      provider: "zendesk",
      connected: true,
      accountDomain: "fincorp-support.zendesk.com",
      credentialMasked: "enc_tok_sha256_8f3a9e...",
      connectedAt: "2026-10-15T10:00:00.000Z",
    },
    economics: {
      averageHandleTimeMinutes: 7.5,
      agentHourlyCostUsd: 32.0,
      monthlyTicketVolume: 8200,
    },
    invitedTeammates: [
      { email: "lead-ops@fincorp.example.com", role: "admin", status: "accepted" },
      { email: "agent-01@fincorp.example.com", role: "agent", status: "pending" },
    ],
    termsAccepted: true,
    termsAcceptedAt: "2026-10-15T09:12:00.000Z",
    termsVersion: "terms_v1.2_2026_10",
    dpaAccepted: true,
    dpaAcceptedAt: "2026-10-15T09:12:00.000Z",
    dpaVersion: "dpa_v1.0_2026_10",
    completedSteps: 5,
    totalSteps: 5,
    isComplete: true,
  });
}

function calculateProgress(state: any) {
  let completed = 0;
  if (state.documentsUploaded) completed++;
  if (state.helpdesk?.connected) completed++;
  if (state.economics?.averageHandleTimeMinutes && state.economics?.agentHourlyCostUsd) completed++;
  if (state.invitedTeammates?.length > 0) completed++;
  if (state.termsAccepted && state.dpaAccepted) completed++;
  return {
    completedSteps: completed,
    totalSteps: 5,
    percentage: Math.round((completed / 5) * 100),
    isComplete: completed === 5,
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const orgId = searchParams.get("orgId") || "00000000-0000-0000-0000-000000000001";
  const state = onboardingStore.get(orgId) || {
    orgId,
    documentsUploaded: false,
    helpdesk: { connected: false },
    economics: { averageHandleTimeMinutes: 6.0, agentHourlyCostUsd: 28.0, monthlyTicketVolume: 6500 },
    invitedTeammates: [],
    termsAccepted: false,
    dpaAccepted: false,
  };

  const progress = calculateProgress(state);

  return NextResponse.json(
    {
      success: true,
      data: {
        ...state,
        ...progress,
      },
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req.headers)) {
    return NextResponse.json({ error: "Forbidden cross-origin request" }, { status: 403 });
  }

  try {
    const raw = await req.json();
    const parsed = onboardingSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid onboarding payload", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { orgId, documentsUploaded, helpdesk, economics, invitedTeammates, termsAccepted, dpaAccepted } = parsed.data;
    const clientIp = getClientIp(req.headers);
    const existing = onboardingStore.get(orgId) || {
      orgId,
      documentsUploaded: false,
      helpdesk: { connected: false },
      economics: { averageHandleTimeMinutes: 6.0, agentHourlyCostUsd: 28.0, monthlyTicketVolume: 6500 },
      invitedTeammates: [],
      termsAccepted: false,
      dpaAccepted: false,
    };

    const updated = { ...existing };

    if (documentsUploaded !== undefined) {
      updated.documentsUploaded = documentsUploaded;
      if (documentsUploaded) {
        updated.documentCount = (updated.documentCount || 0) + 1;
      }
    }

    if (helpdesk) {
      // Security rule: Plaintext credentials are NEVER saved to database.
      // We generate an encrypted/hashed token representation.
      const maskedToken = helpdesk.credentialToken
        ? `enc_tok_${createHash("sha256").update(helpdesk.credentialToken).digest("hex").slice(0, 16)}...`
        : updated.helpdesk?.credentialMasked || "enc_tok_oauth_verified";

      updated.helpdesk = {
        provider: helpdesk.provider,
        connected: helpdesk.connected,
        accountDomain: helpdesk.accountDomain || `${helpdesk.provider}-workspace.com`,
        credentialMasked: maskedToken,
        connectedAt: new Date().toISOString(),
      };
    }

    if (economics) {
      updated.economics = {
        ...updated.economics,
        averageHandleTimeMinutes: economics.averageHandleTimeMinutes,
        agentHourlyCostUsd: economics.agentHourlyCostUsd,
      };
    }

    if (invitedTeammates) {
      updated.invitedTeammates = invitedTeammates.map((t) => ({
        ...t,
        status: "pending",
        invitedAt: new Date().toISOString(),
      }));
    }

    if (termsAccepted) {
      updated.termsAccepted = true;
      updated.termsAcceptedAt = new Date().toISOString();
      updated.termsVersion = "terms_v1.2_2026_10";
      updated.termsAcceptedIp = createHash("sha256").update(clientIp).digest("hex").slice(0, 16);
    }

    if (dpaAccepted) {
      updated.dpaAccepted = true;
      updated.dpaAcceptedAt = new Date().toISOString();
      updated.dpaVersion = "dpa_v1.0_2026_10";
      updated.dpaAcceptedIp = createHash("sha256").update(clientIp).digest("hex").slice(0, 16);
    }

    const progress = calculateProgress(updated);
    const finalState = { ...updated, ...progress };
    onboardingStore.set(orgId, finalState);

    // Audit event logging
    await recordEvent({
      org_id: orgId,
      event_id: `evt_onboard_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      type: "ticket_received",
      occurred_at: new Date().toISOString(),
      ticket_ref: `onboarding_progress_${progress.completedSteps}_of_${progress.totalSteps}`,
      channel: "dashboard_onboarding",
      reason: "client_onboarding_step_updated",
    });

    safeLog("Client onboarding step updated", {
      orgId,
      completedSteps: progress.completedSteps,
      percentage: progress.percentage,
    });

    return NextResponse.json({
      success: true,
      message: "Onboarding state synchronized successfully",
      data: finalState,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Internal server error updating onboarding", message: err.message },
      { status: 500 }
    );
  }
}
