/*
 * Filtering + sorting, ported 1:1 from locations/views.py (filter_locations and
 * the location_matches_* helpers). Shared by /api/locations and tests so the
 * results match the current Django behavior exactly.
 */
import type { LocationRow, StateInfoRow, Location } from "./types";
import {
  hasDefenseEmployerSignal,
  matchesEmployers,
  type EmployerIndex,
} from "./defense";
import {
  isServiceBranchSlug,
  matchesNearBase,
  parseBaseMaxDistance,
  type MilitaryProximityIndex,
} from "./military";
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
  /*
   * Veteran-benefit facets, sourced from `locations_stateinfo` (state-level).
   * The booleans accept only the literal string "true" and match a state whose
   * verified column IS TRUE — never `= false`, because these columns are
   * three-valued (NULL = "source summary was silent", not "benefit absent";
   * issue #6). Only rows with `vet_benefits_verified_on` set are eligible.
   */
  no_income_tax?: string | null;
  disabled_vet_property_tax?: string | null;
  employment_preference?: string | null;
  education_benefit?: string | null;
  parks_benefit?: string | null;
  hunt_fish_benefit?: string | null;
  /**
   * Comma-separated `retired_pay_tax` enum values to include (OR within the
   * facet), e.g. "no_income_tax,exempt" = "military retired pay isn't taxed
   * here". Only verified rows match.
   */
  retired_pay_tax?: string | null;
  vibes?: string | null;
  /** Comma-separated employer slugs; OR within the facet, AND against the rest. */
  employers?: string | null;
  /**
   * Physical defense-employer presence. Independent of `near_base` and of
   * `defense_hub` (which also includes manually designated base towns).
   */
  defense_ecosystem?: string | null;
  /**
   * Near a military installation. Independent of `employers` and `defense_hub`.
   * Set to "true", or implied when `base_max_distance` / `base_branch` is set.
   */
  near_base?: string | null;
  /** Comma-separated branch slugs: army, navy, air_force, marine_corps. */
  base_branch?: string | null;
  /** Predefined band in miles: 25, 50, or 100. Defaults to 50. */
  base_max_distance?: string | null;
  has_walmart?: string | null;
  has_costco?: string | null;
  sort?: string | null;
}

