import { describe, it, expect } from "vitest";
import { reorderItem } from "./index";
import type { Trip } from "./index";

function trip(): Trip {
  const item = (id: string) => ({ id, type: "activity" as const, title: id, categoryTags: [] });
  const now = new Date(0).toISOString();
  return {
    id: "t1", createdAt: now, updatedAt: now,
    preferences: { destinations: ["X"], nights: 2, party: "solo", adults: 1, children: 0, budget: "mid", interests: [], pace: "balanced" },
    days: [
      { id: "d1", order: 1, items: [item("a"), item("b"), item("c")] },
      { id: "d2", order: 2, items: [item("d")] },
    ],
  };
}

describe("reorderItem", () => {
  it("moves an item within a day", () => {
    const t = reorderItem(trip(), { fromDay: 1, fromIndex: 0, toDay: 1, toIndex: 2 });
    expect(t.days[0].items.map((i) => i.id)).toEqual(["b", "c", "a"]);
  });
  it("moves an item across days", () => {
    const t = reorderItem(trip(), { fromDay: 1, fromIndex: 0, toDay: 2, toIndex: 0 });
    expect(t.days[0].items.map((i) => i.id)).toEqual(["b", "c"]);
    expect(t.days[1].items.map((i) => i.id)).toEqual(["a", "d"]);
  });
  it("no-ops on out-of-bounds input", () => {
    const original = trip();
    const t = reorderItem(original, { fromDay: 1, fromIndex: 9, toDay: 2, toIndex: 0 });
    expect(t).toBe(original);
  });
});
