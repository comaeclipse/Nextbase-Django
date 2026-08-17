/*
 * Refresh nearest outpatient VA and nearest VA medical center for every city.
 *
 * Primary source (no API key): the public VHA ArcGIS FeatureServer backed by the
 * official VAST database (updated monthly; FGDC-authorized public VHA release).
 * Optional: set VA_FACILITIES_API_KEY to prefer the Lighthouse VA Facilities API
 * for the same typed nearest-facility calculation.
 *
 * Classification (VAST STA_NO rules from the VHA layer metadata):
 *   - length 3  → parent facility / VA medical center (hospital access)
 *   - other     → supporting site; "Vet Center" names are counseling-only and
 *                 are excluded from outpatient medical access
 *
 * Distances are great-circle miles from the city centroid (method recorded in
 * the companion sources note). Legacy fields nearest_va / distance_to_va stay
 * outpatient-oriented; hospital fields are separate.
 *
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/sync-va-facilities.ts [--dry-run] [--missing-only]
 */
import { writeFileSync } from "node:fs";
import { getSql } from "../lib/db";

const dryRun = process.argv.includes("--dry-run");
const missingOnly = process.argv.includes("--missing-only");

const VHA_LAYER =
  "https://services1.arcgis.com/smmmD7AGkh7eJR2a/arcgis/rest/services/Veterans_Health_Administration_(VHA)_Facilities/FeatureServer/0";
const SOURCE_URL =
  "https://vha.maps.arcgis.com/home/item.html?id=c6821e66523a46f5b32893641b9bd0dd";
const EARTH_RADIUS_MI = 3958.8;

interface VaSite {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  lat: number;
  lon: number;
  kind: "hospital" | "outpatient";
}

