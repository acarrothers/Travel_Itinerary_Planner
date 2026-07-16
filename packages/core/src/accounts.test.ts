import { describe, it, expect } from "vitest";
import { dailyLimitFor, evaluateRateLimit } from "./index";

const limits = { general: 1, pro: 25, unlimited: -1 };

describe("dailyLimitFor", () => {
  it("returns the configured limit per account type", () => {
    expect(dailyLimitFor("general", limits)).toBe(1);
    expect(dailyLimitFor("pro", limits)).toBe(25);
    expect(dailyLimitFor("unlimited", limits)).toBe(-1);
  });
  it("falls back to general for unknown types", () => {
    expect(dailyLimitFor("mystery", limits)).toBe(1);
  });
});

describe("evaluateRateLimit", () => {
  it("allows general users their first trip, blocks the second", () => {
    expect(evaluateRateLimit(0, 1)).toMatchObject({ allowed: true, remaining: 1 });
    expect(evaluateRateLimit(1, 1)).toMatchObject({ allowed: false, remaining: 0 });
  });
  it("treats negative limit as unlimited", () => {
    const r = evaluateRateLimit(9999, -1);
    expect(r.allowed).toBe(true);
    expect(r.remaining).toBe(-1);
  });
  it("computes remaining for higher tiers", () => {
    expect(evaluateRateLimit(10, 25)).toMatchObject({ allowed: true, remaining: 15 });
  });
});
