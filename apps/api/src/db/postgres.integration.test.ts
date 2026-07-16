import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import type { Db } from "./client";
import { PostgresTripRepository } from "../repositories/tripRepository";
import { PostgresOfferRepository, seedIfEmpty } from "../repositories/offerRepository";
import { PostgresOfferEventRepository } from "../repositories/offerEventRepository";
import { summarizeOfferEvents, type Trip, type Offer, type OfferEvent } from "@trip-itinerary/core";

let db: Db;

beforeAll(async () => {
  const pg = new PGlite(); // a real Postgres engine (WASM), in-process
  const schema = readFileSync(fileURLToPath(new URL("./schema.sql", import.meta.url)), "utf8");
  await pg.exec(schema);
  db = { query: (text, params) => pg.query(text, params as any[]) as any };
});

const trip = (id: string): Trip => ({
  id, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  preferences: { destinations: ["Lisbon"], nights: 1, party: "couple", adults: 2, children: 0, budget: "mid", interests: ["food"], pace: "balanced" },
  days: [{ id: "d1", order: 1, items: [{ id: "i1", type: "activity", title: "Castle", categoryTags: ["history"], coords: { lat: 1, lng: 2 } }] }],
});

describe("Postgres repositories (real engine)", () => {
  it("persists and reads a trip as JSONB", async () => {
    const repo = new PostgresTripRepository(db);
    await repo.save(trip("t-pg-1"));
    const got = await repo.get("t-pg-1");
    expect(got?.days[0].items[0].title).toBe("Castle");
  });

  it("seeds + CRUDs offers", async () => {
    const repo = new PostgresOfferRepository(db);
    await seedIfEmpty(repo);
    expect((await repo.listLiveOffers()).length).toBeGreaterThan(0);
    const o: Offer = { id: "pg-offer", partnerId: "viator", title: "PG Offer", ctaLabel: "Go", destinationUrl: "https://x", category: "tours", tags: ["food"], targeting: [], priority: 5, surfaces: ["post_generation"], status: "live" };
    await repo.saveOffer(o);
    expect((await repo.getOffer("pg-offer"))!.title).toBe("PG Offer");
    await repo.deleteOffer("pg-offer");
    expect(await repo.getOffer("pg-offer")).toBeUndefined();
  });

  it("logs offer events and reports the funnel", async () => {
    const repo = new PostgresOfferEventRepository(db);
    const e = (type: OfferEvent["type"], commissionUsd?: number): OfferEvent =>
      ({ id: Math.random().toString(), offerId: "pg-rep", partnerId: "viator", type, commissionUsd, timestamp: new Date().toISOString() });
    await repo.log(e("impression"));
    await repo.log(e("click"));
    await repo.log(e("conversion", 12));
    const rows = summarizeOfferEvents((await repo.all()).filter((x) => x.offerId === "pg-rep"));
    expect(rows[0]).toMatchObject({ impressions: 1, clicks: 1, conversions: 1, revenueUsd: 12 });
  });
});
