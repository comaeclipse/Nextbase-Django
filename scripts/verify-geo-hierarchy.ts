/*
 * Integrity checks for the geo hierarchy. Exits non-zero on any violation so it
 * can sit in the pre-PR checklist alongside tsc / test / build.
 *
 * locations_location.parent_geo_id deliberately duplicates the canonical
 * containment row in geo_relationships -- the column is the fast path, the
 * table is the typed graph. Duplication means drift, so it gets checked rather
 * than trusted. A trigger would be the alternative, but it would fire during
 * import ordering (row -> relationship -> alias) and reject valid intermediate
 * states.
 *
 * Usage:
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/verify-geo-hierarchy.ts
 */
import { getSql } from "../lib/db";

const sql = getSql();

type Check = { label: string; rows: Record<string, unknown>[]; explain: string };

async function main() {
  console.log("Verifying geo hierarchy\n");
  const failures: Check[] = [];

  async function check(label: string, query: string, explain: string) {
    const rows = (await sql.query(query)) as Record<string, unknown>[];
    if (rows.length === 0) {
      console.log(`  ok   ${label}`);
    } else {
      console.log(`  FAIL ${label} (${rows.length})`);
      failures.push({ label, rows, explain });
    }
  }

  /*
   * A cycle would make the geo_closure recursion run to its depth cap and
   * produce nonsense ancestry, so find it explicitly rather than relying on the
   * cap to hide it. Cap the walk one level past geo_closure's own limit.
   */
  await check(
    "no containment cycles",
    `WITH RECURSIVE walk AS (
       SELECT child_geo_id AS start_id, parent_geo_id AS at_id, 1 AS depth
       FROM geo_relationships WHERE valid_to IS NULL
       UNION ALL
       SELECT w.start_id, r.parent_geo_id, w.depth + 1
       FROM walk w JOIN geo_relationships r
         ON r.child_geo_id = w.at_id AND r.valid_to IS NULL
       WHERE w.depth < 7
     )
     SELECT DISTINCT start_id FROM walk WHERE at_id = start_id`,
    "A geography contains itself transitively. Fix the offending geo_relationships row."
  );

  /*
   * The invariant: parent_geo_id must equal the active municipal_containment
   * parent, or the county_containment parent for an unincorporated CDP.
   */
  await check(
    "parent_geo_id agrees with geo_relationships",
    `SELECT l.id, l.name, l.state, l.geo_type, l.parent_geo_id
     FROM locations_location l
     WHERE l.parent_geo_id IS NOT NULL
       AND NOT EXISTS (
         SELECT 1 FROM geo_relationships r
         WHERE r.child_geo_id = l.id
           AND r.parent_geo_id = l.parent_geo_id
           AND r.valid_to IS NULL
           AND r.relationship_type IN ('municipal_containment','county_containment')
       )`,
    "parent_geo_id points somewhere geo_relationships does not confirm. Add the relationship row or correct the column."
  );

  await check(
    "every non-city has a parent",
    `SELECT id, name, state, geo_type FROM locations_location
     WHERE geo_type <> 'city' AND parent_geo_id IS NULL`,
    "A neighborhood/CDP with no parent has nothing to inherit from; its page would render mostly empty."
  );

  await check(
    "no city has a parent",
    `SELECT id, name, state, parent_geo_id FROM locations_location
     WHERE geo_type = 'city' AND parent_geo_id IS NOT NULL`,
    "A geo_type='city' row is contained by something. Retype it, or clear parent_geo_id."
  );

  /*
   * resolveLocationId prefers a direct (name, state) hit over an alias, so an
   * alias whose key matches a real location name is dead code that looks live.
   */
  await check(
    "no alias shadowed by a real location name",
    `SELECT a.id, a.raw_city, a.raw_state, a.geo_id, l.id AS shadowing_id, l.name
     FROM geo_aliases a
     JOIN locations_location l
       ON lower(trim(l.name)) || '|' || upper(trim(l.state)) = a.normalized_key
     WHERE l.id <> a.geo_id`,
    "This alias never fires: a location already answers to that exact (name, state). Delete the alias."
  );

  await check(
    "alias normalized_key matches its raw fields",
    `SELECT id, raw_city, raw_state, normalized_key FROM geo_aliases
     WHERE normalized_key <> lower(trim(raw_city)) || '|' || upper(trim(raw_state))`,
    "normalized_key was hand-edited or written by a stale importer; it must equal locKey(raw_city, raw_state)."
  );

  /*
   * `featured` sorts to the top of every ranked list. A structural parent such
   * as Los Angeles is not a retirement candidate at all, so a featured
   * non-candidate is a row that would lead the results it is excluded from.
   */
  await check(
    "no non-candidate is featured",
    `SELECT id, name, state, geo_type FROM locations_location
     WHERE featured AND NOT is_candidate`,
    "Clear `featured`, or make the row a candidate. A non-candidate never reaches a ranked list."
  );

  /*
   * The gate is is_candidate, not geo_type -- but a *candidate* still has to be
   * a complete curated profile, and today every one of them is a city. Flag the
   * combination so promoting a neighborhood to candidate is a deliberate act
   * that trips this check and gets reviewed, not a silent import side effect.
   */
  await check(
    "no non-city is a ranked candidate yet",
    `SELECT id, name, state, geo_type FROM locations_location
     WHERE is_candidate AND geo_type <> 'city'`,
    "A neighborhood/CDP is being ranked against fully researched cities. Confirm its cost, safety and housing data is neighborhood-scoped first, then relax this check."
  );

  await check(
    "slug is unique and well-formed",
    `SELECT id, name, state, slug FROM locations_location
     WHERE slug IS NULL OR slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$'`,
    "A malformed slug breaks importer upserts, which key on it."
  );

  if (failures.length === 0) {
    console.log("\nAll checks passed.");
    return;
  }

  console.error(`\n${failures.length} check(s) failed.\n`);
  for (const f of failures) {
    console.error(`${f.label}: ${f.explain}`);
    for (const row of f.rows.slice(0, 10)) console.error(`  ${JSON.stringify(row)}`);
    if (f.rows.length > 10) console.error(`  ... ${f.rows.length - 10} more`);
    console.error("");
  }
  process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
