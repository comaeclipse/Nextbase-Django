/*
 * Adds explicit retail-access facets used by Explore and city imports.
 *
 * Usage:
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/migrate-retail-access.ts [--dry-run]
 */
import { getSql } from "../lib/db";

const dryRun = process.argv.includes("--dry-run");
const sql = getSql();

async function main() {
  const columns = ["has_walmart", "has_costco"] as const;
  console.log(`Retail access migration${dryRun ? " (dry run)" : ""}`);
  for (const column of columns) {
    if (dryRun) console.log(`  = Would ensure ${column}`);
    else {
      await sql.query(
        `ALTER TABLE locations_location
         ADD COLUMN IF NOT EXISTS ${column} boolean`
      );
      console.log(`  + ${column}`);
    }
  }
  console.log(dryRun ? "\nDry run complete." : "\nMigration complete.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
