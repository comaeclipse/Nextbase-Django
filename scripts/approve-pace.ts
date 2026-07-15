/*
 * Record one reviewed pace decision without rerunning the classifier.
 *
 * Usage:
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/approve-pace.ts \
 *     --name "Camden, AR" --category small_town --reason "..." [--dry-run]
 */
import { getSql } from "../lib/db";
import type { PaceCategory } from "../lib/pace";

const CATEGORIES: PaceCategory[] = ["urban", "suburban", "small_town", "rural"];

function argument(flag: string): string | null {
  const index = process.argv.indexOf(flag);
  return index >= 0 ? process.argv[index + 1] ?? null : null;
}

async function main() {
  const nameArg = argument("--name");
  const categoryArg = argument("--category");
  const reason = argument("--reason");
  const dryRun = process.argv.includes("--dry-run");

  if (!nameArg || !categoryArg || !reason) {
    throw new Error("Usage: approve-pace --name \"City, ST\" --category <pace> --reason \"...\" [--dry-run]");
  }
  if (!CATEGORIES.includes(categoryArg as PaceCategory)) {
    throw new Error(`Invalid pace category: ${categoryArg}`);
  }
  const match = nameArg.match(/^(.+),\s*([A-Za-z]{2})$/);
  if (!match) throw new Error(`--name must look like \"City, ST\" (got ${nameArg})`);

  const [name, state] = [match[1].trim(), match[2].toUpperCase()];
  const category = categoryArg as PaceCategory;
  const sql = getSql();
  const locations = (await sql.query(
    `SELECT id, name, state FROM locations_location
     WHERE lower(name) = lower($1) AND upper(state) = $2`,
    [name, state]
  )) as { id: number; name: string; state: string }[];
  if (locations.length !== 1) {
    throw new Error(`Expected one location for ${name}, ${state}; found ${locations.length}`);
  }
  const location = locations[0];
  const history = (await sql.query(
    `SELECT scope, cbsa_geoid, place_geoid, tract_geoids, census_vintage,
            input_values, source_versions, source_checksums, score,
            candidate_category, confidence, algorithm_version
     FROM location_pace_classifications
     WHERE location_id = $1
     ORDER BY created_at DESC, id DESC
     LIMIT 1`,
    [location.id]
  )) as Record<string, unknown>[];
  const previous = history[0];
  if (!previous) throw new Error(`${location.name}, ${location.state} has no classifier record to review`);

  console.log(
    `${dryRun ? "Would approve" : "Approving"} ${location.name}, ${location.state}: ` +
      `${String(previous.candidate_category ?? "no candidate")} -> ${category}\n  ${reason}`
  );
  if (dryRun) return;

  await sql.query(
    `INSERT INTO location_pace_classifications (
       location_id, scope, cbsa_geoid, place_geoid, tract_geoids,
       census_vintage, input_values, source_versions, source_checksums,
       score, candidate_category, confidence, review_state,
       override_category, override_reason, reviewed_at, algorithm_version
     ) VALUES (
       $1, $2, $3, $4, $5::jsonb,
       $6, $7::jsonb, $8::jsonb, $9::jsonb,
       $10, $11, $12, 'approved',
       $13, $14, now(), $15
     )`,
    [
      location.id,
      previous.scope ?? "place",
      previous.cbsa_geoid ?? null,
      previous.place_geoid ?? null,
      JSON.stringify(previous.tract_geoids ?? []),
      previous.census_vintage ?? null,
      JSON.stringify({
        ...(typeof previous.input_values === "object" && previous.input_values
          ? previous.input_values
          : {}),
        reviewDecision: reason,
      }),
      JSON.stringify(previous.source_versions ?? {}),
      JSON.stringify(previous.source_checksums ?? {}),
      previous.score ?? null,
      previous.candidate_category ?? category,
      previous.confidence ?? null,
      category,
      reason,
      previous.algorithm_version ?? "pace-v1",
    ]
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
