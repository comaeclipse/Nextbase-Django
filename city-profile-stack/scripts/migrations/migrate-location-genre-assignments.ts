/*
 * Creates the additive city-to-genre assignment layer.
 *
 * The TypeScript registry in lib/genre-ontology.ts is the source of truth for
 * genre keys and lifecycle status. This table stores evidence-backed,
 * versioned assignments without altering locations_location.
 */
import { getSql } from "../../../lib/db";

const dryRun = process.argv.includes("--dry-run");

async function main() {
  console.log(`Location genre assignments migration${dryRun ? " (dry run)" : ""}`);
  if (dryRun) {
    console.log("  = Would create location_genre_assignments and its indexes");
    return;
  }

  const sql = getSql();
  await sql.query(`
    CREATE TABLE IF NOT EXISTS location_genre_assignments (
      id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      location_id bigint NOT NULL REFERENCES locations_location(id) ON DELETE CASCADE,
      level text NOT NULL CHECK (level IN ('broad', 'micro', 'nano')),
      -- Validated against city-profile-stack/lib/genre-ontology.ts on write.
      genre_key text NOT NULL CHECK (btrim(genre_key) <> ''),
      is_primary boolean NOT NULL DEFAULT false,
      confidence numeric(4, 3) NOT NULL CHECK (confidence BETWEEN 0 AND 1),
      rationale text NOT NULL CHECK (btrim(rationale) <> ''),
      -- claim IDs, feature keys, divergence IDs, and/or source-signal keys.
      evidence jsonb NOT NULL CHECK (
        jsonb_typeof(evidence) = 'object' AND evidence <> '{}'::jsonb
      ),
      ontology_version text NOT NULL CHECK (btrim(ontology_version) <> ''),
      method_version text NOT NULL CHECK (btrim(method_version) <> ''),
      assigned_on date NOT NULL DEFAULT current_date,
      reviewed_by text,
      reviewed_at timestamptz,
      CHECK ((reviewed_by IS NULL) = (reviewed_at IS NULL)),
      CHECK (reviewed_by IS NULL OR btrim(reviewed_by) <> ''),
      UNIQUE (location_id, level, genre_key)
    )
  `);
  await sql.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS location_genre_assignments_primary_idx
      ON location_genre_assignments(location_id, level)
      WHERE is_primary
  `);
  await sql.query(`
    CREATE INDEX IF NOT EXISTS location_genre_assignments_location_id_idx
      ON location_genre_assignments(location_id)
  `);
  await sql.query(`
    CREATE INDEX IF NOT EXISTS location_genre_assignments_genre_key_idx
      ON location_genre_assignments(genre_key)
  `);

  console.log("  + location_genre_assignments");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
