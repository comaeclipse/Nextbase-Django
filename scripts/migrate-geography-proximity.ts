/*
 * Adds the three curated proximity facets used by Explore.
 *
 * Usage:
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/migrate-geography-proximity.ts [--dry-run]
 */
import { getSql } from "../lib/db";

const dryRun = process.argv.includes("--dry-run");
const sql = getSql();

async function main() {
  const columns = ["near_lake", "near_ocean", "near_mountains"] as const;
  console.log(`Geography proximity migration${dryRun ? " (dry run)" : ""}`);
  for (const column of columns) {
    if (dryRun) console.log(`  = Would ensure ${column}`);
    else {
      await sql.query(
        `ALTER TABLE locations_location
         ADD COLUMN IF NOT EXISTS ${column} boolean NOT NULL DEFAULT false`
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
