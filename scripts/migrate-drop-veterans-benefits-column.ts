/*
 * Drops the legacy per-city locations_location.veterans_benefits column.
 *
 * WHY: veteran benefits are a state-level fact. The per-city column drifted
 * (two California cities carried different California text — issue #6), and the
 * app no longer reads it: lib/locations.ts derives the summary solely from the
 * verified locations_stateinfo.vet_benefits_summary, and the city page renders
 * that. This migration removes the redundant column so it can never drift again.
 *
 * ORDER OF OPERATIONS (AGENTS.md: never run a prod DB write from a feature
 * branch before the app stops depending on the thing):
 *   1. The app-code PR (#80) that repoints reads off this column must be MERGED
 *      to master and deployed FIRST.
 *   2. Then run this from master.
 * Running it earlier would blank the veteran-benefit copy on production while
 * the deployed build still selects the column.
 *
 * GUARDRAIL: refuses to drop while any state that has locations lacks a verified
 * replacement (vet_benefits_summary + vet_benefits_verified_on). Otherwise those
 * cities would silently lose their only benefit text.
 *
 * AUDIT TRAIL: before dropping, writes the column's current contents to
 * data/legacy_veterans_benefits_backup.json (AGENTS.md: data/ is an audit
 * trail; an irreversible drop should leave the prior values recoverable).
 *
 * Idempotent: if the column is already gone, it reports and exits 0.
 *
 * Usage:
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/migrate-drop-veterans-benefits-column.ts [--dry-run]
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { getSql } from "../lib/db";

const dryRun = process.argv.includes("--dry-run");
const sql = getSql();

const BACKUP_PATH = join(
  process.cwd(),
  "data",
  "legacy_veterans_benefits_backup.json"
);

async function columnExists(): Promise<boolean> {
  const rows = (await sql.query(
    `SELECT 1
       FROM information_schema.columns
      WHERE table_name = 'locations_location'
        AND column_name = 'veterans_benefits'`
  )) as unknown[];
  return rows.length > 0;
}

/** States with locations but no verified locations_stateinfo replacement. */
async function unverifiedStates(): Promise<string[]> {
  const rows = (await sql.query(
    `SELECT DISTINCT l.state
       FROM locations_location l
       LEFT JOIN locations_stateinfo s ON s.state = l.state
      WHERE s.vet_benefits_summary IS NULL
         OR s.vet_benefits_verified_on IS NULL
      ORDER BY l.state`
  )) as { state: string }[];
  return rows.map((r) => r.state);
}

async function backupColumn(): Promise<number> {
  const rows = (await sql.query(
    `SELECT id, state, name, veterans_benefits
       FROM locations_location
      WHERE veterans_benefits IS NOT NULL
      ORDER BY id`
  )) as { id: number; state: string; name: string; veterans_benefits: string }[];
  if (!dryRun) {
    writeFileSync(
      BACKUP_PATH,
      JSON.stringify(
        {
          note: "One-time backup of locations_location.veterans_benefits before it was dropped (issue #6). State-level summaries live in locations_stateinfo.vet_benefits_summary.",
          column: "locations_location.veterans_benefits",
          row_count: rows.length,
          rows,
        },
        null,
        2
      ) + "\n",
      "utf8"
    );
  }
  return rows.length;
}

async function main() {
  console.log(
    `Drop locations_location.veterans_benefits${dryRun ? " (dry run)" : ""}`
  );

  if (!(await columnExists())) {
    console.log("  = Column already absent; nothing to do.");
    return;
  }

  const unverified = await unverifiedStates();
  if (unverified.length > 0) {
    console.error(
      `  ! REFUSING to drop: ${unverified.length} state(s) with locations lack a verified ` +
        `vet_benefits_summary in locations_stateinfo:`
    );
    for (const state of unverified) console.error(`      - ${state}`);
    console.error(
      "  Verify those rows (source URL + vet_benefits_verified_on) before dropping."
    );
    process.exitCode = 1;
    return;
  }
  console.log("  ✓ Every state with locations has a verified state-level summary.");

  const backedUp = await backupColumn();
  console.log(
    dryRun
      ? `  = Would back up ${backedUp} non-null value(s) to ${BACKUP_PATH}`
      : `  + Backed up ${backedUp} non-null value(s) to ${BACKUP_PATH}`
  );

  if (dryRun) {
    console.log(
      "  = Would run: ALTER TABLE locations_location DROP COLUMN IF EXISTS veterans_benefits"
    );
    console.log("\nDry run complete. No changes made.");
    return;
  }

  await sql.query(
    `ALTER TABLE locations_location DROP COLUMN IF EXISTS veterans_benefits`
  );
  console.log("  + Dropped column locations_location.veterans_benefits");
  console.log(
    "\nMigration complete. veteran-benefit copy is now sourced only from " +
      "verified locations_stateinfo.vet_benefits_summary."
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
