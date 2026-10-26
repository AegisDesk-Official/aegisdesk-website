export interface InvoiceItem {
  description: string;
  sac_code: string;
  qty: number;
  rate: number;
  amount: number;
}

export interface InvoiceData {
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  paid_at?: string;
  status: "paid" | "issued" | "overdue" | "refunded";
  currency: "USD" | "INR";
  supplier: {
    legal_name: string;
    address: string;
    gstin: string;
    pan: string;
    state_code: string;
    email: string;
  };
  client: {
    legal_name: string;
    contact_name: string;
    email: string;
    address: string;
    gstin?: string;
    place_of_supply: string;
  };
  items: InvoiceItem[];
  taxable_amount: number;
  tax_rate_percent: number;
  tax_amount: number;
  total_amount: number;
  payment_reference?: string;
  notes?: string;
  is_export?: boolean;
  lut_number?: string;
}

export const SAMPLE_INVOICE_DATA: InvoiceData = {
  invoice_number: "INV-2026-001",
  invoice_date: "2026-10-01",
  due_date: "2026-10-08",
  paid_at: "2026-10-01 14:22 UTC",
  status: "paid",
  currency: "USD",
  supplier: {
    legal_name: "AegisDesk Technologies Private Limited",
    address: "Prestige Tech Park, Outer Ring Road, Kadubeesanahalli, Bengaluru, Karnataka 560103, India",
    gstin: "29AAACA9921B1Z2",
    pan: "AAACA9921B",
    state_code: "29 (Karnataka)",
    email: "billing@aegisdesk.ai",
  },
  client: {
    legal_name: "Apex Retail International Inc.",
    contact_name: "Sarah Chen, VP of Customer Operations",
    email: "billing@apexretail.io",
    address: "500 Howard Street, Suite 400, San Francisco, CA 94105, United States",
    place_of_supply: "96-Foreign Country (Export)",
  },
  items: [
    {
      description: "AegisDesk B2B Implementation: 50% Kickoff Deposit (Proprietary Document Ingestion, Retrieval Benchmark & 14-Day Shadow Validation Setup)",
      sac_code: "998313",
      qty: 1,
      rate: 1750.0,
      amount: 1750.0,
    },
  ],
  taxable_amount: 1750.0,
  tax_rate_percent: 0.0,
  tax_amount: 0.0,
  total_amount: 1750.0,
  payment_reference: "Razorpay pay_live_apex_dep_98412",
  is_export: true,
  lut_number: "AD290326000042X",
  notes: "Zero-Rated Export of Services under Letter of Undertaking (LUT) without payment of Integrated GST (IGST) in accordance with Section 16 of the IGST Act, 2017.",
};

