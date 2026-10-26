import type { Metadata } from "next";
import Link from "next/link";
import { StatusPage } from "@/components/ui/status-page";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "404 — Page Not Found | AegisDesk",
  description: "The requested route does not exist. Return to AegisDesk verified customer support.",
};

export default function NotFoundPage() {
  return (
    <StatusPage
      code="404 // ROUTE_NOT_FOUND"
      title="This page does not exist"
      message="The link may have moved or been typed incorrectly. Head back to the control room or explore the verification workbench."
    >
      <Link
        href="/dashboard"
        className={buttonVariants({ variant: "default", size: "lg", className: "w-full sm:w-auto" })}
      >
        Go to Client Dashboard
      </Link>
    </StatusPage>
  );
}
