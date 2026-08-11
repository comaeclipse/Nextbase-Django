/*
 * Validation harness for the fixed-income cost model (lib/affordability.ts).
 *
 * Run:
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/verify-affordability.ts
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/verify-affordability.ts --write-baseline
 *
 * Pure-algebra checks live in lib/affordability.test.ts (`npm test`). This
 * script is the DATA-facing half: it answers "given the real 132 rows, does the
 * model produce trustworthy numbers, and for how many cities?"
 *
 * It is designed to be useful before Phase 0 is finished. With the national
 * constants still unsourced it reports raw input coverage — the ceiling on how
 * many cities could ever be priced — so you know what you are buying before you
 * go look up a single BLS table.
 *
 * THE GATE: if coverage or the ground-truth comparison looks bad here, fix the
 * data before building any UI. A results grid where most cards read "not enough
 * data" is worse than no feature at all.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fetchAllLocations } from "../lib/locations";
import { resolveStateAbbr } from "../lib/states";
import { HOME_INSURANCE_DATASET } from "../lib/insurance";
import {
  COST_CONSTANTS,
  resolveCostConstants,
  NON_HOUSING_INDEX_BOUNDS,
  type CostConstantKey,
} from "../lib/cost-constants";
import {
  estimateMonthlyCost,
  nonHousingIndex,
  type CostInputs,
  type Tenure,
} from "../lib/affordability";

const GROUND_TRUTH_PATH = "baselines/affordability-ground-truth.json";
const BASELINE_PATH = "baselines/affordability.json";
const TENURES: Tenure[] = ["own_outright", "buying", "rent"];

/** Ground-truth entry a human researched by hand for a real city. */
interface GroundTruth {
  id: number;
  city: string;
  tenure: Tenure;
  /** Actual observed monthly cost for a retiree household, in dollars. */
  actualMonthlyCost: number;
  source: string;
  sourcedOn: string;
}

const money = (n: number) =>
  "$" + Math.round(n).toLocaleString("en-US");

const pct = (n: number, d: number) =>
  d === 0 ? "0%" : `${Math.round((n / d) * 100)}%`;

function heading(title: string) {
  console.log(`\n${title}`);
  console.log("-".repeat(title.length));
}

/* ------------------------------------------------------------------ *
 * 1. Constants status
 * ------------------------------------------------------------------ */
function reportConstants(): boolean {
  heading("1. National constants (Phase 0)");

  const keys = Object.keys(COST_CONSTANTS) as CostConstantKey[];
  const sourced = keys.filter((k) => COST_CONSTANTS[k].value !== null);

  for (const key of keys) {
    const c = COST_CONSTANTS[key];
    const mark = c.value === null ? "✗" : "✓";
    const kind = c.kind === "convention" ? " [convention]" : "";
    const value =
      c.value === null
        ? "UNSOURCED"
        : `${c.value} ${c.unit}${c.sourcedOn ? ` (${c.sourcedOn})` : ""}`;
    console.log(`  ${mark} ${key}${kind}`);
    console.log(`      ${value}`);
    if (c.value === null) console.log(`      source: ${c.source}`);
  }

  console.log(`\n  ${sourced.length}/${keys.length} sourced.`);
  return sourced.length === keys.length;
}

/* ------------------------------------------------------------------ *
 * 2. Raw input coverage — runs with or without constants
 * ------------------------------------------------------------------ */
function reportRawCoverage(rows: CostInputs[]) {
  heading("2. Raw input coverage");

  const n = rows.length;
  const has = (pred: (l: CostInputs) => boolean) => rows.filter(pred).length;

  const colIndex = has((l) => l.col_index !== null && l.col_index !== undefined);
  const homeValue = has((l) => !!l.avg_home_value);
  const insurance = has((l) => {
    const abbr = resolveStateAbbr(l.state);
    return !!abbr && HOME_INSURANCE_DATASET.data.some((d) => d.state === abbr);
  });
  const rent = has((l) => l.median_rent !== null && l.median_rent !== undefined);
  const propTax = has(
    (l) => l.property_tax_rate !== null && l.property_tax_rate !== undefined
  );
  const ownable = has(
    (l) =>
      l.col_index !== null &&
      !!l.avg_home_value &&
      !!resolveStateAbbr(l.state)
  );

  const line = (label: string, count: number, note = "") =>
    console.log(
      `  ${label.padEnd(34)} ${String(count).padStart(4)}/${n}  ${pct(count, n).padStart(4)}${note}`
    );

  line("col_index", colIndex);
  line("avg_home_value", homeValue);
  line("homeowners insurance (by state)", insurance);
  line("property_tax_rate", propTax, propTax === 0 ? "  <- P0 ingestion" : "");
  line("median_rent", rent, rent === 0 ? "  <- P0 ingestion, blocks renting" : "");
  console.log();
  line("ceiling for ownership tenures", ownable);

  if (rent === 0) {
    console.log(
      "\n  NOTE: with median_rent absent, the rent tenure cannot produce a single\n" +
        "  estimate. Renting is the common case for the lowest-income users, so\n" +
        "  this is the gap that most limits who the feature can serve."
    );
  }
}

