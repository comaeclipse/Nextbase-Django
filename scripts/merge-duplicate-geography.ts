/*
 * Merges a duplicate geography into its canonical row and deletes the loser.
 *
 * WHY THIS EXISTS
 *
 * Employer feeds spell one place several ways -- "St. Paul" and "Saint Paul",
 * "Ft George G Meade" and "Fort George G Meade", "Washington" and
 * "Washington Dc". The geography resolvers key on an EXACT (name, state) miss,
 * so a variant looks like an unresolved place and gets its own row.
 *
 * The damage is quiet, which is what makes it worth a script. Each row holds
 * part of the employer presence, so the city page under-reports and neither row
 * looks wrong on its own: Fort George G Meade carries Raytheon and Collins on
 * #236 and L3Harris on #365, and nothing about either row says so.
 *
 * resolve-remaining-employer-geographies.ts now refuses to create a variant in
 * the first place (see its spelling-variant guard). This script cleans up the
 * ones that predate that guard.
 *
 * WHAT IT DOES
 *
 * Repoints every foreign key that references the loser at the winner, then
 * deletes the loser. The FK list is discovered from information_schema rather
 * than hardcoded, so a table added later cannot be silently skipped.
 *
 * WHAT IT REFUSES
 *
 * - a loser that carries a satellite row the winner does not (cost RPP,
 *   military proximity, weather, pace). That is real research, and merging
 *   would drop it. Move it first, or pick the other row as the winner.
 * - a loser that is a ranked candidate. Deleting one changes the rankings, and
 *   that is not a spelling cleanup.
 * - a winner and loser in different states.
 *
 * An honest refusal beats a quiet data loss, so each is reported and the script
 * exits non-zero rather than doing part of the job.
 *
 * Usage:
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/merge-duplicate-geography.ts --loser <id> --winner <id> [--dry-run]
 */
import { getSql } from "../lib/db";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const argOf = (flag: string): number | null => {
  const i = args.indexOf(flag);
  if (i === -1 || !args[i + 1]) return null;
  const n = Number(args[i + 1]);
  return Number.isFinite(n) ? n : null;
};

/*
 * Satellite tables that hold researched, per-location values. A loser holding
 * one of these has data the winner may not, so the merge stops rather than
 * dropping it.
 */
const RESEARCH_TABLES = [
  "location_cost_rpp",
  "location_military_proximity",
  "location_weather_monthly",
  "location_hourly_normals",
  "location_pace_current",
  "location_research_dossiers",
  "location_profile_signals",
  "location_features",
] as const;

interface Geo {
  id: number;
  name: string;
  state: string;
  slug: string;
  geo_type: string;
  is_candidate: boolean;
}

