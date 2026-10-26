import { NextRequest, NextResponse } from "next/server";
import { verifyCalSignature } from "@/lib/calendar/verify-signature";
import {
  isCalEventProcessed,
  recordCalWebhookEvent,
  handleBookingCreated,
  handleBookingRescheduled,
  handleBookingCancelled,
} from "@/lib/calendar/cal-store";
import {
  sendBookingOwnerNotificationEmail,
  sendBookingConfirmationToLeadEmail,
} from "@/lib/email/resend";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { getClientIp } from "@/lib/demo-request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const clientIp = getClientIp(req.headers);
    const rateLimit = await checkRateLimit("webhook_route", clientIp);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Webhook rate limit exceeded" },
        { status: 429, headers: { "Retry-After": String(rateLimit.reset) } }
      );
    }

    // 1. Read raw body as text for cryptographic HMAC verification
    const rawBody = await req.text();
    if (rawBody.length > 500 * 1024) {
      return NextResponse.json({ error: "Webhook payload exceeds 500KB ceiling" }, { status: 413 });
    }

    const signatureHeader =
      req.headers.get("x-cal-signature-256") ||
      req.headers.get("X-Cal-Signature-256");

    // 2. Constant-time HMAC SHA-256 signature verification
    const verification = verifyCalSignature({
      rawBody,
      signatureHeader,
    });

    if (!verification.valid) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid or missing Cal.com webhook signature", details: verification.error },
        { status: 401 }
      );
    }

    // 3. Parse JSON safely after verification
    let json: any;
    try {
      json = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }

    const triggerEvent = json.triggerEvent || json.event || "UNKNOWN";
    const payload = json.payload || json;
    const uid = String(payload.uid || payload.id || `evt_${Date.now()}`);

    // Build unique idempotency key
    const idempotencyKey = `${triggerEvent}:${uid}`;

    // 4. Idempotency check: Reject duplicate event replays
    if (isCalEventProcessed(idempotencyKey)) {
      return NextResponse.json(
        {
          status: "ignored",
          message: `Cal.com event "${idempotencyKey}" has already been processed.`,
        },
        { status: 200 }
      );
    }

    // 5. Route by triggerEvent
    if (triggerEvent === "BOOKING_CREATED") {
      const { lead, booking } = await handleBookingCreated(payload);

      // Send owner notification email
      await sendBookingOwnerNotificationEmail({
        leadName: lead.name,
        leadEmail: lead.email,
        company: lead.company,
        helpdeskUsed: lead.helpdesk_used,
        ticketsPerMonth: lead.tickets_per_month,
        startTime: booking.event_time,
        notes: booking.notes,
        calBookingId: booking.cal_booking_id,
      });

      // Send confirmation to the lead
      await sendBookingConfirmationToLeadEmail({
        leadName: lead.name,
        leadEmail: lead.email,
        company: lead.company,
        startTime: booking.event_time,
      });

      // Record idempotency
      await recordCalWebhookEvent({
        event_id: idempotencyKey,
        trigger_event: triggerEvent,
        payload: json,
        status: "processed",
        processed_at: new Date().toISOString(),
      });

      return NextResponse.json({
        status: "success",
        message: `Booking created for ${lead.name} (${lead.company}). Lead advanced to "booked call".`,
        lead_id: lead.id,
        booking_id: booking.cal_booking_id,
        stage: lead.stage,
      });
    }

    if (triggerEvent === "BOOKING_RESCHEDULED") {
      const updatedBooking = await handleBookingRescheduled(payload);

      await recordCalWebhookEvent({
        event_id: idempotencyKey,
        trigger_event: triggerEvent,
        payload: json,
        status: "processed",
        processed_at: new Date().toISOString(),
      });

      return NextResponse.json({
        status: "success",
        message: `Booking ${uid} successfully rescheduled.`,
        booking: updatedBooking,
      });
    }

    if (triggerEvent === "BOOKING_CANCELLED") {
      const updatedBooking = await handleBookingCancelled(payload);

      await recordCalWebhookEvent({
        event_id: idempotencyKey,
        trigger_event: triggerEvent,
        payload: json,
        status: "processed",
        processed_at: new Date().toISOString(),
      });

      return NextResponse.json({
        status: "success",
        message: `Booking ${uid} marked as cancelled.`,
        booking: updatedBooking,
      });
    }

    // Default handler for unhandled event types
    await recordCalWebhookEvent({
      event_id: idempotencyKey,
      trigger_event: triggerEvent,
      payload: json,
      status: "processed",
      processed_at: new Date().toISOString(),
    });

    return NextResponse.json({
      status: "acknowledged",
      message: `Event type "${triggerEvent}" received and logged.`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: "active",
    endpoint: "/api/webhooks/cal",
    provider: "cal.com",
    supported_events: ["BOOKING_CREATED", "BOOKING_RESCHEDULED", "BOOKING_CANCELLED"],
    security: "x-cal-signature-256 HMAC SHA-256 verification enabled",
  });
}
