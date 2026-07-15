/*
 * Schema migration for per-city monthly weather normals.
 *
 *   - creates `location_weather_monthly` (12 rows/city, one per calendar month)
 *
 * Additive only: the annual aggregate columns on `locations_location`
 * (snow_annual, alw, avg_high_summer, humidity_summer, sun_days) stay
 * authoritative and untouched — this table is for richer, month-by-month
 * visualization (seasonal temperature bands, monthly precip/snow, humidity).
 *
 * Idempotent: safe to re-run. Does not mutate `locations_location`.
 *
 * Usage:
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/migrate-weather-monthly.ts [--dry-run]
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
  console.log(`Monthly weather migration${dryRun ? " (dry run)" : ""}\n`);

  console.log("1. location_weather_monthly");
  if (await tableExists("location_weather_monthly")) {
    log("table already exists");
  } else {
    await run(
      "create table",
      `CREATE TABLE location_weather_monthly (
        id bigserial PRIMARY KEY,
        location_id bigint NOT NULL REFERENCES locations_location(id) ON DELETE CASCADE,
        month smallint NOT NULL CHECK (month BETWEEN 1 AND 12),

        -- Temperature (°F). Nullable so a city with partial normals still
        -- renders; the /weather page degrades to "data unavailable" per metric.
        avg_high_f numeric(4,1),
        avg_low_f numeric(4,1),
        avg_temp_f numeric(4,1),

        -- Precipitation
        precip_in numeric(5,2),      -- total precip, rain-equivalent inches
        snow_in numeric(5,2),        -- snowfall, inches
        precip_days smallint,        -- days with measurable precipitation

        -- Sun & humidity
        humidity_pct smallint,       -- mean relative humidity
        sun_pct smallint,            -- % of possible sunshine

        -- Provenance (mirrors defense_employer_locations / pace tables)
        data_vintage text,           -- e.g. '1991-2020' NOAA normals period
        source_kind text,            -- 'noaa_normals' | ...
        source_url text,
        source_retrieved_on date,
        created_at timestamptz NOT NULL DEFAULT now(),

        UNIQUE (location_id, month)
      )`
    );
    await run(
      "index location_id + month",
      `CREATE INDEX location_weather_monthly_location_month_idx
       ON location_weather_monthly (location_id, month)`
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
