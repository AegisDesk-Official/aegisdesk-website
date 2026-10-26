import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isOwnerRequest } from "@/lib/security/auth-roles";

export const metadata: Metadata = {
  title: "Owner Console | AegisDesk",
  description: "Executive control room for portfolio revenue, client margins, system health, and security telemetry.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function OperatorLayout({ children }: { children: React.ReactNode }) {
  // Server-side check before rendering: non-owners receive standard 404
  if (!isOwnerRequest()) {
    notFound();
  }

  return <>{children}</>;
}
