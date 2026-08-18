/*
 * Adds typed VA hospital fields so outpatient and hospital access can diverge.
 *
 *   nearest_va / distance_to_va     — nearest outpatient-capable VA health site
 *   nearest_va_kind                 — "hospital" | "outpatient" for nearest_va
 *   nearest_va_hospital / distance_to_va_hospital — nearest VA medical center (parent)
 *
 * Usage:
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/migrate-va-hospital-fields.ts [--dry-run]
 */
import { getSql } from "../lib/db";

const dryRun = process.argv.includes("--dry-run");
const sql = getSql();

const COLUMNS: { name: string; ddl: string }[] = [
  { name: "nearest_va_hospital", ddl: "nearest_va_hospital character varying" },
  { name: "distance_to_va_hospital", ddl: "distance_to_va_hospital character varying" },
  {
    name: "nearest_va_kind",
    ddl: "nearest_va_kind character varying",
  },
];

async function main() {
  console.log(`VA hospital fields migration${dryRun ? " (dry run)" : ""}`);
  for (const col of COLUMNS) {
    if (dryRun) {
      console.log(`  = Would ensure ${col.name}`);
      continue;
    }
    await sql.query(`ALTER TABLE locations_location ADD COLUMN IF NOT EXISTS ${col.ddl}`);
    console.log(`  + ${col.name}`);
  }
  console.log(dryRun ? "\nDry run complete." : "\nMigration complete.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
