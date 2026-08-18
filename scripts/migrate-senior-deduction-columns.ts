/*
 * Adds a general age-65+ state-income deduction to locations_stateinfo.
 *
 * WHY THIS IS SEPARATE FROM ss_tax_*: those columns describe when a state
 * exempts Social Security BENEFITS specifically. Some states instead (or in
 * addition) give filers 65+ a flat subtraction against taxable income from
 * ANY source — Montana is the case that forced this: since TY2024 it starts
 * from federal taxable income with no SS-specific age gate, so Social
 * Security there is taxed exactly as the IRS taxes it, and the only 65+ break
 * is this general subtraction (see issue #58). Encoding that in ss_tax_* would
 * make the model claim MT exempts Social Security at 65, which is false.
 *
 * COLUMNS
 *   senior_deduction_amount       dollars subtracted from state taxable income,
 *                                 PER QUALIFYING INDIVIDUAL when
 *                                 senior_deduction_per_qualifying_person is true
 *                                 (Montana: each taxpayer who has attained 65).
 *   senior_deduction_min_age      age at which a filer qualifies. The app only
 *                                 asks "are you 65+", so a value other than 65
 *                                 is applied as an approximation, flagged to
 *                                 the reader (same pattern PR #57 used for
 *                                 Rhode Island's ~67 full retirement age).
 *   senior_deduction_per_qualifying_person
 *                                 true = one unit per 65+ filer/spouse; false =
 *                                 a household amount that is not doubled.
 *   senior_deduction_tax_year     tax year the stored amount is for.
 *   senior_deduction_source_status
 *                                 official (published by the revenue department)
 *                                 or calculated (e.g. a statutory CPI formula).
 *                                 Do not store a calculated figure as official.
 *   senior_deduction_source_url   where the amount and age were verified.
 *   senior_deduction_verified_on  when a human last checked them.
 *
 * Usage:
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/migrate-senior-deduction-columns.ts [--dry-run]
 */
import { getSql } from "../lib/db";

const dryRun = process.argv.includes("--dry-run");
const sql = getSql();

const COLUMNS: { name: string; ddl: string; note: string }[] = [
  {
    name: "senior_deduction_amount",
    ddl: "senior_deduction_amount integer",
    note: "dollars subtracted from state taxable income per qualifying 65+ individual",
  },
  {
    name: "senior_deduction_min_age",
    ddl: "senior_deduction_min_age integer",
    note: "age at which a filer qualifies; null = no general senior deduction",
  },
  {
    name: "senior_deduction_per_qualifying_person",
    ddl: "senior_deduction_per_qualifying_person boolean",
    note: "true = one unit per 65+ filer/spouse; false = household amount",
  },
  {
    name: "senior_deduction_tax_year",
    ddl: "senior_deduction_tax_year integer",
    note: "tax year the stored amount is for",
  },
  {
    name: "senior_deduction_source_status",
    ddl: "senior_deduction_source_status character varying(16)",
    note: "official (DOR-published) or calculated (e.g. CPI formula)",
  },
  {
    name: "senior_deduction_source_url",
    ddl: "senior_deduction_source_url text",
    note: "where the amount and age were verified",
  },
  {
    name: "senior_deduction_verified_on",
    ddl: "senior_deduction_verified_on date",
    note: "when a human last checked it",
  },
];

async function main() {
  console.log(`Senior deduction columns migration${dryRun ? " (dry run)" : ""}`);
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
      "Next: fill data/state_senior_deduction.csv, then scripts/import-senior-deduction.ts"
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
