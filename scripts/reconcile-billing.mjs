/**
 * scripts/reconcile-billing.mjs
 * AegisDesk Daily Razorpay Reconciliation Worker
 * Compares Razorpay records with database invoices to detect missed webhooks,
 * amount tampering, and currency discrepancies.
 */

const TARGET_BASE = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

async function main() {
  console.log("=============================================================");
  console.log("AegisDesk Billing: Running Daily Razorpay Reconciliation Job");
  console.log(`Endpoint: ${TARGET_BASE}/api/billing/reconcile`);
  console.log("=============================================================");

  try {
    const res = await fetch(`${TARGET_BASE}/api/billing/reconcile`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Reconciliation failed with status ${res.status}: ${errText}`);
    }

    const report = await res.json();
    console.log(`- Scanned Razorpay Payments: ${report.razorpay_payments_scanned}`);
    console.log(`- Database Invoices Evaluated: ${report.invoices_evaluated}`);
    console.log(`- Auto-reconciled Missed Webhooks: ${report.auto_reconciled_count}`);
    console.log(`- Active Financial Discrepancies: ${report.active_discrepancies_count}`);

    if (report.discrepancies && report.discrepancies.length > 0) {
      console.log("\nActive Discrepancies Flagged for Operator Console:");
      for (const disc of report.discrepancies) {
        console.log(`  [${disc.type.toUpperCase()}] ${disc.invoice_number || "N/A"}: ${disc.notes}`);
      }
    } else {
      console.log("\nClean Ledger: Zero financial discrepancies detected.");
    }
  } catch (err) {
    console.error("Reconciliation execution error:", err);
    process.exit(1);
  }
}

main();
