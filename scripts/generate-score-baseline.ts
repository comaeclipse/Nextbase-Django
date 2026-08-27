/*
 * Writes baselines/fit_scores.json — a snapshot of the Fit Score, its five
 * factors, and the crime grade for every ranked candidate.
 *
 * WHAT THIS IS, AND WHAT IT REPLACED
 *
 * baselines/django_scores.json was a parity reference: proof that the
 * TypeScript port scored identically to the Django implementation it replaced.
 * That was the right check during the migration and it is the wrong check now:
 *
 *   - it covers 67 rows against 170 candidates, so verify_scores.ts always
 *     exited non-zero and could not gate anything;
 *   - Django is gone, so "matches Django" has stopped being a live property;
 *   - real value drift now hides inside 103 "missing from Django dump" lines.
 *     Huntsville's Home Affordability factor moved 70 -> 85 when its home value
 *     was refreshed to $290,453, which is CORRECT (<= $350k scores 85) but was
 *     indistinguishable from a regression in that noise.
 *
 * So this file is a REGRESSION snapshot, not a parity reference. It asserts
 * that scoring output has not changed since it was generated. When a scoring
 * rule or an input legitimately changes, regenerate it in the same commit and
 * the diff shows exactly which cities moved and by how much.
 *
 * django_scores.json is deliberately left in place. AGENTS.md treats
 * baselines/ as an audit trail, and the migration evidence should stay
 * readable even though nothing checks it any more.
 *
 * Usage:
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/generate-score-baseline.ts [--dry-run]
 */
import { writeFileSync } from "node:fs";
import path from "node:path";
import { fetchAllLocations } from "../lib/locations";
import {
  calculateBaselineScore,
  calculateFitBreakdown,
  crimeGradeMeta,
} from "../lib/scoring";

const dryRun = process.argv.includes("--dry-run");
const OUT = path.join("baselines", "fit_scores.json");

async function main() {
  const rows = await fetchAllLocations();
  rows.sort((a, b) => a.id - b.id);

  const scores = rows.map((loc) => {
    const breakdown = calculateFitBreakdown(loc);
    const [grade, band] = crimeGradeMeta(loc);
    return {
      id: loc.id,
      // Carried so a diff is readable without a database to hand.
      name: loc.name,
      state: loc.state,
      score: calculateBaselineScore(loc),
      // Factor order matches calculateFitBreakdown: affordability, cost, va,
      // safety, lgbtq. Keys are included so a reordering there is visible here
      // rather than silently shifting every number one place left.
      breakdown: breakdown.map((f) => ({ key: f.key, score: f.score })),
      crime: [grade ?? null, band ?? null] as [string | null, string | null],
    };
  });

  const payload = {
    generatedAt: new Date().toISOString(),
    note:
      "Regression snapshot of Fit Score output for every ranked candidate. " +
      "NOT a Django parity reference — see baselines/django_scores.json for " +
      "that, and scripts/generate-score-baseline.ts for why they differ. " +
      "Regenerate in the same commit as any deliberate scoring or input change.",
    candidateCount: scores.length,
    scores,
  };

  if (dryRun) {
    console.log(`Dry run — would write ${scores.length} candidate(s) to ${OUT}`);
    console.log(`  score range: ${Math.min(...scores.map((s) => s.score))}–${Math.max(...scores.map((s) => s.score))}`);
    return;
  }

  writeFileSync(OUT, JSON.stringify(payload, null, 2) + "\n");
  console.log(`Wrote ${scores.length} candidate(s) to ${OUT}`);
  console.log(`  score range: ${Math.min(...scores.map((s) => s.score))}–${Math.max(...scores.map((s) => s.score))}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
