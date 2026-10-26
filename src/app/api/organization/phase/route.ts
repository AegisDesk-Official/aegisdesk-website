import { NextRequest, NextResponse } from "next/server";
import { getClientShadowDates } from "@/lib/db/invites-store";
import { isOwnerRequest } from "@/lib/security/auth-roles";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const isOwner = isOwnerRequest(req);
  const orgIdCookie = req.cookies.get("aegis_org_id")?.value;
  const demoParam = req.nextUrl.searchParams.get("demo") === "1";

  // Only the owner can open the demo workspace
  const isDemo = isOwner && (demoParam || orgIdCookie === "demo_workspace");

  // Determine actual target org
  const orgId = isDemo ? "demo_workspace" : (orgIdCookie || "org_apex_industries");

  // Get shadow dates from store
  const shadowInfo = getClientShadowDates(orgId);
  const now = new Date();

  // If no shadow record, default to 14 days from now
  const shadowEnds = shadowInfo?.shadow_ends_at
    ? new Date(shadowInfo.shadow_ends_at)
    : new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  const shadowStarted = shadowInfo?.shadow_started_at
    ? new Date(shadowInfo.shadow_started_at)
    : now;

  // Check if final settlement was completed
  // For demo workspace, or real orgs: check cookie or query param or store
  const isSettled = req.cookies.get("aegis_settled")?.value === "true";
  const settledAt = req.cookies.get("aegis_settled_at")?.value || null;

  // Real organizations start with no tickets until webhooks stream in
  // Demo workspace has sample data
  const hasData = isDemo;

  return NextResponse.json({
    serverTime: now.getTime(),
    orgId,
    isOwner,
    isDemo,
    shadow_started_at: shadowStarted.toISOString(),
    shadow_ends_at: shadowEnds.toISOString(),
    isSettled,
    settledAt,
    hasData,
  });
}
