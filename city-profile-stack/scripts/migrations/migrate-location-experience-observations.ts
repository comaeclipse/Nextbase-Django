/*
 * Creates source-level evidence for lived-experience questions such as
 * "is it quiet after 8?". This is deliberately separate from numeric features:
 * observations preserve both supporting and contradicting evidence instead of
 * compressing a contested answer into one score.
 */
import { getSql } from "../../../lib/db";

const dryRun = process.argv.includes("--dry-run");

async function main() {
  console.log(`Location experience observations migration${dryRun ? " (dry run)" : ""}`);
  if (dryRun) return;

  const sql = getSql();
  await sql.query(`
    CREATE TABLE IF NOT EXISTS location_experience_observations (
      id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      location_id bigint NOT NULL REFERENCES locations_location(id) ON DELETE CASCADE,
      observation_key text NOT NULL,
      topic text NOT NULL CHECK (topic ~ '^[a-z0-9_]+$'),
      claim_key text NOT NULL CHECK (claim_key ~ '^[a-z0-9_]+$'),
      stance text NOT NULL CHECK (stance IN ('supports', 'contradicts', 'context')),
      observation text NOT NULL,
      source_excerpt text NOT NULL,
      source_title text,
      source_url text NOT NULL CHECK (source_url ~ '^https://'),
      evidence_kind text NOT NULL,
      confidence text NOT NULL CHECK (confidence IN ('high', 'medium', 'limited')),
      geography_scope text NOT NULL DEFAULT 'city',
      tags text[] NOT NULL DEFAULT '{}',
      source_published_on date,
      source_retrieved_on date,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE (location_id, observation_key)
    )
  `);
  await sql.query(
    "CREATE INDEX IF NOT EXISTS location_experience_observations_topic_idx ON location_experience_observations(topic, claim_key)"
  );
  await sql.query(
    "CREATE INDEX IF NOT EXISTS location_experience_observations_tags_idx ON location_experience_observations USING gin(tags)"
  );
  await sql.query(`
    CREATE INDEX IF NOT EXISTS location_experience_observations_search_idx
    ON location_experience_observations
    USING gin (to_tsvector('english', topic || ' ' || claim_key || ' ' || observation || ' ' || source_excerpt))
  `);
  console.log("  + location_experience_observations");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
