import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

/*
 * Read-only connection to the existing Neon Postgres database.
 * We keep the original Django table/column names (see MIGRATION_PLAN.md), so
 * queries use `locations_location` / `locations_stateinfo` directly.
 *
 * Lazily initialized so `next build` never throws when DATABASE_URL is absent
 * at build time; the client is created on first query.
 */
let _sql: NeonQueryFunction<false, false> | null = null;

export function getSql(): NeonQueryFunction<false, false> {
  if (_sql) return _sql;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL environment variable is required (Neon connection string)."
    );
  }
  _sql = neon(url);
  return _sql;
}
