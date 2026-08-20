/*
 * Creates the mosques table used by the standalone /mosques map. Sourced from
 * OpenStreetMap (scripts/fetch-mosques-overpass.ts + scripts/import-mosques.ts).
 * Independent of locations_location — mosques are not tied to a curated
 * retirement city and are not a Fit-score factor.
 *
 * Usage:
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/migrate-mosques.ts [--dry-run]
 */
import { getSql } from "../lib/db";

const dryRun = process.argv.includes("--dry-run");
const sql = getSql();

async function run(label: string, query: string) {
  if (dryRun) {
    console.log(`  = ${label} (skipped)`);
    return;
  }
  await sql.query(query);
  console.log(`  + ${label}`);
}

async function main() {
  console.log(`Mosques migration${dryRun ? " (dry run)" : ""}\n`);

  await run(
    "create mosques",
    `CREATE TABLE IF NOT EXISTS mosques (
      id bigserial PRIMARY KEY,
      osm_type text NOT NULL,
      osm_id bigint NOT NULL,
      name text,
      address text,
      city text,
      state text,
      latitude numeric NOT NULL,
      longitude numeric NOT NULL,
      phone text,
      website text,
      source_kind text NOT NULL DEFAULT 'openstreetmap',
      source_url text,
      source_retrieved_on date NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT mosques_osm_key UNIQUE (osm_type, osm_id)
    )`
  );
  await run(
    "index mosques by coordinates",
    `CREATE INDEX IF NOT EXISTS mosques_coordinates_idx
       ON mosques (latitude, longitude)`
  );

  console.log(`\n${dryRun ? "Dry run" : "Migration"} complete.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
