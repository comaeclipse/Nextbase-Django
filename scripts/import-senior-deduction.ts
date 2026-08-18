/*
 * Loads general senior subtractions from state taxable income into
 * locations_stateinfo from data/state_senior_deduction.csv.
 *
 * THIS IS NOT AN SS-TAX IMPORT. ss_tax_* describes when a state exempts
 * Social Security BENEFITS. This table is for states (Montana) that instead
 * subtract a fixed amount for each taxpayer who has attained a given age,
 * from the combined taxable-income base. See issue #58.
 *
 * EVERY ROW MUST CARRY amount, min age, tax year, source status, source URL,
 * and verification date. Calculated figures must be labeled `calculated`,
 * never `official`.
 *
 * COLUMNS
 *   state                 two-letter USPS code, must already exist
 *   Amount                dollars per unit (see PerQualifyingPerson)
 *   MinAge                age at which a filer qualifies
 *   PerQualifyingPerson   true = one unit per 65+ filer/spouse; false =
 *                         household amount
 *   TaxYear               tax year the amount is for
 *   SourceStatus          official | calculated
 *   SourceUrl             required
 *   VerifiedOn            YYYY-MM-DD, required
 *   Notes                 free text; inflation formula and source conflicts
 *
 * Usage:
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/import-senior-deduction.ts [csv] [--dry-run]
 */
import { readFileSync, existsSync } from "node:fs";
import { parse } from "csv-parse/sync";
import { getSql } from "../lib/db";

const DEFAULT_CSV = "data/state_senior_deduction.csv";
const STATUSES = new Set(["official", "calculated"]);
const AMOUNT_BOUNDS = { min: 100, max: 50_000 };
const AGE_BOUNDS = { min: 55, max: 75 };
const YEAR_BOUNDS = { min: 2024, max: 2030 };

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const csvPath = args.find((a) => !a.startsWith("--")) ?? DEFAULT_CSV;

type Row = Record<string, string>;

const clean = (v: string | undefined): string | null => {
  if (v == null) return null;
  const t = String(v).trim();
  return t === "" || t === "?" || t.toLowerCase() === "na" ? null : t;
};

function parseBool(raw: string | undefined, label: string, problems: string[]): boolean | null {
  const c = clean(raw)?.toLowerCase() ?? null;
  if (c === null) return null;
  if (c === "true" || c === "yes" || c === "y" || c === "1") return true;
  if (c === "false" || c === "no" || c === "n" || c === "0") return false;
  problems.push(`${label} "${raw}" is not true/false`);
  return null;
}

function parseIntInRange(
  raw: string | undefined,
  label: string,
  bounds: { min: number; max: number },
  problems: string[]
): number | null {
  const c = clean(raw);
  if (c === null) return null;
  const n = Number(c.replace(/[$,\s]/g, ""));
  if (!Number.isInteger(n)) {
    problems.push(`${label} is not an integer: "${c}"`);
    return null;
  }
  if (n < bounds.min || n > bounds.max) {
    problems.push(`${label} ${n} is outside ${bounds.min}-${bounds.max}`);
    return null;
  }
  return n;
}

interface Parsed {
  state: string;
  amount: number;
  minAge: number;
  perQualifyingPerson: boolean;
  taxYear: number;
  sourceStatus: string;
  sourceUrl: string;
  verifiedOn: string;
}

async function main() {
  console.log(`Senior deduction import${dryRun ? " (dry run)" : ""}`);

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

  for (const row of rows) {
    const state = clean(row.state)?.toUpperCase();
    if (!state) continue;

    const problems: string[] = [];
    const amount = parseIntInRange(row.Amount, "Amount", AMOUNT_BOUNDS, problems);
    const minAge = parseIntInRange(row.MinAge, "MinAge", AGE_BOUNDS, problems);
    const perQualifyingPerson = parseBool(row.PerQualifyingPerson, "PerQualifyingPerson", problems);
    const taxYear = parseIntInRange(row.TaxYear, "TaxYear", YEAR_BOUNDS, problems);
    const sourceStatus = clean(row.SourceStatus)?.toLowerCase() ?? null;
    const sourceUrl = clean(row.SourceUrl);
    const verifiedOn = clean(row.VerifiedOn);

    if (amount === null) problems.push("Amount is required");
    if (minAge === null) problems.push("MinAge is required");
    if (perQualifyingPerson === null) problems.push("PerQualifyingPerson is required");
    if (taxYear === null) problems.push("TaxYear is required");
    if (!sourceStatus || !STATUSES.has(sourceStatus)) {
      problems.push(`SourceStatus must be ${[...STATUSES].join(" | ")}`);
    }
    if (!sourceUrl) problems.push("SourceUrl is required");
    if (!verifiedOn) problems.push("VerifiedOn is required");
    else if (!/^\d{4}-\d{2}-\d{2}$/.test(verifiedOn)) {
      problems.push(`VerifiedOn "${verifiedOn}" is not YYYY-MM-DD`);
    }

    if (problems.length) {
      rejected.push({ state, problems });
      continue;
    }

    accepted.push({
      state,
      amount: amount!,
      minAge: minAge!,
      perQualifyingPerson: perQualifyingPerson!,
      taxYear: taxYear!,
      sourceStatus: sourceStatus!,
      sourceUrl: sourceUrl!,
      verifiedOn: verifiedOn!,
    });
  }

  console.log(`  accepted ${accepted.length}`);
  if (rejected.length) {
    console.log(`\n  REJECTED ${rejected.length} — not written:`);
    for (const r of rejected) {
      console.log(`    ${r.state}: ${r.problems.join("; ")}`);
    }
  }

  if (accepted.length === 0) {
    console.log("\nNothing to import.");
    if (rejected.length) process.exitCode = 1;
    return;
  }

  if (dryRun) {
    for (const a of accepted) {
      console.log(
        `    ${a.state}: $${a.amount} age ${a.minAge}+ ${a.taxYear} ${a.sourceStatus}` +
          ` perPerson=${a.perQualifyingPerson}`
      );
    }
    console.log("\nDry run complete — nothing written.");
    if (rejected.length) process.exitCode = 1;
    return;
  }

  const sql = getSql();
  let written = 0;
  let unmatched = 0;

  for (const a of accepted) {
    const result = (await sql.query(
      `UPDATE locations_stateinfo
       SET senior_deduction_amount = $1,
           senior_deduction_min_age = $2,
           senior_deduction_per_qualifying_person = $3,
           senior_deduction_tax_year = $4,
           senior_deduction_source_status = $5,
           senior_deduction_source_url = $6,
           senior_deduction_verified_on = $7
       WHERE state = $8
       RETURNING state`,
      [
        a.amount,
        a.minAge,
        a.perQualifyingPerson,
        a.taxYear,
        a.sourceStatus,
        a.sourceUrl,
        a.verifiedOn,
        a.state,
      ]
    )) as unknown[];

    if (result.length === 0) {
      console.log(`    ! ${a.state} has no locations_stateinfo row — skipped`);
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
