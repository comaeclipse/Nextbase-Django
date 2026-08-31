/*
 * Adds VA Facilities API drive-time columns (issue #60), so the affordability
 * engine's `va_primary` health-coverage path can annotate how practical VA
 * primary care is for a city — within the VA 30-minute drive-time access
 * standard, beyond it (where Community Care may apply), or not yet verified.
 *
 * These are DISTINCT from the great-circle mileage fields (nearest_va,
 * distance_to_va, has_va) written by scripts/sync-va-facilities.ts, which keep
 * driving the Fit score and the explore VA facets. Drive minutes never scale a
 * premium and never null a cost — they only add a note. See CLAUDE.md / SCHEMA.md.
 *
 * Populate the values afterwards with scripts/sync-va-drive-times.ts.
 *
 * Usage:
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/migrate-va-drive-times.ts [--dry-run]
 */
import { getSql } from "../lib/db";

const dryRun = process.argv.includes("--dry-run");
const sql = getSql();

const COLUMNS: { name: string; ddl: string }[] = [
  {
    name: "va_primary_care_drive_minutes",
    ddl: "va_primary_care_drive_minutes integer",
  },
  {
    name: "va_medical_center_drive_minutes",
    ddl: "va_medical_center_drive_minutes integer",
  },
  {
    name: "va_primary_care_facility_id",
    ddl: "va_primary_care_facility_id character varying",
  },
  {
    name: "va_medical_center_facility_id",
    ddl: "va_medical_center_facility_id character varying",
  },
  {
    name: "va_access_verified_on",
    ddl: "va_access_verified_on date",
  },
];

async function main() {
  console.log(`VA drive-time fields migration${dryRun ? " (dry run)" : ""}`);
  for (const col of COLUMNS) {
    if (dryRun) {
      console.log(`  = Would ensure ${col.name}`);
      continue;
    }
    await sql.query(
      `ALTER TABLE locations_location ADD COLUMN IF NOT EXISTS ${col.ddl}`
    );
    console.log(`  + ${col.name}`);
  }
  console.log(dryRun ? "\nDry run complete." : "\nMigration complete.");
  console.log("Next: scripts/sync-va-drive-times.ts (needs VA_FACILITIES_API_KEY).");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
