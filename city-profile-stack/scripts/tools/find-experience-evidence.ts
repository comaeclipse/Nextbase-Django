/* Retrieves source excerpts for a named lived-experience claim. */
import { getSql } from "../../../lib/db";

const value = (flag: string) => {
  const index = process.argv.indexOf(flag);
  return index === -1 ? undefined : process.argv[index + 1];
};

const topic = value("--topic");
const claim = value("--claim");
const city = value("--city");
const search = value("--search");
if ((!topic || !claim) && !search) {
  console.error('Usage: find-experience-evidence.ts --topic nighttime_rhythm --claim quiet_after_8 [--city "Elko, NV"]\n   or: find-experience-evidence.ts --search "quiet nightlife" [--city "Elko, NV"]');
  process.exit(1);
}

async function main() {
  const sql = getSql();
  const rows = (search
    ? await sql.query(
      `SELECT l.name, l.state, e.stance, e.observation, e.source_excerpt, e.source_title,
              e.source_url, e.confidence, e.geography_scope
         FROM location_experience_observations e
         JOIN locations_location l ON l.id = e.location_id
        WHERE to_tsvector('english', e.topic || ' ' || e.claim_key || ' ' || e.observation || ' ' || e.source_excerpt)
              @@ websearch_to_tsquery('english', $1)
          AND ($2::text IS NULL OR lower(l.name || ', ' || l.state) = lower($2))
        ORDER BY ts_rank(
                   to_tsvector('english', e.topic || ' ' || e.claim_key || ' ' || e.observation || ' ' || e.source_excerpt),
                   websearch_to_tsquery('english', $1)
                 ) DESC, l.name, e.id`,
      [search, city ?? null]
    )
    : await sql.query(
      `SELECT l.name, l.state, e.stance, e.observation, e.source_excerpt, e.source_title,
              e.source_url, e.confidence, e.geography_scope
         FROM location_experience_observations e
         JOIN locations_location l ON l.id = e.location_id
        WHERE e.topic = $1 AND e.claim_key = $2
          AND ($3::text IS NULL OR lower(l.name || ', ' || l.state) = lower($3))
        ORDER BY l.name, CASE e.stance WHEN 'supports' THEN 0 WHEN 'contradicts' THEN 1 ELSE 2 END, e.id`,
      [topic, claim, city ?? null]
    )) as Array<Record<string, string>>;
  if (!rows.length) {
    console.log("No source-level evidence is recorded for that question. Unknown is the answer.");
    return;
  }
  for (const row of rows) {
    console.log(`\n${row.name}, ${row.state} — ${row.stance} (${row.confidence}, ${row.geography_scope})`);
    console.log(row.observation);
    console.log(`“${row.source_excerpt}”`);
    console.log(`${row.source_title ?? "Source"}: ${row.source_url}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
