/*
 * Editorial "Fit" scoring, ported 1:1 from locations/views.py.
 * This is the single shared implementation used by /explore, /api/locations,
 * /city/[id], and the parity tests — matching the current Django behavior.
 *
 * Keep this file in lockstep with views.py until Django is removed.
 */
import type { LocationRow, StateInfoRow } from "./types";

/** Extract the first numeric value from a string like "$385k", "3 miles". */
export function parseNumber(value: unknown): number | null {
  // Mirrors Python's `if not value: return None` (0, "", null, undefined → None).
  if (!value) return null;
  const m = String(value).match(/\d+(?:\.\d+)?/);
  return m ? parseFloat(m[0]) : null;
}

/**
 * Round half to even ("banker's rounding"), matching Python 3's built-in
 * round(). Only differs from a naive round at exact .5 boundaries, but the
 * weighted Fit averages can land there, so we replicate it for parity.
 */
function pyRound(x: number): number {
  const floor = Math.floor(x);
  const diff = x - floor;
  if (diff < 0.5) return floor;
  if (diff > 0.5) return floor + 1;
  return floor % 2 === 0 ? floor : floor + 1; // exactly .5 → nearest even
}

/** Clamp a numeric score to the 0-100 range (int(round(value))). */
export function clampScore(value: number): number {
  return Math.max(0, Math.min(100, pyRound(value)));
}

/** Parse the stored 0-100 LGBTQ friendliness score. */
export function parseLgbtqScore(loc: LocationRow): number | null {
  const score = parseNumber(loc.lgbtq_rating);
  if (score === null) return null;
  return clampScore(score);
}

/** Score access to VA care based on local facility and distance. */
export function scoreVaAccess(loc: LocationRow): number {
  if (loc.has_va) return 100;
  const distance = parseNumber(loc.distance_to_va);
  if (distance === null) return 50;
  if (distance <= 5) return 95;
  if (distance <= 15) return 80;
  if (distance <= 30) return 65;
  if (distance <= 60) return 45;
  return 25;
}

/** Score affordability from COL index, falling back to the app category. */
export function scoreCostOfLiving(loc: LocationRow): number {
  if (loc.col_index !== null && loc.col_index !== undefined) {
    if (loc.col_index <= 90) return 100;
    if (loc.col_index <= 100) return 85;
    if (loc.col_index <= 110) return 70;
    if (loc.col_index <= 125) return 50;
    return 30;
  }
  const map: Record<string, number> = { low: 90, moderate: 65, high: 35 };
  const key = (loc.cost_of_living || "").toLowerCase();
  return key in map ? map[key] : 60;
}

/** Return the location's home value in dollars, or null if unavailable. */
export function locationHomeValue(loc: LocationRow): number | null {
  if (loc.avg_home_value !== null && loc.avg_home_value !== undefined) {
    return parseFloat(loc.avg_home_value);
  }
  const parsed = parseNumber(loc.avg_home_value_display);
  if (parsed === null) return null;
  // Display values under 10k are shorthand thousands (e.g. "385" == $385k).
  return parsed < 10000 ? parsed * 1000 : parsed;
}

/** Score home affordability using numeric or display home values. */
export function scoreHomeValue(loc: LocationRow): number {
  const price = locationHomeValue(loc);
  if (price === null) return 60;
  if (price <= 250000) return 100;
  if (price <= 350000) return 85;
  if (price <= 450000) return 70;
  if (price <= 600000) return 50;
  return 30;
}

const GRADE_SCORES: Record<string, number> = {
  "A+": 100, A: 96, "A-": 92,
  "B+": 88, B: 82, "B-": 76,
  "C+": 70, C: 62, "C-": 54,
  "D+": 48, D: 42, "D-": 36,
  F: 20,
};

