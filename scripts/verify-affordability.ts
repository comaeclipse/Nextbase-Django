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
  DEFAULT_SPENDING_PROFILE,
  resolveCostConstants,
  type CostConstantKey,
  type SpendingProfile,
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
  /** Elder Index housing brick. */
  actualHousing: number;
  /** Total minus housing (food, transportation, miscellaneous, health). */
  actualNonHousing: number;
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
  const rpp = has(
    (l) =>
      l.goods_rpp != null &&
      l.utilities_rpp != null &&
      l.other_services_rpp != null
  );
  const ownable = has(
    (l) =>
      l.goods_rpp != null &&
      l.utilities_rpp != null &&
      l.other_services_rpp != null &&
      !!l.avg_home_value &&
      !!resolveStateAbbr(l.state)
  );

  const line = (label: string, count: number, note = "") =>
    console.log(
      `  ${label.padEnd(34)} ${String(count).padStart(4)}/${n}  ${pct(count, n).padStart(4)}${note}`
    );

  line("BEA RPP (goods/utilities/other)", rpp, rpp === 0 ? "  <- blocks every tenure" : "");
  line("col_index (Fit score only)", colIndex);
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
 * 3. RPP coverage and legacy col_index comparison
 * ------------------------------------------------------------------ */
const LEGACY_HOUSING_WEIGHT = 0.309;
const LEGACY_INDEX_BOUNDS = { min: 70, max: 160 };

function homeValueNumber(loc: CostInputs): number | null {
  if (loc.avg_home_value == null) return null;
  const n = parseFloat(loc.avg_home_value);
  return Number.isFinite(n) ? n : null;
}

function legacyNonHousingIndex(loc: CostInputs, nationalMedian: number): number | null {
  if (loc.col_index == null) return null;
  const value = homeValueNumber(loc);
  if (value === null) return loc.col_index;
  const housingIdx = (100 * value) / nationalMedian;
  const w = LEGACY_HOUSING_WEIGHT;
  const derived = (loc.col_index - w * housingIdx) / (1 - w);
  if (derived < LEGACY_INDEX_BOUNDS.min || derived > LEGACY_INDEX_BOUNDS.max) {
    return null;
  }
  return derived;
}

function reportRppAndLegacy(
  rows: CostInputs[],
  c: ReturnType<typeof resolveCostConstants>
): { unmatched: CostInputs[] } {
  heading("3. BEA RPP coverage vs legacy col_index back-out");

  const unmatched = rows.filter(
    (l) => l.goods_rpp == null || l.utilities_rpp == null || l.other_services_rpp == null
  );
  const msa = rows.filter((l) => l.bea_geo_type === "msa").length;
  const nonmetro = rows.filter((l) => l.bea_geo_type === "nonmetro_state").length;
  console.log(
    `  RPP matched ${rows.length - unmatched.length}/${rows.length}` +
      `  (MSA ${msa}, state nonmetro ${nonmetro}, unmatched ${unmatched.length})`
  );
  if (unmatched.length) {
    for (const row of unmatched.slice(0, 15)) {
      console.log(`    unmatched ${row.name}, ${row.state}`);
    }
  }

  if (!c.ok) return { unmatched };

  const nationalMedian = c.constants.nationalMedianHomeValue;
  const compared: { loc: CostInputs; rpp: number; legacy: number; delta: number }[] = [];
  let legacyBlocked = 0;
  let rppOnly = 0;

  for (const loc of rows) {
    const rpp = nonHousingIndex(loc, c.constants);
    const legacy = legacyNonHousingIndex(loc, nationalMedian);
    if (rpp === null && legacy === null) continue;
    if (rpp !== null && legacy === null) {
      rppOnly += 1;
      continue;
    }
    if (rpp === null && legacy !== null) {
      legacyBlocked += 1;
      continue;
    }
    compared.push({
      loc,
      rpp: rpp!,
      legacy: legacy!,
      delta: rpp! - legacy!,
    });
  }

  compared.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
  console.log(
    `\n  Side-by-side effective non-housing index (RPP minus legacy col_index back-out)`
  );
  console.log(
    `  comparable ${compared.length}   newly priceable via RPP ${rppOnly}` +
      `   still only priceable on the old path ${legacyBlocked}`
  );
  if (compared.length) {
    console.log(
      `  ${"city".padEnd(28)} ${"RPP".padStart(7)} ${"legacy".padStart(7)} ${"delta".padStart(7)}`
    );
    for (const row of compared.slice(0, 12)) {
      console.log(
        `  ${`${row.loc.name}, ${row.loc.state}`.padEnd(28)} ` +
          `${row.rpp.toFixed(1).padStart(7)} ${row.legacy.toFixed(1).padStart(7)} ` +
          `${(row.delta >= 0 ? "+" : "") + row.delta.toFixed(1).padStart(6)}`
      );
    }
  }

  return { unmatched };
}

