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
    "SELECT id, name, state, population FROM locations_location"
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
  /** Reminds the model not to overclaim beyond the scored subset. */
  scopeNote: string;
  ranked: MatchCity[];
}

export const MATCH_SCOPE_NOTE =
  "Results are among cities with profile features in this database, not a claim about all U.S. cities.";

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
  opts: { limit?: number } = {}
): Promise<MatchResult> {
  validateProfile(profile);
  const sql = getSql();

  const locations = (await sql.query(
    "SELECT id, name, state FROM locations_location"
  )) as { id: string; name: string; state: string }[];
  const info = new Map(locations.map((l) => [l.id, `${l.name}, ${l.state}`]));

  const rows = (await sql.query(
    "SELECT location_id, feature_key, value, confidence, provenance FROM location_features_resolved"
  )) as { location_id: string; feature_key: string; value: string; confidence: string; provenance: string }[];

  const byCity = new Map<string, Map<string, FeatureCell>>();
  for (const r of rows) {
    let m = byCity.get(r.location_id);
    if (!m) byCity.set(r.location_id, (m = new Map()));
    m.set(r.feature_key, { v: Number(r.value), c: Number(r.confidence), p: r.provenance });
  }

  const cities = [...byCity.entries()].map(([id, features]) => ({
    id,
    label: info.get(id) ?? id,
    features,
  }));

  return scoreCitiesAgainstProfile(profile, cities, opts);
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
            rpp.goods_rpp, rpp.housing_rpp, rpp.utilities_rpp,
            rpp.other_services_rpp, rpp.bea_geo_type, rpp.bea_geo_name,
            rpp.vintage_year AS rpp_vintage_year
     FROM locations_location l
     LEFT JOIN locations_stateinfo s ON s.state = l.state
     LEFT JOIN location_cost_rpp rpp ON rpp.location_id = l.id`
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

  const estimateOpts = {
    homePriceOverride: opts.homePriceOverride,
    spendingProfile: opts.spendingProfile ?? DEFAULT_SPENDING_PROFILE,
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
  /** Cities in this database, for this state. */
  cities: string[];
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
  } = {}
): Promise<StateTaxGasResult> {
  const sql = getSql();
  const rows = (await sql.query(`SELECT state, name, sales_tax, income_tax FROM locations_location`)) as {
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
      cities: b.cities.sort(),
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

/** Compact catalog of every trait, for teaching an LLM to build a profile. */
export function traitCatalog(): { key: string; kind: string; category: string; high: string; low: string }[] {
  return FEATURES.map((f) => ({ key: f.key, kind: f.kind, category: f.category, high: f.high, low: f.low }));
}

function round(n: number): number {
  return Math.round(n * 1000) / 1000;
}
