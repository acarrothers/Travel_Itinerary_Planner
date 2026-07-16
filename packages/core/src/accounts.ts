// User + account-type rate limiting (pure domain logic). The password hash never
// appears here — it lives only in the API's user repository.
export type AccountType = string; // "general" | "pro" | "unlimited" | custom

export interface User {
  id: string;
  email: string;
  accountType: AccountType;
  createdAt: string;
}

export interface RateLimitStatus {
  limit: number;      // trips allowed per 24h; -1 = unlimited
  used: number;       // trips created in the window
  remaining: number;  // -1 = unlimited
  allowed: boolean;   // may create another trip now
}

// Resolve the daily trip limit for an account type from a configurable map.
// Falls back to the "general" baseline when the type is unknown.
export function dailyLimitFor(accountType: AccountType, limits: Record<string, number>, fallback = 1): number {
  const v = limits[accountType];
  return typeof v === "number" ? v : (typeof limits.general === "number" ? limits.general : fallback);
}

// Decide whether another trip is allowed given usage in the last 24h.
export function evaluateRateLimit(used: number, limit: number): RateLimitStatus {
  const unlimited = limit < 0;
  return {
    limit,
    used,
    remaining: unlimited ? -1 : Math.max(0, limit - used),
    allowed: unlimited || used < limit,
  };
}
