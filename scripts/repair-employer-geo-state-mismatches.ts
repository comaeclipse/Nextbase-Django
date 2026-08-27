/*
 * Removes the false geography from employer-anchor rows that were resolved into
 * the wrong state, without removing the rows themselves.
 *
 * Two fallbacks in scripts/resolve-employer-geographies.ts could answer with a
 * place in a different state than the employer feed named:
 *   - the military_installations lookup matched on a shared token and, failing
 *     to find one in-state, accepted one anywhere: "Carson City, NV" became
 *     Fort Carson, Colorado; "Fort Johnson, LA" became Seymour Johnson AFB in
 *     North Carolina; "Marine Corps Base Kaneohe Bay, HI" became Kings Bay,
 *     Georgia.
 *   - the Census street guess returned a same-named place elsewhere:
 *     "Schriever Afb, CO" became Schriever, Louisiana.
 *
 * The resolver now refuses a cross-state answer outright. This repairs the rows
 * that were imported before that guard existed.
 *
 * The row is KEPT and its employer postings stay linked, because the place is
 * real and the postings genuinely belong to it -- only the geography was wrong.
 * Coordinates, county, boundary id and metro membership are cleared, so the row
 * asserts nothing false. Re-resolving them needs a source this repo does not
 * have; they are listed as gaps instead.
 *
 * Idempotent. Verifies by geometry, not by a hardcoded list, so it also catches
 * any future cross-state row.
 *
 * Usage:
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/repair-employer-geo-state-mismatches.ts [--dry-run]
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { getSql } from "../lib/db";

const dryRun = process.argv.includes("--dry-run");

/*
 * How far a row's coordinates may sit from the nearest place in its own state
 * before the resolution is treated as a mis-match rather than a border city.
 * Generous on purpose: a false positive here would erase a correct geography.
 */
const BORDER_TOLERANCE_MI = 25;

interface Centroid { geoid: string; name: string; state: string; lat: number; lon: number }

function milesBetween(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const R = 3958.8;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(bLat - aLat);
  const dLon = rad(bLon - aLon);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(aLat)) * Math.cos(rad(bLat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

async function main() {
  const sql = getSql();
  const derived = JSON.parse(
    readFileSync(
      path.join(process.cwd(), "data", "sources", "pace", "derived", "pace_derived.json"),
      "utf8"
    )
  ) as { place_centroids: Record<string, Centroid> };
  const points = Object.values(derived.place_centroids);

  const rows = (await sql.query(
    `SELECT id, name, state, county, latitude, longitude
     FROM locations_location
     WHERE NOT is_candidate AND geo_type = 'city'
       AND latitude IS NOT NULL AND longitude IS NOT NULL`
  )) as { id: number; name: string; state: string; county: string | null; latitude: number; longitude: number }[];

  console.log(`Auditing ${rows.length} employer geographies${dryRun ? " (dry run)" : ""}\n`);

  const suspect: {
    id: number; label: string; nearest: string; miles: number; sameStateMiles: number | null;
  }[] = [];
  for (const row of rows) {
    let best: { d: number; c: Centroid } | null = null;
    for (const p of points) {
      const d = milesBetween(Number(row.latitude), Number(row.longitude), p.lat, p.lon);
      if (!best || d < best.d) best = { d, c: p };
    }
    if (!best) continue;
    if (best.c.state.toUpperCase() === row.state.trim().toUpperCase()) continue;

    /*
     * A border city legitimately sits nearest a place across the line: Augusta
     * GA is 3 miles from South Carolina, and Washington DC is ringed by
     * Maryland. What separates those from a genuine mis-resolution is whether
     * anywhere in the stated state is nearby at all -- Augusta has Georgia
     * places within a few miles, while "Carson City, NV" was placed in Colorado,
     * hundreds of miles from any Nevada place.
     */
    let sameState: number | null = null;
    for (const p of points) {
      if (p.state.toUpperCase() !== row.state.trim().toUpperCase()) continue;
      const d = milesBetween(Number(row.latitude), Number(row.longitude), p.lat, p.lon);
      if (sameState === null || d < sameState) sameState = d;
    }
    if (sameState !== null && sameState <= BORDER_TOLERANCE_MI) continue;

    suspect.push({
      id: Number(row.id),
      label: `${row.name}, ${row.state}`,
      nearest: `${best.c.name}, ${best.c.state}`,
      miles: best.d,
      sameStateMiles: sameState,
    });
  }

  if (!suspect.length) {
    console.log("No cross-state geographies found. Nothing to repair.");
    return;
  }

  console.log(`${suspect.length} row(s) resolved into the wrong state:\n`);
  for (const s of suspect) {
    console.log(
      `  ${s.label.padEnd(36)} sits ${s.miles.toFixed(0)} mi from ${s.nearest}; ` +
        `nearest ${s.label.split(", ")[1]} place is ${s.sameStateMiles === null ? "none" : s.sameStateMiles.toFixed(0) + " mi"} away`
    );
  }

  if (dryRun) {
    console.log("\nDry run — nothing written.");
    return;
  }

  const ids = suspect.map((s) => s.id);
  const unlinked = (await sql.query(
    `DELETE FROM geo_relationships
     WHERE child_geo_id = ANY($1) AND relationship_type = 'metro_membership'
     RETURNING id`,
    [ids]
  )) as unknown[];

  await sql.query(
    `UPDATE locations_location
     SET latitude = NULL, longitude = NULL, county = NULL,
         boundary_geoid = NULL, boundary_source = NULL,
         parent_geo_id = NULL, updated_at = now()
     WHERE id = ANY($1)`,
    [ids]
  );

  console.log(
    `\nCleared the geography on ${ids.length} row(s) and removed ${unlinked.length} metro membership(s).`
  );
  console.log("The rows and their employer postings are kept; only the false geography is gone.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
