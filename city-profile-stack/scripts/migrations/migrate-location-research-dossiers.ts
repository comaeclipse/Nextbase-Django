/*
 * Creates the raw research-dossier layer (L0).
 *
 * This table is the archive of record for qualitative city research: the full
 * narrative and the structured JSON exactly as they were produced, with their
 * provenance. Nothing at request time reads it — the app reads signals and
 * features. Its job is to be the thing you re-derive from when the feature
 * ontology or the extraction methodology changes, so a methodology revision
 * never requires re-doing the research.
 *
 * Run before city-profile-stack/scripts/import/import-research-dossiers.ts.
 */
import { getSql } from "../../../lib/db";

const dryRun = process.argv.includes("--dry-run");

async function main() {
  console.log(`Location research dossiers migration${dryRun ? " (dry run)" : ""}`);
  if (dryRun) {
    console.log("  = Would create location_research_dossiers");
    return;
  }

  const sql = getSql();
  await sql.query(`
    CREATE TABLE IF NOT EXISTS location_research_dossiers (
      id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      location_id bigint NOT NULL REFERENCES locations_location(id) ON DELETE CASCADE,
      dossier_key text NOT NULL,
      source_kind text NOT NULL,
      title text NOT NULL,
      summary text,
      -- The narrative verbatim. Never edited in place; a revision is a new row
      -- with a bumped revision number so earlier readings stay auditable.
      narrative text NOT NULL,
      structured jsonb NOT NULL DEFAULT '{}'::jsonb,
      coverage jsonb NOT NULL DEFAULT '{}'::jsonb,
      source_urls jsonb NOT NULL DEFAULT '[]'::jsonb,
      analyst text,
      revision integer NOT NULL DEFAULT 1,
      -- sha256 of the narrative, so a re-import can tell an edit from a re-run.
      content_hash text NOT NULL,
      retrieved_on date,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE (location_id, dossier_key, revision)
    )
  `);
  await sql.query(
    "CREATE INDEX IF NOT EXISTS location_research_dossiers_location_id_idx ON location_research_dossiers(location_id)"
  );
  console.log("  + location_research_dossiers");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
