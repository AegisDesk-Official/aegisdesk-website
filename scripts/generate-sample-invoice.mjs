/**
 * scripts/generate-sample-invoice.mjs
 * Generates an authentic sample invoice PDF in /docs for the Razorpay activation form
 */

import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { renderInvoiceHtml, SAMPLE_INVOICE_DATA } from "../src/lib/payments/invoice-generator.ts";

const DOCS_DIR = path.resolve(process.cwd(), "docs");
const OUT_PDF = path.resolve(DOCS_DIR, "sample-invoice.pdf");
const TEMP_HTML = path.resolve(DOCS_DIR, "_sample-invoice-temp.html");

function main() {
  console.log("Generating sample invoice PDF for Razorpay activation form...");

  if (!fs.existsSync(DOCS_DIR)) {
    fs.mkdirSync(DOCS_DIR, { recursive: true });
  }

  // 1. Render HTML
  const html = renderInvoiceHtml(SAMPLE_INVOICE_DATA);
  fs.writeFileSync(TEMP_HTML, html, "utf-8");
  console.log(`- Temporary HTML written to ${TEMP_HTML}`);

  // 2. Generate PDF via Chrome headless
  const chromeBin = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
  const cmd = `"${chromeBin}" --headless --disable-gpu --print-to-pdf="${OUT_PDF}" "${TEMP_HTML}"`;

  try {
    execSync(cmd, { stdio: "ignore" });
    console.log(`- PDF generated successfully at ${OUT_PDF}`);
  } finally {
    if (fs.existsSync(TEMP_HTML)) {
      fs.unlinkSync(TEMP_HTML);
    }
  }

  const stat = fs.statSync(OUT_PDF);
  console.log(`- Verified file size: ${stat.size} bytes (${(stat.size / 1024).toFixed(1)} KB)`);
  console.log("Sample invoice PDF ready for Razorpay activation form submission!");
}

main();
