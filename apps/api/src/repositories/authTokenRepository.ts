import { isExpired } from "@trip-itinerary/core";
import { pgDb, type Db } from "../db/client.js";

declare const process: { env: Record<string, string | undefined> };

export type TokenType = "verify" | "reset";
export interface AuthToken { token: string; userId: string; type: TokenType; expiresAt: string; }

export interface AuthTokenRepository {
  create(t: AuthToken): Promise<void>;
  // Returns the userId and deletes the token if valid + unexpired; else undefined.
  consume(token: string, type: TokenType): Promise<string | undefined>;
}

class InMemoryAuthTokenRepository implements AuthTokenRepository {
  private m = new Map<string, AuthToken>();
  async create(t: AuthToken) { this.m.set(t.token, t); }
  async consume(token: string, type: TokenType) {
    const t = this.m.get(token);
    if (!t || t.type !== type) return undefined;
    this.m.delete(token);
    return isExpired(t.expiresAt) ? undefined : t.userId;
  }
}

class PostgresAuthTokenRepository implements AuthTokenRepository {
  constructor(private db: Db) {}
  async create(t: AuthToken) {
    await this.db.query(`INSERT INTO auth_tokens (token, user_id, type, expires_at) VALUES ($1,$2,$3,$4)`,
      [t.token, t.userId, t.type, t.expiresAt]);
  }
  async consume(token: string, type: TokenType) {
    const r = await this.db.query(
      `DELETE FROM auth_tokens WHERE token = $1 AND type = $2 RETURNING user_id, expires_at`, [token, type]);
    const row = r.rows[0];
    if (!row) return undefined;
    return isExpired(row.expires_at instanceof Date ? row.expires_at.toISOString() : String(row.expires_at)) ? undefined : (row.user_id as string);
  }
}

let repo: AuthTokenRepository | null = null;
export function getAuthTokenRepository(): AuthTokenRepository {
  if (repo) return repo;
  const url = process.env.DATABASE_URL;
  repo = url ? new PostgresAuthTokenRepository(pgDb(url)) : new InMemoryAuthTokenRepository();
  return repo;
}
export { InMemoryAuthTokenRepository, PostgresAuthTokenRepository };
