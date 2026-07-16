import type { User } from "@trip-itinerary/core";
import { pgDb, type Db } from "../db/client.js";

declare const process: { env: Record<string, string | undefined> };

export interface StoredUser extends User { passwordHash: string; }

// Default, configurable limits (persisted in account_limits; edit the table to tune).
export const DEFAULT_ACCOUNT_LIMITS: Record<string, number> = { general: 1, pro: 25, unlimited: -1 };

export interface UserRepository {
  createUser(u: StoredUser): Promise<User>;
  getByEmail(email: string): Promise<StoredUser | undefined>;
  getById(id: string): Promise<StoredUser | undefined>;
  getAccountLimits(): Promise<Record<string, number>>;
  setAccountLimit(accountType: string, dailyTripLimit: number): Promise<void>;
}

const toPublic = (u: StoredUser): User => ({ id: u.id, email: u.email, accountType: u.accountType, createdAt: u.createdAt });

class InMemoryUserRepository implements UserRepository {
  private users = new Map<string, StoredUser>();
  private limits: Record<string, number> = { ...DEFAULT_ACCOUNT_LIMITS };
  async createUser(u: StoredUser) { this.users.set(u.email.toLowerCase(), u); return toPublic(u); }
  async getByEmail(email: string) { return this.users.get(email.toLowerCase()); }
  async getById(id: string) { return [...this.users.values()].find((u) => u.id === id); }
  async getAccountLimits() { return { ...this.limits }; }
  async setAccountLimit(t: string, n: number) { this.limits[t] = n; }
}

class PostgresUserRepository implements UserRepository {
  constructor(private db: Db) {}
  async createUser(u: StoredUser) {
    await this.db.query(
      `INSERT INTO users (id, email, password_hash, account_type, created_at)
       VALUES ($1,$2,$3,$4,$5)`,
      [u.id, u.email.toLowerCase(), u.passwordHash, u.accountType, u.createdAt],
    );
    return toPublic(u);
  }
  private map(r: any): StoredUser | undefined {
    return r ? { id: r.id, email: r.email, passwordHash: r.password_hash, accountType: r.account_type, createdAt: r.created_at } : undefined;
  }
  async getByEmail(email: string) {
    const r = await this.db.query(`SELECT * FROM users WHERE email = $1`, [email.toLowerCase()]);
    return this.map(r.rows[0]);
  }
  async getById(id: string) {
    const r = await this.db.query(`SELECT * FROM users WHERE id = $1`, [id]);
    return this.map(r.rows[0]);
  }
  async getAccountLimits() {
    const r = await this.db.query(`SELECT account_type, daily_trip_limit FROM account_limits`);
    const out: Record<string, number> = {};
    for (const row of r.rows) out[row.account_type] = Number(row.daily_trip_limit);
    return Object.keys(out).length ? out : { ...DEFAULT_ACCOUNT_LIMITS };
  }
  async setAccountLimit(t: string, n: number) {
    await this.db.query(
      `INSERT INTO account_limits (account_type, daily_trip_limit) VALUES ($1,$2)
       ON CONFLICT (account_type) DO UPDATE SET daily_trip_limit = EXCLUDED.daily_trip_limit`,
      [t, n],
    );
  }
}

// Seed the configurable limits table (idempotent).
export async function seedAccountLimits(repo: UserRepository): Promise<void> {
  const cur = await repo.getAccountLimits();
  for (const [t, n] of Object.entries(DEFAULT_ACCOUNT_LIMITS)) {
    if (!(t in cur)) await repo.setAccountLimit(t, n);
  }
}

let repo: UserRepository | null = null;
export function getUserRepository(): UserRepository {
  if (repo) return repo;
  const url = process.env.DATABASE_URL;
  repo = url ? new PostgresUserRepository(pgDb(url)) : new InMemoryUserRepository();
  return repo;
}

export { InMemoryUserRepository, PostgresUserRepository };
