import type { OfferEvent } from "@chatr/core";
import { pgDb, type Db } from "../db/client.js";

declare const process: { env: Record<string, string | undefined> };

export interface OfferEventRepository {
  log(event: OfferEvent): Promise<OfferEvent>;
  all(): Promise<OfferEvent[]>;
}

class InMemoryOfferEventRepository implements OfferEventRepository {
  private events: OfferEvent[] = [];
  async log(e: OfferEvent) { this.events.push(e); return e; }
  async all() { return [...this.events]; }
}

class PostgresOfferEventRepository implements OfferEventRepository {
  constructor(private db: Db) {}
  async log(e: OfferEvent) {
    await this.db.query(
      `INSERT INTO offer_events (id, offer_id, partner_id, trip_id, type, surface, commission_usd, ts)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [e.id, e.offerId, e.partnerId ?? null, e.tripId ?? null, e.type, e.surface ?? null, e.commissionUsd ?? null, e.timestamp],
    );
    return e;
  }
  async all() {
    const r = await this.db.query(
      `SELECT id, offer_id AS "offerId", partner_id AS "partnerId", trip_id AS "tripId",
              type, surface, commission_usd AS "commissionUsd", ts AS "timestamp" FROM offer_events`,
    );
    return r.rows.map((row: any) => ({
      ...row,
      commissionUsd: row.commissionUsd == null ? undefined : Number(row.commissionUsd),
    })) as OfferEvent[];
  }
}

let repo: OfferEventRepository | null = null;
export function getOfferEventRepository(): OfferEventRepository {
  if (repo) return repo;
  const url = process.env.DATABASE_URL;
  repo = url ? new PostgresOfferEventRepository(pgDb(url)) : new InMemoryOfferEventRepository();
  return repo;
}

export { InMemoryOfferEventRepository, PostgresOfferEventRepository };
