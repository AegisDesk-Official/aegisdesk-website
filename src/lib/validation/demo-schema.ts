import { z } from "zod";
import { DEMO_LIMITS } from "./demo-types";

/** Strips control characters and collapses whitespace. */
function cleanMessage(value: string): string {
  // eslint-disable-next-line no-control-regex
  return value.replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim();
}

export const demoRequestSchema = z.object({
  message: z
    .string({ required_error: "Type a question first." })
    .transform(cleanMessage)
    .pipe(
      z
        .string()
        .min(1, "Type a question first.")
        .max(
          DEMO_LIMITS.maxMessageChars,
          `Demo questions are limited to ${DEMO_LIMITS.maxMessageChars} characters.`
        )
    ),
  email: z
    .string({ required_error: "Enter your work email." })
    .trim()
    .toLowerCase()
    .max(254, "Enter a valid work email.")
    .email("Enter a valid work email."),
  /** Digits only after cleaning: "+91 98765 43210" becomes "919876543210". */
  phone: z
    .string({ required_error: "Enter your phone number." })
    .max(40, "Enter a valid phone number.")
    .transform((v) => v.replace(/\D/g, ""))
    .pipe(z.string().regex(/^\d{8,15}$/, "Enter a phone number with 8 to 15 digits.")),
  company: z.string().trim().max(120).optional().default(""),
  consent: z.literal(true, {
    errorMap: () => ({ message: "Please accept the privacy notice to use the demo." }),
  }),
  turnstileToken: z.string().max(4096).optional(),
});

export type DemoRequest = z.infer<typeof demoRequestSchema>;
