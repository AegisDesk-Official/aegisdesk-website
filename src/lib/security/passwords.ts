/**
 * Password validation and common password blocklist.
 * Enforces minimum 12 characters and rejects predictable common passwords.
 */

// Top common passwords list (normalized lowercase)
export const COMMON_PASSWORDS = new Set([
  "123456789012",
  "1234567890123",
  "password1234",
  "password12345",
  "qwertyuiop12",
  "qwertyuiopas",
  "admin1234567",
  "admin12345678",
  "administrator",
  "welcome12345",
  "changeme1234",
  "iloveyou1234",
  "letmein12345",
  "trustnoone12",
  "sunshine1234",
  "supersecret1",
  "monkey123456",
  "dragon123456",
  "master123456",
  "football1234",
  "baseball1234",
  "pass12345678",
  "abc123456789",
  "company12345",
  "support12345",
  "aegisdesk123",
  "aegisdesk1234",
]);

export interface PasswordValidationResult {
  valid: boolean;
  error?: string;
}

export function validatePassword(password: string): PasswordValidationResult {
  if (!password || password.length < 12) {
    return {
      valid: false,
      error: "Password must be at least 12 characters long.",
    };
  }

  const normalized = password.toLowerCase().trim();
  if (COMMON_PASSWORDS.has(normalized)) {
    return {
      valid: false,
      error: "This password is too common or easily guessed. Please choose a more unique phrase.",
    };
  }

  // Check for repeated single characters like "aaaaaaaaaaaa"
  if (/^(.)\1+$/.test(password)) {
    return {
      valid: false,
      error: "Password cannot consist of a single repeated character.",
    };
  }

  return { valid: true };
}
