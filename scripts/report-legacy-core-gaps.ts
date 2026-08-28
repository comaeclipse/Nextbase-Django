/**
 * Reproducible issue #20 inventory for legacy core-field gaps.
 *
 * This is read-only. It lists candidate city rows that still cannot satisfy
 * the new-city completion bar because one or more required legacy core fields
 * are unresolved.
 *
 * Usage:
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/report-legacy-core-gaps.ts
 */
import { getSql } from "../lib/db";
import {
  LEGACY_CORE_GAP_REQUIREMENTS,
  missingLegacyCoreFields,
} from "../lib/location-completeness";

type InventoryRow = {
  id: number;
  name: string;
  state: string;
  tci: number | null;
  crime: string | null;
  gas_price: string | null;
  defense_hub_manual: boolean | null;
};

async function main() {
  const rows = (await getSql().query(
    `SELECT id, name, state, tci, crime, gas_price, defense_hub_manual
     FROM locations_location
     WHERE geo_type = 'city'
       AND is_candidate IS DISTINCT FROM false
     ORDER BY state, name`,
    []
  )) as InventoryRow[];

  const counts: Map<string, number> = new Map(
    LEGACY_CORE_GAP_REQUIREMENTS.map((requirement) => [requirement.field, 0])
  );
  const queue = rows
    .map((row) => ({ row, missing: missingLegacyCoreFields(row) }))
    .filter(({ missing }) => missing.length > 0);

  for (const { missing } of queue) {
    for (const requirement of missing) {
      counts.set(requirement.field, (counts.get(requirement.field) ?? 0) + 1);
    }
  }

  console.log("Legacy core-field gap inventory (issue #20)");
  console.log(`Scope: ${rows.length} ranked city candidate row(s). Non-candidate geography rows are excluded.`);
  console.log(`Rows missing at least one tracked core field: ${queue.length}`);
  console.log("");
  console.log("Field counts:");
  for (const requirement of LEGACY_CORE_GAP_REQUIREMENTS) {
    console.log(`  - ${requirement.field} (${requirement.label}): ${counts.get(requirement.field) ?? 0}`);
  }

  if (queue.length === 0) {
    console.log("");
    console.log("Backfill queue: empty.");
    return;
  }

  console.log("");
  console.log("Backfill queue:");
  for (const { row, missing } of queue) {
    console.log(`  - ${row.name}, ${row.state} (#${row.id}): ${missing.map((requirement) => requirement.field).join(", ")}`);
    for (const requirement of missing) {
      console.log(`      ${requirement.field}: ${requirement.nextAction}`);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
