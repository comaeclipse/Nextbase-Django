/*
 * Migration: Adds `latitude` and `longitude` columns to `locations_location`
 * and backfills all existing locations using Census Gazetteer place centroids
 * from the pace source bundle.
 *
 * Usage:
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/migrate-location-coordinates.ts [--dry-run]
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { getSql } from "../lib/db";
import type { PaceDerivedBundle, PacePlaceCentroid } from "../lib/pace/types";

const ROOT = process.cwd();
const BUNDLE_PATH = path.join(
  ROOT,
  "data",
  "sources",
  "pace",
  "derived",
  "pace_derived.json"
);

type LocationKey = `${string}|${string}`;

const PLACE_ALIASES: Record<LocationKey, LocationKey> = {
  "Indianopolis|IN": "indianapolis city (balance)|IN",
  "Honolulu|HI": "urban honolulu|HI",
  "Boise|ID": "boise city|ID",
  "Nashville|TN": "nashville-davidson metropolitan government (balance)|TN",
};

function key(name: string, state: string): LocationKey {
  return `${name.trim().toLowerCase().replace(/\s+/g, " ")}|${state.trim().toUpperCase()}`;
}

function findPoint(
  centroids: Record<string, PacePlaceCentroid>,
  name: string,
  state: string
): PacePlaceCentroid | undefined {
  const original = key(name, state);
  return centroids[PLACE_ALIASES[`${name}|${state}`] ?? original];
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const bundleText = readFileSync(BUNDLE_PATH, "utf8");
  const bundle = JSON.parse(bundleText) as PaceDerivedBundle;

  if (!bundle.place_centroids) {
    throw new Error(`Pace bundle has no place_centroids: ${BUNDLE_PATH}`);
  }

  const sql = getSql();

  if (!dryRun) {
    console.log("Adding latitude and longitude columns to locations_location if not exists...");
    await sql.query(`
      ALTER TABLE locations_location 
      ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
      ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;
    `);
  }

  const locations = (await sql.query(
    "SELECT id, name, state, latitude, longitude FROM locations_location ORDER BY id ASC"
  )) as {
    id: number;
    name: string;
    state: string;
    latitude: number | null;
    longitude: number | null;
  }[];

  console.log(`Found ${locations.length} total location(s) in database.`);

  let updatedCount = 0;
  let missingCount = 0;

  for (const loc of locations) {
    const point = findPoint(bundle.place_centroids, loc.name, loc.state);
    if (!point) {
      console.warn(`⚠️ Warning: No centroid found for ${loc.name}, ${loc.state} (id: ${loc.id})`);
      missingCount++;
      continue;
    }

    const lat = point.lat;
    const lon = point.lon;

    if (dryRun) {
      console.log(`[Dry Run] Would update ${loc.name}, ${loc.state} (id: ${loc.id}) -> lat: ${lat}, lon: ${lon}`);
    } else {
      await sql.query(
        "UPDATE locations_location SET latitude = $1, longitude = $2 WHERE id = $3",
        [lat, lon, loc.id]
      );
      console.log(`Updated ${loc.name}, ${loc.state} (id: ${loc.id}) -> lat: ${lat}, lon: ${lon}`);
    }
    updatedCount++;
  }

  console.log(
    dryRun
      ? `\n[Dry Run] Finished. Would update ${updatedCount} location(s). ${missingCount} missing.`
      : `\nMigration complete! Updated ${updatedCount} location(s). ${missingCount} missing.`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
