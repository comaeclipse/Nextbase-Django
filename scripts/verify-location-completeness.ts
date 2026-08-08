/**
 * Verifies that a city has both a complete curated row and its required
 * post-import enrichments. A non-zero exit means it cannot be called complete.
 *
 * Usage:
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/verify-location-completeness.ts --name "City, ST"
 */
import { getSql } from "../lib/db";

const nameIndex = process.argv.indexOf("--name");
const cityKey = nameIndex >= 0 ? process.argv[nameIndex + 1] : undefined;
if (!cityKey || !cityKey.includes(",")) {
  throw new Error('Usage: verify-location-completeness.ts --name "City, ST"');
}

const [name, state] = cityKey.split(",").map((part) => part.trim());
const sql = getSql();

const requiredColumns = [
  "county", "state_party", "governor", "city_politics", "election_2016",
  "election_2016_percent", "election_2024", "election_2024_percent", "election_change",
  "rep_vote_share_change_pp", "dem_vote_share_change_pp", "population", "density", "sales_tax",
  "income_tax", "col_index", "avg_home_value", "has_va", "nearest_va", "distance_to_va",
  "nearest_va_hospital", "distance_to_va_hospital", "veterans_benefits", "tci", "crime",
  "marijuana_status", "lgbtq_rating", "lgbtq_mei_score", "lgbtq_state_policy_score",
  "lgbtq_score_source", "tech_hub", "defense_hub_manual", "defense_hub", "snow_annual",
  "rain_annual", "sun_days", "alw", "avg_high_summer", "humidity_summer", "climate",
  "climate_category", "gas_price", "description", "tags", "latitude", "longitude",
] as const;

async function main() {
  const [row] = await sql.query(
    `SELECT l.*, p.category AS pace_category,
      (SELECT count(*)::int FROM location_weather_monthly w WHERE w.location_id = l.id) AS monthly_weather_rows,
      (SELECT count(*)::int FROM location_hourly_normals h WHERE h.location_id = l.id) AS hourly_normal_rows,
      (SELECT count(*)::int FROM location_features f WHERE f.location_id = l.id) AS feature_rows
     FROM locations_location l
     LEFT JOIN location_pace_current p ON p.location_id = l.id
     WHERE l.name = $1 AND l.state = $2`,
    [name, state]
  ) as Record<string, unknown>[];
  if (!row) throw new Error(`Location not found: ${name}, ${state}`);

  const missing: string[] = requiredColumns.filter((column) => {
    const value = row[column];
    return value === null || value === undefined || value === "" || (column === "tags" && (!Array.isArray(value) || value.length === 0));
  });
  if (!row.pace_category) missing.push("pace_category");
  if (Number(row.monthly_weather_rows) !== 12) missing.push("12 monthly weather rows");
  if (Number(row.hourly_normal_rows) !== 288) missing.push("288 hourly normal rows");
  if (Number(row.feature_rows) === 0) missing.push("derived location features");

  if (missing.length) {
    console.error(`${name}, ${state} is incomplete:`);
    for (const field of missing) console.error(`  - ${field}`);
    process.exitCode = 1;
    return;
  }
  console.log(`${name}, ${state} is complete: curated fields, VA hospital, climate, pace, and derived features verified.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