/** Map the letter crime grade (A+..F) to a 0-100 safety score, or null. */
export function scoreCrimeGrade(loc: LocationRow): number | null {
  if (!loc.crime) return null;
  const grade = loc.crime.trim().toUpperCase();
  if (grade in GRADE_SCORES) return GRADE_SCORES[grade];
  // Legacy free-text values (e.g. "Low") used before letter grades.
  const legacy: Record<string, number> = { low: 90, moderate: 60, high: 30 };
  const key = grade.toLowerCase();
  return key in legacy ? legacy[key] : null;
}

/** Score safety from the crime grade, falling back to neutral when absent. */
export function scoreSafety(loc: LocationRow): number {
  const gradeScore = scoreCrimeGrade(loc);
  return gradeScore !== null ? gradeScore : 60;
}

/**
 * Rank retirement fit using the explore-page factors. Fixed editorial score,
 * identical for every visitor. Five equally-weighted (20%) factors.
 */
export function calculateBaselineScore(loc: LocationRow): number {
  let lgbtqScore = parseLgbtqScore(loc);
  if (lgbtqScore === null) lgbtqScore = 50;

  const weighted =
    lgbtqScore * 0.2 +
    scoreVaAccess(loc) * 0.2 +
    scoreCostOfLiving(loc) * 0.2 +
    scoreHomeValue(loc) * 0.2 +
    scoreSafety(loc) * 0.2;
  return clampScore(weighted);
}

export interface FitFactor {
  key: string;
  label: string;
  score: number;
}

/** The five equally-weighted factors behind the baseline Fit score. */
export function calculateFitBreakdown(loc: LocationRow): FitFactor[] {
  let lgbtqScore = parseLgbtqScore(loc);
  if (lgbtqScore === null) lgbtqScore = 50;

  return [
    { key: "affordability", label: "Home Affordability", score: scoreHomeValue(loc) },
    { key: "cost", label: "Cost of Living", score: scoreCostOfLiving(loc) },
    { key: "va", label: "VA Access", score: scoreVaAccess(loc) },
    { key: "safety", label: "Safety", score: scoreSafety(loc) },
    { key: "inclusivity", label: "LGBTQ Friendliness", score: lgbtqScore },
  ];
}

/*
 * Quiz/profile-driven personalized scoring. New for the /quiz feature (not
 * ported from Django) — layered on top of the same per-factor scorers used
 * by the baseline Fit score, so it stays consistent with the editorial
 * scoring model while letting a visitor's stated priorities reweight it.
 */

// Giffords Law Center grades measure the *strength of gun control* (A = most
// restrictive, F = least). Gun-rights friendliness is the inverse of that.
const GIFFORDS_GUN_RIGHTS_SCORE: Record<string, number> = {
  "A+": 5, A: 10, "A-": 15,
  "B+": 25, B: 35, "B-": 45,
  "C+": 55, C: 62, "C-": 68,
  "D+": 75, D: 80, "D-": 85,
  F: 95,
};

/** Score a state's gun-rights friendliness 0-100 from Giffords grade + bans. */
export function scoreGunRights(stateInfo: StateInfoRow | null | undefined): number {
  if (!stateInfo) return 50;
  let score = 60; // neutral-permissive baseline when no Giffords grade on file
  const grade = stateInfo.gifford_score?.trim().toUpperCase();
  if (grade && grade in GIFFORDS_GUN_RIGHTS_SCORE) {
    score = GIFFORDS_GUN_RIGHTS_SCORE[grade];
  }
  if (stateInfo.assault_weapons_ban) score -= 10;
  if (stateInfo.high_cap_mag_ban) score -= 8;
  return clampScore(score);
}

/** Normalized 0-1 importance weights collected from the quiz. */
export interface PersonalizedWeights {
  lgbtq: number;
  va: number;
  costOfLiving: number;
  homeValue: number;
  safety: number;
  gunRights: number;
}

type PersonalizedKey = keyof PersonalizedWeights;

