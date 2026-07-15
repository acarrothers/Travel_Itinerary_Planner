import type { Trip, TripSignals } from "./types";

// Extract the matching signals the offers engine needs from a generated trip.
export function extractSignals(trip: Trip): TripSignals {
  const itemTags = new Set<string>();
  for (const day of trip.days) for (const item of day.items) item.categoryTags.forEach((t) => itemTags.add(t));
  const p = trip.preferences;
  return {
    destinations: p.destinations,
    month: p.startDate ? p.startDate.slice(5, 7) : p.flexibleMonth,
    nights: p.nights,
    party: p.party,
    budget: p.budget,
    interests: p.interests,
    itemTags: [...itemTags],
  };
}

// TODO: replace with a real schema validator (zod recommended) per PRD 6.9 guardrails.
export function isValidTrip(trip: Trip): boolean {
  return Array.isArray(trip.days) && trip.days.every((d) => Array.isArray(d.items));
}
