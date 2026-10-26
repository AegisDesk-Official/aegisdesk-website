import type { Metadata } from "next";
import { DashboardShell } from "@/components/portal/dashboard-shell";

export const metadata: Metadata = {
  title: "Operations Console | AegisDesk",
  description: "Real-time telemetry, verification audits, and ingestion controls.",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
