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
 *                  location.
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
  DEFAULT_SPENDING_PROFILE,
  spendingSlices,
  type ResolvedConstants,
  type SpendingProfile,
} from "./cost-constants";

export type { SpendingProfile };
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
  /** Override the default down payment fraction for `buying`. */
  downPaymentFraction?: number;
  /**
   * Override the home price used for ownership tenures. Defaults to the city's
   * avg_home_value. Useful when a user knows what they'd actually spend — a
   * retiree downsizing rarely buys the city average.
   */
  homePriceOverride?: number;
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
  profile: SpendingProfile = DEFAULT_SPENDING_PROFILE
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
  const slices = spendingSlices(profile, c);
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
  profile: SpendingProfile
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
  const slices = spendingSlices(profile, c);
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
  profile: SpendingProfile
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

  let taxRate = loc.property_tax_rate ?? null;
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
    (spendingSlices(profile, c).utilitiesMonthly * utilitiesRpp) / 100;
  const carrying =
    monthlyTax + monthlyInsurance + monthlyMaintenance + monthlyUtilities;

  if (tenure === "own_outright") return carrying;

  // buying: carrying costs plus debt service on the financed portion.
  const down = opts.downPaymentFraction ?? c.defaultDownPaymentFraction;
  const principal = price * (1 - down);
  return carrying + monthlyPrincipalAndInterest(principal, c.mortgageRate30yr);
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
  const spendingProfile = opts.spendingProfile ?? DEFAULT_SPENDING_PROFILE;

  const nhi = nonHousingIndex(loc, c, approximations, [], spendingProfile);
  const nonHousing = nonHousingDollars(
    loc,
    c,
    approximations,
    missing,
    spendingProfile
  );

  const housing = housingCost(
    loc,
    tenure,
    c,
    missing,
    approximations,
    opts,
    spendingProfile
  );
  const nationalFixed =
    c.medicarePartBMonthly + c.supplementalHealthMonthly;

  // Any missing component means no total. Never substitute a default and
  // present the result as if it were complete.
  const monthlyCost =
    housing === null || nonHousing === null
      ? null
      : housing + nonHousing + nationalFixed;

  return {
    spendingProfile,
    monthlyCost,
    housing,
    nonHousing,
    nationalFixed,
    nonHousingIndex: nhi,
    missing,
    approximations,
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
  monthlyIncome: number
): Affordability {
  if (estimate.monthlyCost === null) {
    return { ...estimate, headroom: null, band: "unknown" };
  }
  const headroom = monthlyIncome - estimate.monthlyCost;
  const band: Band =
    estimate.monthlyCost <= monthlyIncome * 0.8
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
  opts: EstimateOptions = {}
): Affordability {
  return assessAffordability(estimateMonthlyCost(loc, tenure, c, opts), monthlyIncome);
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
  };
}

/** Cost, take-home, and headroom for one household in one city. */
export function assessBudget(
  loc: CostInputs,
  budget: Budget,
  tenure: Tenure,
  costConstants: ResolvedConstants,
  taxConstants: ResolvedTaxConstants,
  opts: EstimateOptions = {}
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
    cost.monthlyCost <= income.netMonthly * 0.8
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
  opts: EstimateOptions = {}
): LocationBudget[] {
  return locations
    .map((loc) => assessBudget(loc, budget, tenure, costConstants, taxConstants, opts))
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
  opts: EstimateOptions = {}
): (Affordability & { location: CostInputs })[] {
  return locations
    .map((location) => ({
      location,
      ...assessLocation(location, monthlyIncome, tenure, c, opts),
    }))
    .sort((a, b) => {
      if (a.headroom === null && b.headroom === null) return 0;
      if (a.headroom === null) return 1;
      if (b.headroom === null) return -1;
      return b.headroom - a.headroom;
    });
}
