/*
 * Adds source/exclusion columns for the retired_pay_tax verification pass to
 * locations_stateinfo.
 *
 * WHY: retired_pay_tax has been populated for all 50 states since import, but
 * vet_benefits_verified_on was NULL for every one of them — nothing had been
 * checked against a primary source, and there was no per-row citation at all.
 * lib/income.ts reads retired_pay_tax to decide whether a state taxes military
 * retired pay, and that decision moves real money (see issue #42). This
 * mirrors the ss_tax_source_url / ss_tax_verified_on pattern added for Social
 * Security (scripts/migrate-ss-tax-columns.ts).
 *
 * WHY EXCLUSION COLUMNS, NOT JUST A CORRECTED ENUM: `partial` and `conditional`
 * are currently treated as fully taxable by lib/income.ts because the enum
 * alone cannot say how much is excluded or what the condition is. These
 * columns let a future pass compute instead of assume:
 *
 *   vet_benefits_source_url     where the retired_pay_tax classification came from
 *   retired_pay_exclusion_amount capped dollar amount excluded, when the state's
 *                                rule reduces to a single flat figure
 *   retired_pay_exclusion_pct    percentage-based exclusion (e.g. a state
 *                                excluding 50% of retired pay)
 *   retired_pay_condition        free text describing an age/income/service
 *                                gate or a multi-tier structure that cannot be
 *                                reduced to one number
 *
 * (vet_benefits_verified_on already exists on this table and is backfilled by
 * scripts/import-retired-pay-tax.ts, not created here.)
 *
 * Usage:
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/migrate-vet-benefits-tax-columns.ts [--dry-run]
 */
import { getSql } from "../lib/db";

const dryRun = process.argv.includes("--dry-run");
const sql = getSql();

const COLUMNS: { name: string; ddl: string; note: string }[] = [
  {
    name: "vet_benefits_source_url",
    ddl: "vet_benefits_source_url text",
    note: "where the retired_pay_tax classification came from",
  },
  {
    name: "retired_pay_exclusion_amount",
    ddl: "retired_pay_exclusion_amount numeric",
    note: "flat/capped dollar amount excluded per year; null when no single figure applies",
  },
  {
    name: "retired_pay_exclusion_pct",
    ddl: "retired_pay_exclusion_pct numeric",
    note: "percentage of retired pay excluded; null when not percentage-based",
  },
  {
    name: "retired_pay_condition",
    ddl: "retired_pay_condition text",
    note: "the age/income/service gate or multi-tier structure a scalar can't carry",
  },
];

async function main() {
  console.log(`Vet benefits tax columns migration${dryRun ? " (dry run)" : ""}`);
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
    console.log(
      "Next: fill data/state_retired_pay_tax.csv, then scripts/import-retired-pay-tax.ts"
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
