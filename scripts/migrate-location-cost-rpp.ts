/*
 * Schema for BEA Regional Price Parities joined to curated cities.
 *
 * This is a separate table rather than more columns on locations_location:
 * RPP is metro/nonmetro geography with a vintage, not a city fact, and the
 * affordability engine should be able to refresh it without touching the
 * legacy col_index used by the Fit score.
 *
 * Usage:
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/migrate-location-cost-rpp.ts [--dry-run]
 */
import { getSql } from "../lib/db";

const dryRun = process.argv.includes("--dry-run");
const sql = getSql();

const log = (msg: string) => console.log(`  ${dryRun ? "=" : "+"} ${msg}`);

async function run(label: string, text: string, params: unknown[] = []) {
  if (dryRun) {
    log(`${label} (skipped)`);
    return;
  }
  await sql.query(text, params);
  log(label);
}

async function tableExists(table: string): Promise<boolean> {
  const rows = (await sql.query(`SELECT to_regclass($1) AS t`, [
    `public.${table}`,
  ])) as { t: string | null }[];
  return rows[0]?.t != null;
}

async function main() {
  console.log(`location_cost_rpp migration${dryRun ? " (dry run)" : ""}\n`);

  if (await tableExists("location_cost_rpp")) {
    log("table already exists");
  } else {
    await run(
      "create table",
      `CREATE TABLE location_cost_rpp (
        location_id bigint PRIMARY KEY
          REFERENCES locations_location(id) ON DELETE CASCADE,
        vintage_year integer NOT NULL CHECK (vintage_year BETWEEN 2008 AND 2100),
        bea_geo_type text NOT NULL CHECK (bea_geo_type IN ('msa', 'nonmetro_state')),
        bea_geo_code text NOT NULL,
        bea_geo_name text NOT NULL,
        goods_rpp numeric(8,3) NOT NULL,
        housing_rpp numeric(8,3) NOT NULL,
        utilities_rpp numeric(8,3) NOT NULL,
        other_services_rpp numeric(8,3) NOT NULL,
        source_url text NOT NULL,
        retrieved_on date NOT NULL
      )`
    );
  }

  // BEA LineCode 1 ("RPPs: All items") — added so col_index can eventually be
  // standardized on this single federal source instead of the legacy
  // mixed-provider composite. Idempotent ALTER, not a table recreate: the
  // table already exists in prod.
  await run(
    "add all_items_rpp column",
    `ALTER TABLE location_cost_rpp ADD COLUMN IF NOT EXISTS all_items_rpp numeric(8,3)`
  );

  console.log(dryRun ? "\nDry run complete." : "\nMigration complete.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
