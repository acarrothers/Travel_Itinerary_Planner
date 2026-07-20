import { filterDestinations } from "@trip-itinerary/core";
import { POPULAR_DESTINATIONS } from "../data/destinations.js";

declare const process: { env: Record<string, string | undefined> };

// Live autocomplete via Foursquare when configured; otherwise (or on any failure)
// fall back to the curated list so the field always suggests something.
export async function suggestDestinations(query: string, limit = 8): Promise<string[]> {
  const q = query.trim();
  const local = filterDestinations(POPULAR_DESTINATIONS, q, limit);
  const key = process.env.FOURSQUARE_API_KEY;
  if (!key || q.length < 2) return local;

  try {
    const url = `https://api.foursquare.com/v3/autocomplete?query=${encodeURIComponent(q)}&types=geo&limit=${limit}`;
    const res = await fetch(url, { headers: { Authorization: key, accept: "application/json" } });
    if (!res.ok) return local;
    const data: any = await res.json();
    const remote: string[] = (data.results ?? [])
      .map((r: any) => {
        const primary = r?.text?.primary ?? r?.geo?.name;
        const secondary = r?.text?.secondary;
        return [primary, secondary].filter(Boolean).join(", ");
      })
      .filter((s: string) => s && s.trim().length > 0);
    const unique = [...new Set(remote)].slice(0, limit);
    return unique.length ? unique : local;
  } catch {
    return local; // never block the form on a provider hiccup
  }
}
