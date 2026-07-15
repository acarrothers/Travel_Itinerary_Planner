// Minimal DB seam so repositories don't depend on a concrete driver. Production uses
// node-postgres (pg) with a connection pool; tests inject any engine.
export interface Db {
  query(text: string, params?: unknown[]): Promise<{ rows: any[] }>;
}

declare const process: { env: Record<string, string | undefined> };

// Enable SSL for managed providers. Neon/most cloud URLs include `sslmode=require`;
// otherwise opt in with PGSSL=true. Left off for local Docker and Railway's private
// network (which connect without SSL).
function needsSsl(connectionString: string): boolean {
  if (/sslmode=require/i.test(connectionString)) return true;
  return process.env.PGSSL === "true";
}

// pg-backed Db with a bounded connection pool. Point DATABASE_URL at the provider's
// pooled endpoint (e.g. Neon's -pooler host) when running serverless.
export function pgDb(connectionString: string): Db {
  // @ts-ignore pg is an optional runtime dependency (installed via pnpm)
  const poolPromise = import("pg").then(({ Pool }: any) => new Pool({
    connectionString,
    max: Number(process.env.PG_POOL_MAX ?? 10),
    ssl: needsSsl(connectionString) ? { rejectUnauthorized: false } : undefined,
  }));
  return {
    async query(text, params) {
      const pool = await poolPromise;
      return pool.query(text, params as any[]);
    },
  };
}
