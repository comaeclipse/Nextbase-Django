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
  air: "air",
  govini: "air", // Govini rebranded to Air in 2026
  "chaos industries": "chaos-industries",
  castelion: "castelion",
  onebrief: "onebrief",
  firestorm: "firestorm",
  hadrian: "hadrian",
  hermeus: "hermeus",
  blacksky: "blacksky",
  "lockheed martin": "lockheed-martin",
  "palo alto networks": "palo-alto-networks",
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
  "pittsburgh|PA": [40.4406, -79.9959],
  "el segundo|CA": [33.9192, -118.4165],
  "hawthorne|CA": [33.9164, -118.3526],
  "san francisco|CA": [37.7749, -122.4194],
  "los angeles|CA": [34.0522, -118.2437],
  "costa mesa|CA": [33.6411, -117.9187],
  "ashville|OH": [39.7142, -82.9541],
  "santa ana|CA": [33.7455, -117.8677],
  "irvine|CA": [33.6846, -117.8265],
  "atlanta|GA": [33.749, -84.388],
  "broomfield|CO": [39.9205, -105.0867],
  "quincy|MA": [42.2529, -71.0023],
  "waltham|MA": [42.3765, -71.2356],
  "reston|VA": [38.9586, -77.357],
  "quonset|RI": [41.5951, -71.4111],
  "mchenry|MS": [30.6969, -88.9995],
  "lexington|MA": [42.4473, -71.2245],
  "chantilly|VA": [38.8943, -77.4311],
  "fort collins|CO": [40.5853, -105.0844],
  "morrisville|NC": [35.8235, -78.8256],
  "bellevue|WA": [47.6101, -122.2015],
  "hudson|NH": [42.7648, -71.439],
  "mountain view|CA": [37.3861, -122.0839],
  "boulder|CO": [40.015, -105.2705],
  "foothill ranch|CA": [33.6847, -117.6614],
  "san clemente|CA": [33.427, -117.612],
  "aberdeen|MD": [39.5093, -76.1641],
  "fort bragg|NC": [35.1391, -79.006],
  "phoenix|AZ": [33.4484, -112.074],
  "west lafayette|IN": [40.4259, -86.9081],
  "fort stockton|TX": [30.8935, -102.8794],
  "long beach|CA": [33.7701, -118.1937],
  "tustin|CA": [33.7458, -117.8261],
  "herndon|VA": [38.9696, -77.3861],
  "las vegas|NV": [36.1699, -115.1398],
  "rio rancho|NM": [35.2328, -106.663],
  "allen|TX": [33.1032, -96.6706],
  "midland|TX": [31.9973, -102.0779],
  "albuquerque|NM": [35.0844, -106.6504],
  "fort leavenworth|KS": [39.3489, -94.9186],
  "fort knox|KY": [37.8915, -85.9636],
  "fort bliss|TX": [31.8134, -106.4236],
  "mesa|AZ": [33.4152, -111.8315],
  "cherokee|AL": [34.757, -87.9736],
  "jacksonville|FL": [30.3322, -81.6557],
  "tukwila|WA": [47.4739, -122.2612],
  // Lockheed Martin's larger CONUS sites (top by open-req volume).
  "littleton|CO": [39.6133, -105.0166],
  "fort worth|TX": [32.7555, -97.3308],
  "king of prussia|PA": [40.0893, -75.396],
  "grand prairie|TX": [32.746, -96.9978],
  "marietta|GA": [33.9526, -84.5499],
  "moorestown|NJ": [39.9689, -74.949],
  "sunnyvale|CA": [37.3688, -122.0363],
  "palmdale|CA": [34.5794, -118.1165],
  "camden|AR": [33.5845, -92.8343],
  "liverpool|NY": [43.1062, -76.2177],
  "stratford|CT": [41.1845, -73.1332],
  "troy|AL": [31.8088, -85.97],
  "archbald|PA": [41.4959, -75.5385],
  "greenville|SC": [34.8526, -82.394],
  "owego|NY": [42.1009, -76.2619],
  "englewood|CO": [39.6478, -104.9878],
  "arlington|TX": [32.7357, -97.1081],
  "highlands ranch|CO": [39.5539, -104.9689],
  "manassas|VA": [38.7509, -77.4753],
  "lexington|KY": [38.0406, -84.5037],
  "cape canaveral|FL": [28.3922, -80.6077],
  "goleta|CA": [34.4358, -119.8276],
  "mt laurel township|NJ": [39.934, -74.891],
  "chelmsford|MA": [42.5998, -71.3673],
  "eglin afb|FL": [30.4633, -86.5524],
  // Palo Alto Networks CONUS sites (top by open-req volume).
  "santa clara|CA": [37.3541, -121.9552],
  "new york city|NY": [40.7128, -74.006],
  "plano|TX": [33.0198, -96.6989],
  "burbank|CA": [34.1808, -118.309],
  "charlotte|NC": [35.2271, -80.8431],
  "cincinnati|OH": [39.1031, -84.512],
  "philadelphia|PA": [39.9526, -75.1652],
  "columbus|OH": [39.9612, -82.9988],
  "nashville|TN": [36.1627, -86.7816],
  "portland|OR": [45.5152, -122.6784],
  "washington dc|DC": [38.9072, -77.0369],
  "houston|TX": [29.7604, -95.3698],
  "madison|WI": [43.0731, -89.4012],
  "minneapolis|MN": [44.9778, -93.265],
  "cleveland|OH": [41.4993, -81.6944],
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
