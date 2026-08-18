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
 *                                 PER QUALIFYING INDIVIDUAL (so a married couple
 *                                 both past the age line claims it twice) —
 *                                 mirrors how the federal age-65 deduction
 *                                 already works in lib/income.ts.
 *   senior_deduction_min_age      age at which a filer qualifies. The app only
 *                                 asks "are you 65+", so a value other than 65
 *                                 is applied as an approximation, flagged to
 *                                 the reader (same pattern PR #57 used for
 *                                 Rhode Island's ~67 full retirement age).
 *   senior_deduction_source_url   where the amount and age were verified.
 *   senior_deduction_verified_on  when a human last checked them. These two
 *                                 exist for the same reason ss_tax_source_url /
 *                                 ss_tax_verified_on do: state amounts are
 *                                 typically inflation-adjusted annually, so an
 *                                 unsourced, undated figure goes stale silently.
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
      "Next: source and import senior_deduction_* per state (e.g. Montana), with URL + verification date."
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
