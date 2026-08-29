/**
 * Apply locations_location.lgbtq_state_policy_score backfill (issue #55).
 *
 * Values + method:
 *   data/sources/lgbtq/location_lgbtq_state_policy_backfill_2026-08-25.{md,json}
 *
 * Usage:
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/apply-lgbtq-state-policy-backfill.ts --dry-run
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/apply-lgbtq-state-policy-backfill.ts
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { getSql } from "../lib/db";

interface PatchRow {
  id: number;
  name: string;
  state: string;
  lgbtq_state_policy_score: number;
  method: string;
  source_url: string;
}

interface PatchFile {
  retrieved_on: string;
  patches: PatchRow[];
}

function load(): PatchFile {
  const path = join(
    process.cwd(),
    "data/sources/lgbtq/location_lgbtq_state_policy_backfill_2026-08-25.json"
  );
  return JSON.parse(readFileSync(path, "utf8")) as PatchFile;
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const sql = getSql();
  const { patches, retrieved_on } = load();

  console.log(
    `${dryRun ? "DRY RUN — would update" : "Updating"} ${patches.length} lgbtq_state_policy_score rows (MAP vintage ${retrieved_on})\n`
  );

  let updated = 0;
  let skipped = 0;

  for (const p of patches) {
    const rows = (await sql`
      SELECT id, name, state, lgbtq_state_policy_score
      FROM locations_location
      WHERE id = ${p.id}
    `) as Array<{
      id: number;
      name: string;
      state: string;
      lgbtq_state_policy_score: string | null;
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
    if (before.lgbtq_state_policy_score != null) {
      console.log(
        `skip ${p.name}, ${p.state}: already ${before.lgbtq_state_policy_score}`
      );
      skipped += 1;
      continue;
    }

    console.log(
      `${p.name}, ${p.state}: null → ${p.lgbtq_state_policy_score} (${p.method})`
    );

    if (!dryRun) {
      await sql`
        UPDATE locations_location SET
          lgbtq_state_policy_score = ${p.lgbtq_state_policy_score},
          updated_at = now()
        WHERE id = ${p.id} AND lgbtq_state_policy_score IS NULL
      `;
    }
    updated += 1;
  }

  console.log(`\n${dryRun ? "Would update" : "Updated"}: ${updated}; skipped: ${skipped}`);
  if (dryRun) {
    console.log("No write performed.");
    return;
  }

  const remaining = await sql`
    SELECT COUNT(*)::int AS n
    FROM locations_location
    WHERE lgbtq_state_policy_score IS NULL
  `;
  console.log(`Remaining lgbtq_state_policy_score NULLs: ${remaining[0].n}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
