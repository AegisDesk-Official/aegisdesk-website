import type { Metadata } from "next";
import { headers } from "next/headers";
import localFont from "next/font/local";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { ToastProvider } from "@/components/providers/toast-provider";
import { SmoothScrollProvider } from "@/components/providers/smooth-scroll-provider";
import { CookieNotice } from "@/components/ui/cookie-notice";
import { siteConfig } from "@/lib/site-config";

const geistSans = localFont({
  src: "./fonts/Geist-Variable.woff2",
  variable: "--font-geist-sans",
  display: "swap",
});

const geistMono = localFont({
  src: "./fonts/GeistMono-Variable.woff2",
  variable: "--font-geist-mono",
  display: "swap",
});

const title = "AegisDesk | Grounded AI Customer Support Built on Your Company Knowledge";
const description =
  "AegisDesk builds and manages private RAG customer support systems that answer strictly from your policies, cite every source, run in a 14-day human-supervised shadow mode, and route edge cases to your team.";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.siteUrl),
  title: { default: title, template: "%s | AegisDesk" },
  description,
  applicationName: siteConfig.brandName,
  icons: { icon: "/favicon.svg" },
  openGraph: {
    type: "website",
    siteName: siteConfig.brandName,
    title,
    description,
    url: "/",
  },
  twitter: { card: "summary_large_image", title, description },
};

const forceDarkScript = `(function(){try{var d=document.documentElement;d.classList.remove('light');d.classList.add('dark');localStorage.setItem('aegis_theme','dark');}catch(e){}})();`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const nonce = headers().get("x-nonce") ?? undefined;

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} dark font-sans antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: forceDarkScript }} />
        <link
          rel="preload"
          as="image"
          href="/images/hero/hero-01-800.avif"
          type="image/avif"
          media="(max-width: 767px)"
        />
        <link
          rel="preload"
          as="image"
          href="/images/hero/hero-01-1672.avif"
          type="image/avif"
          media="(min-width: 768px)"
        />
      </head>
      <body className="min-h-screen overflow-x-hidden max-w-full bg-[var(--canvas)] font-light text-[var(--text)]">
        <div className="film-grain" aria-hidden="true" />
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-[var(--paper)] focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-[var(--paper-ink)]"
        >
          Skip to main content
        </a>
        <ThemeProvider>
          <ToastProvider>
            <SmoothScrollProvider>{children}</SmoothScrollProvider>
            <CookieNotice />
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
