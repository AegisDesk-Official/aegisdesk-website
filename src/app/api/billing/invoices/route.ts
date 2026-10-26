import { NextRequest, NextResponse } from "next/server";
import {
  getInvoicesForOrg,
  getOrCreateOrgProfile,
  checkAndGenerateSettlementInvoices,
} from "@/lib/payments/invoices-store";
import { getAuthenticatedUser } from "@/lib/security/auth-roles";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = getAuthenticatedUser(req);
    const requestedOrgId = req.nextUrl.searchParams.get("org_id") || undefined;

    let targetOrgId = requestedOrgId;

    if (user) {
      if (user.role !== "owner") {
        // Enforce strict Row Level Security: Clients can NEVER view or request another organization's data
        if (requestedOrgId && requestedOrgId !== user.orgId) {
          return NextResponse.json(
            { error: "Forbidden: Cross-tenant data access blocked by Row Level Security" },
            { status: 403 }
          );
        }
        targetOrgId = user.orgId;
      }
    }

    // Default to Apex Retail if unauthenticated client preview
    const effectiveOrgId = targetOrgId || "org_apex_industries";

    // Run 48h settlement check
    checkAndGenerateSettlementInvoices();

    const profile = getOrCreateOrgProfile({ orgId: effectiveOrgId });
    const invoices = getInvoicesForOrg(effectiveOrgId);

    const enriched = invoices.map((inv) => ({
      ...inv,
      client_name: profile.orgName,
      currency_symbol: inv.currency === "INR" ? "₹" : "$",
      amount_formatted: `${inv.currency === "INR" ? "₹" : "$"}${(inv.amount_cents / 100).toLocaleString()}`,
    }));

    return NextResponse.json({
      status: "success",
      org_profile: profile,
      invoices: enriched,
      count: enriched.length,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load invoices";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
