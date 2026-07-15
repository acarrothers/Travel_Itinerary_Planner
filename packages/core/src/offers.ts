import type { Offer, TargetingRule, TripSignals } from "./types";

function ruleMatches(rule: TargetingRule, s: TripSignals): boolean {
  switch (rule.dimension) {
    case "destination": return s.destinations.some((d) => asArray(rule.value).includes(d));
    case "month": return rule.value === s.month;
    case "nights": return compareNum(rule, s.nights);
    case "party": return asArray(rule.value).includes(s.party);
    case "budget": return asArray(rule.value).includes(s.budget);
    case "interests": return s.interests.some((i) => asArray(rule.value).includes(i));
    default: return true;
  }
}

// Filter to eligible offers, then rank by relevance × priority (PRD §7.3).
export function matchOffers(signals: TripSignals, offers: Offer[]): Offer[] {
  return offers
    .filter((o) => o.status === "live" && o.targeting.every((r) => ruleMatches(r, signals)))
    .sort((a, b) => b.priority - a.priority);
}

function asArray(v: unknown): unknown[] { return Array.isArray(v) ? v : [v]; }
function compareNum(rule: TargetingRule, n: number): boolean {
  const v = Number(rule.value);
  if (rule.op === "gte") return n >= v;
  if (rule.op === "lte") return n <= v;
  return n === v;
}
