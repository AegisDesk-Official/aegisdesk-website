/** Shared between the demo API (server) and the demo chat (browser). No secrets here. */

export const DEMO_LIMITS = {
  maxMessageChars: 250,
  perEmail: 5,
  perPhone: 5,
  perIpPerDay: 10,
} as const;

export const DEMO_UNAVAILABLE_MESSAGE =
  "The demo is being updated. Contact our team and we will run it live on your documents.";

export interface DemoCitation {
  source: string;
  page?: number;
  snippet: string;
}

export interface DemoAnswer {
  answer: string;
  /** True when the system could not verify an answer and passed it to a human. */
  escalated: boolean;
  /** 0 to 1. Only set when the backend sends one. */
  groundingScore?: number;
  citations: DemoCitation[];
}

export interface DemoApiSuccess extends DemoAnswer {
  /** Questions this visitor has left (the lowest of the per-person limits). */
  remaining: number;
  limit: number;
}

export type DemoErrorCode =
  | "disabled"
  | "unavailable"
  | "invalid"
  | "verification_failed"
  | "forbidden"
  | "rate_limited";

export interface DemoApiError {
  error: string;
  code: DemoErrorCode;
}

export const FREE_EMAIL_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "yahoo.co.in",
  "yahoo.co.uk",
  "ymail.com",
  "outlook.com",
  "hotmail.com",
  "live.com",
  "msn.com",
  "icloud.com",
  "me.com",
  "proton.me",
  "protonmail.com",
  "aol.com",
  "gmx.com",
  "gmx.net",
  "mail.com",
  "zoho.com",
  "yandex.com",
  "rediffmail.com",
]);