export interface FilterOptions {
  scoreFn?: (loc: LocationRow) => number;
  /** Required when `employers` or `defense_ecosystem` is set. */
  employerIndex?: EmployerIndex;
  /** Required only when the near_base facet is set. */
  militaryIndex?: MilitaryProximityIndex;
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

/**
 * Local/nearby outpatient-capable VA access. Medical centers count: a VAMC
 * provides outpatient care, so `va_clinic` must not exclude them.
 */
function hasVaOutpatientAccess(loc: LocationRow): boolean {
  return loc.has_va === true;
}

/**
 * Nearby VA medical-center access. `has_va` is the existing nearby gate;
 * `nearest_va_kind` (or, before that column is backfilled, name equality with
 * `nearest_va_hospital`) is what makes this different from outpatient access.
 * A named hospital 80 miles away does not satisfy this — almost every city
 * has `nearest_va_hospital` filled.
 */
function hasVaHospitalAccess(loc: LocationRow): boolean {
  if (loc.has_va !== true) return false;
  if (loc.nearest_va_kind === "hospital") return true;
  return (
    loc.nearest_va_hospital != null && loc.nearest_va === loc.nearest_va_hospital
  );
}

function matchesHealthcare(loc: LocationRow, healthcareTypes: string): boolean {
  const types = splitTypes(healthcareTypes);
  if (types.length === 0) return true;
  for (const hc of types) {
    if (hc === "va_hospital" && hasVaHospitalAccess(loc)) return true;
    if (hc === "va_clinic" && hasVaOutpatientAccess(loc)) return true;
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
  const { scoreFn = calculateBaselineScore, employerIndex, militaryIndex } =
    options;
  const awbStates = new Set(
    stateInfos.filter((s) => s.assault_weapons_ban).map((s) => s.state)
  );
  const hcmStates = new Set(
    stateInfos.filter((s) => s.high_cap_mag_ban).map((s) => s.state)
  );
  const stateByAbbr = new Map(stateInfos.map((s) => [s.state, s]));

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
  if (p.geography) list = list.filter((l) => matchesGeography(l, p.geography!));
  if (p.income_tax) list = list.filter((l) => matchesIncomeTax(l, p.income_tax!));

  // Veteran-benefit facets (state-level, from locations_stateinfo). Three-valued
  // booleans: match only explicit `true` — a NULL means the source summary was
  // silent about the benefit, not that the state lacks it (issue #6). Only rows
  // a human has verified (`vet_benefits_verified_on` set) are eligible, so an
  // unverified state never drives a user-facing filter.
  const vetBooleanFilters: [
    string | null | undefined,
    (s: StateInfoRow) => boolean | null
  ][] = [
    [p.no_income_tax, (s) => s.no_income_tax],
    [p.disabled_vet_property_tax, (s) => s.disabled_vet_property_tax],
    [p.employment_preference, (s) => s.employment_preference],
    [p.education_benefit, (s) => s.education_benefit],
    [p.parks_benefit, (s) => s.parks_benefit],
    [p.hunt_fish_benefit, (s) => s.hunt_fish_benefit],
  ];
  for (const [flag, pick] of vetBooleanFilters) {
    if (flag === "true") {
      list = list.filter((l) => {
        const s = stateByAbbr.get(l.state);
        return s != null && s.vet_benefits_verified_on != null && pick(s) === true;
      });
    }
  }

  // Military retired-pay tax treatment. Comma-separated enum values to include
  // (OR within the facet); e.g. "no_income_tax,exempt" answers "military retired
  // pay isn't taxed here". Only verified rows match.
  if (p.retired_pay_tax) {
    const wanted = new Set(splitTypes(p.retired_pay_tax));
    if (wanted.size > 0) {
      list = list.filter((l) => {
        const s = stateByAbbr.get(l.state);
        return (
          s != null &&
          s.vet_benefits_verified_on != null &&
          s.retired_pay_tax != null &&
          wanted.has(s.retired_pay_tax)
        );
      });
    }
  }

  if (p.vibes) list = list.filter((l) => matchesVibes(l, p.vibes!));
  if (p.lgbtq_friendly === "true") {
    list = list.filter((l) => {
      const s = parseLgbtqScore(l);
      return s !== null && s >= 70;
    });
  }

  // Near a military installation. Independent of defense_hub / employer presence.
  const nearBaseActive =
    p.near_base === "true" || Boolean(p.base_max_distance) || Boolean(p.base_branch);
  if (nearBaseActive) {
    const branches = p.base_branch
      ? splitTypes(p.base_branch).filter(isServiceBranchSlug)
      : [];
    const maxDistance = parseBaseMaxDistance(p.base_max_distance);
    const index = militaryIndex ?? {};
    list = list.filter((l) =>
      matchesNearBase(index[l.id], {
        maxDistance,
        branches: branches.length > 0 ? branches : undefined,
      })
    );
  }

  // Physical defense-employer presence. Not `defense_hub`: that flag also
  // includes manually designated base towns with no contractor plant.
  if (p.defense_ecosystem === "true") {
    const index = employerIndex ?? {};
    list = list.filter((l) => hasDefenseEmployerSignal(index[l.id]));
  }

  // Specific-employer presence. Any nonzero posting count (incl. remote) matches
  // this facet; the onsite+hybrid presence rule gates only defense_ecosystem /
  // the defense_hub column.
  if (p.employers) {
    const slugs = splitTypes(p.employers);
    if (slugs.length > 0) {
      const index = employerIndex ?? {};
      list = list.filter((l) => matchesEmployers(index[l.id], slugs));
    }
  }

  if (p.has_walmart === "true") {
    list = list.filter((l) => l.has_walmart === true);
  }
  if (p.has_costco === "true") {
    list = list.filter((l) => l.has_costco === true);
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
