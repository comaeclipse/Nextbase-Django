/*
 * Regression check: compare the current Fit Score output against
 * baselines/fit_scores.json for every ranked candidate.
 *
 * This used to compare against baselines/django_scores.json to prove the
 * TypeScript port scored identically to the Django implementation. That check
 * had stopped being useful: it covered 67 rows against 170 candidates, so it
 * always exited non-zero and could gate nothing, and real drift hid among 103
 * "missing from Django dump" lines. django_scores.json is kept as migration
 * evidence -- baselines/ is an audit trail -- but nothing reads it now.
 *
 * A failure here means scoring output moved. That is not automatically a bug:
 * refreshed input data legitimately moves scores. The point is that it must be
 * DELIBERATE, so regenerate the baseline in the same commit as the change and
 * let the diff show which cities moved and by how much.
 *
 * Run:
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/verify_scores.ts
 * Regenerate:
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/generate-score-baseline.ts
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

interface Factor {
  key: string;
  score: number;
}
interface Ref {
  id: number;
  name: string;
  state: string;
  score: number;
  breakdown: Factor[];
  crime: [string | null, string | null];
}
interface Baseline {
  generatedAt: string;
  candidateCount: number;
  scores: Ref[];
}

/** Describes what moved, or null when the factors are identical. */
function factorDiff(current: Factor[], ref: Factor[]): string | null {
  if (current.length !== ref.length) {
    return `factor count ${ref.length} -> ${current.length}`;
  }
  const moved: string[] = [];
  for (let i = 0; i < current.length; i++) {
    // Comparing keys as well as scores means a reordering in
    // calculateFitBreakdown is reported as such, rather than silently shifting
    // every number one place left and reading as five unrelated changes.
    if (current[i].key !== ref[i].key) {
      return `factor ${i} is "${current[i].key}", baseline has "${ref[i].key}"`;
    }
    if (current[i].score !== ref[i].score) {
      moved.push(`${current[i].key} ${ref[i].score} -> ${current[i].score}`);
    }
  }
  return moved.length ? moved.join(", ") : null;
}

async function main() {
  const baseline: Baseline = JSON.parse(
    readFileSync("baselines/fit_scores.json", "utf8")
  );
  const refById = new Map(baseline.scores.map((r) => [r.id, r]));

  const rows = await fetchAllLocations();
  console.log(
    `baseline: ${baseline.scores.length} candidate(s) from ${baseline.generatedAt.slice(0, 10)} | live: ${rows.length}`
  );

  let mismatches = 0;
  const added: string[] = [];

  for (const loc of rows) {
    const ref = refById.get(loc.id);
    if (!ref) {
      // A newly imported candidate is not a regression, but the baseline does
      // need regenerating so it stays a complete snapshot.
      added.push(`${loc.name}, ${loc.state} (#${loc.id})`);
      continue;
    }
    const score = calculateBaselineScore(loc);
    const breakdown = calculateFitBreakdown(loc).map((f) => ({
      key: f.key,
      score: f.score,
    }));
    const [grade] = crimeGradeMeta(loc);

    const problems: string[] = [];
    if (score !== ref.score) problems.push(`score ${ref.score} -> ${score}`);
    const factors = factorDiff(breakdown, ref.breakdown);
    if (factors) problems.push(factors);
    if ((grade ?? null) !== (ref.crime[0] ?? null)) {
      problems.push(`crime ${ref.crime[0]} -> ${grade}`);
    }

    if (problems.length) {
      mismatches++;
      console.log(`  x ${loc.name}, ${loc.state} (#${loc.id}): ${problems.join("; ")}`);
    }
  }

  const removed = baseline.scores.filter((r) => !rows.some((l) => l.id === r.id));

  if (added.length) {
    console.log(`\n${added.length} candidate(s) not in the baseline:`);
    for (const a of added.slice(0, 10)) console.log(`  + ${a}`);
    if (added.length > 10) console.log(`  ... ${added.length - 10} more`);
  }
  if (removed.length) {
    console.log(`\n${removed.length} baseline row(s) no longer ranked:`);
    for (const r of removed.slice(0, 10)) console.log(`  - ${r.name}, ${r.state} (#${r.id})`);
    if (removed.length > 10) console.log(`  ... ${removed.length - 10} more`);
  }

  const regenerate =
    "  node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/generate-score-baseline.ts";

  if (mismatches === 0 && added.length === 0 && removed.length === 0) {
    console.log(`\nOK - all ${rows.length} candidates match the baseline.`);
    return;
  }
  if (mismatches === 0) {
    console.log(`\nNo score changed, but the candidate set did. Regenerate:\n${regenerate}`);
    process.exit(1);
  }
  console.log(
    `\n${mismatches} score(s) changed. If deliberate, regenerate in the same commit:\n${regenerate}`
  );
  process.exit(1);
}

main();