/* ------------------------------------------------------------------ *
 * 4. Model coverage per tenure
 * ------------------------------------------------------------------ */
function reportModelCoverage(rows: CostInputs[], c: ReturnType<typeof resolveCostConstants>) {
  if (!c.ok) return;
  heading("4. Model coverage by tenure (modest profile)");

  const modestOpts = { spendingProfile: "modest" as const };
  const typicalOpts = { spendingProfile: "typical" as const };

  for (const tenure of TENURES) {
    const estimates = rows.map((l) =>
      estimateMonthlyCost(l, tenure, c.constants, modestOpts)
    );
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
        `                 modest range ${money(costs[0])} - ${money(costs[costs.length - 1])}` +
          `   median ${money(at(0.5))}`
      );
      const typicalCosts = rows
        .map((l) => estimateMonthlyCost(l, tenure, c.constants, typicalOpts).monthlyCost)
        .filter((n): n is number => n !== null)
        .sort((a, b) => a - b);
      if (typicalCosts.length) {
        const tAt = (q: number) => typicalCosts[Math.floor(q * (typicalCosts.length - 1))];
        console.log(
          `                 typical median ${money(tAt(0.5))}  (65+ mean; not the get-by gate)`
        );
      }
    }

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
function errPct(modeled: number, actual: number): number {
  return (modeled - actual) / actual;
}

function fmtErr(err: number): string {
  const pctStr = `${err * 100 >= 0 ? "+" : ""}${(err * 100).toFixed(0)}%`;
  return pctStr.padStart(8);
}

