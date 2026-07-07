/*
 * Editorial "Fit" scoring, ported 1:1 from locations/views.py.
 * This is the single shared implementation used by /explore, /api/locations,
 * /city/[id], and the parity tests — matching the current Django behavior.
 *
 * Keep this file in lockstep with views.py until Django is removed.
 */
import type { LocationRow } from "./types";

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