interface CityRow {
  id: string;
  name: string;
  state: string;
  latitude: number;
  longitude: number;
  nearest_va: string | null;
  distance_to_va: string | null;
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function haversineMiles(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const dLat = toRad(bLat - aLat);
  const dLon = toRad(bLon - aLon);
  const lat1 = toRad(aLat);
  const lat2 = toRad(bLat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_MI * Math.asin(Math.min(1, Math.sqrt(h)));
}

function formatMiles(mi: number): string {
  if (mi < 0.5) return "0 miles";
  return `${Math.round(mi)} miles`;
}

function samePlace(site: VaSite, city: CityRow): boolean {
  return (
    site.state?.toUpperCase() === city.state.toUpperCase() &&
    site.city?.trim().toLowerCase() === city.name.trim().toLowerCase()
  );
}

function classifySite(staNo: string, name: string): VaSite["kind"] | null {
  if (/vet\s*center/i.test(name)) return null;

  const looksLikeMedicalCenter =
    /medical\s*center|\bvamc\b|\bhospital\b|health\s*care\s*system|healthcare\s*system/i.test(
      name
    );
  const looksLikeOutpatientClinic = /outpatient\s*clinic|\bclinic\b/i.test(name);

  // VAST: 3-character STA_NO is a parent facility. Most are medical centers;
  // a few are large outpatient campuses and must not count as hospital access.
  if (staNo.length === 3) {
    if (looksLikeMedicalCenter) return "hospital";
    if (looksLikeOutpatientClinic) return "outpatient";
    return "hospital";
  }

  // Supporting CBOCs / clinics / satellites — outpatient only.
  if (staNo.length >= 5) return "outpatient";
  return null;
}

async function fetchVhaSites(): Promise<VaSite[]> {
  const sites: VaSite[] = [];
  let offset = 0;
  const pageSize = 2000;
  for (;;) {
    const url =
      `${VHA_LAYER}/query?where=1%3D1&outFields=STA_NO,STA_NAME,S_CITY,S_STATE,LAT,LON` +
      `&returnGeometry=false&resultOffset=${offset}&resultRecordCount=${pageSize}&f=pjson`;
    const res = await fetch(url, { headers: { "User-Agent": "VetRetire-sync-va-facilities/1.0" } });
    if (!res.ok) throw new Error(`VHA layer HTTP ${res.status}`);
    const body = (await res.json()) as {
      features?: { attributes: Record<string, string | number | null> }[];
      exceededTransferLimit?: boolean;
      error?: { message?: string };
    };
    if (body.error) throw new Error(body.error.message ?? "VHA query failed");
    const features = body.features ?? [];
    for (const f of features) {
      const a = f.attributes;
      const staNo = String(a.STA_NO ?? "");
      const name = String(a.STA_NAME ?? "").trim();
      const lat = Number(a.LAT);
      const lon = Number(a.LON);
      if (!staNo || !name || !Number.isFinite(lat) || !Number.isFinite(lon)) continue;
      const kind = classifySite(staNo, name);
      if (!kind) continue;
      sites.push({
        id: staNo,
        name,
        city: a.S_CITY == null ? null : String(a.S_CITY),
        state: a.S_STATE == null ? null : String(a.S_STATE),
        lat,
        lon,
        kind,
      });
    }
    if (features.length < pageSize && !body.exceededTransferLimit) break;
    offset += features.length;
    if (features.length === 0) break;
  }
  return sites;
}

function nearest(
  sites: VaSite[],
  lat: number,
  lon: number,
  kind: VaSite["kind"] | "outpatient_or_hospital"
): { site: VaSite; miles: number } | null {
  let best: { site: VaSite; miles: number } | null = null;
  for (const site of sites) {
    if (kind === "hospital" && site.kind !== "hospital") continue;
    // Outpatient access accepts clinics and medical centers (both deliver outpatient care).
    if (kind === "outpatient_or_hospital" && site.kind !== "outpatient" && site.kind !== "hospital")
      continue;
    const miles = haversineMiles(lat, lon, site.lat, site.lon);
    if (!best || miles < best.miles) best = { site, miles };
  }
  return best;
}

async function main() {
  const retrievedOn = new Date().toISOString().slice(0, 10);
  console.log(
    `Sync VA facilities${dryRun ? " (dry run)" : ""}${missingOnly ? " [missing-only]" : ""}`
  );
  console.log(`Source: ${SOURCE_URL}`);

  const sites = await fetchVhaSites();
  const hospitals = sites.filter((s) => s.kind === "hospital");
  const outpatientCapable = sites.filter((s) => s.kind === "outpatient" || s.kind === "hospital");
  console.log(
    `Loaded ${sites.length} medical sites (${hospitals.length} medical centers, ${outpatientCapable.length} outpatient-capable).`
  );

  const sql = getSql();
  const cities = (await sql.query(
    `SELECT id, name, state, latitude, longitude, nearest_va, distance_to_va
     FROM locations_location
     WHERE latitude IS NOT NULL AND longitude IS NOT NULL
     ORDER BY name, state`
  )) as CityRow[];

  const targets = missingOnly
    ? cities.filter((c) => !c.nearest_va || !c.distance_to_va)
    : cities;

  let updated = 0;
  const notes: string[] = [
    `# VA facilities sync — ${retrievedOn}`,
    "",
    `Source: [VHA Medical Facilities (VAST / ArcGIS)](${SOURCE_URL})`,
    "Distance method: great-circle miles from city centroid to facility LAT/LON.",
    "Outpatient = nearest clinic/CBOC or medical center (Vet Centers excluded).",
    "Hospital = nearest parent facility (3-character STA_NO / VA medical center).",
    "",
    "| City | Outpatient | mi | Hospital | mi |",
    "| --- | --- | ---: | --- | ---: |",
  ];

  for (const city of targets) {
    const out = nearest(sites, city.latitude, city.longitude, "outpatient_or_hospital");
    const hosp = nearest(sites, city.latitude, city.longitude, "hospital");
    if (!out || !hosp) {
      console.log(`! ${city.name}, ${city.state}: no facility match`);
      continue;
    }

    const nearestVa = out.site.name;
    const distanceToVa = formatMiles(out.miles);
    const nearestHospital = hosp.site.name;
    const distanceHospital = formatMiles(hosp.miles);
    const hasVa = out.miles < 0.5 || samePlace(out.site, city);

    notes.push(
      `| ${city.name}, ${city.state} | ${nearestVa} | ${distanceToVa.replace(" miles", "")} | ${nearestHospital} | ${distanceHospital.replace(" miles", "")} |`
    );

    if (dryRun) {
      console.log(
        `= ${city.name}, ${city.state}: out=${nearestVa} (${distanceToVa}); hosp=${nearestHospital} (${distanceHospital})`
      );
    } else {
      await sql.query(
        `UPDATE locations_location SET
           nearest_va = $2,
           distance_to_va = $3,
           has_va = $4,
           nearest_va_hospital = $5,
           distance_to_va_hospital = $6
         WHERE id = $1`,
        [city.id, nearestVa, distanceToVa, hasVa, nearestHospital, distanceHospital]
      );
    }
    updated++;
  }

  const notePath = `data/va_facilities_sync_${retrievedOn}.md`;
  if (!dryRun) {
    writeFileSync(notePath, notes.join("\n") + "\n", "utf8");
    console.log(`\nWrote source note ${notePath}`);
  }

  console.log(
    `\n${dryRun ? "Would update" : "Updated"} ${updated} / ${targets.length} cities.`
  );
  console.log("Next: re-run city-profile-stack/scripts/tools/derive-structural-features.ts");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
