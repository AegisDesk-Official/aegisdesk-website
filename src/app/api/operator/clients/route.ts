import { NextRequest, NextResponse } from "next/server";
import { notFound } from "next/navigation";
import { isOwnerRequest } from "@/lib/security/auth-roles";
import { getClientIp } from "@/lib/demo-request";
import {
  getAllRealClients,
  getDemoClients,
  provisionClient,
  sendClientAccessLink,
  editClientFees,
  markClientPaidOffline,
  activateClientLiveMode,
  pauseClient,
  refundClient,
  getNeedsAttentionItems,
  PIPELINE_STATES,
} from "@/lib/db/operator-store";
import { getAllLeads, getAllBookings } from "@/lib/calendar/cal-store";
import { recordAuditEvent } from "@/lib/security/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function enforceOwner(req: NextRequest) {
  if (!isOwnerRequest(req)) {
    notFound();
  }
}

export async function GET(req: NextRequest) {
  enforceOwner(req);

  const realClients = getAllRealClients();
  const demoClients = getDemoClients();
  const needsAttention = getNeedsAttentionItems();

  // Compute pipeline stages
  const allClients = [...realClients, ...demoClients];
  const pipeline = PIPELINE_STATES.map((state) => {
    const clientsInState = allClients.filter((c) => c.state === state);
    const value = clientsInState.reduce((sum, c) => sum + c.setupFee + c.monthlyRetainer, 0);
    return {
      stage: state,
      label: state,
      count: clientsInState.length,
      value,
      clients: clientsInState.map((c) => ({
        id: c.id,
        name: c.name,
        retainer: c.monthlyRetainer,
        setup: c.setupFee,
        isDemo: c.isDemo,
      })),
    };
  });

  return NextResponse.json({
    realClients,
    demoClients,
    needsAttention,
    pipeline,
    leads: getAllLeads(),
    bookings: getAllBookings(),
  });
}

export async function POST(req: NextRequest) {
  enforceOwner(req);

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const ip = getClientIp(req.headers);
  const action = body.action;

  try {
    switch (action) {
      case "provision": {
        const { name, contactName, supportEmail, currency, monthlyTickets, setupFee, monthlyRetainer, totpCode } = body;
        if (!name || !supportEmail || !totpCode) {
          return NextResponse.json({ error: "Missing required client fields or authenticator code." }, { status: 400 });
        }
        const result = await provisionClient({
          name,
          contactName: contactName || name,
          supportEmail,
          currency: currency || "USD",
          monthlyTickets: Number(monthlyTickets) || 5000,
          setupFee: setupFee ? Number(setupFee) : undefined,
          monthlyRetainer: monthlyRetainer ? Number(monthlyRetainer) : undefined,
          totpCode: String(totpCode),
          ip,
        });
        return NextResponse.json({ success: true, ...result });
      }

      case "send_invite": {
        const { clientId } = body;
        if (!clientId) return NextResponse.json({ error: "Missing clientId" }, { status: 400 });
        const baseUrl = req.nextUrl.origin || "http://localhost:3000";
        const inviteLink = await sendClientAccessLink(clientId, baseUrl, ip);
        return NextResponse.json({ success: true, inviteLink });
      }

      case "edit_fees": {
        const { clientId, setupFee, monthlyRetainer } = body;
        if (!clientId || setupFee === undefined || monthlyRetainer === undefined) {
          return NextResponse.json({ error: "Missing required fee parameters" }, { status: 400 });
        }
        const updated = await editClientFees(clientId, Number(setupFee), Number(monthlyRetainer), ip);
        return NextResponse.json({ success: true, client: updated });
      }

      case "mark_paid": {
        const { clientId, invoiceType, reference, reason, totpCode } = body;
        if (!clientId || !totpCode) {
          return NextResponse.json({ error: "Missing clientId or authenticator code." }, { status: 400 });
        }
        const updated = await markClientPaidOffline(
          clientId,
          invoiceType || "deposit",
          reference || "OFFLINE_REF",
          reason || "Wire transfer confirmed",
          String(totpCode),
          ip
        );
        return NextResponse.json({ success: true, client: updated });
      }

      case "activate_live": {
        const { clientId, totpCode } = body;
        if (!clientId || !totpCode) {
          return NextResponse.json({ error: "Missing clientId or authenticator code." }, { status: 400 });
        }
        const updated = await activateClientLiveMode(clientId, String(totpCode), ip);
        return NextResponse.json({ success: true, client: updated });
      }

      case "pause": {
        const { clientId, reason } = body;
        if (!clientId) return NextResponse.json({ error: "Missing clientId" }, { status: 400 });
        const updated = await pauseClient(clientId, reason || "Operations pause requested", ip);
        return NextResponse.json({ success: true, client: updated });
      }

      case "refund": {
        const { clientId, amount, reason, totpCode } = body;
        if (!clientId || !totpCode) {
          return NextResponse.json({ error: "Missing clientId or authenticator code." }, { status: 400 });
        }
        const updated = await refundClient(clientId, Number(amount) || 0, reason || "Client requested refund", String(totpCode), ip);
        return NextResponse.json({ success: true, client: updated });
      }

      case "view_as": {
        const { clientId, clientName } = body;
        if (!clientId) return NextResponse.json({ error: "Missing clientId" }, { status: 400 });

        await recordAuditEvent({
          org_id: clientId,
          user_id: "owner",
          event_type: "auth.login",
          details: { action: "operator.view_as_client", clientName },
          ip_address: ip,
        });

        const response = NextResponse.json({ success: true, redirectUrl: `/dashboard?viewas=${encodeURIComponent(clientId)}` });
        response.cookies.set("aegis_view_as", clientName || clientId, {
          path: "/",
          httpOnly: false,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
        });
        response.cookies.set("aegis_read_only", "true", {
          path: "/",
          httpOnly: false,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
        });
        return response;
      }

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Operator action failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
