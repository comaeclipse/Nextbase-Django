/*
 * Housing-burden metrics (issue #170 Phase B).
 *
 * A SECOND metric family beside the residual model, answering a different
 * question:
 *
 *   residual/headroom (lib/affordability.ts)  "what's my whole monthly
 *     picture here?" — after-tax, whole-cost. The retiree comfort metric.
 *   housing burden (this module)  "does this SALARY cover housing here?" —
 *     gross-income, housing-only. The natural unit for job postings, where
 *     pay is quoted gross.
 *
 * THE RULE: the HUD 30%-of-gross-income housing-cost convention. Housing
 * here means PITI + HOA (estimatePitiMonthly) for buyers — maintenance and
 * utilities are deliberately excluded and must be DISCLOSED by surfaces, not
 * silently folded in — or a gross rent for renters.
 *
 * STORE THE NUMBER, NOT THE CATEGORY: every function returns continuous
 * values (0.347, $98,400); the five-band classification is presentation and
 * derives from the same comparisons, so a printed figure can never
 * contradict its own band (the same never-contradict discipline as
 * incomeTargets/quickCheck).
 */
import {
  estimatePitiMonthly,
  homeValue,
  type CostInputs,
  type EstimateOptions,
  type PitiEstimate,
} from "./affordability";
import type { ResolvedConstants } from "./cost-constants";

/**
 * The affordability threshold: housing at or under this share of gross
 * income is "affordable" in the HUD sense. A convention, not a measurement —
 * over it is "cost burdened" in the literature, over 0.5 severely so.
 */
export const HOUSING_BURDEN_SHARE = 0.3;

export type BurdenBand =
  | "very_affordable"
  | "affordable"
  | "stretched"
  | "difficult"
  | "severely_unaffordable";

/**
 * Band upper bounds on burden = annual housing / annual gross. The 0.30
 * boundary IS HOUSING_BURDEN_SHARE — one constant on purpose.
 */
export const BURDEN_BAND_BOUNDS = {
  very_affordable: 0.25,
  affordable: HOUSING_BURDEN_SHARE,
  stretched: 0.35,
  difficult: 0.4,
} as const;

/**
 * Continuous housing burden: share of gross income going to housing.
 * Null when the inputs cannot form a burden (no income, negative cost).
 */
export function housingBurden(
  monthlyHousingCost: number,
  annualGrossIncome: number
): number | null {
  if (!Number.isFinite(monthlyHousingCost) || monthlyHousingCost < 0) return null;
  if (!Number.isFinite(annualGrossIncome) || annualGrossIncome <= 0) return null;
  return (monthlyHousingCost * 12) / annualGrossIncome;
}

/**
 * Presentation band, computed from multiplication comparisons on the raw
 * inputs rather than the rounded quotient — division can round a
 * hair-under-boundary burden ONTO the boundary (the FP trap quickCheck
 * documents).
 */
export function burdenBand(
  monthlyHousingCost: number,
  annualGrossIncome: number
): BurdenBand | null {
  if (housingBurden(monthlyHousingCost, annualGrossIncome) === null) return null;
  const annualHousing = monthlyHousingCost * 12;
  if (annualHousing <= annualGrossIncome * BURDEN_BAND_BOUNDS.very_affordable)
    return "very_affordable";
  if (annualHousing <= annualGrossIncome * BURDEN_BAND_BOUNDS.affordable)
    return "affordable";
  if (annualHousing <= annualGrossIncome * BURDEN_BAND_BOUNDS.stretched)
    return "stretched";
  if (annualHousing <= annualGrossIncome * BURDEN_BAND_BOUNDS.difficult)
    return "difficult";
  return "severely_unaffordable";
}

export function burdenBandLabel(band: BurdenBand): string {
  switch (band) {
    case "very_affordable":
      return "Very affordable";
    case "affordable":
      return "Affordable";
    case "stretched":
      return "Stretched";
    case "difficult":
      return "Difficult";
    case "severely_unaffordable":
      return "Severely unaffordable";
  }
}

