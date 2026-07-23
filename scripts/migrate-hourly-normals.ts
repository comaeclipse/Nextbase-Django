/*
 * Schema migration for per-city hourly weather normals (moisture).
 *
 *   - creates `location_hourly_normals` (288 rows/city: 12 months x 24 hours)
 *
 * Why a new table rather than columns on `location_weather_monthly`:
 * that table carries one `source_url` per row and is sourced from GHCN *monthly*
 * normals, which contain no humidity at all (hence its permanently-empty
 * humidity_pct/sun_pct). Dew point only exists in the *hourly* normals product,
 * which is published for ASOS/airport (USW) stations only — a different station
 * for ~half the cities. Writing that into a monthly row would silently attribute
 * one station's moisture to another station's temperature. Separate table,
 * separate provenance.
 *
 * Grain is month x hour, not month: dew point has a strong diurnal cycle
 * (Phoenix July: 57F at 05h vs 52F at 16h), and a daily mean conflates humid
 * dawns with dry afternoons — the exact error that makes relative humidity
 * unusable for ranking. Keeping the hour lets callers read moisture *at the
 * hottest hour*. NCEI's 8760 day-hours collapse to 288 here; the raw CSVs stay
 * cached under data/sources/weather/hourly/ if per-day detail is ever needed.
 *
 * Additive and idempotent: safe to re-run, mutates nothing that already exists.
 *
 * Usage:
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/migrate-hourly-normals.ts [--dry-run]
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
  console.log(`Hourly normals migration${dryRun ? " (dry run)" : ""}\n`);

  console.log("1. location_hourly_normals");
  if (await tableExists("location_hourly_normals")) {
    log("table already exists");
  } else {
    await run(
      "create table",
      `CREATE TABLE location_hourly_normals (
        id bigserial PRIMARY KEY,
        location_id bigint NOT NULL REFERENCES locations_location(id) ON DELETE CASCADE,
        month smallint NOT NULL CHECK (month BETWEEN 1 AND 12),
        hour smallint NOT NULL CHECK (hour BETWEEN 0 AND 23),  -- local standard time

        -- Moisture & temperature (°F), averaged across the days of each month.
        -- Every metric nullable: a station may carry temperature but not dew
        -- point, mirroring location_weather_monthly's degrade-per-metric rule.
        temp_f numeric(4,1),           -- HLY-TEMP-NORMAL
        dew_point_f numeric(4,1),      -- HLY-DEWP-NORMAL
        dew_point_p10_f numeric(4,1),  -- HLY-DEWP-10PCTL (dry extreme)
        dew_point_p90_f numeric(4,1),  -- HLY-DEWP-90PCTL (muggy extreme)
        heat_index_f numeric(4,1),     -- HLY-HIDX-NORMAL (NOAA's own; not recomputed)

        -- Which station this city's moisture actually came from. Recorded
        -- explicitly because location_weather_monthly records neither, which is
        -- why its bad matches (Honolulu, Marietta) were invisible until audited.
        -- Dew point is an air-mass property and varies smoothly over a region,
        -- so a metro's airport is representative at distances that would be
        -- unacceptable for temperature.
        station_id text NOT NULL,
        station_name text,
        station_distance_mi numeric(5,1) NOT NULL,

        -- Provenance (mirrors location_weather_monthly)
        data_vintage text,             -- '1991-2020'
        source_kind text,              -- 'noaa_hourly_normals'
        source_url text,
        source_retrieved_on date,
        created_at timestamptz NOT NULL DEFAULT now(),

        UNIQUE (location_id, month, hour)
      )`
    );
    await run(
      "index location_id + month",
      `CREATE INDEX location_hourly_normals_location_month_idx
       ON location_hourly_normals (location_id, month)`
    );
  }

  console.log(
    dryRun ? "\nDry run complete (no schema changes)." : "\nMigration complete."
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
