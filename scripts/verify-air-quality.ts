/*
 * Verify annual AQI coverage for curated locations.
 *
 * Usage:
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/verify-air-quality.ts [--year 2025]
 */
import { getSql } from "../lib/db";

function argValue(name: string): string | null {
  const idx = process.argv.indexOf(name);
  if (idx === -1) return null;
  return process.argv[idx + 1] ?? null;
}

const year = Number(argValue("--year") ?? new Date().getUTCFullYear() - 1);
const allYears = process.argv.includes("--all");
if (!allYears && (!Number.isInteger(year) || year < 1990 || year > 2100)) {
  throw new Error(`Invalid --year value: ${argValue("--year")}`);
}

async function main() {
  const sql = getSql();

  if (allYears) {
    const byYear = await sql.query(
      `SELECT year, source_geo_type, count(*) AS rows
       FROM location_air_quality_annual
       GROUP BY year, source_geo_type
       ORDER BY year DESC, source_geo_type`
    );
    const latestCoverage = await sql.query(
      `WITH latest AS (
         SELECT location_id, max(year) AS latest_year
         FROM location_air_quality_annual
         GROUP BY location_id
       )
       SELECT
         (SELECT count(*) FROM locations_location) AS locations,
         (SELECT count(*) FROM location_air_quality_annual) AS air_quality_rows,
         count(latest.location_id) AS covered_locations,
         min(latest.latest_year) AS oldest_latest_year,
         max(latest.latest_year) AS newest_latest_year
       FROM locations_location l
       LEFT JOIN latest ON latest.location_id = l.id`
    );
    const unmatched = await sql.query(
      `SELECT l.name, l.state, l.county
       FROM locations_location l
       LEFT JOIN location_air_quality_annual aq ON aq.location_id = l.id
       WHERE aq.location_id IS NULL
       ORDER BY l.state, l.name`
    );
    console.log(
      JSON.stringify(
        { latestCoverage: latestCoverage[0], byYear, neverMatched: unmatched },
        null,
        2
      )
    );
    return;
  }

  const summary = (await sql.query(
    `SELECT
       (SELECT count(*) FROM locations_location) AS locations,
       count(*) AS air_quality_rows,
       count(DISTINCT location_id) AS covered_locations,
       min(year) AS min_year,
       max(year) AS max_year
     FROM location_air_quality_annual
     WHERE year = $1`,
    [year]
  )) as {
    locations: string;
    air_quality_rows: string;
    covered_locations: string;
    min_year: number | null;
    max_year: number | null;
  }[];

  const sourceMix = await sql.query(
    `SELECT source_geo_type, count(*) AS rows
     FROM location_air_quality_annual
     WHERE year = $1
     GROUP BY source_geo_type
     ORDER BY source_geo_type`,
    [year]
  );

  const unmatched = await sql.query(
    `SELECT l.name, l.state, l.county
     FROM locations_location l
     LEFT JOIN location_air_quality_annual aq
       ON aq.location_id = l.id AND aq.year = $1
     WHERE aq.location_id IS NULL
     ORDER BY l.state, l.name`,
    [year]
  );

  const sample = await sql.query(
    `SELECT l.name, l.state, aq.source_geo_type, aq.source_geo_name,
            aq.source_distance_miles,
            aq.days_with_aqi, aq.median_aqi, aq.p90_aqi, aq.max_aqi,
            aq.unhealthy_sensitive_days + aq.unhealthy_days
              + aq.very_unhealthy_days + aq.hazardous_days
              AS unhealthy_or_worse_days
     FROM location_air_quality_annual aq
     JOIN locations_location l ON l.id = aq.location_id
     WHERE aq.year = $1
     ORDER BY unhealthy_or_worse_days DESC, aq.max_aqi DESC, l.name
     LIMIT 10`,
    [year]
  );

  console.log(JSON.stringify({ summary: summary[0], sourceMix, unmatched, sample }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
