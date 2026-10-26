"use client";

import { useEffect } from "react";
import Link from "next/link";
import { StatusPage } from "@/components/ui/status-page";
import { Button, buttonVariants } from "@/components/ui/button";
import { safeLog } from "@/lib/security/sanitize";
import { captureSanitizedException } from "@/lib/monitoring/sentry";

export function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Zero stack trace leakage to UI: sanitize and log to telemetry
    safeLog("500 Client error boundary triggered", {
      digest: error.digest || "none",
      name: error.name || "Error",
    });
    captureSanitizedException(error, {
      digest: error.digest,
      timestamp: new Date().toISOString(),
    });
  }, [error]);

  return (
    <StatusPage
      code="500 // INTERNAL_RECOVERY_GATE"
      title="Something went wrong"
      message="A temporary application error occurred. Internal diagnostic traces are scrubbed and recorded. Try reloading, or return to the control room."
    >
      <Button size="lg" variant="default" onClick={reset} className="w-full sm:w-auto">
        Try again
      </Button>
      <Link
        href="/status"
        className={buttonVariants({ variant: "outline", size: "lg", className: "w-full sm:w-auto" })}
      >
        Check System Status
      </Link>
    </StatusPage>
  );
}

export default ErrorPage;
