/*
 * Applies the full curated lake, ocean, and mountain review to every location.
 *
 * Usage:
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/import-geography-proximity.ts [--dry-run]
 */
import { readFileSync } from "node:fs";
import { getSql } from "../lib/db";

type Facets = "near_lake" | "near_ocean" | "near_mountains";
type Source = Record<Facets, string[]> & { methodology: string; source: string };

const dryRun = process.argv.includes("--dry-run");
const source = JSON.parse(readFileSync("data/geography-proximity.json", "utf8")) as Source;
const sql = getSql();

const key = (name: string, state: string) => `${name}, ${state}`;

async function main() {
  const rows = (await sql.query(
    "SELECT id, name, state FROM locations_location ORDER BY id"
  )) as { id: string; name: string; state: string }[];
  const known = new Set(rows.map((row) => key(row.name, row.state)));
  const facets: Facets[] = ["near_lake", "near_ocean", "near_mountains"];

  for (const facet of facets) {
    for (const city of source[facet]) {
      if (!known.has(city)) throw new Error(`${facet} names an unknown location: ${city}`);
    }
  }

  const chosen = Object.fromEntries(
    facets.map((facet) => [facet, new Set(source[facet])])
  ) as Record<Facets, Set<string>>;
  const rated = rows.map((row) => ({
    ...row,
    near_lake: chosen.near_lake.has(key(row.name, row.state)),
    near_ocean: chosen.near_ocean.has(key(row.name, row.state)),
    near_mountains: chosen.near_mountains.has(key(row.name, row.state)),
  }));

  console.log(`Geography proximity review: ${rated.length}/${rows.length} locations rated${dryRun ? " (dry run)" : ""}`);
  console.log(`  Lake: ${rated.filter((r) => r.near_lake).length}`);
  console.log(`  Ocean: ${rated.filter((r) => r.near_ocean).length}`);
  console.log(`  Mountains: ${rated.filter((r) => r.near_mountains).length}`);

  if (!dryRun) {
    for (const row of rated) {
      await sql.query(
        `UPDATE locations_location
         SET near_lake = $1, near_ocean = $2, near_mountains = $3, updated_at = now()
         WHERE id = $4`,
        [row.near_lake, row.near_ocean, row.near_mountains, row.id]
      );
    }
  }
  console.log(dryRun ? "\nDry run complete." : "\nImport complete.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
