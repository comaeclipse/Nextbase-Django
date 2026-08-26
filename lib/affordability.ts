/*
 * Fixed-income affordability model.
 *
 * Answers "what would it cost me to live here each month?" for a retiree
 * household, then compares that to a stated income. Every dollar figure traces
 * back to either a database column or a sourced national constant in
 * lib/cost-constants.ts — nothing here is invented.
 *
 * THE MODEL
 *
 *   monthlyCost = housing(city, tenure)
 *               + goodsBaseline x goodsRpp / 100
 *               + otherServicesBaseline x otherServicesRpp / 100
 *               + unscaledNonHousing
 *               + nationalFixed
 *
 * The national baselines come from a named spending profile (`modest` by
 * default, or `typical`). The profile is recorded on the estimate; it is
 * never inferred from the user's income.
 *
 * The terms behave differently by location and must be treated separately:
 *
 *   housing        priced per city from DB columns (home value, property tax,
 *                  rent), because it is the dominant and most local cost.
 *                  BEA housing RPP is stored but not used here.
 *   goods /
 *   other services BLS 65+ slices scaled by the matching BEA RPP component.
 *                  They are never averaged into one index.
 *   unscaled       cash contributions and pensions: in the 65+ mean, but not
 *                  a local price level.
 *   nationalFixed  Medicare and supplemental premiums. These do NOT vary by
 *                  location, but DO vary by the household's `healthCoverage`
 *                  choice (medicare_supplement keeps Medigap + Part D;
 *                  va_primary drops both and keeps Part B only).
 *
 * WHY THIS DOES NOT USE col_index
 *
 * col_index in this database was assembled from at least five providers.
 * Backing housing out of it with a single C2ER weight produced plausible
 * numbers for cities the weight does not describe. BEA RPP publishes goods,
 * utilities, and other services separately, so that algebra is gone. Legacy
 * col_index remains on the row for the categorical Fit score only.
 *
 * WHAT THIS MODEL DOES NOT CAPTURE
 *
 * Individual health status, existing home equity, car ownership and count,
 * dependents, and the state tax treatment of the user's specific income mix.
 * It is an estimate with real error bars. Callers must present it as
 * "estimated monthly cost", never as "you can afford this".
 */
import type { LocationRow } from "./types";
import { resolveStateAbbr } from "./states";
import { HOME_INSURANCE_DATASET } from "./insurance";
import {
  DEFAULT_HOUSEHOLD,
  DEFAULT_SPENDING_PROFILE,
  spendingSlices,
  type Household,
  type ResolvedConstants,
  type SpendingProfile,
} from "./cost-constants";

export type { Household, SpendingProfile };
import { estimateNetMonthlyIncome } from "./income";
import type {
  FilingStatus,
  IncomeSource,
  NetIncomeEstimate,
  StateTaxProfile,
} from "./income";
import type { ResolvedTaxConstants } from "./tax-constants";

/** How the household occupies its home. Drives which housing branch runs. */
export type Tenure = "rent" | "own_outright" | "buying";

/**
 * Household health-insurance coverage choice, independent of city. Default
 * `medicare_supplement` keeps the historical Part B + Medigap + Part D stack.
 * `va_primary` keeps Part B (VA guidance is to take it regardless — it covers
 * non-VA doctors/hospitals and delaying it risks a lifetime late-enrollment
 * penalty) and drops Medigap and Part D, because VA drug coverage counts as
 * Medicare creditable prescription drug coverage. This is a household choice,
 * not something a city's VA access implies — carrying VA health care does not
 * by itself mean Medigap was dropped, so it is never inferred from geography.
 *
 * The TRICARE options (issue #108 Phase 3) price the Group A retiree
 * enrollment fee (`tricare_prime`, `tricare_select`) or, for
 * `tricare_for_life`, Medicare Part B per beneficiary — TFL itself has no
 * enrollment fee. Copays, deductibles, and the catastrophic cap are
 * disclosed via missingContext, never priced.
 */
export type HealthCoverage =
  | "medicare_supplement"
  | "va_primary"
  | "tricare_prime"
  | "tricare_select"
  | "tricare_for_life";

