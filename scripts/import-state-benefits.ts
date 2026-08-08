/*
 * Loads state-level veteran benefit data into locations_stateinfo.
 *
 * Usage:
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/import-state-benefits.ts [csv] [--dry-run]
 *
 * Defaults to data/state_vet_benefits.csv. Verification metadata, audited
 * retired-pay classifications, and primary-source corrections to stale blank
 * booleans live in data/state_vet_benefits_verification.csv.
 *
 * Boolean columns are THREE-VALUED on purpose: an empty source value means
 * "not established", not "false". The audit ledger may explicitly override a
 * stale blank/incorrect boolean when a primary source establishes the answer.
 * Filters must match `IS TRUE` / `=== true`, never infer false from NULL.
 */
import { readFileSync } from "node:fs";
import { parse } from "csv-parse/sync";
import { getSql } from "../lib/db";

type Row = Record<string, string>;
type VerificationRow = Record<string, string>;

const DEFAULT_CSV = "data/state_vet_benefits.csv";
const VERIFICATION_CSV = "data/state_vet_benefits_verification.csv";

const RETIRED_PAY_TAX = new Set([
  "no_income_tax",
  "exempt",
  "partial",
  "conditional",
  "taxed",
  "unknown",
]);

const cleanEmpty = (v: string | undefined): string | null => {
  if (v == null) return null;
  const t = String(v).trim();
  return t === "" || t === "?" || t === "NA" ? null : t;
};

const parseBoolV = (v: string | undefined): boolean | null => {
  const c = cleanEmpty(v);
  if (c === null) return null;
  const normalized = c.toLowerCase();
  if (["y", "yes", "true", "t", "1"].includes(normalized)) return true;
  if (["n", "no", "false", "f", "0"].includes(normalized)) return false;
  throw new Error(`bad boolean value: ${c}`);
};

/** Use an explicit audit override when present; otherwise preserve seed tri-state. */
const auditedBool = (
  seedValue: string | undefined,
  overrideValue: string | undefined
): boolean | null => {
  return cleanEmpty(overrideValue) === null
    ? parseBoolV(seedValue)
    : parseBoolV(overrideValue);
};

const COLUMNS = [
  ["no_income_tax", "boolean"],
  ["retired_pay_tax", "text"],
  ["disabled_vet_property_tax", "boolean"],
  ["employment_preference", "boolean"],
  ["education_benefit", "boolean"],
  ["parks_benefit", "boolean"],
  ["hunt_fish_benefit", "boolean"],
  ["vet_benefits_summary", "text"],
  ["vet_benefits_verified_on", "date"],
  ["source_url", "text"],
] as const;

async function ensureColumns(dryRun: boolean) {
  const sql = getSql();
  for (const [name, type] of COLUMNS) {
    if (dryRun) {
      console.log(`  = Would ensure column ${name} ${type}`);
      continue;
    }
    await sql.query(
      `ALTER TABLE locations_stateinfo ADD COLUMN IF NOT EXISTS ${name} ${type}`,
      []
    );
  }
}

function loadVerification(): Map<string, VerificationRow> {
  const text = readFileSync(VERIFICATION_CSV, "utf-8");
  const rows: VerificationRow[] = parse(text, {
    columns: true,
    skip_empty_lines: true,
  });
  const byState = new Map<string, VerificationRow>();
  for (const row of rows) {
    const state = cleanEmpty(row.state)?.toUpperCase();
    if (!state || state.length !== 2) {
      throw new Error(`bad verification state: ${row.state}`);
    }
    if (byState.has(state)) throw new Error(`duplicate verification state: ${state}`);
    byState.set(state, row);
  }
  if (byState.size !== 50) {
    throw new Error(`verification ledger must contain 50 states; found ${byState.size}`);
  }
  return byState;
}

