/*
 * Ingest VA Facilities API drive times for every city (issue #60).
 *
 * WHY THIS EXISTS: the affordability engine's `va_primary` health-coverage path
 * annotates how practical VA primary care is for a city — within the VA
 * 30-minute drive-time access standard, beyond it (where Community Care may
 * apply), or not yet verified. That annotation needs DRIVE time, which the
 * great-circle mileage in scripts/sync-va-facilities.ts cannot provide: `24
 * miles` is 24 minutes in one place and 55 in another, and Community Care
 * eligibility is defined in minutes, not miles. Drive minutes here NEVER scale
 * a premium and NEVER null a cost — they only add a note (see lib/affordability.ts).
 *
 * SOURCE: VA Lighthouse Facilities API v1 `/nearby`, which returns facilities
 * whose drive-time isochrone band contains the point (attributes.minTime /
 * maxTime, in minutes) — the same drive-time bands VA Community Care uses. We
 * store the NEAREST band's maxTime as a conservative drive-minute figure, plus
 * the facility id so the value stays refreshable. `/nearby` returns only ids +
 * bands, so a second `/facilities?facilityIds=` call classifies them to pick
 * (a) the nearest facility that offers primaryCare and (b) the nearest VA
 * medical center. Requires VA_FACILITIES_API_KEY (Lighthouse apikey header).
 *
 * These write ONLY the new va_*_drive_minutes / _facility_id / va_access_verified_on
 * columns (run scripts/migrate-va-drive-times.ts first). has_va, nearest_va,
 * distance_to_va and the Fit score keep using the mileage fields — untouched.
 *
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/sync-va-drive-times.ts [--dry-run] [--missing-only] [--ids 1,2]
 */
import { writeFileSync } from "node:fs";
import { getSql } from "../lib/db";
import { assertTargetsExist, parseLocationIds } from "../lib/location-targets";

const ids = parseLocationIds(process.argv.slice(2), ["--dry-run", "--missing-only"]);
const dryRun = process.argv.includes("--dry-run");
const missingOnly = process.argv.includes("--missing-only");

const API_BASE = "https://api.va.gov/services/va_facilities/v1";
const DOCS_URL = "https://developer.va.gov/explore/api/va-facilities/docs";
/*
 * Widest band we query. A facility landing in the 80-90 band still tells us the
 * city is well beyond the 30-minute primary-care standard; anything past 90 min
 * is left null (genuinely unverified — we do not assert a drive time we did not
 * measure). VA drive-time bands step by 10.
 */
const MAX_DRIVE_TIME = 90;
/* Service id for the primary-care health service in the Facilities API. */
const PRIMARY_CARE_SERVICE = "primaryCare";
/* Classification string the Facilities API uses for a VA Medical Center. */
const MEDICAL_CENTER_CLASSIFICATION = "VA Medical Center";
/* Stay under the documented 100-calls / 60s throttle with margin. */
const MIN_MS_BETWEEN_CALLS = 700;

const apiKey = process.env.VA_FACILITIES_API_KEY;

interface NearbyFacility {
  id: string;
  minTime: number;
  maxTime: number;
}

interface ClassifiedFacility {
  id: string;
  classification: string | null;
  healthServiceIds: string[];
}

let lastCallAt = 0;
async function throttle(): Promise<void> {
  const wait = MIN_MS_BETWEEN_CALLS - (Date.now() - lastCallAt);
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastCallAt = Date.now();
}

async function apiGet(path: string): Promise<unknown> {
  await throttle();
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      apikey: apiKey as string,
      "User-Agent": "VetRetire-sync-va-drive-times/1.0",
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`VA Facilities API HTTP ${res.status} for ${path} — ${body.slice(0, 200)}`);
  }
  return res.json();
}

