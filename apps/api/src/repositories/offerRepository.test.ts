import { describe, it, expect } from "vitest";
import { InMemoryOfferRepository } from "./offerRepository";
import type { Offer } from "@trip-itinerary/core";

const mk = (id: string, status: Offer["status"]): Offer => ({
  id, partnerId: "viator", title: id, ctaLabel: "Go", destinationUrl: "https://x", category: "tours",
  tags: ["food"], targeting: [], priority: 10, surfaces: ["post_generation"], status,
});

describe("InMemoryOfferRepository", () => {
  it("seeds the default Viator offer + partner", async () => {
    const r = new InMemoryOfferRepository();
    expect((await r.listOffers()).some((o) => o.partnerId === "viator")).toBe(true);
    expect((await r.listPartners()).length).toBeGreaterThan(0);
  });
  it("creates, lists-live, updates, deletes", async () => {
    const r = new InMemoryOfferRepository();
    await r.saveOffer(mk("draft-1", "draft"));
    await r.saveOffer(mk("live-1", "live"));
    expect((await r.listLiveOffers()).some((o) => o.id === "live-1")).toBe(true);
    expect((await r.listLiveOffers()).some((o) => o.id === "draft-1")).toBe(false);
    await r.saveOffer(mk("draft-1", "live")); // update status
    expect((await r.getOffer("draft-1"))!.status).toBe("live");
    await r.deleteOffer("draft-1");
    expect(await r.getOffer("draft-1")).toBeUndefined();
  });
});

import { matchOffers, extractSignals, type Trip } from "@trip-itinerary/core";

function cultureTrip(nights: number): Trip {
  const now = new Date().toISOString();
  return {
    id: "t", createdAt: now, updatedAt: now,
    preferences: { destinations: ["Lisbon"], nights, party: "couple", adults: 2, children: 0, budget: "mid", interests: ["culture"], pace: "balanced" },
    days: [{ id: "d1", order: 1, items: [{ id: "i", type: "activity", title: "Museum", categoryTags: ["culture"] }] }],
  };
}

describe("seed catalog matching", () => {
  it("ranks the highest-priority matching live offer first and excludes drafts", async () => {
    const repo = new InMemoryOfferRepository();
    const live = await repo.listLiveOffers();
    const matched = matchOffers(extractSignals(cultureTrip(4)), live);
    expect(matched[0].id).toBe("viator-tours-generic"); // priority 100
    expect(matched.some((o) => o.id === "gyg-luxury-draft")).toBe(false); // draft excluded
    expect(matched.some((o) => o.id === "safetywing-insurance")).toBe(true); // nights>=1 matches
  });
});
