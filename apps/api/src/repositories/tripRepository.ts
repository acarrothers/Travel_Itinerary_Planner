import type { Trip } from "@trip-itinerary/core";
import { pgDb, type Db } from "../db/client.js";

declare const process: { env: Record<string, string | undefined> };

export interface TripRepository {
  save(trip: Trip): Promise<Trip>;
  get(id: string): Promise<Trip | undefined>;
  countTripsSince(userId: string, sinceIso: string): Promise<number>;
}

class InMemoryTripRepository implements TripRepository {
  private trips = new Map<string, Trip>();
  async save(trip: Trip) { this.trips.set(trip.id, trip); return trip; }
  async get(id: string) { return this.trips.get(id); }
  async countTripsSince(userId: string, sinceIso: string) {
    return [...this.trips.values()].filter((t) => t.userId === userId && t.createdAt >= sinceIso).length;
  }
}

// Stores the trip as JSONB; user_id + created_at columns power ownership + rate limits.
class PostgresTripRepository implements TripRepository {
  constructor(private db: Db) {}
  async save(trip: Trip) {
    await this.db.query(
      `INSERT INTO trips (id, user_id, data, created_at, updated_at)
       VALUES ($1, $2, $3::jsonb, now(), now())
       ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()`,
      [trip.id, trip.userId ?? null, JSON.stringify(trip)],
    );
    return trip;
  }
  async get(id: string) {
    const r = await this.db.query(`SELECT data FROM trips WHERE id = $1`, [id]);
    return r.rows[0]?.data as Trip | undefined;
  }
  async countTripsSince(userId: string, sinceIso: string) {
    const r = await this.db.query(
      `SELECT count(*)::int AS n FROM trips WHERE user_id = $1 AND created_at >= $2`,
      [userId, sinceIso],
    );
    return Number(r.rows[0]?.n ?? 0);
  }
}

let repo: TripRepository | null = null;
export function getTripRepository(): TripRepository {
  if (repo) return repo;
  const url = process.env.DATABASE_URL;
  repo = url ? new PostgresTripRepository(pgDb(url)) : new InMemoryTripRepository();
  return repo;
}

export { InMemoryTripRepository, PostgresTripRepository };
