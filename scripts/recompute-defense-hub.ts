/*
 * Recomputes locations_location.defense_hub from its two inputs:
 *
 *   defense_hub = employer_signal ? true : defense_hub_manual
 *
 * where employer_signal means "a counts_as_defense employer has at least
 * DEFENSE_HUB_MIN_POSTINGS onsite+hybrid openings here".
 *
 * `defense_hub_manual` carries the hand curation, including military-installation
 * towns (Norfolk, Fayetteville, Bremerton) that have no contractor plant and are
 * invisible to employer data. Employer presence can therefore only *promote* a
 * city; a curated `true` is never demoted.
 *
 * NULL is preserved rather than coalesced to false: 18 locations have never been
 * researched, and "unknown" is not the same claim as "not a defense hub". Only a
 * positive employer signal can resolve a NULL. Idempotent.
 *
 * Run after any employer import/sync.
 *
 * Usage:
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/recompute-defense-hub.ts [--dry-run]
 */
import { getSql } from "../lib/db";
import { DEFENSE_HUB_MIN_POSTINGS } from "../lib/defense";

const dryRun = process.argv.includes("--dry-run");

interface Candidate {
  id: number;
  name: string;
  state: string;
  current: boolean | null;
  manual: boolean | null;
  employer_signal: boolean;
  evidence: string | null;
}

async function main() {
  const sql = getSql();
  console.log(
    `Recompute defense_hub${dryRun ? " (dry run)" : ""} — threshold ${DEFENSE_HUB_MIN_POSTINGS} onsite+hybrid\n`
  );

  const rows = (await sql.query(
    `SELECT
       l.id,
       l.name,
       l.state,
       l.defense_hub          AS current,
       l.defense_hub_manual   AS manual,
       COALESCE(sig.hit, false) AS employer_signal,
       sig.evidence
     FROM locations_location l
     LEFT JOIN LATERAL (
       SELECT
         count(*) > 0 AS hit,
         string_agg(
           e.display_name || ' (' ||
           (d.onsite_posting_count + d.hybrid_posting_count)::text || ')',
           ', ' ORDER BY (d.onsite_posting_count + d.hybrid_posting_count) DESC
         ) AS evidence
       FROM defense_employer_locations d
       JOIN defense_employers e ON e.id = d.employer_id
       WHERE d.location_id = l.id
         AND e.counts_as_defense
         AND e.active
         AND COALESCE(d.onsite_posting_count, 0) + COALESCE(d.hybrid_posting_count, 0) >= $1
     ) sig ON true
     ORDER BY l.name`,
    [DEFENSE_HUB_MIN_POSTINGS]
  )) as Candidate[];

  /** Employer evidence promotes to true; otherwise the curated value stands, NULL included. */
  const derive = (r: Candidate): boolean | null => (r.employer_signal ? true : r.manual);

  const flips = rows.filter((r) => derive(r) !== r.current);

  if (flips.length === 0) {
    console.log("No changes: derived defense_hub already matches the stored column.");
  } else {
    console.log(`${flips.length} row(s) would change:\n`);
    for (const f of flips) {
      const why = f.employer_signal ? `employer: ${f.evidence}` : "manual curation";
      console.log(
        `  ${f.name}, ${f.state}: ${String(f.current)} -> ${String(derive(f))}   (manual=${String(f.manual)}; ${why})`
      );
    }
  }

  // Guard the invariant even though the formula cannot express a demotion: a bad
  // backfill of defense_hub_manual would show up here rather than silently apply.
  const demotions = flips.filter((f) => f.current === true && derive(f) !== true);
  if (demotions.length > 0) {
    throw new Error(
      `Refusing to demote ${demotions.length} curated hub(s): ${demotions
        .map((d) => `${d.name}, ${d.state}`)
        .join("; ")}. Check defense_hub_manual.`
    );
  }

  if (dryRun) {
    console.log("\nDry run — nothing written.");
    return;
  }

  if (flips.length > 0) {
    await sql.query(
      `UPDATE locations_location l
       SET defense_hub = CASE WHEN EXISTS (
         SELECT 1 FROM defense_employer_locations d
         JOIN defense_employers e ON e.id = d.employer_id
         WHERE d.location_id = l.id AND e.counts_as_defense AND e.active
           AND COALESCE(d.onsite_posting_count, 0) + COALESCE(d.hybrid_posting_count, 0) >= $1
       ) THEN true ELSE l.defense_hub_manual END`,
      [DEFENSE_HUB_MIN_POSTINGS]
    );
  }

  const dist = (await sql.query(
    `SELECT defense_hub AS v, count(*)::int AS n FROM locations_location
     GROUP BY 1 ORDER BY 1 NULLS LAST`
  )) as { v: boolean | null; n: number }[];
  console.log("\ndefense_hub distribution:");
  for (const r of dist) console.log(`  ${String(r.v)}: ${r.n}`);
  console.log(`\nRecompute complete. ${flips.length} row(s) updated.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
