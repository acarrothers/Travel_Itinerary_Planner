import type { Offer, Partner } from "@trip-itinerary/core";
import { pgDb, type Db } from "../db/client.js";
import { seedOffers, seedPartners } from "./seed.js";

declare const process: { env: Record<string, string | undefined> };

export interface OfferRepository {
  listOffers(): Promise<Offer[]>;
  listLiveOffers(): Promise<Offer[]>;
  getOffer(id: string): Promise<Offer | undefined>;
  saveOffer(offer: Offer): Promise<Offer>;
  deleteOffer(id: string): Promise<void>;
  listPartners(): Promise<Partner[]>;
  savePartner(partner: Partner): Promise<Partner>;
}

class InMemoryOfferRepository implements OfferRepository {
  private offers = new Map<string, Offer>();
  private partners = new Map<string, Partner>();
  constructor() {
    seedPartners.forEach((p) => this.partners.set(p.id, p));
    seedOffers.forEach((o) => this.offers.set(o.id, o));
  }
  async listOffers() { return [...this.offers.values()]; }
  async listLiveOffers() { return [...this.offers.values()].filter((o) => o.status === "live"); }
  async getOffer(id: string) { return this.offers.get(id); }
  async saveOffer(o: Offer) { this.offers.set(o.id, o); return o; }
  async deleteOffer(id: string) { this.offers.delete(id); }
  async listPartners() { return [...this.partners.values()]; }
  async savePartner(p: Partner) { this.partners.set(p.id, p); return p; }
}

class PostgresOfferRepository implements OfferRepository {
  constructor(private db: Db) {}
  async listOffers() {
    const r = await this.db.query(`SELECT data FROM offers ORDER BY (data->>'priority')::int DESC`);
    return r.rows.map((x) => x.data as Offer);
  }
  async listLiveOffers() {
    const r = await this.db.query(`SELECT data FROM offers WHERE status = 'live' ORDER BY (data->>'priority')::int DESC`);
    return r.rows.map((x) => x.data as Offer);
  }
  async getOffer(id: string) {
    const r = await this.db.query(`SELECT data FROM offers WHERE id = $1`, [id]);
    return r.rows[0]?.data as Offer | undefined;
  }
  async saveOffer(o: Offer) {
    await this.db.query(
      `INSERT INTO offers (id, partner_id, status, data) VALUES ($1,$2,$3,$4::jsonb)
       ON CONFLICT (id) DO UPDATE SET partner_id = EXCLUDED.partner_id, status = EXCLUDED.status, data = EXCLUDED.data`,
      [o.id, o.partnerId, o.status, JSON.stringify(o)],
    );
    return o;
  }
  async deleteOffer(id: string) { await this.db.query(`DELETE FROM offers WHERE id = $1`, [id]); }
  async listPartners() {
    const r = await this.db.query(`SELECT data FROM partners ORDER BY data->>'name'`);
    return r.rows.map((x) => x.data as Partner);
  }
  async savePartner(p: Partner) {
    await this.db.query(
      `INSERT INTO partners (id, data) VALUES ($1,$2::jsonb)
       ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data`,
      [p.id, JSON.stringify(p)],
    );
    return p;
  }
}

// Seed a Postgres-backed repo if empty (so a fresh DB still serves an offer).
export async function seedIfEmpty(repo: OfferRepository): Promise<void> {
  if ((await repo.listOffers()).length === 0) {
    for (const p of seedPartners) await repo.savePartner(p);
    for (const o of seedOffers) await repo.saveOffer(o);
  }
}

let repo: OfferRepository | null = null;
export function getOfferRepository(): OfferRepository {
  if (repo) return repo;
  const url = process.env.DATABASE_URL;
  repo = url ? new PostgresOfferRepository(pgDb(url)) : new InMemoryOfferRepository();
  return repo;
}

export { InMemoryOfferRepository, PostgresOfferRepository };