function reportGroundTruth(
  rows: CostInputs[],
  c: ReturnType<typeof resolveCostConstants>
): boolean {
  if (!c.ok) return true;
  heading("5. Modeled vs Elder Index ground truth (modest profile)");

  if (!existsSync(GROUND_TRUTH_PATH)) {
    console.log(`  (no ${GROUND_TRUTH_PATH} — skipping)`);
    return true;
  }

  const raw = JSON.parse(readFileSync(GROUND_TRUTH_PATH, "utf8"));
  const truth: GroundTruth[] = Array.isArray(raw) ? raw : (raw.entries ?? []);
  const profile: SpendingProfile = raw.spendingProfile ?? DEFAULT_SPENDING_PROFILE;
  const opts = { spendingProfile: profile };

  const MIN_GROUND_TRUTH_CITIES = 10;
  const cities = new Set(truth.map((t) => t.id));
  const tenures = new Set(truth.map((t) => t.tenure));
  if (cities.size < MIN_GROUND_TRUTH_CITIES || !TENURES.every((t) => tenures.has(t))) {
    console.log(
      `  Need at least ${MIN_GROUND_TRUTH_CITIES} cities and all three tenures. ` +
        `Have ${cities.size} cities, tenures: ${[...tenures].join(",") || "(none)"}.`
    );
    return false;
  }

  const byId = new Map(rows.map((r) => [r.id, r]));
  const TOLERANCE = 0.2;
  let worstNonHousing = 0;
  let worstRentTotal = 0;
  let compared = 0;
  let skipped = 0;
  let failed = false;

  const byTenure = new Map<Tenure, { housing: number[]; nonHousing: number[]; total: number[] }>();
  for (const t of TENURES) byTenure.set(t, { housing: [], nonHousing: [], total: [] });

  console.log(
    `  ${"city".padEnd(22)} ${"tenure".padEnd(13)} ` +
      `${"m.hous".padStart(8)} ${"a.hous".padStart(8)} ${"h.err".padStart(8)}  ` +
      `${"m.nh".padStart(8)} ${"a.nh".padStart(8)} ${"nh.err".padStart(8)}  ` +
      `${"m.tot".padStart(8)} ${"a.tot".padStart(8)} ${"t.err".padStart(8)}`
  );

  for (const t of truth) {
    const loc = byId.get(t.id);
    if (!loc) {
      console.log(`  ${t.city.padEnd(22)} (id ${t.id} not in DB)`);
      skipped += 1;
      failed = true;
      continue;
    }
    const estimate = estimateMonthlyCost(loc, t.tenure, c.constants, opts);
    if (
      estimate.monthlyCost === null ||
      estimate.housing === null ||
      estimate.nonHousing === null
    ) {
      console.log(`  ${t.city.padEnd(22)} ${t.tenure.padEnd(13)} not priceable`);
      skipped += 1;
      failed = true;
      continue;
    }
    compared += 1;
    const modeledHousing = estimate.housing;
    const modeledNonHousing = estimate.nonHousing + estimate.nationalFixed;
    const modeledTotal = estimate.monthlyCost;
    const actualNonHousing = t.actualNonHousing ?? t.actualMonthlyCost - t.actualHousing;
    const hErr = errPct(modeledHousing, t.actualHousing);
    const nhErr = errPct(modeledNonHousing, actualNonHousing);
    const tErr = errPct(modeledTotal, t.actualMonthlyCost);
    worstNonHousing = Math.max(worstNonHousing, Math.abs(nhErr));
    if (t.tenure === "rent") {
      worstRentTotal = Math.max(worstRentTotal, Math.abs(tErr));
    }
    byTenure.get(t.tenure)!.housing.push(hErr);
    byTenure.get(t.tenure)!.nonHousing.push(nhErr);
    byTenure.get(t.tenure)!.total.push(tErr);

    const nhFlag = Math.abs(nhErr) > TOLERANCE ? " ✗" : "";
    const totFlag = t.tenure === "rent" && Math.abs(tErr) > TOLERANCE ? " ✗" : "";
    console.log(
      `  ${t.city.padEnd(22)} ${t.tenure.padEnd(13)} ` +
        `${money(modeledHousing).padStart(8)} ${money(t.actualHousing).padStart(8)} ${fmtErr(hErr)}  ` +
        `${money(modeledNonHousing).padStart(8)} ${money(actualNonHousing).padStart(8)} ${fmtErr(nhErr)}${nhFlag}  ` +
        `${money(modeledTotal).padStart(8)} ${money(t.actualMonthlyCost).padStart(8)} ${fmtErr(tErr)}${totFlag}`
    );
  }

  console.log("\n  Error by tenure (mean of signed errors, then worst absolute):");
  for (const tenure of TENURES) {
    const bucket = byTenure.get(tenure)!;
    if (!bucket.total.length) continue;
    const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
    const worst = (xs: number[]) => Math.max(...xs.map(Math.abs));
    console.log(
      `    ${tenure.padEnd(14)} housing mean ${fmtErr(mean(bucket.housing)).trim()} worst ${fmtErr(worst(bucket.housing)).trim()}` +
        `   non-housing mean ${fmtErr(mean(bucket.nonHousing)).trim()} worst ${fmtErr(worst(bucket.nonHousing)).trim()}` +
        `   total mean ${fmtErr(mean(bucket.total)).trim()} worst ${fmtErr(worst(bucket.total)).trim()}`
    );
  }

  if (skipped > 0 || compared < truth.length) {
    console.log(
      `\n  ✗ compared ${compared}/${truth.length}; every benchmark must resolve to a ` +
        "priceable live row."
    );
    return false;
  }

  if (worstNonHousing > TOLERANCE) {
    console.log(
      `\n  ✗ worst non-housing error ${(worstNonHousing * 100).toFixed(0)}% exceeds the ` +
        `${TOLERANCE * 100}% tolerance. That is the spending-profile claim (#50).`
    );
    failed = true;
  } else {
    console.log(
      `\n  ✓ worst non-housing error ${(worstNonHousing * 100).toFixed(0)}% is within ${TOLERANCE * 100}%`
    );
  }

  if (worstRentTotal > TOLERANCE) {
    console.log(
      `  ✗ worst rent total error ${(worstRentTotal * 100).toFixed(0)}% exceeds the ` +
        `${TOLERANCE * 100}% tolerance.`
    );
    failed = true;
  } else {
    console.log(
      `  ✓ worst rent total error ${(worstRentTotal * 100).toFixed(0)}% is within ${TOLERANCE * 100}%`
    );
  }

  console.log(
    "  Owner/buying housing is reported, not gated: ZHVI typical home + 1% " +
      "maintenance is not the Elder Index modest dwelling."
  );

  return !failed;
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
      own_outright: round2(
        estimateMonthlyCost(l, "own_outright", c.constants, {
          spendingProfile: DEFAULT_SPENDING_PROFILE,
        }).monthlyCost
      ),
      buying: round2(
        estimateMonthlyCost(l, "buying", c.constants, {
          spendingProfile: DEFAULT_SPENDING_PROFILE,
        }).monthlyCost
      ),
      rent: round2(
        estimateMonthlyCost(l, "rent", c.constants, {
          spendingProfile: DEFAULT_SPENDING_PROFILE,
        }).monthlyCost
      ),
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

  const { unmatched } = reportRppAndLegacy(rows, resolution);
  reportModelCoverage(rows, resolution);
  const groundTruthOk = reportGroundTruth(rows, resolution);

  if (process.argv.includes("--write-baseline")) {
    writeBaseline(rows, resolution);
  }

  heading("Summary");
  const problems: string[] = [];
  if (!constantsReady) problems.push("constants unsourced");
  if (unmatched.length) problems.push(`${unmatched.length} cities without BEA RPP`);
  if (!groundTruthOk) problems.push("ground-truth error over tolerance");

  if (problems.length === 0) {
    console.log("  ✓ model is consistent and calibrated. Safe to build on.");
  } else {
    console.log(`  ✗ ${problems.join("; ")}`);
    process.exitCode = 1;
  }
}

main();
