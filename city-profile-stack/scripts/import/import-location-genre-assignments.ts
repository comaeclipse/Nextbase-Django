/*
 * Imports reviewed, evidence-backed city genre assignments from an explicit
 * JSON source file. The importer is additive/upsert-only and never infers a
 * genre or confidence value from features, dossiers, or project-board labels.
 *
 * Run after migrate-location-genre-assignments.ts:
 *   ... import-location-genre-assignments.ts <source.json> [--dry-run]
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { getSql } from "../../../lib/db";
import {
  parseGenreAssignmentsFile,
  type GenreAssignmentEvidenceFile,
  type GenreAssignmentFileRow,
} from "../../lib/genre-assignments";
import { validateGenreOntology } from "../../lib/genre-ontology";

const dryRun = process.argv.includes("--dry-run");
const sourceArg = process.argv.slice(2).find((arg) => !arg.startsWith("--"));

if (!sourceArg) {
  throw new Error(
    "Usage: import-location-genre-assignments.ts <source.json> [--dry-run]"
  );
}

const sourcePath = resolve(sourceArg);
const parsed = parseGenreAssignmentsFile(
  JSON.parse(readFileSync(sourcePath, "utf8")) as unknown,
  sourcePath
);
const ontologyErrors = validateGenreOntology();
const errors = [...ontologyErrors, ...parsed.errors];
if (errors.length > 0 || !parsed.value) {
  throw new Error(`Genre assignment validation failed:\n- ${errors.join("\n- ")}`);
}
const source = parsed.value;

interface PreparedAssignment {
  row: GenreAssignmentFileRow;
  locationId: string;
}

function missingReferences(
  requested: readonly string[] | undefined,
  available: Set<string>
): string[] {
  return (requested ?? []).filter((key) => !available.has(key));
}

async function prepareAssignment(
  row: GenreAssignmentFileRow
): Promise<PreparedAssignment> {
  const sql = getSql();
  const locations = (await sql.query(
    "SELECT id FROM locations_location WHERE name = $1 AND state = $2",
    [row.city, row.state]
  )) as { id: string }[];
  if (locations.length !== 1) {
    throw new Error(`Expected exactly one location for ${row.city}, ${row.state}`);
  }
  const locationId = locations[0].id;

  const [featureRows, signalRows, dossierRows] = await Promise.all([
    sql.query("SELECT DISTINCT feature_key FROM location_features WHERE location_id = $1", [
      locationId,
    ]),
    sql.query(
      "SELECT signal_key FROM location_profile_signals WHERE location_id = $1",
      [locationId]
    ),
    sql.query(
      "SELECT dossier_key FROM location_research_dossiers WHERE location_id = $1",
      [locationId]
    ),
  ]);
  const features = featureRows as { feature_key: string }[];
  const signals = signalRows as { signal_key: string }[];
  const dossiers = dossierRows as { dossier_key: string }[];

  const futureReferences = [
    ...(row.evidence.claim_ids ?? []).map((id) => `claim:${id}`),
    ...(row.evidence.divergence_ids ?? []).map((id) => `divergence:${id}`),
  ];
  if (futureReferences.length > 0) {
    const relationRows = (await sql.query(
      "SELECT to_regclass('public.cps_claim')::text AS claims, to_regclass('public.cps_divergence')::text AS divergences"
    )) as { claims: string | null; divergences: string | null }[];
    const relations = relationRows[0];
    if (
      ((row.evidence.claim_ids?.length ?? 0) > 0 && !relations.claims) ||
      ((row.evidence.divergence_ids?.length ?? 0) > 0 && !relations.divergences)
    ) {
      throw new Error(
        `${row.city}, ${row.state}/${row.genre_key}: cannot verify ${futureReferences.join(", ")} until the cps claim/divergence schema exists`
      );
    }

    const [claimRows, divergenceRows] = await Promise.all([
      row.evidence.claim_ids?.length
        ? sql.query("SELECT id::text AS id FROM cps_claim WHERE id::text = ANY($1::text[])", [
            row.evidence.claim_ids,
          ])
        : Promise.resolve([]),
      row.evidence.divergence_ids?.length
        ? sql.query(
            "SELECT id::text AS id FROM cps_divergence WHERE id::text = ANY($1::text[])",
            [row.evidence.divergence_ids]
          )
        : Promise.resolve([]),
    ]);
    const knownClaims = new Set((claimRows as { id: string }[]).map((item) => item.id));
    const knownDivergences = new Set(
      (divergenceRows as { id: string }[]).map((item) => item.id)
    );
    const missingFuture = [
      ...missingReferences(row.evidence.claim_ids, knownClaims).map((id) => `claim:${id}`),
      ...missingReferences(row.evidence.divergence_ids, knownDivergences).map(
        (id) => `divergence:${id}`
      ),
    ];
    if (missingFuture.length > 0) {
      throw new Error(
        `${row.city}, ${row.state}/${row.genre_key}: missing evidence references: ${missingFuture.join(", ")}`
      );
    }
  }

  const missing = [
    ...missingReferences(
      row.evidence.feature_keys,
      new Set(features.map((feature) => feature.feature_key))
    ).map((key) => `feature:${key}`),
    ...missingReferences(
      row.evidence.source_signal_keys,
      new Set(signals.map((signal) => signal.signal_key))
    ).map((key) => `signal:${key}`),
    ...missingReferences(
      row.evidence.dossier_keys,
      new Set(dossiers.map((dossier) => dossier.dossier_key))
    ).map((key) => `dossier:${key}`),
  ];
  if (missing.length > 0) {
    throw new Error(
      `${row.city}, ${row.state}/${row.genre_key}: missing evidence references: ${missing.join(", ")}`
    );
  }

  return { row, locationId };
}

function evidenceJson(evidence: GenreAssignmentEvidenceFile): string {
  return JSON.stringify(evidence);
}

async function main() {
  const prepared: PreparedAssignment[] = [];
  for (const row of source.assignments) prepared.push(await prepareAssignment(row));

  for (const { row } of prepared) {
    console.log(
      `${dryRun ? "=" : "+"} ${row.city}, ${row.state}: ${row.level}/${row.genre_key}` +
        `${row.is_primary ? " (primary)" : ""}`
    );
  }

  if (!dryRun && prepared.length > 0) {
    const sql = getSql();
    await sql.transaction((txn) =>
      prepared.flatMap(({ row, locationId }) => {
        const queries = [];
        if (row.is_primary) {
          queries.push(
            txn.query(
              `UPDATE location_genre_assignments
               SET is_primary = false
               WHERE location_id = $1 AND level = $2 AND genre_key <> $3`,
              [locationId, row.level, row.genre_key]
            )
          );
        }
        queries.push(
          txn.query(
            `INSERT INTO location_genre_assignments (
               location_id, level, genre_key, is_primary, confidence, rationale,
               evidence, ontology_version, method_version, assigned_on,
               reviewed_by, reviewed_at
             ) VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9,$10,$11,$12)
             ON CONFLICT (location_id, level, genre_key) DO UPDATE SET
               is_primary = EXCLUDED.is_primary,
               confidence = EXCLUDED.confidence,
               rationale = EXCLUDED.rationale,
               evidence = EXCLUDED.evidence,
               ontology_version = EXCLUDED.ontology_version,
               method_version = EXCLUDED.method_version,
               assigned_on = EXCLUDED.assigned_on,
               reviewed_by = EXCLUDED.reviewed_by,
               reviewed_at = EXCLUDED.reviewed_at`,
            [
              locationId,
              row.level,
              row.genre_key,
              row.is_primary,
              row.confidence,
              row.rationale,
              evidenceJson(row.evidence),
              source.ontology_version,
              source.method_version,
              row.assigned_on,
              row.reviewed_by ?? null,
              row.reviewed_at ?? null,
            ]
          )
        );
        return queries;
      })
    );
  }

  console.log(
    `${dryRun ? "Dry run" : "Import"} complete. ${prepared.length} assignment(s).`
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
