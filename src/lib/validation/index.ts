import { z } from "zod";

export const signInSchema = z.object({
  email: z.string().email("Please enter a valid company email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  rememberMe: z.boolean().optional(),
});

export const signUpSchema = z.object({
  companyName: z.string().min(2, "Company name must be at least 2 characters").max(100),
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Please enter a valid work email"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  confirmPassword: z.string(),
  website: z.string().url("Please enter a valid URL (e.g. https://example.com)").optional().or(z.literal("")),
  termsAccepted: z.literal(true, {
    errorMap: () => ({ message: "You must accept the Terms of Service and Privacy Policy" }),
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid registered email address"),
});

export const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain at least one uppercase letter")
    .regex(/[0-9]/, "Must contain at least one number"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const assistantConfigSchema = z.object({
  name: z.string().min(2, "Assistant name is required").max(50),
  welcomeMessage: z.string().min(5, "Welcome message is required").max(300),
  description: z.string().max(200).optional(),
  isEnabled: z.boolean(),
  systemPrompt: z.string().min(20, "System instructions must be at least 20 characters").max(3000),
  tone: z.enum(["professional", "friendly", "concise", "empathetic", "custom"]),
  responseLanguage: z.string().min(2),
  fallbackMessage: z.string().min(5, "Fallback message is required").max(300),
  escalationMessage: z.string().min(5, "Escalation message is required").max(300),
  topKChunks: z.number().min(1).max(10),
  minRelevanceScore: z.number().min(0.1).max(1.0),
  includeCitations: z.boolean(),
  showConfidenceScore: z.boolean(),
});

export const companySettingsSchema = z.object({
  name: z.string().min(2, "Company name is required"),
  website: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  supportEmail: z.string().email("Must be a valid support email"),
  defaultLanguage: z.string(),
  timeZone: z.string(),
  brandColor: z.string().regex(/^#([0-9A-F]{3}){1,2}$/i, "Must be a valid hex color code"),
});

export const inviteTeamMemberSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid work email is required"),
  role: z.enum(["admin", "agent"]),
});

export const checkoutSchema = z.object({
  planId: z.enum(["starter", "professional", "enterprise"]),
  billingInterval: z.enum(["month", "year"]),
  paymentProvider: z.enum(["stripe", "razorpay"]),
});
