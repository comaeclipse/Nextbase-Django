/*
 * Reusable query layer for the two products, callable from an API route (the
 * chatbot) as well as the CLI tools. The ranking logic is ported verbatim from
 * scripts/tools/find-similar-locations.ts and scripts/tools/match-profile.ts;
 * see those files for WHY similarity is conjunctive and matching is worst-driven.
 *
 * Everything returned here is plain JSON so it can be handed straight to an LLM
 * tool result.
 */
import { getSql } from "../../lib/db";
import { FEATURES, getFeature, isFeatureKey } from "./ontology";
import { parsePopulation } from "./derive";
import { resolveCostConstants } from "../../lib/cost-constants";
import { resolveTaxConstants, type ResolvedTaxConstants } from "../../lib/tax-constants";
import {
  rankByHeadroom,
  rankByBudget,
  type Band,
  type CostEstimate,
  type CostInputs,
  type HealthCoverage,
  type SpendingProfile,
  type Tenure,
} from "../../lib/affordability";
import { DEFAULT_SPENDING_PROFILE } from "../../lib/cost-constants";
import {
  isStateTaxIrrelevant,
  type FilingStatus,
  type IncomeSource,
  type NetIncomeEstimate,
} from "../../lib/income";
import { getGasPrices } from "../../lib/gas-prices";
import { STATE_NAME_TO_ABBR, resolveStateAbbr } from "../../lib/states";
import { STATE_GUN_FREEDOM_DATASET } from "../../lib/state-gun-freedom";
import type { RetiredPayTax } from "../../lib/types";

/** Only features that can exist for an unresearched city are comparable. */
const COMPARABLE = new Set(
  FEATURES.filter((f) => f.derivation !== "editorial").map((f) => f.key)
);
const DIVERGENCE_THRESHOLD = 0.3;

type Vector = Map<string, { value: number; confidence: number }>;

export interface SimilarDivergence {
  feature: string;
  label: string;
  anchorValue: number;
  otherValue: number;
  diff: number;
}
export interface SimilarCity {
  city: string;
  population: number | null;
  overall: number;
  weakestCategory: string;
  weakestScore: number;
  divergences: SimilarDivergence[];
}
export interface SimilarResult {
  anchor: string;
  ranked: SimilarCity[];
}

interface CompareProfile {
  overall: number;
  byCategory: Map<string, number>;
  weakest: { category: string; score: number };
  divergences: { feature: string; a: number; b: number; diff: number }[];
}

function compare(a: Vector, b: Vector): CompareProfile | null {
  const buckets = new Map<string, { sum: number; weight: number }>();
  const divergences: CompareProfile["divergences"] = [];
  let allSum = 0;
  let allWeight = 0;

  for (const [key, x] of a) {
    if (!COMPARABLE.has(key)) continue;
    const y = b.get(key);
    if (!y) continue;
    const w = Math.min(x.confidence, y.confidence);
    const diff = Math.abs(x.value - y.value);
    allSum += diff * w;
    allWeight += w;

    const category = getFeature(key).category;
    const bucket = buckets.get(category) ?? { sum: 0, weight: 0 };
    bucket.sum += diff * w;
    bucket.weight += w;
    buckets.set(category, bucket);

    if (diff >= DIVERGENCE_THRESHOLD) divergences.push({ feature: key, a: x.value, b: y.value, diff });
  }
  if (allWeight === 0) return null;

  const byCategory = new Map<string, number>();
  let weakest: { category: string; score: number } | null = null;
  for (const [category, { sum, weight }] of buckets) {
    if (weight === 0) continue;
    const score = 1 - sum / weight;
    byCategory.set(category, score);
    if (weakest === null || score < weakest.score) weakest = { category, score };
  }
  if (weakest === null) return null;

  divergences.sort((p, q) => q.diff - p.diff);
  return { overall: 1 - allSum / allWeight, byCategory, weakest, divergences };
}

/** "What's like <city>?" — ranked by weakest category so nothing blindsides you. */
export async function findSimilarCities(
  target: string,
  opts: { limit?: number } = {}
): Promise<SimilarResult> {
  const limit = opts.limit ?? 8;
  const [cityName, stateAbbr] = target.split(",").map((s) => s.trim());
  const sql = getSql();

  const locations = (await sql.query(
    // Candidates only: the similarity corpus is the set of places you could
    // actually move to. A structural parent (Los Angeles) or a neighborhood
    // would otherwise become both a comparison target and a result.
    "SELECT id, name, state, population FROM locations_location WHERE is_candidate"
  )) as { id: string; name: string; state: string; population: string | null }[];
  const info = new Map(
    locations.map((l) => [l.id, { label: `${l.name}, ${l.state}`, population: parsePopulation(l.population) }])
  );
  const idByLabel = new Map([...info].map(([id, c]) => [c.label, id]));

  const anchorId = idByLabel.get(`${cityName}, ${stateAbbr}`);
  if (!anchorId) throw new Error(`No location named "${target}" in the database.`);

  const rows = (await sql.query(
    "SELECT location_id, feature_key, value, confidence FROM location_features_resolved"
  )) as { location_id: string; feature_key: string; value: string; confidence: string }[];

  const vectors = new Map<string, Vector>();
  for (const row of rows) {
    if (!COMPARABLE.has(row.feature_key)) continue;
    let v = vectors.get(row.location_id);
    if (!v) vectors.set(row.location_id, (v = new Map()));
    v.set(row.feature_key, { value: Number(row.value), confidence: Number(row.confidence) });
  }

  const anchor = vectors.get(anchorId);
  if (!anchor) throw new Error(`"${target}" has no comparable features yet.`);

  const scored: SimilarCity[] = [];
  for (const [id, vector] of vectors) {
    if (id === anchorId) continue;
    const p = compare(anchor, vector);
    if (!p) continue;
    scored.push({
      city: info.get(id)!.label,
      population: info.get(id)!.population,
      overall: round(p.overall),
      weakestCategory: p.weakest.category,
      weakestScore: round(p.weakest.score),
      divergences: p.divergences.slice(0, 4).map((d) => ({
        feature: d.feature,
        label: getFeature(d.feature).label,
        anchorValue: round(d.a),
        otherValue: round(d.b),
        diff: round(d.diff),
      })),
    });
  }

  scored.sort((a, b) => b.weakestScore - a.weakestScore || b.overall - a.overall);
  return { anchor: info.get(anchorId)!.label, ranked: scored.slice(0, limit) };
}

// ── match-profile ──────────────────────────────────────────────────────────

