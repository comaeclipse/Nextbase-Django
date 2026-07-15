/*
 * Import per-city monthly weather normals from NOAA/NCEI 1991-2020 Climate
 * Normals into `location_weather_monthly`.
 *
 * For each retirement location we find the nearest GHCN station that actually
 * carries temperature normals (many co-op stations are precip-only), fetch its
 * monthly-normals CSV, and upsert the 12 months. Temperature, precipitation,
 * snowfall and precip-day counts come from NCEI; humidity and % sunshine are
 * NOT in the GHCN normals product, so those columns stay null (the /weather
 * page renders them as "data unavailable").
 *
 * Source: https://www.ncei.noaa.gov/data/normals-monthly/1991-2020/
 * City coordinates: data/location-map-coordinates.json (Census Gazetteer).
 * Station CSVs and the inventory are cached under data/sources/weather/.
 *
 * Usage:
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/import-weather-monthly.ts --all [--dry-run]
 *   ... scripts/import-weather-monthly.ts --name "Casper, WY"
 *   ... scripts/import-weather-monthly.ts --id 42
 * Flags: --all | --id N | --name "City, ST" | --dry-run | --limit N
 *        --max-distance-mi N (default 75) | --refresh (ignore cached CSVs)
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { getSql } from "../lib/db";

const NCEI_BASE =
  "https://www.ncei.noaa.gov/data/normals-monthly/1991-2020";
const INVENTORY_URL = `${NCEI_BASE}/doc/inventory_30yr.txt`;
const DATA_VINTAGE = "1991-2020";
const SOURCE_KIND = "noaa_normals";
const CACHE_DIR = path.join("data", "sources", "weather");
const STATION_CACHE = path.join(CACHE_DIR, "stations");

// ---- CLI ----
const argv = process.argv.slice(2);
const has = (f: string) => argv.includes(f);
const val = (f: string) => {
  const i = argv.indexOf(f);
  return i >= 0 ? argv[i + 1] : undefined;
};
const dryRun = has("--dry-run");
const refresh = has("--refresh");
const doAll = has("--all");
const onlyId = val("--id") ? Number(val("--id")) : undefined;
const onlyName = val("--name");
const limit = val("--limit") ? Number(val("--limit")) : undefined;
const maxDistanceMi = val("--max-distance-mi")
  ? Number(val("--max-distance-mi"))
  : 75;
// Dense metros (Phoenix) can have 20+ precip-only co-op sites nearer than the
// airport, so probe generously before giving up on a temperature station.
const MAX_STATION_TRIES = 30;

const sql = getSql();

interface Coord {
  name: string;
  state: string;
  latitude: number;
  longitude: number;
}
interface Station {
  id: string;
  lat: number;
  lon: number;
  state: string;
}
interface MonthRow {
  month: number;
  avg_high_f: number | null;
  avg_low_f: number | null;
  avg_temp_f: number | null;
  precip_in: number | null;
  snow_in: number | null;
  precip_days: number | null;
}

function coordKey(name: string, state: string) {
  return `${name.trim().toLowerCase()}|${state.trim().toUpperCase()}`;
}

function haversineMi(aLat: number, aLon: number, bLat: number, bLon: number) {
  const R = 3958.8;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLon = ((bLon - aLon) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) *
      Math.cos((bLat * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

/** NCEI normals encode missing as -9999 / blank; guard those. */
function num(raw: string | undefined): number | null {
  if (raw == null) return null;
  const t = raw.trim();
  if (t === "" || t.startsWith("-999")) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

/** Quote-aware CSV line split (station NAME contains embedded commas). */
function splitCsv(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQ && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else inQ = !inQ;
    } else if (ch === "," && !inQ) {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out;
}

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

async function loadInventory(): Promise<Station[]> {
  const cached = path.join(CACHE_DIR, "inventory_30yr.txt");
  let text: string;
  try {
    if (refresh) throw new Error("refresh");
    text = await fs.readFile(cached, "utf8");
  } catch {
    console.log("  downloading station inventory…");
    text = await fetchText(INVENTORY_URL);
    await fs.mkdir(CACHE_DIR, { recursive: true });
    await fs.writeFile(cached, text);
  }
  const stations: Station[] = [];
  for (const line of text.split("\n")) {
    if (line.length < 40) continue;
    // GHCN-D fixed-width: id[0-10] lat[12-19] lon[21-29] elev[31-36] state[38-39]
    const id = line.slice(0, 11).trim();
    const lat = Number(line.slice(12, 20));
    const lon = Number(line.slice(21, 30));
    const state = line.slice(38, 40).trim();
    if (!id || !Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    stations.push({ id, lat, lon, state });
  }
  return stations;
}

async function loadStationCsv(id: string): Promise<string | null> {
  const cached = path.join(STATION_CACHE, `${id}.csv`);
  try {
    if (refresh) throw new Error("refresh");
    return await fs.readFile(cached, "utf8");
  } catch {
    try {
      const text = await fetchText(`${NCEI_BASE}/access/${id}.csv`);
      await fs.mkdir(STATION_CACHE, { recursive: true });
      await fs.writeFile(cached, text);
      return text;
    } catch {
      return null; // station has no monthly-normals file
    }
  }
}

/** Parse a station CSV into 12 month rows, or null if it lacks temperature. */
function parseStation(csv: string): MonthRow[] | null {
  const lines = csv.trim().split("\n");
  const header = splitCsv(lines[0]).map((h) => h.trim());
  const idx = (name: string) => header.indexOf(name);
  const iMonth = idx("month");
  const iTmax = idx("MLY-TMAX-NORMAL");
  const iTmin = idx("MLY-TMIN-NORMAL");
  const iTavg = idx("MLY-TAVG-NORMAL");
  const iPrcp = idx("MLY-PRCP-NORMAL");
  const iSnow = idx("MLY-SNOW-NORMAL");
  const iPdays = idx("MLY-PRCP-AVGNDS-GE001HI");

  const rows: MonthRow[] = [];
  let tempMonths = 0;
  for (const line of lines.slice(1)) {
    const c = splitCsv(line);
    const month = Number(c[iMonth]);
    if (!(month >= 1 && month <= 12)) continue;
    const avg_high_f = num(c[iTmax]);
    const avg_low_f = num(c[iTmin]);
    const pdays = num(c[iPdays]);
    if (avg_high_f != null || avg_low_f != null) tempMonths++;
    rows.push({
      month,
      avg_high_f,
      avg_low_f,
      avg_temp_f: num(c[iTavg]),
      precip_in: num(c[iPrcp]),
      snow_in: num(c[iSnow]),
      precip_days: pdays == null ? null : Math.round(pdays),
    });
  }
  // Require temperature for most of the year, else this is a precip-only site.
  if (tempMonths < 6 || rows.length < 12) return null;
  return rows.sort((a, b) => a.month - b.month);
}

async function upsertCity(
  locationId: number,
  station: Station,
  rows: MonthRow[]
) {
  const retrievedOn = new Date().toISOString().slice(0, 10);
  const sourceUrl = `${NCEI_BASE}/access/${station.id}.csv`;
  for (const r of rows) {
    await sql.query(
      `INSERT INTO location_weather_monthly
         (location_id, month, avg_high_f, avg_low_f, avg_temp_f,
          precip_in, snow_in, precip_days,
          data_vintage, source_kind, source_url, source_retrieved_on)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       ON CONFLICT (location_id, month) DO UPDATE SET
         avg_high_f = EXCLUDED.avg_high_f,
         avg_low_f = EXCLUDED.avg_low_f,
         avg_temp_f = EXCLUDED.avg_temp_f,
         precip_in = EXCLUDED.precip_in,
         snow_in = EXCLUDED.snow_in,
         precip_days = EXCLUDED.precip_days,
         data_vintage = EXCLUDED.data_vintage,
         source_kind = EXCLUDED.source_kind,
         source_url = EXCLUDED.source_url,
         source_retrieved_on = EXCLUDED.source_retrieved_on`,
      [
        locationId,
        r.month,
        r.avg_high_f,
        r.avg_low_f,
        r.avg_temp_f,
        r.precip_in,
        r.snow_in,
        r.precip_days,
        DATA_VINTAGE,
        SOURCE_KIND,
        sourceUrl,
        retrievedOn,
      ]
    );
  }
}

async function main() {
  if (!doAll && onlyId === undefined && !onlyName) {
    console.error("Specify --all, --id N, or --name \"City, ST\".");
    process.exit(1);
  }
  console.log(`NOAA monthly-normals import${dryRun ? " (dry run)" : ""}\n`);

  // 1. City coordinates
  const coordJson = JSON.parse(
    await fs.readFile(
      path.join("data", "location-map-coordinates.json"),
      "utf8"
    )
  ) as { coordinates: Coord[] };
  const coordsByCity = new Map<string, Coord>(
    coordJson.coordinates.map((c) => [coordKey(c.name, c.state), c])
  );

  // 2. Target locations from the DB
  const locRows = (await sql.query(
    `SELECT id, name, state FROM locations_location ORDER BY name ASC`
  )) as { id: number | string; name: string; state: string }[];
  let targets = locRows
    .map((l) => ({ id: Number(l.id), name: l.name, state: l.state }))
    .filter((l) => {
      if (onlyId !== undefined) return l.id === onlyId;
      if (onlyName)
        return (
          coordKey(l.name, l.state) ===
          coordKey(...(onlyName.split(",") as [string, string]))
        );
      return true;
    });
  if (limit) targets = targets.slice(0, limit);

  // 3. Station inventory
  const stations = await loadInventory();
  console.log(`  ${stations.length} stations, ${targets.length} cities\n`);

  let matched = 0;
  const skipped: string[] = [];

  for (const t of targets) {
    const coord = coordsByCity.get(coordKey(t.name, t.state));
    if (!coord) {
      skipped.push(`${t.name}, ${t.state} (no coordinates)`);
      continue;
    }
    // Nearest-first candidates within range
    const ranked = stations
      .map((s) => ({
        s,
        d: haversineMi(coord.latitude, coord.longitude, s.lat, s.lon),
      }))
      .filter((x) => x.d <= maxDistanceMi)
      .sort((a, b) => a.d - b.d)
      .slice(0, MAX_STATION_TRIES);

    let chosen: { s: Station; d: number; rows: MonthRow[] } | null = null;
    for (const cand of ranked) {
      const csv = await loadStationCsv(cand.s.id);
      if (!csv) continue;
      const rows = parseStation(csv);
      if (rows) {
        chosen = { s: cand.s, d: cand.d, rows };
        break;
      }
    }

    if (!chosen) {
      skipped.push(
        `${t.name}, ${t.state} (no temp station within ${maxDistanceMi} mi)`
      );
      continue;
    }

    matched++;
    const tag = `${t.name}, ${t.state}`.padEnd(24);
    console.log(
      `  ${dryRun ? "=" : "+"} ${tag} ← ${chosen.s.id} (${chosen.d.toFixed(
        1
      )} mi)`
    );
    if (!dryRun) await upsertCity(t.id, chosen.s, chosen.rows);
  }

  console.log(
    `\n${dryRun ? "Dry run: " : ""}${matched} matched, ${skipped.length} skipped.`
  );
  if (skipped.length) {
    console.log("Skipped:");
    for (const s of skipped) console.log(`  - ${s}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
