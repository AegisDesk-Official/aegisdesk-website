/**
 * Server-side limits for the public demo. Server only: never import this
 * from a client component.
 *
 * All limits are counted in Redis (Upstash) in ONE atomic script, so either
 * every counter has room and all of them go up, or none of them change.
 * In production, if Upstash is not configured, getLimitStore() returns null
 * and the API refuses to answer ("fail closed"). The in-memory store exists
 * for local development only, because on Vercel every request can land on a
 * different server and memory counts would reset constantly.
 */
import { createHash } from "node:crypto";
import { Redis } from "@upstash/redis";
import { DEMO_LIMITS } from "@/lib/validation/demo-types";

export type RuleId = "email" | "phone" | "ip" | "global_day" | "global_month";

export interface Rule {
  id: RuleId;
  key: string;
  limit: number;
  ttlSeconds: number;
}

export type ConsumeResult =
  | { ok: true; counts: Record<RuleId, number> }
  | { ok: false; blockedBy: RuleId };

export interface LimitStore {
  /** All-or-nothing: increments every rule only if every rule has room. */
  consume(rules: Rule[]): Promise<ConsumeResult>;
  /** Gives back one question on the given rules (used when the backend fails). */
  refund(rules: Rule[]): Promise<void>;
  has(key: string): Promise<boolean>;
  mark(key: string, ttlSeconds: number): Promise<void>;
}

const DAY = 86_400;
const MONTH = 30 * DAY;

export function sha(value: string): string {
  return createHash("sha256").update(value).digest("hex").slice(0, 24);
}

/**
 * Collapses addresses that reach the same inbox, so john+1@x.com and
 * j.ohn@gmail.com cannot be used to get extra questions.
 */
export function normalizeEmailForLimit(email: string): string {
  const [rawLocal = "", rawDomain = ""] = email.toLowerCase().trim().split("@");
  let local = rawLocal.split("+")[0];
  let domain = rawDomain;
  if (domain === "gmail.com" || domain === "googlemail.com") {
    local = local.replace(/\./g, "");
    domain = "gmail.com";
  }
  return `${local}@${domain}`;
}

function intFromEnv(name: string, fallback: number): number {
  const raw = process.env[name]?.trim();
  if (!raw) return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

export function leadKey(email: string): string {
  return `aegis:demo:lead:${sha(normalizeEmailForLimit(email))}`;
}

export const LEAD_TTL_SECONDS = MONTH;

export function buildRules(input: { email: string; phoneDigits: string; ip: string }, now = new Date()): Rule[] {
  const day = now.toISOString().slice(0, 10);
  const month = now.toISOString().slice(0, 7);
  return [
    {
      id: "email",
      key: `aegis:demo:email:${sha(normalizeEmailForLimit(input.email))}`,
      limit: DEMO_LIMITS.perEmail,
      ttlSeconds: MONTH,
    },
    {
      id: "phone",
      key: `aegis:demo:phone:${sha(input.phoneDigits)}`,
      limit: DEMO_LIMITS.perPhone,
      ttlSeconds: MONTH,
    },
    {
      id: "ip",
      key: `aegis:demo:ip:${sha(input.ip)}`,
      limit: DEMO_LIMITS.perIpPerDay,
      ttlSeconds: DAY,
    },
    {
      id: "global_day",
      key: `aegis:demo:global:day:${day}`,
      limit: intFromEnv("DEMO_DAILY_GLOBAL_CAP", 100),
      ttlSeconds: 2 * DAY,
    },
    {
      id: "global_month",
      key: `aegis:demo:global:month:${month}`,
      limit: intFromEnv("DEMO_MONTHLY_CAP", 1000),
      ttlSeconds: 35 * DAY,
    },
  ];
}

/* ------------------------------ Upstash store ------------------------------ */

// KEYS = counters. ARGV = limit1, ttl1, limit2, ttl2, ...
// Returns {0, blockedIndex} or {1, count1, count2, ...}.
const CONSUME_LUA = `
local n = #KEYS
for i = 1, n do
  local v = redis.call('GET', KEYS[i])
  local c = 0
  if v then c = tonumber(v) end
  if c >= tonumber(ARGV[2 * i - 1]) then
    return {0, i}
  end
end
local res = {1}
for i = 1, n do
  local c = redis.call('INCR', KEYS[i])
  if c == 1 then
    redis.call('EXPIRE', KEYS[i], tonumber(ARGV[2 * i]))
  end
  res[#res + 1] = c
end
return res
`;

const REFUND_LUA = `
for i = 1, #KEYS do
  local v = redis.call('GET', KEYS[i])
  if v and tonumber(v) > 0 then
    redis.call('DECR', KEYS[i])
  end
end
return 1
`;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("limit store timeout")), ms);
    promise.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (e) => {
        clearTimeout(timer);
        reject(e);
      }
    );
  });
}