export interface Preference {
  min?: number;
  max?: number;
  target?: number;
  tolerance?: number;
  importance: number;
  /** Fail the city when a known value misses the request by enough. */
  dealbreaker?: boolean;
  /** Fail the city when this trait has no value at all (also implied by dealbreaker). */
  requireKnown?: boolean;
}
export interface Profile {
  name: string;
  notes?: string;
  preferences: Record<string, Preference>;
}
export type MatchSource = "researched" | "computed";
export interface MatchHit {
  feature: string;
  label: string;
  kind: string;
  cityValue: number;
  wanted: string;
  penalty: number;
  dealbroken: boolean;
  source: MatchSource;
}
export interface MatchCity {
  city: string;
  score: number;
  disqualified: boolean;
  topProblem: string;
  hits: MatchHit[];
  unknown: string[];
}
export interface MatchResult {
  profileName: string;
  notes?: string;
  preferenceCount: number;
  citiesScored: number;
  disqualifiedCount: number;
  scopedStates?: string[];
  /** Reminds the model not to overclaim beyond the scored subset. */
  scopeNote: string;
  ranked: MatchCity[];
}

export const MATCH_SCOPE_NOTE =
  "Results are among cities with profile features in this database, not a claim about all U.S. cities.";

function normalizeStateFilters(states?: string[]): string[] {
  if (!states?.length) return [];
  return [
    ...new Set(
      states
        .map((s) => resolveStateAbbr(s) ?? s.trim().toUpperCase())
        .filter(Boolean)
    ),
  ];
}

export function filterProfileCitiesByStates<T extends { state: string }>(
  cities: T[],
  states?: string[]
): { cities: T[]; scopedStates: string[] } {
  const scopedStates = normalizeStateFilters(states);
  if (!scopedStates.length) return { cities, scopedStates: [] };
  const wanted = new Set(scopedStates);
  return {
    cities: cities.filter((city) => wanted.has(resolveStateAbbr(city.state) ?? city.state.trim().toUpperCase())),
    scopedStates,
  };
}

type FeatureCell = { v: number; c: number; p: string };

function computeMiss(kind: string, value: number, pref: Preference): number {
  if (kind === "capacity") {
    if (pref.min !== undefined && value < pref.min) return pref.min <= 0 ? 0 : Math.min(1, (pref.min - value) / pref.min);
    if (pref.max !== undefined && value > pref.max) {
      const room = 1 - pref.max;
      return room <= 0 ? 0 : Math.min(1, (value - pref.max) / room);
    }
    return 0;
  }
  const target = pref.target ?? 0.5;
  const tolerance = pref.tolerance ?? 0.2;
  const distance = Math.abs(value - target);
  if (distance <= tolerance) return 0;
  return Math.min(1, (distance - tolerance) / Math.max(0.001, 1 - tolerance));
}

function describeWant(kind: string, pref: Preference): string {
  if (kind === "capacity") {
    const parts: string[] = [];
    if (pref.min !== undefined) parts.push(`>= ${pref.min.toFixed(2)}`);
    if (pref.max !== undefined) parts.push(`<= ${pref.max.toFixed(2)}`);
    return parts.join(" and ");
  }
  return `about ${(pref.target ?? 0.5).toFixed(2)} (±${(pref.tolerance ?? 0.2).toFixed(2)})`;
}

function provenanceToSource(provenance: string): MatchSource {
  return provenance === "editorial" ? "researched" : "computed";
}

function mustKnow(pref: Preference): boolean {
  return Boolean(pref.dealbreaker) || Boolean(pref.requireKnown);
}

/** Validate a profile's feature keys/kinds. Throws a human-readable message. */
export function validateProfile(profile: Profile): void {
  for (const [key, pref] of Object.entries(profile.preferences)) {
    if (!isFeatureKey(key)) throw new Error(`Unknown feature "${key}". Use only valid trait keys.`);
    const kind = getFeature(key).kind;
    if (kind === "capacity" && pref.min === undefined && pref.max === undefined)
      throw new Error(`"${key}" is a capacity trait — it needs "min" and/or "max", not a target.`);
    if (kind !== "capacity" && pref.target === undefined)
      throw new Error(`"${key}" is a ${kind} trait — it needs a "target" (0..1), not min/max.`);
  }
}

/**
 * Pure ranking core (DB-free) so CLI, chat, and unit tests share one path.
 * Missing dealbreaker / requireKnown traits disqualify; other missing traits
 * stay in `unknown` without failing the city.
 */
export function scoreCitiesAgainstProfile(
  profile: Profile,
  cities: { id: string; label: string; features: Map<string, FeatureCell> }[],
  opts: { limit?: number } = {}
): MatchResult {
  const limit = opts.limit ?? 8;
  validateProfile(profile);

  const scored: MatchCity[] = [];
  for (const city of cities) {
    const hits: MatchHit[] = [];
    const unknown: string[] = [];
    let disqualified = false;

    for (const [key, pref] of Object.entries(profile.preferences)) {
      const f = city.features.get(key);
      if (!f) {
        unknown.push(key);
        if (mustKnow(pref)) disqualified = true;
        continue;
      }
      const kind = getFeature(key).kind;
      const miss = computeMiss(kind, f.v, pref);
      const penalty = miss * pref.importance * (0.5 + 0.5 * f.c);
      const dealbroken = Boolean(pref.dealbreaker) && miss > 0.25;
      if (dealbroken) disqualified = true;
      hits.push({
        feature: key,
        label: getFeature(key).label,
        kind,
        cityValue: round(f.v),
        wanted: describeWant(kind, pref),
        penalty: round(penalty),
        dealbroken,
        source: provenanceToSource(f.p),
      });
    }

    if (hits.length === 0) {
      if (!disqualified) continue;
      scored.push({
        city: city.label,
        score: 0,
        disqualified: true,
        topProblem: `no data for: ${unknown.join(", ")}`,
        hits: [],
        unknown,
      });
      continue;
    }

    hits.sort((a, b) => b.penalty - a.penalty);
    const worst = hits.slice(0, 3).reduce((a, h) => a + h.penalty, 0) / 3;
    const rest = hits.length > 3 ? hits.slice(3).reduce((a, h) => a + h.penalty, 0) / (hits.length - 3) : 0;
    const score = Math.max(0, 1 - (0.75 * worst + 0.25 * rest));

    const top = hits[0];
    const topProblem =
      top && top.penalty > 0.01
        ? `${top.label} is ${top.cityValue.toFixed(2)}, wanted ${top.wanted}`
        : unknown.length
          ? `no data for: ${unknown.join(", ")}`
          : "nothing significant";

    scored.push({ city: city.label, score: round(score), disqualified, topProblem, hits, unknown });
  }

  scored.sort((a, b) => (a.disqualified !== b.disqualified ? (a.disqualified ? 1 : -1) : b.score - a.score));

  return {
    profileName: profile.name,
    notes: profile.notes,
    preferenceCount: Object.keys(profile.preferences).length,
    citiesScored: scored.length,
    disqualifiedCount: scored.filter((s) => s.disqualified).length,
    scopeNote: MATCH_SCOPE_NOTE,
    ranked: scored.slice(0, limit),
  };
}

