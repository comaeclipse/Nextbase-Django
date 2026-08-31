import { applyCbsaFromTract, resolvePaceGeography } from "./geography";
import { scorePace } from "./score";
import {
  indexDerivedUnits,
  loadDerivedBundle,
  sourceMetaFromBundle,
} from "./sources";
import type {
  PaceDerivedBundle,
  PaceDerivedUnit,
  PaceGeography,
  PaceRawMetrics,
  PaceReviewState,
  PaceScoreResult,
  PaceSourceMeta,
} from "./types";
import { PACE_ALGORITHM_VERSION } from "./types";
import { rucaPrimaryToScore } from "./ruca";

export interface ClassifyInput {
  locationId: number;
  name: string;
  state: string;
}

export interface ClassifyResult {
  locationId: number;
  name: string;
  state: string;
  geography: PaceGeography | null;
  raw: PaceRawMetrics | null;
  scored: PaceScoreResult;
  reviewState: PaceReviewState;
  algorithmVersion: string;
  sources: PaceSourceMeta;
  inputValues: Record<string, unknown>;
}

function unitToRaw(unit: PaceDerivedUnit): PaceRawMetrics {
  return {
    ruca_score: unit.ruca_score,
    ruca_primary: unit.ruca_primary,
    density: unit.density,
    ua_population: unit.ua_population,
    employment_density: unit.employment_density,
    walkability: unit.walkability,
    ped_intersection_density: unit.ped_intersection_density,
    population: unit.population,
  };
}

/**
 * Connecticut's 2022 reorg recoded census tracts from the legacy eight counties
 * (state FIPS 09 + county 001–015) to nine planning regions (09 + 110–190),
 * preserving the six-digit tract number. The Census geocoder now returns the
 * planning-region GEOID (e.g. 09120080500 for a Stratford tract), but the
 * derived pace bundle still keys CT tracts by the legacy county FIPS
 * (09001080500). CT 2020 tract numbers are unique statewide, so bridge a CT
 * tract by its six-digit number when the direct GEOID lookup misses.
 */
function bridgeConnecticutTract(
  key: string,
  tractIndex: Map<string, PaceDerivedUnit>
): PaceDerivedUnit | null {
  if (!key.startsWith("09") || key.length !== 11) return null;
  const tractNumber = key.slice(5);
  for (const [geoid, unit] of tractIndex) {
    if (geoid.length === 11 && geoid.startsWith("09") && geoid.slice(5) === tractNumber) {
      return unit;
    }
  }
  return null;
}

export function findTractUnit(
  geography: PaceGeography,
  tractIndex: Map<string, PaceDerivedUnit>
): PaceDerivedUnit | null {
  for (const tract of geography.tractGeoids) {
    const key = tract.replace(/\D/g, "").padStart(11, "0").slice(-11);
    const unit =
      tractIndex.get(key) ??
      tractIndex.get(tract) ??
      bridgeConnecticutTract(key, tractIndex);
    if (unit) return unit;
  }
  return null;
}

function lookupMetrics(
  geography: PaceGeography,
  bundle: PaceDerivedBundle
): { raw: PaceRawMetrics | null; reason: string | null } {
  const cbsaIndex = indexDerivedUnits(bundle.cbsa);
  // `bundle.place` holds tract-keyed units used for place fallback + CBSA lookup.
  const tractIndex = indexDerivedUnits(bundle.place);

  if (geography.scope === "cbsa" && geography.cbsaGeoid) {
    const key = geography.cbsaGeoid.replace(/\D/g, "").padStart(5, "0").slice(-5);
    const unit = cbsaIndex.get(key) ?? cbsaIndex.get(geography.cbsaGeoid);
    if (unit) return { raw: unitToRaw(unit), reason: null };
    return { raw: null, reason: "cbsa_metrics_missing" };
  }

  const tractUnit = findTractUnit(geography, tractIndex);
  if (tractUnit) {
    const raw = unitToRaw(tractUnit);
    if (raw.ruca_score == null) {
      raw.ruca_score = rucaPrimaryToScore(raw.ruca_primary);
    }
    return { raw, reason: null };
  }

  return { raw: null, reason: "place_metrics_missing" };
}

