/*
 * Creates a metro geography per CBSA and records metro_membership for the
 * curated cities and employer anchors inside it.
 *
 * This is what lets a city page say "elsewhere in the Boston-Cambridge-Newton
 * metro: Tewksbury 185, Andover 180" without pretending those jobs are in the
 * city itself.
 *
 * It deliberately does NOT change defense_hub. That column means a facility in
 * this city, or in a geography contained by it, and recompute-defense-hub.ts
 * walks municipal_containment only. Extending it to metros would mark Chicago a
 * defense hub on the strength of three postings in Des Plaines, and would give
 * four Boston-area cities an identical figure that describes the metro rather
 * than any of them.
 *
 * Curated cities get their CBSA from the BEA join already in the database
 * (location_cost_rpp.bea_geo_code). Employer anchors get theirs from
 * data/employer_geographies_metro.csv, produced by
 * scripts/resolve-employer-geographies.ts.
 *
 * Only CBSAs that contain at least one curated city AND at least one employer
 * anchor are created -- a metro with nothing to relate is just a row.
 *
 * Usage:
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/sync-metro-geographies.ts <metro-csv> [--dry-run]
 */
import { readFileSync } from "node:fs";
import { parse } from "csv-parse/sync";
import { getSql } from "../lib/db";
import { isUnresolvedMetroRow } from "../lib/geography-import-status";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const csvPath = args.find((a) => !a.startsWith("--")) ?? "data/employer_geographies_metro.csv";

interface MetroRow { [key: string]: string; Slug: string; City: string; State: string; CbsaGeoid: string }

/** "Boston-Cambridge-Newton, MA-NH (Metropolitan Statistical Area)" -> name + lead state. */
function splitCbsaName(raw: string): { name: string; state: string } {
  const cleaned = raw.replace(/\s*\((Metropolitan|Micropolitan)[^)]*\)\s*$/i, "").trim();
  const at = cleaned.lastIndexOf(",");
  if (at < 0) return { name: cleaned, state: "US" };
  const name = cleaned.slice(0, at).trim();
  const states = cleaned.slice(at + 1).trim();
  // A multi-state CBSA is stored under its lead state; the full CBSA name keeps
  // the rest, so nothing is lost and the stateinfo join stays meaningful.
  return { name: `${name}, ${states}`, state: states.split("-")[0].trim().toUpperCase() };
}

async function main() {
  const sql = getSql();
  const anchors: MetroRow[] = parse(readFileSync(csvPath, "utf-8"), {
    columns: true,
    skip_empty_lines: true,
  });
  console.log(`Metro sync${dryRun ? " (dry run)" : ""} from ${csvPath}\n`);

  // Curated cities and their BEA metro.
  const curated = (await sql.query(
    `SELECT l.id, l.name, l.state, r.bea_geo_code AS cbsa, r.bea_geo_name
     FROM locations_location l
     JOIN location_cost_rpp r ON r.location_id = l.id
     WHERE l.is_candidate AND r.bea_geo_type = 'msa' AND r.bea_geo_code IS NOT NULL`
  )) as { id: number; name: string; state: string; cbsa: string; bea_geo_name: string }[];

  // Employer anchors, resolved to a location row by (name, state).
  const anchorIds = new Map<string, { id: number; name: string; state: string }[]>();
  for (const a of anchors) {
    if (isUnresolvedMetroRow(a)) { console.log(`Skipped unresolved metro mapping: ${a.Slug}`); continue; }
    const found = (await sql.query(
      "SELECT id, name, state FROM locations_location WHERE slug = $1 AND lower(btrim(name)) = lower(btrim($2)) AND upper(btrim(state)) = $3 AND NOT is_candidate AND latitude IS NOT NULL AND longitude IS NOT NULL",
      [a.Slug, a.City, a.State]
    )) as { id: number; name: string; state: string }[];
    if (!found.length) continue;
    const key = String(a.CbsaGeoid);
    if (!anchorIds.has(key)) anchorIds.set(key, []);
    anchorIds.get(key)!.push(found[0]);
  }

  const curatedByCbsa = new Map<string, typeof curated>();
  for (const c of curated) {
    const key = String(c.cbsa);
    if (!curatedByCbsa.has(key)) curatedByCbsa.set(key, []);
    curatedByCbsa.get(key)!.push(c);
  }

  const shared = [...curatedByCbsa.keys()].filter((k) => anchorIds.has(k));
  console.log(
    `${curatedByCbsa.size} CBSA(s) with curated cities, ${anchorIds.size} with employer anchors, ` +
      `${shared.length} with both\n`
  );

  let metros = 0, links = 0;
  for (const cbsa of shared.sort()) {
    const cities = curatedByCbsa.get(cbsa)!;
    const anchorsHere = anchorIds.get(cbsa)!;
    const { name, state } = splitCbsaName(cities[0].bea_geo_name ?? `CBSA ${cbsa}`);
    // Slug on the CBSA code: stable, and immune to the metro being renamed.
    const slug = `cbsa-${cbsa}`;

    if (dryRun) {
      console.log(
        `  = ${name} [${slug}] — ${cities.length} curated, ${anchorsHere.length} anchor(s): ` +
          anchorsHere.slice(0, 3).map((a) => a.name).join(", ") +
          (anchorsHere.length > 3 ? ", …" : "")
      );
      metros++; links += cities.length + anchorsHere.length;
      continue;
    }

    const upserted = (await sql.query(
      `INSERT INTO locations_location
         (name, state, geo_type, is_candidate, slug, boundary_geoid, boundary_source,
          climate, cost_of_living, tags, emoji, gradient, featured, created_at, updated_at)
       VALUES ($1, $2, 'metro', false, $3, $4, 'OMB Core Based Statistical Area delineation',
               NULL, NULL, '[]'::jsonb, '', '', false, now(), now())
       ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, updated_at = now()
       RETURNING id`,
      [name, state, slug, cbsa]
    )) as { id: number }[];
    const metroId = Number(upserted[0].id);
    metros++;
    console.log(`  + ${name} (#${metroId}) — ${cities.length} curated, ${anchorsHere.length} anchor(s)`);

    for (const member of [...cities, ...anchorsHere]) {
      const res = (await sql.query(
        `INSERT INTO geo_relationships (parent_geo_id, child_geo_id, relationship_type, source)
         VALUES ($1, $2, 'metro_membership', $3)
         ON CONFLICT (parent_geo_id, child_geo_id, relationship_type, valid_from) DO NOTHING
         RETURNING id`,
        [metroId, member.id, `OMB CBSA ${cbsa} delineation`]
      )) as { id: number }[];
      if (res.length) links++;
    }
  }

  console.log(
    dryRun
      ? `\nDry run — nothing written. ${metros} metro(s), ${links} membership(s) would be recorded.`
      : `\nMetro sync complete. ${metros} metro(s), ${links} new membership(s).`
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
