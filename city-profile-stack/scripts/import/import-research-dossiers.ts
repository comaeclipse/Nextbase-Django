/*
 * Imports raw research dossiers (L0) from city-profile-stack/data/dossiers/research-dossiers/*.json.
 * Run after city-profile-stack/scripts/migrations/migrate-location-research-dossiers.ts.
 *
 * Dossiers are append-only. Re-running with unchanged narrative text is a no-op;
 * changed text lands as a new revision rather than overwriting the old one, so
 * the reading a feature was extracted from stays recoverable.
 */
import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { getSql } from "../../../lib/db";

const DOSSIER_DIR = "city-profile-stack/data/dossiers/research-dossiers";
const dryRun = process.argv.includes("--dry-run");

interface Dossier {
  city: string;
  state: string;
  dossier_key: string;
  source_kind: string;
  title: string;
  summary?: string;
  narrative_file: string;
  analyst?: string;
  retrieved_on?: string;
  coverage?: Record<string, unknown>;
  source_urls?: string[];
  structured?: Record<string, unknown>;
}

function assertDossier(dossier: Dossier, file: string): void {
  for (const field of ["city", "state", "dossier_key", "source_kind", "title", "narrative_file"] as const) {
    if (!dossier[field]) throw new Error(`${file}: missing ${field}`);
  }
  if (!/^[a-z0-9_]+$/.test(dossier.dossier_key)) {
    throw new Error(`${file}: dossier_key must be lowercase snake case`);
  }
  for (const url of dossier.source_urls ?? []) {
    if (!/^https:\/\//.test(url)) throw new Error(`${file}: source URLs must be HTTPS (${url})`);
  }
}

async function main() {
  const sql = getSql();
  const files = readdirSync(DOSSIER_DIR).filter((f) => f.endsWith(".json"));
  let inserted = 0;
  let unchanged = 0;

  for (const file of files) {
    const dossier = JSON.parse(readFileSync(join(DOSSIER_DIR, file), "utf8")) as Dossier;
    assertDossier(dossier, file);
    const narrative = readFileSync(join(DOSSIER_DIR, dossier.narrative_file), "utf8");
    const hash = createHash("sha256").update(narrative).digest("hex");

    const locations = (await sql.query(
      "SELECT id FROM locations_location WHERE name = $1 AND state = $2",
      [dossier.city, dossier.state]
    )) as { id: string }[];
    if (locations.length !== 1) {
      throw new Error(`${file}: expected exactly one location for ${dossier.city}, ${dossier.state}`);
    }
    const locationId = locations[0].id;

    const existing = (await sql.query(
      `SELECT revision, content_hash FROM location_research_dossiers
       WHERE location_id = $1 AND dossier_key = $2
       ORDER BY revision DESC LIMIT 1`,
      [locationId, dossier.dossier_key]
    )) as { revision: number; content_hash: string }[];

    if (existing.length > 0 && existing[0].content_hash === hash) {
      console.log(`= ${dossier.city}, ${dossier.state}: ${dossier.dossier_key} r${existing[0].revision} unchanged`);
      unchanged++;
      continue;
    }
    const revision = existing.length > 0 ? existing[0].revision + 1 : 1;
    console.log(`${dryRun ? "=" : "+"} ${dossier.city}, ${dossier.state}: ${dossier.dossier_key} r${revision} (${narrative.length} chars)`);

    if (!dryRun) {
      await sql.query(
        `INSERT INTO location_research_dossiers (
           location_id, dossier_key, source_kind, title, summary, narrative,
           structured, coverage, source_urls, analyst, revision, content_hash, retrieved_on
         ) VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8::jsonb,$9::jsonb,$10,$11,$12,$13)`,
        [
          locationId,
          dossier.dossier_key,
          dossier.source_kind,
          dossier.title,
          dossier.summary ?? null,
          narrative,
          JSON.stringify(dossier.structured ?? {}),
          JSON.stringify(dossier.coverage ?? {}),
          JSON.stringify(dossier.source_urls ?? []),
          dossier.analyst ?? null,
          revision,
          hash,
          dossier.retrieved_on ?? null,
        ]
      );
    }
    inserted++;
  }

  console.log(`${dryRun ? "Dry run" : "Import"} complete. ${inserted} new revision(s), ${unchanged} unchanged.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
