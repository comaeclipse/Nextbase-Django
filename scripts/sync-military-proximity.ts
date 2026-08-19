/*
 * Recomputes location_military_proximity from current coordinates.
 *
 * Every geocoded locations_location row is paired with every geocoded active
 * military_installations row. Distances are great-circle miles (same Earth
 * radius as scripts/sync-va-facilities.ts). Cities or installations without
 * coordinates are skipped, not guessed.
 *
 * Idempotent: upserts the current cartesian product, then deletes pairs whose
 * computed_on is not this run (dropped cities, newly-null coordinates, etc.).
 *
 * Usage:
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/sync-military-proximity.ts [--dry-run]
 */
import { getSql } from "../lib/db";

const EARTH_RADIUS_MI = 3958.8;
const dryRun = process.argv.includes("--dry-run");
const sql = getSql();

const DISTANCE_SQL = `${EARTH_RADIUS_MI} * 2 * asin(least(1, sqrt(
  power(sin(radians((m.latitude::float8 - l.latitude::float8) / 2)), 2) +
  cos(radians(l.latitude::float8)) * cos(radians(m.latitude::float8)) *
  power(sin(radians((m.longitude::float8 - l.longitude::float8) / 2)), 2)
)))`;

async function main() {
  console.log(`Military proximity sync${dryRun ? " (dry run)" : ""}\n`);

  const [coverage] = (await sql.query(
    `SELECT
       (SELECT count(*)::int FROM locations_location) AS locations,
       (SELECT count(*)::int FROM locations_location
         WHERE latitude IS NOT NULL AND longitude IS NOT NULL) AS geocoded_locations,
       (SELECT count(*)::int FROM military_installations
         WHERE operational_status = 'active') AS active_installations,
       (SELECT count(*)::int FROM military_installations
         WHERE operational_status = 'active'
           AND latitude IS NOT NULL AND longitude IS NOT NULL) AS geocoded_installations`
  )) as {
    locations: number;
    geocoded_locations: number;
    active_installations: number;
    geocoded_installations: number;
  }[];

  const unresolvedInstallations = (await sql.query(
    `SELECT service_branch, command_name, city, state
     FROM military_installations
     WHERE operational_status = 'active'
       AND (latitude IS NULL OR longitude IS NULL)
     ORDER BY service_branch, command_name`
  )) as { service_branch: string; command_name: string; city: string; state: string }[];

  const expectedPairs =
    coverage.geocoded_locations * coverage.geocoded_installations;
  console.log(
    `Cities ${coverage.geocoded_locations}/${coverage.locations} geocoded; ` +
      `active installations ${coverage.geocoded_installations}/${coverage.active_installations} geocoded; ` +
      `${expectedPairs} pairs.`
  );
  if (unresolvedInstallations.length > 0) {
    console.log("Unresolved installations (excluded from proximity):");
    for (const row of unresolvedInstallations) {
      console.log(
        `  - ${row.command_name} (${row.service_branch}; ${row.city}, ${row.state})`
      );
    }
  }

  const samples = (await sql.query(
    `SELECT l.name, l.state, m.command_name, m.service_branch,
            round((${DISTANCE_SQL})::numeric, 1) AS distance_miles
     FROM locations_location l
     JOIN military_installations m
       ON m.operational_status = 'active'
      AND m.latitude IS NOT NULL AND m.longitude IS NOT NULL
     WHERE l.latitude IS NOT NULL AND l.longitude IS NOT NULL
       AND l.name IN ('Pensacola', 'Norfolk', 'Fayetteville', 'Colorado Springs')
     ORDER BY l.name, distance_miles, m.command_name`
  )) as {
    name: string;
    state: string;
    command_name: string;
    service_branch: string;
    distance_miles: string;
  }[];

  const nearestByCity = new Map<string, (typeof samples)[number]>();
  for (const row of samples) {
    const key = `${row.name}, ${row.state}`;
    if (!nearestByCity.has(key)) nearestByCity.set(key, row);
  }
  console.log("\nSample nearest bases:");
  for (const [city, row] of nearestByCity) {
    console.log(
      `  ${city}: ${row.command_name} — ${row.service_branch} — ${row.distance_miles} mi`
    );
  }

  if (dryRun) {
    console.log(`\nDry run complete. Would upsert ${expectedPairs} pair(s).`);
    return;
  }

  const computedOn = new Date().toISOString();
  await sql.query(
    `INSERT INTO location_military_proximity (
       location_id, military_installation_id, distance_miles, computed_on
     )
     SELECT l.id, m.id, round((${DISTANCE_SQL})::numeric, 2), $1::timestamptz
     FROM locations_location l
     JOIN military_installations m
       ON m.operational_status = 'active'
      AND m.latitude IS NOT NULL AND m.longitude IS NOT NULL
     WHERE l.latitude IS NOT NULL AND l.longitude IS NOT NULL
     ON CONFLICT (location_id, military_installation_id) DO UPDATE SET
       distance_miles = EXCLUDED.distance_miles,
       computed_on = EXCLUDED.computed_on`,
    [computedOn]
  );

  const deleted = (await sql.query(
    `DELETE FROM location_military_proximity
     WHERE computed_on IS DISTINCT FROM $1::timestamptz
     RETURNING location_id`,
    [computedOn]
  )) as { location_id: number }[];

  const [{ pairs }] = (await sql.query(
    `SELECT count(*)::int AS pairs FROM location_military_proximity`
  )) as { pairs: number }[];

  console.log(
    `\nSync complete. ${pairs} pair(s) stored` +
      (deleted.length > 0 ? `, ${deleted.length} stale pair(s) removed` : "") +
      "."
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
