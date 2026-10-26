import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getInvoiceById } from "@/lib/payments/invoices-store";
import { renderInvoiceHtml, SAMPLE_INVOICE_DATA, type InvoiceData } from "@/lib/payments/invoice-generator";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const invoiceId = params.id;
  const inv = getInvoiceById(invoiceId);

  // If matched invoice found, populate real invoice data; otherwise fallback to sample template
  const invoiceData: InvoiceData = inv
    ? {
        ...SAMPLE_INVOICE_DATA,
        invoice_number: inv.invoice_number,
        invoice_date: inv.created_at.slice(0, 10),
        due_date: inv.due_date,
        paid_at: inv.paid_at ? inv.paid_at.slice(0, 19).replace("T", " ") + " UTC" : undefined,
        status: inv.status as any,
        currency: inv.currency,
        client: {
          legal_name: (inv as any).org_name || (inv as any).client_name || "Apex Retail",
          email: (inv as any).client_email || "billing@apexretail.io",
        },
        items: (inv as any).lines && (inv as any).lines.length > 0
          ? (inv as any).lines.map((l: any) => ({
              description: l.description,
              sac_code: "998313",
              qty: 1,
              rate: l.amount_cents / 100,
              amount: l.amount_cents / 100,
            }))
          : [
              {
                description: inv.description,
                sac_code: "998313",
                qty: 1,
                rate: inv.amount_cents / 100,
                amount: inv.amount_cents / 100,
              },
            ],
        taxable_amount: inv.amount_cents / 100,
        tax_rate_percent: 0.0,
        tax_amount: 0.0,
        total_amount: inv.amount_cents / 100,
        payment_reference: inv.razorpay_payment_id ? `Razorpay ${inv.razorpay_payment_id}` : undefined,
      }
    : SAMPLE_INVOICE_DATA;

  // If client specifically requests raw binary PDF
  const wantsPdf = req.nextUrl.searchParams.get("format") === "pdf" ||
                   req.headers.get("accept")?.includes("application/pdf");

  if (wantsPdf) {
    const samplePdfPath = path.join(process.cwd(), "docs", "sample-invoice.pdf");
    if (fs.existsSync(samplePdfPath)) {
      const pdfBuffer = fs.readFileSync(samplePdfPath);
      return new NextResponse(pdfBuffer, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `inline; filename="${invoiceData.invoice_number}.pdf"`,
        },
      });
    }
  }

  const html = renderInvoiceHtml(invoiceData);

  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `inline; filename="${invoiceData.invoice_number}.html"`,
    },
  });
}
