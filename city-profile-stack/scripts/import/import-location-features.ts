/*
 * Imports editorial city-capability features (L2) from city-profile-stack/data/location-features.json.
 * Run after city-profile-stack/scripts/migrations/migrate-location-features.ts and import-research-dossiers.ts.
 *
 * Validation is deliberately strict: unknown feature keys are a hard error, and
 * confidence is clamped to the ceiling for editorial provenance. The failure
 * mode this guards against is a confident-sounding narrative turning into a
 * number the UI presents as measured fact.
 */
import { readFileSync } from "node:fs";
import { getSql } from "../../../lib/db";
import {
  CONFIDENCE_CEILING,
  FEATURE_SCHEMA_VERSION,
  getFeature,
  isFeatureKey,
} from "../../lib/ontology";

const dryRun = process.argv.includes("--dry-run");

interface EditorialFeature {
  value: number;
  confidence: number;
  evidence: string;
  signals?: string[];
}

interface CityFeatures {
  city: string;
  state: string;
  dossier_key?: string;
  features: Record<string, EditorialFeature>;
  gaps?: string[];
}

const source = JSON.parse(readFileSync("city-profile-stack/data/location-features.json", "utf8")) as {
  schema_version: string;
  method_version: string;
  cities: CityFeatures[];
};

if (source.schema_version !== FEATURE_SCHEMA_VERSION) {
  throw new Error(
    `city-profile-stack/data/location-features.json declares ${source.schema_version} but the ontology is ${FEATURE_SCHEMA_VERSION}`
  );
}

async function main() {
  const sql = getSql();
  let imported = 0;
  const clamped: string[] = [];

  for (const city of source.cities) {
    const locations = (await sql.query(
      "SELECT id FROM locations_location WHERE name = $1 AND state = $2",
      [city.city, city.state]
    )) as { id: string }[];
    if (locations.length !== 1) {
      throw new Error(`Expected exactly one location for ${city.city}, ${city.state}`);
    }
    const locationId = locations[0].id;

    let dossierId: string | null = null;
    if (city.dossier_key) {
      const dossiers = (await sql.query(
        `SELECT id FROM location_research_dossiers
         WHERE location_id = $1 AND dossier_key = $2
         ORDER BY revision DESC LIMIT 1`,
        [locationId, city.dossier_key]
      )) as { id: string }[];
      dossierId = dossiers[0]?.id ?? null;
      if (dossierId === null) {
        throw new Error(
          `${city.city}, ${city.state}: dossier '${city.dossier_key}' not found — run import-research-dossiers.ts first`
        );
      }
    }

    // Feature rows cite signal keys as their evidence trail. Nothing enforces
    // that at the database level, so a dossier whose two JSON blocks were
    // generated independently can silently store references to signals that do
    // not exist — and the explanation chain breaks with no error anywhere.
    const knownSignals = new Set(
      (
        (await sql.query(
          "SELECT signal_key FROM location_profile_signals WHERE location_id = $1",
          [locationId]
        )) as { signal_key: string }[]
      ).map((r) => r.signal_key)
    );
    const dangling = new Set<string>();
    for (const feature of Object.values(city.features)) {
      for (const signal of feature.signals ?? []) {
        if (!knownSignals.has(signal)) dangling.add(signal);
      }
    }
    if (dangling.size > 0) {
      throw new Error(
        `${city.city}, ${city.state}: ${dangling.size} feature(s) cite signal keys with no matching row in location_profile_signals — ` +
          `import the signals first, or fix these references: ${[...dangling].sort().join(", ")}`
      );
    }

    for (const [key, feature] of Object.entries(city.features)) {
      if (!isFeatureKey(key)) {
        throw new Error(`${city.city}, ${city.state}: unknown feature key '${key}'`);
      }
      if (!(feature.value >= 0 && feature.value <= 1)) {
        throw new Error(`${city.city}: ${key} value must be 0..1`);
      }
      if (!feature.evidence) {
        throw new Error(`${city.city}: ${key} needs an evidence string`);
      }
      const ceiling = CONFIDENCE_CEILING.editorial;
      const confidence = Math.min(feature.confidence, ceiling);
      if (confidence < feature.confidence) {
        clamped.push(`${city.city}/${key} ${feature.confidence} -> ${confidence}`);
      }

      const definition = getFeature(key);
      console.log(
        `${dryRun ? "=" : "+"} ${city.city}, ${city.state}: ${key} = ${feature.value} (${definition.kind}, conf ${confidence})`
      );

      if (!dryRun) {
        await sql.query(
          `INSERT INTO location_features (
             location_id, feature_key, schema_version, value, confidence, provenance,
             evidence, source_signal_keys, dossier_id, method_version, computed_at
           ) VALUES ($1,$2,$3,$4,$5,'editorial',$6::jsonb,$7,$8,$9,now())
           ON CONFLICT (location_id, feature_key, provenance) DO UPDATE SET
             schema_version = EXCLUDED.schema_version,
             value = EXCLUDED.value,
             confidence = EXCLUDED.confidence,
             evidence = EXCLUDED.evidence,
             source_signal_keys = EXCLUDED.source_signal_keys,
             dossier_id = EXCLUDED.dossier_id,
             method_version = EXCLUDED.method_version,
             computed_at = now()`,
          [
            locationId,
            key,
            source.schema_version,
            feature.value,
            confidence,
            JSON.stringify({ kind: definition.kind, note: feature.evidence }),
            feature.signals ?? [],
            dossierId,
            source.method_version,
          ]
        );
      }
      imported++;
    }

    for (const gap of city.gaps ?? []) {
      console.log(`  ~ gap: ${gap}`);
    }
  }

  if (clamped.length > 0) {
    console.log(`\nConfidence clamped to the editorial ceiling: ${clamped.join(", ")}`);
  }
  console.log(`${dryRun ? "Dry run" : "Import"} complete. ${imported} editorial feature(s).`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
