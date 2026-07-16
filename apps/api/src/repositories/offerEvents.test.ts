import { describe, it, expect } from "vitest";
import { InMemoryOfferEventRepository, getOfferEventRepository } from "./offerEventRepository";
import { summarizeOfferEvents, type OfferEvent } from "@trip-itinerary/core";

const e = (type: OfferEvent["type"], over: Partial<OfferEvent> = {}): OfferEvent =>
  ({ id: Math.random().toString(), offerId: "o1", partnerId: "viator", type, timestamp: new Date().toISOString(), ...over });

describe("offer event repository", () => {
  it("logs and returns events; summarize sees them", async () => {
    const repo = new InMemoryOfferEventRepository();
    await repo.log(e("impression"));
    await repo.log(e("click"));
    await repo.log(e("conversion", { commissionUsd: 8 }));
    const all = await repo.all();
    expect(all.length).toBe(3);
    const [row] = summarizeOfferEvents(all);
    expect(row).toMatchObject({ impressions: 1, clicks: 1, conversions: 1, revenueUsd: 8 });
  });

  it("falls back to in-memory when no DATABASE_URL", () => {
    expect(getOfferEventRepository()).toBeInstanceOf(InMemoryOfferEventRepository);
  });
});
