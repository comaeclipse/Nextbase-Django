/*
 * Creates the military-installation data layer used by future "near a base"
 * matching. This is deliberately separate from defense_employer_locations:
 * installations are public facilities, not employers or job postings.
 *
 * Usage:
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/migrate-military-installations.ts [--dry-run]
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
  console.log(`Military-installation migration${dryRun ? " (dry run)" : ""}\n`);

  await run(
    "create military_installations",
    `CREATE TABLE IF NOT EXISTS military_installations (
      id bigserial PRIMARY KEY,
      service_branch text NOT NULL,
      command_name text NOT NULL,
      installation_type text NOT NULL DEFAULT 'installation_command',
      operational_status text NOT NULL DEFAULT 'active',
      country text NOT NULL DEFAULT 'US',
      city text NOT NULL,
      state text NOT NULL,
      latitude numeric,
      longitude numeric,
      source_kind text NOT NULL,
      source_url text,
      source_retrieved_on date,
      notes text,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT military_installations_command_place_key
        UNIQUE (service_branch, command_name, country, city, state)
    )`
  );
  await run(
    "index active installations by state",
    `CREATE INDEX IF NOT EXISTS military_installations_active_state_idx
       ON military_installations (operational_status, state)`
  );
  await run(
    "index coordinate-ready installations",
    `CREATE INDEX IF NOT EXISTS military_installations_coordinates_idx
       ON military_installations (latitude, longitude)
       WHERE latitude IS NOT NULL AND longitude IS NOT NULL`
  );

  console.log(`\n${dryRun ? "Dry run" : "Migration"} complete.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

