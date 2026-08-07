/*
 * Imports texture markers and character features from
 * city-profile-stack/data/location-texture-markers.json.
 *
 * Run after city-profile-stack/scripts/migrations/migrate-location-texture-markers.ts.
 *
 * Markers are upserted on (location_id, marker_key). Character features are
 * written into location_features with provenance 'editorial', exactly like
 * dossier-derived features — the character layer is not a separate scoring
 * system, it is more features from a different question.
 *
 * Validation is strict on two things the rest of the pipeline depends on:
 * every key in `evidences` must be a real character feature, and every key in a
 * feature's `markers` array must be a marker actually present in this file.
 * Both were failure modes in earlier ingests.
 */
import { readFileSync } from "node:fs";
import { getSql } from "../../../lib/db";
import {
  CONFIDENCE_CEILING,
  FEATURE_SCHEMA_VERSION,
  FEATURES,
  getFeature,
  isFeatureKey,
} from "../../lib/ontology";

const dryRun = process.argv.includes("--dry-run");
const METHOD_VERSION = "texture_v1";

const CHARACTER_KEYS = new Set(
  FEATURES.filter((f) => f.category === "character").map((f) => f.key)
);

interface Marker {
  marker_key: string;
  domain: string;
  observation: string;
  verbatim?: string | null;
  salience: number;
  valence: string;
  evidences: string[];
  evidence_kind: string;
  confidence: string;
  source_urls: string[];
  source_retrieved_on?: string;
}

interface CityBlock {
  city: string;
  state: string;
  markers: Marker[];
  features?: Record<
    string,
    { value: number; confidence: number; evidence: string; markers?: string[] }
  >;
  gaps?: string[];
}

const source = JSON.parse(readFileSync("city-profile-stack/data/location-texture-markers.json", "utf8")) as {
  methodology?: string;
  cities: CityBlock[];
};

async function main() {
  const sql = getSql();
  let markerCount = 0;
  let featureCount = 0;

  for (const block of source.cities) {
    const locations = (await sql.query(
      "SELECT id FROM locations_location WHERE name = $1 AND state = $2",
      [block.city, block.state]
    )) as { id: string }[];
    if (locations.length !== 1) {
      throw new Error(`Expected one location for ${block.city}, ${block.state}`);
    }
    const locationId = locations[0].id;
    const markerKeys = new Set(block.markers.map((m) => m.marker_key));

    for (const m of block.markers) {
      if (!/^[a-z0-9_]+$/.test(m.marker_key)) {
        throw new Error(`${block.city}: bad marker key ${m.marker_key}`);
      }
      for (const e of m.evidences) {
        if (!CHARACTER_KEYS.has(e)) {
          throw new Error(
            `${block.city}/${m.marker_key}: '${e}' is not a character feature`
          );
        }
      }
      if (m.source_urls.some((u) => !/^https:\/\//.test(u))) {
        throw new Error(`${block.city}/${m.marker_key}: needs HTTPS sources`);
      }

      if (!dryRun) {
        await sql.query(
          `INSERT INTO location_texture_markers (
             location_id, marker_key, domain, observation, verbatim, salience,
             valence, evidences, evidence_kind, confidence, source_urls,
             source_retrieved_on, updated_at
           ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb,$12,now())
           ON CONFLICT (location_id, marker_key) DO UPDATE SET
             domain = EXCLUDED.domain, observation = EXCLUDED.observation,
             verbatim = EXCLUDED.verbatim, salience = EXCLUDED.salience,
             valence = EXCLUDED.valence, evidences = EXCLUDED.evidences,
             evidence_kind = EXCLUDED.evidence_kind, confidence = EXCLUDED.confidence,
             source_urls = EXCLUDED.source_urls,
             source_retrieved_on = EXCLUDED.source_retrieved_on, updated_at = now()`,
          [
            locationId, m.marker_key, m.domain, m.observation, m.verbatim ?? null,
            m.salience, m.valence, m.evidences, m.evidence_kind, m.confidence,
            JSON.stringify(m.source_urls), m.source_retrieved_on ?? null,
          ]
        );
      }
      markerCount++;
    }

    for (const [key, f] of Object.entries(block.features ?? {})) {
      if (!isFeatureKey(key)) throw new Error(`${block.city}: unknown feature ${key}`);
      for (const mk of f.markers ?? []) {
        if (!markerKeys.has(mk)) {
          throw new Error(
            `${block.city}/${key} cites marker '${mk}' that is not in this file`
          );
        }
      }
      const confidence = Math.min(f.confidence, CONFIDENCE_CEILING.editorial);
      if (!dryRun) {
        await sql.query(
          `INSERT INTO location_features (
             location_id, feature_key, schema_version, value, confidence, provenance,
             evidence, source_signal_keys, method_version, computed_at
           ) VALUES ($1,$2,$3,$4,$5,'editorial',$6::jsonb,$7,$8,now())
           ON CONFLICT (location_id, feature_key, provenance) DO UPDATE SET
             value = EXCLUDED.value, confidence = EXCLUDED.confidence,
             evidence = EXCLUDED.evidence, source_signal_keys = EXCLUDED.source_signal_keys,
             method_version = EXCLUDED.method_version, computed_at = now()`,
          [
            locationId, key, FEATURE_SCHEMA_VERSION, f.value, confidence,
            JSON.stringify({ kind: getFeature(key).kind, note: f.evidence, layer: "texture" }),
            f.markers ?? [], METHOD_VERSION,
          ]
        );
      }
      featureCount++;
    }

    console.log(
      `${dryRun ? "=" : "+"} ${block.city}, ${block.state}: ${block.markers.length} markers, ${
        Object.keys(block.features ?? {}).length
      } character features`
    );
  }

  console.log(
    `${dryRun ? "Dry run" : "Import"} complete. ${markerCount} markers, ${featureCount} features.`
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
