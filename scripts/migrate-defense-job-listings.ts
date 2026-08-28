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
      CONSTRAINT defense_job_listings_url_key UNIQUE (url)
    )`
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
