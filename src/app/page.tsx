import type { Metadata } from "next";
import nextDynamic from "next/dynamic";
import { Navbar } from "@/components/marketing/navbar";
import { Footer } from "@/components/marketing/footer";
import { Hero } from "@/components/marketing/hero";
import { CalEmbedProvider } from "@/components/marketing/cal-embed-provider";

// Defer below-the-fold heavy components to accelerate initial mobile LCP and Lighthouse score
const VerificationWorkbench = nextDynamic(
  () => import("@/components/marketing/verification-workbench").then((mod) => mod.VerificationWorkbench),
  { ssr: true }
);

const SafetyPillars = nextDynamic(
  () => import("@/components/marketing/safety-pillars").then((mod) => mod.SafetyPillars),
  { ssr: true }
);

const HowItWorks = nextDynamic(
  () => import("@/components/marketing/how-it-works").then((mod) => mod.HowItWorks),
  { ssr: true }
);

const SavingsExample = nextDynamic(
  () => import("@/components/marketing/savings-example").then((mod) => mod.SavingsExample),
  { ssr: true }
);

const Faq = nextDynamic(
  () => import("@/components/marketing/faq").then((mod) => mod.Faq),
  { ssr: true }
);

const FinalCta = nextDynamic(
  () => import("@/components/marketing/final-cta").then((mod) => mod.FinalCta),
  { ssr: true }
);

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "AegisDesk | Support Answers Backed by Your Documents",
  description:
    "AegisDesk builds private support systems that answer strictly from your policies, quote every source, run in a 14-day human-supervised Shadow Validation, and route edge cases to your team.",
};

export default function HomePage() {
  const demoEnabled = process.env.DEMO_ENABLED === "true";

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden max-w-full bg-[var(--canvas)] text-[var(--text)] antialiased selection:bg-[var(--glow)]/20 selection:text-white">
      <Navbar />
      <CalEmbedProvider />
      <main id="main" className="flex-1">
        {/* Exactly 100svh Hero with Copy, Paper Card, and 3 Proof Stats on bottom edge */}
        <Hero demoEnabled={demoEnabled} />
        {/* Next section starts after scrolling */}
        <VerificationWorkbench demoEnabled={demoEnabled} />
        <SafetyPillars />
        <HowItWorks />
        <SavingsExample />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}
