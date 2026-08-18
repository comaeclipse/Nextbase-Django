/*
 * Import BEA Regional Price Parities into location_cost_rpp.
 *
 * WHY A SEPARATE TABLE: col_index is a mixed-provenance composite. The
 * affordability engine was backing housing out of it with a C2ER weight that
 * does not describe most rows. BEA publishes goods, housing rents, utilities,
 * and other services as separate components (100 = US average), which removes
 * that algebra. Housing is still priced from rent/home-value; this table is
 * the local non-housing (and owner-utility) index.
 *
 * MATCHING: metro first via the pace pipeline's county→CBSA crosswalk (and the
 * stored pace cbsa_geoid). Cities whose CBSA is not a BEA MSA, or that have no
 * CBSA, use the state's BEA *nonmetropolitan portion*. Statewide SARPP is
 * never substituted. Zero-value nonmetro cells (DE, DC) stay unmatched.
 *
 * Usage:
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/import-bea-rpp.ts [--dry-run]
 *   ... --skip-download     use cached CSVs in data/sources/rpp
 *   ... --year 2024         BEA vintage (default 2024)
 */
import fs from "node:fs";
import path from "node:path";
import { parse } from "csv-parse/sync";
import { getSql } from "../lib/db";
import { normalizeCounty, geoKey } from "./lib/place-names";

const SOURCE_DIR = path.join("data", "sources", "rpp");
const RAW_DIR = path.join(SOURCE_DIR, "raw");
const REPORT_PATH = path.join(SOURCE_DIR, "match-report.md");
const PACE_DERIVED_PATH = path.join(
  "data",
  "sources",
  "pace",
  "derived",
  "pace_derived.json"
);
const MARPP_URL = "https://apps.bea.gov/regional/zip/MARPP.zip";
const PARPP_URL = "https://apps.bea.gov/regional/zip/PARPP.zip";
const MARPP_CSV = path.join(SOURCE_DIR, "MARPP_MSA_2008_2024.csv");
const PARPP_CSV = path.join(SOURCE_DIR, "PARPP_PORT_2008_2024.csv");
const GAZETTEER_URL =
  "https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2024_Gazetteer/2024_Gaz_counties_national.zip";
const GAZETTEER_PATH = path.join(SOURCE_DIR, "2024_Gaz_counties_national.txt");
const SOURCE_PAGE =
  "https://www.bea.gov/data/prices-inflation/regional-price-parities-state-and-metro-area";

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
 * Census 2024 county gazetteer uses Connecticut planning regions rather than
 * the eight historical counties stored on locations_location. Pace's
 * county→CBSA map still keys on the 2020 county FIPS, so these aliases keep
 * CT cities on their MSA instead of silently falling to the state nonmetro
 * portion.
 */
const COUNTY_FIPS_ALIASES: Record<string, string> = {
  "ct|fairfield": "09001",
  "ct|hartford": "09003",
  "ct|litchfield": "09005",
  "ct|middlesex": "09007",
  "ct|new haven": "09009",
  "ct|new london": "09011",
  "ct|tolland": "09013",
  "ct|windham": "09015",
};
const dryRun = process.argv.includes("--dry-run");
const skipDownload = process.argv.includes("--skip-download");
const year = argValue("--year") ?? "2024";

function argValue(flag: string): string | null {
  const i = process.argv.indexOf(flag);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : null;
}

type RppComponents = {
  code: string;
  name: string;
  goods: number;
  housing: number;
  utilities: number;
  other: number;
};

type Match = {
  id: number;
  label: string;
  geoType: "msa" | "nonmetro_state";
  geo: RppComponents;
  note: string;
};

