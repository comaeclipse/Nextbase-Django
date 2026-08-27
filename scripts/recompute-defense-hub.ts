/*
 * Recomputes locations_location.defense_hub from its three inputs, in priority order:
 *
 *   defense_hub = defense_hub_manual === false ? false   // hard human veto
 *               : employer_presence            ? true    // a physical RTX facility
 *               : defense_hub_manual                      // curated value / NULL
 *
 * where employer_presence means "a counts_as_defense, active employer has at least
 * DEFENSE_HUB_MIN_POSTINGS (1) onsite+hybrid openings here" — i.e. a real facility.
 * Because only RTX is ingested, one site is a sample of a wider cluster, so it
 * promotes; remote-only postings never do.
 *
 * `defense_hub_manual = false` is a deliberate veto for RTX-facility towns that are
 * not hubs for a retiree (Jamestown ND, Burnsville MN). `defense_hub_manual = true`
 * carries hubs employer data can't see (military towns with no plant; Boston when
 * its RTX openings are momentarily zero).
 *
 * NULL is preserved rather than coalesced to false: never-researched, no-presence
 * locations stay "unknown", which is not the same claim as "not a defense hub".
 * Only presence or a manual value resolves a NULL. Idempotent.
 *
 * Employer presence ROLLS UP. A facility in a neighborhood counts for that
 * neighborhood and for every geography that contains it, because a plant inside
 * Los Angeles city limits is Los Angeles employment however the job posting
 * spells the location. It never rolls DOWN: a facility downtown must not make
 * every neighborhood a defense hub.
 *
 * Presence is computed ONCE, in the `presence` CTE, and drives both the preview
 * and the UPDATE. It used to be written twice -- a TypeScript derive() and a
 * parallel SQL CASE -- which is two expressions that have to be kept in sync by
 * hand for the script to mean what it says.
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
    `Recompute defense_hub${dryRun ? " (dry run)" : ""} — presence = ≥${DEFENSE_HUB_MIN_POSTINGS} onsite+hybrid; defense_hub_manual=false vetoes\n`
  );

  /*
   * Each geography paired with itself and every geography it contains, so one
   * join expresses "a facility here, or anywhere inside here". With no
   * containment rows recorded this degenerates to `l.id = l.id`, which is
   * exactly the previous behaviour -- the migration is a no-op until a
   * containment relationship actually exists.
   */
  const PRESENCE_CTE = `
    WITH self_and_descendants AS (
      SELECT l.id AS geo_id, l.id AS member_id FROM locations_location l
      UNION
      SELECT c.ancestor_id, c.descendant_id
      FROM geo_closure c
      WHERE c.relationship_type = 'municipal_containment'
    ),
    presence AS (
      SELECT
        sd.geo_id,
        count(*) > 0 AS hit,
        string_agg(
          e.display_name || ' (' ||
          (d.onsite_posting_count + d.hybrid_posting_count)::text ||
          CASE WHEN sd.member_id <> sd.geo_id THEN ' via ' || m.name ELSE '' END || ')',
          ', ' ORDER BY (d.onsite_posting_count + d.hybrid_posting_count) DESC
        ) AS evidence
      FROM self_and_descendants sd
      JOIN defense_employer_locations d ON d.location_id = sd.member_id
      JOIN defense_employers e ON e.id = d.employer_id
      JOIN locations_location m ON m.id = sd.member_id
      WHERE e.counts_as_defense
        AND e.active
        AND COALESCE(d.onsite_posting_count, 0) + COALESCE(d.hybrid_posting_count, 0) >= $1
      GROUP BY sd.geo_id
    )`;

  const rows = (await sql.query(
    `${PRESENCE_CTE}
     SELECT
       l.id,
       l.name,
       l.state,
       l.defense_hub          AS current,
       l.defense_hub_manual   AS manual,
       COALESCE(p.hit, false) AS employer_signal,
       p.evidence
     FROM locations_location l
     LEFT JOIN presence p ON p.geo_id = l.id
     ORDER BY l.name`,
    [DEFENSE_HUB_MIN_POSTINGS]
  )) as Candidate[];

  /** Veto wins; else a physical presence promotes; else the curated value stands (NULL included). */
  const derive = (r: Candidate): boolean | null =>
    r.manual === false ? false : r.employer_signal ? true : r.manual;

  const flips = rows.filter((r) => derive(r) !== r.current);

  if (flips.length === 0) {
    console.log("No changes: derived defense_hub already matches the stored column.");
  } else {
    console.log(`${flips.length} row(s) would change:\n`);
    for (const f of flips) {
      const why = f.employer_signal
        ? `employer: ${f.evidence}`
        : f.manual === false
          ? "manual veto (defense_hub_manual=false)"
          : "manual curation";
      console.log(
        `  ${f.name}, ${f.state}: ${String(f.current)} -> ${String(derive(f))}   (manual=${String(f.manual)}; ${why})`
      );
    }
  }

  // A curated `true` may only fall via an explicit manual veto (manual === false).
  // Any other true -> non-true means defense_hub was set true with no matching
  // veto or presence — surface it rather than silently applying.
  const unexpected = flips.filter(
    (f) => f.current === true && derive(f) !== true && f.manual !== false
  );
  if (unexpected.length > 0) {
    throw new Error(
      `Refusing to demote ${unexpected.length} hub(s) with no veto: ${unexpected
        .map((d) => `${d.name}, ${d.state}`)
        .join("; ")}. Set defense_hub_manual=false to intend it, or fix defense_hub.`
    );
  }

  if (dryRun) {
    console.log("\nDry run — nothing written.");
    return;
  }

  if (flips.length > 0) {
    // Same presence CTE as the preview above, so what was printed is what lands.
    await sql.query(
      `${PRESENCE_CTE}
       UPDATE locations_location l
       SET defense_hub = CASE
         WHEN l.defense_hub_manual = false THEN false
         WHEN COALESCE(p.hit, false) THEN true
         ELSE l.defense_hub_manual
       END
       FROM (SELECT l2.id AS geo_id FROM locations_location l2) ids
       LEFT JOIN presence p ON p.geo_id = ids.geo_id
       WHERE ids.geo_id = l.id`,
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
