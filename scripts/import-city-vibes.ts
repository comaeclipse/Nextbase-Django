import { readFileSync } from "node:fs";
import { getSql } from "../lib/db";

const dryRun = process.argv.includes("--dry-run");
const source = JSON.parse(readFileSync("data/city-vibes.json", "utf8")) as { vibes: Record<string, string[]> };
const allowed = new Set([
  "beach_life",
  "desert_life",
  "mountain_living",
  "southern_living",
  "lake_living",
  "great_outdoors",
  "nightlife",
  "quiet_retreat",
]);

async function main() {
  const sql = getSql();
  const rows = await sql.query("SELECT id, name, state FROM locations_location ORDER BY id") as { id: string; name: string; state: string }[];
  const keys = new Set(rows.map((row) => `${row.name}, ${row.state}`));
  for (const [city, vibes] of Object.entries(source.vibes)) {
    if (!keys.has(city)) throw new Error(`Unknown city: ${city}`);
    if (vibes.length === 0 || vibes.some((vibe) => !allowed.has(vibe))) throw new Error(`Invalid vibes for ${city}`);
  }
  const missing = [...keys].filter((city) => !source.vibes[city]);
  if (missing.length) throw new Error(`Missing city vibes: ${missing.join(", ")}`);
  console.log(`City vibe review: ${rows.length}/${rows.length} locations tagged${dryRun ? " (dry run)" : ""}`);
  if (!dryRun) for (const row of rows) await sql.query(
    "UPDATE locations_location SET vibes = $1, updated_at = now() WHERE id = $2",
    [source.vibes[`${row.name}, ${row.state}`], row.id]
  );
  console.log(dryRun ? "Dry run complete." : "Import complete.");
}

main().catch((error) => { console.error(error); process.exit(1); });
