import "../env.js";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { getOfferRepository, seedIfEmpty } from "../repositories/offerRepository.js";

declare const process: { env: Record<string, string | undefined>; exit(code?: number): never };

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) { console.error("DATABASE_URL not set"); process.exit(1); }
  // @ts-ignore pg is an optional runtime dependency (installed via pnpm)
  const { Pool } = (await import("pg")) as any;
  const pool = new Pool({ connectionString: url });
  const here = dirname(fileURLToPath(import.meta.url));
  await pool.query(readFileSync(join(here, "schema.sql"), "utf8"));
  await seedIfEmpty(getOfferRepository());
  console.log("migration applied + catalog seeded");
  await pool.end();
}
main();
