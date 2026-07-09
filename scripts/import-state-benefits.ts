/*
 * Loads state-level veteran benefit data into locations_stateinfo.
 *
 * Usage:
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/import-state-benefits.ts [csv] [--dry-run]
 *
 * Defaults to data/state_vet_benefits.csv. Adds the vet-benefit columns if they
 * don't exist yet (idempotent), then upserts one row per state keyed on `state`.
 *
 * Boolean columns are THREE-VALUED on purpose: an empty cell means "the source
 * summary didn't mention it", which is not the same as "the state doesn't offer
 * it". Filter with `IS TRUE`, never `= false`, or you'll silently exclude states
 * whose summary was just terser.
 */
import { readFileSync } from "node:fs";
import { parse } from "csv-parse/sync";
import { getSql } from "../lib/db";

type Row = Record<string, string>;

const DEFAULT_CSV = "data/state_vet_benefits.csv";

/** Allowed values for the retired_pay_tax enum; anything else is a hard error. */
const RETIRED_PAY_TAX = new Set([
  "no_income_tax", // state levies no broad individual income tax
  "exempt", // retired pay fully excluded
  "partial", // a capped/percentage exclusion
  "conditional", // gated on age, income, disability, or service dates
  "taxed", // no exclusion
  "unknown", // source summary was silent — needs verification
]);

const cleanEmpty = (v: string | undefined): string | null => {
  if (v == null) return null;
  const t = String(v).trim();
  return t === "" || t === "?" || t === "NA" ? null : t;
};

/** null when the cell is blank — "not mentioned", not "absent". */
const parseBoolV = (v: string | undefined): boolean | null => {
  const c = cleanEmpty(v);
  if (c === null) return null;
  return ["y", "yes", "true", "t", "1"].includes(c.toLowerCase());
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

function parseRow(row: Row): Record<string, unknown> {
  const state = cleanEmpty(row["state"])?.toUpperCase();
  if (!state || state.length !== 2) {
    throw new Error(`bad state code: ${JSON.stringify(row["state"])}`);
  }

  const retiredPayTax = cleanEmpty(row["RetiredPayTax"])?.toLowerCase() ?? "unknown";
  if (!RETIRED_PAY_TAX.has(retiredPayTax)) {
    throw new Error(`bad RetiredPayTax for ${state}: ${retiredPayTax}`);
  }

  return {
    state,
    no_income_tax: parseBoolV(row["NoIncomeTax"]),
    retired_pay_tax: retiredPayTax,
    disabled_vet_property_tax: parseBoolV(row["DisabledVetPropertyTax"]),
    employment_preference: parseBoolV(row["EmploymentPreference"]),
    education_benefit: parseBoolV(row["EducationBenefit"]),
    parks_benefit: parseBoolV(row["ParksBenefit"]),
    hunt_fish_benefit: parseBoolV(row["HuntFishBenefit"]),
    vet_benefits_summary: cleanEmpty(row["Summary"]),
    // Deliberately null: nothing in this dataset has been checked against a
    // primary source. Render benefit copy only once this is populated.
    vet_benefits_verified_on: null,
  };
}

async function upsert(data: Record<string, unknown>): Promise<"created" | "updated"> {
  const sql = getSql();
  const cols = Object.keys(data);
  const placeholders = cols.map((_, i) => `$${i + 1}`).join(", ");
  // `state` is the primary key, so ON CONFLICT gives us a clean upsert and
  // xmax tells us whether this row was inserted or updated.
  const updates = cols
    .filter((c) => c !== "state")
    .map((c) => `${c} = EXCLUDED.${c}`)
    .join(", ");

  // created_at/updated_at are NOT NULL with no database default, and NOT NULL is
  // enforced while building the candidate row — i.e. before ON CONFLICT can fire.
  // So they must be supplied even on the update path, which never uses them.
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
  console.log(`Importing state vet benefits from: ${csvPath}${dryRun ? " (dry run)" : ""}`);

  await ensureColumns(dryRun);

  let created = 0,
    updated = 0,
    errors = 0;
  for (let i = 0; i < rows.length; i++) {
    try {
      const data = parseRow(rows[i]);
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
}

main();