/** "Best cities for this person?" — worst-driven so one dealbreaker can't be averaged away. */
export async function matchProfileToCities(
  profile: Profile,
  opts: { limit?: number; states?: string[] } = {}
): Promise<MatchResult> {
  validateProfile(profile);
  const sql = getSql();

  const locations = (await sql.query(
    // Candidates only -- see findSimilarCities.
    "SELECT id, name, state FROM locations_location WHERE is_candidate"
  )) as { id: string; name: string; state: string }[];
  const info = new Map(locations.map((l) => [l.id, `${l.name}, ${l.state}`]));
  const locationById = new Map(locations.map((l) => [l.id, l]));

  const rows = (await sql.query(
    "SELECT location_id, feature_key, value, confidence, provenance FROM location_features_resolved"
  )) as { location_id: string; feature_key: string; value: string; confidence: string; provenance: string }[];

  const byCity = new Map<string, Map<string, FeatureCell>>();
  for (const r of rows) {
    if (!info.has(r.location_id)) continue;
    let m = byCity.get(r.location_id);
    if (!m) byCity.set(r.location_id, (m = new Map()));
    m.set(r.feature_key, { v: Number(r.value), c: Number(r.confidence), p: r.provenance });
  }

  const cities = [...byCity.entries()].map(([id, features]) => ({
    id,
    label: info.get(id)!,
    state: locationById.get(id)!.state,
    features,
  }));

  const scoped = filterProfileCitiesByStates(cities, opts.states);
  const result = scoreCitiesAgainstProfile(profile, scoped.cities, opts);
  return {
    ...result,
    scopedStates: scoped.scopedStates.length ? scoped.scopedStates : undefined,
    scopeNote: scoped.scopedStates.length
      ? `${MATCH_SCOPE_NOTE} Scoped to ${scoped.scopedStates.join(", ")}.`
      : result.scopeNote,
  };
}

/* ------------------------------------------------------------------ *
 * Fixed-income cost estimates
 *
 * Distinct from the trait/feature machinery above: features are 0..1
 * abstractions for "is this place like that place", whereas this returns
 * dollars for "what would it cost me to live here". It reads plain columns off
 * locations_location and defers all arithmetic to lib/affordability.ts.
 * ------------------------------------------------------------------ */

/** One city's cost breakdown. Every field is a component, never a verdict. */
export interface CityCostBreakdown {
  city: string;
  /** Null means we could not price it — see `missing`. Never treat as 0. */
  monthlyCost: number | null;
  housing: number | null;
  nonHousing: number | null;
  nationalFixed: number;
  headroom: number | null;
  band: Band;
  /** Inputs absent entirely. Non-empty ⇒ monthlyCost is null. */
  missing: string[];
  /** Inputs filled with a national stand-in instead of local data. */
  approximations: string[];
  /**
   * Context that does NOT block or change monthlyCost — e.g. unverified local
   * VA healthcare access, or the VA copay/medication omission, on the
   * `va_primary` health coverage path. See lib/affordability.ts.
   */
  missingContext: string[];
  /**
   * Confirmed, informational annotations that also do not change monthlyCost —
   * on the `va_primary` path, whether the nearest VA primary care is within the
   * VA 30-minute drive-time standard or beyond it. See lib/affordability.ts.
   */
  notes: string[];
  /**
   * Take-home breakdown for THIS state, when an income composition was given.
   * Null when the caller supplied a flat after-tax figure instead.
   */
  takeHome: {
    grossMonthly: number;
    netMonthly: number;
    federalMonthly: number;
    stateMonthly: number;
    ficaMonthly: number;
    effectiveRatePct: number;
    notes: string[];
  } | null;
}

export type CostEstimateResult =
  | {
      ready: false;
      /** Plain-English reason the model should relay verbatim-ish to the user. */
      reason: string;
    }
  | {
      ready: true;
      tenure: Tenure;
      spendingProfile: SpendingProfile;
      /** Household health coverage choice this estimate used. */
      healthCoverage: HealthCoverage;
      scopeNote: string;
      /** What the estimate structurally cannot account for. */
      caveats: string[];
      /**
       * "composition" means take-home was computed per state from the income
       * mix; "flat_after_tax" means the caller gave a net figure and income is
       * the same everywhere.
       */
      incomeBasis: "composition" | "flat_after_tax";
      /**
       * True when nothing in the income mix is exposed to state income tax —
       * e.g. a household living on VA disability alone. Say so plainly rather
       * than showing a state comparison that implies otherwise.
       */
      stateTaxIrrelevant: boolean;
      cities: CityCostBreakdown[];
      /** How many cities in scope could not be priced at all. */
      notPricedCount: number;
    };

export const COST_SCOPE_NOTE =
  "Estimates cover cities in this database only. Housing is priced from rent " +
  "or home value; everyday costs use BEA regional price parities against a " +
  "named BLS spending profile. This is not a quote or financial advice.";

const COST_CAVEATS = [
  "individual health status and VA enrollment",
  "existing home equity",
  "car ownership and count",
  "dependents",
  "state tax treatment of this person's specific income mix",
];

/**
 * Price a retiree household's monthly cost across cities and rank by headroom.
 *
 * Returns `{ ready: false }` when the national constants in lib/cost-constants.ts
 * have not been sourced yet. Returning it explicitly is the point: a tool that
 * quietly returned an empty list would invite the model to fill the silence
 * from general knowledge, which is exactly what the system prompt forbids.
 */
