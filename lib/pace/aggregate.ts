import { rucaPrimaryToScore } from "./ruca";
import type { PaceRawMetrics } from "./types";

export interface WeightedUnit {
  population: number;
  ruca_primary: number | null;
  density: number | null;
  ua_population: number | null;
  employment_density: number | null;
  walkability: number | null;
  ped_intersection_density: number | null;
}

function weightedMean(
  units: WeightedUnit[],
  pick: (u: WeightedUnit) => number | null
): number | null {
  let num = 0;
  let den = 0;
  for (const u of units) {
    const v = pick(u);
    const w = u.population;
    if (v == null || !Number.isFinite(v) || !(w > 0)) continue;
    num += v * w;
    den += w;
  }
  return den > 0 ? num / den : null;
}

/**
 * Population-weighted aggregation of tract/BG units into one geography.
 * RUCA score uses the mapped primary-class scores; ua_population takes the
 * max urban-area population observed in the geography (largest connected UA).
 */
export function aggregateUnits(units: WeightedUnit[]): PaceRawMetrics {
  const withPop = units.filter((u) => u.population > 0);
  const population = withPop.reduce((s, u) => s + u.population, 0) || null;

  const ruca_primary_mean = weightedMean(withPop, (u) => u.ruca_primary);
  const ruca_primary =
    ruca_primary_mean != null ? Math.round(ruca_primary_mean) : null;

  const ruca_score = weightedMean(withPop, (u) =>
    rucaPrimaryToScore(u.ruca_primary)
  );

  let ua_population: number | null = null;
  for (const u of withPop) {
    if (u.ua_population != null && Number.isFinite(u.ua_population)) {
      ua_population =
        ua_population == null
          ? u.ua_population
          : Math.max(ua_population, u.ua_population);
    }
  }

  return {
    ruca_score,
    ruca_primary,
    density: weightedMean(withPop, (u) => u.density),
    ua_population,
    employment_density: weightedMean(withPop, (u) => u.employment_density),
    walkability: weightedMean(withPop, (u) => u.walkability),
    ped_intersection_density: weightedMean(
      withPop,
      (u) => u.ped_intersection_density
    ),
    population,
  };
}
