import { filterDestinations } from "@trip-itinerary/core";
import { POPULAR_DESTINATIONS } from "../data/destinations.js";

declare const process: { env: Record<string, string | undefined> };

const placesKey = () => process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY;

// Live city autocomplete via the Google Places Autocomplete API when configured;
// otherwise (or on any failure) fall back to the curated list so the field always
// suggests something.
export async function suggestDestinations(query: string, limit = 8): Promise<string[]> {
  const q = query.trim();
  const local = filterDestinations(POPULAR_DESTINATIONS, q, limit);
  const key = placesKey();
  if (!key || q.length < 2) return local;

  try {
    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(q)}&types=(cities)&key=${encodeURIComponent(key)}`;
    const res = await fetch(url, { headers: { accept: "application/json" } });
    if (!res.ok) return local;
    const data: any = await res.json();
    if (data.status && data.status !== "OK" && data.status !== "ZERO_RESULTS") return local;
    const remote: string[] = (data.predictions ?? [])
      .map((p: any) => String(p.description ?? "").trim())
      .filter((s: string) => s.length > 0);
    const unique = [...new Set(remote)].slice(0, limit);
    return unique.length ? unique : local;
  } catch {
    return local; // never block the form on a provider hiccup
  }
}
