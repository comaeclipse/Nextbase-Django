/*
 * Creates the additive, source-backed city-profile signal layer.
 *
 * Signals are not scoring inputs and not model embeddings. They are concise,
 * attributable observations for profile explanations and future preference
 * matching. Each signal is unique per location and stable signal key.
 */
import { getSql } from "../../../lib/db";

const dryRun = process.argv.includes("--dry-run");

async function main() {
  console.log(`Location profile signals migration${dryRun ? " (dry run)" : ""}`);
  if (dryRun) {
    console.log("  = Would create location_profile_signals");
    return;
  }

  const sql = getSql();
  await sql.query(`
    CREATE TABLE IF NOT EXISTS location_profile_signals (
      id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      location_id bigint NOT NULL REFERENCES locations_location(id) ON DELETE CASCADE,
      signal_key text NOT NULL,
      dimension text NOT NULL,
      polarity text NOT NULL CHECK (polarity IN ('positive', 'caution', 'neutral')),
      strength smallint NOT NULL CHECK (strength BETWEEN 1 AND 5),
      label text NOT NULL,
      detail text NOT NULL,
      audience text,
      geography_scope text NOT NULL DEFAULT 'city',
      evidence_kind text NOT NULL,
      confidence text NOT NULL CHECK (confidence IN ('high', 'medium', 'limited')),
      source_urls jsonb NOT NULL DEFAULT '[]'::jsonb,
      source_retrieved_on date,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE (location_id, signal_key)
    )
  `);
  await sql.query(
    "CREATE INDEX IF NOT EXISTS location_profile_signals_location_id_idx ON location_profile_signals(location_id)"
  );
  console.log("  + location_profile_signals");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
