/*
 * Creates the texture-marker layer: concrete, quotable, observable details that
 * characterize a place.
 *
 * WHY THIS IS NOT JUST ANOTHER SIGNAL TABLE
 *
 * `location_profile_signals` holds observations ABOUT a city — "the job market
 * is narrow outside the installation", "housing costs outpace local wages".
 * Analytical, summarized, audience-scoped.
 *
 * A texture marker is a specific thing you would SEE or NOTICE. "There is no
 * 24-hour anything." "People do yoga in the park while a band plays on the
 * corner." "Every third car has a kayak on it." "Nobody locks the side door."
 * "The bars close at nine and everyone means it."
 *
 * The distinction matters because the marker is simultaneously the evidence and
 * the deliverable. A reader deciding where to live learns more from "there is
 * no 24-hour anything" than from `late_night_availability = 0.15`. The score
 * makes texture sortable; the marker makes it real. So the verbatim resident
 * phrasing is stored as a first-class column, not buried in an evidence blob —
 * the phrasing IS the data, and paraphrasing it destroys most of its value.
 *
 * Markers evidence the `character` features in city-profile-stack/lib/ontology.ts the
 * same way signals evidence capability features.
 *
 * Run before city-profile-stack/scripts/import/import-texture-markers.ts.
 */
import { getSql } from "../../../lib/db";

const dryRun = process.argv.includes("--dry-run");

async function main() {
  console.log(`Location texture markers migration${dryRun ? " (dry run)" : ""}`);
  if (dryRun) {
    console.log("  = Would create location_texture_markers");
    return;
  }

  const sql = getSql();
  await sql.query(`
    CREATE TABLE IF NOT EXISTS location_texture_markers (
      id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      location_id bigint NOT NULL REFERENCES locations_location(id) ON DELETE CASCADE,
      marker_key text NOT NULL,

      -- What kind of detail this is. Deliberately concrete domains rather than
      -- the abstract categories used for capability features.
      domain text NOT NULL CHECK (domain IN (
        'street_life',     -- what happens in public space
        'commerce',        -- what shops exist and how they behave
        'pace',            -- opening hours, speed, urgency
        'social_norms',    -- how strangers and neighbours treat each other
        'aesthetics',      -- what the place looks like
        'sound',           -- what it sounds like
        'ritual',          -- recurring local events and habits
        'food_culture',    -- what and how people eat
        'transport_habit', -- how people actually move around
        'local_lore'       -- the stories residents tell about themselves
      )),

      -- The observable detail, in plain language. This is the payload.
      observation text NOT NULL,
      -- Resident phrasing where it exists, preserved exactly. Paraphrase
      -- destroys most of the value of a line like "nobody locks anything here".
      verbatim text,

      -- How much this defines the place, 1-5. A marker can be vivid and
      -- peripheral (a single beloved diner) or mundane and defining
      -- (everything closes at nine).
      salience smallint NOT NULL CHECK (salience BETWEEN 1 AND 5),

      -- Whether residents read this as charming, grating, or both. 'contested'
      -- is common and is a finding in itself: the same detail is why one person
      -- stays and another leaves.
      valence text NOT NULL CHECK (valence IN ('charming', 'grating', 'neutral', 'contested')),

      -- Which character features this marker evidences. Validated against the
      -- ontology on import, so a marker cannot cite a feature that does not exist.
      evidences text[] NOT NULL DEFAULT '{}',

      evidence_kind text NOT NULL,
      confidence text NOT NULL CHECK (confidence IN ('high', 'medium', 'limited')),
      source_urls jsonb NOT NULL DEFAULT '[]'::jsonb,
      source_retrieved_on date,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE (location_id, marker_key)
    )
  `);
  await sql.query(
    "CREATE INDEX IF NOT EXISTS location_texture_markers_location_id_idx ON location_texture_markers(location_id)"
  );
  await sql.query(
    "CREATE INDEX IF NOT EXISTS location_texture_markers_domain_idx ON location_texture_markers(domain)"
  );
  // Finding every city where a given character trait shows up.
  await sql.query(
    "CREATE INDEX IF NOT EXISTS location_texture_markers_evidences_idx ON location_texture_markers USING gin(evidences)"
  );

  console.log("  + location_texture_markers");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