/** Budget verdict band. `unknown` means we could not compute, not "bad". */
export type Band = "comfortable" | "tight" | "over" | "unknown";

/**
 * LocationRow plus the per-city cost columns. RPP, rent, and property tax
 * are nullable: partial coverage is expected and the model reports `missing`
 * / `approximations` rather than guessing.
 */
export interface CostInputs extends LocationRow {
  /** Monthly median gross rent in dollars (ACS B25064). */
  median_rent?: number | null;
  /** Effective annual property tax as a fraction of home value. */
  property_tax_rate?: number | null;
}

export interface CostEstimate {
  /** Which national basket was scaled. Never inferred from income. */
  spendingProfile: SpendingProfile;
  /** Which health coverage stack fed `nationalFixed`. Never inferred from geography. */
  healthCoverage: HealthCoverage;
  /** Who the estimate priced: one person (default) or a couple. */
  household: Household;
  /** Total estimated monthly cost, or null when it could not be computed. */
  monthlyCost: number | null;
  /** The housing term, or null if the tenure's inputs were unavailable. */
  housing: number | null;
  /** The location-scaled everyday-costs term, or null if unavailable. */
  nonHousing: number | null;
  /** Location-invariant premiums. Always computable once constants are sourced. */
  nationalFixed: number;
  /** The derived non-housing index for this city, for display and debugging. */
  nonHousingIndex: number | null;
  /**
   * Inputs that were absent, in reader-facing words. Non-empty means
   * `monthlyCost` is null and the UI must show "not enough data" rather than
   * a number.
   */
  missing: string[];
  /**
   * Inputs that were substituted with a national stand-in rather than local
   * data. The estimate IS usable, but it is less trustworthy and the UI should
   * say which parts were approximated.
   */
  approximations: string[];
  /**
   * Context worth surfacing that does NOT block or change `monthlyCost` —
   * unlike `missing` (blocks the total) and `approximations` (a national
   * stand-in WAS folded into the total). Populated on the `va_primary` health
   * coverage path: local VA healthcare access has not been verified for this
   * city (no drive-time ingest exists yet), and VA outpatient copays /
   * medication costs are a known, unestimated omission. Unknown VA access
   * must never null `monthlyCost` or change the affordability band — that is
   * exactly what this field exists to avoid.
   */
  missingContext: string[];
}

export interface Affordability extends CostEstimate {
  /** income - monthlyCost. Positive is money left over. Null if incomputable. */
  headroom: number | null;
  band: Band;
}

/** Options for a single estimate. All optional; sensible defaults applied. */
export interface EstimateOptions {
  /**
   * National spending basket. Defaults to `modest` (get-by). Pass `typical`
   * for the BLS 65+ mean. The estimate records which one was used.
   */
  spendingProfile?: SpendingProfile;
  /** Household health coverage choice. Defaults to "medicare_supplement". */
  healthCoverage?: HealthCoverage;
  /** Override the default down payment fraction for `buying`. */
  downPaymentFraction?: number;
  /**
   * Override the home price used for ownership tenures. Defaults to the city's
   * avg_home_value. Useful when a user knows what they'd actually spend — a
   * retiree downsizing rarely buys the city average.
   */
  homePriceOverride?: number;
  /**
   * Who to price. Defaults to `single` (the pre-existing behavior: the
   * profile's published basket plus one person's premiums). `couple` scales
   * the consumption slices via coupleSliceMultipliers() and doubles the
   * per-person Medicare premiums. Housing is one dwelling either way.
   */
  household?: Household;
  /**
   * Override the 30-year mortgage rate for `buying` (annual fraction, e.g.
   * 0.055). Defaults to the sourced Freddie Mac PMMS constant.
   */
  mortgageRateOverride?: number;
  /**
   * Override the effective annual property tax rate (fraction of home value)
   * for the ownership tenures. A user-supplied figure replaces both the
   * city's rate and the national fallback — and suppresses the fallback's
   * approximation note, since the number is theirs.
   */
  propertyTaxRateOverride?: number;
  /**
   * Monthly HOA/condo dues for the ownership tenures, in dollars. There is
   * no data column or national constant for this — it exists only as a
   * user-supplied figure, and defaults to 0.
   */
  hoaMonthly?: number;
}