function createUpstashStore(url: string, token: string): LimitStore {
  const redis = new Redis({ url, token, retry: { retries: 2, backoff: () => 150 } });
  return {
    async consume(rules) {
      const args: number[] = [];
      for (const r of rules) args.push(r.limit, r.ttlSeconds);
      const out = (await withTimeout(
        redis.eval(CONSUME_LUA, rules.map((r) => r.key), args),
        5000
      )) as number[];
      if (!Array.isArray(out) || out.length < 2) throw new Error("unexpected limit store reply");
      if (Number(out[0]) === 0) {
        return { ok: false, blockedBy: rules[Number(out[1]) - 1].id };
      }
      const counts = {} as Record<RuleId, number>;
      rules.forEach((r, i) => {
        counts[r.id] = Number(out[i + 1]);
      });
      return { ok: true, counts };
    },
    async refund(rules) {
      await withTimeout(redis.eval(REFUND_LUA, rules.map((r) => r.key), []), 5000);
    },
    async has(key) {
      return (await withTimeout(redis.exists(key), 5000)) === 1;
    },
    async mark(key, ttlSeconds) {
      await withTimeout(redis.set(key, "1", { ex: ttlSeconds }), 5000);
    },
  };
}

/* ------------------------- In-memory store (dev only) ------------------------- */

interface Entry {
  count: number;
  expiresAt: number;
}

const globalForMemory = globalThis as unknown as { __aegisDemoMemory?: Map<string, Entry> };

function createMemoryStore(): LimitStore {
  const map = (globalForMemory.__aegisDemoMemory ??= new Map<string, Entry>());
  const live = (key: string, now: number): Entry | undefined => {
    const e = map.get(key);
    if (e && e.expiresAt <= now) {
      map.delete(key);
      return undefined;
    }
    return e;
  };
  return {
    async consume(rules) {
      const now = Date.now();
      if (map.size > 5000) {
        map.forEach((e, k) => {
          if (e.expiresAt <= now) map.delete(k);
        });
      }
      for (const r of rules) {
        if ((live(r.key, now)?.count ?? 0) >= r.limit) return { ok: false, blockedBy: r.id };
      }
      const counts = {} as Record<RuleId, number>;
      for (const r of rules) {
        const e = live(r.key, now) ?? { count: 0, expiresAt: now + r.ttlSeconds * 1000 };
        e.count += 1;
        map.set(r.key, e);
        counts[r.id] = e.count;
      }
      return { ok: true, counts };
    },
    async refund(rules) {
      const now = Date.now();
      for (const r of rules) {
        const e = live(r.key, now);
        if (e && e.count > 0) e.count -= 1;
      }
    },
    async has(key) {
      return !!live(key, Date.now());
    },
    async mark(key, ttlSeconds) {
      map.set(key, { count: 1, expiresAt: Date.now() + ttlSeconds * 1000 });
    },
  };
}

/* ---------------------------------- Picker ---------------------------------- */

let upstashStore: LimitStore | null = null;
let upstashKey = "";

/**
 * Upstash when configured. In-memory ONLY outside production. In production
 * without Upstash this returns null and the caller must answer 503.
 */
export function getLimitStore(): LimitStore | null {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (url && token) {
    const id = `${url}|${token}`;
    if (!upstashStore || upstashKey !== id) {
      upstashStore = createUpstashStore(url, token);
      upstashKey = id;
    }
    return upstashStore;
  }
  if (process.env.NODE_ENV !== "production") return createMemoryStore();
  return null;
}
