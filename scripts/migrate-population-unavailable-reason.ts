/** Optional reason for an unmeasurable non-candidate community population. */
import { getSql } from "../lib/db";

async function main() {
  if (process.argv.includes("--dry-run")) {
    console.log("Would add nullable locations_location.population_unavailable_reason; no rows changed.");
    return;
  }
  await getSql().query("ALTER TABLE locations_location ADD COLUMN IF NOT EXISTS population_unavailable_reason text");
  console.log("Population-unavailable reason column ready.");
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
