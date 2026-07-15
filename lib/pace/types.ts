/** Product/query values for retirement pace (lifestyle filter). */
export type PaceCategory = "urban" | "suburban" | "small_town" | "rural";

export type PaceScope = "cbsa" | "place";

export type PaceReviewState =
  | "auto_approved"
  | "needs_review"
  | "approved"
  | "rejected";

export const PACE_CATEGORIES: PaceCategory[] = [
  "urban",
  "suburban",
  "small_town",
  "rural",
];

export const PACE_ALGORITHM_VERSION = "pace-v1";

/** Raw population-weighted aggregates for one CBSA or place. */
export interface PaceRawMetrics {
  /** Population-weighted mean of RUCA primary-class scores (0–100 scale). */
  ruca_score: number | null;
  /** Dominant / rounded RUCA primary class 1–10 (for conflict checks). */
  ruca_primary: number | null;
  /** People per square mile. */
  density: number | null;
  /** Largest connected urban-area population in the geography. */
  ua_population: number | null;
  /** Jobs per acre (EPA SLD D1c). */
  employment_density: number | null;
  /** National Walkability Index (EPA NatWalkInd). */
  walkability: number | null;
  /** Pedestrian-oriented intersection density (EPA D3bpo4). */
  ped_intersection_density: number | null;
  /** Total population used as weights. */
  population: number | null;
}

/** Metrics after national percentile normalization (0–100 each). */
export interface PaceNormalizedMetrics {
  ruca: number | null;
  density: number | null;
  ua_population: number | null;
  employment_density: number | null;
  walkability: number | null;
  ped_intersection_density: number | null;
}

export interface PaceScoreResult {
  score: number | null;
  category: PaceCategory | null;
  /** Distance from score to nearest category boundary (points). */
  confidence: number | null;
  complete: boolean;
  /** Whether auto-approve rules pass. */
  autoApprove: boolean;
  reviewReasons: string[];
  normalized: PaceNormalizedMetrics;
  factorScores: {
    ruca: number | null;
    density: number | null;
    ua_population: number | null;
    employment_density: number | null;
    built_form: number | null;
  };
}

export interface PaceGeography {
  scope: PaceScope;
  cbsaGeoid: string | null;
  placeGeoid: string | null;
  tractGeoids: string[];
  censusVintage: string;
  matchedName: string | null;
}

export interface PaceSourceMeta {
  versions: Record<string, string>;
  checksums: Record<string, string>;
}

/** One row in derived cbsa.json / place.json. */
export interface PaceDerivedUnit extends PaceRawMetrics {
  geoid: string;
  name?: string | null;
  /** Present on tract units: CBSA code when the tract falls in a CBSA. */
  cbsa?: string | null;
}

export interface PacePercentileBreaks {
  /** Sorted unique values after log1p + winsorize, used for empirical CDF. */
  density: number[];
  ua_population: number[];
  employment_density: number[];
  walkability: number[];
  ped_intersection_density: number[];
  /** Winsor bounds on the log1p scale (or raw for walkability). */
  winsor: {
    density: [number, number];
    ua_population: [number, number];
    employment_density: [number, number];
    walkability: [number, number];
    ped_intersection_density: [number, number];
  };
}

/** Place gazetteer centroid for geocoder fallback. */
export interface PacePlaceCentroid {
  geoid: string;
  name: string;
  state: string;
  lat: number;
  lon: number;
}

export interface PaceDerivedBundle {
  generated_at: string;
  algorithm_version: string;
  sources: PaceSourceMeta;
  percentiles: PacePercentileBreaks;
  cbsa: PaceDerivedUnit[];
  place: PaceDerivedUnit[];
  /** Keyed by `${lower(name)}|${state}` for centroid geocode fallback. */
  place_centroids?: Record<string, PacePlaceCentroid>;
  /** County FIPS (5-digit) → dominant CBSA, for special/zero-pop tracts. */
  county_cbsa?: Record<string, string>;
}
