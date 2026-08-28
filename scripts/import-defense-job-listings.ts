/*
 * Imports individual defense-industry job listings (master_defense_jobs.csv)
 * into the defense_job_listings table behind /defense-jobs. Re-runnable: rows
 * are upserted on their apply URL, so pulling a larger CSV and re-running is
 * idempotent (pass --clear to replace the table wholesale first).
 *
 * Each row is normalized here: company -> employer slug, Title+Field -> a broad
 * sector (lib/defense-jobs-sectors.ts), US city -> coordinates (the small table
 * below — only ~25 US cities appear), and the messy employment/pay spellings ->
 * a small set. International rows keep no coordinates (the map is US-only, like
 * /mosques); they still appear in the list, tagged by region.
 *
 * Usage:
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/import-defense-job-listings.ts <csv> [--clear] [--dry-run]
 */
import { basename } from "node:path";
import { readFileSync } from "node:fs";
import { parse } from "csv-parse/sync";
import { getSql } from "../lib/db";
import { resolveStateAbbr } from "../lib/states";
import {
  classifySector,
  normalizeEmployment,
  normalizePayInterval,
} from "../lib/defense-jobs-sectors";

type Row = Record<string, string>;

const clean = (value: string | undefined): string | null => {
  if (value == null) return null;
  const trimmed = String(value).trim();
  return trimmed === "" || trimmed === "NA" || trimmed === "Not specified"
    ? null
    : trimmed;
};

