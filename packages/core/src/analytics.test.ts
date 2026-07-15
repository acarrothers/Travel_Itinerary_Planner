import { describe, it, expect } from "vitest";
import { summarizeOfferEvents } from "./index";
import type { OfferEvent } from "./index";

const ev = (type: OfferEvent["type"], over: Partial<OfferEvent> = {}): OfferEvent =>
  ({ id: Math.random().toString(), offerId: "viator-tours-generic", partnerId: "viator", type, timestamp: new Date().toISOString(), ...over });

describe("summarizeOfferEvents", () => {
  it("computes funnel metrics per offer", () => {
    const rows = summarizeOfferEvents([
      ev("impression"), ev("impression"), ev("click"), ev("conversion", { commissionUsd: 10 }),
    ]);
    expect(rows.length).toBe(1);
    const r = rows[0];
    expect(r).toMatchObject({ impressions: 2, clicks: 1, conversions: 1, revenueUsd: 10 });
    expect(r.ctr).toBeCloseTo(0.5);
    expect(r.conversionRate).toBeCloseTo(1);
    expect(r.epcUsd).toBeCloseTo(10);
  });

  it("handles zero-division safely and ranks by revenue", () => {
    const rows = summarizeOfferEvents([
      ev("impression", { offerId: "a" }),
      ev("conversion", { offerId: "b", commissionUsd: 5 }),
    ]);
    expect(rows[0].offerId).toBe("b"); // higher revenue first
    expect(rows.find((x) => x.offerId === "a")!.ctr).toBe(0);
  });
});
