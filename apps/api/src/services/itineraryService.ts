import { isValidTrip, attachPoiCoords, type Trip, type TripPreferences } from "@trip-itinerary/core";
import { getRouter } from "../aiSetup.js";
import { getPois } from "./poi.js";
import { parseItinerary } from "./parseItinerary.js";
import { buildTrip } from "./mockGenerator.js";
import { mergeEditedTrip } from "./edit.js";

const router = getRouter();

function genPrompt(prefs: TripPreferences, placeNames: string[]): string {
  const grounding = placeNames.length
    ? ` Prefer these real places where they fit: ${placeNames.slice(0, 20).join("; ")}.`
    : "";
  const dayCount = Math.max(1, prefs.nights);
  return [
    `Create a detailed ${prefs.nights}-night travel itinerary for ${prefs.destinations.join(", ")}.`,
    `The "days" array MUST contain exactly ${dayCount} day objects — one per day — each with 4-6 items covering morning, lunch, afternoon and dinner.`,
    `Party: ${prefs.party}; budget: ${prefs.budget}; pace: ${prefs.pace}; interests: ${prefs.interests.join(", ")}.`,
    `Use specific, real, named places (e.g. actual restaurants, museums, neighbourhoods) — not generic labels like "local restaurant".`,
    `For each item include: a specific "title", a "time" (HH:MM), a one-sentence "description", a short practical "tip", and "categoryTags".`,
    grounding,
    `Respond with ONLY JSON of shape: {"days":[{"items":[{"type":"activity|meal","title":"...","time":"HH:MM","description":"...","tip":"...","categoryTags":["..."]}]}]}.`,
  ].join(" ");
}

// Guarantee the trip has exactly `nights` days regardless of what the model
// returned — models sometimes emit a single day. Extra days are trimmed; missing
// days are filled from the deterministic generator, then day.order is renumbered.
function enforceDayCount(trip: Trip, prefs: TripPreferences, pois: Parameters<typeof buildTrip>[1]): Trip {
  const expected = Math.max(1, prefs.nights);
  let days = trip.days.slice(0, expected);
  if (days.length < expected) {
    const filler = buildTrip(prefs, pois).days;
    for (let i = days.length; i < expected; i++) days.push(filler[i] ?? filler[filler.length - 1]);
  }
  days = days.map((d, i) => ({ ...d, order: i + 1 }));
  return { ...trip, days };
}

export async function generateItinerary(prefs: TripPreferences): Promise<Trip> {
  const pois = await getPois(prefs).catch(() => []); // Foursquare grounding (best-effort)
  console.log(`[poi] ${pois.length} Foursquare place(s) for ${prefs.destinations[0] ?? "?"}`);
  let trip: Trip;
  try {
    const res = await router.run({ task: "itinerary_generate", prompt: genPrompt(prefs, pois.map((p) => p.name)) });
    trip = attachPoiCoords(parseItinerary(res.text, prefs), pois);
    if (!isValidTrip(trip) || trip.days.length === 0) throw new Error("invalid");
    trip = enforceDayCount(trip, prefs, pois); // models sometimes return too few days
    console.log(`[itinerary] generated via ${res.provider}/${res.model} (${trip.days.length} days)`);
  } catch {
    console.warn("[itinerary] model generation unavailable -> deterministic fallback");
    trip = buildTrip(prefs, pois);
  }
  return trip;
}

// Natural-language edit ("make day 2 more relaxed"), routed to the nl_edit model tier
// (PRD §6.9). Returns the trip unchanged if the model output can't be parsed.
export async function editItinerary(trip: Trip, instruction: string): Promise<Trip> {
  const current = JSON.stringify({
    days: trip.days.map((d) => ({ items: d.items.map((i) => ({ type: i.type, title: i.title, time: i.time, categoryTags: i.categoryTags })) })),
  });
  try {
    const res = await router.run({
      task: "nl_edit",
      prompt: `Current itinerary JSON: ${current}. Apply this change: "${instruction}". Respond with ONLY the full updated JSON of the same shape.`,
    });
    const edited = parseItinerary(res.text, trip.preferences);
    if (edited.days.length === 0) return trip;
    return mergeEditedTrip(trip, edited);
  } catch {
    return trip;
  }
}
