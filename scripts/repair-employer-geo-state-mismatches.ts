/**
 * Historical command name retained; this is now REPORT ONLY.
 * Use a sourced, scoped patch for writes. Exit 2 means incomplete lookup coverage.
 * Usage: ... repair-employer-geo-state-mismatches.ts [--dry-run] [--ids 200,270]
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { getSql } from "../lib/db";
import { assessGeography, formatGeographyAudit, lookupCensusPlace,
  type GeographyAuditRow, type GeographyFinding, type GeographyPoint } from "../lib/employer-geography";

async function main() {
  const args = process.argv.slice(2);
  const at = args.indexOf("--ids");
  const raw = at >= 0 ? args[at + 1] : undefined;
  if (at >= 0 && (!raw || !/^\d+(,\d+)*$/.test(raw))) throw new Error("--ids requires comma-separated positive ids");
  const ids = raw?.split(",").map(Number);
  if (ids?.some((id) => !Number.isSafeInteger(id) || id <= 0)) throw new Error("Invalid location id");
  if (args.some((arg, i) => arg !== "--dry-run" && arg !== "--ids" && !(at >= 0 && i === at + 1))) throw new Error("Unknown argument; audit is report-only");
  const derived = JSON.parse(readFileSync(path.join(process.cwd(), "data/sources/pace/derived/pace_derived.json"), "utf8")) as { place_centroids: Record<string, GeographyPoint> };
  const rows = await getSql().query(
    `SELECT id, slug, name, state, latitude, longitude FROM locations_location
     WHERE NOT is_candidate AND geo_type IN ('city', 'neighborhood', 'cdp')
       AND latitude IS NOT NULL AND longitude IS NOT NULL
       ${ids ? "AND id = ANY($1::bigint[])" : ""} ORDER BY id`, ids ? [ids] : []
  ) as GeographyAuditRow[];
  const queue = rows.map((r) => ({ ...r, id: Number(r.id), latitude: Number(r.latitude), longitude: Number(r.longitude) }));
  const findings: GeographyFinding[] = [];
  const snapshot = new Date().toISOString();
  console.log(`Checking ${rows.length} rows (report only)...`);
  await Promise.all(Array.from({ length: 4 }, async () => {
    for (;;) {
      const row = queue.shift();
      if (!row) return;
      findings.push(assessGeography(row, await lookupCensusPlace(row.latitude, row.longitude), Object.values(derived.place_centroids)));
      if (findings.length % 50 === 0) console.log(`  ${findings.length}/${rows.length}`);
    }
  }));
  findings.sort((a, b) => a.row.id - b.row.id);
  console.log(formatGeographyAudit(findings, snapshot));
  const missingIds = ids?.filter((id) => !rows.some((row) => Number(row.id) === id)) ?? [];
  if (missingIds.length) console.error(`Unchecked ids (missing, ungeocoded, or outside anchor scope): ${missingIds.join(", ")}`);
  if (missingIds.length || findings.some((f) => f.status === "unavailable")) process.exitCode = 2;
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
