/*
 * Loads state Social Security tax treatment into locations_stateinfo from
 * data/state_ss_tax.csv.
 *
 * THIS IS RESEARCH DATA, NOT A DOWNLOAD. There is no clean machine-readable
 * public dataset for how each state taxes Social Security benefits; it comes
 * from reading state revenue department pages, or a maintained summary such as
 * AARP's or Kiplinger's, one state at a time. The CSV ships pre-populated with
 * all 50 state codes and empty values so the work is fill-in-the-blanks.
 *
 * EVERY ROW MUST CARRY A SOURCE URL AND A VERIFICATION DATE. Rows without both
 * are rejected, not imported with a warning. This is deliberate:
 * locations_stateinfo already holds retired_pay_tax for all 50 states with
 * vet_benefits_verified_on NULL for every one of them — unsourced data that now
 * drives real take-home numbers. The refusal exists so that does not repeat.
 *
 * COLUMNS
 *   state             two-letter USPS code, must already exist in the table
 *   SsTaxTreatment    not_taxed | partial | taxed | unknown
 *   ThresholdSingle   AGI at or below which benefits are exempt, single filer.
 *                     Blank means no threshold applies.
 *   ThresholdMarried  same, married filing jointly
 *   MinAge            age at year-end at or above which the exemption gate opens.
 *                     Blank means no age condition.
 *   AgeExemptsFully   true if reaching MinAge exempts SS regardless of AGI
 *                     (Colorado 65+). false/blank means MinAge is required in
 *                     addition to the threshold (Rhode Island FRA).
 *   SourceUrl         required unless treatment is `unknown`
 *   VerifiedOn        YYYY-MM-DD, required unless treatment is `unknown`
 *   Notes             free text; conditions the enum cannot capture
 *
 * A `partial` row SHOULD carry thresholds — that is what makes it partial. The
 * importer warns when it does not, because a threshold-less `partial` forces
 * lib/income.ts back to assuming benefits are fully taxed.
 *
 * Usage:
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/import-ss-tax.ts [csv] [--dry-run]
 */
import { readFileSync, existsSync } from "node:fs";
import { parse } from "csv-parse/sync";
import { getSql } from "../lib/db";

const DEFAULT_CSV = "data/state_ss_tax.csv";

/** Allowed enum values; anything else is a hard error, never coerced. */
const TREATMENTS = new Set(["not_taxed", "partial", "taxed", "unknown"]);

/** Plausible bounds for a state exemption threshold, in annual AGI dollars. */
const THRESHOLD_BOUNDS = { min: 1_000, max: 250_000 };

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const csvPath = args.find((a) => !a.startsWith("--")) ?? DEFAULT_CSV;

type Row = Record<string, string>;

const clean = (v: string | undefined): string | null => {
  if (v == null) return null;
  const t = String(v).trim();
  return t === "" || t === "?" || t === "NA" ? null : t;
};

/** Parse a threshold cell, or report why it is unusable. */
function parseThreshold(
  raw: string | undefined,
  label: string,
  problems: string[]
): number | null {
  const c = clean(raw);
  if (c === null) return null;
  const n = Number(c.replace(/[$,\s]/g, ""));
  if (!Number.isFinite(n)) {
    problems.push(`${label} is not a number: "${c}"`);
    return null;
  }
  if (n < THRESHOLD_BOUNDS.min || n > THRESHOLD_BOUNDS.max) {
    problems.push(
      `${label} ${n} is outside the plausible range ` +
        `${THRESHOLD_BOUNDS.min}-${THRESHOLD_BOUNDS.max}`
    );
    return null;
  }
  return Math.round(n);
}

function parseMinAge(
  raw: string | undefined,
  problems: string[]
): number | null {
  const c = clean(raw);
  if (c === null) return null;
  const n = Number(c);
  if (!Number.isInteger(n) || n < 55 || n > 75) {
    problems.push(`MinAge "${c}" is not an age in 55–75`);
    return null;
  }
  return n;
}

function parseAgeExemptsFully(
  raw: string | undefined,
  problems: string[]
): boolean | null {
  const c = clean(raw)?.toLowerCase() ?? null;
  if (c === null) return null;
  if (c === "true" || c === "yes" || c === "1") return true;
  if (c === "false" || c === "no" || c === "0") return false;
  problems.push(`AgeExemptsFully "${raw}" is not true/false`);
  return null;
}

