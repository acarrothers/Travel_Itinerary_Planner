import type { FastifyInstance } from "fastify";
import { matchOffers, extractSignals, summarizeOfferEvents, type OfferEvent } from "@trip-itinerary/core";
import { getTripRepository } from "../repositories/tripRepository.js";
import { getOfferRepository } from "../repositories/offerRepository.js";
import { getOfferEventRepository } from "../repositories/offerEventRepository.js";
import { requireUser, userOf } from "../userAuth.js";
import { findOffersForTrip } from "../services/offerFinder.js";
import type { TripPreferences } from "@trip-itinerary/core";

declare const process: { env: Record<string, string | undefined> };
const trips = getTripRepository();
const offers = getOfferRepository();
const events = getOfferEventRepository();
const uid = () => Math.random().toString(36).slice(2, 12);
const now = () => new Date().toISOString();

// Offer search is the primary funnel, so it does NOT consume the daily trip
// allowance. A per-minute cap still protects against runaway AI spend.
const findLimit = { config: { rateLimit: { max: 20, timeWindow: "1 minute" } } };

export async function offerRoutes(app: FastifyInstance) {
  // AI offer finder: destination + preferences in, offers grouped by inferred need out.
  app.post("/offers/find", { preHandler: requireUser(), ...findLimit }, async (req, reply) => {
    const prefs = req.body as TripPreferences;
    if (!prefs?.destinations?.length) {
      return reply.code(400).send({ error: "destinations required" });
    }
    const normalized: TripPreferences = {
      ...prefs,
      nights: Number(prefs.nights) || 1,
      adults: Number(prefs.adults) || 1,
      children: Number(prefs.children) || 0,
      interests: Array.isArray(prefs.interests) ? prefs.interests : [],
    };
    const result = await findOffersForTrip(normalized, await offers.listOffers());
    // Log an impression per surfaced offer so the existing funnel reporting covers
    // directory-sourced discovery too.
    for (const g of result.groups) {
      for (const o of g.offers) {
        void events.log({ id: uid(), offerId: o.id, partnerId: o.partnerId, type: "impression", surface: "post_generation", timestamp: now() });
      }
    }
    return result;
  });

  app.get("/offers/match", { preHandler: requireUser() }, async (req) => {
    const { tripId, surface } = req.query as { tripId?: string; surface?: string };
    const trip = tripId ? await trips.get(tripId) : undefined;
    if (!trip || trip.userId !== userOf(req).id) return null;
    const [best] = matchOffers(extractSignals(trip), await offers.listLiveOffers());
    if (best) void events.log({ id: uid(), offerId: best.id, partnerId: best.partnerId, tripId, type: "impression", surface: surface as any, timestamp: now() });
    return best ?? null;
  });

  // Outbound redirect: log the click, append Viator affiliate sub-IDs, then 302 (PRD §7.5).
  app.get("/offers/:id/click", async (req, reply) => {
    const { id } = req.params as { id: string };
    const { tripId } = req.query as { tripId?: string };
    const offer = await offers.getOffer(id);
    if (!offer) return reply.code(404).send({ error: "no offer" });
    await events.log({ id: uid(), offerId: id, partnerId: offer.partnerId, tripId, type: "click", timestamp: now() });
    const aff = process.env.VIATOR_AFFILIATE_ID ?? "PMID";
    return reply.redirect(`${offer.destinationUrl}?pid=${aff}&sub1=${id}&sub2=${tripId ?? ""}`);
  });

  // Partner postback: record a conversion + commission (PRD §7.5).
  app.post("/offers/:id/conversion", async (req) => {
    const { id } = req.params as { id: string };
    const { tripId, commissionUsd } = (req.body ?? {}) as { tripId?: string; commissionUsd?: number };
    const offer = await offers.getOffer(id);
    const e: OfferEvent = { id: uid(), offerId: id, partnerId: offer?.partnerId, tripId, type: "conversion", commissionUsd, timestamp: now() };
    await events.log(e);
    return e;
  });

  // Partner offer directory: every live offer, browsable by a signed-in user.
  // Read-only and non-targeted — this is the catalog, not the itinerary match.
  app.get("/offers/directory", { preHandler: requireUser() }, async () => {
    const live = await offers.listLiveOffers();
    return live
      .slice()
      .sort((a, b) => b.priority - a.priority || a.title.localeCompare(b.title))
      .map((o) => ({
        id: o.id, partnerId: o.partnerId, title: o.title, subtitle: o.subtitle,
        body: o.body, ctaLabel: o.ctaLabel, category: o.category, tags: o.tags,
      }));
  });

  app.get("/offers/report", async () => summarizeOfferEvents(await events.all()));
}
