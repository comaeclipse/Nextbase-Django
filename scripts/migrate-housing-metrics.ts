/*
 * Adds the per-city housing-metric columns for issue #170 Phase A.
 *
 *   entry_home_value  — the FORMAL entry-level home value: ACS lower value
 *                       quartile (B25076), the 25th percentile of the
 *                       owner-occupied stock's self-reported value. A
 *                       percentile by construction, so one burned-out
 *                       fixer-upper can never make a city look cheap.
 *   median_rent_2br   — median gross rent, 2-bedroom units (ACS B25031).
 *   median_rent_3br   — median gross rent, 3-bedroom units (ACS B25031).
 *
 * All nullable: partial coverage is expected (bedroom medians suppress in
 * small places) and consumers report missing data rather than guessing —
 * the same contract as median_rent.
 *
 * Usage:
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/migrate-housing-metrics.ts [--dry-run]
 */
import { getSql } from "../lib/db";

const dryRun = process.argv.includes("--dry-run");
const sql = getSql();

const COLUMNS: { name: string; ddl: string; note: string }[] = [
  {
    name: "entry_home_value",
    ddl: "entry_home_value integer",
    note: "dollars; ACS B25076 lower value quartile of owner-occupied stock",
  },
  {
    name: "median_rent_2br",
    ddl: "median_rent_2br integer",
    note: "monthly dollars, gross rent (utilities included), 2-bedroom units",
  },
  {
    name: "median_rent_3br",
    ddl: "median_rent_3br integer",
    note: "monthly dollars, gross rent (utilities included), 3-bedroom units",
  },
];

async function main() {
  console.log(`Housing metrics migration${dryRun ? " (dry run)" : ""}`);
  for (const col of COLUMNS) {
    if (dryRun) {
      console.log(`  = Would ensure ${col.name}  (${col.note})`);
      continue;
    }
    await sql.query(
      `ALTER TABLE locations_location ADD COLUMN IF NOT EXISTS ${col.ddl}`
    );
    console.log(`  + ${col.name}  (${col.note})`);
  }
  console.log(dryRun ? "\nDry run complete." : "\nMigration complete.");
  if (!dryRun) {
    console.log("Next: scripts/import-housing-metrics.ts");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
