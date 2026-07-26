import type { Offer } from "@trip-itinerary/core";
import { toPartnerOffer, type PartnerAdapter, type PartnerOfferQuery } from "./types.js";

declare const process: { env: Record<string, string | undefined> };

// NOTE ON PARTNER ENDPOINTS: each adapter targets the partner's documented API,
// but the exact request/response shapes must be validated against live credentials
// (they evolve and differ per contract). Every adapter is guarded: it only runs
// when its API key is configured, and any error yields [] so the itinerary still
// renders from the CMS catalog. Swap the endpoint/mapping specifics once you have
// each partner's sandbox key + docs.

async function json(url: string, init: RequestInit, signal: AbortSignal): Promise<any | null> {
  try {
    const res = await fetch(url, { ...init, signal });
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

// --- Viator (Partner API) ------------------------------------------------------
export const viatorAdapter: PartnerAdapter = {
  id: "viator", name: "Viator", category: "tours",
  enabled: () => !!process.env.VIATOR_API_KEY,
  async fetch(q, signal) {
    const data = await json("https://api.viator.com/partner/products/search", {
      method: "POST",
      headers: { "exp-api-key": process.env.VIATOR_API_KEY!, "Content-Type": "application/json", Accept: "application/json;version=2.0" },
      body: JSON.stringify({ filtering: { destination: q.destination }, sorting: { sort: "TRAVELER_RATING" }, pagination: { start: 1, count: 4 } }),
    }, signal);
    return (data?.products ?? []).slice(0, 4).map((p: any): Offer =>
      toPartnerOffer("viator", "tours", q, { id: p.productCode, title: p.title, body: p.description, subtitle: "Viator", ctaLabel: "See experience", url: p.productUrl ?? "https://www.viator.com/" }));
  },
};

// --- GetYourGuide (Partner API) ------------------------------------------------
export const getYourGuideAdapter: PartnerAdapter = {
  id: "getyourguide", name: "GetYourGuide", category: "tours",
  enabled: () => !!process.env.GETYOURGUIDE_API_KEY,
  async fetch(q, signal) {
    const url = `https://api.getyourguide.com/1/tours?cnt_language=en&q=${encodeURIComponent(q.destination)}&limit=4`;
    const data = await json(url, { headers: { "X-ACCESS-TOKEN": process.env.GETYOURGUIDE_API_KEY!, Accept: "application/json" } }, signal);
    return (data?.data?.tours ?? []).slice(0, 4).map((t: any): Offer =>
      toPartnerOffer("getyourguide", "tours", q, { id: String(t.tour_id), title: t.title, body: t.abstract, subtitle: "GetYourGuide", ctaLabel: "Browse tour", url: t.url ?? "https://www.getyourguide.com/" }));
  },
};

// --- G Adventures (REST API) ---------------------------------------------------
export const gAdventuresAdapter: PartnerAdapter = {
  id: "gadventures", name: "G Adventures", category: "tours",
  enabled: () => !!process.env.GADVENTURES_API_KEY,
  async fetch(q, signal) {
    const url = `https://rest.gadventures.com/tours?name=${encodeURIComponent(q.destination)}&limit=4`;
    const data = await json(url, { headers: { "X-Application-Key": process.env.GADVENTURES_API_KEY!, Accept: "application/json" } }, signal);
    return (data?.results ?? []).slice(0, 4).map((t: any): Offer =>
      toPartnerOffer("gadventures", "tours", q, { id: String(t.id), title: t.name, body: t.description, subtitle: "G Adventures", ctaLabel: "See tour", url: t.href ?? "https://www.gadventures.com/" }));
  },
};

// --- Expedia (Rapid API) -------------------------------------------------------
export const expediaAdapter: PartnerAdapter = {
  id: "expedia", name: "Expedia", category: "accommodation",
  enabled: () => !!process.env.EXPEDIA_API_KEY,
  async fetch(q, signal) {
    // Rapid's real flow needs a signed request + region resolution; this is the
    // shape to fill in with credentials. Guarded so it no-ops until configured.
    const url = `https://api.ean.com/v3/properties/search?destination=${encodeURIComponent(q.destination)}&limit=4`;
    const data = await json(url, { headers: { Authorization: process.env.EXPEDIA_API_KEY!, Accept: "application/json" } }, signal);
    return (data?.properties ?? []).slice(0, 4).map((p: any): Offer =>
      toPartnerOffer("expedia", "accommodation", q, { id: String(p.propertyId), title: p.name, subtitle: "Expedia", ctaLabel: "Check availability", url: p.deepLink ?? "https://www.expedia.com/" }));
  },
};

export const defaultAdapters: PartnerAdapter[] = [viatorAdapter, getYourGuideAdapter, gAdventuresAdapter, expediaAdapter];