const num = (value: string | undefined): number | null => {
  const c = clean(value);
  if (!c) return null;
  const parsed = Number.parseFloat(c.replace(/[,$]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
};

/** Company (CSV "Company" column) -> defense_employers slug. Extend as you add feeds. */
const COMPANY_SLUG: Record<string, string> = {
  "shield ai": "shield-ai",
  palantir: "palantir",
  saronic: "saronic",
  "vannevar labs": "vannevar-labs",
  kratos: "kratos",
  anduril: "anduril",
  "anduril industries": "anduril",
  epirus: "epirus",
};

/**
 * City centroids for the ~25 US cities that appear in the source. Keyed by
 * "city|ST". Only US cities are plotted (the map is national US, like /mosques).
 */
const CITY_COORDS: Record<string, [number, number]> = {
  "dallas|TX": [32.7767, -96.797],
  "austin|TX": [30.2672, -97.7431],
  "new york|NY": [40.7128, -74.006],
  "seattle|WA": [47.6062, -122.3321],
  "washington|DC": [38.9072, -77.0369],
  "franklin|LA": [29.7966, -91.5015],
  "san diego|CA": [32.7157, -117.1611],
  "palo alto|CA": [37.4419, -122.143],
  "san mateo|CA": [37.563, -122.3255],
  "new orleans|LA": [29.9511, -90.0715],
  "boston|MA": [42.3601, -71.0589],
  "virginia beach|VA": [36.8529, -75.978],
  "honolulu|HI": [21.3069, -157.8583],
  "chicago|IL": [41.8781, -87.6298],
  "arlington|VA": [38.8816, -77.091],
  "fayetteville|NC": [35.0527, -78.8784],
  "denver|CO": [39.7392, -104.9903],
  "brownsville|TX": [25.9017, -97.4975],
  "miami|FL": [25.7617, -80.1918],
  "huntsville|AL": [34.7304, -86.5861],
  "colorado springs|CO": [38.8339, -104.8214],
  "tampa|FL": [27.9506, -82.4572],
  "orlando|FL": [28.5383, -81.3792],
  "raleigh|NC": [35.7796, -78.6382],
  "wichita|KS": [37.6872, -97.3301],
  "torrance|CA": [33.8358, -118.3406],
  "lawton|OK": [34.6087, -98.3903],
};

interface Parsed {
  city: string | null;
  state: string | null;
  latitude: number | null;
  longitude: number | null;
}

/**
 * Normalize a raw Location string into (city, 2-letter state) and, for known US
 * cities, coordinates. Handles "City, StateName", "City, ST", D.C. spellings,
 * a trailing ", United States", and multi-location strings (takes the first).
 * Returns nulls for remote/nationwide/international values.
 */
function geocode(locationRaw: string | null, region: string | null): Parsed {
  const none: Parsed = { city: null, state: null, latitude: null, longitude: null };
  if (!locationRaw) return none;
  if (region && !/^US/i.test(region)) return none; // international -> list only

  // First of several semicolon-joined locations.
  let s = locationRaw.split(";")[0].trim();
  // Drop trailing ", United States".
  s = s.replace(/,\s*United States\s*$/i, "").trim();
  if (/^(remote|united states|north america|nationwide)$/i.test(s)) return none;
  if (/metro area$/i.test(s)) s = s.replace(/\s*metro area$/i, "").trim();

  const parts = s.split(",").map((p) => p.trim());
  const city = parts[0] || null;
  let stateRaw = parts[1] || null;
  if (stateRaw && /^(d\.?c\.?|district of columbia)$/i.test(stateRaw)) stateRaw = "DC";
  // Wichita has no state in the source ("Wichita Metro Area").
  if (city && /^wichita$/i.test(city) && !stateRaw) stateRaw = "KS";

  // "DC" is a USPS code but not a state, so resolveStateAbbr rejects it; keep the
  // normalized "DC" so Washington rows resolve against CITY_COORDS["washington|DC"].
  const state = stateRaw === "DC" ? "DC" : stateRaw ? resolveStateAbbr(stateRaw) : null;
  if (!city || !state) return { city, state, latitude: null, longitude: null };

  const coords = CITY_COORDS[`${city.toLowerCase()}|${state}`];
  return {
    city,
    state,
    latitude: coords ? coords[0] : null,
    longitude: coords ? coords[1] : null,
  };
}

interface Record22 {
  company: string;
  employer_slug: string | null;
  ats: string | null;
  title: string;
  field_raw: string | null;
  sector: string;
  location_raw: string | null;
  city: string | null;
  state: string | null;
  country: string;
  region: string | null;
  is_remote: boolean;
  latitude: number | null;
  longitude: number | null;
  employment_type: string | null;
  pay_min: number | null;
  pay_max: number | null;
  pay_interval: string | null;
  education: string | null;
  url: string;
  source_file: string;
  snapshot_date: string;
}

function parseRow(row: Row, sourceFile: string, today: string): Record22 | null {
  const url = clean(row.URL);
  const title = clean(row.Title);
  const company = clean(row.Company);
  if (!url || !title || !company) return null; // url is the dedupe key

  const region = clean(row.Region);
  const locationRaw = clean(row.Location);
  const isRemote = /remote/i.test(locationRaw ?? "") || /remote/i.test(region ?? "");
  const { city, state, latitude, longitude } = geocode(locationRaw, region);
  const country = region && !/^US/i.test(region) ? "INTL" : "US";

  return {
    company,
    employer_slug: COMPANY_SLUG[company.toLowerCase()] ?? null,
    ats: clean(row.ATS),
    title,
    field_raw: clean(row.Field),
    sector: classifySector(title, clean(row.Field)),
    location_raw: locationRaw,
    city,
    state,
    country,
    region,
    is_remote: isRemote,
    latitude,
    longitude,
    employment_type: normalizeEmployment(row.Employment),
    pay_min: num(row.PayMin),
    pay_max: num(row.PayMax),
    pay_interval: normalizePayInterval(row.PayInterval),
    education: clean(row.Education),
    url,
    source_file: sourceFile,
    snapshot_date: today,
  };
}

const COLUMNS: (keyof Record22)[] = [
  "company", "employer_slug", "ats", "title", "field_raw", "sector",
  "location_raw", "city", "state", "country", "region", "is_remote",
  "latitude", "longitude", "employment_type", "pay_min", "pay_max",
  "pay_interval", "education", "url", "source_file", "snapshot_date",
];

async function upsertChunk(
  sql: ReturnType<typeof getSql>,
  chunk: Record22[],
): Promise<void> {
  const values: unknown[] = [];
  const rowsSql = chunk.map((rec, r) => {
    const ph = COLUMNS.map((_, c) => `$${r * COLUMNS.length + c + 1}`);
    for (const col of COLUMNS) values.push(rec[col]);
    return `(${ph.join(", ")})`;
  });
  const setClause = COLUMNS.filter((c) => c !== "url")
    .map((c) => `${c} = EXCLUDED.${c}`)
    .join(", ");
  const text =
    `INSERT INTO defense_job_listings (${COLUMNS.join(", ")}) VALUES ` +
    `${rowsSql.join(", ")} ` +
    `ON CONFLICT (url) DO UPDATE SET ${setClause}, updated_at = now()`;
  await sql.query(text, values);
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const doClear = args.includes("--clear");
  const csvPath = args.find((a) => !a.startsWith("--"));
  if (!csvPath) {
    console.error(
      "Usage: import-defense-job-listings <csv> [--clear] [--dry-run]"
    );
    process.exit(1);
  }

  const today = new Date().toISOString().slice(0, 10);
  const sourceFile = basename(csvPath);
  const rows: Row[] = parse(readFileSync(csvPath, "utf-8"), {
    columns: true,
    skip_empty_lines: true,
    bom: true,
  });

  const parsed: Record22[] = [];
  let skipped = 0;
  for (const row of rows) {
    const rec = parseRow(row, sourceFile, today);
    if (rec) parsed.push(rec);
    else skipped++;
  }

  // Summary
  const byCompany: Record<string, number> = {};
  const bySector: Record<string, number> = {};
  let geocoded = 0;
  let unknownSlug = 0;
  for (const p of parsed) {
    byCompany[p.company] = (byCompany[p.company] ?? 0) + 1;
    bySector[p.sector] = (bySector[p.sector] ?? 0) + 1;
    if (p.latitude != null) geocoded++;
    if (!p.employer_slug) unknownSlug++;
  }

  console.log(
    `Importing defense job listings from ${csvPath}${dryRun ? " (dry run)" : ""}\n`
  );
  console.log(`Parsed ${parsed.length} listing(s), skipped ${skipped} (missing url/title/company).`);
  console.log(`Geocoded (US, on map): ${geocoded}; unmapped/remote/international: ${parsed.length - geocoded}.`);
  if (unknownSlug) {
    console.log(`Listings with no recognized employer slug: ${unknownSlug} (add to COMPANY_SLUG + lib/defense.ts seeds).`);
  }
  console.log("\nBy company:");
  for (const [k, v] of Object.entries(byCompany).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${String(v).padStart(4)}  ${k}`);
  }
  console.log("\nBy sector:");
  for (const [k, v] of Object.entries(bySector).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${String(v).padStart(4)}  ${k}`);
  }

  if (dryRun) {
    console.log("\nDry run complete. No rows written.");
    return;
  }

  const sql = getSql();
  if (doClear) {
    await sql.query("TRUNCATE defense_job_listings RESTART IDENTITY");
    console.log("\nCleared defense_job_listings.");
  }

  const CHUNK = 100;
  for (let i = 0; i < parsed.length; i += CHUNK) {
    await upsertChunk(sql, parsed.slice(i, i + CHUNK));
    console.log(`  upserted ${Math.min(i + CHUNK, parsed.length)}/${parsed.length}`);
  }

  console.log(`\nImport complete. ${parsed.length} listing(s).`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
