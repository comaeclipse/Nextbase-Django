/*
 * Port of `python manage.py categorize_climate`
 * (locations/management/commands/categorize_climate.py).
 *
 * Usage:
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/categorize-climate.ts [--dry-run]
 *
 * Applies the same decision tree and writes climate_category (used by the
 * explore climate filter). --dry-run reports without writing.
 */
import { getSql } from "../lib/db";
import type { LocationRow } from "../lib/types";

type Category = "cold_snowy" | "hot_humid" | "hot_dry" | "mild_coastal";

function classify(loc: LocationRow): Category {
  // Rule 1: Cold/Snowy
  if (
    (loc.snow_annual && loc.snow_annual >= 30) ||
    (loc.alw != null &&
      loc.alw <= 25 &&
      loc.snow_annual &&
      loc.snow_annual >= 15)
  ) {
    return "cold_snowy";
  }

  // Rule 2: Hot/Dry
  if (
    (loc.avg_high_summer &&
      loc.avg_high_summer >= 95 &&
      loc.humidity_summer != null &&
      loc.humidity_summer <= 45) ||
    (loc.rain_annual != null &&
      loc.rain_annual <= 15 &&
      loc.avg_high_summer &&
      loc.avg_high_summer >= 88)
  ) {
    return "hot_dry";
  }

  // Rule 3: Hot/Humid
  if (
    (loc.avg_high_summer &&
      loc.avg_high_summer >= 88 &&
      loc.humidity_summer &&
      loc.humidity_summer >= 60) ||
    (loc.alw &&
      loc.alw >= 45 &&
      loc.humidity_summer &&
      loc.humidity_summer >= 65)
  ) {
    return "hot_humid";
  }

  // Rule 4: Mild/Coastal (fallback)
  return "mild_coastal";
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const sql = getSql();
  const locations = (await sql`
    SELECT * FROM locations_location
    ORDER BY featured DESC, name ASC`) as unknown as LocationRow[];
  const counts: Record<Category, number> = {
    cold_snowy: 0,
    hot_humid: 0,
    hot_dry: 0,
    mild_coastal: 0,
  };

  for (const loc of locations) {
    const category = classify(loc);
    if (!dryRun) {
      await sql.query(
        "UPDATE locations_location SET climate_category = $1, updated_at = now() WHERE id = $2",
        [category, loc.id]
      );
    }
    counts[category]++;
    console.log(`${loc.name}, ${loc.state}: ${category}`);
  }

  console.log(
    `\n${dryRun ? "Would categorize" : "Successfully categorized"} ${
      locations.length
    } locations:`
  );
  for (const [cat, n] of Object.entries(counts)) console.log(`  ${cat}: ${n}`);
}

main();
