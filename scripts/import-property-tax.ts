/*
 * Import county-level effective property tax rates into
 * locations_location.property_tax_rate.
 *
 * WHY THIS IS P0: for a retiree who owns outright, property tax plus insurance
 * essentially IS the housing cost — there is no mortgage to dominate it. Until
 * this lands, every ownership estimate falls back to a national average and
 * flags itself as approximated, and a national average hides roughly an 8x
 * spread between the cheapest and dearest states.
 *
 * SOURCE DATA (human in the loop — this script does not download):
 *   Tax Foundation publishes county-level effective property tax rates
 *   (median property taxes paid as a share of median home value). Download the
 *   county-level table as CSV and save it to:
 *     data/sources/property-tax/county-effective-rates.csv
 *   Any CSV works as long as it has a state column, a county column, and a rate
 *   column; the script detects the headers and prints what it matched them to.
 *
 * Usage:
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/import-property-tax.ts [--dry-run]
 *   ... --file path/to/other.csv     use a different source CSV
 *   ... --location-id 113            restrict to one city (debugging)
 */
import fs from "node:fs";
import path from "node:path";
import { parse } from "csv-parse/sync";
import { getSql } from "../lib/db";
import { STATE_NAME_TO_ABBR } from "../lib/states";
import { normalizeCounty, geoKey } from "./lib/place-names";

const SOURCE_DIR = path.join("data", "sources", "property-tax");
const DEFAULT_SOURCE = path.join(SOURCE_DIR, "county-effective-rates.csv");
const REPORT_PATH = path.join(SOURCE_DIR, "match-report.md");

const dryRun = process.argv.includes("--dry-run");
const fileArg = argValue("--file") ?? DEFAULT_SOURCE;
const onlyId = argValue("--location-id");

/**
 * When `locations_location.county` does not match the Tax Foundation /
 * ACS county-equivalent spelling, map `state|normalizeCounty(county)` onto
 * the normalized source key. Connecticut replaced counties with COG planning
 * regions in ACS products; Anchorage's legacy county label is "Alaska".
 */
const COUNTY_JOIN_ALIASES: Record<string, string> = {
  "ak|alaska": "anchorage", // Anchorage Municipality
  "ct|fairfield": "greater bridgeport", // Greater Bridgeport Planning Region
  "ct|hartford": "capitol", // Capitol Planning Region
};

/**
 * Plausible bounds for a US effective property tax rate, as a fraction.
 * Real county rates run roughly 0.2% to 2.6%; anything outside this is a unit
 * error (a percent read as a fraction, or a dollar amount) rather than a real
 * county, so it is rejected loudly instead of written.
 */
const RATE_BOUNDS = { min: 0.001, max: 0.04 };

function argValue(flag: string): string | null {
  const i = process.argv.indexOf(flag);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : null;
}

/** Find the first header matching any pattern, so header drift doesn't break us. */
function detectColumn(headers: string[], patterns: RegExp[]): string | null {
  for (const pattern of patterns) {
    const hit = headers.find((h) => pattern.test(h));
    if (hit) return hit;
  }
  return null;
}

