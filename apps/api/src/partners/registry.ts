import type { Offer } from "@trip-itinerary/core";
import { defaultAdapters } from "./adapters.js";
import type { PartnerAdapter, PartnerOfferQuery } from "./types.js";

const TIMEOUT_MS = 3500; // don't let a slow partner stall the itinerary

// Run every ENABLED partner adapter in parallel (each with its own timeout) and
// flatten their offers. Adapters that are unconfigured, error, or time out simply
// contribute nothing — the caller still has the CMS catalog to fall back on.
export async function fetchPartnerOffers(
  query: PartnerOfferQuery,
  adapters: PartnerAdapter[] = defaultAdapters,
): Promise<Offer[]> {
  const active = adapters.filter((a) => {
    try { return a.enabled(); } catch { return false; }
  });
  if (active.length === 0) return [];

  const results = await Promise.allSettled(active.map(async (a) => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    try { return await a.fetch(query, ctrl.signal); }
    finally { clearTimeout(timer); }
  }));

  return results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
}

// Which partner integrations are live right now (for diagnostics / health).
export function enabledPartnerIntegrations(adapters: PartnerAdapter[] = defaultAdapters): string[] {
  return adapters.filter((a) => { try { return a.enabled(); } catch { return false; } }).map((a) => a.id);
}
