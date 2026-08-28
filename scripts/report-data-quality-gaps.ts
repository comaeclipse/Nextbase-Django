/**
 * Read-only live Neon inventory for issue #55.
 *
 * The city-quality section is scoped to ranked city candidates. Non-candidate
 * geography rows and employer anchors are useful records, but they are not
 * supposed to satisfy the curated retirement-city completeness bar.
 *
 * Usage:
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/report-data-quality-gaps.ts
 */
import { getSql } from "../lib/db";
import { completionRequirementFor, hasCompletionValue } from "../lib/location-completeness";

type GapSpec = {
  field: string;
  label: string;
  action: string;
};

type CityRow = {
  id: number;
  name: string;
  state: string;
  tci: number | null;
  crime: string | null;
  gas_price: string | null;
  defense_hub_manual: boolean | null;
  sun_days: number | null;
  humidity_summer: number | null;
  climate_category: string | null;
  nearest_va_hospital: string | null;
  distance_to_va_hospital: string | null;
  lgbtq_state_policy_score: string | null;
  property_tax_rate: string | null;
  rep_vote_share_change_pp: string | null;
  dem_vote_share_change_pp: string | null;
};

const CITY_GAPS: GapSpec[] = [
  issue20("tci"),
  issue20("crime"),
  issue20("defense_hub_manual"),
  issue20("gas_price"),
  issue20("sun_days"),
  issue20("humidity_summer"),
  issue20("climate_category"),
  issue20("nearest_va_hospital"),
  issue20("distance_to_va_hospital"),
  { field: "lgbtq_state_policy_score", label: "location LGBTQ state policy score", action: "apply the sourced MAP location backfill only after its source artifacts merge" },
  { field: "property_tax_rate", label: "property tax rate", action: "run the sourced property-tax importer from merged master" },
  { field: "rep_vote_share_change_pp", label: "Republican vote-share delta", action: "derive the 2016-to-2024 percentage-point delta from documented election returns" },
  { field: "dem_vote_share_change_pp", label: "Democratic vote-share delta", action: "derive the 2016-to-2024 percentage-point delta from documented election returns" },
];

function issue20(field: string): GapSpec {
  const requirement = completionRequirementFor(field);
  return { field, label: requirement.label, action: requirement.nextAction };
}

function hasRowValue(row: Record<string, unknown>, field: string): boolean {
  return hasCompletionValue(field, row[field]);
}

function missingFor(row: Record<string, unknown>, specs: GapSpec[]): GapSpec[] {
  return specs.filter((spec) => !hasRowValue(row, spec.field));
}

function printCityGapReport(rows: CityRow[]) {
  console.log("Curated city-row gaps");
  console.log(`Scope: ${rows.length} ranked city candidate row(s).`);
  console.log("");
  console.log("Field counts:");

  for (const spec of CITY_GAPS) {
    const missing = rows.filter((row) => !hasRowValue(row, spec.field));
    console.log(`  - ${spec.field} (${spec.label}): ${missing.length}`);
  }

  const queue = rows
    .map((row) => ({ row, missing: missingFor(row, CITY_GAPS) }))
    .filter(({ missing }) => missing.length > 0);

  console.log("");
  console.log(`Rows missing at least one tracked field: ${queue.length}`);
  if (queue.length === 0) return;

  console.log("Backfill queue:");
  for (const { row, missing } of queue) {
    console.log(`  - ${row.name}, ${row.state} (#${row.id}): ${missing.map((spec) => spec.field).join(", ")}`);
  }
}

async function main() {
  const sql = getSql();
  const cityRows = (await sql.query(
    `SELECT id, name, state, tci, crime, gas_price, defense_hub_manual,
            sun_days, humidity_summer, climate_category,
            nearest_va_hospital, distance_to_va_hospital,
            lgbtq_state_policy_score, property_tax_rate,
            rep_vote_share_change_pp, dem_vote_share_change_pp
     FROM locations_location
     WHERE geo_type = 'city'
       AND is_candidate IS DISTINCT FROM false
     ORDER BY state, name`,
    []
  )) as CityRow[];

  const [military] = await sql.query(
    `SELECT count(*)::int AS total,
            count(*) FILTER (WHERE latitude IS NULL OR longitude IS NULL)::int AS missing_coordinates
     FROM military_installations`,
    []
  ) as { total: number; missing_coordinates: number }[];

  const [employers] = await sql.query(
    `SELECT count(*)::int AS total,
            count(*) FILTER (WHERE latitude IS NULL OR longitude IS NULL)::int AS missing_coordinates,
            count(*) FILTER (WHERE location_id IS NULL)::int AS unlinked
     FROM defense_employer_locations`,
    []
  ) as { total: number; missing_coordinates: number; unlinked: number }[];

  const [monthly] = await sql.query(
    `SELECT count(*)::int AS total,
            count(*) FILTER (WHERE humidity_pct IS NULL)::int AS missing_humidity_pct,
            count(*) FILTER (WHERE sun_pct IS NULL)::int AS missing_sun_pct,
            count(*) FILTER (WHERE precip_in IS NULL)::int AS missing_precip_in,
            count(*) FILTER (WHERE snow_in IS NULL)::int AS missing_snow_in,
            count(*) FILTER (WHERE precip_days IS NULL)::int AS missing_precip_days
     FROM location_weather_monthly`,
    []
  ) as {
    total: number;
    missing_humidity_pct: number;
    missing_sun_pct: number;
    missing_precip_in: number;
    missing_snow_in: number;
    missing_precip_days: number;
  }[];

  console.log("Data quality gap inventory (issue #55)");
  console.log("");
  printCityGapReport(cityRows);
  console.log("");
  console.log("Military installation coordinate gaps");
  console.log(`  - missing coordinates: ${military.missing_coordinates} / ${military.total}`);
  console.log("");
  console.log("Defense employer location gaps");
  console.log(`  - missing coordinates: ${employers.missing_coordinates} / ${employers.total}`);
  console.log(`  - unlinked location_id: ${employers.unlinked} / ${employers.total}`);
  console.log("    Note: unlinked employer rows are expected when their city is not a curated location.");
  console.log("");
  console.log("Monthly weather nullable fields");
  console.log(`  - humidity_pct: ${monthly.missing_humidity_pct} / ${monthly.total} (expected by design for GHCN monthly normals)`);
  console.log(`  - sun_pct: ${monthly.missing_sun_pct} / ${monthly.total} (expected by design for GHCN monthly normals)`);
  console.log(`  - precip_in: ${monthly.missing_precip_in} / ${monthly.total}`);
  console.log(`  - snow_in: ${monthly.missing_snow_in} / ${monthly.total}`);
  console.log(`  - precip_days: ${monthly.missing_precip_days} / ${monthly.total}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
