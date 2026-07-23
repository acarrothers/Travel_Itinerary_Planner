import { describe, it, expect } from "vitest";
import { destinationTokens, isLocalizedOffer, matchOffers } from "./offers";
import type { Offer, TripSignals } from "./types";

const signals = (destinations: string[]): TripSignals => ({
  destinations, month: undefined, nights: 4, party: "couple", budget: "mid", interests: [], itemTags: [],
});

const offer = (id: string, extra: Partial<Offer> = {}): Offer => ({
  id, partnerId: "viator", title: id, ctaLabel: "Go", destinationUrl: "https://example.com",
  category: "tours", tags: [], targeting: [], priority: 50, surfaces: ["post_generation"],
  status: "live", ...extra,
});
const localTo = (id: string, value: string[], priority = 50) =>
  offer(id, { targeting: [{ dimension: "destination", op: "in", value }], priority });

describe("destinationTokens()", () => {
  it("splits 'City, Country' into full string, city and country", () => {
    expect(destinationTokens("Lisbon, Portugal")).toEqual(["lisbon, portugal", "lisbon", "portugal"]);
  });
  it("lowercases and trims a single token", () => {
    expect(destinationTokens("  Tokyo ")).toEqual(["tokyo"]);
  });
  it("returns nothing for an empty string", () => {
    expect(destinationTokens("   ")).toEqual([]);
  });
});

describe("destination matching is forgiving", () => {
  it("matches a city-target when the user gave 'City, Country'", () => {
    const out = matchOffers(signals(["Lisbon, Portugal"]), [localTo("lx", ["Lisbon"])]);
    expect(out.map((o) => o.id)).toEqual(["lx"]);
  });
  it("matches when the user gave only the city", () => {
    const out = matchOffers(signals(["Lisbon"]), [localTo("lx", ["Lisbon, Portugal"])]);
    expect(out.map((o) => o.id)).toEqual(["lx"]);
  });
  it("is case-insensitive", () => {
    const out = matchOffers(signals(["lisbon"]), [localTo("lx", ["Lisbon"])]);
    expect(out.map((o) => o.id)).toEqual(["lx"]);
  });
  it("supports country-level targeting", () => {
    const out = matchOffers(signals(["Porto, Portugal"]), [localTo("pt", ["Portugal"])]);
    expect(out.map((o) => o.id)).toEqual(["pt"]);
  });
  it("does not match a different city", () => {
    const out = matchOffers(signals(["Paris, France"]), [localTo("lx", ["Lisbon"])]);
    expect(out).toHaveLength(0);
  });
});

describe("isLocalizedOffer()", () => {
  it("is true only when a destination rule is present", () => {
    expect(isLocalizedOffer(localTo("lx", ["Lisbon"]))).toBe(true);
    expect(isLocalizedOffer(offer("global"))).toBe(false);
  });
});

describe("ranking: localized above global", () => {
  it("puts the place-specific offer first even when a global offer has higher priority", () => {
    const global = offer("global-generic", { priority: 100 });
    const local = localTo("lisbon-local", ["Lisbon"], 50);
    const out = matchOffers(signals(["Lisbon, Portugal"]), [global, local]);
    expect(out.map((o) => o.id)).toEqual(["lisbon-local", "global-generic"]);
  });
  it("still orders by priority within each tier", () => {
    const out = matchOffers(signals(["Lisbon, Portugal"]), [
      offer("g-low", { priority: 10 }),
      offer("g-high", { priority: 90 }),
      localTo("l-low", ["Lisbon"], 10),
      localTo("l-high", ["Lisbon"], 90),
    ]);
    expect(out.map((o) => o.id)).toEqual(["l-high", "l-low", "g-high", "g-low"]);
  });
});
