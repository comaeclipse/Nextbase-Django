/*
 * Creates the defense_job_listings table used by the standalone /defense-jobs
 * page. Populated by scripts/import-defense-job-listings.ts from a scraped ATS
 * CSV (master_defense_jobs.csv). Unlike defense_employer_locations (aggregate
 * per-city posting *counts*), this holds one row per individual job listing with
 * title / pay / apply URL. Independent of locations_location — not a Fit-score
 * factor.
 *
 * Usage:
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/migrate-defense-job-listings.ts [--dry-run]
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

async function main() {
  console.log(`Defense job listings migration${dryRun ? " (dry run)" : ""}\n`);

  await run(
    "create defense_job_listings",
    `CREATE TABLE IF NOT EXISTS defense_job_listings (
      id bigserial PRIMARY KEY,
      company text NOT NULL,
      employer_slug text,
      ats text,
      title text NOT NULL,
      field_raw text,
      sector text NOT NULL DEFAULT 'Other',
      location_raw text,
      city text,
      state text,
      country text NOT NULL DEFAULT 'US',
      region text,
      is_remote boolean NOT NULL DEFAULT false,
      latitude numeric,
      longitude numeric,
      employment_type text,
      pay_min numeric,
      pay_max numeric,
      pay_interval text,
      education text,
      url text NOT NULL,
      source_file text,
      snapshot_date date,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      last_seen_at timestamptz NOT NULL DEFAULT now(),
      closed_at timestamptz,
      CONSTRAINT defense_job_listings_url_key UNIQUE (url)
    )`
  );

  // Lifecycle columns (issue #313). `last_seen_at` is bumped by every importer
  // upsert, so a row whose board no longer lists it stops advancing; the sync
  // script (Phase 3) then sets `closed_at` instead of deleting, and a URL that
  // reappears is reopened by the importer (closed_at = NULL). Readers filter
  // `closed_at IS NULL`. Added nullable first so pre-existing rows can be
  // backfilled from `updated_at` (their last real touch) rather than stamped
  // with the migration time.
  await run(
    "add defense_job_listings.last_seen_at",
    `ALTER TABLE defense_job_listings ADD COLUMN IF NOT EXISTS last_seen_at timestamptz`
  );
  await run(
    "add defense_job_listings.closed_at",
    `ALTER TABLE defense_job_listings ADD COLUMN IF NOT EXISTS closed_at timestamptz`
  );
  await run(
    "backfill last_seen_at from updated_at",
    `UPDATE defense_job_listings SET last_seen_at = updated_at WHERE last_seen_at IS NULL`
  );
  await run(
    "last_seen_at NOT NULL DEFAULT now()",
    `ALTER TABLE defense_job_listings
       ALTER COLUMN last_seen_at SET NOT NULL,
       ALTER COLUMN last_seen_at SET DEFAULT now()`
  );
  await run(
    "index open listings by employer",
    `CREATE INDEX IF NOT EXISTS defense_job_listings_employer_open_idx
       ON defense_job_listings (employer_slug, closed_at)`
  );

  // Defense-slice tagging (issue #336). For a `counts_as_defense: false`
  // commercial employer, only the defense slice is ingested; each admitted row
  // records WHY via `defense_relevance` ('prime' | 'cleared' | 'gov_customer',
  // from lib/defense-jobs-slice.ts classifyDefenseRelevance) and `defense_signal`
  // (the matched text). Nullable: pre-#336 rows and prime-employer rows may leave
  // them unset until the importer/sync backfills. See lib/defense-jobs-slice.ts.
  await run(
    "add defense_job_listings.defense_relevance",
    `ALTER TABLE defense_job_listings ADD COLUMN IF NOT EXISTS defense_relevance text`
  );
  await run(
    "add defense_job_listings.defense_signal",
    `ALTER TABLE defense_job_listings ADD COLUMN IF NOT EXISTS defense_signal text`
  );

  await run(
    "index defense_job_listings by coordinates",
    `CREATE INDEX IF NOT EXISTS defense_job_listings_coordinates_idx
       ON defense_job_listings (latitude, longitude)`
  );
  await run(
    "index defense_job_listings by sector",
    `CREATE INDEX IF NOT EXISTS defense_job_listings_sector_idx
       ON defense_job_listings (sector)`
  );
  await run(
    "index defense_job_listings by employer_slug",
    `CREATE INDEX IF NOT EXISTS defense_job_listings_employer_slug_idx
       ON defense_job_listings (employer_slug)`
  );

  console.log(`\n${dryRun ? "Dry run" : "Migration"} complete.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
