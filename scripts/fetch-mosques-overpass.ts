/*
 * Fetches US mosque locations from the public OpenStreetMap Overpass API and
 * writes a normalized snapshot to data/. This script never touches Neon — it
 * only produces the repo artifact that scripts/import-mosques.ts later reads.
 * That split exists so the Neon write can happen from master after this
 * snapshot has been reviewed and merged (see AGENTS.md "Data changes").
 *
 * Usage:
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/fetch-mosques-overpass.ts [--dry-run]
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";

const OVERPASS_ENDPOINT = "https://overpass-api.de/api/interpreter";
const OVERPASS_QUERY = `
[out:json][timeout:180];
area["ISO3166-1"="US"][admin_level=2]->.us;
(
  node["amenity"="place_of_worship"]["religion"="muslim"](area.us);
  way["amenity"="place_of_worship"]["religion"="muslim"](area.us);
  relation["amenity"="place_of_worship"]["religion"="muslim"](area.us);
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

export interface MosqueRecord {
  osm_type: "node" | "way" | "relation";
  osm_id: number;
  name: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  latitude: number;
  longitude: number;
  phone: string | null;
  website: string | null;
  source_url: string;
}

export interface MosqueSnapshot {
  generated_date: string;
  query: string;
  source_endpoint: string;
  count: number;
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

function normalize(element: OverpassElement): MosqueRecord | null {
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
  };
}

async function fetchOverpass(): Promise<OverpassElement[]> {
  const response = await fetch(OVERPASS_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "VetRetire-fetch-mosques-overpass/1.0 (https://github.com/comaeclipse/Nextbase-Django)",
    },
    body: `data=${encodeURIComponent(OVERPASS_QUERY)}`,
  });

  if (!response.ok) {
    throw new Error(`Overpass API returned ${response.status} ${response.statusText}: ${await response.text()}`);
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

  console.log(`Querying Overpass API for US mosques${dryRun ? " (dry run)" : ""}...`);
  const elements = await fetchOverpass();

  const mosques = elements
    .map((element) => normalize(element))
    .filter((record): record is MosqueRecord => record !== null);

  const skipped = elements.length - mosques.length;
  console.log(`Fetched ${elements.length} element(s), ${mosques.length} with coordinates${skipped > 0 ? `, ${skipped} skipped (no coordinates)` : ""}.`);

  const snapshot: MosqueSnapshot = {
    generated_date: retrievedOn,
    query: OVERPASS_QUERY,
    source_endpoint: OVERPASS_ENDPOINT,
    count: mosques.length,
    mosques,
  };

  const outPath = join("data", `mosques_overpass_${retrievedOn}.json`);
  if (dryRun) {
    console.log(`Dry run — would write ${mosques.length} record(s) to ${outPath}`);
    return;
  }

  writeFileSync(outPath, JSON.stringify(snapshot, null, 2) + "\n", "utf-8");
  console.log(`Wrote ${mosques.length} record(s) to ${outPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
