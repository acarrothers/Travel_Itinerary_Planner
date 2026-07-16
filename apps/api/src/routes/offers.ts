import type { FastifyInstance } from "fastify";
import { matchOffers, extractSignals, summarizeOfferEvents, type OfferEvent } from "@trip-itinerary/core";
import { getTripRepository } from "../repositories/tripRepository.js";
import { getOfferRepository } from "../repositories/offerRepository.js";
import { getOfferEventRepository } from "../repositories/offerEventRepository.js";

declare const process: { env: Record<string, string | undefined> };
const trips = getTripRepository();
const offers = getOfferRepository();
const events = getOfferEventRepository();
const uid = () => Math.random().toString(36).slice(2, 12);
const now = () => new Date().toISOString();

export async function offerRoutes(app: FastifyInstance) {
  app.get("/offers/match", async (req) => {
    const { tripId, surface } = req.query as { tripId?: string; surface?: string };
    const trip = tripId ? await trips.get(tripId) : undefined;
    if (!trip) return null;
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

  app.get("/offers/report", async () => summarizeOfferEvents(await events.all()));
}
