/*
 * Creates location_military_proximity — every geocoded retirement city paired
 * with every geocoded active military installation, with a Haversine distance.
 * This is the query layer for near_base; it does not touch defense_hub.
 *
 * Usage:
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/migrate-military-proximity.ts [--dry-run]
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
  console.log(`Military-proximity migration${dryRun ? " (dry run)" : ""}\n`);

  await run(
    "create location_military_proximity",
    `CREATE TABLE IF NOT EXISTS location_military_proximity (
      location_id bigint NOT NULL REFERENCES locations_location(id) ON DELETE CASCADE,
      military_installation_id bigint NOT NULL REFERENCES military_installations(id) ON DELETE CASCADE,
      distance_miles numeric(8,2) NOT NULL,
      computed_on timestamptz NOT NULL DEFAULT now(),
      PRIMARY KEY (location_id, military_installation_id)
    )`
  );
  await run(
    "index proximity by location + distance",
    `CREATE INDEX IF NOT EXISTS location_military_proximity_location_distance_idx
       ON location_military_proximity (location_id, distance_miles)`
  );
  await run(
    "index proximity by installation",
    `CREATE INDEX IF NOT EXISTS location_military_proximity_installation_idx
       ON location_military_proximity (military_installation_id)`
  );

  console.log(`\n${dryRun ? "Dry run" : "Migration"} complete.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