/* ------------------------------------------------------------------ *
 * 3. Plausibility / data quality
 * ------------------------------------------------------------------ */
function reportPlausibility(rows: CostInputs[], c: ReturnType<typeof resolveCostConstants>) {
  if (!c.ok) return { outliers: [] as CostInputs[] };
  heading("3. Derived index plausibility");

  const { min, max } = NON_HOUSING_INDEX_BOUNDS;
  console.log(
    `  A city outside ${min}-${max} has a col_index and avg_home_value that\n` +
      `  disagree with each other. These are data bugs to fix, not cheap cities.\n`
  );
  console.log(
    "  !! col_index IS MIXED-PROVENANCE. Source notes identify at least five\n" +
      "     different providers across the table -- BestPlaces (28 cities),\n" +
      "     C2ER/ACCRA (12), ERI/SalaryExpert (11), CostOfLivingData (5),\n" +
      "     PayScale (3) -- each with a different basket. housingWeight is a\n" +
      "     C2ER figure, so the back-out below is only valid for the C2ER rows.\n" +
      "     PASSING THIS BAND IS NOT EVIDENCE OF CORRECTNESS: an in-band city\n" +
      "     can still be derived from an index this weight does not describe.\n" +
      "     See issue #40 (BEA RPP migration) and #49.\n"
  );

  const outliers: CostInputs[] = [];
  const values: number[] = [];

  for (const loc of rows) {
    if (loc.col_index === null || !loc.avg_home_value) continue;
    const idx = nonHousingIndex(loc, c.constants);
    if (idx === null) outliers.push(loc);
    else values.push(idx);
  }

  values.sort((a, b) => a - b);
  if (values.length) {
    const at = (q: number) => values[Math.floor(q * (values.length - 1))];
    console.log(
      `  In-band: ${values.length}   ` +
        `p10 ${at(0.1).toFixed(1)}  median ${at(0.5).toFixed(1)}  p90 ${at(0.9).toFixed(1)}`
    );
  }

  if (outliers.length) {
    console.log(`\n  ✗ ${outliers.length} out-of-band:`);
    for (const o of outliers.slice(0, 20)) {
      console.log(
        `      ${`${o.name}, ${o.state}`.padEnd(30)} ` +
          `col_index ${String(o.col_index).padStart(4)}  ` +
          `home ${money(parseFloat(o.avg_home_value!))}`
      );
    }
    if (outliers.length > 20) console.log(`      ... and ${outliers.length - 20} more`);
  } else {
    console.log("  ✓ every priceable city lands in a plausible band");
  }

  return { outliers };
}

/* ------------------------------------------------------------------ *
 * 4. Model coverage per tenure
 * ------------------------------------------------------------------ */
function reportModelCoverage(rows: CostInputs[], c: ReturnType<typeof resolveCostConstants>) {
  if (!c.ok) return;
  heading("4. Model coverage by tenure");

  for (const tenure of TENURES) {
    const estimates = rows.map((l) => estimateMonthlyCost(l, tenure, c.constants));
    const priced = estimates.filter((e) => e.monthlyCost !== null);
    const approximated = priced.filter((e) => e.approximations.length > 0);

    console.log(
      `  ${tenure.padEnd(14)} priced ${String(priced.length).padStart(4)}/${rows.length} ` +
        `(${pct(priced.length, rows.length)})   ` +
        `of those, ${approximated.length} use a national stand-in`
    );

    if (priced.length) {
      const costs = priced.map((e) => e.monthlyCost!).sort((a, b) => a - b);
      const at = (q: number) => costs[Math.floor(q * (costs.length - 1))];
      console.log(
        `                 cost range ${money(costs[0])} - ${money(costs[costs.length - 1])}` +
          `   median ${money(at(0.5))}`
      );
    }

    // Why the rest failed, most common reason first.
    const reasons = new Map<string, number>();
    for (const e of estimates) {
      for (const m of e.missing) reasons.set(m, (reasons.get(m) ?? 0) + 1);
    }
    const sorted = [...reasons.entries()].sort((a, b) => b[1] - a[1]);
    for (const [reason, count] of sorted) {
      console.log(`                 blocked by ${reason}: ${count}`);
    }
  }
}

/* ------------------------------------------------------------------ *
 * 5. Ground truth
 * ------------------------------------------------------------------ */
