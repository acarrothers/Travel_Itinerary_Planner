import type { Offer, TargetingRule, TripSignals } from "./types";

/**
 * Normalize a destination string into comparable tokens. "Lisbon, Portugal"
 * becomes ["lisbon, portugal", "lisbon", "portugal"] — the full string plus each
 * comma-separated part — so a city-level or country-level target both match, and
 * a user who typed only "Lisbon" still matches an offer targeting "Lisbon, Portugal".
 */
export function destinationTokens(s: string): string[] {
  const norm = s.trim().toLowerCase();
  if (!norm) return [];
  const parts = norm.split(",").map((p) => p.trim()).filter(Boolean);
  return parts.length > 1 ? [norm, ...parts] : [norm];
}

/** True when the offer is scoped to specific places (has a destination rule). */
export function isLocalizedOffer(o: Offer): boolean {
  return o.targeting.some((r) => r.dimension === "destination");
}

function destinationMatches(rule: TargetingRule, s: TripSignals): boolean {
  const userTokens = new Set(s.destinations.flatMap(destinationTokens));
  return asArray(rule.value).some((v) =>
    destinationTokens(String(v)).some((t) => userTokens.has(t)));
}

function ruleMatches(rule: TargetingRule, s: TripSignals): boolean {
  switch (rule.dimension) {
    case "destination": return destinationMatches(rule, s);
    case "month": return rule.value === s.month;
    case "nights": return compareNum(rule, s.nights);
    case "party": return asArray(rule.value).includes(s.party);
    case "budget": return asArray(rule.value).includes(s.budget);
    case "interests": return s.interests.some((i) => asArray(rule.value).includes(i));
    default: return true;
  }
}

// Filter to eligible offers, then rank: localized (destination-scoped) offers first
// so a place-specific deal outranks a global one for the same need, then by priority.
export function matchOffers(signals: TripSignals, offers: Offer[]): Offer[] {
  return offers
    .filter((o) => o.status === "live" && o.targeting.every((r) => ruleMatches(r, signals)))
    .sort((a, b) => Number(isLocalizedOffer(b)) - Number(isLocalizedOffer(a)) || b.priority - a.priority);
}

function asArray(v: unknown): unknown[] { return Array.isArray(v) ? v : [v]; }
function compareNum(rule: TargetingRule, n: number): boolean {
  const v = Number(rule.value);
  if (rule.op === "gte") return n >= v;
  if (rule.op === "lte") return n <= v;
  return n === v;
}
