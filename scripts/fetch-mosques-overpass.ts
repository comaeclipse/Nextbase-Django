/*
 * Fetches US mosque locations from the public OpenStreetMap Overpass API and
 * writes a normalized snapshot to data/. This script never touches Neon — it
 * only produces the repo artifact that scripts/import-mosques.ts later reads.
 * That split exists so the Neon write can happen from master after this
 * snapshot has been reviewed and merged (see AGENTS.md "Data changes").
 *
 * Query v2 (widened, see MATCH_RULES below). v1 required
 * `amenity=place_of_worship` AND `religion=muslim` together, which missed ~100
 * US mosques: OSM commonly tags a mosque with only `building=mosque`, or puts
 * `religion=muslim` on a `landuse=religious` parcel, or tags an obviously-named
 * mosque as a bare `place_of_worship` with no religion at all. Widening pulls
 * those in but also pulls in duplicates (a building footprint AND a POI node for
 * the same mosque) and non-mosques (Islamic schools, Muslim cemeteries), so this
 * script now classifies, excludes, and de-duplicates. Every kept record carries
 * the `match_rule` that admitted it so the snapshot stays auditable.
 *
 * Usage:
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/fetch-mosques-overpass.ts [--dry-run]
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  classify,
  dedupe,
  DEDUPE_METERS,
  MATCH_RULES,
  type MatchRule,
  type MosqueRecord,
} from "../lib/mosque-matching";

// Re-exported so scripts/import-mosques.ts keeps importing its row shape from
// the script that produces the snapshot.
export type { MatchRule, MosqueRecord };

const OVERPASS_ENDPOINT = "https://overpass-api.de/api/interpreter";

/** Bumped whenever the query or the classification rules change. Part of the snapshot filename. */
const QUERY_VERSION = 2;

const OVERPASS_QUERY = `
[out:json][timeout:600];
area["ISO3166-1"="US"][admin_level=2]->.us;
(
  nwr["amenity"="place_of_worship"]["religion"="muslim"](area.us);
  nwr["building"="mosque"](area.us);
  nwr["religion"="muslim"](area.us);
  nwr["amenity"="place_of_worship"]["name"~"[Mm]asjid|[Mm]osque|[Ii]slamic [Cc]ent|[Mm]usalla"](area.us);
);
out center tags;
`.trim();

interface OverpassElement {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

interface OverpassResponse {
  elements: OverpassElement[];
}

export interface MosqueSnapshot {
  generated_date: string;
  query_version: number;
  query: string;
  source_endpoint: string;
  count: number;
  /** Audit counters, all derived from this run. */
  stats: {
    elements_returned: number;
    excluded_not_a_mosque: number;
    excluded_no_coordinates: number;
    merged_duplicates: number;
    by_match_rule: Record<string, number>;
  };
  mosques: MosqueRecord[];
}

function pickTag(tags: Record<string, string> | undefined, ...keys: string[]): string | null {
  if (!tags) return null;
  for (const key of keys) {
    const value = tags[key];
    if (value && value.trim() !== "") return value.trim();
  }
  return null;
}

function buildAddress(tags: Record<string, string> | undefined): string | null {
  if (!tags) return null;
  const houseNumber = tags["addr:housenumber"];
  const street = tags["addr:street"];
  const parts = [houseNumber, street].filter(Boolean);
  if (parts.length === 0) return null;
  return parts.join(" ");
}

function normalize(element: OverpassElement, rule: MatchRule): MosqueRecord | null {
  const lat = element.lat ?? element.center?.lat;
  const lon = element.lon ?? element.center?.lon;
  if (lat == null || lon == null) return null;

  return {
    osm_type: element.type,
    osm_id: element.id,
    name: pickTag(element.tags, "name", "name:en"),
    address: buildAddress(element.tags),
    city: pickTag(element.tags, "addr:city"),
    state: pickTag(element.tags, "addr:state"),
    latitude: lat,
    longitude: lon,
    phone: pickTag(element.tags, "contact:phone", "phone"),
    website: pickTag(element.tags, "contact:website", "website", "url"),
    source_url: `https://www.openstreetmap.org/${element.type}/${element.id}`,
    match_rule: rule,
  };
}

async function fetchOverpass(): Promise<OverpassElement[]> {
  const response = await fetch(OVERPASS_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent":
        "VetRetire-fetch-mosques-overpass/2.0 (https://github.com/comaeclipse/Nextbase-Django)",
    },
    body: `data=${encodeURIComponent(OVERPASS_QUERY)}`,
  });

  if (!response.ok) {
    throw new Error(
      `Overpass API returned ${response.status} ${response.statusText}: ${await response.text()}`
    );
  }

  const body = (await response.json()) as OverpassResponse;
  if (!Array.isArray(body.elements)) {
    throw new Error("Overpass API response missing elements array");
  }
  return body.elements;
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const retrievedOn = new Date().toISOString().slice(0, 10);

  console.log(
    `Querying Overpass API for US mosques (query v${QUERY_VERSION})${dryRun ? " (dry run)" : ""}...`
  );
  const elements = await fetchOverpass();

  let excludedNotAMosque = 0;
  let excludedNoCoordinates = 0;
  const candidates: MosqueRecord[] = [];

  for (const element of elements) {
    const rule = classify(element.tags);
    if (rule === null) {
      excludedNotAMosque += 1;
      continue;
    }
    const record = normalize(element, rule);
    if (record === null) {
      excludedNoCoordinates += 1;
      continue;
    }
    candidates.push(record);
  }

  const { kept, merged } = dedupe(candidates);

  const byMatchRule: Record<string, number> = {};
  for (const rule of MATCH_RULES) byMatchRule[rule] = 0;
  for (const record of kept) byMatchRule[record.match_rule] += 1;

  console.log(`Fetched ${elements.length} element(s).`);
  console.log(
    `  ${excludedNotAMosque} excluded as not a mosque (wrong religion, school, cemetery, ...)`
  );
  console.log(`  ${excludedNoCoordinates} excluded for missing coordinates`);
  console.log(`  ${merged} merged as duplicates of another element within ${DEDUPE_METERS}m`);
  console.log(`  ${kept.length} kept:`);
  for (const rule of MATCH_RULES) {
    console.log(`    ${String(byMatchRule[rule]).padStart(5)}  ${rule}`);
  }

  const snapshot: MosqueSnapshot = {
    generated_date: retrievedOn,
    query_version: QUERY_VERSION,
    query: OVERPASS_QUERY,
    source_endpoint: OVERPASS_ENDPOINT,
    count: kept.length,
    stats: {
      elements_returned: elements.length,
      excluded_not_a_mosque: excludedNotAMosque,
      excluded_no_coordinates: excludedNoCoordinates,
      merged_duplicates: merged,
      by_match_rule: byMatchRule,
    },
    mosques: kept,
  };

  const outPath = join("data", `mosques_overpass_v${QUERY_VERSION}_${retrievedOn}.json`);
  if (dryRun) {
    console.log(`Dry run — would write ${kept.length} record(s) to ${outPath}`);
    return;
  }

  writeFileSync(outPath, JSON.stringify(snapshot, null, 2) + "\n", "utf-8");
  console.log(`Wrote ${kept.length} record(s) to ${outPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
