import type { Trip, TripPreferences, Offer, OfferReportRow, Partner, ReorderInput } from "@trip-itinerary/core";

export interface ClientOptions { authToken?: string }

// One client shared by the web and React Native apps (both have global `fetch`).
export function createClient(baseUrl: string, opts: ClientOptions = {}) {
  async function req<T>(path: string, init?: RequestInit): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(init?.headers as Record<string, string> | undefined),
    };
    if (opts.authToken) headers.Authorization = `Bearer ${opts.authToken}`;
    const res = await fetch(`${baseUrl}${path}`, { ...init, headers });
    if (!res.ok) throw new Error(`API ${res.status}: ${path}`);
    return res.json() as Promise<T>;
  }
  return {
    // itinerary
    createItinerary: (prefs: TripPreferences) => req<Trip>("/itineraries", { method: "POST", body: JSON.stringify(prefs) }),
    getItinerary: (id: string) => req<Trip>(`/itineraries/${id}`),
    editItinerary: (id: string, instruction: string) => req<Trip>(`/itineraries/${id}/edit`, { method: "POST", body: JSON.stringify({ instruction }) }),
    reorderItem: (id: string, mv: ReorderInput) => req<Trip>(`/itineraries/${id}/reorder`, { method: "POST", body: JSON.stringify(mv) }),
    // offers
    matchOffer: (tripId: string, surface: string) => req<Offer | null>(`/offers/match?tripId=${tripId}&surface=${surface}`),
    offerReport: () => req<OfferReportRow[]>("/offers/report"),
    trackOfferClickUrl: (offerId: string, tripId: string) => `${baseUrl}/offers/${offerId}/click?tripId=${tripId}`,
    // admin / CMS
    adminMe: () => req<{ role: string; can: Record<string, boolean> }>("/admin/me"),
    adminListOffers: () => req<Offer[]>("/admin/offers"),
    adminSaveOffer: (offer: Offer) => req<Offer>("/admin/offers", { method: "POST", body: JSON.stringify(offer) }),
    adminDeleteOffer: (id: string) => req<{ ok: boolean }>(`/admin/offers/${id}`, { method: "DELETE" }),
    adminReport: () => req<OfferReportRow[]>("/offers/report"),
    adminSeedEvents: () => req<{ seeded: number }>("/admin/dev/seed-events", { method: "POST" }),
    adminListPartners: () => req<Partner[]>("/admin/partners"),
    adminSavePartner: (p: Partner) => req<Partner>("/admin/partners", { method: "POST", body: JSON.stringify(p) }),
  };
}
export type ApiClient = ReturnType<typeof createClient>;
