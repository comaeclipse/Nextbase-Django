/*
 * Imports source-backed city-profile signals from city-profile-stack/data/location-profile-signals.json.
 * Run after migrate-location-profile-signals.ts. This is additive/upsert-only;
 * signals absent from the file are never deleted.
 */
import { readFileSync } from "node:fs";
import { getSql } from "../../../lib/db";

type Polarity = "positive" | "caution" | "neutral";
type Confidence = "high" | "medium" | "limited";

interface Signal {
  key: string;
  dimension: string;
  polarity: Polarity;
  strength: number;
  label: string;
  detail: string;
  audience?: string;
  geography_scope?: string;
  evidence_kind: string;
  confidence: Confidence;
  source_urls: string[];
  source_retrieved_on?: string;
}

interface Profile {
  city: string;
  state: string;
  signals: Signal[];
}

const dryRun = process.argv.includes("--dry-run");
const source = JSON.parse(readFileSync("city-profile-stack/data/location-profile-signals.json", "utf8")) as {
  methodology: string;
  profiles: Profile[];
};

function assertSignal(signal: Signal): void {
  if (!/^[a-z0-9_]+$/.test(signal.key)) throw new Error(`Invalid signal key: ${signal.key}`);
  if (!signal.dimension || !signal.label || !signal.detail || !signal.evidence_kind) {
    throw new Error(`Signal ${signal.key} has a required blank field`);
  }
  if (!Number.isInteger(signal.strength) || signal.strength < 1 || signal.strength > 5) {
    throw new Error(`Signal ${signal.key} has invalid strength`);
  }
  if (!['positive', 'caution', 'neutral'].includes(signal.polarity)) {
    throw new Error(`Signal ${signal.key} has invalid polarity`);
  }
  if (!['high', 'medium', 'limited'].includes(signal.confidence)) {
    throw new Error(`Signal ${signal.key} has invalid confidence`);
  }
  if (!Array.isArray(signal.source_urls) || signal.source_urls.some((url) => !/^https:\/\//.test(url))) {
    throw new Error(`Signal ${signal.key} needs HTTPS source URLs`);
  }
}

async function main() {
  const sql = getSql();
  let imported = 0;
  for (const profile of source.profiles) {
    const locations = await sql.query(
      "SELECT id FROM locations_location WHERE name = $1 AND state = $2",
      [profile.city, profile.state]
    ) as { id: string }[];
    if (locations.length !== 1) throw new Error(`Expected one location for ${profile.city}, ${profile.state}`);

    for (const signal of profile.signals) {
      assertSignal(signal);
      console.log(`${dryRun ? '=' : '+'} ${profile.city}, ${profile.state}: ${signal.key}`);
      if (!dryRun) {
        await sql.query(
          `INSERT INTO location_profile_signals (
             location_id, signal_key, dimension, polarity, strength, label, detail,
             audience, geography_scope, evidence_kind, confidence, source_urls, source_retrieved_on, updated_at
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::jsonb, $13, now())
           ON CONFLICT (location_id, signal_key) DO UPDATE SET
             dimension = EXCLUDED.dimension, polarity = EXCLUDED.polarity,
             strength = EXCLUDED.strength, label = EXCLUDED.label, detail = EXCLUDED.detail,
             audience = EXCLUDED.audience, geography_scope = EXCLUDED.geography_scope,
             evidence_kind = EXCLUDED.evidence_kind, confidence = EXCLUDED.confidence,
             source_urls = EXCLUDED.source_urls, source_retrieved_on = EXCLUDED.source_retrieved_on,
             updated_at = now()`,
          [
            locations[0].id, signal.key, signal.dimension, signal.polarity, signal.strength,
            signal.label, signal.detail, signal.audience ?? null, signal.geography_scope ?? 'city',
            signal.evidence_kind, signal.confidence, JSON.stringify(signal.source_urls),
            signal.source_retrieved_on ?? null,
          ]
        );
      }
      imported++;
    }
  }
  console.log(`${dryRun ? 'Dry run' : 'Import'} complete. ${imported} signal(s).`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
