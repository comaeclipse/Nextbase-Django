/*
 * Adds age-conditional Social Security tax fields to locations_stateinfo.
 *
 * WHY: three states (CO, RI, MT) condition their SS rule on age, which
 * ss_tax_treatment + AGI thresholds cannot express. Colorado 65+ filers were
 * taxed above $75k AGI when they are fully exempt; Rhode Island filers under
 * full retirement age were treated as exempt when they are not.
 *
 *   ss_tax_min_age            age at year-end at or above which the gate opens
 *   ss_tax_age_exempts_fully  if true, reaching min_age exempts SS regardless
 *                             of AGI (Colorado 65+). If false, min_age is an
 *                             additional requirement on top of the threshold
 *                             (Rhode Island FRA).
 *
 * Usage:
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/migrate-ss-tax-age-columns.ts [--dry-run]
 */
import { getSql } from "../lib/db";

const dryRun = process.argv.includes("--dry-run");
const sql = getSql();

const COLUMNS: { name: string; ddl: string; note: string }[] = [
  {
    name: "ss_tax_min_age",
    ddl: "ss_tax_min_age integer",
    note: "age at or above which the SS exemption gate opens; null = no age gate",
  },
  {
    name: "ss_tax_age_exempts_fully",
    ddl: "ss_tax_age_exempts_fully boolean",
    note: "true = reaching min_age exempts SS regardless of AGI",
  },
];

async function main() {
  console.log(
    `Social Security age-gate columns migration${dryRun ? " (dry run)" : ""}`
  );
  for (const col of COLUMNS) {
    if (dryRun) {
      console.log(`  = Would ensure ${col.name}  (${col.note})`);
      continue;
    }
    await sql.query(
      `ALTER TABLE locations_stateinfo ADD COLUMN IF NOT EXISTS ${col.ddl}`
    );
    console.log(`  + ${col.name}  (${col.note})`);
  }
  console.log(dryRun ? "\nDry run complete." : "\nMigration complete.");
  if (!dryRun) {
    console.log("Next: fill MinAge / AgeExemptsFully in data/state_ss_tax.csv, then scripts/import-ss-tax.ts");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
