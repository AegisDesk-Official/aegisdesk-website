/**
 * src/lib/email/resend.ts
 * Transactional email service powered by Resend
 * Sends short, plain, executive communications from billing@aegisdesk.ai
 */

export interface EmailRecord {
  id: string;
  template:
    | "invoice_issued"
    | "payment_received"
    | "payment_failed"
    | "refund_processed"
    | "cal_booking_created_owner"
    | "cal_booking_created_lead"
    | "demo_spend_cap_reached";
  to: string;
  from: string;
  subject: string;
  body: string;
  sent_at: string;
  status: "delivered" | "simulated" | "failed";
}

// In-memory outbox for preview mode and audit verification
const globalForEmail = globalThis as unknown as {
  __aegis_outbox?: EmailRecord[];
};
const outbox: EmailRecord[] = globalForEmail.__aegis_outbox || [];
globalForEmail.__aegis_outbox = outbox;

const DEFAULT_FROM = process.env.RESEND_FROM_EMAIL || "AegisDesk Billing <billing@aegisdesk.ai>";

async function dispatchEmail(record: Omit<EmailRecord, "id" | "sent_at" | "status">): Promise<EmailRecord> {
  const apiKey = process.env.RESEND_API_KEY;
  const isPlaceholderKey = !apiKey || apiKey.startsWith("re_your_") || apiKey.includes("placeholder");

  const emailItem: EmailRecord = {
    id: `email_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    ...record,
    sent_at: new Date().toISOString(),
    status: isPlaceholderKey ? "simulated" : "delivered",
  };

  outbox.unshift(emailItem);
  if (outbox.length > 500) {
    outbox.pop();
  }

  if (isPlaceholderKey) {
    return emailItem;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: record.from,
        to: [record.to],
        subject: record.subject,
        text: record.body,
      }),
    });

    if (!res.ok) {
      emailItem.status = "failed";
    }
  } catch {
    emailItem.status = "failed";
  }

  return emailItem;
}

/**
 * 1. Invoice Issued Email
 */
export async function sendInvoiceIssuedEmail({
  to,
  invoiceNumber,
  amount,
  currency,
  dueDate,
  paymentUrl,
}: {
  to: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  dueDate: string;
  paymentUrl: string;
}) {
  const subject = `Invoice ${invoiceNumber} issued (${currency} ${amount.toLocaleString()}) — AegisDesk`;
  const body = `Hello,

Invoice ${invoiceNumber} for ${currency} ${amount.toLocaleString()} has been issued for your AegisDesk workspace.

Due date: ${dueDate}
View and pay invoice online: ${paymentUrl}

A tax invoice PDF with statutory GST details is available for download at any time from your client portal at /dashboard/billing.

Best regards,
AegisDesk Billing Engineering
billing@aegisdesk.ai`;

  return await dispatchEmail({
    template: "invoice_issued",
    to,
    from: DEFAULT_FROM,
    subject,
    body,
  });
}

/**
 * 2. Payment Received Email (Receipt)
 */
export async function sendPaymentReceivedEmail({
  to,
  invoiceNumber,
  amount,
  currency,
  paymentId,
  paidAt,
}: {
  to: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  paymentId: string;
  paidAt: string;
}) {
  const subject = `Receipt for ${invoiceNumber} (${currency} ${amount.toLocaleString()}) — AegisDesk`;
  const body = `Hello,

We have received and verified your payment of ${currency} ${amount.toLocaleString()} for invoice ${invoiceNumber}.

Transaction ID: ${paymentId}
Settled at: ${paidAt}
Status: Paid & Settled

Your workspace has been automatically updated according to the milestone unlock matrix. You can download the stamped receipt at /dashboard/billing.

Best regards,
AegisDesk Billing Engineering
billing@aegisdesk.ai`;

  return await dispatchEmail({
    template: "payment_received",
    to,
    from: DEFAULT_FROM,
    subject,
    body,
  });
}

/**
 * 3. Payment Failed Email
 */
export async function sendPaymentFailedEmail({
  to,
  invoiceNumber,
  amount,
  currency,
  retryUrl,
  reason,
}: {
  to: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  retryUrl: string;
  reason?: string;
}) {
  const subject = `Payment attempt failed for invoice ${invoiceNumber} — AegisDesk`;
  const body = `Hello,

A scheduled payment attempt for invoice ${invoiceNumber} (${currency} ${amount.toLocaleString()}) was unsuccessful.

Gateway reason: ${reason || "Card declined or bank mandate unavailable"}
Retry payment with a corporate card or alternate method: ${retryUrl}

Your workspace will remain active during our standard 7-day grace period. If you need assistance with bank transfers or custom AP invoicing, please reply directly to this email.

Best regards,
AegisDesk Billing Engineering
billing@aegisdesk.ai`;

  return await dispatchEmail({
    template: "payment_failed",
    to,
    from: DEFAULT_FROM,
    subject,
    body,
  });
}

/**
 * 4. Refund Processed Email
 */
export async function sendRefundProcessedEmail({
  to,
  invoiceNumber,
  refundAmount,
  currency,
  reason,
  refundId,
}: {
  to: string;
  invoiceNumber: string;
  refundAmount: number;
  currency: string;
  reason: string;
  refundId: string;
}) {
  const subject = `Refund processed for ${invoiceNumber} (${currency} ${refundAmount.toLocaleString()}) — AegisDesk`;
  const body = `Hello,

A refund of ${currency} ${refundAmount.toLocaleString()} has been processed for invoice ${invoiceNumber}.

Refund reference: ${refundId}
Reason: ${reason}
Status: Settled

Funds will return to the original payment method within 5–7 business days depending on your bank or card issuer.

Best regards,
AegisDesk Billing Engineering
billing@aegisdesk.ai`;

  return await dispatchEmail({
    template: "refund_processed",
    to,
    from: DEFAULT_FROM,
    subject,
    body,
  });
}

/**
 * 5. Cal.com Scoping Call: Owner Notification Email
 */
export async function sendBookingOwnerNotificationEmail({
  leadName,
  leadEmail,
  company,
  helpdeskUsed,
  ticketsPerMonth,
  startTime,
  notes,
  calBookingId,
}: {
  leadName: string;
  leadEmail: string;
  company: string;
  helpdeskUsed: string;
  ticketsPerMonth: string;
  startTime: string;
  notes?: string;
  calBookingId: string;
}) {
  const to = process.env.CALCOM_OWNER_NOTIFICATION_EMAIL || "founder@aegisdesk.ai";
  const subject = `New Scoping Call: ${leadName} (${company || "Unknown Org"})`;
  const body = `Hello,

A new 15-minute technical scoping call has been scheduled via Cal.com.

Attendee Details:
- Name: ${leadName}
- Work Email: ${leadEmail}
- Company: ${company || "Not provided"}
- Helpdesk Used: ${helpdeskUsed || "Not specified"}
- Monthly Ticket Volume: ${ticketsPerMonth || "Not specified"}
- Meeting Start: ${startTime}
- Booking UID: ${calBookingId}
${notes ? `- Attendee Notes: ${notes}\n` : ""}
The lead has been recorded in the operator pipeline at /operator?tab=pipeline.

Best regards,
AegisDesk System Telemetry`;

  return await dispatchEmail({
    template: "cal_booking_created_owner",
    to,
    from: "AegisDesk Bookings <bookings@aegisdesk.ai>",
    subject,
    body,
  });
}

/**
 * 6. Cal.com Scoping Call: Confirmation Email to Lead
 */
export async function sendBookingConfirmationToLeadEmail({
  leadName,
  leadEmail,
  company,
  startTime,
}: {
  leadName: string;
  leadEmail: string;
  company: string;
  startTime: string;
}) {
  const subject = `Confirmed: AegisDesk Technical Scoping Call`;
  const body = `Hello ${leadName},

Your 15-minute technical scoping call with the AegisDesk engineering team is confirmed.

Scheduled Time: ${startTime}
Company: ${company || "Your organization"}

What we will cover on the call:
1. Review your current support policies and document formats (PDFs, Notion, Zendesk Guide).
2. Measure your historical ticket volume and edge-case routing needs.
3. Walk through the 14-day Shadow Validation calibration and citation verification setup.

If you have questions beforehand or need to reschedule, reply directly to this email.

Best regards,
AegisDesk Engineering
hello@aegisdesk.ai`;

  return await dispatchEmail({
    template: "cal_booking_created_lead",
    to: leadEmail,
    from: "AegisDesk Bookings <bookings@aegisdesk.ai>",
    subject,
    body,
  });
}

/**
 * Alert email sent to the owner when the public workbench daily spend cap is reached
 */
export async function sendDemoSpendCapReachedEmail({
  ownerEmail = "founder@aegisdesk.ai",
  totalSpendUsd,
  dailyCapUsd,
  date,
}: {
  ownerEmail?: string;
  totalSpendUsd: number;
  dailyCapUsd: number;
  date: string;
}) {
  const subject = `[AegisDesk Alert] Public Workbench Daily Spend Cap Reached ($${totalSpendUsd.toFixed(2)} / $${dailyCapUsd.toFixed(2)})`;
  const body = `Operations Security Alert:

The public verification workbench has reached its daily inference budget ceiling for ${date}.

Summary:
- Total Spend Today: $${totalSpendUsd.toFixed(2)} USD
- Daily Cap Threshold: $${dailyCapUsd.toFixed(2)} USD
- Automated Action Taken: Public demo safely shifted to "Back Tomorrow" deflection mode
- Kill Switch Status: Normal (Spend Cap Triggered)

Visitors attempting further demo queries are politely notified to return tomorrow or book a scoping call to run tests on their own documents.

To adjust the spend cap, update DEMO_DAILY_SPEND_CAP_USD in your environment or manage the kill switch directly in the Operator Console (/operator).

Best regards,
AegisDesk Security Operations
secops@aegisdesk.ai`;

  return await dispatchEmail({
    template: "demo_spend_cap_reached",
    to: ownerEmail,
    from: "AegisDesk SecOps <security@aegisdesk.ai>",
    subject,
    body,
  });
}

/**
 * Get recent outbox emails for verification
 */
export function getRecentOutboxEmails(limit = 20): EmailRecord[] {
  return outbox.slice(0, limit);
}
