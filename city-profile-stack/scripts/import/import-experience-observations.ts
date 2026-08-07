/* Imports quote-level, source-backed evidence for lived-experience questions. */
import { readFileSync } from "node:fs";
import { getSql } from "../../../lib/db";

type Stance = "supports" | "contradicts" | "context";
type Confidence = "high" | "medium" | "limited";

interface Observation {
  city: string;
  state: string;
  observation_key: string;
  topic: string;
  claim_key: string;
  stance: Stance;
  observation: string;
  source_excerpt: string;
  source_title?: string;
  source_url: string;
  evidence_kind: string;
  confidence: Confidence;
  geography_scope?: string;
  tags?: string[];
  source_published_on?: string;
  source_retrieved_on?: string;
}

const source = JSON.parse(
  readFileSync("city-profile-stack/data/experience-observations.json", "utf8")
) as { observations: Observation[] };
const dryRun = process.argv.includes("--dry-run");

function assertObservation(row: Observation) {
  for (const key of ["observation_key", "topic", "claim_key"] as const) {
    if (!/^[a-z0-9_]+$/.test(row[key])) throw new Error(`Invalid ${key}: ${row[key]}`);
  }
  if (!row.observation || !row.source_excerpt || !row.source_url || !row.evidence_kind) {
    throw new Error(`${row.observation_key}: required evidence fields are blank`);
  }
  if (!row.source_url.startsWith("https://")) throw new Error(`${row.observation_key}: source URL must be HTTPS`);
  if (!(["supports", "contradicts", "context"] as const).includes(row.stance)) {
    throw new Error(`${row.observation_key}: invalid stance`);
  }
  if (!(["high", "medium", "limited"] as const).includes(row.confidence)) {
    throw new Error(`${row.observation_key}: invalid confidence`);
  }
}

async function main() {
  const sql = getSql();
  let imported = 0;
  for (const row of source.observations) {
    assertObservation(row);
    const locations = await sql.query(
      "SELECT id FROM locations_location WHERE name = $1 AND state = $2",
      [row.city, row.state]
    ) as { id: string }[];
    if (locations.length !== 1) throw new Error(`${row.observation_key}: expected one ${row.city}, ${row.state}`);
    console.log(`${dryRun ? "=" : "+"} ${row.city}, ${row.state}: ${row.topic}/${row.claim_key}/${row.stance}`);
    if (!dryRun) {
      await sql.query(
        `INSERT INTO location_experience_observations (
          location_id, observation_key, topic, claim_key, stance, observation,
          source_excerpt, source_title, source_url, evidence_kind, confidence,
          geography_scope, tags, source_published_on, source_retrieved_on, updated_at
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,now())
        ON CONFLICT (location_id, observation_key) DO UPDATE SET
          topic = EXCLUDED.topic, claim_key = EXCLUDED.claim_key, stance = EXCLUDED.stance,
          observation = EXCLUDED.observation, source_excerpt = EXCLUDED.source_excerpt,
          source_title = EXCLUDED.source_title, source_url = EXCLUDED.source_url,
          evidence_kind = EXCLUDED.evidence_kind, confidence = EXCLUDED.confidence,
          geography_scope = EXCLUDED.geography_scope, tags = EXCLUDED.tags,
          source_published_on = EXCLUDED.source_published_on,
          source_retrieved_on = EXCLUDED.source_retrieved_on, updated_at = now()`,
        [
          locations[0].id, row.observation_key, row.topic, row.claim_key, row.stance,
          row.observation, row.source_excerpt, row.source_title ?? null, row.source_url,
          row.evidence_kind, row.confidence, row.geography_scope ?? "city", row.tags ?? [],
          row.source_published_on ?? null, row.source_retrieved_on ?? null,
        ]
      );
    }
    imported++;
  }
  console.log(`${dryRun ? "Dry run" : "Import"} complete. ${imported} observation(s).`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
