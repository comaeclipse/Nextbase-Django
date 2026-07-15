/*
 * Produces the small, deployable coordinate crosswalk used by /map.
 *
 * Coordinates are Census 2024 Gazetteer place internal points already captured
 * in the pace source bundle. Keeping the rendered-map input small avoids
 * loading the classifier's 12 MB national bundle at request time.
 *
 * Usage:
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/prepare-map-coordinates.ts
 */
import { readFileSync, writeFileSync } from "node:fs";
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
const OUTPUT_PATH = path.join(ROOT, "data", "location-map-coordinates.json");

type LocationKey = `${string}|${string}`;

interface MapCoordinate {
  name: string;
  state: string;
  census_place_geoid: string;
  latitude: number;
  longitude: number;
}

// The Gazetteer uses the official Census place labels for these three cities.
// Retain product-facing names in locations_location and normalize only here.
const PLACE_ALIASES: Record<LocationKey, LocationKey> = {
  "Indianopolis|IN": "indianapolis city (balance)|IN",
  "Honolulu|HI": "urban honolulu|HI",
  "Boise|ID": "boise city|ID",
  "Nashville|TN": "nashville-davidson metropolitan government (balance)|TN",
};

function key(name: string, state: string): LocationKey {
  return `${name.trim().toLowerCase().replace(/\s+/g, " ")}|${state.trim().toUpperCase()}`;
}

function readBundle(): PaceDerivedBundle {
  return JSON.parse(readFileSync(BUNDLE_PATH, "utf8")) as PaceDerivedBundle;
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
  const bundle = readBundle();
  if (!bundle.place_centroids) {
    throw new Error(`Pace bundle has no place_centroids: ${BUNDLE_PATH}`);
  }
  const sql = getSql();
  const locations = (await sql.query(
    "SELECT name, state FROM locations_location ORDER BY state, name"
  )) as { name: string; state: string }[];

  const coordinates: MapCoordinate[] = [];
  const missing: string[] = [];
  for (const location of locations) {
    const point = findPoint(bundle.place_centroids, location.name, location.state);
    if (!point) {
      missing.push(`${location.name}, ${location.state}`);
      continue;
    }
    coordinates.push({
      name: location.name,
      state: location.state,
      census_place_geoid: point.geoid,
      latitude: point.lat,
      longitude: point.lon,
    });
  }

  if (missing.length) {
    throw new Error(
      `No Census place coordinate for ${missing.length} location(s): ${missing.join("; ")}`
    );
  }

  writeFileSync(
    OUTPUT_PATH,
    JSON.stringify(
      {
        source: "U.S. Census Bureau 2024 Gazetteer Files, Places",
        source_url:
          "https://www.census.gov/geographies/reference-files/time-series/geo/gazetteer-files.html",
        coordinates,
      },
      null,
      2
    ) + "\n"
  );
  console.log(`Wrote ${coordinates.length} location coordinate(s) to ${OUTPUT_PATH}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
