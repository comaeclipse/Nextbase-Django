/*
 * Import the issue-#170 housing metrics into locations_location from the
 * Census ACS 5-year estimates:
 *
 *   entry_home_value  <- B25076_001E  lower value quartile (25th percentile)
 *                        of owner-occupied units' self-reported value
 *   median_rent_2br   <- B25031_004E  median gross rent, 2-bedroom units
 *   median_rent_3br   <- B25031_005E  median gross rent, 3-bedroom units
 *
 * WHY B25076 AND NOT "CHEAPEST LISTING": entry_home_value is a FORMAL
 * percentile of the whole owner-occupied stock, so one burned-out
 * fixer-upper can never make a city look affordable. The trade-off, stated
 * plainly: ACS measures self-reported STOCK value across all structure
 * types (condos and mobile homes included), not sale prices of detached
 * single-family homes. Coverage and comparability won over the
 * closer-to-intent-but-partial sale-price percentiles (issue #170).
 *
 * WHY B25031 (GROSS rent by bedrooms): gross rent bundles utilities — the
 * same definition as the existing median_rent (B25064), so the three rent
 * columns stay mutually comparable.
 *
 * GEOGRAPHY: place-level first; county fallback PER VARIABLE (bedroom
 * medians suppress in small places where the all-size median survives).
 * Fallbacks are listed separately in the match report so the approximation
 * stays visible — same contract as import-median-rent.ts.
 *
 * Usage:
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/import-housing-metrics.ts [--dry-run]
 *   ... --skip-download     use the cached API responses in data/sources/housing-metrics
 *   ... --year 2024         Override the ACS 5-year vintage (default 2024)
 *   ... --no-county-fallback   place-level matches only
 *
 * A Census API key is REQUIRED — as of 2026 the Census Data API rejects ALL
 * keyless data queries (the old 500/day keyless allowance is gone; metadata
 * endpoints stay open). See import-median-rent.ts for why the keyless
 * failure mode is confusing (302 to an HTML page, not an error status).
 * Set CENSUS_API_KEY in .env; free signup at
 * https://api.census.gov/data/key_signup.html.
 */
import fs from "node:fs";
import path from "node:path";
import { getSql } from "../lib/db";
import { normalizePlace, normalizeCounty, geoKey, splitCensusName } from "./lib/place-names";

const SOURCE_DIR = path.join("data", "sources", "housing-metrics");
const REPORT_PATH = path.join(SOURCE_DIR, "match-report.md");

/** Column -> ACS variable, with per-variable plausibility bounds. */
const METRICS = [
  {
    column: "entry_home_value",
    variable: "B25076_001E",
    label: "entry home value (lower value quartile)",
    // Suppression sentinels are all NEGATIVE (-666666666 etc., see
    // census.gov "notes on ACS estimate and annotation values"), so any
    // positive floor catches them. Kept permissive ($1k) because ACS
    // bottom-codes value near $10k and a mobile-home-heavy small town can
    // legitimately have a lower quartile there. Top-coded at $2,000,001.
    bounds: { min: 1_000, max: 2_100_000 },
  },
  {
    column: "median_rent_2br",
    variable: "B25031_004E",
    label: "median gross rent, 2br",
    bounds: { min: 200, max: 8_000 },
  },
  {
    column: "median_rent_3br",
    variable: "B25031_005E",
    label: "median gross rent, 3br",
    bounds: { min: 200, max: 8_000 },
  },
] as const;

type MetricColumn = (typeof METRICS)[number]["column"];

const dryRun = process.argv.includes("--dry-run");
const skipDownload = process.argv.includes("--skip-download");
const noCountyFallback = process.argv.includes("--no-county-fallback");
const year = argValue("--year") ?? "2024";

const STATE_FIPS: Record<string, string> = {
  AL: "01", AK: "02", AZ: "04", AR: "05", CA: "06", CO: "08", CT: "09",
  DE: "10", DC: "11", FL: "12", GA: "13", HI: "15", ID: "16", IL: "17",
  IN: "18", IA: "19", KS: "20", KY: "21", LA: "22", ME: "23", MD: "24",
  MA: "25", MI: "26", MN: "27", MS: "28", MO: "29", MT: "30", NE: "31",
  NV: "32", NH: "33", NJ: "34", NM: "35", NY: "36", NC: "37", ND: "38",
  OH: "39", OK: "40", OR: "41", PA: "42", RI: "44", SC: "45", SD: "46",
  TN: "47", TX: "48", UT: "49", VT: "50", VA: "51", WA: "53", WV: "54",
  WI: "55", WY: "56",
};

/** Same reviewed alias set as import-median-rent.ts — keep the two in sync. */
const PLACE_ALIASES: Record<string, string> = {
  "HI|Honolulu": "Urban Honolulu",
  "IN|Indianopolis": "Indianapolis city (balance)",
  "KY|Louisville": "Louisville/Jefferson County metro government (balance)",
  "TN|Nashville": "Nashville-Davidson metropolitan government (balance)",
};

