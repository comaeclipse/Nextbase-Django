/*
 * Import EPA AirData annual AQI summaries for every curated city.
 *
 * EPA annual AQI is available by county and CBSA, not by exact city boundary.
 * This importer prefers annual county summaries, then falls back to annual CBSA
 * summaries when the city county has no monitor-derived county annual row, then
 * uses the nearest same-state monitored county as an explicit approximation.
 * It writes a match report under data/sources/air-quality so any unmatched
 * cities stay visible.
 *
 * Usage:
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/import-air-quality.ts [--year 2025] [--dry-run]
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { parse } from "csv-parse/sync";
import { getSql } from "../lib/db";
import { STATE_NAME_TO_ABBR } from "../lib/states";

const CACHE_DIR = path.join("data", "sources", "air-quality");
const PACE_DERIVED_PATH = path.join(
  "data",
  "sources",
  "pace",
  "derived",
  "pace_derived.json"
);
const LOCATION_COORDINATES_PATH = path.join("data", "location-map-coordinates.json");
const SOURCE_RETRIEVED_ON = new Date().toISOString().slice(0, 10);

type LocationInput = {
  id: number | string;
  name: string;
  state: string;
  county: string;
};

type LocationCoordinate = {
  name: string;
  state: string;
  latitude: number;
  longitude: number;
};

type CountyCoordinate = {
  state: string;
  stateName: string;
  countyName: string;
  latitude: number;
  longitude: number;
};

type AnnualCountyAqi = {
  State: string;
  County: string;
  Year: string;
  "Days with AQI": string;
  "Good Days": string;
  "Moderate Days": string;
  "Unhealthy for Sensitive Groups Days": string;
  "Unhealthy Days": string;
  "Very Unhealthy Days": string;
  "Hazardous Days": string;
  "Max AQI": string;
  "90th Percentile AQI": string;
  "Median AQI": string;
  "Days CO": string;
  "Days NO2": string;
  "Days Ozone": string;
  "Days PM2.5": string;
  "Days PM10": string;
};

type AnnualCbsaAqi = {
  CBSA: string;
  "CBSA Code": string;
  Year: string;
  "Days with AQI": string;
  "Good Days": string;
  "Moderate Days": string;
  "Unhealthy for Sensitive Groups Days": string;
  "Unhealthy Days": string;
  "Very Unhealthy Days": string;
  "Hazardous Days": string;
  "Max AQI": string;
  "90th Percentile AQI": string;
  "Median AQI": string;
  "Days CO": string;
  "Days NO2": string;
  "Days Ozone": string;
  "Days PM2.5": string;
  "Days PM10": string;
};

type AqiSource = {
  geoType: "county" | "cbsa" | "nearest_county";
  stateName: string;
  geoName: string;
  distanceMiles: number | null;
  year: string;
  daysWithAqi: string;
  goodDays: string;
  moderateDays: string;
  unhealthySensitiveDays: string;
  unhealthyDays: string;
  veryUnhealthyDays: string;
  hazardousDays: string;
  maxAqi: string;
  p90Aqi: string;
  medianAqi: string;
  daysCo: string;
  daysNo2: string;
  daysOzone: string;
  daysPm25: string;
  daysPm10: string;
  sourceKind: string;
  sourceUrl: string;
  sourceFile: string;
};

type MatchRow = {
  location: LocationInput;
  source: AqiSource | null;
  matchStatus:
    | "matched_county"
    | "matched_city_as_county"
    | "matched_cbsa"
    | "matched_nearest_county"
    | "unmatched";
};

const stateNameByAbbr = Object.fromEntries(
  Object.entries(STATE_NAME_TO_ABBR).map(([name, abbr]) => [abbr, name])
) as Record<string, string>;

function argValue(name: string): string | null {
  const idx = process.argv.indexOf(name);
  if (idx === -1) return null;
  return process.argv[idx + 1] ?? null;
}

const dryRun = process.argv.includes("--dry-run");
const year = Number(argValue("--year") ?? new Date().getUTCFullYear() - 1);
if (!Number.isInteger(year) || year < 1990 || year > 2100) {
  throw new Error(`Invalid --year value: ${argValue("--year")}`);
}

const sourceFile = `annual_aqi_by_county_${year}.csv`;
const sourceUrl = `https://aqs.epa.gov/aqsweb/airdata/annual_aqi_by_county_${year}.zip`;
const sourceZip = path.join(CACHE_DIR, `annual_aqi_by_county_${year}.zip`);
const sourceCsv = path.join(CACHE_DIR, sourceFile);
const cbsaSourceFile = `annual_aqi_by_cbsa_${year}.csv`;
const cbsaSourceUrl = `https://aqs.epa.gov/aqsweb/airdata/annual_aqi_by_cbsa_${year}.zip`;
const cbsaSourceZip = path.join(CACHE_DIR, `annual_aqi_by_cbsa_${year}.zip`);
const cbsaSourceCsv = path.join(CACHE_DIR, cbsaSourceFile);
const countyGazetteerFile = "2024_Gaz_counties_national.txt";
const countyGazetteerUrl =
  "https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2024_Gazetteer/2024_Gaz_counties_national.zip";
const countyGazetteerZip = path.join(CACHE_DIR, "2024_Gaz_counties_national.zip");
const countyGazetteerPath = path.join(CACHE_DIR, countyGazetteerFile);
const matchReport = path.join(
  CACHE_DIR,
  `location_air_quality_matches_${year}.csv`
);

function normalizeName(value: string): string {
  return value
    .toLowerCase()
    .replace(/\./g, "")
    .replace(/\s+/g, " ")
    .replace(/\s+(county|parish|borough|city)$/i, "")
    .trim();
}

function countyKey(stateName: string, countyName: string): string {
  return `${normalizeName(stateName)}|${normalizeName(countyName)}`;
}

async function downloadFile(url: string, destination: string) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download ${url}: ${response.status}`);
  }
  const bytes = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(destination, bytes);
}

async function ensureZipCsv(url: string, zipPath: string, csvPath: string) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  if (fs.existsSync(csvPath)) return;

  console.log(`Downloading ${url}`);
  await downloadFile(url, zipPath);

  const tar = spawnSync("tar", ["-xf", zipPath, "-C", CACHE_DIR], {
    stdio: "inherit",
  });
  if (tar.status === 0 && fs.existsSync(csvPath)) return;

  const ps = spawnSync(
    "powershell",
    [
      "-NoProfile",
      "-Command",
      `Expand-Archive -Path '${zipPath}' -DestinationPath '${CACHE_DIR}' -Force`,
    ],
    { stdio: "inherit" }
  );
  if (ps.status !== 0 || !fs.existsSync(csvPath)) {
    throw new Error(`Could not extract ${zipPath}`);
  }
}

async function ensureSources() {
  await ensureZipCsv(sourceUrl, sourceZip, sourceCsv);
  await ensureZipCsv(cbsaSourceUrl, cbsaSourceZip, cbsaSourceCsv);
  await ensureZipCsv(countyGazetteerUrl, countyGazetteerZip, countyGazetteerPath);
}

function readCsv<T>(csvPath: string): T[] {
  return parse(fs.readFileSync(csvPath), {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as T[];
}

function readCountyFipsByName(): Map<string, string> {
  const lines = fs.readFileSync(countyGazetteerPath, "utf8").trim().split(/\r?\n/);
  const [header, ...rows] = lines;
  const columns = header.split("\t").map((column) => column.trim());
  const uspsIdx = columns.indexOf("USPS");
  const geoidIdx = columns.indexOf("GEOID");
  const nameIdx = columns.indexOf("NAME");
  const byName = new Map<string, string>();

  for (const line of rows) {
    const cells = line.split("\t");
    const usps = cells[uspsIdx];
    const geoid = cells[geoidIdx];
    const name = cells[nameIdx];
    if (usps && geoid && name) {
      byName.set(`${usps}|${normalizeName(name)}`, geoid);
    }
  }
  return byName;
}

function readCountyCbsaByFips(): Record<string, string> {
  const bundle = JSON.parse(fs.readFileSync(PACE_DERIVED_PATH, "utf8")) as {
    county_cbsa?: Record<string, string>;
  };
  return bundle.county_cbsa ?? {};
}

function readLocationCoordinates(): Map<string, LocationCoordinate> {
  const raw = JSON.parse(fs.readFileSync(LOCATION_COORDINATES_PATH, "utf8")) as {
    coordinates: LocationCoordinate[];
  };
  const byLocation = new Map<string, LocationCoordinate>();
  for (const row of raw.coordinates) {
    byLocation.set(`${row.state}|${normalizeName(row.name)}`, row);
  }
  return byLocation;
}

function readCountyCoordinates(): CountyCoordinate[] {
  const lines = fs.readFileSync(countyGazetteerPath, "utf8").trim().split(/\r?\n/);
  const [header, ...rows] = lines;
  const columns = header.split("\t").map((column) => column.trim());
  const uspsIdx = columns.indexOf("USPS");
  const nameIdx = columns.indexOf("NAME");
  const latIdx = columns.indexOf("INTPTLAT");
  const lonIdx = columns.indexOf("INTPTLONG");

  return rows.flatMap((line) => {
    const cells = line.split("\t");
    const state = cells[uspsIdx];
    const stateName = stateNameByAbbr[state];
    const countyName = cells[nameIdx];
    const latitude = Number(cells[latIdx]);
    const longitude = Number(cells[lonIdx]);
    if (
      !state ||
      !stateName ||
      !countyName ||
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude)
    ) {
      return [];
    }
    return [{ state, stateName, countyName, latitude, longitude }];
  });
}

function haversineMiles(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const radiusMiles = 3958.7613;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;
  return 2 * radiusMiles * Math.asin(Math.sqrt(a));
}

function toInt(source: AqiSource, key: keyof AqiSource): number {
  const parsed = Number.parseInt(String(source[key]), 10);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid integer for ${String(key)} in ${source.geoName}`);
  }
  return parsed;
}

function csvCell(value: string | number | null): string {
  const text = value == null ? "" : String(value);
  if (!/[",\r\n]/.test(text)) return text;
  return `"${text.replace(/"/g, '""')}"`;
}

function writeMatchReport(matches: MatchRow[]) {
  const headers = [
    "LocationId",
    "City",
    "State",
    "LocationCounty",
    "MatchStatus",
    "SourceGeoType",
    "SourceStateName",
    "SourceGeoName",
    "SourceDistanceMiles",
    "Year",
    "DaysWithAQI",
    "MedianAQI",
    "P90AQI",
    "MaxAQI",
    "GoodDays",
    "ModerateDays",
    "UnhealthySensitiveDays",
    "UnhealthyDays",
    "VeryUnhealthyDays",
    "HazardousDays",
    "SourceUrl",
  ];
  const lines = [headers.join(",")];
  for (const match of matches) {
    const s = match.source;
    lines.push(
      [
        match.location.id,
        match.location.name,
        match.location.state,
        match.location.county,
        match.matchStatus,
        s?.geoType ?? "",
        s?.stateName ?? "",
        s?.geoName ?? "",
        s?.distanceMiles ?? "",
        s?.year ?? year,
        s?.daysWithAqi ?? "",
        s?.medianAqi ?? "",
        s?.p90Aqi ?? "",
        s?.maxAqi ?? "",
        s?.goodDays ?? "",
        s?.moderateDays ?? "",
        s?.unhealthySensitiveDays ?? "",
        s?.unhealthyDays ?? "",
        s?.veryUnhealthyDays ?? "",
        s?.hazardousDays ?? "",
        s?.sourceUrl ?? "",
      ]
        .map(csvCell)
        .join(",")
    );
  }
  fs.writeFileSync(matchReport, `${lines.join("\n")}\n`);
}

function matchLocations(
  locations: LocationInput[],
  annualCountyRows: AnnualCountyAqi[],
  annualCbsaRows: AnnualCbsaAqi[]
): MatchRow[] {
  const byCounty = new Map<string, AnnualCountyAqi>();
  for (const row of annualCountyRows) {
    byCounty.set(countyKey(row.State, row.County), row);
  }
  const cbsaByCode = new Map<string, AnnualCbsaAqi>();
  for (const row of annualCbsaRows) {
    cbsaByCode.set(row["CBSA Code"].padStart(5, "0"), row);
  }
  const countyFipsByName = readCountyFipsByName();
  const countyCbsaByFips = readCountyCbsaByFips();
  const locationCoordinates = readLocationCoordinates();
  const countyCoordinates = readCountyCoordinates();

  const countySource = (row: AnnualCountyAqi): AqiSource => ({
    geoType: "county",
    stateName: row.State,
    geoName: row.County,
    distanceMiles: null,
    year: row.Year,
    daysWithAqi: row["Days with AQI"],
    goodDays: row["Good Days"],
    moderateDays: row["Moderate Days"],
    unhealthySensitiveDays: row["Unhealthy for Sensitive Groups Days"],
    unhealthyDays: row["Unhealthy Days"],
    veryUnhealthyDays: row["Very Unhealthy Days"],
    hazardousDays: row["Hazardous Days"],
    maxAqi: row["Max AQI"],
    p90Aqi: row["90th Percentile AQI"],
    medianAqi: row["Median AQI"],
    daysCo: row["Days CO"],
    daysNo2: row["Days NO2"],
    daysOzone: row["Days Ozone"],
    daysPm25: row["Days PM2.5"],
    daysPm10: row["Days PM10"],
    sourceKind: "epa_airdata_annual_aqi_by_county",
    sourceUrl,
    sourceFile: path.join(CACHE_DIR, sourceFile).replace(/\\/g, "/"),
  });

  const cbsaSource = (location: LocationInput, row: AnnualCbsaAqi): AqiSource => ({
    geoType: "cbsa",
    stateName: stateNameByAbbr[location.state] ?? location.state,
    geoName: row.CBSA,
    distanceMiles: null,
    year: row.Year,
    daysWithAqi: row["Days with AQI"],
    goodDays: row["Good Days"],
    moderateDays: row["Moderate Days"],
    unhealthySensitiveDays: row["Unhealthy for Sensitive Groups Days"],
    unhealthyDays: row["Unhealthy Days"],
    veryUnhealthyDays: row["Very Unhealthy Days"],
    hazardousDays: row["Hazardous Days"],
    maxAqi: row["Max AQI"],
    p90Aqi: row["90th Percentile AQI"],
    medianAqi: row["Median AQI"],
    daysCo: row["Days CO"],
    daysNo2: row["Days NO2"],
    daysOzone: row["Days Ozone"],
    daysPm25: row["Days PM2.5"],
    daysPm10: row["Days PM10"],
    sourceKind: "epa_airdata_annual_aqi_by_cbsa",
    sourceUrl: cbsaSourceUrl,
    sourceFile: path.join(CACHE_DIR, cbsaSourceFile).replace(/\\/g, "/"),
  });

  const annualCountyByState = new Map<string, AnnualCountyAqi[]>();
  for (const row of annualCountyRows) {
    const abbr = STATE_NAME_TO_ABBR[row.State];
    if (!abbr) continue;
    const current = annualCountyByState.get(abbr) ?? [];
    current.push(row);
    annualCountyByState.set(abbr, current);
  }

  function nearestCountyMatch(location: LocationInput): AqiSource | null {
    const city = locationCoordinates.get(`${location.state}|${normalizeName(location.name)}`);
    if (!city) return null;
    const sourceRows = annualCountyByState.get(location.state) ?? [];
    let best:
      | { row: AnnualCountyAqi; county: CountyCoordinate; distanceMiles: number }
      | null = null;

    for (const row of sourceRows) {
      const county = countyCoordinates.find(
        (c) =>
          c.state === location.state &&
          normalizeName(c.countyName) === normalizeName(row.County)
      );
      if (!county) continue;
      const distanceMiles = haversineMiles(
        city.latitude,
        city.longitude,
        county.latitude,
        county.longitude
      );
      if (!best || distanceMiles < best.distanceMiles) {
        best = { row, county, distanceMiles };
      }
    }

    if (!best) return null;
    return {
      ...countySource(best.row),
      geoType: "nearest_county",
      stateName: best.county.stateName,
      geoName: best.county.countyName,
      distanceMiles: Math.round(best.distanceMiles * 10) / 10,
    };
  }

  return locations.map((location) => {
    const stateName = stateNameByAbbr[location.state] ?? location.state;
    const countyMatch = byCounty.get(countyKey(stateName, location.county));
    if (countyMatch) {
      return {
        location,
        source: countySource(countyMatch),
        matchStatus: "matched_county",
      };
    }

    const cityAsCountyMatch = byCounty.get(countyKey(stateName, location.name));
    if (cityAsCountyMatch) {
      return {
        location,
        source: countySource(cityAsCountyMatch),
        matchStatus: "matched_city_as_county",
      };
    }

    const countyFips =
      countyFipsByName.get(`${location.state}|${normalizeName(location.county)}`) ??
      countyFipsByName.get(`${location.state}|${normalizeName(location.name)}`);
    const cbsaCode = countyFips ? countyCbsaByFips[countyFips] : null;
    const cbsaMatch = cbsaCode ? cbsaByCode.get(cbsaCode) : null;
    if (cbsaMatch) {
      return {
        location,
        source: cbsaSource(location, cbsaMatch),
        matchStatus: "matched_cbsa",
      };
    }

    const nearest = nearestCountyMatch(location);
    if (nearest) {
      return {
        location,
        source: nearest,
        matchStatus: "matched_nearest_county",
      };
    }

    return { location, source: null, matchStatus: "unmatched" };
  });
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required");
  }

  await ensureSources();

  const sql = getSql();
  const locations = (await sql.query(
    `SELECT id, name, state, county
     FROM locations_location
     ORDER BY state, name`
  )) as LocationInput[];

  const annualCountyRows = readCsv<AnnualCountyAqi>(sourceCsv);
  const annualCbsaRows = readCsv<AnnualCbsaAqi>(cbsaSourceCsv);
  const matches = matchLocations(locations, annualCountyRows, annualCbsaRows);
  const matched = matches.filter((m) => m.source);
  const unmatched = matches.filter((m) => !m.source);

  writeMatchReport(matches);

  console.log(
    `EPA annual AQI ${year}: ${matched.length}/${locations.length} locations matched`
  );
  console.log(`Match report: ${matchReport}`);
  if (unmatched.length) {
    console.log("Unmatched locations:");
    for (const item of unmatched) {
      console.log(
        `  - ${item.location.name}, ${item.location.state} (${item.location.county})`
      );
    }
  }

  if (dryRun) {
    console.log("Dry run complete (no database writes).");
    return;
  }

  for (const match of matched) {
    const row = match.source;
    if (!row) continue;
    await sql.query(
      `INSERT INTO location_air_quality_annual (
        location_id,
        year,
        source_geo_type,
        source_state_name,
        source_geo_name,
        source_distance_miles,
        days_with_aqi,
        good_days,
        moderate_days,
        unhealthy_sensitive_days,
        unhealthy_days,
        very_unhealthy_days,
        hazardous_days,
        max_aqi,
        p90_aqi,
        median_aqi,
        days_co,
        days_no2,
        days_ozone,
        days_pm25,
        days_pm10,
        data_vintage,
        source_kind,
        source_url,
        source_file,
        source_retrieved_on,
        updated_at
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14,
        $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, now()
      )
      ON CONFLICT (location_id, year, source_geo_type) DO UPDATE SET
        source_state_name = EXCLUDED.source_state_name,
        source_geo_name = EXCLUDED.source_geo_name,
        source_distance_miles = EXCLUDED.source_distance_miles,
        days_with_aqi = EXCLUDED.days_with_aqi,
        good_days = EXCLUDED.good_days,
        moderate_days = EXCLUDED.moderate_days,
        unhealthy_sensitive_days = EXCLUDED.unhealthy_sensitive_days,
        unhealthy_days = EXCLUDED.unhealthy_days,
        very_unhealthy_days = EXCLUDED.very_unhealthy_days,
        hazardous_days = EXCLUDED.hazardous_days,
        max_aqi = EXCLUDED.max_aqi,
        p90_aqi = EXCLUDED.p90_aqi,
        median_aqi = EXCLUDED.median_aqi,
        days_co = EXCLUDED.days_co,
        days_no2 = EXCLUDED.days_no2,
        days_ozone = EXCLUDED.days_ozone,
        days_pm25 = EXCLUDED.days_pm25,
        days_pm10 = EXCLUDED.days_pm10,
        data_vintage = EXCLUDED.data_vintage,
        source_kind = EXCLUDED.source_kind,
        source_url = EXCLUDED.source_url,
        source_file = EXCLUDED.source_file,
        source_retrieved_on = EXCLUDED.source_retrieved_on,
        updated_at = now()`,
      [
        match.location.id,
        toInt(row, "year"),
        row.geoType,
        row.stateName,
        row.geoName,
        row.distanceMiles,
        toInt(row, "daysWithAqi"),
        toInt(row, "goodDays"),
        toInt(row, "moderateDays"),
        toInt(row, "unhealthySensitiveDays"),
        toInt(row, "unhealthyDays"),
        toInt(row, "veryUnhealthyDays"),
        toInt(row, "hazardousDays"),
        toInt(row, "maxAqi"),
        toInt(row, "p90Aqi"),
        toInt(row, "medianAqi"),
        toInt(row, "daysCo"),
        toInt(row, "daysNo2"),
        toInt(row, "daysOzone"),
        toInt(row, "daysPm25"),
        toInt(row, "daysPm10"),
        `EPA AirData ${row.sourceKind.replace("epa_airdata_", "")}_${year}`,
        row.sourceKind,
        row.sourceUrl,
        row.sourceFile,
        SOURCE_RETRIEVED_ON,
      ]
    );
  }

  console.log(`Upserted ${matched.length} location_air_quality_annual rows.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