function parseRow(row: Row, verification: VerificationRow): Record<string, unknown> {
  const state = cleanEmpty(row["state"])?.toUpperCase();
  if (!state || state.length !== 2) {
    throw new Error(`bad state code: ${JSON.stringify(row["state"])}`);
  }

  const retiredPayTax =
    cleanEmpty(verification["RetiredPayTax"])?.toLowerCase() ?? "unknown";
  if (!RETIRED_PAY_TAX.has(retiredPayTax)) {
    throw new Error(`bad RetiredPayTax for ${state}: ${retiredPayTax}`);
  }

  const verifiedOn = cleanEmpty(verification["VerifiedOn"]);
  const sourceUrl = cleanEmpty(verification["SourceURL"]);
  if (!verifiedOn || !sourceUrl) {
    throw new Error(`${state}: every verification row requires VerifiedOn and SourceURL`);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(verifiedOn)) {
    throw new Error(`${state}: bad VerifiedOn date: ${verifiedOn}`);
  }
  if (!/^https:\/\//.test(sourceUrl)) {
    throw new Error(`${state}: SourceURL must be an https URL`);
  }
  if (retiredPayTax === "unknown") {
    throw new Error(`${state}: verified rows may not keep retired_pay_tax=unknown`);
  }

  return {
    state,
    no_income_tax: parseBoolV(row["NoIncomeTax"]),
    retired_pay_tax: retiredPayTax,
    disabled_vet_property_tax: auditedBool(
      row["DisabledVetPropertyTax"],
      verification["DisabledVetPropertyTaxOverride"]
    ),
    employment_preference: auditedBool(
      row["EmploymentPreference"],
      verification["EmploymentPreferenceOverride"]
    ),
    education_benefit: parseBoolV(row["EducationBenefit"]),
    parks_benefit: parseBoolV(row["ParksBenefit"]),
    hunt_fish_benefit: parseBoolV(row["HuntFishBenefit"]),
    vet_benefits_summary: cleanEmpty(row["Summary"]),
    vet_benefits_verified_on: verifiedOn,
    source_url: sourceUrl,
  };
}

async function upsert(data: Record<string, unknown>): Promise<"created" | "updated"> {
  const sql = getSql();
  const cols = Object.keys(data);
  const placeholders = cols.map((_, i) => `$${i + 1}`).join(", ");
  const updates = cols
    .filter((c) => c !== "state")
    .map((c) => `${c} = EXCLUDED.${c}`)
    .join(", ");

  const rows = (await sql.query(
    `INSERT INTO locations_stateinfo (${cols.join(", ")}, created_at, updated_at)
     VALUES (${placeholders}, now(), now())
     ON CONFLICT (state) DO UPDATE SET ${updates}, updated_at = now()
     RETURNING (xmax = 0) AS inserted`,
    cols.map((c) => data[c])
  )) as { inserted: boolean }[];

  return rows[0]?.inserted ? "created" : "updated";
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const csvPath = args.find((a) => !a.startsWith("--")) ?? DEFAULT_CSV;

  const text = readFileSync(csvPath, "utf-8");
  const rows: Row[] = parse(text, { columns: true, skip_empty_lines: true });
  const verification = loadVerification();
  console.log(`Importing state vet benefits from: ${csvPath}${dryRun ? " (dry run)" : ""}`);

  await ensureColumns(dryRun);

  let created = 0,
    updated = 0,
    errors = 0;
  for (let i = 0; i < rows.length; i++) {
    try {
      const state = cleanEmpty(rows[i].state)?.toUpperCase() ?? "";
      const verified = verification.get(state);
      if (!verified) {
        throw new Error(`${state || `row ${i + 2}`}: missing verification ledger entry`);
      }
      const data = parseRow(rows[i], verified);
      if (dryRun) {
        console.log(`  = Would upsert: ${data.state} (${data.retired_pay_tax})`);
        continue;
      }
      const result = await upsert(data);
      if (result === "created") {
        created++;
        console.log(`  + Created: ${data.state}`);
      } else {
        updated++;
        console.log(`  ~ Updated: ${data.state}`);
      }
    } catch (e) {
      errors++;
      console.error(`  X Error on row ${i + 2}: ${(e as Error).message}`);
    }
  }

  console.log(
    dryRun
      ? `\nDry run complete. ${rows.length} row(s) parsed, ${errors} error(s).`
      : `\nImport complete! Created: ${created}, Updated: ${updated}, Errors: ${errors}`
  );

  if (errors) process.exitCode = 1;
}

main();
