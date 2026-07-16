import type { TripPreferences, Poi } from "@trip-itinerary/core";

declare const process: { env: Record<string, string | undefined> };

// Grounding source (decided: Foursquare Places API, from Sprint 1 — no hand-curation).
// Returns [] when no key so local dev / the stub path still works.
export async function getPois(prefs: TripPreferences): Promise<Poi[]> {
  const key = process.env.FOURSQUARE_API_KEY;
  if (!key) return [];
  const near = prefs.destinations[0] ?? "";
  const query = prefs.interests.length ? prefs.interests.join(" ") : "things to do";
  try {
    const url = `https://api.foursquare.com/v3/places/search?near=${encodeURIComponent(near)}&query=${encodeURIComponent(query)}&limit=40`;
    const res = await fetch(url, { headers: { Authorization: key, accept: "application/json" } });
    if (!res.ok) return [];
    const data: any = await res.json();
    return (data.results ?? []).map((r: any): Poi => ({
      id: String(r.fsq_id),
      name: String(r.name),
      category: r.categories?.[0]?.name ?? "place",
      tags: (r.categories ?? []).map((c: any) => String(c.name)),
      coords: r.geocodes?.main ? { lat: r.geocodes.main.latitude, lng: r.geocodes.main.longitude } : undefined,
      address: r.location?.formatted_address,
    }));
  } catch {
    return []; // grounding is best-effort; generation still proceeds
  }
}
