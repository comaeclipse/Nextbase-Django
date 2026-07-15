import { getSql } from "../lib/db";

async function main() {
  const sql = getSql();
  const current = await sql.query(
    `SELECT category, count(*)::int AS n
     FROM location_pace_current
     GROUP BY category
     ORDER BY category`
  );
  const latestNeedsReview = await sql.query(
    `SELECT count(*)::int AS n FROM (
       SELECT location_id
       FROM location_pace_classifications
       GROUP BY location_id
       HAVING (array_agg(review_state ORDER BY created_at DESC, id DESC))[1]
              = 'needs_review'
     ) t`
  );
  const missingBoth = await sql.query(
    `SELECT l.name, l.state
     FROM locations_location l
     LEFT JOIN location_pace_current c ON c.location_id = l.id
     WHERE c.location_id IS NULL
       AND NOT EXISTS (
         SELECT 1 FROM location_pace_classifications h
         WHERE h.location_id = l.id AND h.review_state = 'needs_review'
       )
     ORDER BY l.state, l.name`
  );
  console.log(
    JSON.stringify({ current, latestNeedsReview, missingBoth }, null, 2)
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
