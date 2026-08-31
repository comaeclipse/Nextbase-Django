import { describe, expect, it } from "vitest";
import {
  calculatePersonalizedBreakdown,
  calculatePersonalizedScore,
  type PersonalizedWeights,
} from "./scoring";
import type { LocationRow, StateInfoRow } from "./types";

// Only the columns the per-factor scorers actually read; the rest of LocationRow
// is irrelevant to scoring, so a focused cast keeps the fixture legible.
function loc(): LocationRow {
  return {
    has_va: true, // scoreVaAccess -> 100
    col_index: 95, // scoreCostOfLiving -> 85
    avg_home_value: "300000", // scoreHomeValue -> 85
    crime: "B", // scoreSafety -> 82
    lgbtq_rating: "60", // parseLgbtqScore -> 60
  } as unknown as LocationRow;
}

// gifford "F", no bans -> scoreGunRights -> 95
const stateInfo = { gifford_score: "F" } as unknown as StateInfoRow;

const EQUAL: PersonalizedWeights = {
  va: 1, costOfLiving: 1, homeValue: 1, safety: 1, lgbtq: 1, gunRights: 1,
};

describe("calculatePersonalizedScore", () => {
  it("averages all six factors under equal weights", () => {
    // (100 + 85 + 85 + 82 + 60 + 95) / 6 = 84.5 -> banker's round -> 84
    expect(calculatePersonalizedScore(loc(), stateInfo, EQUAL)).toBe(84);
  });

  it("collapses to a single factor when only it is weighted", () => {
    const onlyVa: PersonalizedWeights = { ...EQUAL, va: 1, costOfLiving: 0, homeValue: 0, safety: 0, lgbtq: 0, gunRights: 0 };
    expect(calculatePersonalizedScore(loc(), stateInfo, onlyVa)).toBe(100);
  });

  it("falls back to equal weighting when every weight is 0", () => {
    const zero: PersonalizedWeights = { va: 0, costOfLiving: 0, homeValue: 0, safety: 0, lgbtq: 0, gunRights: 0 };
    expect(calculatePersonalizedScore(loc(), stateInfo, zero)).toBe(
      calculatePersonalizedScore(loc(), stateInfo, EQUAL)
    );
  });
});

describe("calculatePersonalizedBreakdown", () => {
  it("returns the six factors in the /quiz2 display order with their scores", () => {
    const rows = calculatePersonalizedBreakdown(loc(), stateInfo, EQUAL);
    expect(rows.map((r) => r.key)).toEqual([
      "va", "costOfLiving", "homeValue", "safety", "lgbtq", "gunRights",
    ]);
    expect(rows.map((r) => r.score)).toEqual([100, 85, 85, 82, 60, 95]);
  });

  it("shares sum to ~100 and reflect the weights", () => {
    const weights: PersonalizedWeights = { ...EQUAL, va: 80, costOfLiving: 20, homeValue: 0, safety: 0, lgbtq: 0, gunRights: 0 };
    const rows = calculatePersonalizedBreakdown(loc(), stateInfo, weights);
    const byKey = Object.fromEntries(rows.map((r) => [r.key, r.weightShare]));
    expect(byKey.va).toBe(80);
    expect(byKey.costOfLiving).toBe(20);
    expect(byKey.homeValue).toBe(0);
    const total = rows.reduce((s, r) => s + r.weightShare, 0);
    expect(Math.abs(total - 100)).toBeLessThanOrEqual(1);
  });

  it("splits shares evenly when all weights are 0", () => {
    const zero: PersonalizedWeights = { va: 0, costOfLiving: 0, homeValue: 0, safety: 0, lgbtq: 0, gunRights: 0 };
    const rows = calculatePersonalizedBreakdown(loc(), stateInfo, zero);
    // 100 / 6 -> 17 rounded, for every factor.
    expect(rows.every((r) => r.weightShare === 17)).toBe(true);
  });
});
