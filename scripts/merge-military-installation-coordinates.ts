/*
 * Backfills latitude/longitude on military_installations from the coordinate
 * research files (data/<branch>_installations_coordinates.json), produced by
 * MILITARY_INSTALLATION_COORDINATES_INSTRUCTIONS.md against the HIFLD MIRTA
 * "DoD Sites - Point" layer.
 *
 * Only touches rows where the research file has a non-null latitude/longitude
 * (blank rows are left for a follow-up .mil/GNIS pass, per the instructions
 * doc). Matches the existing military_installations unique key exactly:
 * (service_branch, command_name, country, city, state). Coordinate provenance
 * goes into the coordinate_* columns added by
 * migrate-military-installation-coordinates.ts, never into the identity
 * source_kind/source_url/source_retrieved_on/notes columns from the original
 * branch-directory import.
 *
 * Usage:
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/merge-military-installation-coordinates.ts [--dry-run]
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { getSql } from "../lib/db";

interface CoordinateRow {
  command_name: string;
  city: string;
  state: string;
  latitude: number | null;
  longitude: number | null;
  confidence: "high" | "medium" | "low" | null;
  source_kind: string | null;
  source_url: string | null;
  retrieved_on: string | null;
  notes: string;
}

interface CoordinateFile {
  service_branch_slug: string;
  service_branch: string;
  count: number;
  resolved_count: number;
  coordinates: CoordinateRow[];
}

// Coordinate files key by the internal branch slug; military_installations
// stores the display form used by the original importer.
const FILES: Record<string, string> = {
  air_force: "air_force_installations_coordinates.json",
  navy: "navy_installations_coordinates.json",
  army: "army_installations_coordinates.json",
  marine_corps: "marine_corps_installations_coordinates.json",
};

const SERVICE_BRANCH: Record<string, string> = {
  air_force: "Air Force",
  navy: "Navy",
  army: "Army",
  marine_corps: "Marine Corps",
};

function loadFile(slug: string, filename: string): CoordinateFile {
  const filePath = path.join(__dirname, "..", "data", filename);
  const raw = JSON.parse(readFileSync(filePath, "utf-8"));
  if (!Array.isArray(raw.coordinates)) {
    throw new Error(`${filename}: missing coordinates array`);
  }
  return {
    service_branch_slug: slug,
    service_branch: SERVICE_BRANCH[slug],
    count: raw.count,
    resolved_count: raw.resolved_count,
    coordinates: raw.coordinates,
  };
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const sql = getSql();

  let totalResolved = 0;
  let totalUpdated = 0;
  let totalNoMatch = 0;

  for (const [slug, filename] of Object.entries(FILES)) {
    const file = loadFile(slug, filename);
    const resolvedRows = file.coordinates.filter(
      (row) => row.latitude !== null && row.longitude !== null
    );
    totalResolved += resolvedRows.length;

    console.log(
      `\n${file.service_branch}: ${resolvedRows.length}/${file.coordinates.length} row(s) with coordinates${dryRun ? " (dry run)" : ""}`
    );

    for (const row of resolvedRows) {
      const label = `  ${dryRun ? "=" : "+"} ${row.command_name} — ${row.city}, ${row.state} -> (${row.latitude}, ${row.longitude}) [${row.confidence}]`;

      if (dryRun) {
        console.log(label);
        continue;
      }

      // sql.query() on this lazily-created client returns bare rows (see
      // lib/db.ts — NeonQueryFunction<false, false>), not a pg-style result
      // with rowCount, so confirm the write with a RETURNING clause instead.
      const result = await sql.query(
        `UPDATE military_installations SET
           latitude = $1,
           longitude = $2,
           coordinate_source_kind = $3,
           coordinate_source_url = $4,
           coordinate_retrieved_on = $5::date,
           coordinate_confidence = $6,
           coordinate_notes = $7,
           updated_at = now()
         WHERE service_branch = $8
           AND command_name = $9
           AND country = 'US'
           AND city = $10
           AND state = $11
         RETURNING id`,
        [
          row.latitude,
          row.longitude,
          row.source_kind,
          row.source_url,
          row.retrieved_on,
          row.confidence,
          row.notes,
          file.service_branch,
          row.command_name,
          row.city,
          row.state,
        ]
      );

      const rowCount = Array.isArray(result) ? result.length : 0;
      if (rowCount === 0) {
        totalNoMatch++;
        console.log(`${label}  [NO DB ROW MATCHED]`);
      } else {
        totalUpdated++;
        console.log(label);
      }
    }
  }

  console.log(
    `\n${dryRun ? "Dry run" : "Merge"} complete. ${totalResolved} row(s) with coordinates in source files${
      dryRun ? "" : `, ${totalUpdated} updated, ${totalNoMatch} unmatched against the DB`
    }.`
  );
  if (!dryRun && totalNoMatch > 0) {
    console.log(
      "Unmatched rows mean the (service_branch, command_name, country, city, state) key didn't line up with military_installations — re-check the source branch JSON for a name/city/state edit since coordinates were researched."
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