function reportGroundTruth(
  rows: CostInputs[],
  c: ReturnType<typeof resolveCostConstants>
): boolean {
  if (!c.ok) return true;
  heading("5. Modeled vs hand-researched ground truth");

  if (!existsSync(GROUND_TRUTH_PATH)) {
    console.log(`  (no ${GROUND_TRUTH_PATH} — skipping)`);
    return true;
  }

  const raw = JSON.parse(readFileSync(GROUND_TRUTH_PATH, "utf8"));
  const truth: GroundTruth[] = Array.isArray(raw) ? raw : (raw.entries ?? []);

  if (truth.length === 0) {
    console.log(
      "  No entries yet. Hand-source true monthly cost for 8-10 cities across\n" +
        "  the price range and add them — this is the only check that can catch a\n" +
        "  constant that is sourced but wrong."
    );
    return true;
  }

  const byId = new Map(rows.map((r) => [r.id, r]));
  let worst = 0;

  console.log(
    `  ${"city".padEnd(24)} ${"tenure".padEnd(13)} ${"modeled".padStart(9)} ${"actual".padStart(9)} ${"error".padStart(8)}`
  );
  for (const t of truth) {
    const loc = byId.get(t.id);
    if (!loc) {
      console.log(`  ${t.city.padEnd(24)} (id ${t.id} not in DB)`);
      continue;
    }
    const modeled = estimateMonthlyCost(loc, t.tenure, c.constants).monthlyCost;
    if (modeled === null) {
      console.log(`  ${t.city.padEnd(24)} ${t.tenure.padEnd(13)} not priceable`);
      continue;
    }
    const err = (modeled - t.actualMonthlyCost) / t.actualMonthlyCost;
    worst = Math.max(worst, Math.abs(err));
    console.log(
      `  ${t.city.padEnd(24)} ${t.tenure.padEnd(13)} ` +
        `${money(modeled).padStart(9)} ${money(t.actualMonthlyCost).padStart(9)} ` +
        `${(err * 100 >= 0 ? "+" : "") + (err * 100).toFixed(0) + "%"}`.padStart(9)
    );
  }

  const TOLERANCE = 0.2;
  if (worst > TOLERANCE) {
    console.log(
      `\n  ✗ worst error ${(worst * 100).toFixed(0)}% exceeds the ${TOLERANCE * 100}% tolerance.\n` +
        "    A systematic bias in one direction usually means a wrong constant;\n" +
        "    scattered errors usually mean a bad column for those cities."
    );
    return false;
  }
  console.log(`\n  ✓ worst error ${(worst * 100).toFixed(0)}% is within tolerance`);
  return true;
}

/* ------------------------------------------------------------------ *
 * 6. Baseline snapshot
 * ------------------------------------------------------------------ */
function writeBaseline(rows: CostInputs[], c: ReturnType<typeof resolveCostConstants>) {
  if (!c.ok) {
    console.log("\n  Cannot write a baseline while constants are unsourced.");
    return;
  }
  const snapshot = rows
    .map((l) => ({
      id: l.id,
      name: `${l.name}, ${l.state}`,
      nonHousingIndex: round2(nonHousingIndex(l, c.constants)),
      own_outright: round2(estimateMonthlyCost(l, "own_outright", c.constants).monthlyCost),
      buying: round2(estimateMonthlyCost(l, "buying", c.constants).monthlyCost),
      rent: round2(estimateMonthlyCost(l, "rent", c.constants).monthlyCost),
    }))
    .sort((a, b) => a.id - b.id);

  writeFileSync(
    BASELINE_PATH,
    JSON.stringify({ constants: c.constants, locations: snapshot }, null, 2) + "\n"
  );
  console.log(`\n  Wrote ${BASELINE_PATH} (${snapshot.length} locations).`);
  console.log("  Commit it so constant refreshes show up as a reviewable diff.");
}

function round2(n: number | null): number | null {
  return n === null ? null : Math.round(n * 100) / 100;
}

/* ------------------------------------------------------------------ */
async function main() {
  console.log("Fixed-income cost model — validation harness");

  const rows = (await fetchAllLocations()) as CostInputs[];
  console.log(`\nLoaded ${rows.length} locations.`);

  const constantsReady = reportConstants();
  reportRawCoverage(rows);

  const resolution = resolveCostConstants();

  if (!resolution.ok) {
    heading("Phase 0 incomplete");
    console.log(
      `  ${resolution.missing.length} constant(s) still unsourced, so no dollar\n` +
        "  estimate can be produced yet. Fill them in lib/cost-constants.ts and\n" +
        "  re-run; the plausibility, coverage, and ground-truth reports below this\n" +
        "  point will then have something to say.\n\n" +
        "  Missing: " +
        resolution.missing.join(", ")
    );
    console.log(
      "\n  The model's arithmetic is already verified independently of these\n" +
        "  values — run `npm test` (lib/affordability.test.ts)."
    );
    return;
  }

  const { outliers } = reportPlausibility(rows, resolution);
  reportModelCoverage(rows, resolution);
  const groundTruthOk = reportGroundTruth(rows, resolution);

  if (process.argv.includes("--write-baseline")) {
    writeBaseline(rows, resolution);
  }

  heading("Summary");
  const problems: string[] = [];
  if (!constantsReady) problems.push("constants unsourced");
  if (outliers.length) problems.push(`${outliers.length} out-of-band cities`);
  if (!groundTruthOk) problems.push("ground-truth error over tolerance");

  if (problems.length === 0) {
    console.log("  ✓ model is consistent and calibrated. Safe to build on.");
  } else {
    console.log(`  ✗ ${problems.join("; ")}`);
    process.exitCode = 1;
  }
}

main();
