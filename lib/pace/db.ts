import { getSql } from "../db";
import type { ClassifyResult } from "./classify";
import type { PaceCategory } from "./types";

export interface ExistingOverride {
  override_category: PaceCategory;
  override_reason: string | null;
}

/**
 * Latest approved manual override for a location, if any.
 * Reruns preserve this by copying it onto the new history row.
 */
export async function getApprovedOverride(
  locationId: number
): Promise<ExistingOverride | null> {
  const sql = getSql();
  const rows = (await sql.query(
    `SELECT override_category, override_reason
     FROM location_pace_classifications
     WHERE location_id = $1
       AND override_category IS NOT NULL
       AND review_state IN ('approved', 'auto_approved')
     ORDER BY created_at DESC, id DESC
     LIMIT 1`,
    [locationId]
  )) as { override_category: PaceCategory; override_reason: string | null }[];
  return rows[0] ?? null;
}

export async function insertClassification(
  result: ClassifyResult,
  opts: { dryRun?: boolean; preserveOverride?: ExistingOverride | null } = {}
): Promise<{ inserted: boolean; preservedOverride: boolean }> {
  const override = opts.preserveOverride ?? null;
  const preservedOverride = !!override;

  if (opts.dryRun) {
    return { inserted: false, preservedOverride };
  }

  const sql = getSql();
  const g = result.geography;
  const reviewState = override ? "approved" : result.reviewState;

  await sql.query(
    `INSERT INTO location_pace_classifications (
       location_id, scope, cbsa_geoid, place_geoid, tract_geoids,
       census_vintage, input_values, source_versions, source_checksums,
       score, candidate_category, confidence, review_state,
       override_category, override_reason, reviewed_at, algorithm_version
     ) VALUES (
       $1, $2, $3, $4, $5::jsonb,
       $6, $7::jsonb, $8::jsonb, $9::jsonb,
       $10, $11, $12, $13,
       $14, $15, $16, $17
     )`,
    [
      result.locationId,
      g?.scope ?? "place",
      g?.cbsaGeoid ?? null,
      g?.placeGeoid ?? null,
      JSON.stringify(g?.tractGeoids ?? []),
      g?.censusVintage ?? null,
      JSON.stringify(result.inputValues),
      JSON.stringify(result.sources.versions),
      JSON.stringify(result.sources.checksums),
      result.scored.score,
      result.scored.category,
      result.scored.confidence,
      reviewState,
      override?.override_category ?? null,
      override?.override_reason ?? null,
      override ? new Date().toISOString() : null,
      result.algorithmVersion,
    ]
  );

  return { inserted: true, preservedOverride };
}

export async function classifyAndPersist(
  result: ClassifyResult,
  dryRun = false
): Promise<{ inserted: boolean; preservedOverride: boolean }> {
  const override = await getApprovedOverride(result.locationId);
  return insertClassification(result, {
    dryRun,
    preserveOverride: override,
  });
}
