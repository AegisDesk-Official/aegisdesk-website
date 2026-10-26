import Link from "next/link";
import { LogoMark } from "@/components/brand/logo";
import { buttonVariants } from "@/components/ui/button";
import { siteConfig } from "@/lib/site-config";

/** Shared look for the 404 and error pages. Each has a Book a Call button and a link home. */
export function StatusPage({
  code,
  title,
  message,
  children,
}: {
  code?: string;
  title: string;
  message: string;
  children?: React.ReactNode;
}) {
  return (
    <main id="main" className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-16">
      <div className="hero-grid pointer-events-none absolute inset-0 -z-10" aria-hidden="true" />
      <div className="w-full max-w-lg text-center">
        <LogoMark className="mx-auto h-12 w-12 text-[var(--paper)]" />
        {code && <p className="mt-8 text-sm font-medium text-muted-foreground">{code}</p>}
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{title}</h1>
        <p className="mt-3 text-lg text-muted-foreground">{message}</p>
        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
          {children}
          <Link href="/" className={buttonVariants({ variant: "outline", size: "lg", className: "w-full sm:w-auto" })}>
            Back to home
          </Link>
          <a
            href="mailto:support@aegisdesk.com"
            className="font-mono text-xs text-[var(--text-dim)] underline underline-offset-4 hover:text-[var(--text)] transition-colors"
          >
            Contact support &rarr;
          </a>
        </div>
      </div>
    </main>
  );
}

export default StatusPage;
