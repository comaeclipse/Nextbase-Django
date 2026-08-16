/*
 * Import explicit retail-access booleans for existing curated locations.
 *
 * Usage:
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/import-retail-access.ts <csv> [--dry-run]
 *
 * Expected columns:
 *   City,State,HasWalmart,HasCostco
 */
import { readFileSync } from "node:fs";
import { parse } from "csv-parse/sync";
import { getSql } from "../lib/db";

type Row = Record<string, string | undefined>;

const BOOLEAN_VALUES = new Set(["y", "yes", "true", "t", "1", "n", "no", "false", "f", "0"]);

function clean(value: string | undefined): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function parseBool(value: string | undefined, column: string, label: string): boolean {
  const cleaned = clean(value);
  if (cleaned === null) throw new Error(`${label}: ${column} is blank`);
  const normalized = cleaned.toLowerCase();
  if (!BOOLEAN_VALUES.has(normalized)) {
    throw new Error(`${label}: ${column} must be an explicit Yes/No value`);
  }
  return ["y", "yes", "true", "t", "1"].includes(normalized);
}

function parseRow(row: Row, index: number) {
  const city = clean(row.City);
  const state = clean(row.State);
  const label = city && state ? `${city}, ${state}` : `row ${index + 2}`;
  if (!city) throw new Error(`${label}: City is blank`);
  if (!state) throw new Error(`${label}: State is blank`);
  return {
    city,
    state,
    hasWalmart: parseBool(row.HasWalmart, "HasWalmart", label),
    hasCostco: parseBool(row.HasCostco, "HasCostco", label),
  };
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const csvPath = args.find((arg) => !arg.startsWith("--"));
  if (!csvPath) {
    console.error("Usage: import-retail-access <csv> [--dry-run]");
    process.exit(1);
  }

  const rows = parse(readFileSync(csvPath, "utf8"), {
    columns: true,
    skip_empty_lines: true,
  }) as Row[];
  const parsed = rows.map(parseRow);
  const sql = getSql();

  const targets = [];
  for (const row of parsed) {
    const found = (await sql.query(
      "SELECT id, name, state, has_walmart, has_costco FROM locations_location WHERE name = $1 AND state = $2",
      [row.city, row.state]
    )) as {
      id: string | number;
      name: string;
      state: string;
      has_walmart: boolean | null;
      has_costco: boolean | null;
    }[];
    if (found.length !== 1) {
      throw new Error(`${row.city}, ${row.state}: expected 1 matching location, found ${found.length}`);
    }
    targets.push({ ...row, id: Number(found[0].id), before: found[0] });
  }

  console.log(`Importing retail access from: ${csvPath}${dryRun ? " (dry run)" : ""}`);
  for (const target of targets) {
    if (dryRun) {
      console.log(
        `  = Would update: ${target.city}, ${target.state} ` +
          `(Walmart=${target.hasWalmart ? "Y" : "N"}, Costco=${target.hasCostco ? "Y" : "N"})`
      );
      continue;
    }
    await sql.query(
      `UPDATE locations_location
       SET has_walmart = $1, has_costco = $2, updated_at = now()
       WHERE id = $3`,
      [target.hasWalmart, target.hasCostco, target.id]
    );
    console.log(
      `  ~ Updated: ${target.city}, ${target.state} ` +
        `(Walmart=${target.hasWalmart ? "Y" : "N"}, Costco=${target.hasCostco ? "Y" : "N"})`
    );
  }
  console.log(dryRun ? `\nDry run complete. ${targets.length} row(s) checked.` : `\nImport complete. Updated: ${targets.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
