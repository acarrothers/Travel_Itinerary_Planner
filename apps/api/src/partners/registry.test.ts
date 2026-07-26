import { describe, it, expect } from "vitest";
import { fetchPartnerOffers, enabledPartnerIntegrations } from "./registry";
import { toPartnerOffer, type PartnerAdapter, type PartnerOfferQuery } from "./types";

const q: PartnerOfferQuery = { destination: "Lisbon, Portugal", interests: ["food"], nights: 3, budget: "mid", party: "couple" };

const mk = (id: string, opts: { enabled: boolean; count?: number; throws?: boolean }): PartnerAdapter => ({
  id, name: id, category: "tours",
  enabled: () => opts.enabled,
  async fetch(query) {
    if (opts.throws) throw new Error("boom");
    return Array.from({ length: opts.count ?? 1 }, (_, i) =>
      toPartnerOffer(id, "tours", query, { id: `${i}`, title: `${id} offer ${i}`, url: "https://x" }));
  },
});

describe("partner registry", () => {
  it("runs only enabled adapters and merges their offers", async () => {
    const out = await fetchPartnerOffers(q, [mk("a", { enabled: true, count: 2 }), mk("b", { enabled: false, count: 5 })]);
    expect(out).toHaveLength(2);
    expect(out.every((o) => o.partnerId === "a")).toBe(true);
  });

  it("returns [] when no adapter is enabled (catalog fallback happens upstream)", async () => {
    expect(await fetchPartnerOffers(q, [mk("a", { enabled: false })])).toEqual([]);
  });

  it("isolates a failing adapter — others still contribute", async () => {
    const out = await fetchPartnerOffers(q, [mk("bad", { enabled: true, throws: true }), mk("good", { enabled: true, count: 1 })]);
    expect(out.map((o) => o.partnerId)).toEqual(["good"]);
  });

  it("tags partner offers as localized to the destination", async () => {
    const [offer] = await fetchPartnerOffers(q, [mk("a", { enabled: true, count: 1 })]);
    expect(offer.status).toBe("live");
    expect(offer.targeting.some((r) => r.dimension === "destination" && Array.isArray(r.value) && (r.value as string[]).includes("Lisbon"))).toBe(true);
  });

  it("lists enabled integrations", () => {
    expect(enabledPartnerIntegrations([mk("a", { enabled: true }), mk("b", { enabled: false })])).toEqual(["a"]);
  });
});
