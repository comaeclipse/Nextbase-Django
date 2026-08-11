/*
 * Adds normalized state-owned fields to locations_stateinfo.
 *
 * These columns are the destination for GitHub issue #5's sourced
 * adjudication. The migration intentionally does not backfill from
 * locations_location because those rows currently contain conflicting vintages
 * and ambiguous semantics.
 *
 * Usage:
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/migrate-state-owned-fields.ts [--dry-run]
 */
import { getSql } from "../lib/db";

const dryRun = process.argv.includes("--dry-run");
const sql = getSql();

const COLUMNS: { name: string; ddl: string; note: string }[] = [
  {
    name: "state_party",
    ddl: "state_party character varying(8)",
    note: "legacy compact governor-party shorthand; full government configuration stays in lib/state-politics-data.ts",
  },
  { name: "state_party_source_url", ddl: "state_party_source_url text", note: "source for state_party" },
  { name: "state_party_verified_on", ddl: "state_party_verified_on date", note: "verification date for state_party" },
  { name: "governor", ddl: "governor character varying(8)", note: "current governor party" },
  { name: "governor_source_url", ddl: "governor_source_url text", note: "source for governor" },
  { name: "governor_verified_on", ddl: "governor_verified_on date", note: "verification date for governor" },
  { name: "income_tax", ddl: "income_tax numeric", note: "state individual income-tax rate under income_tax_semantics" },
  {
    name: "income_tax_semantics",
    ddl: "income_tax_semantics character varying(64)",
    note: "for example top_marginal_individual_income_tax",
  },
  { name: "income_tax_source_url", ddl: "income_tax_source_url text", note: "source for income_tax" },
  { name: "income_tax_verified_on", ddl: "income_tax_verified_on date", note: "verification date for income_tax" },
  { name: "marijuana_status", ddl: "marijuana_status character varying(64)", note: "state cannabis legal status" },
  { name: "marijuana_status_source_url", ddl: "marijuana_status_source_url text", note: "source for marijuana_status" },
  {
    name: "marijuana_status_verified_on",
    ddl: "marijuana_status_verified_on date",
    note: "verification date for marijuana_status",
  },
  {
    name: "lgbtq_state_policy_score",
    ddl: "lgbtq_state_policy_score numeric",
    note: "state policy score, distinct from municipal MEI",
  },
  {
    name: "lgbtq_state_policy_source_url",
    ddl: "lgbtq_state_policy_source_url text",
    note: "source for lgbtq_state_policy_score",
  },
  {
    name: "lgbtq_state_policy_verified_on",
    ddl: "lgbtq_state_policy_verified_on date",
    note: "verification date for lgbtq_state_policy_score",
  },
];

async function main() {
  console.log(`state-owned locations_stateinfo migration${dryRun ? " (dry run)" : ""}`);

  for (const col of COLUMNS) {
    if (dryRun) {
      console.log(`  = Would ensure ${col.name} (${col.note})`);
      continue;
    }
    await sql.query(`ALTER TABLE locations_stateinfo ADD COLUMN IF NOT EXISTS ${col.ddl}`, []);
    console.log(`  + ${col.name} (${col.note})`);
  }

  console.log(dryRun ? "\nDry run complete." : "\nMigration complete.");
  if (!dryRun) console.log("Next: adjudicate conflicts from sources before importing values.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
