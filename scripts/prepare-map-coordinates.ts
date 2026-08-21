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

const PLACE_ALIASES: Record<string, string> = {
  "indianapolis|IN": "indianapolis city (balance)|IN",
  "Indianapolis|IN": "indianapolis city (balance)|IN",
  "honolulu|HI": "urban honolulu|HI",
  "Honolulu|HI": "urban honolulu|HI",
  "boise|ID": "boise city|ID",
  "Boise|ID": "boise city|ID",
  "nashville|TN": "nashville-davidson metropolitan government (balance)|TN",
  "Nashville|TN": "nashville-davidson metropolitan government (balance)|TN",
  "kāneʻohe|HI": "kaneohe|HI",
  "Kāneʻohe|HI": "kaneohe|HI",
  "kaneʻohe|HI": "kaneohe|HI",
  "Kaneʻohe|HI": "kaneohe|HI",
};

const LEGACY_NON_PLACE_COORDINATES: Record<LocationKey, MapCoordinate> = {
  // McHenry is an unincorporated Stone County community, not a Census place.
  // Coordinates use the GNIS/USPS locality point rather than a neighboring CDP.
  "mchenry|MS": {
    name: "McHenry",
    state: "MS",
    census_place_geoid: "GNIS:693920",
    latitude: 30.70767,
    longitude: -89.154823,
  },
  // Rhode Island towns are county subdivisions in Census geography; this keeps
  // the official town GEOID already used by the live row.
  "north kingstown|RI": {
    name: "North Kingstown",
    state: "RI",
    census_place_geoid: "4400951580",
    latitude: 41.571527,
    longitude: -71.449907,
  },
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
  const alias = PLACE_ALIASES[original] ?? PLACE_ALIASES[`${name}|${state}`];
  return centroids[alias ?? original];
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
      const fallback = LEGACY_NON_PLACE_COORDINATES[key(location.name, location.state)];
      if (fallback) {
        coordinates.push(fallback);
        continue;
      }
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