export function classifyFromMetrics(
  locationId: number,
  name: string,
  state: string,
  geography: PaceGeography,
  raw: PaceRawMetrics,
  bundle: PaceDerivedBundle
): ClassifyResult {
  const scored = scorePace(raw, bundle.percentiles);
  const reviewState: PaceReviewState = scored.autoApprove
    ? "auto_approved"
    : "needs_review";

  return {
    locationId,
    name,
    state,
    geography,
    raw,
    scored,
    reviewState,
    algorithmVersion: PACE_ALGORITHM_VERSION,
    sources: sourceMetaFromBundle(bundle),
    inputValues: {
      raw,
      normalized: scored.normalized,
      factorScores: scored.factorScores,
      reviewReasons: scored.reviewReasons,
    },
  };
}

/**
 * Full classify path: geocode → derived lookup → score.
 * Does not write to the database.
 */
export async function classifyLocation(
  input: ClassifyInput,
  bundle?: PaceDerivedBundle
): Promise<ClassifyResult> {
  const derived = bundle ?? loadDerivedBundle();
  const sources = sourceMetaFromBundle(derived);

  let geography: PaceGeography | null = null;
  try {
    geography = await resolvePaceGeography(
      input.name,
      input.state,
      derived.place_centroids ?? null
    );
  } catch (err) {
    return {
      locationId: input.locationId,
      name: input.name,
      state: input.state,
      geography: null,
      raw: null,
      scored: {
        score: null,
        category: null,
        confidence: null,
        complete: false,
        autoApprove: false,
        reviewReasons: ["geocode_failed"],
        normalized: {
          ruca: null,
          density: null,
          ua_population: null,
          employment_density: null,
          walkability: null,
          ped_intersection_density: null,
        },
        factorScores: {
          ruca: null,
          density: null,
          ua_population: null,
          employment_density: null,
          built_form: null,
        },
      },
      reviewState: "needs_review",
      algorithmVersion: PACE_ALGORITHM_VERSION,
      sources,
      inputValues: {
        error: err instanceof Error ? err.message : String(err),
        reviewReasons: ["geocode_failed"],
      },
    };
  }

  if (
    !geography ||
    (!geography.cbsaGeoid &&
      !geography.placeGeoid &&
      geography.tractGeoids.length === 0)
  ) {
    return {
      locationId: input.locationId,
      name: input.name,
      state: input.state,
      geography,
      raw: null,
      scored: {
        score: null,
        category: null,
        confidence: null,
        complete: false,
        autoApprove: false,
        reviewReasons: ["geography_unresolved"],
        normalized: {
          ruca: null,
          density: null,
          ua_population: null,
          employment_density: null,
          walkability: null,
          ped_intersection_density: null,
        },
        factorScores: {
          ruca: null,
          density: null,
          ua_population: null,
          employment_density: null,
          built_form: null,
        },
      },
      reviewState: "needs_review",
      algorithmVersion: PACE_ALGORITHM_VERSION,
      sources,
      inputValues: { reviewReasons: ["geography_unresolved"] },
    };
  }

  // Geocoder often omits the MSA layer — fill CBSA from the tract's SLD mapping,
  // or from the county majority when the point lands in a special/zero-pop tract.
  const tractIndex = indexDerivedUnits(derived.place);
  const tractUnit = findTractUnit(geography, tractIndex);
  let tractCbsa = tractUnit?.cbsa ?? null;
  if (!tractCbsa && geography.tractGeoids[0]) {
    const county = geography.tractGeoids[0]
      .replace(/\D/g, "")
      .padStart(11, "0")
      .slice(0, 5);
    tractCbsa = derived.county_cbsa?.[county] ?? null;
  }
  geography = applyCbsaFromTract(geography, tractCbsa);

  // Non-metro place fallback: force place scope when no CBSA.
  if (!geography.cbsaGeoid) {
    geography = { ...geography, scope: "place" };
  }

  const { raw, reason } = lookupMetrics(geography, derived);
  if (!raw) {
    return {
      locationId: input.locationId,
      name: input.name,
      state: input.state,
      geography,
      raw: null,
      scored: {
        score: null,
        category: null,
        confidence: null,
        complete: false,
        autoApprove: false,
        reviewReasons: [reason ?? "missing_data"],
        normalized: {
          ruca: null,
          density: null,
          ua_population: null,
          employment_density: null,
          walkability: null,
          ped_intersection_density: null,
        },
        factorScores: {
          ruca: null,
          density: null,
          ua_population: null,
          employment_density: null,
          built_form: null,
        },
      },
      reviewState: "needs_review",
      algorithmVersion: PACE_ALGORITHM_VERSION,
      sources,
      inputValues: { reviewReasons: [reason ?? "missing_data"] },
    };
  }

  return classifyFromMetrics(
    input.locationId,
    input.name,
    input.state,
    geography,
    raw,
    derived
  );
}
