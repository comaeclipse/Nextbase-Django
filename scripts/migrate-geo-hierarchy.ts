/*
 * Makes geography a first-class model: a location is no longer assumed to be an
 * incorporated city. Adds a place-type discriminator, a canonical containment
 * pointer, a stable slug, and geography provenance to locations_location, then
 * creates the typed relationship graph and the raw-string alias table.
 *
 * Nothing moves. Every satellite table still keys on locations_location(id), so
 * all existing FKs, all /city/<id> URLs, and every importer keep working. The
 * geo_entities view is the conceptual identity layer over the same rows.
 *
 * Why both parent_geo_id AND geo_relationships: the column is the single
 * canonical containment (breadcrumb, unique key, fast path); the table is the
 * typed, multi-parent, time-bounded graph. Canoga Park is in Los Angeles city
 * AND Los Angeles County AND the LA-Long Beach-Anaheim CBSA, and each of those
 * is the correct fallback geography for a *different* field (see
 * lib/geo-inheritance.ts). One parent pointer cannot express that.
 *
 * Usage:
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/migrate-geo-hierarchy.ts [--dry-run]
 */
import { getSql } from "../lib/db";

const dryRun = process.argv.includes("--dry-run");
const sql = getSql();

async function run(label: string, query: string) {
  if (dryRun) {
    console.log(`  = ${label} (skipped)`);
    return;
  }
  await sql.query(query);
  console.log(`  + ${label}`);
}

/*
 * Slug expression, kept in one place because the importer computes the same
 * string in TS (scripts/lib/geo-slug.ts). A city is "<state>-<name>"; a child
 * geography is "<parent slug>-<name>", built in the backfill below.
 */
const SLUG_EXPR = `
  lower(state) || '-' ||
  regexp_replace(regexp_replace(lower(name), '[^a-z0-9]+', '-', 'g'), '(^-|-$)', '', 'g')
`;

/*
 * A slug collision means two rows would claim one identity. Auto-disambiguating
 * (appending -2) would silently pick a winner and bake an arbitrary key into
 * every future URL and alias, so refuse and make a human decide.
 */
async function assertNoSlugCollisions() {
  const rows = (await sql.query(
    `SELECT ${SLUG_EXPR} AS slug, count(*)::int AS n,
            string_agg(name || ', ' || state, ' | ' ORDER BY id) AS members
     FROM locations_location
     GROUP BY 1 HAVING count(*) > 1 ORDER BY 2 DESC`
  )) as { slug: string; n: number; members: string }[];

  if (rows.length === 0) {
    console.log("  = slug backfill is collision-free");
    return;
  }
  console.error(`\nRefusing to migrate: ${rows.length} slug collision(s).`);
  for (const r of rows) console.error(`  ${r.slug} <- ${r.n} rows: ${r.members}`);
  console.error("\nRename the conflicting rows, or give them distinct parents, then re-run.");
  process.exit(1);
}