/** Home value in dollars, reusing the parser the Fit score already uses. */
function homeValue(loc: CostInputs): number | null {
  if (loc.avg_home_value !== null && loc.avg_home_value !== undefined) {
    const parsed = parseFloat(loc.avg_home_value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

/**
 * Annual homeowners insurance for this specific home, or null if the state is
 * unknown.
 *
 * The published premium in lib/insurance.ts is a STANDARDIZED benchmark quoted
 * at a fixed dwelling coverage amount (see that dataset's `profile`). Applying
 * it flat would charge a $1.6M home and an $80k home the same premium, which is
 * badly wrong at both ends and matters most to the ownership tenures.
 *
 * So it is scaled to this home's insured value. Insurance covers the STRUCTURE
 * (replacement cost), not the land — land does not burn down — so market value
 * is discounted by `structureShareOfValue` first. Skipping that step would
 * overcharge exactly the high-land-cost markets where the gap is widest.
 */
function annualHomeInsurance(
  loc: CostInputs,
  price: number,
  c: ResolvedConstants
): number | null {
  const abbr = resolveStateAbbr(loc.state);
  if (!abbr) return null;
  const row = HOME_INSURANCE_DATASET.data.find((d) => d.state === abbr);
  if (!row) return null;

  const insuredValue = price * c.structureShareOfValue;
  return row.annualPremium * (insuredValue / c.insuranceBenchmarkDwelling);
}

function rppNumber(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * Effective non-housing index for display: the expenditure-weighted average
 * of the BEA components that actually scale the baseline. Unscaled cash
 * contributions/pensions sit at 100. Returns null when RPP is missing.
 */
export function nonHousingIndex(
  loc: CostInputs,
  c: ResolvedConstants,
  approximations: string[] = [],
  reasons: string[] = [],
  profile: SpendingProfile = DEFAULT_SPENDING_PROFILE,
  household: Household = DEFAULT_HOUSEHOLD
): number | null {
  const goods = rppNumber(loc.goods_rpp);
  const other = rppNumber(loc.other_services_rpp);
  if (goods === null || other === null) {
    reasons.push("BEA regional price parity");
    return null;
  }
  if (loc.bea_geo_type === "nonmetro_state") {
    approximations.push(
      loc.bea_geo_name
        ? `BEA ${loc.bea_geo_name}, not a city-level price level`
        : "BEA state nonmetropolitan portion, not a city-level price level"
    );
  }
  const slices = spendingSlices(profile, c, household);
  const total =
    slices.goodsMonthly + slices.otherServicesMonthly + slices.unscaledMonthly;
  if (total <= 0) {
    reasons.push("BEA regional price parity");
    return null;
  }
  return (
    (slices.goodsMonthly * goods +
      slices.otherServicesMonthly * other +
      slices.unscaledMonthly * 100) /
    total
  );
}

function nonHousingDollars(
  loc: CostInputs,
  c: ResolvedConstants,
  approximations: string[],
  reasons: string[],
  profile: SpendingProfile,
  household: Household
): number | null {
  const goods = rppNumber(loc.goods_rpp);
  const other = rppNumber(loc.other_services_rpp);
  if (goods === null || other === null) {
    reasons.push("BEA regional price parity");
    return null;
  }
  if (loc.bea_geo_type === "nonmetro_state") {
    const already = approximations.some((a) => /BEA /.test(a));
    if (!already) {
      approximations.push(
        loc.bea_geo_name
          ? `BEA ${loc.bea_geo_name}, not a city-level price level`
          : "BEA state nonmetropolitan portion, not a city-level price level"
      );
    }
  }
  const slices = spendingSlices(profile, c, household);
  return (
    (slices.goodsMonthly * goods) / 100 +
    (slices.otherServicesMonthly * other) / 100 +
    slices.unscaledMonthly
  );
}

/** Monthly principal + interest on an amortizing fixed-rate loan. */
function monthlyPrincipalAndInterest(
  principal: number,
  annualRate: number,
  years = 30
): number {
  if (principal <= 0) return 0;
  const r = annualRate / 12;
  const n = years * 12;
  if (r === 0) return principal / n;
  const growth = Math.pow(1 + r, n);
  return (principal * r * growth) / (growth - 1);
}

/**
 * The monthly housing term for a tenure. Pushes reader-facing strings onto
 * `missing` / `approximations` rather than returning a partial number, so a
 * caller can never mistake an incomplete estimate for a complete one.
 */
function housingCost(
  loc: CostInputs,
  tenure: Tenure,
  c: ResolvedConstants,
  missing: string[],
  approximations: string[],
  opts: EstimateOptions,
  profile: SpendingProfile,
  household: Household
): number | null {
  if (tenure === "rent") {
    // No national stand-in is offered here on purpose. Rent varies far too much
    // between cities for a national average to mean anything — substituting one
    // would defeat the entire point of a per-city estimate.
    if (loc.median_rent === null || loc.median_rent === undefined) {
      missing.push("median rent");
      return null;
    }
    // Median GROSS rent already includes utilities, so no utilities term is
    // added here — see nationalUtilitiesMonthly in lib/cost-constants.ts.
    return loc.median_rent;
  }

  const price = opts.homePriceOverride ?? homeValue(loc);
  if (price === null) {
    missing.push("home value");
    return null;
  }

  let taxRate = opts.propertyTaxRateOverride ?? loc.property_tax_rate ?? null;
  if (taxRate === null) {
    taxRate = c.fallbackPropertyTaxRate;
    approximations.push("national average property tax rate");
  }

  const insuranceAnnual = annualHomeInsurance(loc, price, c);
  if (insuranceAnnual === null) {
    missing.push("homeowners insurance for this state");
    return null;
  }

  const monthlyTax = (price * taxRate) / 12;
  const monthlyInsurance = insuranceAnnual / 12;
  const monthlyMaintenance = (price * c.annualMaintenanceRate) / 12;
  // Utilities are added for owners only: a renter's gross rent already has
  // them. Scale the national 65+ utilities bill by local BEA utilities RPP.
  const utilitiesRpp = rppNumber(loc.utilities_rpp);
  if (utilitiesRpp === null) {
    missing.push("BEA regional price parity");
    return null;
  }
  const monthlyUtilities =
    (spendingSlices(profile, c, household).utilitiesMonthly * utilitiesRpp) / 100;
  // HOA has no data column and no national constant — it is user-supplied
  // only (0 when not provided), so it never appears in `approximations`.
  const monthlyHoa = opts.hoaMonthly ?? 0;
  const carrying =
    monthlyTax + monthlyInsurance + monthlyMaintenance + monthlyUtilities + monthlyHoa;

  if (tenure === "own_outright") return carrying;

  // buying: carrying costs plus debt service on the financed portion.
  const down = opts.downPaymentFraction ?? c.defaultDownPaymentFraction;
  const principal = price * (1 - down);
  return (
    carrying +
    monthlyPrincipalAndInterest(
      principal,
      opts.mortgageRateOverride ?? c.mortgageRate30yr
    )
  );
}

/**
 * Location-invariant health premiums for a coverage stack and household.
 *
 * Two different scaling rules, both sourced:
 * - Medicare-family premiums are PER ENROLLEE — Part B is set per beneficiary
 *   (Federal Register 2025-20251), Medigap policies cover one person each,
 *   Part D enrollment is individual — so a couple pays 2x each. Insurer
 *   Medigap household discounts have no published magnitude and are not
 *   modeled.
 * - TRICARE Prime/Select enrollment fees are PER PLAN: a couple (two
 *   enrolled beneficiaries) pays the FAMILY rate, never 2x the individual
 *   fee (DHA family-rate rule). TRICARE For Life has no enrollment fee; its
 *   cost IS Medicare Part B, per beneficiary.
 */
function healthPremiumsMonthly(
  coverage: HealthCoverage,
  household: Household,
  c: ResolvedConstants
): number {
  const couple = household === "couple";
  switch (coverage) {
    case "medicare_supplement":
      return (
        (c.medicarePartBMonthly + c.medigapMonthly + c.partDMonthly) *
        (couple ? 2 : 1)
      );
    case "va_primary":
    case "tricare_for_life":
      return c.medicarePartBMonthly * (couple ? 2 : 1);
    case "tricare_prime":
      return couple
        ? c.tricarePrimeFamilyMonthly
        : c.tricarePrimeIndividualMonthly;
    case "tricare_select":
      return couple
        ? c.tricareSelectFamilyMonthly
        : c.tricareSelectIndividualMonthly;
  }
}

/**
 * Estimate the monthly cost of living in a city for a given tenure.
 *
 * Deliberately income-independent: what a city costs does not depend on who is
 * asking. Keeping banding separate (see `assessAffordability`) also lets the
 * explore page compute costs once for all 132 cities and re-band instantly as
 * an income slider moves.
 */
export function estimateMonthlyCost(
  loc: CostInputs,
  tenure: Tenure,
  c: ResolvedConstants,
  opts: EstimateOptions = {}
): CostEstimate {
  const missing: string[] = [];
  const approximations: string[] = [];
  const missingContext: string[] = [];
  const spendingProfile = opts.spendingProfile ?? DEFAULT_SPENDING_PROFILE;
  const healthCoverage = opts.healthCoverage ?? "medicare_supplement";
  const household = opts.household ?? DEFAULT_HOUSEHOLD;

  const nhi = nonHousingIndex(
    loc,
    c,
    approximations,
    [],
    spendingProfile,
    household
  );
  const nonHousing = nonHousingDollars(
    loc,
    c,
    approximations,
    missing,
    spendingProfile,
    household
  );

  const housing = housingCost(
    loc,
    tenure,
    c,
    missing,
    approximations,
    opts,
    spendingProfile,
    household
  );
  const nationalFixed = healthPremiumsMonthly(healthCoverage, household, c);

  if (household === "couple") {
    missingContext.push(
      "couple costs are scaled from BLS two-person 65+ households — a close proxy, but ~15% of those are not couples and they skew higher-income than singles"
    );
  }

  if (healthCoverage === "va_primary") {
    // Neither line blocks or approximates monthlyCost — see missingContext's
    // doc comment. City-level VA drive-time data does not exist yet (a later,
    // separate ingest), so access is unverified for every city today; that is
    // reported as unknown context, never as a reason to null the total or
    // restore the dropped Medigap/Part D premiums.
    missingContext.push(
      "local VA healthcare access is not yet verified for this city (no drive-time data ingested)"
    );
    missingContext.push(
      "VA outpatient copays and medication costs are not estimated — they vary by disability rating, priority group, and prescriptions"
    );
  }

  if (healthCoverage === "tricare_prime" || healthCoverage === "tricare_select") {
    missingContext.push(
      "TRICARE Group A retiree fees are modeled — initial service in 2018 or later (Group B) pays a higher enrollment fee"
    );
    missingContext.push(
      "TRICARE copays, deductibles, and the catastrophic cap are not estimated"
    );
  }

  if (healthCoverage === "tricare_for_life") {
    missingContext.push(
      "TRICARE For Life has no enrollment fee — the health line is Medicare Part B per person; TFL wraparound cost-shares are not estimated"
    );
  }

  // Any missing component means no total. Never substitute a default and
  // present the result as if it were complete.
  const monthlyCost =
    housing === null || nonHousing === null
      ? null
      : housing + nonHousing + nationalFixed;

  return {
    spendingProfile,
    healthCoverage,
    household,
    monthlyCost,
    housing,
    nonHousing,
    nationalFixed,
    nonHousingIndex: nhi,
    missing,
    approximations,
    missingContext,
  };
}

/**
 * Share of take-home income the estimated cost may reach and still band as
 * "comfortable". One constant on purpose: the band in assessAffordability /
 * assessBudget and the inverse income targets below must agree, or a city
 * could advertise a "comfortable" income that its own band then calls tight.
 */
export const COMFORT_COST_SHARE = 0.8;

/**
 * The inverse question: instead of "does MY income cover this city?", "what
 * take-home income does this city take?" Both numbers are monthly AFTER-tax
 * dollars — grossing up depends on the household's income mix and the state,
 * which is exactly what the forward path (assessBudget) models, so no gross
 * figure is invented here.
 */
export interface IncomeTargets {
  /**
   * Take-home at which income meets the estimated cost. Below this the band
   * is "over"; at or above it, at least "tight".
   */
  breakEven: number;
  /**
   * Take-home at which the band turns "comfortable": cost is at most
   * COMFORT_COST_SHARE of income, leaving the rest as cushion.
   */
  comfortable: number;
}

/**
 * Null when the city could not be priced, mirroring `monthlyCost`.
 *
 * Both targets are ceiled to whole dollars. Two reasons: the UI prints whole
 * dollars, and in IEEE doubles `c <= (c / SHARE) * SHARE` is false for a
 * large fraction of cost values, so the raw quotient can band as "tight" at
 * its own "comfortable" target. Rounding up guarantees a printed target
 * always satisfies the band it names.
 *
 * `comfortShare` parameterizes the cushion (issue #108 Phase 3): 0.9 for a
 * 10% cushion, 0.8 (the default, = COMFORT_COST_SHARE) for 20%, 0.7 for 30%.
 * Whatever share a caller bands with, it MUST pass the same one here.
 */
export function incomeTargets(
  estimate: CostEstimate,
  comfortShare: number = COMFORT_COST_SHARE
): IncomeTargets | null {
  if (estimate.monthlyCost === null) return null;
  return {
    breakEven: Math.ceil(estimate.monthlyCost),
    comfortable: Math.ceil(estimate.monthlyCost / comfortShare),
  };
}

/* ------------------------------------------------------------------ *
 * Quick check: one net take-home number in, one verdict out.
 *
 * This answers a different question from assessBudget: not "given my exact
 * income mix, what's my monthly picture?" but "is this city even realistically
 * in my price range?" It deliberately takes a single AFTER-TAX number — $4,000
 * spendable is $4,000 spendable whether it came from wages, retired pay, VA
 * disability, or Social Security. The composition (and its radically
 * different tax treatment) is advanced-mode territory.
 * ------------------------------------------------------------------ */

/**
 * Coverage-ratio boundaries for the quick-check bands, where coverage is
 * income / cost. The FIVE bands refine the THREE in `Band` rather than
 * replacing them: `comfortable` maps to comfortable, `in_the_ballpark` to
 * tight, and the three low bands partition over — quickCheck's verdict and
 * assessAffordability's band can never contradict each other. The top
 * boundary is NOT here on purpose: it is `incomeTargets().comfortable`
 * (1 / COMFORT_COST_SHARE = 1.25x cost, ceiled), never a separately-written
 * 1.25.
 */
export const QUICK_COVERAGE_BANDS = {
  /** Below this share of cost covered: "way out of range". */
  wayOutOfRange: 0.7,
  /** Below this: "probably too expensive". */
  probablyTooExpensive: 0.9,
  /**
   * Below this, secondary "in your wildest dreams" copy may be shown on top
   * of the way-out-of-range verdict. A copy flag, never a sixth band.
   */
  wildestDreams: 0.5,
} as const;

export type QuickVerdict =
  | "way_out_of_range"
  | "probably_too_expensive"
  | "very_tight"
  | "in_the_ballpark"
  | "comfortable";

export interface QuickCheck {
  verdict: QuickVerdict;
  /** income / cost. Above 1 means estimated costs are covered. */
  coverage: number;
  /**
   * (income - cost) / income: the share of take-home left after estimated
   * costs. Negative when short. At the comfortable target this is at least
   * 1 - COMFORT_COST_SHARE.
   */
  cushion: number;
  /**
   * income - cost, signed monthly dollars. Positive is money remaining,
   * negative is an estimated shortfall. Surfacing magnitude is the point:
   * "$180 short" and "$4,300 short" are different conversations.
   */
  remaining: number;
  /**
   * Additional monthly take-home needed to reach the comfortable target.
   * 0 when already there.
   */
  toComfortable: number;
  /** Copy flag: coverage is under QUICK_COVERAGE_BANDS.wildestDreams. */
  wildestDreams: boolean;
  /** The same targets the no-input table shows, for display alongside. */
  targets: IncomeTargets;
}

/**
 * Null when the city could not be priced (mirroring `monthlyCost`) or the
 * income is not a positive number — a null verdict must render as "not enough
 * data", never as unaffordable.
 */
export function quickCheck(
  estimate: CostEstimate,
  netMonthlyIncome: number,
  comfortShare: number = COMFORT_COST_SHARE
): QuickCheck | null {
  const targets = incomeTargets(estimate, comfortShare);
  if (targets === null || estimate.monthlyCost === null) return null;
  if (!Number.isFinite(netMonthlyIncome) || netMonthlyIncome <= 0) return null;

  const cost = estimate.monthlyCost;
  const coverage = netMonthlyIncome / cost;
  // The two boundaries shared with the 3-band system reuse ITS comparisons
  // (`cost > income`, `cost <= income * COMFORT_COST_SHARE`) rather than the
  // rounded `coverage` ratio, so the refinement mapping in the
  // QUICK_COVERAGE_BANDS doc comment holds exactly — division can round
  // income/cost to 1.0 when income is a hair under cost, which would call a
  // city "in the ballpark" that assessAffordability bands as over.
  const verdict: QuickVerdict =
    coverage < QUICK_COVERAGE_BANDS.wayOutOfRange
      ? "way_out_of_range"
      : coverage < QUICK_COVERAGE_BANDS.probablyTooExpensive
        ? "probably_too_expensive"
        : cost > netMonthlyIncome
          ? "very_tight"
          : cost <= netMonthlyIncome * comfortShare
            ? "comfortable"
            : "in_the_ballpark";

  return {
    verdict,
    coverage,
    cushion: (netMonthlyIncome - cost) / netMonthlyIncome,
    remaining: netMonthlyIncome - cost,
    toComfortable:
      verdict === "comfortable"
        ? 0
        : Math.max(0, targets.comfortable - netMonthlyIncome),
    wildestDreams: coverage < QUICK_COVERAGE_BANDS.wildestDreams,
    targets,
  };
}

/**
 * Attach headroom and a budget band to an estimate.
 *
 * Bands describe the estimate, they do not filter. Callers should rank and
 * annotate rather than hide cities: the model carries real uncertainty, and
 * silently removing options is how the earlier draft showed an empty page to
 * the lowest-income users.
 */
export function assessAffordability(
  estimate: CostEstimate,
  monthlyIncome: number,
  comfortShare: number = COMFORT_COST_SHARE
): Affordability {
  if (estimate.monthlyCost === null) {
    return { ...estimate, headroom: null, band: "unknown" };
  }
  const headroom = monthlyIncome - estimate.monthlyCost;
  const band: Band =
    estimate.monthlyCost <= monthlyIncome * comfortShare
      ? "comfortable"
      : estimate.monthlyCost <= monthlyIncome
        ? "tight"
        : "over";
  return { ...estimate, headroom, band };
}

/** Convenience: estimate and band in one call. */
export function assessLocation(
  loc: CostInputs,
  monthlyIncome: number,
  tenure: Tenure,
  c: ResolvedConstants,
  opts: EstimateOptions = {},
  comfortShare: number = COMFORT_COST_SHARE
): Affordability {
  return assessAffordability(
    estimateMonthlyCost(loc, tenure, c, opts),
    monthlyIncome,
    comfortShare
  );
}

/* ------------------------------------------------------------------ *
 * Budget assessment: cost AND take-home income, both per city.
 *
 * The functions above take income as a scalar, which is still the right call
 * when someone tells you what they actually receive after tax ("I get $3,000 a
 * month"). The ones below take an income COMPOSITION and compute take-home per
 * location, because state treatment of military retired pay differs — so the
 * same household nets different amounts in different states.
 *
 * That is the point of pairing them: both sides of the comparison move by city
 * instead of only cost.
 * ------------------------------------------------------------------ */

/** A household's income mix and the filing facts needed to tax it. */
export interface Budget {
  sources: IncomeSource[];
  filing: FilingStatus;
  age65Plus: boolean;
  spouse65Plus?: boolean;
}

export interface LocationBudget {
  location: CostInputs;
  cost: CostEstimate;
  income: NetIncomeEstimate;
  /** Take-home minus cost, both for THIS city. Null if cost is unknown. */
  headroom: number | null;
  band: Band;
}

/**
 * Build the state tax inputs from a location row.
 *
 * `retired_pay_tax` and the Social Security tax columns arrive denormalized
 * from locations_stateinfo on the location query (see lib/locations.ts).
 */
export function stateTaxProfileFor(loc: CostInputs): StateTaxProfile {
  const rate =
    loc.income_tax === null || loc.income_tax === undefined
      ? null
      : Number(loc.income_tax);
  return {
    stateIncomeTaxRatePct: Number.isFinite(rate as number) ? (rate as number) : null,
    retiredPayTax: loc.retired_pay_tax ?? null,
    ssTaxTreatment: loc.ss_tax_treatment ?? null,
    ssTaxThresholdSingle: loc.ss_tax_threshold_single ?? null,
    ssTaxThresholdMarried: loc.ss_tax_threshold_married ?? null,
    ssTaxMinAge: loc.ss_tax_min_age ?? null,
    ssTaxAgeExemptsFully: loc.ss_tax_age_exempts_fully ?? null,
    seniorDeductionAmount: loc.senior_deduction_amount ?? null,
    seniorDeductionMinAge: loc.senior_deduction_min_age ?? null,
    seniorDeductionPerQualifyingPerson:
      loc.senior_deduction_per_qualifying_person ?? null,
  };
}

/** Cost, take-home, and headroom for one household in one city. */
export function assessBudget(
  loc: CostInputs,
  budget: Budget,
  tenure: Tenure,
  costConstants: ResolvedConstants,
  taxConstants: ResolvedTaxConstants,
  opts: EstimateOptions = {},
  comfortShare: number = COMFORT_COST_SHARE
): LocationBudget {
  const cost = estimateMonthlyCost(loc, tenure, costConstants, opts);
  const income = estimateNetMonthlyIncome(
    budget.sources,
    stateTaxProfileFor(loc),
    {
      filing: budget.filing,
      age65Plus: budget.age65Plus,
      spouse65Plus: budget.spouse65Plus,
    },
    taxConstants
  );

  if (cost.monthlyCost === null) {
    return { location: loc, cost, income, headroom: null, band: "unknown" };
  }

  const headroom = income.netMonthly - cost.monthlyCost;
  const band: Band =
    cost.monthlyCost <= income.netMonthly * comfortShare
      ? "comfortable"
      : cost.monthlyCost <= income.netMonthly
        ? "tight"
        : "over";

  return { location: loc, cost, income, headroom, band };
}

/**
 * Rank locations by money left over after tax and cost, best first.
 *
 * Same null convention as rankByHeadroom: cities that cannot be priced sort
 * last and are never dropped.
 */
export function rankByBudget(
  locations: CostInputs[],
  budget: Budget,
  tenure: Tenure,
  costConstants: ResolvedConstants,
  taxConstants: ResolvedTaxConstants,
  opts: EstimateOptions = {},
  comfortShare: number = COMFORT_COST_SHARE
): LocationBudget[] {
  return locations
    .map((loc) =>
      assessBudget(loc, budget, tenure, costConstants, taxConstants, opts, comfortShare)
    )
    .sort((a, b) => {
      if (a.headroom === null && b.headroom === null) return 0;
      if (a.headroom === null) return 1;
      if (b.headroom === null) return -1;
      return b.headroom - a.headroom;
    });
}

/**
 * Rank locations by remaining monthly income, best first.
 *
 * Cities we could not price sort last but are never dropped — matching the
 * pass-through convention `inPriceRange` already uses in lib/filters.ts for
 * locations with no home value on file.
 */
export function rankByHeadroom(
  locations: CostInputs[],
  monthlyIncome: number,
  tenure: Tenure,
  c: ResolvedConstants,
  opts: EstimateOptions = {},
  comfortShare: number = COMFORT_COST_SHARE
): (Affordability & { location: CostInputs })[] {
  return locations
    .map((location) => ({
      location,
      ...assessLocation(location, monthlyIncome, tenure, c, opts, comfortShare),
    }))
    .sort((a, b) => {
      if (a.headroom === null && b.headroom === null) return 0;
      if (a.headroom === null) return 1;
      if (b.headroom === null) return -1;
      return b.headroom - a.headroom;
    });
}