export async function estimateCostForCities(opts: {
  /** Either a flat after-tax figure, or a composition to be taxed per state. */
  monthlyIncome?: number;
  incomeSources?: IncomeSource[];
  filing?: FilingStatus;
  age65Plus?: boolean;
  spouse65Plus?: boolean;
  tenure: Tenure;
  spendingProfile?: SpendingProfile;
  /** Household health coverage choice. Defaults to "medicare_supplement". */
  healthCoverage?: HealthCoverage;
  cities?: string[];
  limit?: number;
  homePriceOverride?: number;
}): Promise<CostEstimateResult> {
  const resolution = resolveCostConstants();
  if (!resolution.ok) {
    return {
      ready: false,
      reason:
        "Cost estimates are not available yet: the national baseline figures " +
        "this depends on have not been sourced (" +
        resolution.missing.join(", ") +
        "). Say the feature isn't ready rather than estimating.",
    };
  }

  const useComposition = (opts.incomeSources?.length ?? 0) > 0;
  const taxResolution = resolveTaxConstants();
  if (useComposition && !taxResolution.ok) {
    return {
      ready: false,
      reason:
        "Take-home estimates are not available yet: federal tax figures have " +
        "not been sourced (" +
        taxResolution.missing.join(", ") +
        "). Ask for their after-tax monthly income instead of estimating it.",
    };
  }
  if (!useComposition && opts.monthlyIncome === undefined) {
    return {
      ready: false,
      reason:
        "No income given. Ask either for their after-tax monthly income, or " +
        "for how their income breaks down (VA disability, military retirement, " +
        "Social Security, pension, wages) — the breakdown gives a better answer " +
        "because states tax those differently.",
    };
  }

  const limit = opts.limit ?? 8;
  const sql = getSql();
  // State-owned income_tax and retired_pay_tax drive take-home. Prefer
  // normalized locations_stateinfo values after issue #5 adjudication, while
  // falling back to the legacy duplicated location value during migration.
  const rows = (await sql.query(
    `SELECT l.id, l.name, l.state, l.col_index, l.avg_home_value,
            l.avg_home_value_display, l.median_rent, l.property_tax_rate,
            COALESCE(s.income_tax, l.income_tax) AS income_tax,
            s.retired_pay_tax, s.ss_tax_treatment,
            s.ss_tax_threshold_single, s.ss_tax_threshold_married,
            s.ss_tax_min_age, s.ss_tax_age_exempts_fully,
            s.senior_deduction_amount, s.senior_deduction_min_age,
            s.senior_deduction_per_qualifying_person,
            rpp.goods_rpp, rpp.housing_rpp, rpp.utilities_rpp,
            rpp.other_services_rpp, rpp.bea_geo_type, rpp.bea_geo_name,
            rpp.vintage_year AS rpp_vintage_year
     FROM locations_location l
     LEFT JOIN locations_stateinfo s ON s.state = l.state
     LEFT JOIN location_cost_rpp rpp ON rpp.location_id = l.id
     WHERE l.is_candidate`
  )) as Record<string, unknown>[];

  const locations = rows.map(
    (r) =>
      ({
        id: Number(r.id),
        name: String(r.name),
        state: String(r.state),
        col_index: r.col_index === null ? null : Number(r.col_index),
        avg_home_value: r.avg_home_value === null ? null : String(r.avg_home_value),
        avg_home_value_display: r.avg_home_value_display ?? null,
        median_rent: r.median_rent === null ? null : Number(r.median_rent),
        property_tax_rate:
          r.property_tax_rate === null ? null : Number(r.property_tax_rate),
        income_tax: r.income_tax ?? null,
        retired_pay_tax: r.retired_pay_tax ?? null,
        ss_tax_treatment: r.ss_tax_treatment ?? null,
        ss_tax_threshold_single:
          r.ss_tax_threshold_single === null ? null : Number(r.ss_tax_threshold_single),
        ss_tax_threshold_married:
          r.ss_tax_threshold_married === null ? null : Number(r.ss_tax_threshold_married),
        ss_tax_min_age: r.ss_tax_min_age === null ? null : Number(r.ss_tax_min_age),
        ss_tax_age_exempts_fully:
          r.ss_tax_age_exempts_fully === null
            ? null
            : Boolean(r.ss_tax_age_exempts_fully),
        senior_deduction_amount:
          r.senior_deduction_amount === null ? null : Number(r.senior_deduction_amount),
        senior_deduction_min_age:
          r.senior_deduction_min_age === null ? null : Number(r.senior_deduction_min_age),
        senior_deduction_per_qualifying_person:
          r.senior_deduction_per_qualifying_person === null
            ? null
            : Boolean(r.senior_deduction_per_qualifying_person),
        goods_rpp: r.goods_rpp === null ? null : Number(r.goods_rpp),
        housing_rpp: r.housing_rpp === null ? null : Number(r.housing_rpp),
        utilities_rpp: r.utilities_rpp === null ? null : Number(r.utilities_rpp),
        other_services_rpp:
          r.other_services_rpp === null ? null : Number(r.other_services_rpp),
        bea_geo_type: r.bea_geo_type ?? null,
        bea_geo_name: r.bea_geo_name ?? null,
        rpp_vintage_year:
          r.rpp_vintage_year === null ? null : Number(r.rpp_vintage_year),
      }) as CostInputs
  );

  // A named-city request is answered for exactly those cities, in the order
  // asked, so the model can compare the places the user actually raised.
  const wanted = opts.cities?.map((c) => c.trim().toLowerCase());
  const scoped = wanted
    ? wanted
        .map((label) =>
          locations.find((l) => `${l.name}, ${l.state}`.toLowerCase() === label)
        )
        .filter((l): l is CostInputs => l !== undefined)
    : locations;

  const healthCoverage = opts.healthCoverage ?? "medicare_supplement";
  const estimateOpts = {
    homePriceOverride: opts.homePriceOverride,
    spendingProfile: opts.spendingProfile ?? DEFAULT_SPENDING_PROFILE,
    healthCoverage,
  };

  /*
   * Two paths. With a composition, take-home is computed per city because
   * states treat military retired pay differently, so BOTH sides of the
   * comparison vary by location. With a flat after-tax figure, income is the
   * same everywhere and only cost moves.
   */
  const ranked: RankedRow[] = useComposition
    ? rankByBudget(
        scoped,
        {
          sources: opts.incomeSources!,
          filing: opts.filing ?? "single",
          age65Plus: opts.age65Plus ?? true,
          spouse65Plus: opts.spouse65Plus,
        },
        opts.tenure,
        resolution.constants,
        (taxResolution as { ok: true; constants: ResolvedTaxConstants }).constants,
        estimateOpts
      ).map((r) => ({
        location: r.location,
        cost: r.cost,
        headroom: r.headroom,
        band: r.band,
        income: r.income,
      }))
    : rankByHeadroom(
        scoped,
        opts.monthlyIncome!,
        opts.tenure,
        resolution.constants,
        estimateOpts
      ).map((r) => ({
        location: r.location,
        cost: r,
        headroom: r.headroom,
        band: r.band,
        income: null,
      }));

  // Named cities keep the caller's order; an open-ended ask is ranked by
  // headroom and truncated.
  const selected = wanted ? ranked : ranked.slice(0, limit);

  const stateTaxIrrelevant =
    useComposition && isStateTaxIrrelevant(opts.incomeSources!);

  return {
    ready: true,
    tenure: opts.tenure,
    spendingProfile: estimateOpts.spendingProfile,
    healthCoverage,
    scopeNote: COST_SCOPE_NOTE,
    caveats: COST_CAVEATS,
    incomeBasis: useComposition ? "composition" : "flat_after_tax",
    stateTaxIrrelevant,
    notPricedCount: ranked.filter((r) => r.cost.monthlyCost === null).length,
    cities: selected.map((r) => ({
      city: `${r.location.name}, ${r.location.state}`,
      monthlyCost: roundMoney(r.cost.monthlyCost),
      housing: roundMoney(r.cost.housing),
      nonHousing: roundMoney(r.cost.nonHousing),
      nationalFixed: roundMoney(r.cost.nationalFixed)!,
      headroom: roundMoney(r.headroom),
      band: r.band,
      missing: [...r.cost.missing, ...(r.income?.missing ?? [])],
      approximations: [
        ...r.cost.approximations,
        ...(r.income?.approximations ?? []),
      ],
      missingContext: r.cost.missingContext,
      notes: r.cost.notes,
      takeHome: r.income
        ? {
            grossMonthly: roundMoney(r.income.grossMonthly)!,
            netMonthly: roundMoney(r.income.netMonthly)!,
            federalMonthly: roundMoney(r.income.federalMonthly)!,
            stateMonthly: roundMoney(r.income.stateMonthly)!,
            ficaMonthly: roundMoney(r.income.ficaMonthly)!,
            effectiveRatePct: Math.round(r.income.effectiveRate * 1000) / 10,
            notes: r.income.notes,
          }
        : null,
    })),
  };
}

