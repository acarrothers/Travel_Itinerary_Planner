import { describe, it, expect } from "vitest";
import { filterDestinations } from "./index";

const list = ["Paris, France", "Lisbon, Portugal", "Porto, Portugal", "Parma, Italy", "San Francisco, USA"];

describe("filterDestinations", () => {
  it("ranks prefix matches above substring matches", () => {
    const out = filterDestinations(list, "par");
    expect(out[0]).toBe("Paris, France");
    expect(out).toContain("Parma, Italy");
  });
  it("is case-insensitive and matches inside the string", () => {
    expect(filterDestinations(list, "portugal")).toEqual(["Lisbon, Portugal", "Porto, Portugal"]);
  });
  it("returns nothing for an empty query and respects the limit", () => {
    expect(filterDestinations(list, "  ")).toEqual([]);
    expect(filterDestinations(list, "o", 2).length).toBe(2);
  });
});