function argValue(flag: string): string | null {
  const i = process.argv.indexOf(flag);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : null;
}

function parseValue(
  raw: string | null,
  bounds: { min: number; max: number }
): number | null {
  if (raw === null) return null;
  const n = Number(raw);
  if (!Number.isFinite(n)) return null;
  if (n < bounds.min || n > bounds.max) return null; // catches ACS sentinels
  return Math.round(n);
}

type Geography = "place" | "county";

function cachePath(geo: Geography, fips: string): string {
  return path.join(SOURCE_DIR, `${year}-${geo}-${fips}.json`);
}

/** Fetch one state's rows (all three variables in one call), caching raw. */
async function fetchGeo(geo: Geography, fips: string): Promise<string[][]> {
  const cached = cachePath(geo, fips);
  if (skipDownload || fs.existsSync(cached)) {
    if (!fs.existsSync(cached)) return [];
    return JSON.parse(fs.readFileSync(cached, "utf8"));
  }

  const variables = METRICS.map((m) => m.variable).join(",");
  const url =
    `https://api.census.gov/data/${year}/acs/acs5?get=NAME,${variables}` +
    `&for=${geo}:*&in=state:${fips}&key=${process.env.CENSUS_API_KEY}`;

  const res = await fetch(url);
  const body = await res.text();

  if (!res.ok) {
    console.log(`    ! ${geo} ${fips}: HTTP ${res.status}`);
    return [];
  }
  if (res.redirected && res.url.includes("missing_key")) {
    throw new Error(
      "Census rejected the API key. Check CENSUS_API_KEY in .env — a new key " +
        "can take a few minutes to activate after signup."
    );
  }
  if (!body.trimStart().startsWith("[")) {
    console.log(
      `    ! ${geo} ${fips}: expected JSON, got ${body.trimStart().slice(0, 60)}...`
    );
    return [];
  }

  let data: string[][];
  try {
    data = JSON.parse(body) as string[][];
  } catch {
    console.log(`    ! ${geo} ${fips}: unparseable JSON`);
    return [];
  }

  fs.mkdirSync(SOURCE_DIR, { recursive: true });
  fs.writeFileSync(cached, JSON.stringify(data));
  return data;
}

type MetricValues = Partial<Record<MetricColumn, number>>;

/** ACS response -> normalized-name -> per-variable values for one state. */
function toLookup(
  rows: string[][],
  abbr: string,
  normalize: (s: string) => string
): Map<string, MetricValues> {
  const out = new Map<string, MetricValues>();
  if (rows.length < 2) return out;

  const header = rows[0];
  const nameIdx = header.indexOf("NAME");
  if (nameIdx < 0) return out;
  const valueIdx = new Map(
    METRICS.map((m) => [m.column, header.indexOf(m.variable)] as const)
  );

  for (const row of rows.slice(1)) {
    const split = splitCensusName(row[nameIdx] ?? "");
    if (!split) continue;
    const values: MetricValues = {};
    for (const metric of METRICS) {
      const idx = valueIdx.get(metric.column)!;
      if (idx < 0) continue;
      const value = parseValue(row[idx] ?? null, metric.bounds);
      if (value !== null) values[metric.column] = value;
    }
    if (Object.keys(values).length > 0) {
      out.set(geoKey(abbr, normalize(split.place)), values);
    }
  }
  return out;
}

type Resolution = {
  id: number;
  label: string;
  column: MetricColumn;
  value: number;
  via: "place" | "county";
  county?: string;
};

