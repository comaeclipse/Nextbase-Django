import { getSql } from "../lib/db";

const dryRun = process.argv.includes("--dry-run");

async function main() {
  console.log(`City vibes migration${dryRun ? " (dry run)" : ""}`);
  if (dryRun) console.log("  = Would ensure locations_location.vibes text[]");
  else {
    await getSql().query(
      "ALTER TABLE locations_location ADD COLUMN IF NOT EXISTS vibes text[] NOT NULL DEFAULT '{}'::text[]"
    );
    console.log("  + vibes");
  }
}

main().catch((error) => { console.error(error); process.exit(1); });