/** Facilities (health) within MAX_DRIVE_TIME of the point, with their drive-time band. */
async function nearbyHealth(lat: number, lon: number): Promise<{ facilities: NearbyFacility[]; bandVersion: string | null }> {
  const body = (await apiGet(
    `/nearby?lat=${lat}&long=${lon}&drive_time=${MAX_DRIVE_TIME}&per_page=100`
  )) as {
    data?: { id: string; attributes?: { minTime?: number; maxTime?: number } }[];
    meta?: { bandVersion?: string };
  };
  const facilities: NearbyFacility[] = (body.data ?? [])
    .map((d) => ({
      id: d.id,
      minTime: Number(d.attributes?.minTime),
      maxTime: Number(d.attributes?.maxTime),
    }))
    .filter((f) => f.id && Number.isFinite(f.maxTime));
  return { facilities, bandVersion: body.meta?.bandVersion ?? null };
}

/** Classification + health service ids for a batch of facility ids, one call. */
async function classify(facilityIds: string[]): Promise<Map<string, ClassifiedFacility>> {
  const out = new Map<string, ClassifiedFacility>();
  if (facilityIds.length === 0) return out;
  const body = (await apiGet(
    `/facilities?facilityIds=${encodeURIComponent(facilityIds.join(","))}&per_page=${facilityIds.length}`
  )) as {
    data?: {
      id: string;
      attributes?: {
        classification?: string | null;
        services?: { health?: { serviceId?: string }[] };
      };
    }[];
  };
  for (const f of body.data ?? []) {
    out.set(f.id, {
      id: f.id,
      classification: f.attributes?.classification ?? null,
      healthServiceIds: (f.attributes?.services?.health ?? [])
        .map((s) => s.serviceId ?? "")
        .filter(Boolean),
    });
  }
  return out;
}

interface CityRow {
  id: string;
  name: string;
  state: string;
  latitude: number;
  longitude: number;
  va_primary_care_drive_minutes: number | null;
}

interface Resolved {
  primaryCareMinutes: number | null;
  primaryCareId: string | null;
  medicalCenterMinutes: number | null;
  medicalCenterId: string | null;
}

/** The nearest primary-care facility and the nearest medical center, by drive band. */
function resolve(nearby: NearbyFacility[], classified: Map<string, ClassifiedFacility>): Resolved {
  const byTime = [...nearby].sort((a, b) => a.maxTime - b.maxTime);
  let primaryCareMinutes: number | null = null;
  let primaryCareId: string | null = null;
  let medicalCenterMinutes: number | null = null;
  let medicalCenterId: string | null = null;

  for (const f of byTime) {
    const c = classified.get(f.id);
    if (!c) continue;
    if (primaryCareId === null && c.healthServiceIds.includes(PRIMARY_CARE_SERVICE)) {
      primaryCareMinutes = f.maxTime;
      primaryCareId = f.id;
    }
    if (
      medicalCenterId === null &&
      (c.classification ?? "").toLowerCase() === MEDICAL_CENTER_CLASSIFICATION.toLowerCase()
    ) {
      medicalCenterMinutes = f.maxTime;
      medicalCenterId = f.id;
    }
    if (primaryCareId && medicalCenterId) break;
  }
  return { primaryCareMinutes, primaryCareId, medicalCenterMinutes, medicalCenterId };
}

