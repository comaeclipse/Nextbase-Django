/*
 * Imports a mosque snapshot produced by scripts/fetch-mosques-overpass.ts into
 * Neon. Upserts on (osm_type, osm_id) so re-running a refreshed snapshot updates
 * existing rows rather than duplicating them.
 *
 * Upsert alone cannot remove a row, so when a refreshed snapshot de-duplicates
 * two OSM elements that both went in previously, the loser stays behind and the
 * map shows two dots for one mosque. --prune deletes rows the snapshot no longer
 * contains. It is opt-in because the snapshot must be a COMPLETE national
 * extract for it to be safe: pruning against a partial snapshot would wipe
 * everything the partial run did not cover.
 *
 * Usage:
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/import-mosques.ts <json> [--dry-run] [--prune]
 *
 * --dry-run --prune reads the table to list what would be deleted, and writes nothing.
 */
import { readFileSync } from "node:fs";
import { getSql } from "../lib/db";
import { MATCH_RULES, type MatchRule } from "../lib/mosque-matching";
import type { MosqueRecord, MosqueSnapshot } from "./fetch-mosques-overpass";

function requireNumber(value: unknown, field: string): number {
  if (typeof value !== "number" || Number.isNaN(value)) {
    throw new Error(`Invalid or missing ${field}`);
  }
  return value;
}

/*
 * v1 snapshots predate match_rule and contained only the amenity+religion rule,
 * so an absent value means exactly that. Kept so an older snapshot in data/
 * still imports.
 */
function requireMatchRule(value: unknown, field: string): MatchRule {
  if (value === undefined || value === null) return "amenity_religion";
  if (!MATCH_RULES.includes(value as MatchRule)) {
    throw new Error(`Invalid ${field}: ${String(value)}`);
  }
  return value as MatchRule;
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
      match_rule: requireMatchRule(row.match_rule, `mosques[${index}].match_rule`),
    };
  });

  return {
    generated_date: source.generated_date,
    query_version: source.query_version ?? 1,
    query: source.query ?? "",
    source_endpoint: source.source_endpoint ?? "",
    count: source.count,
    stats: source.stats ?? {
      elements_returned: mosques.length,
      excluded_not_a_mosque: 0,
      excluded_no_coordinates: 0,
      merged_duplicates: 0,
      by_match_rule: {},
    },
    mosques,
  };
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const prune = args.includes("--prune");
  const sourcePath = args.find((arg) => !arg.startsWith("--"));
  if (!sourcePath) {
    throw new Error("Usage: import-mosques <json> [--dry-run] [--prune]");
  }

  const snapshot = parseSnapshot(sourcePath);
  console.log(
    `Importing ${snapshot.count} mosques from ${sourcePath} (query v${snapshot.query_version})${dryRun ? " (dry run)" : ""}`
  );

  for (const row of snapshot.mosques) {
    console.log(
      `  ${dryRun ? "=" : "+"} ${row.name ?? "(unnamed)"} — ${row.city ?? "?"}, ${row.state ?? "?"} [${row.osm_type}/${row.osm_id}] ${row.match_rule}`
    );
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

  if (prune) {
    const sql = getSql();
    const snapshotKeys = new Set(snapshot.mosques.map((row) => `${row.osm_type}/${row.osm_id}`));
    const existing = (await sql.query(
      `SELECT osm_type, osm_id, name FROM mosques`
    )) as Array<{ osm_type: string; osm_id: string | number; name: string | null }>;

    const orphans = existing.filter(
      (row) => !snapshotKeys.has(`${row.osm_type}/${row.osm_id}`)
    );

    console.log(`
Prune: ${orphans.length} row(s) in mosques are absent from this snapshot.`);
    for (const row of orphans) {
      console.log(
        `  ${dryRun ? "=" : "-"} ${row.name ?? "(unnamed)"} [${row.osm_type}/${row.osm_id}]`
      );
    }

    if (!dryRun) {
      for (const row of orphans) {
        await sql.query(`DELETE FROM mosques WHERE osm_type = $1 AND osm_id = $2`, [
          row.osm_type,
          row.osm_id,
        ]);
      }
      console.log(`Deleted ${orphans.length} row(s).`);
    }
  }

  console.log(`${dryRun ? "Dry run" : "Import"} complete. ${snapshot.count} row(s).`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