/** Strip currency/percent decoration and parse, or null. */
function rawNumber(raw: string): number | null {
  const cleaned = raw.replace(/[$,%\s]/g, "");
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * Decide ONCE, for the whole column, whether rates are percents or fractions.
 *
 * This cannot be decided per value. Sources publish "1.25", "1.25%", or
 * "0.0125" interchangeably, and a per-value rule like "over 1 means percent"
 * silently rejects every genuinely sub-1% county — Colorado runs about 0.51%,
 * which such a rule reads as a 51% fraction and discards. Getting this wrong is
 * a 100x error in the single largest ownership cost.
 *
 * The column as a whole separates cleanly, because real US effective rates span
 * roughly 0.2%-2.6%:
 *   as fractions -> 0.002 .. 0.026   (all below 0.1)
 *   as percents  -> 0.2   .. 2.6     (all at or above 0.1)
 * So the median decides it, with no overlap between the two regimes.
 */
function detectScale(values: number[]): { divisor: number; label: string } {
  if (values.length === 0) return { divisor: 1, label: "unknown (no values)" };
  const sorted = [...values].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  return median >= 0.1
    ? { divisor: 100, label: `percent (median ${median})` }
    : { divisor: 1, label: `fraction (median ${median})` };
}

/** Apply the detected scale and reject implausible results. */
function toRate(n: number, divisor: number): number | null {
  const fraction = n / divisor;
  if (fraction < RATE_BOUNDS.min || fraction > RATE_BOUNDS.max) return null;
  return Math.round(fraction * 100000) / 100000; // numeric(6,5)
}

async function main() {
  console.log(`Property tax import${dryRun ? " (dry run)" : ""}`);

  if (!fs.existsSync(fileArg)) {
    console.error(
      `\nNo source file at ${fileArg}\n\n` +
        "This importer does not download. Get the county-level effective\n" +
        "property tax rate table from the Tax Foundation, save it as CSV to\n" +
        `  ${DEFAULT_SOURCE}\n` +
        "and re-run. Record where you got it and on what date in\n" +
        `  ${REPORT_PATH}\n`
    );
    process.exit(1);
  }

  const rows = parse(fs.readFileSync(fileArg, "utf8"), {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as Record<string, string>[];

  if (rows.length === 0) {
    console.error("Source file has no rows.");
    process.exit(1);
  }

  const headers = Object.keys(rows[0]);
  const stateCol = detectColumn(headers, [/^state$/i, /state.*name/i, /^st$/i]);
  const countyCol = detectColumn(headers, [/county/i, /parish/i, /^name$/i]);
  const rateCol = detectColumn(headers, [
    /effective.*rate/i,
    /rate.*effective/i,
    /property.*tax.*rate/i,
    /^rate$/i,
    /percent/i,
  ]);

  console.log(`  source: ${fileArg} (${rows.length} rows)`);
  console.log(`  state column:  ${stateCol ?? "NOT FOUND"}`);
  console.log(`  county column: ${countyCol ?? "NOT FOUND"}`);
  console.log(`  rate column:   ${rateCol ?? "NOT FOUND"}`);

  if (!stateCol || !countyCol || !rateCol) {
    console.error(
      `\nCould not identify the needed columns. Headers present:\n  ${headers.join(", ")}\n` +
        "Rename them in the CSV, or extend the detectColumn patterns above."
    );
    process.exit(1);
  }

  // Decide percent-vs-fraction from the whole column before parsing any row.
  const rawValues = rows
    .map((r) => rawNumber(r[rateCol] ?? ""))
    .filter((n): n is number => n !== null);
  const scale = detectScale(rawValues);
  console.log(`  rate units:    ${scale.label}`);

  // Build the county -> rate lookup.
  const byCounty = new Map<string, number>();
  const rejected: string[] = [];
  for (const row of rows) {
    const stateRaw = row[stateCol]?.trim();
    if (!stateRaw) continue;
    const abbr =
      stateRaw.length === 2
        ? stateRaw.toUpperCase()
        : STATE_NAME_TO_ABBR[stateRaw];
    if (!abbr) continue;

    const raw = rawNumber(row[rateCol] ?? "");
    const rate = raw === null ? null : toRate(raw, scale.divisor);
    if (rate === null) {
      rejected.push(`${row[countyCol] ?? "?"}, ${abbr} = ${row[rateCol] ?? "(blank)"}`);
      continue;
    }
    byCounty.set(geoKey(abbr, normalizeCounty(row[countyCol] ?? "")), rate);
  }
  console.log(`  parsed ${byCounty.size} counties (${rejected.length} rows rejected)`);
  if (rejected.length) {
    // Show these: a large reject count usually means the units were misread,
    // not that the source is full of bad counties.
    for (const r of rejected.slice(0, 10)) console.log(`    rejected: ${r}`);
    if (rejected.length > 10) console.log(`    ... and ${rejected.length - 10} more`);
  }

  const sql = getSql();
  const locations = (await sql.query(
    `SELECT id, name, state, county FROM locations_location
     ${onlyId ? "WHERE id = $1" : ""}
     ORDER BY name`,
    onlyId ? [onlyId] : []
  )) as { id: number; name: string; state: string; county: string | null }[];

  const matched: { id: number; label: string; county: string; rate: number }[] = [];
  const unmatched: { label: string; county: string }[] = [];

  for (const loc of locations) {
    const label = `${loc.name}, ${loc.state}`;
    if (!loc.county) {
      unmatched.push({ label, county: "(no county on file)" });
      continue;
    }
    const base =
      COUNTY_JOIN_ALIASES[geoKey(loc.state, normalizeCounty(loc.county))] ??
      normalizeCounty(loc.county);
    // Independent cities (VA/MD/MO) are their own county-equivalent, recorded
    // in locations_location.county as their own name (e.g. Baltimore, MD has
    // county="Baltimore") and spelled "<name> city" in the source. "city"
    // isn't a stripped suffix in normalizeCounty because several states also
    // have a same-named County (Fairfax, Franklin, Richmond, Roanoke,
    // Baltimore, St. Louis) whose "<name> County" row would otherwise
    // normalize to the same `base` and shadow the city's own rate on the
    // primary lookup. Detect the independent-city case from the location's
    // own name equaling its county field, and try the "city" row first so a
    // same-named county can't win by collision.
    const isLikelyIndependentCity = normalizeCounty(loc.name) === base;
    let rate = isLikelyIndependentCity
      ? byCounty.get(geoKey(loc.state, `${base} city`))
      : undefined;
    if (rate === undefined) rate = byCounty.get(geoKey(loc.state, base));
    if (rate === undefined) rate = byCounty.get(geoKey(loc.state, `${base} city`));
    if (rate === undefined) unmatched.push({ label, county: loc.county });
    else matched.push({ id: loc.id, label, county: loc.county, rate });
  }

  console.log(
    `\n  matched ${matched.length}/${locations.length} cities` +
      ` (${unmatched.length} unmatched)`
  );

  if (!dryRun) {
    for (const m of matched) {
      await sql.query(
        "UPDATE locations_location SET property_tax_rate = $1 WHERE id = $2",
        [m.rate, m.id]
      );
    }
    console.log(`  wrote ${matched.length} rows`);
  }

  if (unmatched.length) {
    console.log("\n  Unmatched (these keep the national-average fallback):");
    for (const u of unmatched.slice(0, 25)) {
      console.log(`    ${u.label.padEnd(28)} county=${u.county}`);
    }
    if (unmatched.length > 25) console.log(`    ... and ${unmatched.length - 25} more`);
    console.log(
      "\n  Most misses are county-name spelling differences. Check the county\n" +
        "  column on those rows before assuming the source lacks them."
    );
  }

  writeReport(fileArg, matched, unmatched);
  console.log(`\n  report: ${REPORT_PATH}`);
  console.log(dryRun ? "\nDry run complete — nothing written." : "\nImport complete.");
}

function writeReport(
  source: string,
  matched: { label: string; county: string; rate: number }[],
  unmatched: { label: string; county: string }[]
) {
  fs.mkdirSync(SOURCE_DIR, { recursive: true });
  const today = new Date().toISOString().slice(0, 10);
  const lines = [
    "# Property tax match report",
    "",
    `- Generated: ${today}`,
    `- Source file: \`${source}\``,
    `- Source: Tax Foundation, "Property Taxes by State and County, 2026" - Table 1, "Median Property Taxes Paid by County, 2024 (5-Year Estimate)" (ACS 2020-2024 5-year)`,
    `- URL: https://taxfoundation.org/data/all/state/property-taxes-by-state-county/`,
    `- County join aliases: Anchorage \`Alaska\`->\`anchorage\`; CT Fairfield->Greater Bridgeport; CT Hartford->Capitol planning regions`,
    "",
    `Matched ${matched.length}, unmatched ${unmatched.length}.`,
    "",
    "## Matched",
    "",
    "| City | County | Effective rate |",
    "| --- | --- | --- |",
    ...matched.map(
      (m) => `| ${m.label} | ${m.county} | ${(m.rate * 100).toFixed(3)}% |`
    ),
    "",
    "## Unmatched",
    "",
    unmatched.length === 0
      ? "None."
      : ["| City | County on file |", "| --- | --- |"]
          .concat(unmatched.map((u) => `| ${u.label} | ${u.county} |`))
          .join("\n"),
    "",
  ];
  fs.writeFileSync(REPORT_PATH, lines.join("\n"));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