async function main() {
  if (!apiKey) {
    console.error(
      "VA_FACILITIES_API_KEY is required. Request a Lighthouse key at\n" +
        "https://developer.va.gov/explore/api/va-facilities and set it in .env."
    );
    process.exit(1);
  }

  const verifiedOn = new Date().toISOString().slice(0, 10);
  console.log(
    `Sync VA drive times${dryRun ? " (dry run — no DB writes)" : ""}${missingOnly ? " [missing-only]" : ""}`
  );
  console.log(`Source: VA Facilities API v1 /nearby (${DOCS_URL})`);

  const sql = getSql();
  if (ids)
    assertTargetsExist(
      ids,
      (await sql.query("SELECT id FROM locations_location WHERE id = ANY($1::bigint[])", [ids])) as {
        id: number;
      }[]
    );
  const cities = (await sql.query(
    `SELECT id, name, state, latitude, longitude, va_primary_care_drive_minutes
     FROM locations_location
     WHERE latitude IS NOT NULL AND longitude IS NOT NULL
       AND ($1::bigint[] IS NULL OR id = ANY($1::bigint[]))
     ORDER BY name, state`,
    [ids]
  )) as CityRow[];
  if (ids) assertTargetsExist(ids, cities);

  const targets = missingOnly
    ? cities.filter((c) => c.va_primary_care_drive_minutes == null)
    : cities;

  let updated = 0;
  let bandVersionSeen: string | null = null;
  const noMatch: string[] = [];
  const notes: string[] = [
    `# VA drive-time sync — ${verifiedOn}`,
    "",
    `Source: [VA Facilities API v1 /nearby](${DOCS_URL})`,
    "Method: drive-time isochrone bands (minTime/maxTime, minutes). Nearest band's",
    "maxTime is stored as a conservative drive-minute figure. Primary care = nearest",
    `facility offering \`${PRIMARY_CARE_SERVICE}\`; medical center = nearest \`${MEDICAL_CENTER_CLASSIFICATION}\`.`,
    `Widest band queried: ${MAX_DRIVE_TIME} min (past that stays null — genuinely unverified).`,
    "These annotate the affordability va_primary path only; they never scale a premium.",
    "",
    "| City | Primary care (min) | facility | Medical center (min) | facility |",
    "| --- | ---: | --- | ---: | --- |",
  ];

  for (const city of targets) {
    let resolved: Resolved;
    try {
      const { facilities, bandVersion } = await nearbyHealth(city.latitude, city.longitude);
      if (bandVersion) bandVersionSeen = bandVersion;
      const classified = await classify(facilities.map((f) => f.id));
      resolved = resolve(facilities, classified);
    } catch (e) {
      console.log(`! ${city.name}, ${city.state}: ${e instanceof Error ? e.message : String(e)}`);
      continue;
    }

    if (resolved.primaryCareMinutes == null && resolved.medicalCenterMinutes == null) {
      noMatch.push(`${city.name}, ${city.state}`);
    }

    notes.push(
      `| ${city.name}, ${city.state} | ${resolved.primaryCareMinutes ?? "—"} | ${resolved.primaryCareId ?? "—"} | ${resolved.medicalCenterMinutes ?? "—"} | ${resolved.medicalCenterId ?? "—"} |`
    );

    if (dryRun) {
      console.log(
        `= ${city.name}, ${city.state}: primary=${resolved.primaryCareMinutes ?? "—"}min (${resolved.primaryCareId ?? "—"}); medctr=${resolved.medicalCenterMinutes ?? "—"}min (${resolved.medicalCenterId ?? "—"})`
      );
    } else {
      await sql.query(
        `UPDATE locations_location SET
           va_primary_care_drive_minutes = $2,
           va_primary_care_facility_id = $3,
           va_medical_center_drive_minutes = $4,
           va_medical_center_facility_id = $5,
           va_access_verified_on = $6
         WHERE id = $1`,
        [
          city.id,
          resolved.primaryCareMinutes,
          resolved.primaryCareId,
          resolved.medicalCenterMinutes,
          resolved.medicalCenterId,
          verifiedOn,
        ]
      );
    }
    updated++;
  }

  if (bandVersionSeen) notes.splice(2, 0, `Drive-time band data set version: ${bandVersionSeen}`, "");
  if (noMatch.length) {
    notes.push("", `No VA facility within ${MAX_DRIVE_TIME} min (left null): ${noMatch.join("; ")}`);
  }

  const notePath = `data/va_drive_times_sync_${verifiedOn}${ids ? `_ids-${[...ids].sort((a, b) => a - b).join("-")}` : ""}.md`;
  if (!dryRun) {
    writeFileSync(notePath, notes.join("\n") + "\n", "utf8");
    console.log(`\nWrote source note ${notePath}`);
  }

  console.log(
    `\n${dryRun ? "Would update" : "Updated"} ${updated} / ${targets.length} cities` +
      (noMatch.length ? ` (${noMatch.length} with no facility within ${MAX_DRIVE_TIME} min)` : "") +
      "."
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
