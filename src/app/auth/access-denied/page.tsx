import Link from "next/link";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AccessDeniedPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-destructive/30 bg-card p-8 shadow-xl text-center space-y-6">
          <div className="h-16 w-16 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
            <ShieldAlert className="h-8 w-8" />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-foreground">Access Denied</h1>
            <p className="text-xs text-muted-foreground mt-2">
              You do not have the required permissions or authorized tenant membership to access this resource.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-muted/40 border border-border text-left text-xs text-muted-foreground space-y-1">
            <div>• Frontend route protection is paired with backend authorization.</div>
            <div>• Contact your company Owner or Administrator to adjust your role.</div>
          </div>

          <Link href="/dashboard" className="block">
            <Button className="w-full gap-2">
              <ArrowLeft className="h-4 w-4" />
              Return to Safe Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
