import { getSql } from "../lib/db";

async function main() {
  const sql = getSql();
  const rows = await sql.query(
    `SELECT
       l.id,
       l.name,
       l.state,
       h.score,
       h.candidate_category,
       h.confidence,
       h.scope,
       h.cbsa_geoid,
       h.place_geoid,
       h.input_values,
       h.review_state
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
     ORDER BY h.candidate_category NULLS LAST, h.score DESC NULLS LAST, l.state, l.name`
  );
  console.log(JSON.stringify(rows, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
