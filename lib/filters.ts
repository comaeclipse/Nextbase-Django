/*
 * Filtering + sorting, ported from locations/views.py and extended with the
 * verified state-level veteran-benefit facets used by the Next.js explore UI.
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
  geography?: string | null;
  income_tax?: string | null;
  vibes?: string | null;
  /** Verified veteran-benefit state facets. Boolean facets match `=== true`. */
  no_income_tax?: string | null;
  retired_pay_tax?: string | null;
  disabled_vet_property_tax?: string | null;
  employment_preference?: string | null;
  education_benefit?: string | null;
  parks_benefit?: string | null;
  hunt_fish_benefit?: string | null;
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
  const category = loc.pace_category;
  if (category == null) return false;
  return types.includes(category);
}

function matchesHealthcare(loc: LocationRow, healthcareTypes: string): boolean {
  const types = splitTypes(healthcareTypes);
  if (types.length === 0) return true;
  for (const hc of types) {
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

function matchesGeography(loc: LocationRow, geographyTypes: string): boolean {
  const types = splitTypes(geographyTypes);
  if (types.length === 0) return true;
  return types.some((type) =>
    (type === "lake" && loc.near_lake === true) ||
    (type === "ocean" && loc.near_ocean === true) ||
    (type === "mountains" && loc.near_mountains === true)
  );
}

function matchesIncomeTax(loc: LocationRow, preference: string): boolean {
  const rate = parseNumber(loc.income_tax);
  if (rate === null) return false;
  return preference === "none" ? rate === 0 : preference === "low" ? rate > 0 && rate <= 4 : true;
}

function matchesVibes(loc: LocationRow, selectedVibes: string): boolean {
  const selected = splitTypes(selectedVibes);
  return selected.length === 0 || selected.some((vibe) => loc.vibes?.includes(vibe));
}

function inPriceRange(
  loc: LocationRow,
  priceMin: number | null,
  priceMax: number | null
): boolean {
  const price = locationHomeValue(loc);
  if (price === null) return true;
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
      const g = gas(a) - gas(b);
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
  // Benefit filters never consume an unverified row. The importer guarantees a
  // verified row also has source_url; vet_benefits_verified_on is the runtime gate.
  const verifiedBenefits = new Map(
    stateInfos
      .filter((s) => s.vet_benefits_verified_on != null)
      .map((s) => [s.state, s] as const)
  );
  const withVerifiedBenefit = (
    loc: LocationRow,
    predicate: (state: StateInfoRow) => boolean
  ) => {
    const state = verifiedBenefits.get(loc.state);
    return state != null && predicate(state);
  };

  let list = all.slice();

  if (p.snow === "zero") {
    list = list.filter((l) => l.snow_annual === 0 || l.snow_annual == null);
  } else if (p.snow === "some") {
    list = list.filter(
      (l) => l.snow_annual != null && l.snow_annual > 0 && l.snow_annual <= 20
    );
  } else if (p.snow === "lots") {
    list = list.filter((l) => l.snow_annual != null && l.snow_annual > 20);
  }

  if (p.no_awb === "true") list = list.filter((l) => !awbStates.has(l.state));
  if (p.no_hcm === "true") list = list.filter((l) => !hcmStates.has(l.state));

  if (p.state_filter) list = list.filter((l) => l.state === p.state_filter);

  if (p.cost_of_living) {
    const colMap: Record<string, string> = {
      low: "Low",
      moderate: "Moderate",
      high: "High",
    };
    const target = colMap[p.cost_of_living];
    if (target) list = list.filter((l) => l.cost_of_living === target);
  }

  if (p.climate) list = list.filter((l) => matchesClimate(l, p.climate!));

  const priceMin =
    p.price_min && /^\d+$/.test(p.price_min) ? parseInt(p.price_min, 10) : null;
  const priceMax =
    p.price_max && /^\d+$/.test(p.price_max) ? parseInt(p.price_max, 10) : null;
  if (priceMin || priceMax) {
    list = list.filter((l) => inPriceRange(l, priceMin, priceMax));
  }

  if (p.lifestyle) list = list.filter((l) => matchesLifestyle(l, p.lifestyle!));
  if (p.healthcare) list = list.filter((l) => matchesHealthcare(l, p.healthcare!));
  if (p.activities) list = list.filter((l) => matchesActivities(l, p.activities!));
  if (p.geography) list = list.filter((l) => matchesGeography(l, p.geography!));
  if (p.income_tax) list = list.filter((l) => matchesIncomeTax(l, p.income_tax!));
  if (p.vibes) list = list.filter((l) => matchesVibes(l, p.vibes!));
  if (p.lgbtq_friendly === "true") {
    list = list.filter((l) => {
      const s = parseLgbtqScore(l);
      return s !== null && s >= 70;
    });
  }

  // Verified state veteran-benefit filters. These intentionally use positive
  // equality for nullable booleans; NULL is never treated as false.
  if (p.no_income_tax === "true") {
    list = list.filter((l) =>
      withVerifiedBenefit(l, (s) => s.no_income_tax === true)
    );
  }
  if (p.retired_pay_tax) {
    const selected = splitTypes(p.retired_pay_tax);
    if (selected.length) {
      list = list.filter((l) =>
        withVerifiedBenefit(l, (s) =>
          selected.some((value) =>
            value === "untaxed"
              ? s.retired_pay_tax === "exempt" || s.retired_pay_tax === "no_income_tax"
              : s.retired_pay_tax === value
          )
        )
      );
    }
  }
  if (p.disabled_vet_property_tax === "true") {
    list = list.filter((l) =>
      withVerifiedBenefit(l, (s) => s.disabled_vet_property_tax === true)
    );
  }
  if (p.employment_preference === "true") {
    list = list.filter((l) =>
      withVerifiedBenefit(l, (s) => s.employment_preference === true)
    );
  }
  if (p.education_benefit === "true") {
    list = list.filter((l) =>
      withVerifiedBenefit(l, (s) => s.education_benefit === true)
    );
  }
  if (p.parks_benefit === "true") {
    list = list.filter((l) =>
      withVerifiedBenefit(l, (s) => s.parks_benefit === true)
    );
  }
  if (p.hunt_fish_benefit === "true") {
    list = list.filter((l) =>
      withVerifiedBenefit(l, (s) => s.hunt_fish_benefit === true)
    );
  }

  if (p.employers) {
    const slugs = splitTypes(p.employers);
    if (slugs.length > 0) {
      const index = employerIndex ?? {};
      list = list.filter((l) => matchesEmployers(index[l.id], slugs));
    }
  }

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
