/*
 * Loads verified state military-retired-pay tax treatment into
 * locations_stateinfo from data/state_retired_pay_tax.csv.
 *
 * THIS IS RESEARCH DATA, NOT A DOWNLOAD. locations_stateinfo has carried
 * retired_pay_tax for all 50 states since import, with vet_benefits_verified_on
 * NULL for every one of them -- lib/income.ts reads that column to decide
 * whether a state taxes military retired pay, and nothing in it had ever been
 * checked against a primary source (issue #42). Every non-`unknown` row here
 * traces to a state revenue department, statute, or a named institutional
 * secondary source, one state at a time.
 *
 * EVERY ROW MUST CARRY A SOURCE URL AND A VERIFICATION DATE. Rows without both
 * are rejected, not imported with a warning -- mirrors scripts/import-ss-tax.ts.
 * `unknown` needs no citation, because it claims nothing.
 *
 * COLUMNS
 *   state             two-letter USPS code, must already exist in the table
 *   RetiredPayTax      no_income_tax | exempt | partial | conditional | taxed | unknown
 *   ExclusionAmount    flat/capped dollar amount excluded per year. Blank when
 *                      the state's rule cannot be reduced to a single figure
 *                      (e.g. an age-tiered cap) -- put the real structure in
 *                      Condition instead of guessing at one number.
 *   ExclusionPct       percentage of retired pay excluded, when the exclusion
 *                      is stated as a percentage rather than a dollar cap.
 *   Condition          free text: the age/income/service gate or multi-tier
 *                      structure a scalar can't carry. Required for
 *                      `conditional`; encouraged for `partial` whenever a
 *                      single ExclusionAmount/Pct would misrepresent the rule.
 *   SourceUrl          required unless RetiredPayTax is `unknown`
 *   VerifiedOn         YYYY-MM-DD, required unless RetiredPayTax is `unknown`
 *   Notes              free text; confidence tier and caveats the enum can't hold
 *
 * Usage:
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/import-retired-pay-tax.ts [csv] [--dry-run]
 */
import { readFileSync, existsSync } from "node:fs";
import { parse } from "csv-parse/sync";
import { getSql } from "../lib/db";

const DEFAULT_CSV = "data/state_retired_pay_tax.csv";

/** Allowed enum values; anything else is a hard error, never coerced. */
const RETIRED_PAY_TAX = new Set([
  "no_income_tax",
  "exempt",
  "partial",
  "conditional",
  "taxed",
  "unknown",
]);

/** Plausible bounds for a flat exclusion amount, in annual dollars. */
const AMOUNT_BOUNDS = { min: 1_000, max: 200_000 };
/** Plausible bounds for a percentage-based exclusion. */
const PCT_BOUNDS = { min: 1, max: 100 };

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const csvPath = args.find((a) => !a.startsWith("--")) ?? DEFAULT_CSV;

type Row = Record<string, string>;

const clean = (v: string | undefined): string | null => {
  if (v == null) return null;
  const t = String(v).trim();
  return t === "" || t === "?" || t.toLowerCase() === "na" ? null : t;
};

function parseNumber(
  raw: string | undefined,
  label: string,
  bounds: { min: number; max: number },
  problems: string[]
): number | null {
  const c = clean(raw);
  if (c === null) return null;
  const n = Number(c.replace(/[$,\s]/g, ""));
  if (!Number.isFinite(n)) {
    problems.push(`${label} is not a number: "${c}"`);
    return null;
  }
  if (n < bounds.min || n > bounds.max) {
    problems.push(
      `${label} ${n} is outside the plausible range ${bounds.min}-${bounds.max}`
    );
    return null;
  }
  return n;
}

interface Parsed {
  state: string;
  treatment: string;
  exclusionAmount: number | null;
  exclusionPct: number | null;
  condition: string | null;
  sourceUrl: string | null;
  verifiedOn: string | null;
}

