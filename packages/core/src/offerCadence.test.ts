import { describe, it, expect } from "vitest";
import { assignOffersToDays, offerClass, classEligible } from "./offerCadence";
import type { Trip, Offer, TripPreferences, Day } from "./types";

const prefs = (over: Partial<TripPreferences> = {}): TripPreferences => ({
  destinations: ["Lisbon, Portugal"], nights: 5, party: "couple", adults: 2, children: 0,
  budget: "mid", interests: ["food", "culture"], pace: "balanced", ...over,
});
const trip = (nights: number, p: Partial<TripPreferences> = {}): Trip => {
  const days: Day[] = Array.from({ length: nights }, (_, i) => ({ id: `d${i}`, order: i + 1, items: [] }));
  const now = new Date().toISOString();
  return { id: "t1", preferences: prefs({ nights, ...p }), days, createdAt: now, updatedAt: now };
};
const offer = (id: string, category: string, partnerId: string, extra: Partial<Offer> = {}): Offer => ({
  id, partnerId, title: id, ctaLabel: "Go", destinationUrl: "https://x", category, tags: [],
  targeting: [], priority: 50, surfaces: ["post_generation"], status: "live", ...extra,
});

describe("offerClass()", () => {
  it("maps categories to cadence classes", () => {
    expect(offerClass("tours")).toBe("experiences");
    expect(offerClass("accommodation")).toBe("accommodation");
    expect(offerClass("esim")).toBe("connectivity");
    expect(offerClass("transfer")).toBe("transfer");
    expect(offerClass("car_hire")).toBe("getting_around");
    expect(offerClass("rail")).toBe("getting_around");
    expect(offerClass("lounge")).toBe("lounge");
    expect(offerClass("insurance")).toBe("insurance");
  });
});

describe("classEligible()", () => {
  it("gates categories by trip attributes", () => {
    expect(classEligible("connectivity", prefs({ nights: 2 }))).toBe(false); // needs 3+
    expect(classEligible("connectivity", prefs({ nights: 3 }))).toBe(true);
    expect(classEligible("getting_around", prefs({ nights: 5 }))).toBe(false); // needs 6+
    expect(classEligible("transfer", prefs({ nights: 1 }))).toBe(false); // needs 2+
    expect(classEligible("lounge", prefs({ budget: "budget", adults: 2, children: 0 }))).toBe(false);
    expect(classEligible("lounge", prefs({ budget: "luxury" }))).toBe(true);
    expect(classEligible("dining", prefs({ interests: ["nature"] }))).toBe(false);
    expect(classEligible("dining", prefs({ interests: ["food"] }))).toBe(true);
  });
});

describe("assignOffersToDays()", () => {
  const catalog = [
    offer("ins", "insurance", "safetywing"),
    offer("esim", "esim", "airalo"),
    offer("xfer1", "transfer", "welcome"),
    offer("xfer2", "transfer", "kiwitaxi"),
    offer("tour1", "tours", "viator"),
    offer("tour2", "tours", "getyourguide"),
    offer("tour3", "tours", "klook"),
    offer("lounge", "lounge", "prioritypass"),
    offer("hotel", "accommodation", "booking"),
  ];

  it("respects the per-day cap and never leaves a partner adjacent to itself", () => {
    const map = assignOffersToDays(trip(5), catalog, { maxPerDay: 2 });
    for (const [, list] of map) expect(list.length).toBeLessThanOrEqual(2);
    // no same partner on adjacent days
    const days = [...map.keys()].sort((a, b) => a - b);
    for (let i = 0; i < days.length - 1; i++) {
      const a = new Set(map.get(days[i])!.map((o) => o.partnerId));
      for (const o of map.get(days[i + 1])!) expect(a.has(o.partnerId)).toBe(false);
    }
  });

  it("places trip-level essentials once, near the start", () => {
    const map = assignOffersToDays(trip(5), catalog);
    const dayOf = (id: string) => [...map.entries()].find(([, l]) => l.some((o) => o.id === id))?.[0];
    expect(dayOf("ins")).toBeLessThanOrEqual(2);   // insurance early
    expect([...map.values()].flat().filter((o) => o.id === "ins")).toHaveLength(1); // once
    expect(dayOf("esim")).toBeLessThanOrEqual(2);
  });

  it("puts transfers on arrival and departure", () => {
    const map = assignOffersToDays(trip(5), catalog);
    const transferDays = [...map.entries()].filter(([, l]) => l.some((o) => offerClass(o.category) === "transfer")).map(([d]) => d).sort();
    expect(transferDays[0]).toBe(1);           // arrival
    expect(transferDays[transferDays.length - 1]).toBe(5); // departure
  });

  it("drops categories that aren't eligible for a short trip", () => {
    const map = assignOffersToDays(trip(1), catalog); // 1 night
    const placed = [...map.values()].flat().map((o) => o.id);
    expect(placed).not.toContain("esim");   // needs 3+ nights
    expect(placed).not.toContain("xfer1");  // transfer needs 2+
    expect(placed).not.toContain("xfer2");
  });

  it("can leave a day empty when nothing eligible remains", () => {
    const map = assignOffersToDays(trip(6), [offer("only", "insurance", "x")]);
    const nonEmpty = [...map.values()].filter((l) => l.length > 0);
    expect(nonEmpty).toHaveLength(1); // just the one insurance offer, one day
  });

  it("is deterministic", () => {
    const a = assignOffersToDays(trip(5), catalog);
    const b = assignOffersToDays(trip(5), catalog);
    const flat = (m: Map<number, Offer[]>) => [...m.entries()].map(([d, l]) => `${d}:${l.map((o) => o.id).join(",")}`).join("|");
    expect(flat(a)).toBe(flat(b));
  });
});
