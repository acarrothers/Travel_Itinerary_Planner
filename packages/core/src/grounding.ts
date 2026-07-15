import type { Trip, Poi } from "./types";

// Attach coordinates from fetched POIs to itinerary items that lack them, by name
// match. Lets AI-generated itineraries (which return place names, not coords) appear
// on the map once POIs are available. Pure + testable.
export function attachPoiCoords(trip: Trip, pois: Poi[]): Trip {
  if (pois.length === 0) return trip;
  const index = pois.map((p) => ({ name: p.name.toLowerCase(), p }));
  const days = trip.days.map((d) => ({
    ...d,
    items: d.items.map((it) => {
      if (it.coords) return it;
      const t = it.title.toLowerCase();
      const hit = index.find((x) => x.name.length > 2 && (t.includes(x.name) || x.name.includes(t)));
      return hit?.p.coords ? { ...it, coords: hit.p.coords, location: it.location ?? hit.p.address } : it;
    }),
  }));
  return { ...trip, days };
}
