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
    await sql.query(
      `UPDATE locations_location l
       SET defense_hub = CASE
         WHEN l.defense_hub_manual = false THEN false
         WHEN EXISTS (
           SELECT 1 FROM defense_employer_locations d
           JOIN defense_employers e ON e.id = d.employer_id
           WHERE d.location_id = l.id AND e.counts_as_defense AND e.active
             AND COALESCE(d.onsite_posting_count, 0) + COALESCE(d.hybrid_posting_count, 0) >= $1
         ) THEN true
         ELSE l.defense_hub_manual
       END`,
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
