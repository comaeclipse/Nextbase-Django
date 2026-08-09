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
 *               + nonHousingBaseline x nonHousingIndex(city) / 100
 *               + nationalFixed
 *
 * The three terms behave differently by location and must be treated
 * separately:
 *
 *   housing        priced per city from DB columns (home value, property tax,
 *                  rent), because it is the dominant and most local cost.
 *   nonHousing     a national baseline scaled by a LOCAL index.
 *   nationalFixed  Medicare and supplemental premiums. These do NOT vary by
 *                  location, so scaling them by a cost index — as a naive COL
 *                  model does — overstates the gap between cheap and expensive
 *                  cities.
 *
 * WHY HOUSING IS BACKED OUT OF col_index
 *
 * A composite COL index already contains housing. In this database
 * corr(col_index, avg_home_value) = 0.840, so it contains a lot of it. Pricing
 * housing from avg_home_value AND scaling the whole budget by col_index would
 * count housing roughly twice. `nonHousingIndex()` removes it algebraically
 * before the scaling step.
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
  NON_HOUSING_INDEX_BOUNDS,
  type ResolvedConstants,
} from "./cost-constants";

/** How the household occupies its home. Drives which housing branch runs. */
export type Tenure = "rent" | "own_outright" | "buying";

/** Budget verdict band. `unknown` means we could not compute, not "bad". */
export type Band = "comfortable" | "tight" | "over" | "unknown";

/**
 * LocationRow plus the cost columns that are planned but not yet ingested.
 *
 * `median_rent` and `property_tax_rate` are P0 ingestion tasks. Declaring them
 * as optional here means this module compiles and runs today, and starts
 * producing better numbers the moment the columns land — without a type change.
 */
export interface CostInputs extends LocationRow {
  /** Monthly median rent in dollars. Not yet ingested. */
  median_rent?: number | null;
  /** Effective annual property tax as a fraction of home value. Not yet ingested. */
  property_tax_rate?: number | null;
}

export interface CostEstimate {
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

/**
 * The city's cost index with housing removed.
 *
 *   col_index = w x housingIndex + (1 - w) x nonHousingIndex
 *   => nonHousingIndex = (col_index - w x housingIndex) / (1 - w)
 *
 * Returns null when the inputs are missing OR when the result is implausible.
 * An out-of-band result means the city's col_index and avg_home_value disagree
 * with each other; that is a data-quality bug to fix upstream, not a number to
 * quietly ship. scripts/verify-affordability.ts reports these.
 */
export function nonHousingIndex(
  loc: CostInputs,
  c: ResolvedConstants,
  approximations: string[] = []
): number | null {
  if (loc.col_index === null || loc.col_index === undefined) return null;

  const value = homeValue(loc);
  if (value === null) {
    // No home value: assume housing is typical for this city's overall cost
    // level (housingIndex = col_index), which makes the algebra collapse to
    // nonHousingIndex = col_index. Defensible as a stand-in, but it is an
    // assumption rather than a measurement, so it gets labeled.
    approximations.push("no home value on file; assumed typical local housing");
    return withinBounds(loc.col_index);
  }

  const housingIdx = (100 * value) / c.nationalMedianHomeValue;
  const w = c.housingWeight;
  return withinBounds((loc.col_index - w * housingIdx) / (1 - w));
}

function withinBounds(n: number): number | null {
  const { min, max } = NON_HOUSING_INDEX_BOUNDS;
  return n >= min && n <= max ? n : null;
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
  opts: EstimateOptions
): number | null {
  if (tenure === "rent") {
    // No national stand-in is offered here on purpose. Rent varies far too much
    // between cities for a national average to mean anything — substituting one
    // would defeat the entire point of a per-city estimate. Rent stays blocked
    // until median_rent is ingested.
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
  // them, and the non-housing baseline excludes them either way.
  const carrying =
    monthlyTax + monthlyInsurance + monthlyMaintenance + c.nationalUtilitiesMonthly;

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

  const nhi = nonHousingIndex(loc, c, approximations);
  if (nhi === null) missing.push("local cost index");
  const nonHousing =
    nhi === null ? null : (c.nonHousingBaseline65Plus * nhi) / 100;

  const housing = housingCost(loc, tenure, c, missing, approximations, opts);
  const nationalFixed =
    c.medicarePartBMonthly + c.supplementalHealthMonthly;

  // Any missing component means no total. Never substitute a default and
  // present the result as if it were complete.
  const monthlyCost =
    housing === null || nonHousing === null
      ? null
      : housing + nonHousing + nationalFixed;

  return {
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
