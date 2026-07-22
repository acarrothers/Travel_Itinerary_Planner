import type { Offer, TripPreferences, TripSignals } from "./types";
import { matchOffers } from "./offers";

/**
 * A travel need inferred from a trip: something the traveller will plausibly want
 * to sort out, independent of any specific partner. Needs are the organising unit
 * of the offer finder — we infer needs first, then map catalog offers onto them.
 */
export interface TravelNeed {
  id: string;
  label: string;
  rationale: string;    // shown to the user: why we think they need this
  categories: string[]; // offer categories that satisfy the need
  priority: number;     // higher sorts first
}

export interface NeedGroup {
  need: TravelNeed;
  offers: Offer[];
}

/** Build offer-matching signals straight from preferences (no itinerary required). */
export function signalsFromPreferences(p: TripPreferences): TripSignals {
  return {
    destinations: p.destinations,
    month: p.startDate ? p.startDate.slice(5, 7) : p.flexibleMonth,
    nights: p.nights,
    party: p.party,
    budget: p.budget,
    interests: p.interests,
    itemTags: [],
  };
}

/**
 * Deterministic needs inference. This is the fallback used when no AI provider is
 * configured, and also the guardrail the AI path is validated against — the AI may
 * reorder or reword needs, but every need it returns must exist here, so it can't
 * invent a category the catalog has no offers for.
 */
export function inferNeeds(p: TripPreferences): TravelNeed[] {
  const needs: TravelNeed[] = [];
  const nights = Math.max(0, p.nights ?? 0);
  const travellers = (p.adults ?? 0) + (p.children ?? 0);
  const interests = p.interests ?? [];
  const has = (...xs: string[]) => xs.some((x) => interests.includes(x));

  if (nights >= 1) {
    needs.push({
      id: "accommodation", label: "Somewhere to stay",
      rationale: `You'll need ${nights} ${nights === 1 ? "night" : "nights"} of accommodation.`,
      categories: ["accommodation"], priority: 100,
    });
  }

  if (has("culture", "history", "food", "adventure", "nature", "nightlife")) {
    needs.push({
      id: "experiences", label: "Things to do",
      rationale: `Matched to your interests: ${interests.join(", ")}.`,
      categories: ["tours", "activities"], priority: 95,
    });
  } else if (nights >= 1) {
    needs.push({
      id: "experiences", label: "Things to do",
      rationale: "Popular tours and activities at your destination.",
      categories: ["tours", "activities"], priority: 90,
    });
  }

  if (nights >= 1) {
    needs.push({
      id: "insurance", label: "Travel insurance",
      rationale: "Cover for cancellations, delays and medical costs while you're away.",
      categories: ["insurance"], priority: 80,
    });
  }

  if (nights >= 3) {
    needs.push({
      id: "connectivity", label: "Staying connected",
      rationale: `A data plan is usually cheaper than roaming on a ${nights}-night trip.`,
      categories: ["esim"], priority: 70,
    });
  }

  if (nights >= 2) {
    needs.push({
      id: "transfers", label: "Getting from the airport",
      rationale: "Pre-booked transfers avoid queues and surge pricing on arrival.",
      categories: ["transfer"], priority: 60,
    });
  }

  if (nights >= 6) {
    needs.push({
      id: "getting_around", label: "Getting around",
      rationale: `On a ${nights}-night trip, a rail pass or car hire often beats per-trip fares.`,
      categories: ["car_hire", "rail"], priority: 50,
    });
  }

  if (p.budget === "luxury" || travellers >= 4) {
    needs.push({
      id: "comfort", label: "Travel comfort",
      rationale: p.budget === "luxury"
        ? "Matched to your luxury budget."
        : `Worth it for a group of ${travellers}.`,
      categories: ["lounge"], priority: 40,
    });
  }

  return needs.sort((a, b) => b.priority - a.priority);
}

/**
 * Map inferred needs onto eligible catalog offers. Offers are filtered by the same
 * targeting rules used elsewhere, so the CMS stays the single source of truth for
 * who sees what. Needs with no matching offer are dropped — we never show an empty
 * recommendation.
 */
export function matchOffersToNeeds(
  needs: TravelNeed[],
  offers: Offer[],
  signals: TripSignals,
): NeedGroup[] {
  const eligible = matchOffers(signals, offers);
  return needs
    .map((need) => ({
      need,
      offers: eligible.filter((o) => need.categories.includes(o.category)),
    }))
    .filter((g) => g.offers.length > 0);
}

/**
 * Reconcile an AI-proposed need ordering with the deterministic set. Anything the
 * model invents is discarded; anything it omits is appended in default order. This
 * keeps AI useful for prioritisation without letting it fabricate recommendations.
 */
export function reconcileNeeds(aiNeedIds: string[], fallback: TravelNeed[]): TravelNeed[] {
  const byId = new Map(fallback.map((n) => [n.id, n]));
  const ordered: TravelNeed[] = [];
  for (const id of aiNeedIds) {
    const need = byId.get(id);
    if (need && !ordered.includes(need)) ordered.push(need);
  }
  for (const need of fallback) if (!ordered.includes(need)) ordered.push(need);
  return ordered;
}
