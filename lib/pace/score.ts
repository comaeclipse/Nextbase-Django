import {
  categoryDistance,
  distanceToNearestBoundary,
  rucaPrimaryToCategory,
  rucaPrimaryToScore,
  scoreToCategory,
} from "./ruca";
import { normalizeValue } from "./normalize";
import type {
  PaceNormalizedMetrics,
  PacePercentileBreaks,
  PaceRawMetrics,
  PaceScoreResult,
} from "./types";

const W_RUCA = 0.35;
const W_DENSITY = 0.25;
const W_UA = 0.15;
const W_EMP = 0.1;
const W_WALK = 0.1;
const W_PED = 0.05;

const AUTO_APPROVE_BOUNDARY_GAP = 10;

export function normalizeMetrics(
  raw: PaceRawMetrics,
  breaks: PacePercentileBreaks
): PaceNormalizedMetrics {
  const ruca =
    raw.ruca_score != null && Number.isFinite(raw.ruca_score)
      ? raw.ruca_score
      : rucaPrimaryToScore(raw.ruca_primary);

  return {
    ruca,
    density: normalizeValue(
      raw.density,
      breaks.density,
      breaks.winsor.density,
      true
    ),
    ua_population: normalizeValue(
      raw.ua_population,
      breaks.ua_population,
      breaks.winsor.ua_population,
      true
    ),
    employment_density: normalizeValue(
      raw.employment_density,
      breaks.employment_density,
      breaks.winsor.employment_density,
      true
    ),
    walkability: normalizeValue(
      raw.walkability,
      breaks.walkability,
      breaks.winsor.walkability,
      false
    ),
    ped_intersection_density: normalizeValue(
      raw.ped_intersection_density,
      breaks.ped_intersection_density,
      breaks.winsor.ped_intersection_density,
      true
    ),
  };
}

function builtFormScore(
  walk: number | null,
  ped: number | null
): number | null {
  if (walk == null && ped == null) return null;
  if (walk == null) return ped;
  if (ped == null) return walk;
  // Re-weight the two built-form pieces to sum to 1 within the 15% bucket.
  return (walk * W_WALK + ped * W_PED) / (W_WALK + W_PED);
}

/**
 * Score a geography on the 0–100 urbanicity scale and decide auto-approval.
 */
export function scorePace(
  raw: PaceRawMetrics,
  breaks: PacePercentileBreaks
): PaceScoreResult {
  const normalized = normalizeMetrics(raw, breaks);
  const built = builtFormScore(
    normalized.walkability,
    normalized.ped_intersection_density
  );

  const factorScores = {
    ruca: normalized.ruca,
    density: normalized.density,
    ua_population: normalized.ua_population,
    employment_density: normalized.employment_density,
    built_form: built,
  };

  const parts: { weight: number; value: number }[] = [];
  if (factorScores.ruca != null) parts.push({ weight: W_RUCA, value: factorScores.ruca });
  if (factorScores.density != null)
    parts.push({ weight: W_DENSITY, value: factorScores.density });
  if (factorScores.ua_population != null)
    parts.push({ weight: W_UA, value: factorScores.ua_population });
  if (factorScores.employment_density != null)
    parts.push({ weight: W_EMP, value: factorScores.employment_density });
  if (factorScores.built_form != null)
    parts.push({ weight: W_WALK + W_PED, value: factorScores.built_form });

  const reviewReasons: string[] = [];
  const requiredPresent =
    factorScores.ruca != null &&
    factorScores.density != null &&
    factorScores.ua_population != null &&
    factorScores.employment_density != null &&
    factorScores.built_form != null;

  if (!requiredPresent) {
    reviewReasons.push("missing_data");
  }

  if (parts.length === 0) {
    return {
      score: null,
      category: null,
      confidence: null,
      complete: false,
      autoApprove: false,
      reviewReasons,
      normalized,
      factorScores,
    };
  }

  const weightSum = parts.reduce((s, p) => s + p.weight, 0);
  const score =
    parts.reduce((s, p) => s + p.weight * p.value, 0) / weightSum;

  const category = scoreToCategory(score);
  const confidence = distanceToNearestBoundary(score);

  if (confidence < AUTO_APPROVE_BOUNDARY_GAP) {
    reviewReasons.push("close_boundary");
  }

  const rucaBand = rucaPrimaryToCategory(raw.ruca_primary);
  if (rucaBand && categoryDistance(rucaBand, category) > 1) {
    reviewReasons.push("ruca_conflict");
  }

  const complete = requiredPresent;
  const autoApprove =
    complete &&
    confidence >= AUTO_APPROVE_BOUNDARY_GAP &&
    !reviewReasons.includes("ruca_conflict");

  return {
    score,
    category,
    confidence,
    complete,
    autoApprove,
    reviewReasons,
    normalized,
    factorScores,
  };
}

/** Resolve the effective category for a history row (override wins). */
export function effectiveCategory(row: {
  override_category: string | null;
  candidate_category: string | null;
  review_state: string;
}): string | null {
  if (
    row.override_category &&
    (row.review_state === "approved" || row.review_state === "auto_approved")
  ) {
    return row.override_category;
  }
  if (
    (row.review_state === "auto_approved" || row.review_state === "approved") &&
    row.candidate_category
  ) {
    return row.candidate_category;
  }
  return null;
}
