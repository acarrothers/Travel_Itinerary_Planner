import { describe, it, expect } from "vitest";
import { parseItinerary } from "./parseItinerary";
import { buildTrip } from "./mockGenerator";
import { getPois } from "./poi";
import type { TripPreferences, Poi } from "@chatr/core";

const prefs: TripPreferences = {
  destinations: ["Lisbon"], nights: 2, party: "couple", adults: 2, children: 0,
  budget: "mid", interests: ["food", "culture"], pace: "balanced",
};

describe("parseItinerary", () => {
  it("parses JSON wrapped in prose / code fences", () => {
    const text = 'Sure!\n```json\n{"days":[{"items":[{"type":"activity","title":"Castle","time":"10:00","categoryTags":["history"]}]}]}\n```';
    const trip = parseItinerary(text, prefs);
    expect(trip.days.length).toBe(1);
    expect(trip.days[0].items[0].title).toBe("Castle");
    expect(trip.days[0].items[0].categoryTags).toEqual(["history"]);
  });

  it("throws on malformed output (so caller can fall back)", () => {
    expect(() => parseItinerary("no json here", prefs)).toThrow();
  });
});

describe("buildTrip", () => {
  it("produces nights x days with 4 items each (ungrounded)", () => {
    const trip = buildTrip(prefs, []);
    expect(trip.days.length).toBe(2);
    expect(trip.days[0].items.length).toBe(4);
  });

  it("grounds activities in supplied POIs", () => {
    const pois: Poi[] = [
      { id: "1", name: "Jeronimos Monastery", category: "Monument", tags: ["history"], coords: { lat: 38.6, lng: -9.2 } },
      { id: "2", name: "Alfama Viewpoint", category: "Lookout", tags: ["culture"] },
    ];
    const trip = buildTrip(prefs, pois);
    const titles = trip.days.flatMap((d) => d.items.map((i) => i.title));
    expect(titles).toContain("Jeronimos Monastery");
  });
});

describe("getPois", () => {
  it("returns [] gracefully when no FOURSQUARE_API_KEY is set", async () => {
    expect(await getPois(prefs)).toEqual([]);
  });
});
