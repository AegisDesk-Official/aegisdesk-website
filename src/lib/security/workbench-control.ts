import { Redis } from "@upstash/redis";

function safeLog(message: string): void {
  if (process.env.NODE_ENV !== "test") {
    console.log(`[AegisDesk SecOps] ${message}`);
  }
}

export interface WorkbenchControlState {
  killSwitchActive: boolean;
  killSwitchReason?: string;
  killSwitchEngagedAt?: string;
  dailyCapUsd: number;
  todaySpendUsd: number;
  totalCallsToday: number;
  isCapReached: boolean;
  date: string;
}

// Global persistent state for development and edge instances
const globalForWorkbench = globalThis as unknown as {
  __aegis_workbench_kill_switch?: { active: boolean; reason?: string; engagedAt?: string };
  __aegis_workbench_spend?: Record<string, { spendUsd: number; calls: number; alerted: boolean }>;
};

if (!globalForWorkbench.__aegis_workbench_kill_switch) {
  globalForWorkbench.__aegis_workbench_kill_switch = {
    active: false,
    reason: "",
  };
}

if (!globalForWorkbench.__aegis_workbench_spend) {
  globalForWorkbench.__aegis_workbench_spend = {};
}

function getTodayString(): string {
  return new Date().toISOString().slice(0, 10);
}

export function getDailySpendCap(): number {
  const envVal = process.env.DEMO_DAILY_SPEND_CAP_USD?.trim();
  if (!envVal) return 10.0; // Default $10.00 daily spend cap
  const parsed = Number.parseFloat(envVal);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 10.0;
}

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

async function notifyOwnerOfSpendCapBreach(totalSpendUsd: number, dailyCapUsd: number, date: string) {
  try {
    const resendMod = await import("@/lib/email/resend").catch(() => null);
    if (resendMod?.sendDemoSpendCapReachedEmail) {
      await resendMod.sendDemoSpendCapReachedEmail({ totalSpendUsd, dailyCapUsd, date });
    }
  } catch {
    // Fail silently in tests or preview mode
  }
}

/**
 * Checks whether the operator kill switch is engaged.
 */
export async function isWorkbenchKillSwitchEngaged(): Promise<{ engaged: boolean; reason?: string }> {
  const redis = getRedisClient();
  if (redis) {
    try {
      const data = await redis.get<{ active: boolean; reason?: string }>("aegis:workbench:kill_switch");
      if (data && typeof data.active === "boolean") {
        return { engaged: data.active, reason: data.reason };
      }
    } catch {
      // Fall through to memory
    }
  }

  const memoryState = globalForWorkbench.__aegis_workbench_kill_switch;
  return {
    engaged: !!memoryState?.active,
    reason: memoryState?.reason,
  };
}

/**
 * Toggles or updates the operator kill switch.
 */
export async function setWorkbenchKillSwitch(
  active: boolean,
  reason = "Operations manual override"
): Promise<{ success: boolean; active: boolean; reason: string }> {
  const timestamp = new Date().toISOString();
  const state = { active, reason, engagedAt: timestamp };

  const redis = getRedisClient();
  if (redis) {
    try {
      await redis.set("aegis:workbench:kill_switch", state);
    } catch {
      // Fall through to memory
    }
  }

  globalForWorkbench.__aegis_workbench_kill_switch = state;
  safeLog(`Workbench Kill Switch ${active ? "ENGAGED" : "DISENGAGED"} — Reason: ${reason}`);

  return { success: true, active, reason };
}

/**
 * Retrieves the current daily spend telemetry for the workbench.
 */
export async function getWorkbenchSpendTelemetry(): Promise<WorkbenchControlState> {
  const date = getTodayString();
  const cap = getDailySpendCap();
  const killSwitch = await isWorkbenchKillSwitchEngaged();

  const redis = getRedisClient();
  let spendUsd = 0;
  let calls = 0;

  if (redis) {
    try {
      const rawSpend = await redis.get<string>(`aegis:workbench:spend:${date}`);
      const rawCalls = await redis.get<number>(`aegis:workbench:calls:${date}`);
      spendUsd = rawSpend ? Number.parseFloat(rawSpend) : 0;
      calls = rawCalls || 0;
    } catch {
      // Fall through
    }
  }

  if (spendUsd === 0 && calls === 0) {
    const mem = globalForWorkbench.__aegis_workbench_spend?.[date];
    if (mem) {
      spendUsd = mem.spendUsd;
      calls = mem.calls;
    }
  }

  return {
    killSwitchActive: killSwitch.engaged,
    killSwitchReason: killSwitch.reason,
    killSwitchEngagedAt: globalForWorkbench.__aegis_workbench_kill_switch?.engagedAt,
    dailyCapUsd: cap,
    todaySpendUsd: Number(spendUsd.toFixed(4)),
    totalCallsToday: calls,
    isCapReached: spendUsd >= cap,
    date,
  };
}

/**
 * Records an incremental cost in USD for an executed workbench call.
 * If the daily spend cap is crossed, emails the owner immediately.
 */
export async function recordWorkbenchCost(costUsd: number): Promise<{
  newTotalUsd: number;
  capExceeded: boolean;
}> {
  const date = getTodayString();
  const cap = getDailySpendCap();
  const redis = getRedisClient();

  let newTotal = costUsd;
  let wasAlerted = false;

  // 1. Update in-memory tracker
  if (!globalForWorkbench.__aegis_workbench_spend) {
    globalForWorkbench.__aegis_workbench_spend = {};
  }
  const mem = globalForWorkbench.__aegis_workbench_spend[date] || { spendUsd: 0, calls: 0, alerted: false };
  mem.spendUsd += costUsd;
  mem.calls += 1;
  newTotal = mem.spendUsd;
  wasAlerted = mem.alerted;
  globalForWorkbench.__aegis_workbench_spend[date] = mem;

  // 2. Update Upstash Redis if configured
  if (redis) {
    try {
      await redis.incrbyfloat(`aegis:workbench:spend:${date}`, costUsd);
      await redis.incr(`aegis:workbench:calls:${date}`);
      await redis.expire(`aegis:workbench:spend:${date}`, 86400 * 2);
      await redis.expire(`aegis:workbench:calls:${date}`, 86400 * 2);
    } catch {
      // Fall through
    }
  }

  // 3. Email owner if spend cap is reached for the first time today
  const capExceeded = newTotal >= cap;
  if (capExceeded && !wasAlerted) {
    mem.alerted = true;
    safeLog(`Workbench daily spend cap of $${cap.toFixed(2)} exceeded! Dispatching owner alert email.`);
    void notifyOwnerOfSpendCapBreach(newTotal, cap, date);
  }

  return {
    newTotalUsd: Number(newTotal.toFixed(4)),
    capExceeded,
  };
}
