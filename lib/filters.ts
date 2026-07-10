/*
 * Filtering + sorting, ported 1:1 from locations/views.py (filter_locations and
 * the location_matches_* helpers). Shared by /api/locations and tests so the
 * results match the current Django behavior exactly.
 */
import type { LocationRow, StateInfoRow, Location } from "./types";
import { matchesEmployers, type EmployerIndex } from "./defense";
import {
  parseNumber,
  locationHomeValue,
  parseLgbtqScore,
  calculateBaselineScore,
} from "./scoring";

export interface FilterParams {
  snow?: string | null;
  no_awb?: string | null;
  no_hcm?: string | null;
  state_filter?: string | null;
  lgbtq_friendly?: string | null;
  climate?: string | null;
  cost_of_living?: string | null;
  price_min?: string | null;
  price_max?: string | null;
  lifestyle?: string | null;
  healthcare?: string | null;
  activities?: string | null;
  /** Comma-separated employer slugs; OR within the facet, AND against the rest. */
  employers?: string | null;
  sort?: string | null;
}

export interface FilterOptions {
  scoreFn?: (loc: LocationRow) => number;
  /** Required only when `employers` is set. */
  employerIndex?: EmployerIndex;
}

function splitTypes(value: string): string[] {
  return value
    .split(",")
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
}

