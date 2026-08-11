/*
 * Adds state-level Social Security tax treatment to locations_stateinfo.
 *
 * WHY: lib/income.ts reports "state treatment of Social Security" as MISSING
 * for every state, because there is no column for it. Social Security is a
 * primary income source for much of this audience, so that gap propagates into
 * every take-home estimate involving benefits.
 *
 * WHY THRESHOLDS AND NOT JUST AN ENUM: most states that tax benefits exempt
 * them below an income threshold. A flat "partial" tells you a state sometimes
 * taxes benefits but not whether THIS household is over the line — and for a
 * fixed-income retiree the answer is usually "no". Capturing the threshold
 * turns a guess into a calculation.
 *
 *   ss_tax_treatment          not_taxed | partial | taxed | unknown
 *   ss_tax_threshold_single   AGI at or below which benefits are exempt, single
 *   ss_tax_threshold_married  same, married filing jointly
 *   ss_tax_source_url         where the classification came from
 *   ss_tax_verified_on        when a human last checked it against that source
 *
 * The last two are not bookkeeping. locations_stateinfo already has
 * vet_benefits_verified_on and it is NULL for all 50 states — that data now
 * drives real take-home numbers and has never been checked. These columns exist
 * so the same thing does not happen twice, and the importer refuses rows
 * without them.
 *
 * Usage:
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/migrate-ss-tax-columns.ts [--dry-run]
 */
import { getSql } from "../lib/db";

const dryRun = process.argv.includes("--dry-run");
const sql = getSql();

const COLUMNS: { name: string; ddl: string; note: string }[] = [
  {
    name: "ss_tax_treatment",
    ddl: "ss_tax_treatment character varying(16)",
    note: "not_taxed | partial | taxed | unknown",
  },
  {
    name: "ss_tax_threshold_single",
    ddl: "ss_tax_threshold_single integer",
    note: "AGI at or below which benefits are exempt (single); null = no threshold",
  },
  {
    name: "ss_tax_threshold_married",
    ddl: "ss_tax_threshold_married integer",
    note: "same for married filing jointly",
  },
  {
    name: "ss_tax_source_url",
    ddl: "ss_tax_source_url text",
    note: "where the classification came from",
  },
  {
    name: "ss_tax_verified_on",
    ddl: "ss_tax_verified_on date",
    note: "when a human last checked it",
  },
];

async function main() {
  console.log(`Social Security tax columns migration${dryRun ? " (dry run)" : ""}`);
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
    console.log("Next: fill data/state_ss_tax.csv, then scripts/import-ss-tax.ts");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