async function download(url: string, dest: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download ${url}: ${res.status}`);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
}

async function unzipTo(zipPath: string, destDir: string) {
  fs.mkdirSync(destDir, { recursive: true });
  const { spawnSync } = await import("node:child_process");
  const result = spawnSync(
    "tar",
    ["-xf", zipPath, "-C", destDir],
    { encoding: "utf8" }
  );
  if (result.status !== 0) {
    throw new Error(
      `Failed to extract ${zipPath}: ${result.stderr || result.stdout}`
    );
  }
}

function findCsv(dir: string, prefix: string): string | null {
  if (!fs.existsSync(dir)) return null;
  const hit = fs
    .readdirSync(dir, { recursive: true })
    .map((f) => String(f))
    .find((f) => f.replace(/\\/g, "/").split("/").pop()?.startsWith(prefix) && f.endsWith(".csv"));
  return hit ? path.join(dir, hit) : null;
}

async function ensureCsv(
  url: string,
  zipName: string,
  extractPrefix: string,
  destCsv: string
) {
  if (skipDownload && fs.existsSync(destCsv)) return;
  if (fs.existsSync(destCsv) && skipDownload) return;
  if (fs.existsSync(destCsv)) return;

  const zipPath = path.join(RAW_DIR, zipName);
  if (!fs.existsSync(zipPath)) {
    console.log(`  downloading ${zipName}`);
    await download(url, zipPath);
  }
  const extractDir = path.join(RAW_DIR, path.basename(zipName, ".zip").toLowerCase());
  if (!findCsv(extractDir, extractPrefix)) {
    await unzipTo(zipPath, extractDir);
  }
  const found = findCsv(extractDir, extractPrefix);
  if (!found) throw new Error(`No ${extractPrefix} CSV in ${extractDir}`);
  fs.mkdirSync(SOURCE_DIR, { recursive: true });
  fs.copyFileSync(found, destCsv);
}

function parseYearValue(row: Record<string, string>, vintage: string): number | null {
  const raw = row[vintage];
  if (raw === undefined || raw === "") return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

function loadComponentTable(csvPath: string): Map<string, RppComponents> {
  const rows = parse(fs.readFileSync(csvPath, "utf8"), {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true,
  }) as Record<string, string>[];

  const byCode = new Map<string, Partial<RppComponents> & { code: string; name: string }>();
  for (const row of rows) {
    const code = String(row.GeoFIPS ?? "").replace(/\D/g, "").padStart(5, "0");
    const name = String(row.GeoName ?? "").trim();
    const line = Number(row.LineCode);
    const value = parseYearValue(row, year);
    if (!code || !name || !Number.isFinite(line) || value === null) continue;
    const current = byCode.get(code) ?? { code, name };
    if (line === 2) current.goods = value;
    else if (line === 3) current.housing = value;
    else if (line === 4) current.utilities = value;
    else if (line === 5) current.other = value;
    byCode.set(code, current);
  }

  const complete = new Map<string, RppComponents>();
  for (const [code, row] of byCode) {
    if (
      row.goods &&
      row.housing &&
      row.utilities &&
      row.other
    ) {
      complete.set(code, {
        code,
        name: row.name,
        goods: row.goods,
        housing: row.housing,
        utilities: row.utilities,
        other: row.other,
      });
    }
  }
  return complete;
}

function loadCountyFips(): Map<string, string> {
  const text = fs.readFileSync(GAZETTEER_PATH, "utf8");
  const lines = text.trim().split(/\r?\n/);
  const header = lines[0].split("\t").map((h) => h.trim());
  const uspsIdx = header.indexOf("USPS");
  const geoidIdx = header.indexOf("GEOID");
  const nameIdx = header.indexOf("NAME");
  const out = new Map<string, string>();
  for (const line of lines.slice(1)) {
    const cells = line.split("\t");
    const usps = cells[uspsIdx]?.trim();
    const geoid = cells[geoidIdx]?.trim();
    const name = cells[nameIdx] ?? "";
    if (!usps || !geoid) continue;
    out.set(geoKey(usps, normalizeCounty(name)), geoid.padStart(5, "0"));
  }
  return out;
}

async function ensureGazetteer() {
  if (fs.existsSync(GAZETTEER_PATH)) return;
  if (skipDownload) {
    throw new Error(
      `Missing ${GAZETTEER_PATH}. Re-run without --skip-download to fetch the Census county gazetteer.`
    );
  }
  const zipPath = path.join(SOURCE_DIR, "2024_Gaz_counties_national.zip");
  console.log("  downloading Census 2024 county gazetteer");
  await download(GAZETTEER_URL, zipPath);
  await unzipTo(zipPath, SOURCE_DIR);
}

function findMsaByName(
  city: string,
  state: string,
  marpp: Map<string, RppComponents>
): RppComponents | null {
  const needle = city.toLowerCase();
  const abbr = state.toUpperCase();
  const hits = [...marpp.values()].filter((geo) => {
    const name = geo.name.toLowerCase();
    if (!name.startsWith(needle)) return false;
    return (
      name.includes(`, ${abbr.toLowerCase()}`) ||
      name.includes(`-${abbr.toLowerCase()} `) ||
      name.includes(`-${abbr.toLowerCase()})`) ||
      name.includes(`, ${abbr.toLowerCase()}-`)
    );
  });
  return hits.length === 1 ? hits[0] : null;
}

function writeReport(
  msa: Match[],
  nonmetro: Match[],
  unmatched: { label: string; reason: string }[]
) {
  const today = new Date().toISOString().slice(0, 10);
  const lines = [
    "# BEA Regional Price Parity match report",
    "",
    `- Generated: ${today}`,
    `- Vintage: BEA RPP ${year} (MARPP metro areas, PARPP state nonmetropolitan portions)`,
    `- Source: ${SOURCE_PAGE}`,
    "- Housing RPP is stored for audit but is not used to price housing; rent and home value do that.",
    "- Statewide SARPP is never used as a fallback.",
    "",
    `MSA ${msa.length}, state nonmetro ${nonmetro.length}, unmatched ${unmatched.length}.`,
    "",
    "## Metropolitan statistical areas",
    "",
    "| City | BEA geography | Goods | Utilities | Other services |",
    "| --- | --- | ---: | ---: | ---: |",
    ...msa.map(
      (m) =>
        `| ${m.label} | ${m.geo.name} | ${m.geo.goods.toFixed(1)} | ${m.geo.utilities.toFixed(1)} | ${m.geo.other.toFixed(1)} |`
    ),
    "",
    "## State nonmetropolitan portion (explicit)",
    "",
    nonmetro.length === 0
      ? "None."
      : [
          "These cities are not in a BEA MSA. The state's nonmetropolitan portion is",
          "a published BEA geography, not a silent statewide average.",
          "",
          "| City | BEA geography | Goods | Utilities | Other services | Why |",
          "| --- | --- | ---: | ---: | ---: | --- |",
        ]
          .concat(
            nonmetro.map(
              (m) =>
                `| ${m.label} | ${m.geo.name} | ${m.geo.goods.toFixed(1)} | ${m.geo.utilities.toFixed(1)} | ${m.geo.other.toFixed(1)} | ${m.note} |`
            )
          )
          .join("\n"),
    "",
    "## Unmatched",
    "",
    unmatched.length === 0
      ? "None."
      : unmatched.map((u) => `- ${u.label}: ${u.reason}`).join("\n"),
    "",
  ];
  fs.mkdirSync(SOURCE_DIR, { recursive: true });
  fs.writeFileSync(REPORT_PATH, lines.join("\n"));
}

async function main() {
  console.log(`BEA RPP import${dryRun ? " (dry run)" : ""} — vintage ${year}`);

  await ensureCsv(MARPP_URL, "MARPP.zip", "MARPP_MSA", MARPP_CSV);
  await ensureCsv(PARPP_URL, "PARPP.zip", "PARPP_PORT", PARPP_CSV);
  await ensureGazetteer();

  const marpp = loadComponentTable(MARPP_CSV);
  const parpp = loadComponentTable(PARPP_CSV);
  const countyFips = loadCountyFips();
  const countyCbsa = (
    JSON.parse(fs.readFileSync(PACE_DERIVED_PATH, "utf8")) as {
      county_cbsa?: Record<string, string>;
    }
  ).county_cbsa ?? {};

  const sql = getSql();
  const locations = (await sql.query(
    `SELECT l.id, l.name, l.state, l.county,
            (
              SELECT h.cbsa_geoid
              FROM location_pace_classifications h
              WHERE h.location_id = l.id
              ORDER BY h.id DESC
              LIMIT 1
            ) AS pace_cbsa
     FROM locations_location l
     ORDER BY l.name`
  )) as {
    id: number;
    name: string;
    state: string;
    county: string | null;
    pace_cbsa: string | null;
  }[];

  const msa: Match[] = [];
  const nonmetro: Match[] = [];
  const unmatched: { label: string; reason: string }[] = [];

  for (const loc of locations) {
    const abbr = loc.state.toUpperCase();
    const label = `${loc.name}, ${loc.state}`;
    const fips = loc.county
      ? countyFips.get(geoKey(abbr, normalizeCounty(loc.county))) ??
        COUNTY_FIPS_ALIASES[geoKey(abbr, normalizeCounty(loc.county))]
      : undefined;
    const fromCounty = fips ? countyCbsa[fips] ?? null : null;
    const cbsa = (loc.pace_cbsa || fromCounty || "")
      .replace(/\D/g, "")
      .padStart(5, "0");
    const cbsaOk = cbsa.length === 5 && cbsa !== "00000";

    if (cbsaOk && marpp.has(cbsa)) {
      msa.push({
        id: loc.id,
        label,
        geoType: "msa",
        geo: marpp.get(cbsa)!,
        note: "",
      });
      continue;
    }

    const named = findMsaByName(loc.name, abbr, marpp);
    if (named) {
      msa.push({
        id: loc.id,
        label,
        geoType: "msa",
        geo: named,
        note: "Matched BEA MSA by name after county/CBSA lookup missed.",
      });
      continue;
    }

    const stateFips = STATE_FIPS[abbr];
    const nonmetroCode = stateFips ? `${stateFips}999` : null;
    const nonmetroGeo = nonmetroCode ? parpp.get(nonmetroCode) : undefined;
    if (nonmetroGeo) {
      const why = cbsaOk
        ? `CBSA ${cbsa} is not a BEA MSA; using the state nonmetropolitan portion.`
        : "No CBSA in the pace county crosswalk; using the state nonmetropolitan portion.";
      nonmetro.push({
        id: loc.id,
        label,
        geoType: "nonmetro_state",
        geo: nonmetroGeo,
        note: why,
      });
      continue;
    }

    unmatched.push({
      label,
      reason: cbsaOk
        ? `CBSA ${cbsa} is not a BEA MSA and ${abbr} has no usable nonmetro RPP`
        : `no CBSA match and ${abbr} has no usable nonmetro RPP`,
    });
  }

  console.log(
    `  MSA ${msa.length}  nonmetro ${nonmetro.length}  unmatched ${unmatched.length}  (of ${locations.length})`
  );
  if (nonmetro.length) {
    console.log("\n  Nonmetro portion (explicit, not statewide):");
    for (const row of nonmetro) {
      console.log(`    ${row.label.padEnd(28)} ${row.note}`);
    }
  }
  if (unmatched.length) {
    console.log("\n  Unmatched:");
    for (const row of unmatched) console.log(`    ${row.label}: ${row.reason}`);
  }

  if (!dryRun) {
    const retrievedOn = new Date().toISOString().slice(0, 10);
    for (const row of [...msa, ...nonmetro]) {
      await sql.query(
        `INSERT INTO location_cost_rpp (
           location_id, vintage_year, bea_geo_type, bea_geo_code, bea_geo_name,
           goods_rpp, housing_rpp, utilities_rpp, other_services_rpp,
           source_url, retrieved_on
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
         ON CONFLICT (location_id) DO UPDATE SET
           vintage_year = EXCLUDED.vintage_year,
           bea_geo_type = EXCLUDED.bea_geo_type,
           bea_geo_code = EXCLUDED.bea_geo_code,
           bea_geo_name = EXCLUDED.bea_geo_name,
           goods_rpp = EXCLUDED.goods_rpp,
           housing_rpp = EXCLUDED.housing_rpp,
           utilities_rpp = EXCLUDED.utilities_rpp,
           other_services_rpp = EXCLUDED.other_services_rpp,
           source_url = EXCLUDED.source_url,
           retrieved_on = EXCLUDED.retrieved_on`,
        [
          row.id,
          Number(year),
          row.geoType,
          row.geo.code,
          row.geo.name,
          row.geo.goods,
          row.geo.housing,
          row.geo.utilities,
          row.geo.other,
          SOURCE_PAGE,
          retrievedOn,
        ]
      );
    }
    console.log(`  wrote ${msa.length + nonmetro.length} rows`);
  }

  writeReport(msa, nonmetro, unmatched);
  console.log(`\n  report: ${REPORT_PATH}`);
  console.log(dryRun ? "\nDry run complete — nothing written." : "\nImport complete.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