/** Compare strings by code point (matches Python str comparison for ASCII). */
function strCmp(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

function matchesClimate(loc: LocationRow, climateTypes: string): boolean {
  const types = splitTypes(climateTypes);
  if (types.length === 0) return true;
  return loc.climate_category !== null && types.includes(loc.climate_category);
}

function matchesLifestyle(loc: LocationRow, lifestyleTypes: string): boolean {
  const types = splitTypes(lifestyleTypes);
  if (types.length === 0) return true;
  const density = loc.density;
  if (density === null || density === undefined) return false;
  for (const lifestyle of types) {
    if (lifestyle === "urban" && density > 3000) return true;
    if (lifestyle === "suburban" && density >= 1000 && density <= 3000)
      return true;
    if (lifestyle === "rural" && density < 1000) return true;
  }
  return false;
}

function matchesHealthcare(loc: LocationRow, healthcareTypes: string): boolean {
  const types = splitTypes(healthcareTypes);
  if (types.length === 0) return true;
  for (const hc of types) {
    // Only a single "has a local VA facility" signal is tracked, so both the
    // hospital and clinic options resolve to it.
    if ((hc === "va_hospital" || hc === "va_clinic") && loc.has_va) return true;
  }
  return false;
}

const ACTIVITY_MAPPINGS: Record<string, string[]> = {
  golf: ["golf", "golfing"],
  fishing: ["fishing", "fish"],
  hiking: ["hiking", "hike", "trails"],
  culture: ["arts", "culture", "arts & culture", "museums", "theater"],
};

function matchesActivities(loc: LocationRow, activityTypes: string): boolean {
  const types = splitTypes(activityTypes).map((t) => t.toLowerCase());
  if (types.length === 0) return true;
  let tags = loc.tags ?? [];
  if (typeof tags === "string") tags = [tags];
  const tagsLower = tags.map((t) => String(t).toLowerCase());
  for (const activity of types) {
    const searchTerms = ACTIVITY_MAPPINGS[activity] ?? [activity];
    for (const term of searchTerms) {
      if (tagsLower.some((tag) => tag.includes(term))) return true;
    }
  }
  return false;
}

function inPriceRange(
  loc: LocationRow,
  priceMin: number | null,
  priceMax: number | null
): boolean {
  const price = locationHomeValue(loc);
  if (price === null) return true; // include locations without price data
  if (priceMin && price < priceMin * 1000) return false;
  if (priceMax && price > priceMax * 1000) return false;
  return true;
}

function sortList(list: Location[], sort: string): void {
  if (sort === "best") {
    list.sort(
      (a, b) =>
        b.calculated_match_score - a.calculated_match_score ||
        strCmp(a.name, b.name)
    );
  } else if (sort === "cost_asc" || sort === "cost_desc") {
    // Python's sort(key=(cost_order, name), reverse=...). For reverse=True we
    // negate the comparison rather than reverse() the list, so fully-equal keys
    // (same-named, same-cost cities) keep their original order — exactly as
    // Python's stable reverse sort does.
    const costOrder: Record<string, number> = { Low: 0, Moderate: 1, High: 2 };
    const co = (l: Location) => costOrder[l.cost_of_living] ?? 1;
    const dir = sort === "cost_desc" ? -1 : 1;
    list.sort(
      (a, b) => dir * (co(a) - co(b)) || dir * strCmp(a.name, b.name)
    );
  } else if (sort === "climate") {
    list.sort(
      (a, b) =>
        strCmp(a.climate || "", b.climate || "") || strCmp(a.name, b.name)
    );
  } else if (sort === "va") {
    const vaRank = (l: Location) => (l.has_va ? 0 : 1);
    const dist = (l: Location) => parseNumber(l.distance_to_va) || Infinity;
    list.sort(
      (a, b) =>
        vaRank(a) - vaRank(b) || dist(a) - dist(b) || strCmp(a.name, b.name)
    );
  } else if (sort === "gas_asc" || sort === "gas_desc") {
    const gas = (l: Location) => parseNumber(l.gas_price) || Infinity;
    const dir = sort === "gas_desc" ? -1 : 1;
    list.sort((a, b) => {
      const g = gas(a) - gas(b); // Infinity - Infinity === NaN -> fall through
      return (Number.isNaN(g) ? 0 : dir * g) || dir * strCmp(a.name, b.name);
    });
  }
}

export function filterAndSort(
  all: LocationRow[],
  stateInfos: StateInfoRow[],
  p: FilterParams,
  options: FilterOptions = {}
): Location[] {
  const { scoreFn = calculateBaselineScore, employerIndex } = options;
  const awbStates = new Set(
    stateInfos.filter((s) => s.assault_weapons_ban).map((s) => s.state)
  );
  const hcmStates = new Set(
    stateInfos.filter((s) => s.high_cap_mag_ban).map((s) => s.state)
  );

  let list = all.slice();

  // Snow (DB-level in Django)
  if (p.snow === "zero") {
    list = list.filter((l) => l.snow_annual === 0 || l.snow_annual == null);
  } else if (p.snow === "some") {
    list = list.filter(
      (l) => l.snow_annual != null && l.snow_annual > 0 && l.snow_annual <= 20
    );
  } else if (p.snow === "lots") {
    list = list.filter((l) => l.snow_annual != null && l.snow_annual > 20);
  }

  // AWB / High-Cap Mag exclusions
  if (p.no_awb === "true") list = list.filter((l) => !awbStates.has(l.state));
  if (p.no_hcm === "true") list = list.filter((l) => !hcmStates.has(l.state));

  // Map state filter
  if (p.state_filter) list = list.filter((l) => l.state === p.state_filter);

  // Cost of living
  if (p.cost_of_living) {
    const colMap: Record<string, string> = {
      low: "Low",
      moderate: "Moderate",
      high: "High",
    };
    const target = colMap[p.cost_of_living];
    if (target) list = list.filter((l) => l.cost_of_living === target);
  }

  // Python-side filters
  if (p.climate) list = list.filter((l) => matchesClimate(l, p.climate!));

  const priceMin =
    p.price_min && /^\d+$/.test(p.price_min) ? parseInt(p.price_min, 10) : null;
  const priceMax =
    p.price_max && /^\d+$/.test(p.price_max) ? parseInt(p.price_max, 10) : null;
  if (priceMin || priceMax) {
    list = list.filter((l) => inPriceRange(l, priceMin, priceMax));
  }

  if (p.lifestyle) list = list.filter((l) => matchesLifestyle(l, p.lifestyle!));
  if (p.healthcare) {
    list = list.filter((l) => matchesHealthcare(l, p.healthcare!));
  }
  if (p.activities) {
    list = list.filter((l) => matchesActivities(l, p.activities!));
  }
  if (p.lgbtq_friendly === "true") {
    list = list.filter((l) => {
      const s = parseLgbtqScore(l);
      return s !== null && s >= 70;
    });
  }

  // Defense-employer presence. Any nonzero posting count counts here; the
  // DEFENSE_HUB_MIN_POSTINGS threshold gates only the defense_hub promotion.
  if (p.employers) {
    const slugs = splitTypes(p.employers);
    if (slugs.length > 0) {
      const index = employerIndex ?? {};
      list = list.filter((l) => matchesEmployers(index[l.id], slugs));
    }
  }

  // Scores + sorting
  const scored: Location[] = list.map((l) => ({
    ...l,
    calculated_match_score: scoreFn(l),
  }));
  sortList(scored, p.sort || "best");
  return scored;
}

/** State -> location count over the full (unfiltered) set, for the map. */
export function computeStateCounts(all: LocationRow[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const loc of all) {
    counts[loc.state] = (counts[loc.state] ?? 0) + 1;
  }
  return counts;
}
