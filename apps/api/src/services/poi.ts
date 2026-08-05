import type { TripPreferences, Poi } from "@trip-itinerary/core";

declare const process: { env: Record<string, string | undefined> };

// Server-side Places key. Prefer a dedicated GOOGLE_PLACES_API_KEY; fall back to
// GOOGLE_MAPS_API_KEY (same Google Cloud project, with the Places API enabled).
const placesKey = () => process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY;

// POI grounding via the Google Places API (Text Search). Returns [] when no key,
// so local dev / the deterministic path still work.
export async function getPois(prefs: TripPreferences): Promise<Poi[]> {
  const key = placesKey();
  if (!key) return [];
  const near = prefs.destinations[0] ?? "";
  const interests = prefs.interests.length ? prefs.interests.join(" ") : "things to do";
  const query = `${interests} in ${near}`.trim();
  try {
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${encodeURIComponent(key)}`;
    const res = await fetch(url, { headers: { accept: "application/json" } });
    if (!res.ok) return [];
    const data: any = await res.json();
    // REQUEST_DENIED / OVER_QUERY_LIMIT etc. -> treat as no grounding.
    if (data.status && data.status !== "OK" && data.status !== "ZERO_RESULTS") return [];
    return (data.results ?? []).slice(0, 40).map((r: any): Poi => ({
      id: String(r.place_id),
      name: String(r.name),
      category: r.types?.[0] ?? "place",
      tags: (r.types ?? []).map((t: any) => String(t)),
      coords: r.geometry?.location ? { lat: r.geometry.location.lat, lng: r.geometry.location.lng } : undefined,
      address: r.formatted_address,
    }));
  } catch {
    return []; // grounding is best-effort; generation still proceeds
  }
}
