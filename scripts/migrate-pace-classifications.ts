/*
 * Schema migration for the retirement-pace classifier.
 *
 *   - creates append-only `location_pace_classifications` history
 *   - creates `location_pace_current` view (latest approved override, else
 *     latest auto_approved/approved candidate)
 *
 * Idempotent: safe to re-run. Does not mutate `locations_location`.
 *
 * Usage:
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/migrate-pace-classifications.ts [--dry-run]
 */
import { getSql } from "../lib/db";

const dryRun = process.argv.includes("--dry-run");
const sql = getSql();

const log = (msg: string) => console.log(`  ${dryRun ? "=" : "+"} ${msg}`);

async function run(label: string, text: string, params: unknown[] = []) {
  if (dryRun) {
    log(`${label} (skipped)`);
    return;
  }
  await sql.query(text, params);
  log(label);
}

async function tableExists(table: string): Promise<boolean> {
  const rows = (await sql.query(`SELECT to_regclass($1) AS t`, [
    `public.${table}`,
  ])) as { t: string | null }[];
  return rows[0]?.t != null;
}

async function viewExists(view: string): Promise<boolean> {
  const rows = (await sql.query(
    `SELECT 1 FROM information_schema.views
     WHERE table_schema = 'public' AND table_name = $1`,
    [view]
  )) as unknown[];
  return rows.length > 0;
}

async function main() {
  console.log(`Pace classification migration${dryRun ? " (dry run)" : ""}\n`);

  console.log("1. location_pace_classifications");
  if (await tableExists("location_pace_classifications")) {
    log("table already exists");
  } else {
    await run(
      "create table",
      `CREATE TABLE location_pace_classifications (
        id bigserial PRIMARY KEY,
        location_id bigint NOT NULL REFERENCES locations_location(id) ON DELETE CASCADE,
        scope text NOT NULL CHECK (scope IN ('cbsa', 'place')),
        cbsa_geoid text,
        place_geoid text,
        tract_geoids jsonb NOT NULL DEFAULT '[]'::jsonb,
        census_vintage text,
        input_values jsonb NOT NULL DEFAULT '{}'::jsonb,
        source_versions jsonb NOT NULL DEFAULT '{}'::jsonb,
        source_checksums jsonb NOT NULL DEFAULT '{}'::jsonb,
        score double precision,
        candidate_category text CHECK (
          candidate_category IS NULL OR candidate_category IN (
            'urban', 'suburban', 'small_town', 'rural'
          )
        ),
        confidence double precision,
        review_state text NOT NULL CHECK (
          review_state IN ('auto_approved', 'needs_review', 'approved', 'rejected')
        ),
        override_category text CHECK (
          override_category IS NULL OR override_category IN (
            'urban', 'suburban', 'small_town', 'rural'
          )
        ),
        override_reason text,
        reviewed_at timestamptz,
        algorithm_version text NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now()
      )`
    );
    await run(
      "index location_id + created_at",
      `CREATE INDEX location_pace_classifications_location_created_idx
       ON location_pace_classifications (location_id, created_at DESC)`
    );
    await run(
      "index review_state",
      `CREATE INDEX location_pace_classifications_review_state_idx
       ON location_pace_classifications (review_state)`
    );
  }

  console.log("\n2. location_pace_current");
  // Recreate so definition stays in sync with this script.
  await run("drop view if exists", `DROP VIEW IF EXISTS location_pace_current`);
  await run(
    "create view",
    `CREATE VIEW location_pace_current AS
     WITH ranked AS (
       SELECT
         c.*,
         CASE
           WHEN c.override_category IS NOT NULL
                AND c.review_state IN ('approved', 'auto_approved')
             THEN 0
           WHEN c.review_state IN ('auto_approved', 'approved')
                AND c.candidate_category IS NOT NULL
             THEN 1
           ELSE 2
         END AS precedence,
         ROW_NUMBER() OVER (
           PARTITION BY c.location_id
           ORDER BY
             CASE
               WHEN c.override_category IS NOT NULL
                    AND c.review_state IN ('approved', 'auto_approved')
                 THEN 0
               WHEN c.review_state IN ('auto_approved', 'approved')
                    AND c.candidate_category IS NOT NULL
                 THEN 1
               ELSE 2
             END,
             c.created_at DESC,
             c.id DESC
         ) AS rn
       FROM location_pace_classifications c
     )
     SELECT
       location_id,
       id AS classification_id,
       COALESCE(override_category, candidate_category) AS category,
       score,
       confidence,
       review_state,
       scope,
       cbsa_geoid,
       place_geoid,
       algorithm_version,
       created_at,
       reviewed_at,
       override_category,
       override_reason
     FROM ranked
     WHERE rn = 1 AND precedence < 2`
  );

  if (!dryRun && (await viewExists("location_pace_current"))) {
    log("view ready");
  }

  console.log(
    dryRun
      ? "\nDry run complete (no schema changes)."
      : "\nMigration complete."
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
