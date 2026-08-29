/*
 * Finds employer geographies that have coordinates but no metro, and works out
 * which CBSA they belong to by asking the Census CBSA layer directly.
 *
 * Why any are missing: resolve-employer-geographies.ts fills each anchor's CBSA
 * from the county -> CBSA crosswalk in pace_derived.json, which is keyed on
 * county FIPS. Connecticut replaced its eight counties with nine PLANNING
 * REGIONS in 2022, and the crosswalk still holds 09001-09015 -- so every
 * Connecticut place reverse-geocodes to something like "Capitol (09110)", finds
 * no entry, and ends up with no metro. East Hartford's 153 onsite/hybrid Pratt
 * & Whitney postings are in that group.
 *
 * Querying the CBSA layer at the row's own coordinates sidesteps the
 * crosswalk's vintage entirely, and handles any future boundary change the
 * same way.
 *
 * This script only DISCOVERS the CBSA and writes a metro CSV. Creating the
 * metro geography and linking members stays with sync-metro-geographies.ts,
 * which already creates a metro only when it holds both a curated city and an
 * anchor. The split matters here: the Hartford metro did not exist at all,
 * because no anchor had ever carried CBSA 25540 for it to be created from, so a
 * script that merely inserted memberships into existing metros would have fixed
 * nothing.
 *
 * Idempotent, and writes no database rows.
 *
 * Usage:
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/backfill-missing-metro-membership.ts [--dry-run]
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/sync-metro-geographies.ts data/employer_geographies_backfill_metro.csv
 */
import { writeFileSync } from "node:fs";
import path from "node:path";
import { getSql } from "../lib/db";

const dryRun = process.argv.includes("--dry-run");

const TIGER_CBSA =
  "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/tigerWMS_Current/MapServer/93/query";

async function cbsaAtPoint(
  lat: number,
  lon: number
): Promise<{ geoid: string; name: string } | null> {
  const url =
    `${TIGER_CBSA}?geometry=${lon},${lat}&geometryType=esriGeometryPoint&inSR=4326` +
    `&spatialRel=esriSpatialRelIntersects&outFields=NAME,GEOID&returnGeometry=false&f=json`;
  for (let i = 0; i < 3; i++) {
    try {
      const res = await fetch(url);
      const text = await res.text();
      // The service answers with an HTML error page when it is unhappy.
      if (text.trim().startsWith("{")) {
        const body = JSON.parse(text) as {
          features?: { attributes?: { GEOID?: string; NAME?: string } }[];
        };
        const a = body.features?.[0]?.attributes;
        return a?.GEOID ? { geoid: String(a.GEOID), name: String(a.NAME ?? "") } : null;
      }
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 600 * (i + 1)));
  }
  return null;
}

async function main() {
  const sql = getSql();

  const rows = (await sql.query(
    `SELECT l.id, l.name, l.state, l.latitude, l.longitude
     FROM locations_location l
     WHERE NOT l.is_candidate
       AND l.geo_type = 'city'
       AND l.latitude IS NOT NULL AND l.longitude IS NOT NULL
       AND NOT EXISTS (
         SELECT 1 FROM geo_relationships r
         WHERE r.child_geo_id = l.id
           AND r.relationship_type = 'metro_membership'
           AND r.valid_to IS NULL
       )
     ORDER BY l.state, l.name`
  )) as {
    id: number; name: string; state: string; latitude: number; longitude: number;
  }[];

  console.log(
    `${rows.length} employer geograph${rows.length === 1 ? "y" : "ies"} with coordinates but no metro` +
      `${dryRun ? " (dry run)" : ""}`
  );
  if (!rows.length) return;

  /*
   * A CBSA with no curated city in it has nothing to surface -- the metro line
   * on a city page is the only consumer -- so those are reported, not written.
   */
  const curatedCbsa = new Set(
    ((await sql.query(
      `SELECT DISTINCT r.bea_geo_code AS cbsa
       FROM locations_location l JOIN location_cost_rpp r ON r.location_id = l.id
       WHERE l.is_candidate AND r.bea_geo_type = 'msa' AND r.bea_geo_code IS NOT NULL`
    )) as { cbsa: string }[]).map((r) => String(r.cbsa))
  );

  const useful: { row: (typeof rows)[number]; cbsa: { geoid: string; name: string } }[] = [];
  const noCuratedCity: string[] = [];
  const noCbsa: string[] = [];

  for (const row of rows) {
    const cbsa = await cbsaAtPoint(Number(row.latitude), Number(row.longitude));
    const label = `${row.name}, ${row.state}`;
    if (!cbsa) {
      noCbsa.push(label);
      continue;
    }
    if (!curatedCbsa.has(cbsa.geoid)) {
      noCuratedCity.push(`${label} -> ${cbsa.name} (${cbsa.geoid})`);
      continue;
    }
    useful.push({ row, cbsa });
    console.log(`  + ${label.padEnd(28)} ${cbsa.name} (${cbsa.geoid})`);
  }

  const esc = (v: string) => (/[",]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  const slugOf = (name: string, state: string) =>
    `${state.toLowerCase()}-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
  const lines = ["Slug,City,State,CbsaGeoid"];
  for (const { row, cbsa } of useful) {
    lines.push([slugOf(row.name, row.state), esc(row.name), row.state, cbsa.geoid].join(","));
  }
  const outPath = path.join("data", "employer_geographies_backfill_metro.csv");
  if (!dryRun) writeFileSync(outPath, lines.join("\n") + "\n");

  if (dryRun) {
    console.log(`\nDry run. ${useful.length} place(s) would be written to the metro CSV.`);
  } else {
    console.log(`\nWrote ${useful.length} row(s) to ${outPath}.`);
    console.log("Run scripts/sync-metro-geographies.ts on it to create the metros and link members.");
  }

  if (noCuratedCity.length) {
    console.log(
      `\n${noCuratedCity.length} place(s) sit in a CBSA with no curated city, ` +
        `so a metro there would surface nothing:`
    );
    for (const n of noCuratedCity.slice(0, 8)) console.log(`  ${n}`);
    if (noCuratedCity.length > 8) console.log(`  ... ${noCuratedCity.length - 8} more`);
  }
  if (noCbsa.length) {
    console.log(`\n${noCbsa.length} place(s) are outside any CBSA (correct for Guam and rural sites).`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
