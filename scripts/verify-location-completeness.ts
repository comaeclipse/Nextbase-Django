/**
 * Verifies that a city has both a complete curated row and its required
 * post-import enrichments. A non-zero exit means it cannot be called complete.
 *
 * Usage:
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/verify-location-completeness.ts --name "City, ST"
 *   ... --id 617 --mode structural
 *   ... --slug ca-los-angeles-canoga-park --mode profile
 *
 * Default mode is profile. Neighborhood structural success is not profile
 * completion. Profile/candidate checks fail until evidence review is supported;
 * candidate mode additionally requires the editorial flag for existing cities.
 */
import { getSql } from "../lib/db";
import {
  formatCompletionProblem,
  hasCompletionValue,
} from "../lib/location-completeness";
import { parseLocationVerificationOptions, requireUniqueLocation } from "../lib/location-targets";
import { inspectNeighborhoodReadiness } from "../lib/neighborhood-readiness";

/*
 * A geography below city level owns a different set of facts; the rest resolve
 * at read time from a containing geography (lib/geo-inheritance.ts). Checking
 * it against the city list would report every neighborhood as broken.
 */
const requiredNonCityColumns = [
  "county", "population", "population_source", "population_vintage",
  "boundary_source", "description", "tags", "latitude", "longitude",
  "slug", "geo_type", "parent_geo_id",
] as const;

const requiredColumns = [
  "county", "city_politics", "election_2016",
  "election_2016_percent", "election_2024", "election_2024_percent", "election_change",
  "rep_vote_share_change_pp", "dem_vote_share_change_pp", "population", "density", "sales_tax",
  "col_index", "avg_home_value", "has_va", "nearest_va", "distance_to_va",
  "nearest_va_hospital", "distance_to_va_hospital", "tci", "crime",
  "lgbtq_rating", "lgbtq_mei_score",
  "lgbtq_score_source", "tech_hub", "defense_hub_manual", "defense_hub", "snow_annual",
  "rain_annual", "sun_days", "alw", "avg_high_summer", "humidity_summer", "climate",
  "climate_category", "gas_price", "description", "tags", "latitude", "longitude",
] as const;

function hasValue(field: string, value: unknown): boolean {
  return hasCompletionValue(field, value);
}

function allowsMissingMeiScore(row: Record<string, unknown>): boolean {
  const rating = String(row.lgbtq_rating ?? "").toLowerCase();
  const source = String(row.lgbtq_score_source ?? "").toLowerCase();
  return (
    rating.includes("not rated") ||
    rating.includes("not hrc rated") ||
    source.includes("not rated") ||
    source.includes("did not rate")
  );
}

async function main() {
  const options = parseLocationVerificationOptions(process.argv.slice(2));
  const sql = getSql();
  const rows = await sql.query(
    `SELECT l.*, p.category AS pace_category,
      (SELECT count(*)::int FROM location_weather_monthly w WHERE w.location_id = l.id) AS monthly_weather_rows,
      (SELECT count(*)::int FROM location_hourly_normals h WHERE h.location_id = l.id) AS hourly_normal_rows,
      (SELECT count(*)::int FROM location_features f WHERE f.location_id = l.id) AS feature_rows,
      EXISTS (
        SELECT 1 FROM geo_relationships r
        JOIN locations_location parent ON parent.id = r.parent_geo_id
        WHERE r.child_geo_id = l.id AND r.parent_geo_id = l.parent_geo_id
          AND r.relationship_type = 'municipal_containment'
          AND r.valid_from <= CURRENT_DATE AND (r.valid_to IS NULL OR r.valid_to > CURRENT_DATE)
          AND NULLIF(trim(r.source), '') IS NOT NULL
          AND parent.geo_type = 'city' AND parent.state = l.state
      ) AS has_valid_municipal_parent
     FROM locations_location l
     LEFT JOIN location_pace_current p ON p.location_id = l.id
     WHERE ${options.where}`,
    options.params
  ) as Record<string, unknown>[];
  const row = requireUniqueLocation(rows, options.label);
  const name = String(row.name), state = String(row.state);

  if (row.geo_type === "neighborhood") {
    const readiness = inspectNeighborhoodReadiness(row);
    const problems = options.mode === "structural"
      ? readiness.structuralProblems
      : [...readiness.structuralProblems, ...readiness.profileDataProblems, ...readiness.reviewProblems];
    console.log(name + ", " + state + " [" + row.slug + "] — " + options.mode + " check");
    if (problems.length) {
      for (const problem of problems) console.error("  - " + problem);
      process.exitCode = 1;
    } else {
      console.log("Neighborhood structure verified. This does not certify a complete profile or ranking eligibility.");
    }
    return;
  }
  if (options.mode === "structural") {
    throw new Error("--mode structural currently supports neighborhoods only; use --mode profile for cities");
  }
  if (options.mode === "candidate" && (row.geo_type !== "city" || row.is_candidate !== true)) {
    throw new Error("Not an eligible city candidate; non-city promotion remains disabled");
  }

  const geoType = String(row.geo_type ?? "city");
  const isCity = geoType === "city";
  const populationUnavailable = geoType === "neighborhood" && row.is_candidate === false &&
    !hasValue("population", row.population) && hasValue("population_unavailable_reason", row.population_unavailable_reason);
  const columns: readonly string[] = isCity ? requiredColumns : populationUnavailable
    ? requiredNonCityColumns.filter((c) => !["population", "population_source", "population_vintage"].includes(c))
    : requiredNonCityColumns;

  const missing: string[] = columns.filter((column) => {
    const fieldValue = row[column];
    if (column === "lgbtq_mei_score" && !hasValue(column, fieldValue) && allowsMissingMeiScore(row)) {
      return false;
    }
    return !hasValue(column, fieldValue);
  });
  if (!row.pace_category) missing.push("pace_category");

  /*
   * Weather and hourly normals are keyed by station, not containment, so a
   * contained geography has no rows of its own by design -- the page resolves
   * them from the nearest ancestor that does. Requiring them here would report
   * a correctly-imported neighborhood as broken.
   */
  if (isCity) {
    if (Number(row.monthly_weather_rows) !== 12) missing.push("12 monthly weather rows");
    if (Number(row.hourly_normal_rows) !== 288) missing.push("288 hourly normal rows");
    if (Number(row.feature_rows) === 0) missing.push("derived location features");
  }

  // Containment is the one thing a non-city geography must have; without it
  // there is nothing to inherit from and its page renders mostly empty.
  if (!isCity && !hasValue("parent_geo_id", row.parent_geo_id)) {
    missing.push("parent_geo_id (no containing geography)");
  }

  if (missing.length) {
    console.error(`${name}, ${state} is incomplete:`);
    for (const field of missing) console.error(`  - ${formatCompletionProblem(field)}`);
    process.exitCode = 1;
    return;
  }
  console.log(
    isCity
      ? `${name}, ${state} is complete: curated fields, VA hospital, climate, pace, and derived features verified.`
      : `${name}, ${state}: legacy ${geoType} field checks passed; profile evidence and ranking eligibility are not certified.`
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