/** The six per-factor 0-100 scores that feed the personalized composite. */
function personalizedFactorScores(
  loc: LocationRow,
  stateInfo: StateInfoRow | null | undefined
): PersonalizedWeights {
  let lgbtqScore = parseLgbtqScore(loc);
  if (lgbtqScore === null) lgbtqScore = 50;
  return {
    lgbtq: lgbtqScore,
    va: scoreVaAccess(loc),
    costOfLiving: scoreCostOfLiving(loc),
    homeValue: scoreHomeValue(loc),
    safety: scoreSafety(loc),
    gunRights: scoreGunRights(stateInfo),
  };
}

/**
 * Each factor's share of the final score as a fraction summing to 1. Mirrors
 * the fallback in calculatePersonalizedScore: an all-zero profile degenerates
 * to equal weighting rather than dividing by zero.
 */
function normalizedWeightShares(
  weights: PersonalizedWeights
): PersonalizedWeights {
  const keys = Object.keys(weights) as PersonalizedKey[];
  const total = keys.reduce((sum, k) => sum + (weights[k] || 0), 0);
  const shares = {} as PersonalizedWeights;
  for (const k of keys) {
    shares[k] = total > 0 ? (weights[k] || 0) / total : 1 / keys.length;
  }
  return shares;
}

/**
 * Rank retirement fit using the visitor's quiz-derived importance weights
 * instead of the fixed 20%-each baseline. Falls back to equal weighting if
 * every weight is 0, so it never divides by zero or degenerates.
 */
export function calculatePersonalizedScore(
  loc: LocationRow,
  stateInfo: StateInfoRow | null | undefined,
  weights: PersonalizedWeights
): number {
  const factors = personalizedFactorScores(loc, stateInfo);
  const shares = normalizedWeightShares(weights);
  const keys = Object.keys(factors) as PersonalizedKey[];
  const weighted = keys.reduce((sum, k) => sum + factors[k] * shares[k], 0);
  return clampScore(weighted);
}

/** Display order + labels for the personalized breakdown (matches /quiz2). */
const PERSONALIZED_FACTOR_LABELS: { key: PersonalizedKey; label: string }[] = [
  { key: "va", label: "VA Access" },
  { key: "costOfLiving", label: "Cost of Living" },
  { key: "homeValue", label: "Home Affordability" },
  { key: "safety", label: "Safety" },
  { key: "lgbtq", label: "LGBTQ Friendliness" },
  { key: "gunRights", label: "Gun Rights" },
];

export interface PersonalizedFitFactor extends FitFactor {
  /** This factor's share of the final weighted score, as a whole percent. */
  weightShare: number;
}

/**
 * The six factors behind a personalized Fit score, each with its raw 0-100
 * score and the share of the final number it accounts for given the visitor's
 * weights. Shares use the same normalization as calculatePersonalizedScore, so
 * the breakdown the rail draws always explains the ring it sits under.
 */
export function calculatePersonalizedBreakdown(
  loc: LocationRow,
  stateInfo: StateInfoRow | null | undefined,
  weights: PersonalizedWeights
): PersonalizedFitFactor[] {
  const factors = personalizedFactorScores(loc, stateInfo);
  const shares = normalizedWeightShares(weights);
  return PERSONALIZED_FACTOR_LABELS.map(({ key, label }) => ({
    key,
    label,
    score: clampScore(factors[key]),
    weightShare: Math.round(shares[key] * 100),
  }));
}

export type CrimeTone = "good" | "warn" | "bad" | "neutral";

/** Return [grade, tone] for the crime letter grade, or [null, null]. */
export function crimeGradeMeta(loc: LocationRow): [string, CrimeTone] | [null, null] {
  if (!loc.crime) return [null, null];
  const grade = loc.crime.trim().toUpperCase();
  const letter = grade[0];
  const toneMap: Record<string, CrimeTone> = {
    A: "good", B: "good", C: "warn", D: "bad", F: "bad",
  };
  const tone = toneMap[letter] ?? "neutral";
  return [grade, tone];
}
