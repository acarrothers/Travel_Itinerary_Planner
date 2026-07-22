import { describe, it, expect } from "vitest";
import { inferNeeds, matchOffersToNeeds, reconcileNeeds, signalsFromPreferences } from "./needs";
import type { Offer, TripPreferences } from "./types";

const base: TripPreferences = {
  destinations: ["Lisbon, Portugal"], nights: 5, party: "couple",
  adults: 2, children: 0, budget: "mid", interests: ["food", "culture"], pace: "balanced",
};

const offer = (id: string, category: string, extra: Partial<Offer> = {}): Offer => ({
  id, partnerId: "p", title: id, ctaLabel: "Go", destinationUrl: "https://example.com",
  category, tags: [], targeting: [], priority: 50, surfaces: ["post_generation"],
  status: "live", ...extra,
});

describe("inferNeeds()", () => {
  it("derives the staple needs for a typical trip", () => {
    const ids = inferNeeds(base).map((n) => n.id);
    expect(ids).toContain("accommodation");
    expect(ids).toContain("experiences");
    expect(ids).toContain("insurance");
    expect(ids).toContain("connectivity"); // 5 nights >= 3
    expect(ids).toContain("transfers");
  });

  it("scales needs with trip length", () => {
    // A single night shouldn't suggest a rail pass or an eSIM.
    const short = inferNeeds({ ...base, nights: 1 }).map((n) => n.id);
    expect(short).not.toContain("connectivity");
    expect(short).not.toContain("getting_around");

    const long = inferNeeds({ ...base, nights: 10 }).map((n) => n.id);
    expect(long).toContain("getting_around");
  });

  it("adds comfort for luxury budgets and larger parties", () => {
    expect(inferNeeds({ ...base, budget: "luxury" }).map((n) => n.id)).toContain("comfort");
    expect(inferNeeds({ ...base, adults: 4, children: 2 }).map((n) => n.id)).toContain("comfort");
    expect(inferNeeds(base).map((n) => n.id)).not.toContain("comfort");
  });

  it("explains itself — every need carries a rationale, sorted by priority", () => {
    const needs = inferNeeds(base);
    expect(needs.every((n) => n.rationale.length > 0)).toBe(true);
    const priorities = needs.map((n) => n.priority);
    expect([...priorities].sort((a, b) => b - a)).toEqual(priorities);
  });
});

describe("matchOffersToNeeds()", () => {
  const offers = [offer("hotel", "accommodation"), offer("tour", "tours"), offer("ins", "insurance")];

  it("groups eligible offers under the need they satisfy", () => {
    const groups = matchOffersToNeeds(inferNeeds(base), offers, signalsFromPreferences(base));
    const byId = Object.fromEntries(groups.map((g) => [g.need.id, g.offers.map((o) => o.id)]));
    expect(byId.accommodation).toEqual(["hotel"]);
    expect(byId.experiences).toEqual(["tour"]);
    expect(byId.insurance).toEqual(["ins"]);
  });

  it("drops needs with no matching offer rather than showing an empty group", () => {
    const groups = matchOffersToNeeds(inferNeeds(base), [offer("hotel", "accommodation")], signalsFromPreferences(base));
    expect(groups.map((g) => g.need.id)).toEqual(["accommodation"]);
  });

  it("respects CMS targeting rules and offer status", () => {
    const targeted = [
      offer("lux-only", "accommodation", { targeting: [{ dimension: "budget", op: "in", value: ["luxury"] }] }),
      offer("draft", "insurance", { status: "draft" }),
    ];
    const groups = matchOffersToNeeds(inferNeeds(base), targeted, signalsFromPreferences(base));
    expect(groups).toHaveLength(0); // mid-budget user, and the draft isn't live
  });
});

describe("reconcileNeeds()", () => {
  const fallback = inferNeeds(base);

  it("applies the AI ordering when the ids are real", () => {
    const out = reconcileNeeds(["insurance", "accommodation"], fallback);
    expect(out[0].id).toBe("insurance");
    expect(out[1].id).toBe("accommodation");
  });

  it("discards invented needs and keeps every real one", () => {
    // Guardrail: the model must not be able to recommend a category we can't fill.
    const out = reconcileNeeds(["private-jet-charter", "insurance"], fallback);
    expect(out.map((n) => n.id)).not.toContain("private-jet-charter");
    expect(out).toHaveLength(fallback.length);
    expect(out[0].id).toBe("insurance");
  });

  it("falls back to default order when AI returns nothing", () => {
    expect(reconcileNeeds([], fallback).map((n) => n.id)).toEqual(fallback.map((n) => n.id));
  });
});