/**
 * Annual GROSS income at which this housing cost sits exactly at `share`
 * (default: the 30% rule). Ceiled to whole dollars, then nudged until the
 * band comparison itself passes, so the printed figure always satisfies the
 * band it names — a guard, not a proof, exactly one iteration in practice.
 */
export function requiredIncomeGross(
  monthlyHousingCost: number,
  share: number = HOUSING_BURDEN_SHARE
): number | null {
  if (!Number.isFinite(monthlyHousingCost) || monthlyHousingCost <= 0) return null;
  if (!Number.isFinite(share) || share <= 0) return null;
  let income = Math.ceil((monthlyHousingCost * 12) / share);
  while (monthlyHousingCost * 12 > income * share) income += 1;
  return income;
}

/**
 * salary / requiredIncome: 1.22 = comfortably above the threshold, 1.00 =
 * exactly at it, 0.73 = income is 73% of what's needed.
 */
export function affordabilityRatio(
  annualGrossIncome: number,
  requiredIncome: number
): number | null {
  if (!Number.isFinite(annualGrossIncome) || annualGrossIncome <= 0) return null;
  if (!Number.isFinite(requiredIncome) || requiredIncome <= 0) return null;
  return annualGrossIncome / requiredIncome;
}

/** One home's burden picture, optionally evaluated at a salary. */
export interface HomeBurden {
  homePrice: number;
  piti: PitiEstimate;
  /** Null when PITI could not be totalled (missing insurance). */
  requiredIncome: number | null;
  /** The next three are null when no salary was given or PITI is incomplete. */
  burden: number | null;
  band: BurdenBand | null;
  ratio: number | null;
}

export interface CityHousingBurden {
  /** ACS lower-value-quartile home. Null when entry_home_value is absent. */
  entry: HomeBurden | null;
  /** Typical (ZHVI) home. Null when avg_home_value is absent. */
  median: HomeBurden | null;
  /**
   * Disclosed, not priced: maintenance and utilities are excluded from PITI
   * on purpose. Surfaces render these lines next to any burden figure.
   */
  notPriced: string[];
}

function homeBurden(
  loc: CostInputs,
  price: number,
  c: ResolvedConstants,
  salaryAnnual: number | undefined,
  opts: EstimateOptions
): HomeBurden {
  const piti = estimatePitiMonthly(loc, price, c, opts);
  const requiredIncome =
    piti.total === null ? null : requiredIncomeGross(piti.total);
  const canEvaluate = piti.total !== null && salaryAnnual !== undefined;
  return {
    homePrice: price,
    piti,
    requiredIncome,
    burden: canEvaluate ? housingBurden(piti.total!, salaryAnnual!) : null,
    band: canEvaluate ? burdenBand(piti.total!, salaryAnnual!) : null,
    ratio:
      canEvaluate && requiredIncome !== null
        ? affordabilityRatio(salaryAnnual!, requiredIncome)
        : null,
  };
}

/**
 * Entry vs median burden for one city — the #170 headline comparison. Pass
 * `salaryAnnual` (gross) to evaluate burden/band/ratio at a specific pay;
 * omit it for the income-required-only view.
 */
export function cityHousingBurden(
  loc: CostInputs,
  c: ResolvedConstants,
  options: { salaryAnnual?: number; estimate?: EstimateOptions } = {}
): CityHousingBurden {
  const opts = options.estimate ?? {};
  const entryPrice = loc.entry_home_value ?? null;
  const medianPrice = homeValue(loc);
  return {
    entry:
      entryPrice === null
        ? null
        : homeBurden(loc, entryPrice, c, options.salaryAnnual, opts),
    median:
      medianPrice === null
        ? null
        : homeBurden(loc, medianPrice, c, options.salaryAnnual, opts),
    notPriced: [
      "home maintenance (the residual model's 1% planning rule) is not in PITI",
      "owner utilities are not in PITI",
    ],
  };
}
