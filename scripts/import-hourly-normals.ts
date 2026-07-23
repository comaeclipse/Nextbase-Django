/*
 * Import per-city hourly weather normals (dew point / heat index) from
 * NOAA/NCEI 1991-2020 Hourly Climate Normals into `location_hourly_normals`.
 *
 * This is the moisture counterpart to import-weather-monthly.ts, which cannot
 * supply humidity: the GHCN *monthly* normals product has no humidity element.
 * Dew point lives only in the *hourly* product, published for ASOS/airport
 * (USW) stations — so candidates are filtered to USW and probed nearest-first;
 * a 404 means "station has no hourly normals, try the next one".
 *
 * ~Half the cities' nearest temperature station is a COOP (USC) site with no
 * hourly data, so a city's moisture station is often not its temperature
 * station, and is often farther away. That is acceptable *for moisture only*:
 * dew point is an air-mass property that varies smoothly across a region, while
 * temperature varies sharply with elevation and urbanization. The chosen
 * station and its distance are stored on every row so the tradeoff stays
 * auditable rather than invisible.
 *
 * NCEI publishes 8760 values per station (day-of-year x hour); we average
 * across the days of each month to 288 rows (12 months x 24 hours), preserving
 * the diurnal cycle. Raw CSVs (~6MB each) are cached under
 * data/sources/weather/hourly/ and are gitignored — regenerable via --refresh.
 *
 * Source: https://www.ncei.noaa.gov/data/normals-hourly/1991-2020/
 * City coordinates: data/location-map-coordinates.json (Census Gazetteer).
 *
 * Usage:
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/import-hourly-normals.ts --all [--dry-run]
 *   ... scripts/import-hourly-normals.ts --name "Phoenix, AZ"
 *   ... scripts/import-hourly-normals.ts --id 42
 * Flags: --all | --id N | --name "City, ST" | --dry-run | --limit N
 *        --max-distance-mi N (default 100) | --refresh (ignore cached CSVs)
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { getSql } from "../lib/db";

const NCEI_HOURLY_BASE =
  "https://www.ncei.noaa.gov/data/normals-hourly/1991-2020";
const DATA_VINTAGE = "1991-2020";
const SOURCE_KIND = "noaa_hourly_normals";
const CACHE_DIR = path.join("data", "sources", "weather");
// Monthly normals inventory, already cached by import-weather-monthly.ts. NCEI
// publishes no separate hourly inventory, so we filter this to USW and probe.
const INVENTORY_FILE = path.join(CACHE_DIR, "inventory_30yr.txt");
const INVENTORY_URL = `https://www.ncei.noaa.gov/data/normals-monthly/1991-2020/doc/inventory_30yr.txt`;
const HOURLY_CACHE = path.join(CACHE_DIR, "hourly");

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
// Wider than the monthly importer's 75mi: dew point tolerates distance, and a
// COOP-served city may have no airport nearby. Distance is recorded per row.
const maxDistanceMi = val("--max-distance-mi")
  ? Number(val("--max-distance-mi"))
  : 100;
const MAX_STATION_TRIES = 12;

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
}
interface HourRow {
  month: number;
  hour: number;
  temp_f: number | null;
  dew_point_f: number | null;
  dew_point_p10_f: number | null;
  dew_point_p90_f: number | null;
  heat_index_f: number | null;
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

/*
 * NCEI encodes missing as -9999 (and -7777 for trace). Dew point is legitimately
 * negative in winter, so guard on the sentinel range rather than on sign.
 */
function num(raw: string | undefined): number | null {
  if (raw == null) return null;
  const t = raw.trim();
  if (t === "") return null;
  const n = Number(t);
  if (!Number.isFinite(n) || n <= -900) return null;
  return n;
}

/** Quote-aware CSV split: station NAME contains embedded commas. */
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
  let text: string;
  try {
    text = await fs.readFile(INVENTORY_FILE, "utf8");
  } catch {
    console.log("  downloading station inventory…");
    text = await fetchText(INVENTORY_URL);
    await fs.mkdir(CACHE_DIR, { recursive: true });
    await fs.writeFile(INVENTORY_FILE, text);
  }
  const stations: Station[] = [];
  for (const line of text.split("\n")) {
    if (line.length < 40) continue;
    // GHCN-D fixed-width: id[0-10] lat[12-19] lon[21-29]
    const id = line.slice(0, 11).trim();
    const lat = Number(line.slice(12, 20));
    const lon = Number(line.slice(21, 30));
    if (!id || !Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    // Hourly normals exist for ASOS/airport (USW) stations only.
    if (!id.startsWith("USW")) continue;
    stations.push({ id, lat, lon });
  }
  return stations;
}

/*
 * NCEI publishes exactly 8760 hourly values (+1 header) per station, so a
 * shorter file is a truncated write, never a real record. This matters because
 * a bad cache entry is indistinguishable from a missing station downstream:
 * parseStation returns null either way, the city silently falls through to a
 * farther station — or gets dropped entirely — and the cache stays poisoned
 * for every future run.
 */
