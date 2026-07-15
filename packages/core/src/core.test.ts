import { describe, it, expect } from "vitest";
import { extractSignals, matchOffers, isValidTrip, tripMapPoints } from "./index";
import type { Trip, Offer } from "./index";

function sampleTrip(): Trip {
  const now = new Date().toISOString();
  return {
    id: "t1", preferences: { destinations: ["Lisbon"], nights: 1, party: "couple", adults: 2, children: 0, budget: "mid", interests: ["food", "culture"], pace: "balanced" },
    createdAt: now, updatedAt: now,
    days: [{ id: "d1", order: 1, items: [
      { id: "i1", type: "activity", title: "Museum", categoryTags: ["culture"], coords: { lat: 38.7, lng: -9.1 } },
      { id: "i2", type: "meal", title: "Lunch", categoryTags: ["food"] },
    ] }],
  };
}

const offer = (over: Partial<Offer> = {}): Offer => ({
  id: "o1", partnerId: "viator", title: "Tours", ctaLabel: "Go", destinationUrl: "https://x", category: "tours",
  tags: ["culture"], targeting: [{ dimension: "interests", op: "contains_any", value: ["culture"] }],
  priority: 100, surfaces: ["post_generation"], status: "live", ...over,
});

describe("core", () => {
  it("extractSignals collects item tags + trip fields", () => {
    const s = extractSignals(sampleTrip());
    expect(s.destinations).toEqual(["Lisbon"]);
    expect(s.itemTags.sort()).toEqual(["culture", "food"]);
    expect(s.budget).toBe("mid");
  });

  it("matchOffers returns live offers whose targeting matches", () => {
    const s = extractSignals(sampleTrip());
    expect(matchOffers(s, [offer()]).length).toBe(1);
  });

  it("matchOffers excludes non-live and non-matching offers", () => {
    const s = extractSignals(sampleTrip());
    expect(matchOffers(s, [offer({ status: "paused" })]).length).toBe(0);
    expect(matchOffers(s, [offer({ targeting: [{ dimension: "budget", op: "in", value: ["luxury"] }] })]).length).toBe(0);
  });

  it("matchOffers ranks by priority", () => {
    const s = extractSignals(sampleTrip());
    const ranked = matchOffers(s, [offer({ id: "low", priority: 1 }), offer({ id: "high", priority: 99 })]);
    expect(ranked[0].id).toBe("high");
  });

  it("tripMapPoints returns only items with coordinates", () => {
    const pts = tripMapPoints(sampleTrip());
    expect(pts.length).toBe(1);
    expect(pts[0]).toMatchObject({ title: "Museum", day: 1 });
  });

  it("isValidTrip checks structure", () => {
    expect(isValidTrip(sampleTrip())).toBe(true);
  });
});