export function renderInvoiceHtml(data: InvoiceData): string {
  const currencySymbol = data.currency === "USD" ? "$" : "₹";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Invoice ${data.invoice_number} — ${data.supplier.legal_name}</title>
  <style>
    @page {
      size: A4;
      margin: 18mm 16mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: #F4EFE9;
      color: #111311;
      line-height: 1.45;
      font-size: 13px;
      padding: 32px 36px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid rgba(17, 19, 17, 0.15);
      padding-bottom: 20px;
      margin-bottom: 24px;
    }
    .logo-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 6px;
    }
    .logo-mark {
      width: 14px;
      height: 14px;
      background: #0A433A;
      border-radius: 3px;
    }
    .brand-name {
      font-size: 20px;
      font-weight: 700;
      letter-spacing: -0.02em;
      color: #0A433A;
    }
    .supplier-details {
      font-size: 11px;
      color: #555A55;
      max-width: 320px;
      line-height: 1.4;
    }
    .invoice-title-block {
      text-align: right;
    }
    .invoice-title {
      font-size: 24px;
      font-weight: 300;
      letter-spacing: -0.02em;
      text-transform: uppercase;
      font-family: "Courier New", Courier, monospace;
      color: #111311;
    }
    .status-badge {
      display: inline-block;
      margin-top: 6px;
      padding: 3px 8px;
      border-radius: 4px;
      font-family: "Courier New", Courier, monospace;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .status-paid {
      background: rgba(46, 160, 67, 0.15);
      color: #1a7f37;
      border: 1px solid rgba(46, 160, 67, 0.35);
    }
    .status-issued {
      background: rgba(227, 179, 65, 0.15);
      color: #9a6700;
      border: 1px solid rgba(227, 179, 65, 0.35);
    }
    .meta-grid {
      display: grid;
      grid-template-columns: 1.2fr 1fr;
      gap: 20px;
      margin-bottom: 24px;
      padding: 16px;
      background: #ECE6DD;
      border: 1px solid rgba(17, 19, 17, 0.1);
      border-radius: 6px;
    }
    .section-title {
      font-family: "Courier New", Courier, monospace;
      font-size: 10px;
      text-transform: uppercase;
      color: #6A706A;
      letter-spacing: 0.08em;
      margin-bottom: 6px;
    }
    .client-name {
      font-weight: 600;
      font-size: 13px;
      color: #111311;
      margin-bottom: 2px;
    }
    .client-meta {
      font-size: 11px;
      color: #4A504A;
      line-height: 1.4;
    }
    .invoice-meta-row {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      padding: 2px 0;
      font-family: "Courier New", Courier, monospace;
    }
    .invoice-meta-label {
      color: #6A706A;
    }
    .invoice-meta-value {
      font-weight: 600;
      color: #111311;
    }
    table.items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    table.items-table th {
      background: #E5DFD5;
      font-family: "Courier New", Courier, monospace;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #4A504A;
      text-align: left;
      padding: 8px 10px;
      border-top: 1px solid rgba(17, 19, 17, 0.12);
      border-bottom: 1px solid rgba(17, 19, 17, 0.12);
    }
    table.items-table td {
      padding: 10px;
      border-bottom: 1px solid rgba(17, 19, 17, 0.08);
      font-size: 12px;
      vertical-align: top;
    }
    table.items-table td.mono {
      font-family: "Courier New", Courier, monospace;
    }
    .text-right {
      text-align: right;
    }
    .summary-block {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 24px;
    }
    .summary-table {
      width: 280px;
      font-family: "Courier New", Courier, monospace;
      font-size: 11px;
    }
    .summary-row {
      display: flex;
      justify-content: space-between;
      padding: 4px 0;
      border-bottom: 1px solid rgba(17, 19, 17, 0.06);
    }
    .summary-row.total {
      font-size: 14px;
      font-weight: 700;
      border-top: 1px solid rgba(17, 19, 17, 0.2);
      border-bottom: 2px solid rgba(17, 19, 17, 0.2);
      padding: 8px 0;
      margin-top: 4px;
      color: #0A433A;
    }
    .statutory-notes {
      padding: 12px 14px;
      border-radius: 4px;
      background: #ECE6DD;
      border: 1px dashed rgba(17, 19, 17, 0.15);
      font-size: 11px;
      color: #4A504A;
      margin-bottom: 20px;
      line-height: 1.4;
    }
    .footer {
      border-top: 1px solid rgba(17, 19, 17, 0.1);
      padding-top: 14px;
      font-size: 10px;
      font-family: "Courier New", Courier, monospace;
      color: #7A807A;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="logo-badge">
        <span class="logo-mark"></span>
        <span class="brand-name">AegisDesk</span>
      </div>
      <div class="supplier-details">
        <strong>${data.supplier.legal_name}</strong><br>
        ${data.supplier.address}<br>
        <strong>GSTIN:</strong> ${data.supplier.gstin} • <strong>PAN:</strong> ${data.supplier.pan}<br>
        State: ${data.supplier.state_code} • Contact: ${data.supplier.email}
      </div>
    </div>
    <div class="invoice-title-block">
      <div class="invoice-title">Tax Invoice</div>
      <div class="status-badge ${data.status === "paid" ? "status-paid" : "status-issued"}">
        ${data.status === "paid" ? "✓ Paid & Settled" : "● Payment Due"}
      </div>
    </div>
  </div>

  <div class="meta-grid">
    <div>
      <div class="section-title">Billed To (Client / Customer):</div>
      <div class="client-name">${data.client.legal_name}</div>
      <div class="client-meta">
        Attn: ${data.client.contact_name}<br>
        ${data.client.address}<br>
        Email: ${data.client.email}<br>
        ${data.client.gstin ? `<strong>Client GSTIN:</strong> ${data.client.gstin}<br>` : ""}
        <strong>Place of Supply:</strong> ${data.client.place_of_supply}
      </div>
    </div>
    <div>
      <div class="section-title">Invoice Telemetry:</div>
      <div class="invoice-meta-row">
        <span class="invoice-meta-label">Invoice Number:</span>
        <span class="invoice-meta-value">${data.invoice_number}</span>
      </div>
      <div class="invoice-meta-row">
        <span class="invoice-meta-label">Invoice Date:</span>
        <span class="invoice-meta-value">${data.invoice_date}</span>
      </div>
      <div class="invoice-meta-row">
        <span class="invoice-meta-label">Due Date:</span>
        <span class="invoice-meta-value">${data.due_date}</span>
      </div>
      <div class="invoice-meta-row">
        <span class="invoice-meta-label">Currency:</span>
        <span class="invoice-meta-value">${data.currency} (${currencySymbol})</span>
      </div>
      ${data.paid_at ? `
      <div class="invoice-meta-row">
        <span class="invoice-meta-label">Paid At:</span>
        <span class="invoice-meta-value">${data.paid_at}</span>
      </div>` : ""}
    </div>
  </div>

  <table class="items-table">
    <thead>
      <tr>
        <th style="width: 55%;">Service Description</th>
        <th style="width: 12%;">SAC Code</th>
        <th style="width: 8%;" class="text-right">Qty</th>
        <th style="width: 12%;" class="text-right">Rate</th>
        <th style="width: 13%;" class="text-right">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${data.items.map((item) => `
      <tr>
        <td>
          <strong>${item.description}</strong>
        </td>
        <td class="mono">${item.sac_code}</td>
        <td class="mono text-right">${item.qty}</td>
        <td class="mono text-right">${currencySymbol}${item.rate.toFixed(2)}</td>
        <td class="mono text-right"><strong>${currencySymbol}${item.amount.toFixed(2)}</strong></td>
      </tr>`).join("")}
    </tbody>
  </table>

  <div class="summary-block">
    <div class="summary-table">
      <div class="summary-row">
        <span>Taxable Value:</span>
        <span>${currencySymbol}${data.taxable_amount.toFixed(2)}</span>
      </div>
      <div class="summary-row">
        <span>GST (${data.tax_rate_percent}%):</span>
        <span>${currencySymbol}${data.tax_amount.toFixed(2)}</span>
      </div>
      <div class="summary-row total">
        <span>Total Amount Due:</span>
        <span>${currencySymbol}${data.total_amount.toFixed(2)}</span>
      </div>
    </div>
  </div>

  ${data.notes ? `
  <div class="statutory-notes">
    <strong>Statutory Declaration:</strong> ${data.notes}
    ${data.lut_number ? `<br><strong>Export LUT Reference:</strong> ${data.lut_number}` : ""}
    ${data.payment_reference ? `<br><strong>Payment Gateway Reference:</strong> ${data.payment_reference}` : ""}
  </div>` : ""}

  <div class="footer">
    <span>AegisDesk System Generated Invoice • Authenticated via PostgreSQL Cryptographic Ledger</span>
    <span>Page 1 of 1</span>
  </div>
</body>
</html>`;
}
