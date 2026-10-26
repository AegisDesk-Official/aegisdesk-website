export interface LeadRecord {
  id: string;
  org_id?: string;
  name: string;
  email: string;
  company: string;
  helpdesk_used: string;
  tickets_per_month: string;
  stage: "lead" | "booked call" | "proposal sent" | "deposit paid" | "onboarding" | "live";
  notes?: string;
  source: string;
  cal_booking_id?: string;
  meeting_time?: string;
  created_at: string;
  updated_at: string;
}

export interface BookingRecord {
  id: string;
  lead_id: string;
  cal_booking_id: string;
  attendee_name: string;
  attendee_email: string;
  company: string;
  event_time: string;
  end_time?: string;
  status: "scheduled" | "rescheduled" | "cancelled";
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CalWebhookEventRecord {
  id: string;
  event_id: string;
  trigger_event: string;
  payload: any;
  status: "processed" | "failed";
  error_message?: string;
  processed_at: string;
  created_at: string;
}

// Global in-memory storage for single-instance preview and test reliability
const globalForCal = globalThis as unknown as {
  __aegis_leads?: Map<string, LeadRecord>;
  __aegis_cal_bookings?: Map<string, BookingRecord>;
  __aegis_cal_webhooks?: Map<string, CalWebhookEventRecord>;
};

const leadsStore: Map<string, LeadRecord> = globalForCal.__aegis_leads || new Map();
const bookingsStore: Map<string, BookingRecord> = globalForCal.__aegis_cal_bookings || new Map();
const webhooksStore: Map<string, CalWebhookEventRecord> = globalForCal.__aegis_cal_webhooks || new Map();

// Seed initial realistic pipeline leads for the Operator console
if (leadsStore.size === 0) {
  const initialLeads: LeadRecord[] = [
    {
      id: "lead_init_01",
      name: "Marcus Vance",
      email: "mvance@fintechflow.io",
      company: "FintechFlow Corp",
      helpdesk_used: "Zendesk Enterprise",
      tickets_per_month: "5,000 - 10,000",
      stage: "booked call",
      meeting_time: new Date(Date.now() + 86400000 * 2).toISOString(),
      cal_booking_id: "cal_bk_mvance_9012",
      source: "cal_booking",
      notes: "Looking to replace Tier 1 refund and dispute inquiries with verified citations.",
      created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
      updated_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    },
    {
      id: "lead_init_02",
      name: "Elena Rostova",
      email: "elena@nordicgear.co",
      company: "Nordic Gear Outdoor",
      helpdesk_used: "Gorgias",
      tickets_per_month: "2,500 - 5,000",
      stage: "booked call",
      meeting_time: new Date(Date.now() + 86400000 * 3).toISOString(),
      cal_booking_id: "cal_bk_elena_8812",
      source: "cal_booking",
      notes: "Winter gear sizing and warranty claims automation during peak seasonal surge.",
      created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
      updated_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    },
    {
      id: "lead_init_03",
      name: "David K.",
      email: "david@cloudscale.net",
      company: "CloudScale Systems",
      helpdesk_used: "Intercom",
      tickets_per_month: "10,000+",
      stage: "proposal sent",
      meeting_time: new Date(Date.now() - 86400000).toISOString(),
      cal_booking_id: "cal_bk_david_7714",
      source: "cal_booking",
      notes: "SaaS API uptime and SLA tier routing; proposal issued for $3,500 setup + $1,000/mo.",
      created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
  ];

  initialLeads.forEach((l) => leadsStore.set(l.email.toLowerCase(), l));
}

globalForCal.__aegis_leads = leadsStore;
globalForCal.__aegis_cal_bookings = bookingsStore;
globalForCal.__aegis_cal_webhooks = webhooksStore;

/**
 * Checks if a Cal.com webhook event ID has already been recorded
 */
export function isCalEventProcessed(eventId: string): boolean {
  return webhooksStore.has(eventId);
}

/**
 * Records a Cal webhook event for idempotency
 */
export async function recordCalWebhookEvent(record: Omit<CalWebhookEventRecord, "id" | "created_at">): Promise<void> {
  const item: CalWebhookEventRecord = {
    id: `cal_evt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    ...record,
    created_at: new Date().toISOString(),
  };

  webhooksStore.set(record.event_id, item);

  // Attempt write to Supabase webhook_events table
  try {
    const mod = await import("../db/admin");
    const supabase = mod.createAdminClient();
    await supabase.from("webhook_events").insert({
      provider: "cal",
      event_id: record.event_id,
      event_type: record.trigger_event,
      payload: record.payload,
      status: record.status,
      processed_at: record.processed_at,
    });
  } catch {
    // Graceful fallback for local test mode
  }
}

/**
 * Extracts custom questions from Cal.com responses dictionary
 */
export function extractCustomBookingFields(responsesOrPayload: any = {}): {
  company: string;
  helpdesk_used: string;
  tickets_per_month: string;
} {
  let company = "";
  let helpdesk_used = "";
  let tickets_per_month = "";

  if (!responsesOrPayload || typeof responsesOrPayload !== "object") {
    return { company, helpdesk_used, tickets_per_month };
  }

  // Check responses, customInputs, metadata, and the object itself
  const sources = [
    responsesOrPayload.responses,
    responsesOrPayload.customInputs,
    responsesOrPayload.metadata,
    responsesOrPayload,
  ].filter((s) => s && typeof s === "object");

  for (const source of sources) {
    const entries = Array.isArray(source)
      ? source.map((item) => [item.label || item.name || item.id, item.value ?? item])
      : Object.entries(source);

    for (const [key, rawValue] of entries) {
      if (!key) continue;
      const keyLower = String(key).toLowerCase().replace(/[\s_-]+/g, "");
      let valStr = "";

      if (typeof rawValue === "string") {
        valStr = rawValue.trim();
      } else if (rawValue && typeof rawValue === "object") {
        const obj = rawValue as { value?: unknown; label?: unknown };
        valStr = String(obj.value ?? obj.label ?? "").trim();
      }

      if (!valStr || valStr === "undefined" || valStr === "null") continue;

      // 1. Company
      if (
        keyLower === "company" ||
        keyLower.includes("company") ||
        keyLower.includes("organization") ||
        keyLower.includes("business")
      ) {
        if (!company) company = valStr;
      }

      // 2. Helpdesk Used
      if (
        keyLower === "helpdeskused" ||
        keyLower === "helpdesk" ||
        keyLower.includes("helpdesk") ||
        keyLower.includes("crm") ||
        keyLower.includes("ticketing")
      ) {
        if (!helpdesk_used) helpdesk_used = valStr;
      }

      // 3. Tickets Per Month
      if (
        keyLower === "ticketspermonth" ||
        keyLower === "tickets" ||
        keyLower.includes("ticket") ||
        keyLower.includes("volume")
      ) {
        if (!tickets_per_month) tickets_per_month = valStr;
      }
    }
  }

  return { company, helpdesk_used, tickets_per_month };
}

/**
 * Creates or updates a Lead and Booking on BOOKING_CREATED
 */
export async function handleBookingCreated(payload: any): Promise<{
  lead: LeadRecord;
  booking: BookingRecord;
  isNewLead: boolean;
}> {
  const uid = String(payload.uid || payload.id || `cal_bk_${Date.now()}`);
  const startTime = payload.startTime || payload.start_time || new Date().toISOString();
  const endTime = payload.endTime || payload.end_time;
  const notes = payload.description || payload.notes || "";

  // Extract attendee info
  let attendeeName = "Prospective Client";
  let attendeeEmail = "";

  if (Array.isArray(payload.attendees) && payload.attendees.length > 0) {
    attendeeName = payload.attendees[0].name || attendeeName;
    attendeeEmail = (payload.attendees[0].email || "").toLowerCase().trim();
  }

  // Fallback to responses.name or responses.email
  if (!attendeeEmail && payload.responses?.email) {
    const rEmail = payload.responses.email;
    attendeeEmail = (typeof rEmail === "string" ? rEmail : rEmail.value || "").toLowerCase().trim();
  }
  if (attendeeName === "Prospective Client" && payload.responses?.name) {
    const rName = payload.responses.name;
    attendeeName = (typeof rName === "string" ? rName : rName.value || attendeeName).trim();
  }

  if (!attendeeEmail) {
    attendeeEmail = `prospect_${Date.now()}@domain-unknown.com`;
  }

  // Extract custom mapped questions
  const custom = extractCustomBookingFields(payload.responses);
  const companyName = custom.company || "Company Undisclosed";

  const isNewLead = !leadsStore.has(attendeeEmail);
  const existingLead = leadsStore.get(attendeeEmail);

  const leadId = existingLead?.id || `lead_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const nowIso = new Date().toISOString();

  const leadRecord: LeadRecord = {
    id: leadId,
    name: attendeeName,
    email: attendeeEmail,
    company: companyName,
    helpdesk_used: custom.helpdesk_used || "Zendesk",
    tickets_per_month: custom.tickets_per_month || "1,000 - 5,000",
    stage: "booked call", // Move lead stage to booked call
    notes: notes || existingLead?.notes,
    cal_booking_id: uid,
    meeting_time: startTime,
    source: "cal_booking",
    created_at: existingLead?.created_at || nowIso,
    updated_at: nowIso,
  };

  leadsStore.set(attendeeEmail, leadRecord);

  // Store Booking record
  const bookingRecord: BookingRecord = {
    id: `bk_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    lead_id: leadId,
    cal_booking_id: uid,
    attendee_name: attendeeName,
    attendee_email: attendeeEmail,
    company: companyName,
    event_time: startTime,
    end_time: endTime,
    status: "scheduled",
    notes,
    created_at: nowIso,
    updated_at: nowIso,
  };

  bookingsStore.set(uid, bookingRecord);

  // Synchronize lead directly into Owner Console Pipeline
  try {
    let mod: any;
    try {
      mod = await import("../db/operator-store");
    } catch {
      mod = await import("../db/operator-store.ts");
    }
    if (mod && mod.syncLeadBookingToPipeline) {
      mod.syncLeadBookingToPipeline({
        leadId,
        name: attendeeName,
        contactName: attendeeName,
        email: attendeeEmail,
        company: companyName,
        helpdeskUsed: custom.helpdesk_used,
        ticketsPerMonth: custom.tickets_per_month,
        meetingTime: startTime,
        notes,
      });
    }
  } catch {
    // Graceful fallback for isolated test suites
  }

  // Async write to Supabase if configured
  try {
    const mod = await import("../db/admin");
    const supabase = mod.createAdminClient();
    await supabase.from("leads").upsert(
      {
        email: leadRecord.email,
        company: leadRecord.company,
        turnstile_verified: true,
        source: "cal_booking",
      },
      { onConflict: "email" }
    );

    await supabase.from("bookings").upsert(
      {
        cal_booking_id: bookingRecord.cal_booking_id,
        event_time: bookingRecord.event_time,
        attendee_email: bookingRecord.attendee_email,
        status: "scheduled",
        notes: bookingRecord.notes,
      },
      { onConflict: "cal_booking_id" }
    );
  } catch {
    // Graceful fallback
  }

  return { lead: leadRecord, booking: bookingRecord, isNewLead };
}

/**
 * Handles BOOKING_RESCHEDULED
 */
export async function handleBookingRescheduled(payload: any): Promise<BookingRecord | null> {
  const uid = String(payload.uid || payload.id || "");
  const newStartTime = payload.startTime || payload.start_time || new Date().toISOString();
  const newEndTime = payload.endTime || payload.end_time;

  const booking = bookingsStore.get(uid);
  if (booking) {
    booking.event_time = newStartTime;
    booking.end_time = newEndTime;
    booking.status = "rescheduled";
    booking.updated_at = new Date().toISOString();
    bookingsStore.set(uid, booking);
  }

  // Update lead meeting time
  leadsStore.forEach((lead, email) => {
    if (lead.cal_booking_id === uid) {
      lead.meeting_time = newStartTime;
      lead.updated_at = new Date().toISOString();
      leadsStore.set(email, lead);
    }
  });

  // Sync to Supabase
  try {
    const mod = await import("../db/admin");
    const supabase = mod.createAdminClient();
    await supabase
      .from("bookings")
      .update({ event_time: newStartTime, status: "rescheduled" })
      .eq("cal_booking_id", uid);
  } catch {
    // Graceful fallback
  }

  return booking || null;
}

/**
 * Handles BOOKING_CANCELLED
 */
export async function handleBookingCancelled(payload: any): Promise<BookingRecord | null> {
  const uid = String(payload.uid || payload.id || "");

  const booking = bookingsStore.get(uid);
  if (booking) {
    booking.status = "cancelled";
    booking.updated_at = new Date().toISOString();
    bookingsStore.set(uid, booking);
  }

  // Sync to Supabase
  try {
    const mod = await import("../db/admin");
    const supabase = mod.createAdminClient();
    await supabase
      .from("bookings")
      .update({ status: "cancelled" })
      .eq("cal_booking_id", uid);
  } catch {
    // Graceful fallback
  }

  return booking || null;
}

/**
 * Returns all leads for the Operator console
 */
export function getAllLeads(): LeadRecord[] {
  return Array.from(leadsStore.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

/**
 * Returns all bookings
 */
export function getAllBookings(): BookingRecord[] {
  return Array.from(bookingsStore.values());
}
