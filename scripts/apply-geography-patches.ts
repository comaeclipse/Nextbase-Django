/** Usage: ... apply-geography-patches.ts <reviewed.json> [--dry-run] */
import { readFileSync, writeFileSync } from "node:fs";
import { getSql } from "../lib/db";
import { GEO_JSON_SQL, METROS_JSON_SQL, geographyPatchStatements, validateGeographyPatches } from "../lib/geography-patch";

async function main() {
  const args = process.argv.slice(2);
  const file = args.find((arg) => !arg.startsWith("--"));
  if (!file || args.some((arg) => arg !== file && arg !== "--dry-run")) throw new Error("Supply one reviewed JSON file and optional --dry-run");
  const patches = validateGeographyPatches(JSON.parse(readFileSync(file, "utf8")));
  const sql = getSql();
  const before = await sql.query(`SELECT l.id, l.slug, ${GEO_JSON_SQL} AS geography, ${METROS_JSON_SQL} AS metros
    FROM locations_location l WHERE l.slug = ANY($1::text[]) ORDER BY l.slug`, [patches.map((p) => p.slug)]);
  const statements = geographyPatchStatements(patches);
  // Locks/guards are read-only. Dry-run validates the same expected snapshots.
  const guards = statements.slice(1, 1 + patches.length * 2);
  await sql.transaction(guards.map((s) => sql.query(s.text, s.params)), { readOnly: true, isolationLevel: "RepeatableRead" });
  console.log(JSON.stringify({ before, proposed: patches.map((p) => ({ slug: p.slug, geography: p.replacement, metros: p.metroSlugs })) }, null, 2));
  if (args.includes("--dry-run")) { console.log("Dry run: all expected-state guards passed; nothing written."); return; }
  const backup = `backups/geography-before-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
  const { mkdirSync } = await import("node:fs");
  mkdirSync("backups", { recursive: true });
  writeFileSync(backup, JSON.stringify(before, null, 2) + "\n");
  await sql.transaction(statements.map((s) => sql.query(s.text, s.params)), { isolationLevel: "Serializable" });
  console.log(`Applied ${patches.length} scoped geography patches. Prior state: ${backup}`);
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
