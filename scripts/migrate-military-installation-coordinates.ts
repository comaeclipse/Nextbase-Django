/*
 * Adds coordinate-provenance columns to military_installations, separate from
 * the existing source_kind/source_url/source_retrieved_on/notes columns.
 * Those four describe *identity* ingest (branch directory listing); a
 * coordinate backfill comes from a different source at a different time and
 * must not overwrite that provenance when latitude/longitude are filled in.
 *
 * Usage:
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/migrate-military-installation-coordinates.ts [--dry-run]
 */
import { getSql } from "../lib/db";

const dryRun = process.argv.includes("--dry-run");
const sql = getSql();

async function run(label: string, query: string) {
  if (dryRun) {
    console.log(`  = ${label} (skipped)`);
    return;
  }
  await sql.query(query);
  console.log(`  + ${label}`);
}

async function main() {
  console.log(`Military-installation coordinate-column migration${dryRun ? " (dry run)" : ""}\n`);

  await run(
    "add coordinate_source_kind",
    `ALTER TABLE military_installations ADD COLUMN IF NOT EXISTS coordinate_source_kind text`
  );
  await run(
    "add coordinate_source_url",
    `ALTER TABLE military_installations ADD COLUMN IF NOT EXISTS coordinate_source_url text`
  );
  await run(
    "add coordinate_retrieved_on",
    `ALTER TABLE military_installations ADD COLUMN IF NOT EXISTS coordinate_retrieved_on date`
  );
  await run(
    "add coordinate_confidence",
    `ALTER TABLE military_installations ADD COLUMN IF NOT EXISTS coordinate_confidence text`
  );
  await run(
    "add coordinate_notes",
    `ALTER TABLE military_installations ADD COLUMN IF NOT EXISTS coordinate_notes text`
  );

  console.log(`\n${dryRun ? "Dry run" : "Migration"} complete.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
