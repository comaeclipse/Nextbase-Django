/*
 * Schema migration for annual city air-quality summaries.
 *
 * The source geography is explicit because EPA AirData annual AQI summaries are
 * published by county/CBSA, not by municipal boundary. The importer prefers
 * county/CBSA and can store a clearly labeled nearest-county fallback.
 *
 * Usage:
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/migrate-air-quality.ts [--dry-run]
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

async function main() {
  console.log(`Air quality migration${dryRun ? " (dry run)" : ""}\n`);

  console.log("1. location_air_quality_annual");
  if (await tableExists("location_air_quality_annual")) {
    log("table already exists");
    await run(
      "drop source_geo_type check",
      `ALTER TABLE location_air_quality_annual
       DROP CONSTRAINT IF EXISTS location_air_quality_annual_source_geo_type_check`
    );
    await run(
      "add source_geo_type check",
      `ALTER TABLE location_air_quality_annual
       ADD CONSTRAINT location_air_quality_annual_source_geo_type_check
       CHECK (source_geo_type IN ('county', 'cbsa', 'nearest_county'))`
    );
    await run(
      "add source_distance_miles",
      `ALTER TABLE location_air_quality_annual
       ADD COLUMN IF NOT EXISTS source_distance_miles numeric(6,1)`
    );
  } else {
    await run(
      "create table",
      `CREATE TABLE location_air_quality_annual (
        id bigserial PRIMARY KEY,
        location_id bigint NOT NULL REFERENCES locations_location(id) ON DELETE CASCADE,
        year integer NOT NULL CHECK (year BETWEEN 1990 AND 2100),

        source_geo_type text NOT NULL CHECK (source_geo_type IN ('county', 'cbsa', 'nearest_county')),
        source_state_name text NOT NULL,
        source_geo_name text NOT NULL,
        source_distance_miles numeric(6,1),

        days_with_aqi integer NOT NULL,
        good_days integer NOT NULL,
        moderate_days integer NOT NULL,
        unhealthy_sensitive_days integer NOT NULL,
        unhealthy_days integer NOT NULL,
        very_unhealthy_days integer NOT NULL,
        hazardous_days integer NOT NULL,
        max_aqi integer NOT NULL,
        p90_aqi integer NOT NULL,
        median_aqi integer NOT NULL,

        days_co integer NOT NULL,
        days_no2 integer NOT NULL,
        days_ozone integer NOT NULL,
        days_pm25 integer NOT NULL,
        days_pm10 integer NOT NULL,

        data_vintage text NOT NULL,
        source_kind text NOT NULL,
        source_url text NOT NULL,
        source_file text NOT NULL,
        source_retrieved_on date NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),

        UNIQUE (location_id, year, source_geo_type)
      )`
    );
    await run(
      "index location_id + year",
      `CREATE INDEX location_air_quality_annual_location_year_idx
       ON location_air_quality_annual (location_id, year DESC)`
    );
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
