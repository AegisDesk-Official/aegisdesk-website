import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        // DESIGN.md Source of Truth Tokens
        canvas: "var(--canvas)",
        surface: {
          DEFAULT: "var(--surface)",
          2: "var(--surface-2)",
        },
        line: {
          DEFAULT: "var(--line)",
          strong: "var(--line-strong)",
        },
        "text-base": "var(--text)",
        "text-dim": "var(--text-dim)",
        "text-faint": "var(--text-faint)",
        glow: "var(--glow)",
        paper: {
          DEFAULT: "var(--paper)",
          ink: "var(--paper-ink)",
          line: "var(--paper-line)",
        },
        warn: "var(--warn)",
        blocked: "var(--blocked)",

        // Existing / preserved tokens
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Brand: deep green token #0A433A with legacy ramp for un-refactored pages
        brand: {
          DEFAULT: "var(--brand)",
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
          950: "#172554",
        },
        // Emerald / Verified
        verified: {
          DEFAULT: "var(--verified)",
          muted: "#10b981",
          surface: "rgba(16, 185, 129, 0.10)",
        },
        // Round 3.1 "Sylva Spatial Editorial" tokens (to be pruned later)
        obsidian: {
          DEFAULT: "#050507",
          elevated: "#0A0A0E",
          surface: "#0E0E14",
          border: "rgba(255, 255, 255, 0.08)",
        },
        dossier: {
          DEFAULT: "#F5F2EB",
          surface: "#EFECE4",
          ink: "#111113",
          muted: "#52514E",
          border: "#D8D3C8",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "ui-sans-serif", "system-ui", "-apple-system", "sans-serif"],
        display: ["var(--font-geist-sans)", "ui-sans-serif", "system-ui", "-apple-system", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      borderRadius: {
        panel: "var(--radius-panel, 16px)",
        btn: "var(--radius-button, 10px)",
        chip: "var(--radius-chip, 6px)",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      backgroundImage: {
        // 1px hairline grid. Pair with `bg-grid-lg` / `bg-grid-md` for the cell size.
        "grid-slate":
          "linear-gradient(to right, rgb(30 41 59 / 0.55) 1px, transparent 1px), linear-gradient(to bottom, rgb(30 41 59 / 0.55) 1px, transparent 1px)",
        "grid-slate-faint":
          "linear-gradient(to right, rgb(30 41 59 / 0.125) 1px, transparent 1px), linear-gradient(to bottom, rgb(30 41 59 / 0.125) 1px, transparent 1px)",
        "sylva-grid":
          "linear-gradient(to right, rgba(255, 255, 255, 0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.08) 1px, transparent 1px)",
        "sylva-grid-subtle":
          "linear-gradient(to right, rgba(255, 255, 255, 0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.04) 1px, transparent 1px)",
      },
      backgroundSize: {
        "grid-lg": "4rem 4rem",
        "grid-md": "2.5rem 2.5rem",
      },
      boxShadow: {
        // Top inner highlight that gives every elevated card its machined edge.
        "inner-top": "inset 0 1px 0 rgba(255, 255, 255, 0.08)",
        "specular-top": "inset 0 1px 0 0 rgba(255, 255, 255, 0.12)",
        "card-elevated":
          "inset 0 1px 0 rgba(255, 255, 255, 0.08), 0 24px 48px -24px rgba(0, 0, 0, 0.6)",
        "obsidian-elevated":
          "inset 0 1px 0 0 rgba(255, 255, 255, 0.12), 0 28px 64px -20px rgba(0, 0, 0, 0.85)",
        "dossier-card":
          "inset 0 1px 0 0 rgba(255, 255, 255, 0.85), 0 20px 50px -16px rgba(0, 0, 0, 0.65)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        pulseGlow: {
          "0%, 100%": { opacity: "0.4", transform: "scale(1)" },
          "50%": { opacity: "0.8", transform: "scale(1.05)" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(2px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "pulse-glow": "pulseGlow 4s ease-in-out infinite",
        "fade-in": "fade-in 0.18s ease-out both",
      },
    },
  },
  plugins: [
    plugin(({ addBase }) => {
      addBase({
        ":root": {
          "--font-sans":
            'var(--font-geist-sans), ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
          "--font-display":
            'var(--font-geist-sans), ui-sans-serif, system-ui, -apple-system, sans-serif',
          "--font-mono":
            'var(--font-geist-mono), ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
        },
      });
    }),
  ],
};
export default config;
