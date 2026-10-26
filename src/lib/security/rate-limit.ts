import { Redis } from "@upstash/redis";
import { recordRejectedEvent } from "../db/events-store.ts";

/**
 * Tiered Rate Limiting and Account Lockout Engine.
 * Connects to Upstash Redis if environment variables are set;
 * falls back to an in-memory sliding-window map in local test/dev environments.
 */

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
  lockedUntil?: number;
  turnstileRequired?: boolean;
}

export type RateLimitTier =
  | "login"
  | "magic_link"
  | "public_form"
  | "workbench"
  | "api_route"
  | "webhook_route";

const TIER_CONFIGS: Record<RateLimitTier, { limit: number; windowSeconds: number }> = {
  login: { limit: 5, windowSeconds: 900 }, // 5 attempts per 15 minutes
  magic_link: { limit: 3, windowSeconds: 3600 }, // 3 requests per hour
  public_form: { limit: 10, windowSeconds: 60 }, // 10 submissions per minute
  workbench: { limit: 10, windowSeconds: 60 }, // 10 queries per minute
  api_route: { limit: 60, windowSeconds: 60 }, // 60 calls per minute
  webhook_route: { limit: 120, windowSeconds: 60 }, // 120 calls per minute
};

// Account lockout state: identifier -> { failedCount: number, lockedUntil: number, backoffMinutes: number }
interface LockoutState {
  failedCount: number;
  lockedUntil: number;
  backoffMinutes: number;
}

const globalForRateLimit = globalThis as unknown as {
  __aegis_memory_lockouts?: Map<string, LockoutState>;
  __aegis_window_counters?: Map<string, { count: number; resetAt: number }>;
};

const memoryLockouts = globalForRateLimit.__aegis_memory_lockouts || new Map<string, LockoutState>();
const memoryWindowCounters =
  globalForRateLimit.__aegis_window_counters || new Map<string, { count: number; resetAt: number }>();

globalForRateLimit.__aegis_memory_lockouts = memoryLockouts;
globalForRateLimit.__aegis_window_counters = memoryWindowCounters;

function getRedisClient(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token && !url.includes("example") && !url.includes("placeholder")) {
    try {
      return new Redis({ url, token });
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Check if an identifier is locked out or requires Turnstile.
 */
export function checkAuthLockout(ip: string, email?: string): { locked: boolean; reset: number; turnstileRequired: boolean } {
  const now = Date.now();
  const keys = [ip];
  if (email) {
    keys.push(`email:${email.toLowerCase().trim()}`);
  }

  let isLocked = false;
  let maxReset = 0;
  let maxFailures = 0;

  for (const key of keys) {
    const lockout = memoryLockouts.get(key);
    if (lockout) {
      maxFailures = Math.max(maxFailures, lockout.failedCount);
      if (lockout.lockedUntil > now) {
        isLocked = true;
        const resetSec = Math.ceil((lockout.lockedUntil - now) / 1000);
        if (resetSec > maxReset) {
          maxReset = resetSec;
        }
      }
    }
  }

  return {
    locked: isLocked,
    reset: maxReset,
    turnstileRequired: maxFailures >= 2,
  };
}

/**
 * Record a failed authentication attempt to trigger account lockout with exponential backoff.
 * Writes failure to security events so owner console can inspect it.
 */
export function recordAuthFailure(ip: string, email?: string): {
  locked: boolean;
  lockedUntil?: number;
  reset: number;
  turnstileRequired: boolean;
} {
  const now = Date.now();
  const keys = [ip];
  if (email) {
    keys.push(`email:${email.toLowerCase().trim()}`);
  }
  let isLocked = false;
  let maxReset = 0;
  let maxFailures = 0;
  let maxLockedUntil: number | undefined = undefined;

  for (const key of keys) {
    let state = memoryLockouts.get(key);
    if (!state) {
      state = { failedCount: 1, lockedUntil: 0, backoffMinutes: 15 };
    } else if (state.lockedUntil > 0 && state.lockedUntil <= now) {
      state = { failedCount: 1, lockedUntil: 0, backoffMinutes: Math.min(120, state.backoffMinutes * 2) };
    } else {
      state.failedCount += 1;
    }

    maxFailures = Math.max(maxFailures, state.failedCount);

    if (state.failedCount >= 5) {
      state.lockedUntil = now + state.backoffMinutes * 60 * 1000;
      isLocked = true;
      maxLockedUntil = state.lockedUntil;
      const resetSec = Math.ceil((state.lockedUntil - now) / 1000);
      if (resetSec > maxReset) {
        maxReset = resetSec;
      }
    }

    memoryLockouts.set(key, state);
  }

  // Record to security events log for owner console (non-blocking)
  try {
    recordRejectedEvent({
      org_id: "system",
      client_ip: ip,
      reason: `Auth failure: 5-threshold brute-force tracker for target ${email ? email.slice(0, 3) + "***" : ip}`,
      signature_received: "auth_fail_" + Date.now(),
      timestamp: new Date().toISOString(),
    }).catch(() => {});
  } catch {
    // Non-blocking security event capture
  }

  return {
    locked: isLocked,
    lockedUntil: maxLockedUntil,
    reset: maxReset,
    turnstileRequired: maxFailures >= 2,
  };
}

/**
 * Clear lockout and reset failed count on successful authentication.
 */
export function clearAuthLockout(ip: string, email?: string): void {
  memoryLockouts.delete(ip);
  if (email) {
    memoryLockouts.delete(`email:${email.toLowerCase().trim()}`);
  }
  memoryWindowCounters.delete(`aegis:ratelimit:login:${ip}`);
}

/**
 * Check and record a rate limit hit for a given tier and identifier (IP or user ID).
 */
export async function checkRateLimit(
  tier: RateLimitTier,
  identifier: string
): Promise<RateLimitResult> {
  const config = TIER_CONFIGS[tier];
  const now = Date.now();
  const redis = getRedisClient();
  const key = `aegis:ratelimit:${tier}:${identifier}`;

  // 1. If tier is login, check if account is currently locked out
  if (tier === "login") {
    const lockout = memoryLockouts.get(identifier);
    if (lockout && lockout.lockedUntil > now) {
      return {
        success: false,
        limit: config.limit,
        remaining: 0,
        reset: Math.ceil((lockout.lockedUntil - now) / 1000),
        lockedUntil: lockout.lockedUntil,
      };
    }
  }

  // 2. Use Upstash Redis if configured
  if (redis) {
    try {
      const current = await redis.incr(key);
      if (current === 1) {
        await redis.expire(key, config.windowSeconds);
      }
      const ttl = await redis.ttl(key);
      return {
        success: current <= config.limit,
        limit: config.limit,
        remaining: Math.max(0, config.limit - current),
        reset: ttl > 0 ? ttl : config.windowSeconds,
      };
    } catch {
      // Fall through to in-memory fallback on Redis failure
    }
  }

  // 3. In-memory sliding window fallback
  const record = memoryWindowCounters.get(key);
  if (!record || record.resetAt <= now) {
    memoryWindowCounters.set(key, { count: 1, resetAt: now + config.windowSeconds * 1000 });
    return {
      success: true,
      limit: config.limit,
      remaining: config.limit - 1,
      reset: config.windowSeconds,
    };
  }

  record.count += 1;
  const resetSec = Math.ceil((record.resetAt - now) / 1000);

  if (record.count > config.limit) {
    return {
      success: false,
      limit: config.limit,
      remaining: 0,
      reset: resetSec,
    };
  }

  return {
    success: true,
    limit: config.limit,
    remaining: config.limit - record.count,
    reset: resetSec,
  };
}
