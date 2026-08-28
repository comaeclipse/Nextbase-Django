/**
 * Apply humidity_summer backfill for the 15 NULL cities on issue #55.
 *
 * Values + method: data/sources/weather/humidity_summer_backfill_2026-08-25.{md,json}
 *
 * Usage:
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/apply-humidity-summer-backfill.ts --dry-run
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/apply-humidity-summer-backfill.ts
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { getSql } from "../lib/db";

interface PatchRow {
  id: number;
  name: string;
  state: string;
  humidity_summer: number;
  climate_before: string | null;
  climate_after: string;
  climate_changed: boolean;
}

function loadPatches(): PatchRow[] {
  const path = join(
    process.cwd(),
    "data/sources/weather/humidity_summer_backfill_2026-08-25.json"
  );
  return JSON.parse(readFileSync(path, "utf8")) as PatchRow[];
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const sql = getSql();
  const patches = loadPatches();

  console.log(
    `${dryRun ? "DRY RUN — would update" : "Updating"} ${patches.length} humidity_summer rows\n`
  );

  for (const p of patches) {
    const rows = (await sql`
      SELECT id, name, state, humidity_summer, climate_category
      FROM locations_location
      WHERE id = ${p.id}
    `) as Array<{
      id: number;
      name: string;
      state: string;
      humidity_summer: number | null;
      climate_category: string | null;
    }>;

    if (rows.length !== 1) {
      throw new Error(`Expected 1 row for id=${p.id} (${p.name}), found ${rows.length}`);
    }
    const before = rows[0];
    if (before.name !== p.name || before.state !== p.state) {
      throw new Error(
        `Identity mismatch id=${p.id}: DB ${before.name}, ${before.state} vs patch ${p.name}, ${p.state}`
      );
    }
    if (before.humidity_summer != null) {
      console.log(
        `skip ${p.name}, ${p.state}: humidity_summer already ${before.humidity_summer}`
      );
      continue;
    }

    console.log(
      `${p.name}, ${p.state}: humidity_summer null → ${p.humidity_summer}` +
        (p.climate_changed
          ? `; climate_category ${before.climate_category} → ${p.climate_after}`
          : "")
    );

    if (dryRun) continue;

    if (p.climate_changed) {
      await sql`
        UPDATE locations_location SET
          humidity_summer = ${p.humidity_summer},
          climate_category = ${p.climate_after},
          updated_at = now()
        WHERE id = ${p.id} AND humidity_summer IS NULL
      `;
    } else {
      await sql`
        UPDATE locations_location SET
          humidity_summer = ${p.humidity_summer},
          updated_at = now()
        WHERE id = ${p.id} AND humidity_summer IS NULL
      `;
    }
  }

  if (dryRun) {
    console.log("\nNo write performed.");
    return;
  }

  const remaining = await sql`
    SELECT COUNT(*)::int AS n
    FROM locations_location
    WHERE humidity_summer IS NULL
  `;
  console.log(`\nDone. Remaining humidity_summer NULLs: ${remaining[0].n}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