async function main() {
  console.log(`Geo-hierarchy migration${dryRun ? " (dry run)" : ""}\n`);

  await assertNoSlugCollisions();

  // ── locations_location: place type, containment, identity, provenance ──
  await run(
    "add geo_type",
    `ALTER TABLE locations_location
       ADD COLUMN IF NOT EXISTS geo_type text NOT NULL DEFAULT 'city'`
  );
  await run(
    "constrain geo_type",
    `DO $$ BEGIN
       IF NOT EXISTS (SELECT 1 FROM pg_constraint
                      WHERE conname = 'locations_location_geo_type_check') THEN
         ALTER TABLE locations_location ADD CONSTRAINT locations_location_geo_type_check
           CHECK (geo_type IN ('city','neighborhood','cdp','county','metro'));
       END IF;
     END $$`
  );
  /*
   * RESTRICT, not CASCADE: deleting Los Angeles must not silently take every
   * neighborhood inside it. import-csv.ts --clear is guarded separately.
   */
  await run(
    "add parent_geo_id",
    `ALTER TABLE locations_location
       ADD COLUMN IF NOT EXISTS parent_geo_id bigint
       REFERENCES locations_location(id) ON DELETE RESTRICT`
  );
  await run(
    "add slug",
    `ALTER TABLE locations_location ADD COLUMN IF NOT EXISTS slug text`
  );
  /*
   * is_candidate is the ranking gate, and it is deliberately NOT geo_type.
   *
   * geo_type says what a place *is*; is_candidate says whether it is one of the
   * curated retirement locations that /explore, /quiz, /map and the API rank.
   * Those are independent axes, and conflating them breaks immediately: Los
   * Angeles is unambiguously a city, it has to exist as Canoga Park's parent so
   * the neighborhood has a municipality to inherit sales tax and RPP from, and
   * it must never appear as a retirement candidate. Same for the other ~410
   * places that carry defense-employer postings (Tewksbury MA, El Segundo CA,
   * Anaheim CA) but were never curated -- 520 of 708 employer locations
   * currently resolve to NULL for exactly this reason.
   *
   * DEFAULT true so all 165 existing rows stay candidates untouched.
   */
  await run(
    "add is_candidate",
    `ALTER TABLE locations_location
       ADD COLUMN IF NOT EXISTS is_candidate boolean NOT NULL DEFAULT true`
  );
  /*
   * Geography provenance. A neighborhood population has no Census Place behind
   * it -- it is an ACS tract aggregation or a newspaper boundary project -- and
   * which one it is changes how much weight the number carries. boundary_geoid
   * is NULL exactly when no Census geography exists for the place.
   */
  await run(
    "add geography provenance columns",
    `ALTER TABLE locations_location
       ADD COLUMN IF NOT EXISTS population_source text,
       ADD COLUMN IF NOT EXISTS population_vintage text,
       ADD COLUMN IF NOT EXISTS boundary_source text,
       ADD COLUMN IF NOT EXISTS boundary_geoid text`
  );

  await run("backfill slug", `UPDATE locations_location SET slug = ${SLUG_EXPR} WHERE slug IS NULL`);
  await run(
    "require slug",
    `ALTER TABLE locations_location ALTER COLUMN slug SET NOT NULL`
  );
  await run(
    "unique slug",
    `DO $$ BEGIN
       IF NOT EXISTS (SELECT 1 FROM pg_constraint
                      WHERE conname = 'locations_location_slug_key') THEN
         ALTER TABLE locations_location ADD CONSTRAINT locations_location_slug_key UNIQUE (slug);
       END IF;
     END $$`
  );
  /*
   * The natural key that makes "Downtown" safe. import-csv.ts has always
   * upserted on (name, state) with nothing enforcing it, so a second
   * "Downtown, CA" would have silently overwritten the first.
   * NULLS NOT DISTINCT (PG15+) makes two parentless cities of the same name
   * collide, which is what we want -- verified PG 17 on this project.
   */
  await run(
    "unique (name, state, parent_geo_id)",
    `DO $$ BEGIN
       IF NOT EXISTS (SELECT 1 FROM pg_constraint
                      WHERE conname = 'locations_location_name_state_parent_key') THEN
         ALTER TABLE locations_location ADD CONSTRAINT locations_location_name_state_parent_key
           UNIQUE NULLS NOT DISTINCT (name, state, parent_geo_id);
       END IF;
     END $$`
  );
  await run(
    "index locations by geo_type",
    `CREATE INDEX IF NOT EXISTS locations_location_geo_type_idx
       ON locations_location (geo_type)`
  );
  /*
   * fetchAllLocations reads every candidate on each explore/quiz/map render,
   * so the gate it filters on is the one that needs the index.
   */
  await run(
    "index locations by candidacy",
    `CREATE INDEX IF NOT EXISTS locations_location_is_candidate_idx
       ON locations_location (is_candidate) WHERE is_candidate`
  );
  await run(
    "index locations by parent",
    `CREATE INDEX IF NOT EXISTS locations_location_parent_geo_idx
       ON locations_location (parent_geo_id) WHERE parent_geo_id IS NOT NULL`
  );
  /*
   * cost_of_living is NOT NULL, which collides with resolve-at-read-time: a
   * neighborhood has no cost category of its own (BEA publishes RPP per MSA),
   * and forcing a value at insert would make it the one *stored* inherited
   * value in the whole design. Drop the constraint so the resolver owns it.
   * scripts/sync-col-index-from-rpp.ts still writes cities as before.
   */
  await run(
    "drop cost_of_living NOT NULL",
    `ALTER TABLE locations_location ALTER COLUMN cost_of_living DROP NOT NULL`
  );
  /*
   * Same reasoning for climate. A metro or county has no climate of its own to
   * speak of, and a neighborhood's comes from the containing city's weather
   * station rather than from a value stored on the row. Leaving the column NOT
   * NULL forces every such row to carry a placeholder, and a placeholder is
   * indistinguishable from a researched value once it is written.
   */
  await run(
    "drop climate NOT NULL",
    `ALTER TABLE locations_location ALTER COLUMN climate DROP NOT NULL`
  );

  // ── geo_relationships: the typed, time-bounded containment graph ──
  await run(
    "create geo_relationships",
    `CREATE TABLE IF NOT EXISTS geo_relationships (
      id                bigserial PRIMARY KEY,
      parent_geo_id     bigint NOT NULL REFERENCES locations_location(id) ON DELETE CASCADE,
      child_geo_id      bigint NOT NULL REFERENCES locations_location(id) ON DELETE CASCADE,
      relationship_type text NOT NULL CHECK (relationship_type IN (
        'municipal_containment','county_containment','metro_membership',
        'precinct_containment','historical_annexation')),
      source            text NOT NULL,
      source_url        text,
      valid_from        date NOT NULL DEFAULT '1900-01-01',
      valid_to          date,
      created_at        timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT geo_relationships_no_self CHECK (parent_geo_id <> child_geo_id),
      CONSTRAINT geo_relationships_unique
        UNIQUE (parent_geo_id, child_geo_id, relationship_type, valid_from)
    )`
  );
  await run(
    "index active relationships by child",
    `CREATE INDEX IF NOT EXISTS geo_relationships_child_active_idx
       ON geo_relationships (child_geo_id, relationship_type) WHERE valid_to IS NULL`
  );
  await run(
    "index active relationships by parent",
    `CREATE INDEX IF NOT EXISTS geo_relationships_parent_active_idx
       ON geo_relationships (parent_geo_id, relationship_type) WHERE valid_to IS NULL`
  );

  // ── geo_aliases: raw location strings employers actually publish ──
  /*
   * normalized_key is byte-identical to locKey() in scripts/lib/defense-db.ts,
   * so the employer resolver is a second Map.get with no second normalization
   * rule to keep in sync.
   */
  await run(
    "create geo_aliases",
    `CREATE TABLE IF NOT EXISTS geo_aliases (
      id             bigserial PRIMARY KEY,
      geo_id         bigint NOT NULL REFERENCES locations_location(id) ON DELETE CASCADE,
      alias_kind     text NOT NULL CHECK (alias_kind IN (
        'employer_location','usps_place','census_place','colloquial','former_name')),
      raw_city       text NOT NULL,
      raw_state      text NOT NULL,
      normalized_key text NOT NULL,
      source         text NOT NULL,
      source_url     text,
      confidence     text NOT NULL DEFAULT 'exact'
        CHECK (confidence IN ('exact','curated','fuzzy')),
      notes          text,
      created_at     timestamptz NOT NULL DEFAULT now(),
      updated_at     timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT geo_aliases_key_unique UNIQUE (normalized_key, alias_kind)
    )`
  );
  await run(
    "index aliases by geo",
    `CREATE INDEX IF NOT EXISTS geo_aliases_geo_idx ON geo_aliases (geo_id)`
  );

  // ── views ──
  /*
   * Dropped and recreated rather than CREATE OR REPLACE: replace can only
   * append columns to a view, so any change to the shape of the projection
   * (adding is_candidate mid-list, say) fails on an existing view. Views carry
   * no data, so dropping one costs nothing.
   */
  await run("drop geo_entities view", `DROP VIEW IF EXISTS geo_entities`);
  await run(
    "create geo_entities view",
    `CREATE VIEW geo_entities AS
     SELECT id AS geo_id, slug, name, state, county, geo_type, is_candidate, parent_geo_id,
            latitude, longitude, population, population_source, population_vintage,
            boundary_source, boundary_geoid, created_at, updated_at
     FROM locations_location`
  );
  /*
   * Transitive closure of the active graph. depth < 6 is the cycle guard --
   * plain SQL cannot express acyclicity, so the cap bounds the damage and
   * scripts/verify-geo-hierarchy.ts detects the cycle itself.
   */
  await run("drop geo_closure view", `DROP VIEW IF EXISTS geo_closure`);
  await run(
    "create geo_closure view",
    `CREATE VIEW geo_closure AS
     WITH RECURSIVE c AS (
       SELECT r.parent_geo_id AS ancestor_id, r.child_geo_id AS descendant_id,
              1 AS depth, r.relationship_type
       FROM geo_relationships r WHERE r.valid_to IS NULL
       UNION ALL
       SELECT c.ancestor_id, r.child_geo_id, c.depth + 1, r.relationship_type
       FROM c JOIN geo_relationships r
         ON r.parent_geo_id = c.descendant_id AND r.valid_to IS NULL
       WHERE c.depth < 6
     )
     SELECT ancestor_id, descendant_id, depth, relationship_type FROM c`
  );

  if (!dryRun) {
    const [counts] = (await sql.query(
      `SELECT count(*)::int AS total,
              count(*) FILTER (WHERE geo_type = 'city')::int AS cities,
              count(*) FILTER (WHERE is_candidate)::int AS candidates,
              count(*) FILTER (WHERE slug IS NULL)::int AS missing_slug
       FROM locations_location`
    )) as {
      total: number;
      cities: number;
      candidates: number;
      missing_slug: number;
    }[];
    console.log(
      `\n${counts.total} locations, ${counts.cities} typed as city, ` +
        `${counts.candidates} ranked candidates, ${counts.missing_slug} missing a slug.`
    );
  }

  console.log(`\n${dryRun ? "Dry run" : "Migration"} complete.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
