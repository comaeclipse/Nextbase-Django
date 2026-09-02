/**
 * Derive `locations_location.sun_days` (annual sunny days on the weather card)
 * for ranked cities that have none, from NOAA's Comparative Climatic Data.
 *
 * Convention: sun_days = mean annual CLEAR + PARTLY CLOUDY days at the nearest
 * CCD cloudiness station (CCD-2018 table "Cloudiness — Mean Number of Days",
 * daylight hours; clear ≤ 3/10 sky cover, partly cloudy 4/10–7/10). This is
 * the same figure the consumer climate sites already cited for the existing
 * values report as "sunny days": checked against the 196 filled ranked cities
 * on 2026-09-02, the nearest-station CL+PC matched the stored sun_days with a
 * median difference of 0 (173/196 within ±10 days), so the backfill stays on
 * one convention instead of mixing sources.
 *
 * Reads: data/sources/weather/ccd/ccd18_cloudiness_stations.json (station,
 * coordinates, CL/PC/CD) and the DB (candidate cities with coordinates and no
 * sun_days). Writes a patch file for scripts/apply-location-patches.ts; the
 * DB is never written here. Stations farther than --max-miles (default 110)
 * are skipped and reported rather than guessed.
 *
 * Usage:
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/derive-sun-days-from-ccd.ts \
 *     --out data/sources/weather/ccd/location_sun_days_backfill_2026-09-02.json [--max-miles 110]
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { getSql } from "../lib/db";

interface Station {
  wban: string;
  name: string;
  lat: number | null;
  lon: number | null;
  cl: number;
  pc: number;
  cd: number;
  coord_source: string | null;
}

interface StationFile {
  source: string;
  ccd_table: string;
  retrieved_on: string;
  stations: Station[];
}

/** Beyond this the station stops describing the city's sky; report, don't fill. */
const DEFAULT_MAX_MILES = 110;
/** From here on the patch method text calls the station a regional proxy. */
const REGIONAL_PROXY_MILES = 50;

function arg(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  if (i === -1) return undefined;
  const v = process.argv[i + 1];
  if (!v || v.startsWith("--")) throw new Error(`Missing value for ${flag}`);
  return v;
}

export function haversineMiles(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export function nearestStation(
  lat: number,
  lon: number,
  stations: Station[],
): { station: Station; miles: number } {
  let best: { station: Station; miles: number } | null = null;
  for (const s of stations) {
    if (s.lat == null || s.lon == null) continue;
    const miles = haversineMiles(lat, lon, s.lat, s.lon);
    if (!best || miles < best.miles) best = { station: s, miles };
  }
  if (!best) throw new Error("no geocoded CCD stations");
  return best;
}

async function main() {
  const out = arg("--out");
  if (!out) throw new Error("--out <patch.json> is required");
  const maxMiles = Number(arg("--max-miles") ?? DEFAULT_MAX_MILES);

  const file = JSON.parse(
    readFileSync(join(process.cwd(), "data/sources/weather/ccd/ccd18_cloudiness_stations.json"), "utf8"),
  ) as StationFile;
  const stations = file.stations.filter((s) => s.lat != null && s.lon != null);

  const sql = getSql();
  const rows = (await sql`
    SELECT id::int AS id, name, state, latitude::float AS lat, longitude::float AS lon
    FROM locations_location
    WHERE is_candidate AND geo_type = 'city' AND sun_days IS NULL
    ORDER BY state, name
  `) as Array<{ id: number; name: string; state: string; lat: number | null; lon: number | null }>;

  const patches: unknown[] = [];
  const skipped: string[] = [];
  for (const r of rows) {
    if (r.lat == null || r.lon == null) {
      skipped.push(`${r.name}, ${r.state}: no coordinates`);
      continue;
    }
    const { station, miles } = nearestStation(r.lat, r.lon, stations);
    const dist = Math.round(miles);
    if (miles > maxMiles) {
      skipped.push(`${r.name}, ${r.state}: nearest CCD station ${station.name} is ${dist} mi (> ${maxMiles})`);
      continue;
    }
    const sunDays = station.cl + station.pc;
    const proxy = miles > REGIONAL_PROXY_MILES ? " — regional proxy" : "";
    console.log(
      `${r.name}, ${r.state}: ${station.name} (WBAN ${station.wban}, ${dist} mi) clear ${station.cl} + partly cloudy ${station.pc} = ${sunDays}${proxy}`,
    );
    patches.push({
      id: r.id,
      name: r.name,
      state: r.state,
      fields: { sun_days: sunDays },
      method: `NOAA CCD-2018 mean annual clear (${station.cl}) + partly cloudy (${station.pc}) days at ${station.name}, WBAN ${station.wban}, ${dist} mi from the city${proxy}`,
      source_url: file.ccd_table,
      evidence: {
        station: station.name,
        wban: station.wban,
        distance_miles: dist,
        clear_days: station.cl,
        partly_cloudy_days: station.pc,
        cloudy_days: station.cd,
        station_coord_source: station.coord_source,
      },
    });
  }

  writeFileSync(
    out,
    JSON.stringify(
      {
        retrieved_on: file.retrieved_on,
        source: `${file.source} sun_days = annual clear + partly cloudy days at the nearest station (see scripts/derive-sun-days-from-ccd.ts).`,
        patches,
        skipped,
      },
      null,
      2,
    ) + "\n",
  );
  console.log(`\nwrote ${out}: ${patches.length} patches, ${skipped.length} skipped`);
  for (const s of skipped) console.log(`  SKIP ${s}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
