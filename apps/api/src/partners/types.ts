import type { Offer, TripPreferences } from "@trip-itinerary/core";

// What a partner adapter is asked to localize against.
export interface PartnerOfferQuery {
  destination: string;
  interests: string[];
  nights: number;
  budget: string;
  party: string;
}

// A partner-integration adapter. Each partner brand that exposes an API implements
// this; the registry runs every ENABLED adapter and merges results. Modelled on the
// AI orchestration layer: provider-agnostic behind one interface.
export interface PartnerAdapter {
  id: string;            // partner slug, matches the Partner/Offer partnerId
  name: string;          // display name
  category: string;      // offer category (tours, accommodation, ...)
  enabled(): boolean;    // true only when this partner's API key is configured
  fetch(query: PartnerOfferQuery, signal: AbortSignal): Promise<Offer[]>;
}

export function queryFromPrefs(p: TripPreferences): PartnerOfferQuery {
  return {
    destination: p.destinations[0] ?? "",
    interests: p.interests ?? [],
    nights: p.nights ?? 1,
    budget: p.budget,
    party: p.party,
  };
}

// Build a normalized, localized Offer from a partner API result. Live partner
// offers are destination-scoped by construction, so we tag them with a destination
// targeting rule (marks them "local" in the UI) and mark the source.
export function toPartnerOffer(
  partnerId: string,
  category: string,
  q: PartnerOfferQuery,
  o: { id?: string; title: string; body?: string; subtitle?: string; ctaLabel?: string; url: string; priority?: number },
): Offer {
  return {
    id: `${partnerId}-live-${o.id ?? Math.random().toString(36).slice(2, 10)}`,
    partnerId,
    title: o.title,
    subtitle: o.subtitle,
    body: o.body,
    ctaLabel: o.ctaLabel ?? "View offer",
    destinationUrl: o.url,
    category,
    tags: [],
    targeting: [{ dimension: "destination", op: "in", value: [q.destination.split(",")[0].trim()] }],
    priority: o.priority ?? 90,
    surfaces: ["post_generation", "inline_day"],
    status: "live",
  };
}
