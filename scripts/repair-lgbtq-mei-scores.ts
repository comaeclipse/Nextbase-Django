/*
 * Repairs legacy `lgbtq_mei_score` values that were saved as 100 instead of
 * the HRC Municipal Equality Index score already documented in each row's
 * `lgbtq_rating` and `lgbtq_score_source`.
 *
 * This deliberately does not infer a municipal score from MAP state-policy
 * values. It touches only rows with explicit HRC provenance and a numeric
 * 0-100 city score.
 *
 * Usage:
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/repair-lgbtq-mei-scores.ts
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/repair-lgbtq-mei-scores.ts --apply
 */

import { getSql } from "../lib/db";

type Candidate = {
  id: number;
  name: string;
  state: string;
  lgbtq_rating: string;
  lgbtq_mei_score: number | null;
  corrected_mei_score: number;
  lgbtq_score_source: string;
};

const directHrcSource = (source: string): boolean =>
  /\bHRC\b/i.test(source) && !/\bno\b[^.]{0,80}\bHRC\b/i.test(source);

async function main() {
  const apply = process.argv.includes("--apply");
  const sql = getSql();
  const rows = (await sql.query(`
    SELECT
      id,
      name,
      state,
      lgbtq_rating,
      lgbtq_mei_score,
      lgbtq_score_source,
      substring(lgbtq_rating FROM '^[0-9]+')::int AS corrected_mei_score
    FROM locations_location
    WHERE lgbtq_score_source IS NOT NULL
      AND lgbtq_rating ~ '^[0-9]+$'
    ORDER BY state, name
  `)) as Candidate[];

  const candidates = rows.filter(
    (row) =>
      directHrcSource(row.lgbtq_score_source) &&
      row.corrected_mei_score >= 0 &&
      row.corrected_mei_score <= 100 &&
      row.lgbtq_mei_score !== row.corrected_mei_score
  );
  const directHrcIds = rows
    .filter(
      (row) =>
        directHrcSource(row.lgbtq_score_source) &&
        row.corrected_mei_score >= 0 &&
        row.corrected_mei_score <= 100
    )
    .map((row) => row.id);

  for (const row of candidates) {
    console.log(
      `${apply ? "Correcting" : "Would correct"} ${row.name}, ${row.state}: ` +
        `${row.lgbtq_mei_score ?? "null"} -> ${row.corrected_mei_score}`
    );
  }

  if (!apply) {
    console.log(`Dry run: ${candidates.length} HRC MEI score(s) would be corrected.`);
    return;
  }

  for (const row of candidates) {
    await sql.query(
      `UPDATE locations_location
       SET lgbtq_mei_score = $1, updated_at = now()
       WHERE id = $2
         AND lgbtq_mei_score IS DISTINCT FROM $1`,
      [row.corrected_mei_score, row.id]
    );
  }

  // The structural feature records the same municipal-policy fact and its
  // confidence depends on this field. Refresh just that dependent feature;
  // re-deriving every unrelated city feature is unnecessary for this repair.
  const refreshed = (await sql.query(
    `UPDATE location_features AS f
     SET value = substring(l.lgbtq_rating FROM '^[0-9]+')::numeric / 100,
         confidence = 0.8,
         evidence = jsonb_build_object(
           'lgbtq_rating', substring(l.lgbtq_rating FROM '^[0-9]+')::int,
           'lgbtq_mei_score', l.lgbtq_mei_score,
           'basis', 'HRC Municipal Equality Index'
         ),
         computed_at = now()
     FROM locations_location AS l
     WHERE f.location_id = l.id
       AND f.feature_key = 'lgbtq_municipal_policy'
       AND f.provenance = 'derived_structural'
       AND f.location_id = ANY($1)
     RETURNING f.location_id`,
    [directHrcIds]
  )) as { location_id: number }[];

  console.log(
    `Applied: ${candidates.length} HRC MEI score(s) corrected; ` +
      `${refreshed.length} dependent municipal-policy feature(s) refreshed.`
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