const EXPECTED_CSV_LINES = 8761;

function isCompleteCsv(text: string): boolean {
  return text.trim().split(/\r?\n/).length >= EXPECTED_CSV_LINES;
}

/** Returns null ONLY when the station genuinely has no hourly normals (404). */
async function loadStationCsv(id: string): Promise<string | null> {
  const cached = path.join(HOURLY_CACHE, `${id}.csv`);
  if (!refresh) {
    try {
      const text = await fs.readFile(cached, "utf8");
      if (isCompleteCsv(text)) return text;
      console.log(`      (discarding truncated cache for ${id}, re-fetching)`);
    } catch {
      /* not cached yet */
    }
  }

  let text: string;
  try {
    text = await fetchText(`${NCEI_HOURLY_BASE}/access/${id}.csv`);
  } catch {
    return null; // 404 — this station has no hourly normals; try the next one
  }

  // Write to a temp file and rename: a partial write must never become a
  // visible cache entry. And a caching failure must not masquerade as missing
  // data — we already hold the text, so return it regardless.
  try {
    await fs.mkdir(HOURLY_CACHE, { recursive: true });
    const tmp = `${cached}.${process.pid}.tmp`;
    await fs.writeFile(tmp, text);
    await fs.rename(tmp, cached);
  } catch (err) {
    console.warn(`      (could not cache ${id}: ${(err as Error).message})`);
  }
  return text;
}

interface Parsed {
  rows: HourRow[];
  stationName: string | null;
}

/**
 * Collapse 8760 day-hours into 288 month-hour means.
 * Returns null when the station lacks usable dew point — the reason we are here.
 */
function parseStation(csv: string): Parsed | null {
  const lines = csv.trim().split(/\r?\n/);
  const header = splitCsv(lines[0]).map((h) => h.trim());
  const idx = (name: string) => header.indexOf(name);
  const iMonth = idx("month");
  const iHour = idx("hour");
  const iName = idx("NAME");
  const cols = {
    temp_f: idx("HLY-TEMP-NORMAL"),
    dew_point_f: idx("HLY-DEWP-NORMAL"),
    dew_point_p10_f: idx("HLY-DEWP-10PCTL"),
    dew_point_p90_f: idx("HLY-DEWP-90PCTL"),
    heat_index_f: idx("HLY-HIDX-NORMAL"),
  } as const;
  if (iMonth < 0 || iHour < 0 || cols.dew_point_f < 0) return null;

  type Acc = { sum: number; n: number };
  const acc = new Map<number, Record<keyof typeof cols, Acc>>();
  const blank = (): Record<keyof typeof cols, Acc> => ({
    temp_f: { sum: 0, n: 0 },
    dew_point_f: { sum: 0, n: 0 },
    dew_point_p10_f: { sum: 0, n: 0 },
    dew_point_p90_f: { sum: 0, n: 0 },
    heat_index_f: { sum: 0, n: 0 },
  });

  let stationName: string | null = null;
  const monthsWithDewp = new Set<number>();

  for (const line of lines.slice(1)) {
    const c = splitCsv(line);
    const month = Number(c[iMonth]);
    const hour = Number(c[iHour]);
    if (!(month >= 1 && month <= 12) || !(hour >= 0 && hour <= 23)) continue;
    if (stationName == null && iName >= 0) stationName = c[iName]?.trim() || null;

    const key = month * 100 + hour;
    let bucket = acc.get(key);
    if (!bucket) {
      bucket = blank();
      acc.set(key, bucket);
    }
    for (const k of Object.keys(cols) as (keyof typeof cols)[]) {
      const v = num(c[cols[k]]);
      if (v == null) continue;
      bucket[k].sum += v;
      bucket[k].n++;
      if (k === "dew_point_f") monthsWithDewp.add(month);
    }
  }

  // A station that only carries dew point for part of the year would skew any
  // summer-vs-annual comparison; require full coverage rather than patch it.
  if (monthsWithDewp.size < 12) return null;

  const mean = (a: Acc) => (a.n === 0 ? null : Math.round((a.sum / a.n) * 10) / 10);
  const rows: HourRow[] = [];
  for (let month = 1; month <= 12; month++) {
    for (let hour = 0; hour <= 23; hour++) {
      const b = acc.get(month * 100 + hour);
      if (!b) continue;
      rows.push({
        month,
        hour,
        temp_f: mean(b.temp_f),
        dew_point_f: mean(b.dew_point_f),
        dew_point_p10_f: mean(b.dew_point_p10_f),
        dew_point_p90_f: mean(b.dew_point_p90_f),
        heat_index_f: mean(b.heat_index_f),
      });
    }
  }
  if (rows.length < 288) return null;
  return { rows, stationName };
}

