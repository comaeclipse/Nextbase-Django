/*
 * Import median gross rent into locations_location.median_rent from the
 * Census ACS 5-year estimates (table B25064).
 *
 * WHY THIS IS P0: the "rent" tenure cannot price a single city today. Renting
 * is the common case for the lowest-income retirees — precisely the people this
 * feature exists for — so without it the model only serves owners.
 *
 * WHY B25064 (GROSS rent, not contract rent): gross rent bundles utilities.
 * That lines up with the cost model, whose non-housing baseline is BLS total
 * spending MINUS housing, and BLS counts utilities inside housing. So gross
 * rent puts utilities back exactly once. Switching to contract rent (B25058)
 * would silently drop utilities from renter estimates.
 *
 * GEOGRAPHY: ACS publishes B25064 for incorporated places, which is a direct
 * city match. Cities with no place-level row (CDPs, unincorporated areas) fall
 * back to their county, which is coarser — rural county rents drag a city's
 * figure down. Fallback cities are listed separately in the match report so the
 * approximation stays visible.
 *
 * Usage:
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/import-median-rent.ts [--dry-run]
 *   ... --skip-download     use the cached API responses in data/sources/rent
 *   ... --year 2023         Override the ACS 5-year vintage (default 2024)
 *   ... --no-county-fallback   place-level matches only
 *
 * A Census API key is REQUIRED. The API answers keyless requests with a 302 to
 * an HTML "Missing Key" page rather than an error status, so a naive check of
 * response.ok passes and the JSON parse is what fails. Get a free key at
 * https://api.census.gov/data/key_signup.html and set CENSUS_API_KEY in .env.
 */
import fs from "node:fs";
import path from "node:path";
import { getSql } from "../lib/db";
import { normalizePlace, normalizeCounty, geoKey, splitCensusName } from "./lib/place-names";

const SOURCE_DIR = path.join("data", "sources", "rent");
const REPORT_PATH = path.join(SOURCE_DIR, "match-report.md");
const VARIABLE = "B25064_001E"; // median gross rent, dollars

const dryRun = process.argv.includes("--dry-run");
const skipDownload = process.argv.includes("--skip-download");
const noCountyFallback = process.argv.includes("--no-county-fallback");
const year = argValue("--year") ?? "2024";

/**
 * Plausible bounds for a US median gross rent. ACS uses negative sentinels
 * (-666666666) for suppressed cells, and a $30 or $20,000 median is a parsing
 * error rather than a real place.
 */
const RENT_BOUNDS = { min: 200, max: 6000 };

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

/**
 * Narrow aliases for official Census place names that cannot normalize to the
 * curated display name. These remain exact, reviewed mappings rather than a
 * fuzzy join; each target is present in the downloaded ACS place response.
 */
const PLACE_ALIASES: Record<string, string> = {
  "HI|Honolulu": "Urban Honolulu",
  // Preserve the existing location key while the legacy spelling is repaired.
  "IN|Indianopolis": "Indianapolis city (balance)",
  "KY|Louisville": "Louisville/Jefferson County metro government (balance)",
  "TN|Nashville": "Nashville-Davidson metropolitan government (balance)",
};

/**
 * Reviewed reasons a city has no usable ACS place-level B25064 value.
 * County fallback is coarser; these notes keep that approximation visible.
 */
const FALLBACK_REASONS: Record<string, string> = {
  "Hamilton, WA":
    "ACS place row exists (Hamilton town) but B25064 is suppressed; population 297 is below the ACS disclosure threshold.",
  "Malabar, FL":
    "ACS place row exists (Malabar town) but B25064 is suppressed for this small Brevard County town.",
  "McHenry, MS":
    "Unincorporated community with no Census place geography in the ACS place file.",
  "North Kingstown, RI":
    "New England town published as a county subdivision, not a Census place. The RI ACS place file has 36 CDPs/cities; Kingston CDP is a different place in South Kingstown and must not be substituted.",
};

