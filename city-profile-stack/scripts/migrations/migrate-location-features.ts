/*
 * Creates the quantified city-capability layer (L2) and its resolution view.
 *
 * Design note: the primary key includes `provenance`, so a city can carry an
 * editorial value AND a structurally derived value for the same feature at the
 * same time. That is deliberate. Keeping both lets us measure how far the
 * formulas in city-profile-stack/lib/derive.ts land from researched ground truth, which
 * is the only way the extrapolation gets better as dossiers accumulate. The
 * `location_features_resolved` view picks the winner for read paths.
 *
 * Run before city-profile-stack/scripts/import/import-location-features.ts and
 * city-profile-stack/scripts/tools/derive-structural-features.ts.
 */
import { getSql } from "../../../lib/db";

const dryRun = process.argv.includes("--dry-run");

async function main() {
  console.log(`Location features migration${dryRun ? " (dry run)" : ""}`);
  if (dryRun) {
    console.log("  = Would create location_features and location_features_resolved");
    return;
  }

  const sql = getSql();
  await sql.query(`
    CREATE TABLE IF NOT EXISTS location_features (
      id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      location_id bigint NOT NULL REFERENCES locations_location(id) ON DELETE CASCADE,
      feature_key text NOT NULL,
      schema_version text NOT NULL,
      -- 0..1 always. What 0 and 1 mean depends on the feature's kind
      -- (capacity / intensity / position) in city-profile-stack/lib/ontology.ts.
      value numeric(4, 3) NOT NULL CHECK (value BETWEEN 0 AND 1),
      confidence numeric(4, 3) NOT NULL CHECK (confidence BETWEEN 0 AND 1),
      provenance text NOT NULL
        CHECK (provenance IN ('editorial', 'derived_structural', 'propagated')),
      -- The inputs that produced the value: column names and numbers for a
      -- derivation, signal keys and quotes for an editorial read, neighbour
      -- cities and similarities for a propagation. This is what makes a value
      -- explainable rather than merely present.
      evidence jsonb NOT NULL DEFAULT '{}'::jsonb,
      source_signal_keys text[] NOT NULL DEFAULT '{}',
      dossier_id bigint REFERENCES location_research_dossiers(id) ON DELETE SET NULL,
      method_version text NOT NULL,
      computed_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE (location_id, feature_key, provenance)
    )
  `);
  await sql.query(
    "CREATE INDEX IF NOT EXISTS location_features_location_id_idx ON location_features(location_id)"
  );
  await sql.query(
    "CREATE INDEX IF NOT EXISTS location_features_feature_key_idx ON location_features(feature_key)"
  );

  // Highest-ranked provenance wins per (city, feature) — but NOT unconditionally.
  //
  // Provenance alone was the original rule, and Nashville broke it: a dossier
  // returned humidity_burden at 0.40 confidence while explicitly noting the
  // topic "was not directly discussed", and that guess outranked a 0.80-
  // confidence value derived from actual dew-point normals. Researched beats
  // computed because a human looked at the place, not because the label
  // 'editorial' is magic. When the researcher has effectively said "I am
  // guessing" and we hold a measurement, the measurement should win.
  //
  // Effective rank = provenance tier + confidence, with a tier gap of 0.25.
  // Editorial wins every normal case and every tie; it loses only when a
  // derived value is more than 0.25 more confident.
  await sql.query(`
    CREATE OR REPLACE VIEW location_features_resolved AS
    SELECT DISTINCT ON (location_id, feature_key)
      location_id,
      feature_key,
      schema_version,
      value,
      confidence,
      provenance,
      evidence,
      source_signal_keys,
      method_version,
      computed_at
    FROM location_features
    ORDER BY
      location_id,
      feature_key,
      (CASE provenance
        WHEN 'editorial' THEN 0.25
        WHEN 'derived_structural' THEN 0.0
        WHEN 'propagated' THEN -0.50
      END + confidence) DESC,
      CASE provenance
        WHEN 'editorial' THEN 3
        WHEN 'derived_structural' THEN 2
        WHEN 'propagated' THEN 1
      END DESC
  `);

  console.log("  + location_features");
  console.log("  + location_features_resolved (view)");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
