import { describe, it, expect } from "vitest";
import { attachPoiCoords } from "./index";
import type { Trip, Poi } from "./index";

const trip = (): Trip => ({
  id: "t", createdAt: "", updatedAt: "",
  preferences: { destinations: ["Lisbon"], nights: 1, party: "solo", adults: 1, children: 0, budget: "mid", interests: [], pace: "balanced" },
  days: [{ id: "d1", order: 1, items: [
    { id: "i1", type: "activity", title: "Visit Jeronimos Monastery", categoryTags: [] },
    { id: "i2", type: "meal", title: "Lunch somewhere", categoryTags: [] },
  ] }],
});
const pois: Poi[] = [{ id: "1", name: "Jeronimos Monastery", category: "Monument", tags: [], coords: { lat: 38.6, lng: -9.2 }, address: "Belem" }];

describe("attachPoiCoords", () => {
  it("fills coords for items whose title matches a POI name", () => {
    const out = attachPoiCoords(trip(), pois);
    expect(out.days[0].items[0].coords).toEqual({ lat: 38.6, lng: -9.2 });
    expect(out.days[0].items[1].coords).toBeUndefined(); // no match
  });
  it("is a no-op with no POIs", () => {
    const t = trip();
    expect(attachPoiCoords(t, [])).toBe(t);
  });
});