async function main() {
  console.log(`Retired pay tax import${dryRun ? " (dry run)" : ""}`);

  if (!existsSync(csvPath)) {
    console.error(`\nNo CSV at ${csvPath}`);
    process.exit(1);
  }

  const rows = parse(readFileSync(csvPath, "utf8"), {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as Row[];

  console.log(`  source: ${csvPath} (${rows.length} rows)\n`);

  const accepted: Parsed[] = [];
  const rejected: { state: string; problems: string[] }[] = [];
  const blank: string[] = [];
  const warnings: string[] = [];

  for (const row of rows) {
    const state = clean(row.state)?.toUpperCase();
    if (!state) continue;

    const treatment = clean(row.RetiredPayTax)?.toLowerCase() ?? null;

    // An untouched template row is not an error -- it is work not yet done.
    if (treatment === null) {
      blank.push(state);
      continue;
    }

    const problems: string[] = [];

    if (!RETIRED_PAY_TAX.has(treatment)) {
      problems.push(
        `treatment "${treatment}" is not one of ${[...RETIRED_PAY_TAX].join(", ")}`
      );
    }

    const exclusionAmount = parseNumber(row.ExclusionAmount, "ExclusionAmount", AMOUNT_BOUNDS, problems);
    const exclusionPct = parseNumber(row.ExclusionPct, "ExclusionPct", PCT_BOUNDS, problems);
    const condition = clean(row.Condition);

    const sourceUrl = clean(row.SourceUrl);
    const verifiedOn = clean(row.VerifiedOn);

    // `unknown` is an honest answer and needs no citation. Everything else is
    // a claim about tax law and must say where it came from.
    if (treatment !== "unknown") {
      if (!sourceUrl) problems.push("SourceUrl is required");
      if (!verifiedOn) problems.push("VerifiedOn is required");
      else if (!/^\d{4}-\d{2}-\d{2}$/.test(verifiedOn)) {
        problems.push(`VerifiedOn "${verifiedOn}" is not YYYY-MM-DD`);
      }
    }

    if (
      (treatment === "no_income_tax" || treatment === "exempt" || treatment === "taxed") &&
      (exclusionAmount !== null || exclusionPct !== null)
    ) {
      problems.push(
        `${treatment} with an exclusion amount/pct is contradictory -- use \`partial\` or \`conditional\` for a state that excludes some but not all retired pay`
      );
    }

    if (problems.length) {
      rejected.push({ state, problems });
      continue;
    }

    if (treatment === "conditional" && !condition) {
      warnings.push(`${state}: conditional with no Condition text -- the gate is undocumented`);
    }

    if (
      treatment === "partial" &&
      exclusionAmount === null &&
      exclusionPct === null &&
      !condition
    ) {
      warnings.push(
        `${state}: partial with no ExclusionAmount, ExclusionPct, or Condition -- income model will assume fully taxed with no documented reason why it can't compute`
      );
    }

    accepted.push({
      state,
      treatment,
      exclusionAmount,
      exclusionPct,
      condition,
      sourceUrl,
      verifiedOn,
    });
  }

  /* ---- report ---- */
  const byTreatment = new Map<string, number>();
  for (const a of accepted) {
    byTreatment.set(a.treatment, (byTreatment.get(a.treatment) ?? 0) + 1);
  }
  console.log(`  accepted ${accepted.length}`);
  for (const [t, n] of [...byTreatment].sort((a, b) => b[1] - a[1])) {
    console.log(`    ${t.padEnd(14)} ${n}`);
  }

  if (blank.length) {
    console.log(`\n  not yet researched (${blank.length}): ${blank.join(" ")}`);
  }

  if (warnings.length) {
    console.log("\n  warnings:");
    for (const w of warnings) console.log(`    ${w}`);
  }

  if (rejected.length) {
    console.log(`\n  REJECTED ${rejected.length} -- not written:`);
    for (const r of rejected) {
      console.log(`    ${r.state}: ${r.problems.join("; ")}`);
    }
  }

  if (accepted.length === 0) {
    console.log(
      "\nNothing to import. Fill in data/state_retired_pay_tax.csv -- every row needs a\n" +
        "RetiredPayTax value, and every non-`unknown` row needs a SourceUrl and VerifiedOn."
    );
    if (rejected.length) process.exitCode = 1;
    return;
  }

  if (dryRun) {
    console.log("\nDry run complete -- nothing written.");
    if (rejected.length) process.exitCode = 1;
    return;
  }

  /* ---- write ---- */
  const sql = getSql();
  let written = 0;
  let unmatched = 0;

  for (const a of accepted) {
    const result = (await sql.query(
      `UPDATE locations_stateinfo
       SET retired_pay_tax = $1,
           retired_pay_exclusion_amount = $2,
           retired_pay_exclusion_pct = $3,
           retired_pay_condition = $4,
           vet_benefits_source_url = $5,
           vet_benefits_verified_on = $6
       WHERE state = $7
       RETURNING state`,
      [
        a.treatment,
        a.exclusionAmount,
        a.exclusionPct,
        a.condition,
        a.sourceUrl,
        a.verifiedOn,
        a.state,
      ]
    )) as unknown[];

    // Rows are only ever updated, never inserted: a state code with no
    // locations_stateinfo row is a typo in the CSV, not a new state.
    if (result.length === 0) {
      console.log(`    ! ${a.state} has no locations_stateinfo row -- skipped`);
      unmatched++;
    } else {
      written++;
    }
  }

  console.log(`\n  wrote ${written} states${unmatched ? `, ${unmatched} unmatched` : ""}`);
  console.log("\nImport complete.");
  if (rejected.length) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
