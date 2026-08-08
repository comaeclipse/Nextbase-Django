/*
 * Finalizes the state-level veteran-benefits migration tracked by issue #6.
 *
 * Usage:
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/migrate-veteran-benefits.ts
 *
 * Run scripts/import-state-benefits.ts first so locations_stateinfo has the
 * verified source metadata before the legacy city-level copy is removed.
 */
import { getSql } from "../lib/db";

async function main() {
  const sql = getSql();

  await sql.query(
    "ALTER TABLE locations_stateinfo ADD COLUMN IF NOT EXISTS source_url text",
    []
  );

  const unverified = (await sql.query(
    `SELECT state
       FROM locations_stateinfo
      WHERE vet_benefits_verified_on IS NULL
         OR source_url IS NULL
         OR retired_pay_tax IS NULL
         OR retired_pay_tax = 'unknown'
      ORDER BY state`,
    []
  )) as { state: string }[];

  if (unverified.length) {
    throw new Error(
      `Refusing to drop locations_location.veterans_benefits: ${unverified.length} state row(s) are not fully verified (${unverified.map((r) => r.state).join(", ")}). Run import-state-benefits.ts first.`
    );
  }

  await sql.query(
    "ALTER TABLE locations_location DROP COLUMN IF EXISTS veterans_benefits",
    []
  );

  console.log("Veteran-benefit schema migration complete: verified state rows present; legacy city column removed.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
