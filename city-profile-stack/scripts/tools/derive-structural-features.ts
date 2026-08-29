/*
 * Derives city-capability features (L2) for EVERY location from columns we
 * already store. Run after city-profile-stack/scripts/migrations/migrate-location-features.ts.
 *
 * This is the extrapolation step. A dossier gives ground truth for one city;
 * this gives a defensible estimate for all of them, so a city nobody has
 * researched still carries an isolation score, an amenity depth, a healthcare
 * estimate, and a housing-vs-size reading.
 *
 * Where a city has BOTH an editorial and a derived value, both rows are kept and
 * the run prints a calibration table. That table is the point: it shows where
 * the formulas track researched reality and where they do not, which is what
 * tells you which curve to refit next.
 *
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs city-profile-stack/scripts/tools/derive-structural-features.ts [--dry-run] [--calibrate-only]
 */
import { readFileSync } from "node:fs";
import { getSql } from "../../../lib/db";
import {
  CONFIDENCE_CEILING,
  FEATURE_SCHEMA_VERSION,
  isFeatureKey,
} from "../../lib/ontology";
import {
  DERIVERS,
  METHOD_VERSION,
  type LocationFacts,
  type MetroAnchor,
  buildContext,
  deriveAll,
  fitHomeValueResiduals,
  parseMiles,
  parsePopulation,
} from "../../lib/derive";

const dryRun = process.argv.includes("--dry-run");
const calibrateOnly = process.argv.includes("--calibrate-only");

const anchors = (
  JSON.parse(readFileSync("city-profile-stack/data/us-metro-anchors.json", "utf8")) as { anchors: MetroAnchor[] }
).anchors;

interface Row {
  id: string;
  name: string;
  state: string;
  latitude: number | null;
  longitude: number | null;
  population: string | null;
  density: number | null;
  col_index: number | null;
  avg_home_value: string | null;
  distance_to_va: string | null;
  distance_to_va_hospital: string | null;
  has_va: boolean | null;
  pace_category: string | null;
  climate_category: string | null;
  avg_low_winter: number | null;
  avg_high_summer: number | null;
  snow_annual: number | null;
  rain_annual: number | null;
  summer_dew_point_f: string | null;
  coldest_month_low_f: string | null;
  comfortable_months: string | null;
  monthly_climate: { month: number; avgHighF: number | null; avgLowF: number | null; dewPointF: number | null }[] | null;
  summer_precip_share: string | null;
  crime: string | null;
  election_2024: string | null;
  election_2024_percent: number | null;
  lgbtq_rating: string | null;
  lgbtq_mei_score: number | null;
  lgbtq_state_policy_score: string | null;
  near_lake: boolean | null;
  near_ocean: boolean | null;
  near_mountains: boolean | null;
  vibes: string[] | null;
}

const num = (v: string | number | null): number | null => {
  if (v === null || v === undefined) return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
};

function toFacts(row: Row): LocationFacts {
  return {
    id: row.id,
    name: row.name,
    state: row.state,
    latitude: row.latitude,
    longitude: row.longitude,
    population: parsePopulation(row.population),
    density: row.density,
    colIndex: row.col_index,
    avgHomeValue: num(row.avg_home_value),
    distanceToVaMiles: parseMiles(row.distance_to_va),
    distanceToVaHospitalMiles: parseMiles(row.distance_to_va_hospital),
    hasVa: row.has_va,
    paceCategory: row.pace_category,
    climateCategory: row.climate_category,
    avgLowWinter: row.avg_low_winter,
    avgHighSummer: row.avg_high_summer,
    snowAnnual: row.snow_annual,
    rainAnnual: row.rain_annual,
    summerDewPointF: num(row.summer_dew_point_f),
    coldestMonthLowF: num(row.coldest_month_low_f),
    comfortableMonths: num(row.comfortable_months),
    monthlyClimate: row.monthly_climate,
    summerPrecipShare: num(row.summer_precip_share),
    crime: row.crime,
    election2024: row.election_2024,
    election2024Percent: row.election_2024_percent,
    lgbtqRating: num(row.lgbtq_rating),
    lgbtqMeiScore: row.lgbtq_mei_score,
    lgbtqStatePolicyScore: num(row.lgbtq_state_policy_score),
    nearLake: row.near_lake,
    nearOcean: row.near_ocean,
    nearMountains: row.near_mountains,
    vibes: row.vibes,
  };
}

