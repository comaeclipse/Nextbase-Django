/*
 * Sync locations_location.col_index / cost_of_living from BEA's "All Items"
 * Regional Price Parity (location_cost_rpp.all_items_rpp), replacing the
 * legacy CSV-sourced CostOfLiving value.
 *
 *   col_index      = ROUND(all_items_rpp)
 *   cost_of_living = deriveCostOfLivingCategory(col_index)   (lib/cost-of-living.ts)
 *
 * Rows with no matching location_cost_rpp.all_items_rpp are logged as an
 * explicit gap and left untouched -- an existing col_index is never nulled
 * out just because RPP hasn't landed for that city yet.
 *
 * `all_items_rpp` ships from the parallel `data/rpp-all-items-index` PR. If
 * that column doesn't exist yet, this script logs that plainly and exits
 * without writing, instead of crashing.
 *
 * Usage:
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/sync-col-index-from-rpp.ts [--dry-run]
 */
import { getSql } from "../lib/db";
import { deriveCostOfLivingCategory } from "../lib/cost-of-living";

const dryRun = process.argv.includes("--dry-run");

interface Row {
  id: number;
  name: string;
  state: string;
  col_index: number | null;
  cost_of_living: string;
  all_items_rpp: number | string | null;
}

/* Postgres `numeric` columns come back as strings from the driver. */
function rppNumber(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

async function main() {
  const sql = getSql();
  console.log(
    `Sync col_index/cost_of_living from BEA all_items_rpp${dryRun ? " (dry run)" : ""}\n`
  );

  let rows: Row[];
  try {
    rows = (await sql.query(
      `SELECT
         l.id,
         l.name,
         l.state,
         l.col_index,
         l.cost_of_living,
         rpp.all_items_rpp
       FROM locations_location l
       LEFT JOIN location_cost_rpp rpp ON rpp.location_id = l.id
       ORDER BY l.name, l.state`
    )) as Row[];
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (/all_items_rpp/.test(message) && /column/i.test(message)) {
      console.error(
        "location_cost_rpp.all_items_rpp does not exist yet. That column ships in the " +
          "parallel data/rpp-all-items-index PR (import-bea-rpp.ts / migrate-location-cost-rpp.ts). " +
          "Nothing to sync -- rerun after that PR's migration has landed on master and run in prod."
      );
      return;
    }
    throw err;
  }

  let updated = 0;
  let unchanged = 0;
  const gaps: Row[] = [];

  for (const row of rows) {
    const rpp = rppNumber(row.all_items_rpp);
    if (rpp === null) {
      gaps.push(row);
      continue;
    }

    const newColIndex = Math.round(rpp);
    const newCostOfLiving = deriveCostOfLivingCategory(newColIndex);

    if (row.col_index === newColIndex && row.cost_of_living === newCostOfLiving) {
      unchanged++;
      continue;
    }

    console.log(
      `  ${dryRun ? "=" : "~"} ${row.name}, ${row.state}: ` +
        `col_index ${row.col_index ?? "null"} -> ${newColIndex}, ` +
        `cost_of_living "${row.cost_of_living}" -> "${newCostOfLiving}"`
    );

    if (!dryRun) {
      await sql.query(
        `UPDATE locations_location SET col_index = $2, cost_of_living = $3 WHERE id = $1`,
        [row.id, newColIndex, newCostOfLiving]
      );
    }
    updated++;
  }

  if (gaps.length) {
    console.log(
      `\n${gaps.length} location(s) with no location_cost_rpp.all_items_rpp (left untouched):`
    );
    for (const g of gaps) console.log(`  ! ${g.name}, ${g.state}`);
  }

  console.log(
    `\n${dryRun ? "Would update" : "Updated"} ${updated} row(s); ${unchanged} already in sync; ${gaps.length} gap(s).`
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
