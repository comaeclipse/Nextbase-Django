import type { PaceCategory } from "./types";

/** RUCA primary class (1–10) → urbanicity input score. */
export const RUCA_PRIMARY_SCORES: Record<number, number> = {
  1: 100,
  2: 85,
  3: 75,
  4: 60,
  5: 50,
  6: 45,
  7: 35,
  8: 30,
  9: 15,
  10: 5,
};

export function rucaPrimaryToScore(primary: number | null | undefined): number | null {
  if (primary == null || !Number.isFinite(primary)) return null;
  const key = Math.round(primary);
  return RUCA_PRIMARY_SCORES[key] ?? null;
}

/** Map a RUCA input score (or total score) onto a pace category band. */
export function scoreToCategory(score: number): PaceCategory {
  if (score < 25) return "rural";
  if (score < 50) return "small_town";
  if (score < 75) return "suburban";
  return "urban";
}

/** Category implied by a RUCA primary class alone. */
export function rucaPrimaryToCategory(
  primary: number | null | undefined
): PaceCategory | null {
  const score = rucaPrimaryToScore(primary);
  if (score === null) return null;
  return scoreToCategory(score);
}

const CATEGORY_ORDER: PaceCategory[] = [
  "rural",
  "small_town",
  "suburban",
  "urban",
];

export function categoryDistance(a: PaceCategory, b: PaceCategory): number {
  return Math.abs(CATEGORY_ORDER.indexOf(a) - CATEGORY_ORDER.indexOf(b));
}

/** Nearest category boundary distances for rural|25|small_town|50|suburban|75|urban. */
export function distanceToNearestBoundary(score: number): number {
  const boundaries = [25, 50, 75];
  return Math.min(...boundaries.map((b) => Math.abs(score - b)));
}
