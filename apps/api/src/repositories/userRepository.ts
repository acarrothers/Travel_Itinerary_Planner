import type { User } from "@trip-itinerary/core";
import { pgDb, type Db } from "../db/client.js";

declare const process: { env: Record<string, string | undefined> };

export interface StoredUser extends User {
  passwordHash: string | null; // null for SSO accounts
  provider: string;            // 'password' | 'google' | 'apple'
  emailVerified: boolean;
}

export const DEFAULT_ACCOUNT_LIMITS: Record<string, number> = { general: 1, pro: 25, unlimited: -1 };
const uid = () => Math.random().toString(36).slice(2, 14);

export interface UserRepository {
  createUser(u: StoredUser): Promise<User>;
  getByEmail(email: string): Promise<StoredUser | undefined>;
  getById(id: string): Promise<StoredUser | undefined>;
  findOrCreateByEmail(email: string, provider: string): Promise<StoredUser>;
  setEmailVerified(userId: string, verified: boolean): Promise<void>;
  setPasswordHash(userId: string, passwordHash: string): Promise<void>;
  getAccountLimits(): Promise<Record<string, number>>;
  setAccountLimit(accountType: string, dailyTripLimit: number): Promise<void>;
}

const toPublic = (u: StoredUser): User => ({ id: u.id, email: u.email, accountType: u.accountType, createdAt: u.createdAt });

async function findOrCreate(repo: UserRepository, email: string, provider: string): Promise<StoredUser> {
  const existing = await repo.getByEmail(email);
  if (existing) return existing;
  // SSO accounts arrive with a provider-verified email.
  const stored: StoredUser = { id: uid(), email, accountType: "general", createdAt: new Date().toISOString(), passwordHash: null, provider, emailVerified: true };
  await repo.createUser(stored);
  return stored;
}

class InMemoryUserRepository implements UserRepository {
  private users = new Map<string, StoredUser>();
  private limits: Record<string, number> = { ...DEFAULT_ACCOUNT_LIMITS };
  async createUser(u: StoredUser) { this.users.set(u.email.toLowerCase(), u); return toPublic(u); }
  async getByEmail(email: string) { return this.users.get(email.toLowerCase()); }
  async getById(id: string) { return [...this.users.values()].find((u) => u.id === id); }
  findOrCreateByEmail(email: string, provider: string) { return findOrCreate(this, email, provider); }
  async setEmailVerified(userId: string, v: boolean) { const u = await this.getById(userId); if (u) u.emailVerified = v; }
  async setPasswordHash(userId: string, h: string) { const u = await this.getById(userId); if (u) u.passwordHash = h; }
  async getAccountLimits() { return { ...this.limits }; }
  async setAccountLimit(t: string, n: number) { this.limits[t] = n; }
}

class PostgresUserRepository implements UserRepository {
  constructor(private db: Db) {}
  async createUser(u: StoredUser) {
    await this.db.query(
      `INSERT INTO users (id, email, password_hash, provider, account_type, email_verified, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [u.id, u.email.toLowerCase(), u.passwordHash, u.provider, u.accountType, u.emailVerified, u.createdAt],
    );
    return toPublic(u);
  }
  private map(r: any): StoredUser | undefined {
    return r ? { id: r.id, email: r.email, passwordHash: r.password_hash ?? null, provider: r.provider, accountType: r.account_type, emailVerified: !!r.email_verified, createdAt: r.created_at } : undefined;
  }
  async getByEmail(email: string) { return this.map((await this.db.query(`SELECT * FROM users WHERE email = $1`, [email.toLowerCase()])).rows[0]); }
  async getById(id: string) { return this.map((await this.db.query(`SELECT * FROM users WHERE id = $1`, [id])).rows[0]); }
  findOrCreateByEmail(email: string, provider: string) { return findOrCreate(this, email, provider); }
  async setEmailVerified(userId: string, v: boolean) { await this.db.query(`UPDATE users SET email_verified = $2 WHERE id = $1`, [userId, v]); }
  async setPasswordHash(userId: string, h: string) { await this.db.query(`UPDATE users SET password_hash = $2 WHERE id = $1`, [userId, h]); }
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
