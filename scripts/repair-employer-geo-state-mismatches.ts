/*
 * Removes the false geography from employer-anchor rows that were resolved to
 * the wrong place, without removing the rows themselves.
 *
 * Two independent checks, because the two failure modes are different:
 *   1. cross-state -- geometric. The coordinates are nowhere near any place in
 *      the state the feed named.
 *   2. same-state substitution -- by name. The coordinates are in the right
 *      state but belong to a DIFFERENT place: "Bedford, MA" was resolved to
 *      Medford, "Harrison Township, MI" to Redding 146 miles away. Geometry
 *      cannot see this, so the stored coordinates are reverse-geocoded and the
 *      returned name is checked against the row name.
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

const COORDS = "https://geocoding.geo.census.gov/geocoder/geographies/coordinates";
const BENCHMARK = "Public_AR_Current";
const VINTAGE = "Current_Current";

/* Same rule as scripts/resolve-employer-geographies.ts; see the note there. */
const NAME_NOISE = new Set([
  "city", "town", "township", "village", "borough", "county", "subdivision",
  "the", "of", "and", "base", "station", "afb", "sfb", "fort", "ft", "saint",
  "st", "air", "force", "joint", "naval", "marine", "corps", "army", "camp",
]);
const nameTokens = (v: string) =>
  v.toLowerCase().replace(/[^a-z0-9]+/g, " ").split(/\s+/)
    .filter((t) => t.length > 2 && !NAME_NOISE.has(t));
function nameAgrees(requested: string, returned: string | null): boolean {
  if (!returned) return false;
  const want = nameTokens(requested);
  if (!want.length) return true;
  const got = new Set(nameTokens(returned));
  return want.every((t) => got.has(t));
}

/** Reverse-geocode: what does the Census say is actually at these coordinates? */
async function placeAt(lat: number, lon: number): Promise<string | null> {
  const q = new URLSearchParams({
    benchmark: BENCHMARK, vintage: VINTAGE, format: "json",
    x: String(lon), y: String(lat),
  });
  for (let i = 0; i < 3; i++) {
    try {
      const res = await fetch(`${COORDS}?${q}`);
      if (res.ok) {
        const body = (await res.json()) as {
          result?: { geographies?: Record<string, { NAME?: string; BASENAME?: string }[]> };
        };
        const g = body.result?.geographies;
        if (!g) return null;
        const layer =
          g["Incorporated Places"]?.[0] ??
          g["Census Designated Places"]?.[0] ??
          g["County Subdivisions"]?.[0];
        return layer ? (layer.BASENAME ?? layer.NAME ?? null) : null;
      }
      if (res.status < 500) return null;
    } catch { /* retry */ }
    await new Promise((r) => setTimeout(r, 400 * (i + 1)));
  }
  return null;
}

const dryRun = process.argv.includes("--dry-run");

/*
 * How far a row's coordinates may sit from the nearest place in its own state
 * before the resolution is treated as a mis-match rather than a border city.
 * Generous on purpose: a false positive here would erase a correct geography.
 */
const BORDER_TOLERANCE_MI = 25;

/*
 * How far a row's coordinates may sit from a same-state place of the same name
 * before it is treated as a substitution rather than a place-within-a-place.
 * An installation inside a town is a few miles from it; Bedford/Medford is ten.
 */
const SUBSTITUTION_TOLERANCE_MI = 8;

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

  console.log(`  cross-state: ${suspect.length}`);

  /*
   * Same-state name mismatches are REPORTED, never auto-cleared.
   *
   * A mismatch is weak evidence on its own: an installation or a neighbourhood
   * legitimately sits inside a differently-named Census place -- Langley AFB is
   * in Hampton, Fort Benning in Cusseta-Chattahoochee County, Jamaica in New
   * York City. An earlier version of this check flagged 27 rows, of which most
   * were correct, and clearing them would have destroyed real geography.
   * Adding a distance test cut it to six, and two of those (Eglin AFB,
   * Fort Campbell) were still correct -- a reservation genuinely spans miles.
   *
   * So the automatic action stops at the unambiguous cross-state case, and a
   * human reads the rest.
   */
  const review: string[] = [];

  /*
   * Second pass: same-state substitutions. Only rows the first pass cleared,
   * and only those still carrying coordinates.
   */
  const flagged = new Set(suspect.map((s) => s.id));
  const remaining = rows.filter((r) => !flagged.has(Number(r.id)));
  console.log(`  reverse-geocoding ${remaining.length} row(s) to check the name...`);

  const queue = [...remaining];
  let checked = 0;
  await Promise.all(
    Array.from({ length: 4 }, async () => {
      for (;;) {
        const row = queue.shift();
        if (!row) return;
        const actual = await placeAt(Number(row.latitude), Number(row.longitude));
        checked++;
        if (checked % 50 === 0) console.log(`    ${checked}/${remaining.length}`);
        if (!actual || nameAgrees(row.name, actual)) continue;

        /*
         * A name mismatch alone is not evidence. An installation or a
         * neighbourhood legitimately sits inside a differently-named Census
         * place: Langley AFB is in Hampton, Fort Benning in
         * Cusseta-Chattahoochee County, Jamaica in New York City. Clearing
         * those would delete correct geography.
         *
         * What distinguishes a substitution is that the place we asked for
         * exists elsewhere: there IS a "Bedford" in Massachusetts, ten miles
         * from where this row was placed, and a "Harrison Township" in
         * Michigan 146 miles away. So require a same-state namesake AND real
         * distance from it.
         */
        let away: number | null = null;
        for (const pt of points) {
          if (pt.state.toUpperCase() !== row.state.trim().toUpperCase()) continue;
          if (!nameAgrees(row.name, pt.name)) continue;
          const d = milesBetween(Number(row.latitude), Number(row.longitude), pt.lat, pt.lon);
          if (away === null || d < away) away = d;
        }
        if (away === null || away <= SUBSTITUTION_TOLERANCE_MI) continue;

        review.push(
          `- ${row.name}, ${row.state} (#${row.id}) — coordinates are in ` +
            `"${actual}"; the nearest ${row.state} place matching the name is ` +
            `${away.toFixed(0)} mi away`
        );
      }
    })
  );

  if (!suspect.length) {
    console.log("\nNo cross-state geographies to clear.");
    reportReview(review);
    return;
  }

  console.log(`${suspect.length} row(s) resolved into the wrong state:\n`);
  for (const s of suspect) {
    if (s.sameStateMiles === null && s.miles === 0) {
      console.log(`  ${s.label.padEnd(36)} ${s.nearest}`);
    } else {
      console.log(
        `  ${s.label.padEnd(36)} sits ${s.miles.toFixed(0)} mi from ${s.nearest}; ` +
          `nearest ${s.label.split(", ")[1]} place is ${s.sameStateMiles === null ? "none" : s.sameStateMiles.toFixed(0) + " mi"} away`
      );
    }
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

/** Same-state mismatches need a person, so print them rather than acting. */
function reportReview(review: string[]) {
  if (!review.length) {
    console.log("\nNo same-state name mismatches to review.");
    return;
  }
  console.log(`\n${review.length} row(s) FOR REVIEW — not changed automatically:`);
  console.log("(a name mismatch can be legitimate: an installation inside a town reads this way)");
  for (const line of review) console.log(`  ${line.slice(2)}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
