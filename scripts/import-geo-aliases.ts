/*
 * Imports raw location-string aliases and links the employer postings that
 * only ever appear under the alias spelling.
 *
 * Why aliases exist at all: locations_location carries an AFTER INSERT trigger,
 * trg_link_city_to_employer_locations, that links postings on an exact
 * lower(city)/upper(state) match. That covers the common case, but the employer
 * feed spells some places two ways -- "St Petersburg" and "St. Petersburg" are
 * one city, and only one of them can be the location row. The other spelling
 * becomes an alias, and this script links its postings.
 *
 * An alias whose key matches a real location name is refused: resolveLocationId
 * prefers a direct hit, so such a row would never fire and would look live while
 * being dead. scripts/verify-geo-hierarchy.ts checks the same invariant.
 *
 * Usage:
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/import-geo-aliases.ts <csv> [--dry-run]
 */
import { readFileSync } from "node:fs";
import { parse } from "csv-parse/sync";
import { getSql } from "../lib/db";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const csvPath = args.find((a) => !a.startsWith("--"));
if (!csvPath) {
  console.error("Usage: import-geo-aliases <csv> [--dry-run]");
  process.exit(1);
}

interface Row {
  RawCity: string;
  RawState: string;
  CanonicalCity: string;
  AliasKind?: string;
  Source?: string;
}

/** Byte-identical to locKey() in scripts/lib/defense-db.ts and the SQL trigger. */
const normalizedKey = (city: string, state: string) =>
  `${city.trim().toLowerCase()}|${state.trim().toUpperCase()}`;

async function main() {
  const sql = getSql();
  const rows: Row[] = parse(readFileSync(csvPath!, "utf-8"), {
    columns: true,
    skip_empty_lines: true,
  });
  console.log(`Importing ${rows.length} alias(es) from ${csvPath}${dryRun ? " (dry run)" : ""}\n`);

  let created = 0, skipped = 0, errors = 0;

  for (const [i, row] of rows.entries()) {
    const rawCity = (row.RawCity ?? "").trim();
    const rawState = (row.RawState ?? "").trim().toUpperCase();
    const canonicalCity = (row.CanonicalCity ?? "").trim();
    const kind = (row.AliasKind ?? "employer_location").trim();
    const source = (row.Source ?? "CSV import").trim();
    const key = normalizedKey(rawCity, rawState);

    try {
      const target = (await sql.query(
        "SELECT id, name FROM locations_location WHERE lower(name) = lower($1) AND upper(state) = $2",
        [canonicalCity, rawState]
      )) as { id: number; name: string }[];
      if (!target.length) {
        throw new Error(`canonical location "${canonicalCity}, ${rawState}" not found — import it first`);
      }

      // A direct (name, state) hit always beats an alias, so an alias that
      // collides with a real location name is dead on arrival.
      const shadow = (await sql.query(
        "SELECT id, name FROM locations_location WHERE lower(btrim(name)) = lower(btrim($1)) AND upper(btrim(state)) = $2",
        [rawCity, rawState]
      )) as { id: number; name: string }[];
      if (shadow.length && Number(shadow[0].id) !== Number(target[0].id)) {
        throw new Error(
          `"${rawCity}, ${rawState}" already exists as a location (#${shadow[0].id}); an alias for it would never fire`
        );
      }

      if (dryRun) {
        console.log(`  = Would alias "${rawCity}, ${rawState}" -> ${target[0].name} (#${target[0].id})`);
        created++;
        continue;
      }

      const res = (await sql.query(
        `INSERT INTO geo_aliases (geo_id, alias_kind, raw_city, raw_state, normalized_key, source, confidence)
         VALUES ($1, $2, $3, $4, $5, $6, 'curated')
         ON CONFLICT (normalized_key, alias_kind) DO NOTHING
         RETURNING id`,
        [target[0].id, kind, rawCity, rawState, key, source]
      )) as { id: number }[];

      if (res.length) {
        created++;
        console.log(`  + Aliased "${rawCity}, ${rawState}" -> ${target[0].name} (#${target[0].id})`);
      } else {
        skipped++;
        console.log(`  = Already aliased: "${rawCity}, ${rawState}"`);
      }
    } catch (e) {
      errors++;
      console.error(`  X Error on row ${i + 2}: ${(e as Error).message}`);
    }
  }

  /*
   * The insert trigger only fires on an exact name match, so postings that use
   * an alias spelling stay unlinked until this runs. Mirrors the trigger's own
   * normalization exactly.
   */
  if (!dryRun) {
    const linked = (await sql.query(
      `UPDATE defense_employer_locations d
       SET location_id = a.geo_id, updated_at = now()
       FROM geo_aliases a
       WHERE d.location_id IS NULL
         AND lower(btrim(d.city)) || '|' || upper(btrim(d.state)) = a.normalized_key
       RETURNING d.id`
    )) as { id: number }[];
    console.log(`\nLinked ${linked.length} employer posting row(s) via alias.`);
  }

  console.log(
    dryRun
      ? `\nDry run complete. ${created} alias(es) would be created, ${errors} error(s).`
      : `\nImport complete! Created: ${created}, Already present: ${skipped}, Errors: ${errors}`
  );
  if (errors) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
