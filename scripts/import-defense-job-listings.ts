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
  "bae systems": "bae-systems",
  "cyntel technologies": "cyntel-technologies",
  "northrop grumman": "northrop-grumman",
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
  // BAE Systems + Cyntel CONUS sites (top by open-req volume).
  "nashua|NH": [42.7654, -71.4676],
  "merrimack|NH": [42.8651, -71.4934],
  "westminster|CO": [39.8367, -105.0372],
  "endicott|NY": [42.0987, -76.0494],
  "hill afb|UT": [41.1239, -111.973],
  "sterling|VA": [39.0067, -77.4291],
  "fort wayne|IN": [41.0793, -85.1394],
  "totowa|NJ": [40.9054, -74.2065],
  "cedar rapids|IA": [41.9779, -91.6656],
  "falls church|VA": [38.8823, -77.1711],
  "rockville|MD": [39.084, -77.1528],
  "wayne|NJ": [40.9254, -74.2765],
  "louisville|KY": [38.2527, -85.7585],
  "greenlawn|NY": [40.8676, -73.3651],
  "york|PA": [39.9626, -76.7277],
  "norfolk|VA": [36.8508, -76.2859],
  "fort walton beach|FL": [30.4058, -86.6188],
  "manchester|NH": [42.9956, -71.4548],
  "maple grove|MN": [45.0725, -93.4558],
  "mclean|VA": [38.9339, -77.1773],
  "wallops island|VA": [37.9402, -75.4664],
  "saint inigoes|MD": [38.137, -76.411],
  "kingsport|TN": [36.5484, -82.5618],
  "aurora|CO": [39.7294, -104.8319],
  "springfield|VA": [38.7893, -77.1872],
  "quantico|VA": [38.5223, -77.2934],
  "linthicum|MD": [39.2065, -76.6647],
  "ft meade|MD": [39.108, -76.7436],
  "joint base langley-eustis|VA": [37.0829, -76.3597],
  "dyess afb|TX": [32.4207, -99.8548],
  // Northrop Grumman sites (Eightfold pull, 2026-08-28). Excludes cities already
  // above (San Diego, Los Angeles, Huntsville, Colorado Springs, El Segundo,
  // Boulder, Chantilly, New York, Morrisville, Orlando, Tampa, Washington DC,
  // Honolulu). City-centroid accuracy, sufficient for the national dot map.
  "roy|UT": [41.1716, -112.0263],
  "melbourne|FL": [28.0836, -80.6081],
  "baltimore|MD": [39.2904, -76.6122],
  "redondo beach|CA": [33.8492, -118.3884],
  "rolling meadows|IL": [42.0842, -88.0131],
  "linthicum heights|MD": [39.2054, -76.6641],
  "dulles|VA": [38.9553, -77.446],
  "chandler|AZ": [33.3062, -111.8413],
  "oklahoma city|OK": [35.4676, -97.5164],
  "clearfield|UT": [41.1108, -112.0261],
  "corinne|UT": [41.5502, -112.1141],
  "edwards afb|CA": [34.9054, -117.8836],
  "elkton|MD": [39.6068, -75.8333],
  "gilbert|AZ": [33.3528, -111.789],
  "iuka|MS": [34.8098, -88.1901],
  "warner robins|GA": [32.613, -83.6242],
  "annapolis|MD": [38.9784, -76.4922],
  "rocket center|WV": [39.5378, -78.7628],
  "waynesboro|VA": [38.0685, -78.8895],
  "manhattan beach|CA": [33.8847, -118.4109],
  "magna|UT": [40.7091, -112.1016],
  "buffalo|NY": [42.8864, -78.8784],
  "salt lake city|UT": [40.7608, -111.891],
  "plymouth|MN": [45.0105, -93.4555],
  "sykesville|MD": [39.3737, -76.968],
  "ocean springs|MS": [30.4113, -88.8278],
  "mcclellan park|CA": [38.6661, -121.4008],
  "beavercreek|OH": [39.7092, -84.0633],
  "lake charles|LA": [30.2266, -93.2174],
  "wright-patterson afb|OH": [39.8138, -84.0492],
  "layton|UT": [41.0602, -111.9711],
  "oxnard|CA": [34.1975, -119.1771],
  "fairfax|VA": [38.8462, -77.3064],
  "whiteman afb|MO": [38.73, -93.558],
  "elkridge|MD": [39.2126, -76.7136],
  "san antonio|TX": [29.4241, -98.4936],
  "charlottesville|VA": [38.0293, -78.4767],
  "azusa|CA": [34.1336, -117.9076],
  "commerce|CA": [33.995, -118.1592],
  "apopka|FL": [28.6934, -81.5322],
  "hollywood|MD": [38.3573, -76.5647],
  "bellevue|NE": [41.1544, -95.9145],
  "palm beach gardens|FL": [26.8234, -80.1387],
  "beale afb|CA": [39.1361, -121.4366],
  "st. augustine|FL": [29.9012, -81.3124],
  "irving|TX": [32.814, -96.9489],
  "ogden|UT": [41.223, -111.9738],
  "ridgecrest|CA": [35.6225, -117.6709],
  "emerado|ND": [47.9253, -97.3597],
  "merritt island|FL": [28.36, -80.6942],
  "camarillo|CA": [34.2164, -119.0376],
  "newport news|VA": [37.0871, -76.473],
  "robins afb|GA": [32.6079, -83.5924],
  "oak harbor|WA": [48.2932, -122.6432],
  "fort greely|AK": [63.8833, -145.7],
  "valparaiso|FL": [30.5088, -86.5027],
  "madison|AL": [34.6993, -86.7483],
  "kettering|OH": [39.6895, -84.1688],
  "stafford|VA": [38.4221, -77.4083],
  "silverdale|WA": [47.6448, -122.6949],
  "lemoore|CA": [36.3008, -119.7829],
  "hopkinton|MA": [42.2287, -71.5226],
  "radford|VA": [37.1318, -80.5764],
  "rome|NY": [43.2128, -75.4557],
  "mojave|CA": [35.0525, -118.174],
  "bethpage|NY": [40.7442, -73.4826],
  "santa rosa|CA": [38.4404, -122.7141],
  "bloomington|MN": [44.8408, -93.2983],
  "augusta|GA": [33.4735, -82.0105],
  "yuma|AZ": [32.6927, -114.6277],
  "fort belvoir|VA": [38.7188, -77.1461],
  "hanover|MD": [39.1916, -76.7241],
  "belle chasse|LA": [29.8538, -89.9906],
  "moss point|MS": [30.4113, -88.5347],
  "yorktown|VA": [37.2382, -76.5097],
  "sierra vista|AZ": [31.5455, -110.2773],
  "groton|CT": [41.3498, -72.0784],
  "st rose|LA": [29.9524, -90.3218],
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
