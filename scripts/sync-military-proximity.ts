/** Recompute only requested ids, or the default candidate/contained set. */
import { getSql } from "../lib/db";
import { assertTargetsExist, MILITARY_PAIRS_SQL, parseLocationIds } from "../lib/location-targets";

async function main() {
  const ids = parseLocationIds(process.argv.slice(2));
  const dryRun = process.argv.includes("--dry-run");
  const sql = getSql();
  if (ids) assertTargetsExist(ids, await sql.query("SELECT id FROM locations_location WHERE id = ANY($1::bigint[])", [ids]) as { id: number }[]);
  const [preview] = await sql.query(`SELECT count(*)::int AS n FROM (${MILITARY_PAIRS_SQL}) pairs`, [ids]) as { n: number }[];
  console.log(`Military proximity ${ids ? `ids ${ids.join(",")}` : "candidate/contained geographies"}: ${preview.n} pairs`);
  if (dryRun) { console.log("Dry run: no writes."); return; }
  const computedOn = new Date().toISOString();
  await sql.transaction([
    sql.query("SELECT id FROM locations_location WHERE $1::bigint[] IS NULL OR id = ANY($1::bigint[]) ORDER BY id FOR UPDATE", [ids]),
    sql.query(`INSERT INTO location_military_proximity (location_id, military_installation_id, distance_miles, computed_on)
      SELECT pairs.*, $2::timestamptz FROM (${MILITARY_PAIRS_SQL}) pairs
      ON CONFLICT (location_id, military_installation_id) DO UPDATE SET
        distance_miles = EXCLUDED.distance_miles, computed_on = EXCLUDED.computed_on`, [ids, computedOn]),
    sql.query(`DELETE FROM location_military_proximity
      WHERE ($1::bigint[] IS NULL OR location_id = ANY($1::bigint[]))
        AND computed_on IS DISTINCT FROM $2::timestamptz`, [ids, computedOn]),
  ], { isolationLevel: "Serializable" });
  const [after] = await sql.query("SELECT count(*)::int AS n FROM location_military_proximity WHERE $1::bigint[] IS NULL OR location_id = ANY($1::bigint[])", [ids]) as { n: number }[];
  console.log(`Sync complete: ${after.n} pairs in scope.`);
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