async function main() {
  const loserId = argOf("--loser");
  const winnerId = argOf("--winner");
  if (loserId === null || winnerId === null) {
    console.error("Both --loser <id> and --winner <id> are required.");
    process.exit(1);
  }
  if (loserId === winnerId) {
    console.error("--loser and --winner are the same row.");
    process.exit(1);
  }

  const sql = getSql();

  const rows = (await sql.query(
    `SELECT id, name, state, slug, geo_type, is_candidate
     FROM locations_location WHERE id = ANY($1)`,
    [[loserId, winnerId]]
  )) as Geo[];
  const loser = rows.find((r) => Number(r.id) === loserId);
  const winner = rows.find((r) => Number(r.id) === winnerId);

  const problems: string[] = [];
  if (!loser) problems.push(`no location with id ${loserId}`);
  if (!winner) problems.push(`no location with id ${winnerId}`);
  if (loser && winner) {
    if (loser.state !== winner.state) {
      problems.push(
        `different states: ${loser.name}, ${loser.state} vs ${winner.name}, ${winner.state}`
      );
    }
    if (loser.is_candidate) {
      problems.push(
        `${loser.name} (#${loserId}) is a ranked candidate — deleting it would change the rankings`
      );
    }
  }
  if (problems.length) {
    for (const p of problems) console.error(`Refusing: ${p}`);
    process.exit(1);
  }

  console.log(
    `Merge ${loser!.name}, ${loser!.state} (#${loserId}) -> ` +
      `${winner!.name}, ${winner!.state} (#${winnerId})${dryRun ? " (dry run)" : ""}\n`
  );

  /* Research the loser holds that the winner does not. */
  const dataLoss: string[] = [];
  for (const table of RESEARCH_TABLES) {
    const exists = (await sql.query(
      `SELECT to_regclass($1) IS NOT NULL AS ok`,
      [table]
    )) as { ok: boolean }[];
    if (!exists[0]?.ok) continue;
    const counts = (await sql.query(
      `SELECT
         count(*) FILTER (WHERE location_id = $1)::int AS loser,
         count(*) FILTER (WHERE location_id = $2)::int AS winner
       FROM "${table}"`,
      [loserId, winnerId]
    )) as { loser: number; winner: number }[];
    const { loser: l, winner: w } = counts[0];
    if (l > 0 && w === 0) {
      dataLoss.push(`${table}: loser has ${l} row(s), winner has none`);
    } else if (l > 0) {
      console.log(`  ${table}: ${l} loser row(s) dropped, winner already has ${w}`);
    }
  }
  if (dataLoss.length) {
    console.error("\nRefusing — the loser holds research the winner does not:");
    for (const d of dataLoss) console.error(`  ${d}`);
    console.error("Move it first, or merge the other way round.");
    process.exit(1);
  }

  /*
   * Discovered rather than hardcoded, so a table added later cannot be missed.
   */
  const fks = (await sql.query(
    `SELECT tc.table_name, kcu.column_name
     FROM information_schema.table_constraints tc
     JOIN information_schema.key_column_usage kcu
       ON kcu.constraint_name = tc.constraint_name
     JOIN information_schema.constraint_column_usage ccu
       ON ccu.constraint_name = tc.constraint_name
     WHERE tc.constraint_type = 'FOREIGN KEY'
       AND ccu.table_name = 'locations_location'
       AND ccu.column_name = 'id'`
  )) as { table_name: string; column_name: string }[];

  let moved = 0;
  for (const fk of fks) {
    const n = (
      (await sql.query(
        `SELECT count(*)::int AS n FROM "${fk.table_name}" WHERE "${fk.column_name}" = $1`,
        [loserId]
      )) as { n: number }[]
    )[0].n;
    if (!n) continue;

    /*
     * geo_relationships is dropped rather than repointed: the winner already
     * carries its own containment and metro rows, and repointing would either
     * duplicate them or trip the parent <> child check.
     */
    if (fk.table_name === "geo_relationships") {
      console.log(`  ${fk.table_name}.${fk.column_name}: dropping ${n} row(s)`);
      if (!dryRun) {
        await sql.query(
          `DELETE FROM geo_relationships WHERE "${fk.column_name}" = $1`,
          [loserId]
        );
      }
      continue;
    }

    console.log(`  ${fk.table_name}.${fk.column_name}: repointing ${n} row(s)`);
    if (!dryRun) {
      await sql.query(
        `UPDATE "${fk.table_name}" SET "${fk.column_name}" = $1 WHERE "${fk.column_name}" = $2`,
        [winnerId, loserId]
      );
    }
    moved += n;
  }

  if (dryRun) {
    console.log(`\nDry run — would repoint ${moved} row(s) and delete #${loserId}.`);
    return;
  }

  await sql.query(`DELETE FROM locations_location WHERE id = $1`, [loserId]);
  console.log(`\nRepointed ${moved} row(s) and deleted #${loserId}.`);
  console.log(
    "Add the loser's spelling to data/employer_geographies_aliases.csv so the " +
      "feed resolves it, then run scripts/import-geo-aliases.ts."
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
