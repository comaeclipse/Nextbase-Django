/*
 * Parity check: compare the TypeScript scoring against Django's reference dump
 * (baselines/django_scores.json) for every location. Run:
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/verify_scores.ts
 */
import { readFileSync } from "node:fs";
// Uncached read: unstable_cache needs a Next.js request context, which a bare
// tsx script doesn't have.
import { fetchAllLocations } from "../lib/locations";
import {
  calculateBaselineScore,
  calculateFitBreakdown,
  crimeGradeMeta,
} from "../lib/scoring";

type Ref = {
  id: number;
  score: number;
  breakdown: number[];
  crime: [string | null, string | null];
};

async function main() {
  const ref: Ref[] = JSON.parse(
    readFileSync("baselines/django_scores.json", "utf8")
  );
  const refById = new Map(ref.map((r) => [r.id, r]));

  const rows = await fetchAllLocations();
  console.log(`Django rows: ${ref.length} | Neon rows (TS): ${rows.length}`);

  let mismatches = 0;
  for (const loc of rows) {
    const r = refById.get(loc.id);
    if (!r) {
      console.log(`  ✗ id ${loc.id} (${loc.name}) missing from Django dump`);
      mismatches++;
      continue;
    }
    const score = calculateBaselineScore(loc);
    const breakdown = calculateFitBreakdown(loc).map((f) => f.score);
    const [grade] = crimeGradeMeta(loc);

    const problems: string[] = [];
    if (score !== r.score) problems.push(`score ${score} != ${r.score}`);
    if (JSON.stringify(breakdown) !== JSON.stringify(r.breakdown))
      problems.push(`breakdown ${JSON.stringify(breakdown)} != ${JSON.stringify(r.breakdown)}`);
    const refGrade = r.crime[0];
    if ((grade ?? null) !== (refGrade ?? null))
      problems.push(`crime ${grade} != ${refGrade}`);

    if (problems.length) {
      mismatches++;
      console.log(`  ✗ id ${loc.id} (${loc.name}, ${loc.state}): ${problems.join("; ")}`);
    }
  }

  if (mismatches === 0) {
    console.log(`✓ All ${rows.length} locations match Django scoring exactly.`);
  } else {
    console.log(`✗ ${mismatches} mismatch(es).`);
    process.exit(1);
  }
}

main();