function argValue(flag: string): string | null {
  const i = process.argv.indexOf(flag);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : null;
}

function parseRent(raw: string | null): number | null {
  if (raw === null) return null;
  const n = Number(raw);
  if (!Number.isFinite(n)) return null;
  if (n < RENT_BOUNDS.min || n > RENT_BOUNDS.max) return null; // catches ACS sentinels
  return Math.round(n);
}

type Geography = "place" | "county";

function cachePath(geo: Geography, fips: string): string {
  return path.join(SOURCE_DIR, `${year}-${geo}-${fips}.json`);
}

/**
 * Fetch one state's rows for a geography level, caching the raw response.
 *
 * Validates the body rather than trusting the status. A keyless or malformed
 * request is answered with a 302 to an HTML page, so `res.ok` is true and the
 * failure only shows up as a JSON parse error several frames away from the
 * cause.
 */
async function fetchGeo(geo: Geography, fips: string): Promise<string[][]> {
  const cached = cachePath(geo, fips);
  if (skipDownload || fs.existsSync(cached)) {
    if (!fs.existsSync(cached)) return [];
    return JSON.parse(fs.readFileSync(cached, "utf8"));
  }

  const url =
    `https://api.census.gov/data/${year}/acs/acs5?get=NAME,${VARIABLE}` +
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
    // Census signals several failure modes with an HTML page and a 200.
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

/** Turn an ACS response into a normalized-name -> rent map for one state. */
function toLookup(
  rows: string[][],
  abbr: string,
  normalize: (s: string) => string
): Map<string, number> {
  const out = new Map<string, number>();
  if (rows.length < 2) return out;

  const header = rows[0];
  const nameIdx = header.indexOf("NAME");
  const valueIdx = header.indexOf(VARIABLE);
  if (nameIdx < 0 || valueIdx < 0) return out;

  for (const row of rows.slice(1)) {
    const split = splitCensusName(row[nameIdx] ?? "");
    if (!split) continue;
    const rent = parseRent(row[valueIdx] ?? null);
    if (rent === null) continue;
    out.set(geoKey(abbr, normalize(split.place)), rent);
  }
  return out;
}

async function main() {
  console.log(`Median rent import${dryRun ? " (dry run)" : ""} — ACS ${year} 5-year, ${VARIABLE}`);

  if (!skipDownload && !process.env.CENSUS_API_KEY) {
    console.error(
      "\nCENSUS_API_KEY is not set.\n\n" +
        "The Census API requires a key. Without one it answers with a redirect\n" +
        "to an HTML page instead of an error status, so this fails in a way that\n" +
        "looks like a bug in this script rather than a missing credential.\n\n" +
        "  1. Request a free key: https://api.census.gov/data/key_signup.html\n" +
        "  2. Add it to .env:     CENSUS_API_KEY=...\n" +
        "  3. Re-run. (A new key can take a few minutes to activate.)\n\n" +
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
  if (!skipDownload) console.log("  fetching Census ACS (cached under data/sources/rent)");

  const placeByState = new Map<string, Map<string, number>>();
  const countyByState = new Map<string, Map<string, number>>();

  for (const abbr of states) {
    const fips = STATE_FIPS[abbr];
    placeByState.set(abbr, toLookup(await fetchGeo("place", fips), abbr, normalizePlace));
    if (!noCountyFallback) {
      countyByState.set(abbr, toLookup(await fetchGeo("county", fips), abbr, normalizeCounty));
    }
  }

  const exact: { id: number; label: string; rent: number }[] = [];
  const viaCounty: { id: number; label: string; county: string; rent: number }[] = [];
  const unmatched: string[] = [];

  for (const loc of locations) {
    const abbr = loc.state.toUpperCase();
    const label = `${loc.name}, ${loc.state}`;

    const sourcePlace = PLACE_ALIASES[`${abbr}|${loc.name}`] ?? loc.name;
    const placeRent = placeByState
      .get(abbr)
      ?.get(geoKey(abbr, normalizePlace(sourcePlace)));
    if (placeRent !== undefined) {
      exact.push({ id: loc.id, label, rent: placeRent });
      continue;
    }

    if (!noCountyFallback && loc.county) {
      const countyRent = countyByState
        .get(abbr)
        ?.get(geoKey(abbr, normalizeCounty(loc.county)));
      if (countyRent !== undefined) {
        viaCounty.push({ id: loc.id, label, county: loc.county, rent: countyRent });
        continue;
      }
    }
    unmatched.push(label);
  }

  console.log(
    `\n  place-level ${exact.length}` +
      `  county-fallback ${viaCounty.length}` +
      `  unmatched ${unmatched.length}` +
      `  (of ${locations.length})`
  );

  if (!dryRun) {
    for (const row of [...exact, ...viaCounty]) {
      await sql.query("UPDATE locations_location SET median_rent = $1 WHERE id = $2", [
        row.rent,
        row.id,
      ]);
    }
    console.log(`  wrote ${exact.length + viaCounty.length} rows`);
  }

  if (viaCounty.length) {
    console.log(
      "\n  County fallback used (coarser — rural rents pull these down):"
    );
    for (const v of viaCounty.slice(0, 15)) {
      console.log(`    ${v.label.padEnd(28)} ${v.county} -> $${v.rent}`);
    }
    if (viaCounty.length > 15) console.log(`    ... and ${viaCounty.length - 15} more`);
  }

  if (unmatched.length) {
    console.log("\n  Unmatched (rent tenure stays unavailable for these):");
    for (const u of unmatched.slice(0, 20)) console.log(`    ${u}`);
    if (unmatched.length > 20) console.log(`    ... and ${unmatched.length - 20} more`);
  }

  writeReport(exact, viaCounty, unmatched);
  console.log(`\n  report: ${REPORT_PATH}`);
  console.log(dryRun ? "\nDry run complete — nothing written." : "\nImport complete.");
}

function writeReport(
  exact: { label: string; rent: number }[],
  viaCounty: { label: string; county: string; rent: number }[],
  unmatched: string[]
) {
  fs.mkdirSync(SOURCE_DIR, { recursive: true });
  const today = new Date().toISOString().slice(0, 10);
  const lines = [
    "# Median rent match report",
    "",
    `- Generated: ${today}`,
    `- Source: US Census ACS ${year} 5-year estimates, table ${VARIABLE} (median gross rent)`,
    `- API: https://api.census.gov/data/${year}/acs/acs5`,
    "- Gross rent includes utilities, which is what the cost model expects.",
    "",
    `Place-level ${exact.length}, county fallback ${viaCounty.length}, unmatched ${unmatched.length}.`,
    "",
    "## Place-level matches",
    "",
    "| City | Median gross rent |",
    "| --- | --- |",
    ...exact.map((e) => `| ${e.label} | $${e.rent} |`),
    "",
    "## County fallback (approximate)",
    "",
    viaCounty.length === 0
      ? "None."
      : [
          "These cities have no usable ACS place-level B25064 value. County median",
          "gross rent is used instead; that is coarser and typically pulled by the",
          "rest of the county. Each fallback was reviewed against the ACS place file.",
          "",
          "| City | County used | Median gross rent | Why place-level was unavailable |",
          "| --- | --- | --- | --- |",
        ]
          .concat(
            viaCounty.map((v) => {
              const why = FALLBACK_REASONS[v.label] ?? "Not yet reviewed — do not treat as a silent match.";
              return `| ${v.label} | ${v.county} | $${v.rent} | ${why} |`;
            })
          )
          .join("\n"),
    "",
    "## Unmatched",
    "",
    unmatched.length === 0 ? "None." : unmatched.map((u) => `- ${u}`).join("\n"),
    "",
  ];
  fs.writeFileSync(REPORT_PATH, lines.join("\n"));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
