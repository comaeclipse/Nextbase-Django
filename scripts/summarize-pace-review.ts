import { getSql } from "../lib/db";

async function main() {
  const sql = getSql();
  const rows = (await sql.query(
    `SELECT
       l.name,
       l.state,
       h.score,
       h.candidate_category,
       h.confidence,
       h.scope,
       h.cbsa_geoid,
       h.input_values
     FROM location_pace_classifications h
     JOIN locations_location l ON l.id = h.location_id
     WHERE h.id = (
       SELECT h2.id
       FROM location_pace_classifications h2
       WHERE h2.location_id = h.location_id
       ORDER BY h2.created_at DESC, h2.id DESC
       LIMIT 1
     )
       AND h.review_state = 'needs_review'
     ORDER BY h.candidate_category NULLS LAST, h.score DESC NULLS LAST, l.name`
  )) as Record<string, unknown>[];

  for (const r of rows) {
    const iv = r.input_values as {
      reviewReasons?: string[];
      raw?: { ruca_primary?: number };
    };
    const score = r.score == null ? "n/a" : Number(r.score).toFixed(1);
    const conf =
      r.confidence == null ? "n/a" : Number(r.confidence).toFixed(1);
    const reasons = (iv.reviewReasons ?? []).join(",") || "-";
    const ruca = iv.raw?.ruca_primary ?? "?";
    console.log(
      [
        `${r.name}, ${r.state}`,
        r.candidate_category ?? "?",
        score,
        `±${conf}`,
        `scope=${r.scope}`,
        `cbsa=${r.cbsa_geoid ?? "-"}`,
        `ruca=${ruca}`,
        reasons,
      ].join(" | ")
    );
  }
  console.log(`\nTOTAL ${rows.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
