import { describe, it, expect } from "vitest";
import { mergeEditedTrip } from "./edit";
import type { Trip } from "@trip-itinerary/core";

function trip(): Trip {
  return {
    id: "keep-me", userId: "u1", createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z",
    preferences: { destinations: ["Lisbon"], nights: 2, party: "couple", adults: 2, children: 0, budget: "mid", interests: ["food"], pace: "balanced" },
    days: [{ id: "d1", order: 1, items: [] }],
  };
}

describe("mergeEditedTrip", () => {
  it("keeps identity + preferences, swaps days, bumps updatedAt", () => {
    const original = trip();
    const edited: Trip = { ...original, days: [{ id: "d2", order: 1, items: [] }, { id: "d3", order: 2, items: [] }] };
    const merged = mergeEditedTrip(original, edited);
    expect(merged.id).toBe("keep-me");
    expect(merged.userId).toBe("u1");
    expect(merged.createdAt).toBe(original.createdAt);
    expect(merged.days.length).toBe(2);
    expect(merged.updatedAt).not.toBe(original.updatedAt);
  });
});
