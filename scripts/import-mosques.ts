/*
 * Imports a mosque snapshot produced by scripts/fetch-mosques-overpass.ts into
 * Neon. Upserts on (osm_type, osm_id) so re-running a refreshed snapshot updates
 * existing rows rather than duplicating them.
 *
 * Usage:
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/import-mosques.ts <json> [--dry-run]
 */
import { readFileSync } from "node:fs";
import { getSql } from "../lib/db";
import type { MosqueRecord, MosqueSnapshot } from "./fetch-mosques-overpass";

function requireNumber(value: unknown, field: string): number {
  if (typeof value !== "number" || Number.isNaN(value)) {
    throw new Error(`Invalid or missing ${field}`);
  }
  return value;
}

function parseSnapshot(path: string): MosqueSnapshot {
  const source = JSON.parse(readFileSync(path, "utf-8")) as Partial<MosqueSnapshot>;
  if (!Array.isArray(source.mosques)) throw new Error("mosques must be an array");
  if (source.count !== source.mosques.length) {
    throw new Error(`count (${source.count}) does not match mosques (${source.mosques.length})`);
  }
  if (typeof source.generated_date !== "string" || source.generated_date.trim() === "") {
    throw new Error("generated_date is required");
  }

  const mosques: MosqueRecord[] = source.mosques.map((row, index) => {
    if (row.osm_type !== "node" && row.osm_type !== "way" && row.osm_type !== "relation") {
      throw new Error(`mosques[${index}].osm_type must be node|way|relation`);
    }
    return {
      osm_type: row.osm_type,
      osm_id: requireNumber(row.osm_id, `mosques[${index}].osm_id`),
      name: row.name ?? null,
      address: row.address ?? null,
      city: row.city ?? null,
      state: row.state ?? null,
      latitude: requireNumber(row.latitude, `mosques[${index}].latitude`),
      longitude: requireNumber(row.longitude, `mosques[${index}].longitude`),
      phone: row.phone ?? null,
      website: row.website ?? null,
      source_url: row.source_url ?? `https://www.openstreetmap.org/${row.osm_type}/${row.osm_id}`,
    };
  });

  return {
    generated_date: source.generated_date,
    query: source.query ?? "",
    source_endpoint: source.source_endpoint ?? "",
    count: source.count,
    mosques,
  };
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const sourcePath = args.find((arg) => !arg.startsWith("--"));
  if (!sourcePath) {
    throw new Error("Usage: import-mosques <json> [--dry-run]");
  }

  const snapshot = parseSnapshot(sourcePath);
  console.log(
    `Importing ${snapshot.count} mosques from ${sourcePath}${dryRun ? " (dry run)" : ""}`
  );

  for (const row of snapshot.mosques) {
    console.log(`  ${dryRun ? "=" : "+"} ${row.name ?? "(unnamed)"} — ${row.city ?? "?"}, ${row.state ?? "?"} [${row.osm_type}/${row.osm_id}]`);
  }

  if (!dryRun) {
    const sql = getSql();
    for (const row of snapshot.mosques) {
      await sql.query(
        `INSERT INTO mosques (
           osm_type, osm_id, name, address, city, state, latitude, longitude,
           phone, website, source_kind, source_url, source_retrieved_on,
           created_at, updated_at
         ) VALUES (
           $1, $2, $3, $4, $5, $6, $7, $8,
           $9, $10, 'openstreetmap', $11, $12::date,
           now(), now()
         )
         ON CONFLICT (osm_type, osm_id) DO UPDATE SET
           name = EXCLUDED.name,
           address = EXCLUDED.address,
           city = EXCLUDED.city,
           state = EXCLUDED.state,
           latitude = EXCLUDED.latitude,
           longitude = EXCLUDED.longitude,
           phone = EXCLUDED.phone,
           website = EXCLUDED.website,
           source_url = EXCLUDED.source_url,
           source_retrieved_on = EXCLUDED.source_retrieved_on,
           updated_at = now()`,
        [
          row.osm_type,
          row.osm_id,
          row.name,
          row.address,
          row.city,
          row.state,
          row.latitude,
          row.longitude,
          row.phone,
          row.website,
          row.source_url,
          snapshot.generated_date,
        ]
      );
    }
  }

  console.log(`${dryRun ? "Dry run" : "Import"} complete. ${snapshot.count} row(s).`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