async function upsertCity(
  locationId: number,
  station: Station,
  distanceMi: number,
  parsed: Parsed
) {
  const retrievedOn = new Date().toISOString().slice(0, 10);
  const sourceUrl = `${NCEI_HOURLY_BASE}/access/${station.id}.csv`;

  // One batched statement per city (288 rows); the monthly importer's
  // row-at-a-time INSERT would be 288 HTTP round-trips per city here.
  const params: unknown[] = [];
  const tuples = parsed.rows.map((r) => {
    const base = params.length;
    params.push(
      locationId,
      r.month,
      r.hour,
      r.temp_f,
      r.dew_point_f,
      r.dew_point_p10_f,
      r.dew_point_p90_f,
      r.heat_index_f,
      station.id,
      parsed.stationName,
      Math.round(distanceMi * 10) / 10,
      DATA_VINTAGE,
      SOURCE_KIND,
      sourceUrl,
      retrievedOn
    );
    return `(${Array.from({ length: 15 }, (_, i) => `$${base + i + 1}`).join(",")})`;
  });

  await sql.query(
    `INSERT INTO location_hourly_normals
       (location_id, month, hour, temp_f, dew_point_f, dew_point_p10_f,
        dew_point_p90_f, heat_index_f, station_id, station_name,
        station_distance_mi, data_vintage, source_kind, source_url,
        source_retrieved_on)
     VALUES ${tuples.join(",")}
     ON CONFLICT (location_id, month, hour) DO UPDATE SET
       temp_f = EXCLUDED.temp_f,
       dew_point_f = EXCLUDED.dew_point_f,
       dew_point_p10_f = EXCLUDED.dew_point_p10_f,
       dew_point_p90_f = EXCLUDED.dew_point_p90_f,
       heat_index_f = EXCLUDED.heat_index_f,
       station_id = EXCLUDED.station_id,
       station_name = EXCLUDED.station_name,
       station_distance_mi = EXCLUDED.station_distance_mi,
       data_vintage = EXCLUDED.data_vintage,
       source_kind = EXCLUDED.source_kind,
       source_url = EXCLUDED.source_url,
       source_retrieved_on = EXCLUDED.source_retrieved_on`,
    params
  );
}

async function main() {
  if (!doAll && onlyId === undefined && !onlyName) {
    console.error('Specify --all, --id N, or --name "City, ST".');
    process.exit(1);
  }
  console.log(`NOAA hourly-normals import${dryRun ? " (dry run)" : ""}\n`);

  const coordJson = JSON.parse(
    await fs.readFile(path.join("data", "location-map-coordinates.json"), "utf8")
  ) as { coordinates: Coord[] };
  const coordsByCity = new Map<string, Coord>(
    coordJson.coordinates.map((c) => [coordKey(c.name, c.state), c])
  );

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

  const stations = await loadInventory();
  console.log(
    `  ${stations.length} USW stations, ${targets.length} cities (max ${maxDistanceMi} mi)\n`
  );

  let matched = 0;
  const skipped: string[] = [];
  const far: string[] = [];

  for (const t of targets) {
    const coord = coordsByCity.get(coordKey(t.name, t.state));
    if (!coord) {
      skipped.push(`${t.name}, ${t.state} (no coordinates)`);
      continue;
    }
    const ranked = stations
      .map((s) => ({
        s,
        d: haversineMi(coord.latitude, coord.longitude, s.lat, s.lon),
      }))
      .filter((x) => x.d <= maxDistanceMi)
      .sort((a, b) => a.d - b.d)
      .slice(0, MAX_STATION_TRIES);

    let chosen: { s: Station; d: number; parsed: Parsed } | null = null;
    for (const cand of ranked) {
      const csv = await loadStationCsv(cand.s.id);
      if (!csv) continue;
      const parsed = parseStation(csv);
      if (parsed) {
        chosen = { s: cand.s, d: cand.d, parsed };
        break;
      }
    }

    if (!chosen) {
      skipped.push(
        `${t.name}, ${t.state} (no hourly-normals station within ${maxDistanceMi} mi)`
      );
      continue;
    }

    matched++;
    const tag = `${t.name}, ${t.state}`.padEnd(24);
    console.log(
      `  ${dryRun ? "=" : "+"} ${tag} ← ${chosen.s.id} (${chosen.d.toFixed(1)} mi)`
    );
    if (chosen.d > 50) far.push(`${t.name}, ${t.state} — ${chosen.s.id} (${chosen.d.toFixed(1)} mi)`);
    if (!dryRun)
      await upsertCity(t.id, chosen.s, chosen.d, chosen.parsed);
  }

  console.log(
    `\n${dryRun ? "Dry run: " : ""}${matched} matched, ${skipped.length} skipped.`
  );
  if (far.length) {
    console.log(`\nMatched beyond 50 mi (review — moisture may be unrepresentative):`);
    for (const f of far) console.log(`  ! ${f}`);
  }
  if (skipped.length) {
    console.log("\nSkipped:");
    for (const s of skipped) console.log(`  - ${s}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