interface Parsed {
  state: string;
  treatment: string;
  thresholdSingle: number | null;
  thresholdMarried: number | null;
  minAge: number | null;
  ageExemptsFully: boolean | null;
  sourceUrl: string | null;
  verifiedOn: string | null;
  notes: string | null;
}

async function main() {
  console.log(`Social Security state tax import${dryRun ? " (dry run)" : ""}`);

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

    const treatment = clean(row.SsTaxTreatment)?.toLowerCase() ?? null;

    // An untouched template row is not an error — it is work not yet done.
    if (treatment === null) {
      blank.push(state);
      continue;
    }

    const problems: string[] = [];

    if (!TREATMENTS.has(treatment)) {
      problems.push(
        `treatment "${treatment}" is not one of ${[...TREATMENTS].join(", ")}`
      );
    }

    const thresholdSingle = parseThreshold(row.ThresholdSingle, "ThresholdSingle", problems);
    const thresholdMarried = parseThreshold(row.ThresholdMarried, "ThresholdMarried", problems);
    const minAge = parseMinAge(row.MinAge, problems);
    const ageExemptsFully = parseAgeExemptsFully(row.AgeExemptsFully, problems);

    const sourceUrl = clean(row.SourceUrl);
    const verifiedOn = clean(row.VerifiedOn);

    // `unknown` is an honest answer and needs no citation. Everything else is a
    // claim about tax law and must say where it came from.
    if (treatment !== "unknown") {
      if (!sourceUrl) problems.push("SourceUrl is required");
      if (!verifiedOn) problems.push("VerifiedOn is required");
      else if (!/^\d{4}-\d{2}-\d{2}$/.test(verifiedOn)) {
        problems.push(`VerifiedOn "${verifiedOn}" is not YYYY-MM-DD`);
      }
    }

    if (treatment === "not_taxed" && (thresholdSingle || thresholdMarried)) {
      problems.push(
        "not_taxed with a threshold is contradictory — use `partial` if benefits are taxed above a line"
      );
    }

    if (ageExemptsFully && minAge === null) {
      problems.push("AgeExemptsFully=true requires MinAge");
    }

    if (problems.length) {
      rejected.push({ state, problems });
      continue;
    }

    if (treatment === "partial" && !thresholdSingle && !thresholdMarried) {
      warnings.push(
        `${state}: partial with no threshold — income model will assume fully taxed`
      );
    }

    accepted.push({
      state,
      treatment,
      thresholdSingle,
      thresholdMarried,
      minAge,
      ageExemptsFully,
      sourceUrl,
      verifiedOn,
      notes: clean(row.Notes),
    });
  }

  /* ---- report ---- */
  const byTreatment = new Map<string, number>();
  for (const a of accepted) {
    byTreatment.set(a.treatment, (byTreatment.get(a.treatment) ?? 0) + 1);
  }
  console.log(`  accepted ${accepted.length}`);
  for (const [t, n] of [...byTreatment].sort((a, b) => b[1] - a[1])) {
    console.log(`    ${t.padEnd(12)} ${n}`);
  }

  if (blank.length) {
    console.log(`\n  not yet researched (${blank.length}): ${blank.join(" ")}`);
  }

  if (warnings.length) {
    console.log("\n  warnings:");
    for (const w of warnings) console.log(`    ${w}`);
  }

  if (rejected.length) {
    console.log(`\n  REJECTED ${rejected.length} — not written:`);
    for (const r of rejected) {
      console.log(`    ${r.state}: ${r.problems.join("; ")}`);
    }
  }

  if (accepted.length === 0) {
    console.log(
      "\nNothing to import. Fill in data/state_ss_tax.csv — every row needs a\n" +
        "treatment, and every non-`unknown` row needs a SourceUrl and VerifiedOn."
    );
    if (rejected.length) process.exitCode = 1;
    return;
  }

  if (dryRun) {
    console.log("\nDry run complete — nothing written.");
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
       SET ss_tax_treatment = $1,
           ss_tax_threshold_single = $2,
           ss_tax_threshold_married = $3,
           ss_tax_min_age = $4,
           ss_tax_age_exempts_fully = $5,
           ss_tax_source_url = $6,
           ss_tax_verified_on = $7
       WHERE state = $8
       RETURNING state`,
      [
        a.treatment,
        a.thresholdSingle,
        a.thresholdMarried,
        a.minAge,
        a.ageExemptsFully,
        a.sourceUrl,
        a.verifiedOn,
        a.state,
      ]
    )) as unknown[];

    // Rows are only ever updated, never inserted: a state code with no
    // locations_stateinfo row is a typo in the CSV, not a new state.
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
