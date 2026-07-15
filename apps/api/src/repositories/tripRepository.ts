import type { Trip } from "@chatr/core";
import { pgDb, type Db } from "../db/client.js";

declare const process: { env: Record<string, string | undefined> };

export interface TripRepository {
  save(trip: Trip): Promise<Trip>;
  get(id: string): Promise<Trip | undefined>;
}

class InMemoryTripRepository implements TripRepository {
  private trips = new Map<string, Trip>();
  async save(trip: Trip) { this.trips.set(trip.id, trip); return trip; }
  async get(id: string) { return this.trips.get(id); }
}

// Stores the trip as JSONB (simple + flexible for the scaffold).
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
}

let repo: TripRepository | null = null;
export function getTripRepository(): TripRepository {
  if (repo) return repo;
  const url = process.env.DATABASE_URL;
  repo = url ? new PostgresTripRepository(pgDb(url)) : new InMemoryTripRepository();
  return repo;
}

export { InMemoryTripRepository, PostgresTripRepository };