async function main() {
  const sql = getSql();

  const rows = (await sql.query(`
    SELECT
      l.id, l.name, l.state, l.latitude, l.longitude, l.population, l.density,
      l.col_index, l.avg_home_value, l.distance_to_va, l.distance_to_va_hospital, l.has_va,
      l.climate_category, l.avg_low_winter, l.avg_high_summer, l.snow_annual,
      l.rain_annual, l.crime, l.election_2024, l.election_2024_percent, l.lgbtq_rating,
      l.lgbtq_mei_score, l.lgbtq_state_policy_score, l.near_lake, l.near_ocean,
      l.near_mountains, l.vibes,
      COALESCE(p.override_category, p.category) AS pace_category,
      d.summer_dew_point_f,
      m.coldest_month_low_f,
      m.summer_precip_share,
      m.comfortable_months,
      mc.monthly_climate
    FROM locations_location l
    LEFT JOIN location_pace_current p ON p.location_id = l.id
    LEFT JOIN (
      SELECT location_id, AVG(dew_point_f) AS summer_dew_point_f
      FROM location_hourly_normals
      WHERE month IN (6, 7, 8)
      GROUP BY location_id
    ) d ON d.location_id = l.id
    LEFT JOIN (
      -- Monthly normals beat the coarse columns: avg_low_winter is null for a
      -- third of the dataset, and precipitation seasonality does not exist as a
      -- column at all despite being what separates a monsoon climate from a
      -- spring-peak one.
      SELECT
        location_id,
        MIN(avg_low_f) AS coldest_month_low_f,
        CASE WHEN SUM(precip_in) > 0
          THEN SUM(precip_in) FILTER (WHERE month BETWEEN 6 AND 9) / SUM(precip_in)
        END AS summer_precip_share,
        -- Months pleasant to be outside in, and months that require working
        -- heating or cooling. Counted in both directions so a place confined by
        -- heat and a place confined by cold score the same way.
        count(*) FILTER (WHERE avg_high_f BETWEEN 55 AND 85 AND avg_low_f > 32) AS comfortable_months
      FROM location_weather_monthly
      GROUP BY location_id
    ) m ON m.location_id = l.id
    LEFT JOIN (
      -- Monthly temperature from the city's own normals, joined to the nearest
      -- hourly station's dew point for that month. Apparent temperature is
      -- computed in TypeScript from these, reusing lib/climate.ts.
      SELECT w.location_id, json_agg(json_build_object(
               'month', w.month,
               'avgHighF', w.avg_high_f::float,
               'avgLowF', w.avg_low_f::float,
               'dewPointF', d.dew_point_f::float
             ) ORDER BY w.month) AS monthly_climate
      FROM location_weather_monthly w
      LEFT JOIN (
        SELECT location_id, month, AVG(dew_point_f) AS dew_point_f
        FROM location_hourly_normals GROUP BY location_id, month
      ) d ON d.location_id = w.location_id AND d.month = w.month
      GROUP BY w.location_id
    ) mc ON mc.location_id = l.id
    -- Candidates only. The formula-vs-ground-truth calibration this script
    -- prints is fitted over the curated corpus; a structural parent such as
    -- Los Angeles, or a neighborhood whose inputs are partly inherited, would
    -- skew the fit while never being a place the features get consumed for.
    WHERE l.is_candidate
    ORDER BY l.state, l.name
  `)) as Row[];

  const facts = rows.map(toFacts);
  const residuals = fitHomeValueResiduals(
    facts.map((f) => ({ id: f.id, population: f.population, avgHomeValue: f.avgHomeValue }))
  );
  console.log(
    `Loaded ${rows.length} locations. Home-value regression fitted on ${residuals.size}.\n`
  );

  const ceiling = CONFIDENCE_CEILING.derived_structural;
  const derivedByCity = new Map<string, Record<string, number>>();
  let written = 0;
  let skipped = 0;

  for (const fact of facts) {
    const ctx = buildContext(fact, anchors, residuals.get(fact.id) ?? null);
    if (ctx === null) {
      console.log(`! ${fact.name}, ${fact.state}: no coordinates — skipped`);
      skipped++;
      continue;
    }
    const derived = deriveAll(fact, ctx);
    derivedByCity.set(
      fact.id,
      Object.fromEntries(Object.entries(derived).map(([k, v]) => [k, v.value]))
    );

    for (const [key, result] of Object.entries(derived)) {
      if (!isFeatureKey(key)) throw new Error(`Deriver produced unknown feature key '${key}'`);
      const confidence = Math.min(result.confidence, ceiling);
      if (!dryRun && !calibrateOnly) {
        await sql.query(
          `INSERT INTO location_features (
             location_id, feature_key, schema_version, value, confidence, provenance,
             evidence, method_version, computed_at
           ) VALUES ($1,$2,$3,$4,$5,'derived_structural',$6::jsonb,$7,now())
           ON CONFLICT (location_id, feature_key, provenance) DO UPDATE SET
             schema_version = EXCLUDED.schema_version,
             value = EXCLUDED.value,
             confidence = EXCLUDED.confidence,
             evidence = EXCLUDED.evidence,
             method_version = EXCLUDED.method_version,
             computed_at = now()`,
          [
            fact.id,
            key,
            FEATURE_SCHEMA_VERSION,
            result.value,
            confidence,
            JSON.stringify(result.inputs),
            METHOD_VERSION,
          ]
        );
      }
      written++;
    }
  }

  console.log(
    `${dryRun || calibrateOnly ? "Would write" : "Wrote"} ${written} derived feature(s) across ${
      facts.length - skipped
    } location(s).`
  );

  // Drop derived rows for features that no longer have a deriver. Without this,
  // reclassifying a feature as editorial-only (as lgbtq_social_acceptance was)
  // leaves stale structural values behind that keep winning the resolution view
  // for every city that has no dossier.
  if (!dryRun && !calibrateOnly) {
    const live = Object.keys(DERIVERS);
    const orphaned = (await sql.query(
      `DELETE FROM location_features
       WHERE provenance = 'derived_structural' AND NOT (feature_key = ANY($1))
       RETURNING feature_key`,
      [live]
    )) as { feature_key: string }[];
    if (orphaned.length > 0) {
      const keys = [...new Set(orphaned.map((r) => r.feature_key))].join(", ");
      console.log(`Removed ${orphaned.length} orphaned derived row(s): ${keys}`);
    }
  }
  console.log("");

  // ── calibration ─────────────────────────────────────────────────────────
  // Compare the formulas against every editorial value we have. With only a
  // couple of dossiers this is a sanity check, not a fit; it becomes a real
  // signal once there are enough researched cities to see a pattern.
  const editorial = (await sql.query(
    `SELECT f.location_id, l.name, l.state, f.feature_key, f.value
     FROM location_features f
     JOIN locations_location l ON l.id = f.location_id
     WHERE f.provenance = 'editorial'
     ORDER BY l.state, l.name, f.feature_key`
  )) as { location_id: string; name: string; state: string; feature_key: string; value: string }[];

  if (editorial.length === 0) {
    console.log("No editorial features to calibrate against yet.");
    return;
  }

  console.log("Calibration — structural derivation vs. researched ground truth");
  console.log("city                feature                        derived  editorial  delta");
  const deltas: number[] = [];
  for (const row of editorial) {
    const derivedValue = derivedByCity.get(row.location_id)?.[row.feature_key];
    if (derivedValue === undefined) continue;
    const editorialValue = Number(row.value);
    const delta = derivedValue - editorialValue;
    deltas.push(Math.abs(delta));
    const city = `${row.name}, ${row.state}`.padEnd(19).slice(0, 19);
    const feature = row.feature_key.padEnd(30).slice(0, 30);
    const sign = delta >= 0 ? "+" : "-";
    console.log(
      `${city} ${feature} ${derivedValue.toFixed(2).padStart(7)} ${editorialValue
        .toFixed(2)
        .padStart(10)}  ${sign}${Math.abs(delta).toFixed(2)}`
    );
  }
  if (deltas.length > 0) {
    const mae = deltas.reduce((a, b) => a + b, 0) / deltas.length;
    console.log(
      `\nOverlapping features: ${deltas.length}. Mean absolute error: ${mae.toFixed(3)}.`
    );
    console.log(
      "Features with no derived counterpart are editorial-only by design — see `derivation` in city-profile-stack/lib/ontology.ts."
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
