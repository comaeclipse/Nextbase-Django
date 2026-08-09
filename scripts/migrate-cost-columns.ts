/*
 * Adds the two per-city cost columns the fixed-income model needs.
 *
 *   median_rent        — monthly median gross rent, dollars. Unblocks the
 *                        "rent" tenure, which today cannot price a single city.
 *   property_tax_rate  — effective annual property tax as a FRACTION of home
 *                        value (0.0125 = 1.25%), not a percent. Ownership
 *                        tenures currently fall back to a national average and
 *                        flag themselves as approximated.
 *
 * Both are nullable: partial coverage is expected and the model reports per-city
 * `missing` / `approximations` rather than guessing.
 *
 * Usage:
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/migrate-cost-columns.ts [--dry-run]
 */
import { getSql } from "../lib/db";

const dryRun = process.argv.includes("--dry-run");
const sql = getSql();

const COLUMNS: { name: string; ddl: string; note: string }[] = [
  {
    name: "median_rent",
    ddl: "median_rent integer",
    note: "monthly dollars",
  },
  {
    name: "property_tax_rate",
    ddl: "property_tax_rate numeric(6,5)",
    note: "fraction of home value per year, e.g. 0.01250",
  },
];

async function main() {
  console.log(`Cost columns migration${dryRun ? " (dry run)" : ""}`);
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
    console.log(
      "Next: scripts/import-property-tax.ts and scripts/import-median-rent.ts"
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