async function main() {
  console.log(
    `Housing metrics import${dryRun ? " (dry run)" : ""} — ACS ${year} 5-year: ` +
      METRICS.map((m) => m.variable).join(", ")
  );

  if (!skipDownload && !process.env.CENSUS_API_KEY) {
    console.error(
      "\nCENSUS_API_KEY is not set — see scripts/import-median-rent.ts for the\n" +
        "signup link and why the keyless failure mode is misleading.\n" +
        "Already have cached responses? Re-run with --skip-download.\n"
    );
    process.exit(1);
  }

  const sql = getSql();
  const locations = (await sql.query(
    "SELECT id, name, state, county FROM locations_location ORDER BY name"
  )) as { id: number; name: string; state: string; county: string | null }[];

  const states = [...new Set(locations.map((l) => l.state.toUpperCase()))]
    .filter((s) => STATE_FIPS[s])
    .sort();
  console.log(`  ${locations.length} cities across ${states.length} states`);
  if (!skipDownload)
    console.log("  fetching Census ACS (cached under data/sources/housing-metrics)");

  const placeByState = new Map<string, Map<string, MetricValues>>();
  const countyByState = new Map<string, Map<string, MetricValues>>();

  for (const abbr of states) {
    const fips = STATE_FIPS[abbr];
    placeByState.set(abbr, toLookup(await fetchGeo("place", fips), abbr, normalizePlace));
    if (!noCountyFallback) {
      countyByState.set(abbr, toLookup(await fetchGeo("county", fips), abbr, normalizeCounty));
    }
  }

  const resolved: Resolution[] = [];
  const unmatchedByColumn = new Map<MetricColumn, string[]>(
    METRICS.map((m) => [m.column, []])
  );

  for (const loc of locations) {
    const abbr = loc.state.toUpperCase();
    const label = `${loc.name}, ${loc.state}`;
    const sourcePlace = PLACE_ALIASES[`${abbr}|${loc.name}`] ?? loc.name;

    const placeValues =
      placeByState.get(abbr)?.get(geoKey(abbr, normalizePlace(sourcePlace))) ?? {};
    const countyValues =
      !noCountyFallback && loc.county
        ? countyByState.get(abbr)?.get(geoKey(abbr, normalizeCounty(loc.county))) ?? {}
        : {};

    // Fallback is PER VARIABLE: a small place often keeps its all-size
    // median while the 3br median suppresses.
    for (const metric of METRICS) {
      const placeValue = placeValues[metric.column];
      if (placeValue !== undefined) {
        resolved.push({ id: loc.id, label, column: metric.column, value: placeValue, via: "place" });
        continue;
      }
      const countyValue = countyValues[metric.column];
      if (countyValue !== undefined) {
        resolved.push({
          id: loc.id,
          label,
          column: metric.column,
          value: countyValue,
          via: "county",
          county: loc.county ?? undefined,
        });
        continue;
      }
      unmatchedByColumn.get(metric.column)!.push(label);
    }
  }

  for (const metric of METRICS) {
    const rows = resolved.filter((r) => r.column === metric.column);
    const viaPlace = rows.filter((r) => r.via === "place").length;
    const viaCounty = rows.length - viaPlace;
    const unmatched = unmatchedByColumn.get(metric.column)!.length;
    console.log(
      `  ${metric.column.padEnd(18)} place ${viaPlace}  county ${viaCounty}  unmatched ${unmatched}`
    );
  }

  if (!dryRun) {
    // Write only resolved values: a re-run never nulls a column because a
    // later vintage suppressed it.
    for (const row of resolved) {
      await sql.query(
        `UPDATE locations_location SET ${row.column} = $1 WHERE id = $2`,
        [row.value, row.id]
      );
    }
    console.log(`  wrote ${resolved.length} column values`);
  }

  writeReport(resolved, unmatchedByColumn);
  console.log(`\n  report: ${REPORT_PATH}`);
  console.log(dryRun ? "\nDry run complete — nothing written." : "\nImport complete.");
}

function writeReport(
  resolved: Resolution[],
  unmatchedByColumn: Map<MetricColumn, string[]>
) {
  fs.mkdirSync(SOURCE_DIR, { recursive: true });
  const today = new Date().toISOString().slice(0, 10);
  const lines: string[] = [
    "# Housing metrics match report (issue #170 Phase A)",
    "",
    `- Generated: ${today}`,
    `- Source: US Census ACS ${year} 5-year estimates`,
    `- API: https://api.census.gov/data/${year}/acs/acs5`,
    "- entry_home_value is B25076, the lower value quartile of OWNER-OCCUPIED",
    "  stock (self-reported value, all structure types) — a formal 25th",
    "  percentile, not a sale price and not a listing.",
    "- Bedroom rents are B25031 GROSS rent (utilities included), matching the",
    "  existing median_rent definition.",
    "",
  ];

  for (const metric of METRICS) {
    const rows = resolved.filter((r) => r.column === metric.column);
    const place = rows.filter((r) => r.via === "place");
    const county = rows.filter((r) => r.via === "county");
    const unmatched = unmatchedByColumn.get(metric.column)!;

    lines.push(
      `## ${metric.column} (${metric.variable} — ${metric.label})`,
      "",
      `Place-level ${place.length}, county fallback ${county.length}, unmatched ${unmatched.length}.`,
      "",
      "| City | Value | Via |",
      "| --- | --- | --- |",
      ...place.map((r) => `| ${r.label} | $${r.value.toLocaleString("en-US")} | place |`),
      ...county.map(
        (r) => `| ${r.label} | $${r.value.toLocaleString("en-US")} | county (${r.county ?? "?"}) — coarser, review |`
      ),
      "",
      unmatched.length === 0
        ? "No unmatched cities."
        : ["Unmatched (column stays NULL):", "", ...unmatched.map((u) => `- ${u}`)].join("\n"),
      ""
    );
  }
  fs.writeFileSync(REPORT_PATH, lines.join("\n"));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
