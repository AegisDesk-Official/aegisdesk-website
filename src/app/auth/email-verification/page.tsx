import Link from "next/link";
import { MailCheck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function EmailVerificationPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-border bg-card p-8 shadow-xl text-center space-y-6">
          <div className="h-16 w-16 rounded-full bg-indigo-500/10 text-indigo-500 flex items-center justify-center mx-auto">
            <MailCheck className="h-8 w-8" />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-foreground">Verify Your Work Email</h1>
            <p className="text-xs text-muted-foreground mt-2">
              We sent a verification link to your registered company address. Please click the link to activate two-factor protection.
            </p>
          </div>

          <Link href="/dashboard" className="block">
            <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
              Continue to Dashboard
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
