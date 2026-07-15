/*
 * Classify curated locations into retirement pace categories.
 *
 * Usage:
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/classify-pace.ts --all [--dry-run]
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/classify-pace.ts --id 12 [--dry-run]
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/classify-pace.ts --name "Paterson, NJ" [--dry-run]
 */
import { getSql } from "../lib/db";
import {
  classifyAndPersist,
  classifyLocation,
  loadDerivedBundle,
  type PaceCategory,
} from "../lib/pace";

const dryRun = process.argv.includes("--dry-run");
const all = process.argv.includes("--all");

function argValue(flag: string): string | null {
  const idx = process.argv.indexOf(flag);
  if (idx < 0) return null;
  return process.argv[idx + 1] ?? null;
}

interface Loc {
  id: number;
  name: string;
  state: string;
}

async function loadTargets(): Promise<Loc[]> {
  const sql = getSql();
  const idArg = argValue("--id");
  const nameArg = argValue("--name");

  if (all) {
    const rows = (await sql.query(
      `SELECT id, name, state FROM locations_location ORDER BY name, state`
    )) as Loc[];
    return rows.map((r) => ({ ...r, id: Number(r.id) }));
  }

  if (idArg) {
    const id = Number(idArg);
    const rows = (await sql.query(
      `SELECT id, name, state FROM locations_location WHERE id = $1`,
      [id]
    )) as Loc[];
    if (!rows.length) throw new Error(`No location with id=${id}`);
    return rows.map((r) => ({ ...r, id: Number(r.id) }));
  }

  if (nameArg) {
    const m = nameArg.match(/^(.+),\s*([A-Za-z]{2})$/);
    if (!m) {
      throw new Error(`--name must look like "City, ST" (got ${nameArg})`);
    }
    const name = m[1].trim();
    const state = m[2].toUpperCase();
    const rows = (await sql.query(
      `SELECT id, name, state FROM locations_location
       WHERE lower(name) = lower($1) AND upper(state) = $2`,
      [name, state]
    )) as Loc[];
    if (!rows.length) throw new Error(`No location matching ${name}, ${state}`);
    return rows.map((r) => ({ ...r, id: Number(r.id) }));
  }

  console.error(
    "Usage: classify-pace --all | --id N | --name \"City, ST\" [--dry-run]"
  );
  process.exit(1);
}

async function main() {
  console.log(`Pace classify${dryRun ? " (dry run)" : ""}\n`);
  const bundle = loadDerivedBundle();
  console.log(
    `Loaded derived bundle (${bundle.cbsa.length} CBSAs, ${bundle.place.length} tract units)\n`
  );

  const targets = await loadTargets();
  console.log(`Classifying ${targets.length} location(s)…\n`);

  const counts: Record<string, number> = {
    urban: 0,
    suburban: 0,
    small_town: 0,
    rural: 0,
    needs_review: 0,
    auto_approved: 0,
    override_preserved: 0,
    errors: 0,
  };

  for (const loc of targets) {
    try {
      const result = await classifyLocation(
        { locationId: loc.id, name: loc.name, state: loc.state },
        bundle
      );
      const { preservedOverride } = await classifyAndPersist(result, dryRun);

      const cat = (result.scored.category ?? "?") as PaceCategory | "?";
      const mark = dryRun ? "=" : "+";
      const scope = result.geography?.scope ?? "?";
      const geoid =
        result.geography?.cbsaGeoid ??
        result.geography?.placeGeoid ??
        result.geography?.tractGeoids[0] ??
        "-";
      const score =
        result.scored.score != null ? result.scored.score.toFixed(1) : "n/a";

      console.log(
        `  ${mark} ${loc.name}, ${loc.state}: ${cat} score=${score} ` +
          `state=${result.reviewState} scope=${scope} geoid=${geoid}` +
          (preservedOverride ? " [override preserved]" : "") +
          (result.scored.reviewReasons.length
            ? ` (${result.scored.reviewReasons.join(",")})`
            : "")
      );

      if (result.scored.category) counts[result.scored.category]++;
      counts[result.reviewState] = (counts[result.reviewState] ?? 0) + 1;
      if (preservedOverride) counts.override_preserved++;

      // Be polite to the Census geocoder.
      await new Promise((r) => setTimeout(r, 150));
    } catch (err) {
      counts.errors++;
      console.error(
        `  X ${loc.name}, ${loc.state}: ${(err as Error).message}`
      );
    }
  }

  console.log("\nSummary:");
  for (const [k, v] of Object.entries(counts)) {
    if (v > 0) console.log(`  ${k}: ${v}`);
  }
  console.log(dryRun ? "\nDry run complete (no writes)." : "\nDone.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
