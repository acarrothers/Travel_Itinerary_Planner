import type { Trip } from "@trip-itinerary/core";

// Apply an edited day-set onto the original trip, preserving identity + preferences
// (the model returns updated days; we never let it rewrite the trip id/owner).
export function mergeEditedTrip(original: Trip, edited: Trip): Trip {
  return { ...original, days: edited.days, updatedAt: new Date().toISOString() };
}
