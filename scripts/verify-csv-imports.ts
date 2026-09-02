/**
 * Proves that every curated location CSV in data/ reached Neon.
 *
 * A merged data PR is not a live city: the database write is a separate,
 * operator-run Apply phase (AGENTS.md), and skipping it has silently lost
 * cities more than once (issue #302 records the latest three). Run this at
 * the END of every Apply phase, and any time you are about to report a city
 * as shipped. Non-zero exit = the repo and the database disagree; every line
 * names the CSV and the command that repairs it.
 *
 * Usage:
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/verify-csv-imports.ts [--json]
 *
 * Read-only. No flag ever writes.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { getSql } from "../lib/db";
import {
  auditCsvImports,
  expectedLocationsFromCsv,
  formatCsvImportAudit,
  mergeExpected,
  type ExpectedLocation,
  type ImportedLocation,
} from "../lib/csv-import-audit";

const DATA_DIR = "data";

async function main() {
  const json = process.argv.includes("--json");
  const files = readdirSync(DATA_DIR)
    .filter((f) => f.toLowerCase().endsWith(".csv"))
    .sort()
    .map((f) => join(DATA_DIR, f).replace(/\\/g, "/"));

  const unparseable: { file: string; error: string }[] = [];
  const perFile: ExpectedLocation[][] = [];
  for (const file of files) {
    try {
      perFile.push(expectedLocationsFromCsv(file, readFileSync(file, "utf8")));
    } catch (err) {
      unparseable.push({ file, error: err instanceof Error ? err.message : String(err) });
    }
  }
  const expected = mergeExpected(perFile);
  const slugs = [...expected.keys()];

  const sql = getSql();
  const rows = (await sql.query(
    `SELECT slug, is_candidate, geo_type
       FROM locations_location
      WHERE slug = ANY($1::text[])`,
    [slugs]
  )) as ImportedLocation[];

  const audit = auditCsvImports(expected, rows);
  const summary = {
    csvFiles: files.length,
    expectedLocations: expected.size,
    matched: audit.matched,
    missing: audit.missing.length,
    notPromoted: audit.notPromoted.length,
    unparseable: unparseable.length,
  };

  if (json) {
    console.log(JSON.stringify({ summary, ...audit, unparseable }, null, 2));
  } else {
    console.log(
      `Checked ${summary.expectedLocations} location(s) from ${summary.csvFiles} CSV file(s): ` +
        `${summary.matched} matched, ${summary.missing} missing, ` +
        `${summary.notPromoted} not promoted, ${summary.unparseable} unparseable.`
    );
    for (const line of formatCsvImportAudit(audit)) console.log(`  ${line}`);
    for (const u of unparseable) console.log(`  UNPARSEABLE  ${u.file} -- ${u.error}`);
  }

  if (audit.missing.length || audit.notPromoted.length || unparseable.length) {
    console.error(
      "\nThe repo and the database disagree. Run the Apply phase from master " +
        "(ALL_DATA_RETRIEVAL_INSTRUCTIONS.md, Phase 2) for the rows above, then re-run this check."
    );
    process.exit(1);
  }
  console.log("Every curated CSV location is present in locations_location.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