/** Internal shape unifying the flat-income and composition ranking paths. */
interface RankedRow {
  location: CostInputs;
  cost: CostEstimate;
  headroom: number | null;
  band: Band;
  income: NetIncomeEstimate | null;
}

function roundMoney(n: number | null): number | null {
  return n === null ? null : Math.round(n);
}

/* ------------------------------------------------------------------ *
 * State-level tax + gas price comparison
 *
 * Distinct from both the feature machinery and the cost-of-living
 * estimator above: this reads two plain, state-scoped datasets --
 * sales_tax/income_tax off locations_location (a statewide rate stored on
 * every row of that state) and the separate state_gas_prices table -- and
 * never touches location_features. Scoped to states that have at least one
 * city in this database, same as every other tool here.
 * ------------------------------------------------------------------ */

export interface StateTaxGasEntry {
  state: string;
  stateName: string | null;
  /** Sales tax percentage averaged across this state's curated cities. */
  salesTaxPct: number | null;
  /** Statewide income tax percentage only when the current rows agree. 0 means no income tax; null means unknown or conflicting. */
  incomeTaxPct: number | null;
  gasPricePerGallon: number | null;
  /** The city names, only when includeCities was requested (user is choosing between cities). */
  cities?: string[];
}

export type StateTaxGasSort = "combined" | "income_tax" | "sales_tax" | "gas_price";

export interface StateTaxGasResult {
  scopeNote: string;
  caveats: string[];
  sortedBy: StateTaxGasSort;
  states: StateTaxGasEntry[];
}

export const STATE_TAX_GAS_SCOPE_NOTE =
  "Covers only states with at least one city in this database, not all 50 states.";

const STATE_TAX_GAS_CAVEATS = [
  "sales_tax is averaged across the curated cities in each state; income_tax is shown only when the state's current city rows agree, and should be replaced by sourced locations_stateinfo values after state-tax normalization",
  "gas price is a statewide average, not a price for any particular city",
  '"combined" ranking min-max normalizes income tax, sales tax, and gas price and weights them equally -- it is a neutral ranking, not a cost-of-living verdict',
];

const ABBR_TO_STATE_NAME: Record<string, string> = Object.fromEntries(
  Object.entries(STATE_NAME_TO_ABBR).map(([name, abbr]) => [abbr, name])
);

