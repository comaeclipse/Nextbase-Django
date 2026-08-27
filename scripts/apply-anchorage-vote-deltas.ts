/**
 * Apply Anchorage, AK presidential vote-share deltas (issue #55).
 *
 * Usage:
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/apply-anchorage-vote-deltas.ts --dry-run
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/apply-anchorage-vote-deltas.ts
 *
 * Methodology + sources: data/sources/elections/anchorage_ak_presidential_2016_2024.md
 * and data/anchorage_ak_sources.md.
 */
import { getSql } from "../lib/db";

const PATCH = {
  rep_vote_share_change_pp: -3.8,
  dem_vote_share_change_pp: 3.8,
  election_change: "3.8 pp more Democratic since 2016",
  election_2016: "Trump",
  election_2016_percent: 53,
  election_2024: "Harris",
  election_2024_percent: 51,
  city_politics: "Municipality-level: Mixed / Swing",
} as const;

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const sql = getSql();

  const rows = (await sql`
    SELECT id, name, state,
           election_2016, election_2016_percent,
           election_2024, election_2024_percent,
           election_change, city_politics,
           rep_vote_share_change_pp, dem_vote_share_change_pp
    FROM locations_location
    WHERE name = 'Anchorage' AND state = 'AK'
  `) as Array<Record<string, unknown>>;

  if (rows.length !== 1) {
    throw new Error(`Expected 1 Anchorage AK row, found ${rows.length}`);
  }

  const before = rows[0];
  console.log(dryRun ? "DRY RUN — would update Anchorage, AK:" : "Updating Anchorage, AK:");
  console.log("before:", before);
  console.log("after:", { id: before.id, ...PATCH });

  if (dryRun) {
    console.log("No write performed.");
    return;
  }

  await sql`
    UPDATE locations_location SET
      rep_vote_share_change_pp = ${PATCH.rep_vote_share_change_pp},
      dem_vote_share_change_pp = ${PATCH.dem_vote_share_change_pp},
      election_change = ${PATCH.election_change},
      election_2016 = ${PATCH.election_2016},
      election_2016_percent = ${PATCH.election_2016_percent},
      election_2024 = ${PATCH.election_2024},
      election_2024_percent = ${PATCH.election_2024_percent},
      city_politics = ${PATCH.city_politics},
      updated_at = now()
    WHERE id = ${before.id as number}
  `;

  const after = await sql`
    SELECT id, name, state,
           election_2016, election_2016_percent,
           election_2024, election_2024_percent,
           election_change, city_politics,
           rep_vote_share_change_pp, dem_vote_share_change_pp
    FROM locations_location
    WHERE id = ${before.id as number}
  `;
  console.log("verified:", after[0]);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
