import type { TargetingRule } from "./types";

export const TARGETING_DIMENSIONS = ["destination", "month", "nights", "party", "budget", "interests", "surface"] as const;
export type TargetingDimension = (typeof TARGETING_DIMENSIONS)[number];

// Which operators make sense per dimension (drives the CMS dropdowns).
export const OPS_BY_DIMENSION: Record<TargetingDimension, TargetingRule["op"][]> = {
  destination: ["in", "is"],
  month: ["is"],
  nights: ["gte", "lte"],
  party: ["is", "in"],
  budget: ["in", "is"],
  interests: ["contains_any"],
  surface: ["is"],
};

export const isListOp = (op: TargetingRule["op"]) => op === "in" || op === "contains_any";

export function emptyTargetingRule(): TargetingRule {
  return { dimension: "interests", op: "contains_any", value: [] };
}

// Human-readable summary for the CMS table / preview.
export function describeRule(r: TargetingRule): string {
  const v = Array.isArray(r.value) ? r.value.join(", ") : String(r.value);
  const verb = r.op === "contains_any" ? "contains any of" : r.op;
  return `${r.dimension} ${verb} ${v}`;
}