function cmpNullableAsc(a: number | null, b: number | null): number {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return a - b;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function sortStateEntries(entries: StateTaxGasEntry[], sortBy: StateTaxGasSort): StateTaxGasEntry[] {
  if (sortBy === "income_tax") return [...entries].sort((a, b) => cmpNullableAsc(a.incomeTaxPct, b.incomeTaxPct));
  if (sortBy === "sales_tax") return [...entries].sort((a, b) => cmpNullableAsc(a.salesTaxPct, b.salesTaxPct));
  if (sortBy === "gas_price")
    return [...entries].sort((a, b) => cmpNullableAsc(a.gasPricePerGallon, b.gasPricePerGallon));

  // combined: min-max normalize each metric across entries that have all three, sum, ascending.
  const complete = entries.filter(
    (e) => e.salesTaxPct !== null && e.incomeTaxPct !== null && e.gasPricePerGallon !== null
  );
  const normalizer = (values: number[]) => {
    const min = Math.min(...values);
    const max = Math.max(...values);
    return (v: number) => (max === min ? 0 : (v - min) / (max - min));
  };
  const normIncome = normalizer(complete.map((e) => e.incomeTaxPct!));
  const normSales = normalizer(complete.map((e) => e.salesTaxPct!));
  const normGas = normalizer(complete.map((e) => e.gasPricePerGallon!));
  const score = new Map(
    complete.map((e) => [
      e.state,
      normIncome(e.incomeTaxPct!) + normSales(e.salesTaxPct!) + normGas(e.gasPricePerGallon!),
    ])
  );
  return [...entries].sort((a, b) => {
    const sa = score.get(a.state);
    const sb = score.get(b.state);
    if (sa === undefined && sb === undefined) return 0;
    if (sa === undefined) return 1;
    if (sb === undefined) return -1;
    return sa - sb;
  });
}

/** "Which states have low taxes / cheap gas?" -- scoped to states we have cities in. */
export async function compareStateTaxesAndGas(
  opts: {
    states?: string[];
    sortBy?: StateTaxGasSort;
    limit?: number;
    includeCities?: boolean;
  } = {}
): Promise<StateTaxGasResult> {
  const sql = getSql();
  const rows = (await sql.query(`SELECT state, name, sales_tax, income_tax FROM locations_location WHERE is_candidate`)) as {
    state: string;
    name: string;
    sales_tax: string | null;
    income_tax: string | null;
  }[];

  const byState = new Map<
    string,
    { salesTaxSum: number; salesTaxN: number; incomeTaxValues: Set<number>; cities: string[] }
  >();
  for (const r of rows) {
    const abbr = resolveStateAbbr(r.state) ?? r.state.trim().toUpperCase();
    let bucket = byState.get(abbr);
    if (!bucket)
      byState.set(abbr, (bucket = { salesTaxSum: 0, salesTaxN: 0, incomeTaxValues: new Set(), cities: [] }));
    bucket.cities.push(`${r.name}, ${abbr}`);
    if (r.sales_tax !== null) {
      bucket.salesTaxSum += Number(r.sales_tax);
      bucket.salesTaxN += 1;
    }
    if (r.income_tax !== null) {
      bucket.incomeTaxValues.add(Number(r.income_tax));
    }
  }

  // Gas prices already fall back to a committed static dataset when the DB
  // table is unreachable (see lib/gas-prices.ts), so this never throws.
  const gasByState = new Map<string, number>();
  for (const g of (await getGasPrices()).data) gasByState.set(g.state, g.price);

  let entries: StateTaxGasEntry[] = [...byState.entries()].map(([abbr, b]) => {
    const incomeTaxValues = [...b.incomeTaxValues];
    return {
      state: abbr,
      stateName: ABBR_TO_STATE_NAME[abbr] ?? null,
      salesTaxPct: b.salesTaxN ? round2(b.salesTaxSum / b.salesTaxN) : null,
      incomeTaxPct: incomeTaxValues.length === 1 ? round2(incomeTaxValues[0]) : null,
      gasPricePerGallon: gasByState.get(abbr) ?? null,
      ...(opts.includeCities ? { cities: b.cities.sort() } : {}),
    };
  });

  if (opts.states?.length) {
    const wanted = new Set(opts.states.map((s) => resolveStateAbbr(s) ?? s.trim().toUpperCase()));
    entries = entries.filter((e) => wanted.has(e.state));
  }

  const sortBy = opts.sortBy ?? "combined";
  entries = sortStateEntries(entries, sortBy);

  const limit = opts.limit ?? (opts.states?.length ? entries.length : 15);
  return {
    scopeNote: STATE_TAX_GAS_SCOPE_NOTE,
    caveats: STATE_TAX_GAS_CAVEATS,
    sortedBy: sortBy,
    states: entries.slice(0, limit),
  };
}

/* ------------------------------------------------------------------ *
 * State-level gun freedom comparison
 *
 * Reuses the static STATE_GUN_FREEDOM_DATASET from lib/state-gun-freedom.ts
 * verbatim (same third-party provisional rubric that backs /gun-freedom) --
 * this never re-derives the index. The only DB work is figuring out which
 * states have a city in this database, and which cities, for scoping --
 * identical join pattern to compareStateTaxesAndGas.
 * ------------------------------------------------------------------ */

export interface StateGunFreedomEntry {
  state: string;
  stateName: string | null;
  /** 0-100, 100 = least restrictive. */
  value: number;
  /** 1 = freest state in the full 50-state dataset. */
  rank: number;
  displayBand?: string;
  summary: string;
  /** Present only for states whose relevant laws are in active litigation. */
  legalStatus?: "Unsettled";
  /** The city names, only when includeCities was requested (user is choosing between cities). */
  cities?: string[];
}

export type StateGunFreedomSort = "freest" | "most_restrictive";

export interface StateGunFreedomResult {
  scopeNote: string;
  caveats: string[];
  dataVintage: string;
  sources: { label: string; href: string }[];
  sortedBy: StateGunFreedomSort;
  states: StateGunFreedomEntry[];
}

export const STATE_GUN_FREEDOM_SCOPE_NOTE =
  "Covers only states with at least one city in this database, not all 50 states.";

const STATE_GUN_FREEDOM_CAVEATS = [
  "This is a third-party provisional policy rubric (see \"sources\"), not VetRetire's own legal research, and not legal advice.",
  "Scores are STATE-level law only -- they do not capture city/county ordinances or federal law.",
  "Virginia and New Jersey carry legalStatus \"Unsettled\": their assault-weapon and magazine laws are in active litigation, not settled in either direction.",
];

/** "Which states have the strongest/weakest gun rights?" -- scoped to states we have cities in. */
export async function compareStateGunFreedom(
  opts: {
    states?: string[];
    sortBy?: StateGunFreedomSort;
    limit?: number;
    includeCities?: boolean;
  } = {}
): Promise<StateGunFreedomResult> {
  const sql = getSql();
  const rows = (await sql.query(`SELECT state, name FROM locations_location WHERE is_candidate`)) as {
    state: string;
    name: string;
  }[];

  const citiesByState = new Map<string, string[]>();
  for (const r of rows) {
    const abbr = resolveStateAbbr(r.state) ?? r.state.trim().toUpperCase();
    let cities = citiesByState.get(abbr);
    if (!cities) citiesByState.set(abbr, (cities = []));
    cities.push(`${r.name}, ${abbr}`);
  }

  let entries: StateGunFreedomEntry[] = STATE_GUN_FREEDOM_DATASET.data
    .filter((d) => citiesByState.has(d.state))
    .map((d) => ({
      state: d.state,
      stateName: d.name,
      value: d.value,
      rank: d.rank,
      displayBand: d.displayBand,
      summary: d.summary,
      legalStatus: d.legalStatus,
      ...(opts.includeCities ? { cities: (citiesByState.get(d.state) ?? []).sort() } : {}),
    }));

  if (opts.states?.length) {
    const wanted = new Set(opts.states.map((s) => resolveStateAbbr(s) ?? s.trim().toUpperCase()));
    entries = entries.filter((e) => wanted.has(e.state));
  }

  const sortBy = opts.sortBy ?? "freest";
  entries = [...entries].sort((a, b) => (sortBy === "freest" ? a.rank - b.rank : b.rank - a.rank));

  const limit = opts.limit ?? (opts.states?.length ? entries.length : 15);
  return {
    scopeNote: STATE_GUN_FREEDOM_SCOPE_NOTE,
    caveats: STATE_GUN_FREEDOM_CAVEATS,
    dataVintage: STATE_GUN_FREEDOM_DATASET.dataVintage,
    sources: STATE_GUN_FREEDOM_DATASET.sources,
    sortedBy: sortBy,
    states: entries.slice(0, limit),
  };
}

/* ------------------------------------------------------------------ *
 * State-level veteran benefits comparison
 *
 * Reads the verified veteran-benefit columns on locations_stateinfo (issue
 * #6 / #42 / #58): how the state taxes military retired pay and Social
 * Security, the general senior subtraction, and the five benefit flags.
 * Same scoping as the other state tools -- only states with a candidate
 * city -- and, like lib/filters.ts, only rows a human has verified
 * (`vet_benefits_verified_on` set).
 *
 * The benefit flags are THREE-VALUED in the database: NULL means the verified
 * source summary was silent, which is not the same as "no". They are exposed
 * as "yes" | "no" | "not_recorded" so an LLM can never misread a null, and
 * `mustHave` filters match only "yes", never "!== no".
 * ------------------------------------------------------------------ */

export type VeteranBenefitFlag = "yes" | "no" | "not_recorded";

export const VETERAN_BENEFIT_KEYS = [
  "disabled_vet_property_tax",
  "employment_preference",
  "education_benefit",
  "parks_benefit",
  "hunt_fish_benefit",
] as const;
export type VeteranBenefitKey = (typeof VETERAN_BENEFIT_KEYS)[number];

/** A benefit the user can require; `no_income_tax` is its own column, not a benefit flag. */
export type VeteranBenefitRequirement = VeteranBenefitKey | "no_income_tax";

export const VETERAN_BENEFIT_LABELS: Record<VeteranBenefitKey, string> = {
  disabled_vet_property_tax: "property-tax relief for disabled veterans",
  employment_preference: "veteran hiring preference",
  education_benefit: "state education or tuition benefit",
  parks_benefit: "state-park pass or discount",
  hunt_fish_benefit: "hunting and fishing license privileges",
};

export type RetiredPayTreatment = RetiredPayTax;

export const RETIRED_PAY_LABELS: Record<RetiredPayTreatment, string> = {
  no_income_tax: "no state income tax, so military retired pay is untaxed",
  exempt: "military retired pay fully exempt from state income tax",
  partial: "military retired pay partially exempt (a capped or phased exclusion -- read the condition)",
  conditional:
    "military retired pay exempt only under conditions (age, service dates, income, or residency -- read the condition)",
  taxed: "military retired pay taxed like other income",
  unknown: "state treatment of military retired pay not verified",
};

/** Ascending = most favorable first. Neutral ordering, not a recommendation. */
const RETIRED_PAY_ORDER: Record<RetiredPayTreatment, number> = {
  no_income_tax: 0,
  exempt: 1,
  partial: 2,
  conditional: 3,
  taxed: 4,
  unknown: 5,
};

export type SocialSecurityTreatment = "not_taxed" | "partial" | "taxed" | "unknown";

export const SOCIAL_SECURITY_LABELS: Record<SocialSecurityTreatment, string> = {
  not_taxed: "Social Security benefits not taxed by the state",
  partial: "Social Security benefits exempt only below an income threshold or past an age gate",
  taxed: "the federally taxable portion of Social Security benefits is taxed by the state",
  unknown: "state treatment of Social Security benefits not verified",
};

export interface StateVeteranBenefitsEntry {
  state: string;
  stateName: string | null;
  /** ISO date a human last checked this row against `sourceUrl`. */
  verifiedOn: string;
  sourceUrl: string | null;
  noIncomeTax: VeteranBenefitFlag;
  retiredPay: {
    treatment: RetiredPayTreatment;
    label: string;
    /** Dollars per year excluded, when the rule reduces to one figure. */
    exclusionAmountPerYear: number | null;
    /** Percent of retired pay excluded, when stated as a percentage. */
    exclusionPct: number | null;
    /** The age/income/service/residency gate a scalar can't carry. Must be read for partial/conditional. */
    condition: string | null;
  };
  socialSecurity: {
    treatment: SocialSecurityTreatment;
    label: string;
    /** AGI at or below which a `partial` state exempts benefits entirely. */
    exemptAtOrBelowAgiSingle: number | null;
    exemptAtOrBelowAgiMarried: number | null;
    /** Age at which the exemption gate opens, if any. */
    minAge: number | null;
    /** If true, reaching minAge exempts benefits regardless of AGI. */
    ageExemptsFully: boolean | null;
  };
  /** A general senior subtraction from state taxable income (Montana), distinct from the SS rule. */
  seniorDeduction: {
    amountPerYear: number;
    minAge: number | null;
    perQualifyingPerson: boolean | null;
    taxYear: number | null;
  } | null;
  benefits: Record<VeteranBenefitKey, VeteranBenefitFlag>;
  /** How many of the five flags are "yes". Ties are not meaningful; "not_recorded" counts as zero. */
  recordedBenefitCount: number;
  /** The verified one-line digest of the state's veteran programs. */
  summary: string | null;
  /** The city names, only when includeCities was requested (user is choosing between cities). */
  cities?: string[];
}

export type StateVeteranBenefitsSort = "retired_pay" | "benefit_count" | "name";

export interface StateVeteranBenefitsResult {
  scopeNote: string;
  caveats: string[];
  sortedBy: StateVeteranBenefitsSort;
  /** Echo of the filters applied, so the model can say what it excluded. */
  filters: { retiredPayTax: RetiredPayTreatment[] | null; mustHave: VeteranBenefitRequirement[] | null };
  states: StateVeteranBenefitsEntry[];
}

export const STATE_VETERAN_BENEFITS_SCOPE_NOTE =
  "Covers only states with at least one city in this database and a human-verified benefits row, not all 50 states.";

const STATE_VETERAN_BENEFITS_CAVEATS = [
  'Benefit flags are three-valued: "not_recorded" means the verified source summary did not mention that benefit -- it is NOT "no", so never say a state lacks a benefit on that basis.',
  'For "partial" and "conditional" retired-pay treatment the classification alone misleads: the real rule is in retiredPay.condition (age tiers, service dates, income phase-outs, residency gates) and must be relayed.',
  "State programs only: county/city property-tax programs and federal VA benefits are not included, and the summary is a one-line digest, not the full benefits catalog.",
  "Social Security treatment covers Social Security benefits only; a pension, IRA, or wages are taxed under the state's ordinary rules, which this tool does not cover.",
  "Verified as of verifiedOn; these rules change yearly. This is a comparison aid, not tax or legal advice.",
  'Sorting is a neutral ordering (no income tax, then exempt, partial, conditional, taxed), not a recommendation.',
];

function flag(v: boolean | null | undefined): VeteranBenefitFlag {
  if (v === true) return "yes";
  if (v === false) return "no";
  return "not_recorded";
}

function numOrNull(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function asRetiredPay(v: unknown): RetiredPayTreatment {
  return typeof v === "string" && v in RETIRED_PAY_ORDER ? (v as RetiredPayTreatment) : "unknown";
}

function asSocialSecurity(v: unknown): SocialSecurityTreatment {
  return v === "not_taxed" || v === "partial" || v === "taxed" ? v : "unknown";
}

/** One raw locations_stateinfo row, as the DB returns it (numerics come back as strings). */
export interface StateVeteranBenefitsRow {
  state: string;
  vet_benefits_verified_on: string | Date | null;
  vet_benefits_source_url: string | null;
  vet_benefits_summary: string | null;
  no_income_tax: boolean | null;
  retired_pay_tax: string | null;
  retired_pay_exclusion_amount: string | number | null;
  retired_pay_exclusion_pct: string | number | null;
  retired_pay_condition: string | null;
  disabled_vet_property_tax: boolean | null;
  employment_preference: boolean | null;
  education_benefit: boolean | null;
  parks_benefit: boolean | null;
  hunt_fish_benefit: boolean | null;
  ss_tax_treatment: string | null;
  ss_tax_threshold_single: string | number | null;
  ss_tax_threshold_married: string | number | null;
  ss_tax_min_age: string | number | null;
  ss_tax_age_exempts_fully: boolean | null;
  senior_deduction_amount: string | number | null;
  senior_deduction_min_age: string | number | null;
  senior_deduction_per_qualifying_person: boolean | null;
  senior_deduction_tax_year: string | number | null;
}

function isoDate(v: string | Date | null): string | null {
  if (v === null) return null;
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return String(v).slice(0, 10);
}

/** Shape one verified row for the LLM. Returns null for an unverified row (never surfaced). */
export function toStateVeteranBenefitsEntry(
  row: StateVeteranBenefitsRow,
  cities?: string[]
): StateVeteranBenefitsEntry | null {
  const verifiedOn = isoDate(row.vet_benefits_verified_on);
  if (!verifiedOn) return null;
  const abbr = resolveStateAbbr(row.state) ?? row.state.trim().toUpperCase();
  const retiredPay = asRetiredPay(row.retired_pay_tax);
  const ss = asSocialSecurity(row.ss_tax_treatment);
  const benefits = {
    disabled_vet_property_tax: flag(row.disabled_vet_property_tax),
    employment_preference: flag(row.employment_preference),
    education_benefit: flag(row.education_benefit),
    parks_benefit: flag(row.parks_benefit),
    hunt_fish_benefit: flag(row.hunt_fish_benefit),
  };
  const seniorAmount = numOrNull(row.senior_deduction_amount);
  return {
    state: abbr,
    stateName: ABBR_TO_STATE_NAME[abbr] ?? null,
    verifiedOn,
    sourceUrl: row.vet_benefits_source_url ?? null,
    noIncomeTax: flag(row.no_income_tax),
    retiredPay: {
      treatment: retiredPay,
      label: RETIRED_PAY_LABELS[retiredPay],
      exclusionAmountPerYear: numOrNull(row.retired_pay_exclusion_amount),
      exclusionPct: numOrNull(row.retired_pay_exclusion_pct),
      condition: row.retired_pay_condition ?? null,
    },
    socialSecurity: {
      treatment: ss,
      label: SOCIAL_SECURITY_LABELS[ss],
      exemptAtOrBelowAgiSingle: numOrNull(row.ss_tax_threshold_single),
      exemptAtOrBelowAgiMarried: numOrNull(row.ss_tax_threshold_married),
      minAge: numOrNull(row.ss_tax_min_age),
      ageExemptsFully: row.ss_tax_age_exempts_fully ?? null,
    },
    seniorDeduction:
      seniorAmount === null
        ? null
        : {
            amountPerYear: seniorAmount,
            minAge: numOrNull(row.senior_deduction_min_age),
            perQualifyingPerson: row.senior_deduction_per_qualifying_person ?? null,
            taxYear: numOrNull(row.senior_deduction_tax_year),
          },
    benefits,
    recordedBenefitCount: VETERAN_BENEFIT_KEYS.filter((k) => benefits[k] === "yes").length,
    summary: row.vet_benefits_summary ?? null,
    ...(cities ? { cities: [...cities].sort() } : {}),
  };
}

function requirementFlag(e: StateVeteranBenefitsEntry, req: VeteranBenefitRequirement): VeteranBenefitFlag {
  return req === "no_income_tax" ? e.noIncomeTax : e.benefits[req];
}

/**
 * Pure filter + sort over shaped entries (unit-tested; the DB reader below
 * only feeds it). `mustHave` matches "yes" only -- a "not_recorded" state is
 * excluded from a must-have filter, the same rule lib/filters.ts applies.
 */
export function rankStateVeteranBenefits(
  entries: StateVeteranBenefitsEntry[],
  opts: {
    states?: string[];
    retiredPayTax?: RetiredPayTreatment[];
    mustHave?: VeteranBenefitRequirement[];
    sortBy?: StateVeteranBenefitsSort;
    limit?: number;
  } = {}
): Omit<StateVeteranBenefitsResult, "scopeNote" | "caveats"> {
  let list = [...entries];

  if (opts.states?.length) {
    const wanted = new Set(opts.states.map((s) => resolveStateAbbr(s) ?? s.trim().toUpperCase()));
    list = list.filter((e) => wanted.has(e.state));
  }
  const retiredPayTax = opts.retiredPayTax?.length ? [...new Set(opts.retiredPayTax)] : null;
  if (retiredPayTax) {
    const wanted = new Set(retiredPayTax);
    list = list.filter((e) => wanted.has(e.retiredPay.treatment));
  }
  const mustHave = opts.mustHave?.length ? [...new Set(opts.mustHave)] : null;
  if (mustHave) {
    list = list.filter((e) => mustHave.every((req) => requirementFlag(e, req) === "yes"));
  }

  const sortBy = opts.sortBy ?? "retired_pay";
  const byName = (a: StateVeteranBenefitsEntry, b: StateVeteranBenefitsEntry) =>
    (a.stateName ?? a.state).localeCompare(b.stateName ?? b.state);
  const byRetiredPay = (a: StateVeteranBenefitsEntry, b: StateVeteranBenefitsEntry) =>
    RETIRED_PAY_ORDER[a.retiredPay.treatment] - RETIRED_PAY_ORDER[b.retiredPay.treatment];
  const byBenefitCount = (a: StateVeteranBenefitsEntry, b: StateVeteranBenefitsEntry) =>
    b.recordedBenefitCount - a.recordedBenefitCount;
  list.sort((a, b) => {
    if (sortBy === "name") return byName(a, b);
    if (sortBy === "benefit_count") return byBenefitCount(a, b) || byRetiredPay(a, b) || byName(a, b);
    return byRetiredPay(a, b) || byBenefitCount(a, b) || byName(a, b);
  });

  const limit = opts.limit ?? (opts.states?.length ? list.length : 15);
  return {
    sortedBy: sortBy,
    filters: { retiredPayTax, mustHave },
    states: list.slice(0, limit),
  };
}

/** "Which states don't tax military retired pay / give disabled vets a property-tax break?" */
export async function compareStateVeteranBenefits(
  opts: {
    states?: string[];
    retiredPayTax?: RetiredPayTreatment[];
    mustHave?: VeteranBenefitRequirement[];
    sortBy?: StateVeteranBenefitsSort;
    limit?: number;
    includeCities?: boolean;
  } = {}
): Promise<StateVeteranBenefitsResult> {
  const sql = getSql();
  const cityRows = (await sql.query(`SELECT state, name FROM locations_location WHERE is_candidate`)) as {
    state: string;
    name: string;
  }[];
  const stateRows = (await sql.query(
    `SELECT state, vet_benefits_verified_on, vet_benefits_source_url, vet_benefits_summary,
              no_income_tax, retired_pay_tax, retired_pay_exclusion_amount,
              retired_pay_exclusion_pct, retired_pay_condition,
              disabled_vet_property_tax, employment_preference, education_benefit,
              parks_benefit, hunt_fish_benefit,
              ss_tax_treatment, ss_tax_threshold_single, ss_tax_threshold_married,
              ss_tax_min_age, ss_tax_age_exempts_fully,
              senior_deduction_amount, senior_deduction_min_age,
              senior_deduction_per_qualifying_person, senior_deduction_tax_year
         FROM locations_stateinfo
        WHERE vet_benefits_verified_on IS NOT NULL`
  )) as StateVeteranBenefitsRow[];

  const citiesByState = new Map<string, string[]>();
  for (const r of cityRows) {
    const abbr = resolveStateAbbr(r.state) ?? r.state.trim().toUpperCase();
    let cities = citiesByState.get(abbr);
    if (!cities) citiesByState.set(abbr, (cities = []));
    cities.push(`${r.name}, ${abbr}`);
  }

  const entries: StateVeteranBenefitsEntry[] = [];
  for (const row of stateRows) {
    const abbr = resolveStateAbbr(row.state) ?? row.state.trim().toUpperCase();
    const cities = citiesByState.get(abbr);
    if (!cities) continue; // scoped to states we have a city in
    const entry = toStateVeteranBenefitsEntry(row, opts.includeCities ? cities : undefined);
    if (entry) entries.push(entry);
  }

  return {
    scopeNote: STATE_VETERAN_BENEFITS_SCOPE_NOTE,
    caveats: STATE_VETERAN_BENEFITS_CAVEATS,
    ...rankStateVeteranBenefits(entries, opts),
  };
}

/** Compact catalog of every trait, for teaching an LLM to build a profile. */
export function traitCatalog(): { key: string; kind: string; category: string; high: string; low: string }[] {
  return FEATURES.map((f) => ({ key: f.key, kind: f.kind, category: f.category, high: f.high, low: f.low }));
}

function round(n: number): number {
  return Math.round(n * 1000) / 1000;
}
