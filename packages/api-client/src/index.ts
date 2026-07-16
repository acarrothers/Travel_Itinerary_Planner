import type { Trip, TripPreferences, Offer, OfferReportRow, Partner, ReorderInput, User, RateLimitStatus } from "@trip-itinerary/core";

export interface ClientOptions {
  authToken?: string;
  getAuthToken?: () => string | null | undefined;
}

export interface AuthResult { token: string; user: User; }

// One client shared by the web and React Native apps (both have global `fetch`).
export function createClient(baseUrl: string, opts: ClientOptions = {}) {
  async function req<T>(path: string, init?: RequestInit): Promise<T> {
    const token = opts.getAuthToken?.() ?? opts.authToken;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers as Record<string, string> | undefined),
    };
    const res = await fetch(`${baseUrl}${path}`, { ...init, headers });
    if (!res.ok) {
      let body: any = {};
      try { body = await res.json(); } catch { /* ignore */ }
      const err = new Error(body.message || body.error || `API ${res.status}`) as Error & { status?: number; body?: any };
      err.status = res.status; err.body = body;
      throw err;
    }
    return res.json() as Promise<T>;
  }
  return {
    // auth
    register: (email: string, password: string) => req<AuthResult>("/auth/register", { method: "POST", body: JSON.stringify({ email, password }) }),
    login: (email: string, password: string) => req<AuthResult>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
    oauthLogin: (provider: "google" | "apple", idToken: string) => req<AuthResult>("/auth/oauth", { method: "POST", body: JSON.stringify({ provider, idToken }) }),
    me: () => req<{ user: User; rate: RateLimitStatus }>("/auth/me"),
    // itinerary (auth required server-side)
    createItinerary: (prefs: TripPreferences) => req<Trip & { _rate?: RateLimitStatus }>("/itineraries", { method: "POST", body: JSON.stringify(prefs) }),
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
