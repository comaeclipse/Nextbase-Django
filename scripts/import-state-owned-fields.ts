/*
 * Imports sourced, adjudicated state-owned facts into locations_stateinfo.
 *
 * Blank cells are ignored so a partial adjudication batch cannot erase existing
 * state facts. Any populated value must carry its matching source URL and
 * verified-on date in the same row.
 *
 * Usage:
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/import-state-owned-fields.ts <csv> [--dry-run]
 */
import { readFileSync } from "node:fs";
import { parse } from "csv-parse/sync";
import { getSql } from "../lib/db";

type Row = Record<string, string | undefined>;

const cleanEmpty = (v: string | undefined): string | null => {
  if (v == null) return null;
  const t = String(v).trim();
  return t === "" || t === "?" || t.toLowerCase() === "na" || t.toLowerCase() === "n/a" ? null : t;
};

const parseDecimal = (v: string | undefined): number | null => {
  const c = cleanEmpty(v);
  if (c === null) return null;
  const n = Number(c);
  if (!Number.isFinite(n)) throw new Error(`bad decimal: ${JSON.stringify(v)}`);
  return n;
};

function requireDate(value: string | null, label: string, state: string): string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`${state}: ${label} must be YYYY-MM-DD`);
  }
  return value;
}

function requireSource(value: string | null, label: string, state: string): string {
  if (!value || !/^https?:\/\//i.test(value)) {
    throw new Error(`${state}: ${label} must be an http(s) URL`);
  }
  return value;
}

function addSourcedText(
  out: Record<string, unknown>,
  row: Row,
  state: string,
  valueColumn: string,
  dbColumn: string,
  sourceColumn: string,
  sourceDbColumn: string,
  verifiedColumn: string,
  verifiedDbColumn: string
) {
  const value = cleanEmpty(row[valueColumn]);
  if (value === null) return;
  out[dbColumn] = value;
  out[sourceDbColumn] = requireSource(cleanEmpty(row[sourceColumn]), sourceColumn, state);
  out[verifiedDbColumn] = requireDate(cleanEmpty(row[verifiedColumn]), verifiedColumn, state);
}

function addSourcedDecimal(
  out: Record<string, unknown>,
  row: Row,
  state: string,
  valueColumn: string,
  dbColumn: string,
  sourceColumn: string,
  sourceDbColumn: string,
  verifiedColumn: string,
  verifiedDbColumn: string
) {
  const value = parseDecimal(row[valueColumn]);
  if (value === null) return;
  out[dbColumn] = value;
  out[sourceDbColumn] = requireSource(cleanEmpty(row[sourceColumn]), sourceColumn, state);
  out[verifiedDbColumn] = requireDate(cleanEmpty(row[verifiedColumn]), verifiedColumn, state);
}

function parseRow(row: Row): Record<string, unknown> {
  const state = cleanEmpty(row.state)?.toUpperCase();
  if (!state || !/^[A-Z]{2}$/.test(state)) {
    throw new Error(`bad state code: ${JSON.stringify(row.state)}`);
  }

  const data: Record<string, unknown> = { state };
  addSourcedText(data, row, state, "StateParty", "state_party", "StatePartySourceUrl", "state_party_source_url", "StatePartyVerifiedOn", "state_party_verified_on");
  addSourcedText(data, row, state, "Governor", "governor", "GovernorSourceUrl", "governor_source_url", "GovernorVerifiedOn", "governor_verified_on");

  const incomeTax = parseDecimal(row.IncomeTax);
  if (incomeTax !== null) {
    data.income_tax = incomeTax;
    const semantics = cleanEmpty(row.IncomeTaxSemantics);
    if (!semantics) throw new Error(`${state}: IncomeTaxSemantics is required when IncomeTax is populated`);
    data.income_tax_semantics = semantics;
    data.income_tax_source_url = requireSource(cleanEmpty(row.IncomeTaxSourceUrl), "IncomeTaxSourceUrl", state);
    data.income_tax_verified_on = requireDate(cleanEmpty(row.IncomeTaxVerifiedOn), "IncomeTaxVerifiedOn", state);
  }

  addSourcedText(data, row, state, "MarijuanaStatus", "marijuana_status", "MarijuanaStatusSourceUrl", "marijuana_status_source_url", "MarijuanaStatusVerifiedOn", "marijuana_status_verified_on");
  addSourcedDecimal(data, row, state, "LGBTQStatePolicyScore", "lgbtq_state_policy_score", "LGBTQStatePolicySourceUrl", "lgbtq_state_policy_source_url", "LGBTQStatePolicyVerifiedOn", "lgbtq_state_policy_verified_on");

  if (Object.keys(data).length === 1) {
    throw new Error(`${state}: no state-owned values provided`);
  }
  return data;
}

async function upsert(data: Record<string, unknown>, dryRun: boolean): Promise<"created" | "updated" | "dry-run"> {
  const cols = Object.keys(data);
  if (dryRun) return "dry-run";

  const sql = getSql();
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
  const csvPath = args.find((a) => !a.startsWith("--"));
  if (!csvPath) {
    throw new Error("Usage: import-state-owned-fields.ts <csv> [--dry-run]");
  }

  const text = readFileSync(csvPath, "utf8");
  const rows: Row[] = parse(text, { columns: true, skip_empty_lines: true });
  console.log(`Importing state-owned facts from: ${csvPath}${dryRun ? " (dry run)" : ""}`);

  let created = 0;
  let updated = 0;
  let errors = 0;
  for (let i = 0; i < rows.length; i++) {
    try {
      const data = parseRow(rows[i]);
      const status = await upsert(data, dryRun);
      if (status === "created") created++;
      if (status === "updated") updated++;
      console.log(`  ${dryRun ? "=" : status === "created" ? "+" : "~"} ${data.state}: ${Object.keys(data).filter((c) => c !== "state").join(", ")}`);
    } catch (error) {
      errors++;
      console.error(`  X row ${i + 2}: ${(error as Error).message}`);
    }
  }

  console.log(
    dryRun
      ? `\nDry run complete. ${rows.length} row(s) parsed, ${errors} error(s).`
      : `\nImport complete. Created: ${created}, Updated: ${updated}, Errors: ${errors}`
  );
  if (errors > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
