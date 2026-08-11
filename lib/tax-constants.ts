/*
 * Federal tax constants for the take-home income model (lib/income.ts).
 *
 * SCOPE, AND THE LINE THIS DOES NOT CROSS: these support ESTIMATING take-home
 * pay so two cities can be compared. They are not tax advice, not a filing
 * aid, and not a planning tool. The model deliberately omits itemizing,
 * credits, dependents, multiple jobs, self-employment tax, state-specific
 * deductions, and local income taxes. Any surface built on this must present
 * the result as "estimated take-home, for comparing places" and never as a
 * tax liability.
 *
 * Same discipline as lib/cost-constants.ts: every value is filled from a named
 * published source and records the date it was retrieved. Tax figures are
 * indexed annually, so all of these need a yearly pass — see TAX_YEAR.
 *
 * SOURCED 2026-08-11 for tax year 2026 from IRS Rev. Proc. 2025-32 (which
 * incorporates the One Big Beautiful Bill Act), SSA, and CRS.
 */
import type { CostConstant } from "./cost-constants";

/** Same identity helper as cost-constants: keeps `value` typed number | null. */
const constant = (c: CostConstant): CostConstant => c;

/** The tax year every figure in this file must come from. Keep them in sync. */
export const TAX_YEAR = 2026;

const IRS_2026 =
  "https://www.irs.gov/newsroom/irs-releases-tax-inflation-adjustments-for-tax-year-2026-including-amendments-from-the-one-big-beautiful-bill";

export const TAX_CONSTANTS = {
  /** Base standard deduction, single filer. */
  standardDeductionSingle: constant({
    value: 16100,
    unit: "USD per year",
    kind: "measured",
    source: `IRS Rev. Proc. 2025-32, standard deduction for tax year ${TAX_YEAR}, single`,
    sourceUrl: IRS_2026,
    sourcedOn: "2026-08-11",
    refresh: "annual",
  }),

  /** Base standard deduction, married filing jointly. */
  standardDeductionMarried: constant({
    value: 32200,
    unit: "USD per year",
    kind: "measured",
    source: `IRS Rev. Proc. 2025-32, standard deduction for tax year ${TAX_YEAR}, married filing jointly`,
    sourceUrl: IRS_2026,
    sourcedOn: "2026-08-11",
    refresh: "annual",
  }),

  /**
   * Section 63(f) additional standard deduction per qualifying condition,
   * unmarried filer. This is the LONG-STANDING age-65 amount — distinct from
   * the temporary OBBBA senior bonus below. Both apply; they do not replace
   * each other.
   */
  additionalDeduction65Single: constant({
    value: 2050,
    unit: "USD per year per qualifying condition",
    kind: "measured",
    source: `IRC 63(f) additional standard deduction, ${TAX_YEAR}, unmarried/head of household`,
    sourceUrl: "https://www.kiplinger.com/taxes/extra-standard-deduction-age-65-and-older",
    sourcedOn: "2026-08-11",
    refresh: "annual",
    note:
      "Per qualifying CONDITION, and age-65 and blindness stack: a single " +
      "filer who is both gets $4,100. The model only handles age, so it " +
      "understates the deduction for a blind filer — conservative.",
  }),

  /** Section 63(f) additional standard deduction, married, per qualifying individual. */
  additionalDeduction65Married: constant({
    value: 1650,
    unit: "USD per year per qualifying individual",
    kind: "measured",
    source: `IRC 63(f) additional standard deduction, ${TAX_YEAR}, married`,
    sourceUrl: "https://www.kiplinger.com/taxes/extra-standard-deduction-age-65-and-older",
    sourcedOn: "2026-08-11",
    refresh: "annual",
    note: "Per qualifying individual, so a couple both 65+ claims twice this.",
  }),

  /**
   * OBBBA senior bonus deduction, per qualifying individual aged 65+.
   *
   * TEMPORARY: tax years 2025 through 2028 only. It expires and this whole
   * block must come out for 2029 — see the guard in lib/income.ts.
   *
   * Claimable on top of the standard deduction AND on top of the 63(f) amount
   * above, and does not require receiving Social Security. Because it is
   * federal, it shifts every city's take-home identically and therefore does
   * not change RANKINGS — but it does change the headroom figure a user sees,
   * which is why it is modeled rather than ignored.
   */
  seniorBonusDeduction: constant({
    value: 6000,
    unit: "USD per year per qualifying individual",
    kind: "measured",
    source:
      "One Big Beautiful Bill Act (P.L. 119-21) senior deduction, tax years 2025-2028",
    sourceUrl: "https://www.congress.gov/crs-product/R48613",
    sourcedOn: "2026-08-11",
    refresh: "annual",
    note:
      "Modeled as per qualifying individual (a couple both 65+ filing jointly " +
      "claims $12,000). Married filing SEPARATELY gets none of it at all, " +
      "which the model does not represent since it has no separate status.\n" +
      "Verify the per-individual reading against the statute before this " +
      "drives anything user-facing.",
  }),

  /** MAGI at which the senior bonus deduction begins phasing out, single. */
  seniorBonusPhaseOutStartSingle: constant({
    value: 75000,
    unit: "USD of MAGI per year",
    kind: "measured",
    source: "OBBBA senior deduction phase-out threshold, single",
    sourceUrl: "https://www.congress.gov/crs-product/R48613",
    sourcedOn: "2026-08-11",
    refresh: "annual",
    note:
      "Fully eliminated at $175,000 single / $250,000 MFJ, which falls out of " +
      "the 6% rate below rather than needing its own constant.",
  }),

  /** MAGI at which the senior bonus deduction begins phasing out, MFJ. */
  seniorBonusPhaseOutStartMarried: constant({
    value: 150000,
    unit: "USD of MAGI per year",
    kind: "measured",
    source: "OBBBA senior deduction phase-out threshold, married filing jointly",
    sourceUrl: "https://www.congress.gov/crs-product/R48613",
    sourcedOn: "2026-08-11",
    refresh: "annual",
  }),

  /** Rate at which the senior bonus phases out above the threshold. */
  seniorBonusPhaseOutRate: constant({
    value: 0.06,
    unit: "fraction of MAGI above the threshold",
    kind: "measured",
    source: "OBBBA senior deduction phase-out rate (6 cents per dollar over)",
    sourceUrl: "https://www.congress.gov/crs-product/R48613",
    sourcedOn: "2026-08-11",
    refresh: "annual",
    note:
      "Almost never binds for this audience — a fixed-income veteran is well " +
      "under $75k — but modeled so a working retiree is not over-credited.",
  }),

  /**
   * Combined employee FICA rate: Social Security plus Medicare.
   * Applies to WAGES ONLY — not to pensions, retired pay, or benefits.
   */
  ficaRate: constant({
    value: 0.0765,
    unit: "fraction of wages",
    kind: "measured",
    source: "SSA/IRS employee payroll tax: Social Security 6.2% + Medicare 1.45%",
    sourceUrl: "https://www.ssa.gov/oact/cola/cbb.html",
    sourcedOn: "2026-08-11",
    refresh: "annual",
    note:
      "Employee share only. The Social Security portion stops at the wage " +
      "base below; the Medicare portion does not cap. Self-employment would " +
      "roughly double this, which the model does not handle.",
  }),

  /** Wage base above which the Social Security portion of FICA stops. */
  ficaSocialSecurityWageBase: constant({
    value: 184500,
    unit: "USD per year",
    kind: "measured",
    source: `SSA contribution and benefit base for ${TAX_YEAR} (up from $176,100 in 2025)`,
    sourceUrl: "https://www.ssa.gov/oact/cola/cbb.html",
    sourcedOn: "2026-08-11",
    refresh: "annual",
    note:
      "Rarely binding for this audience — a veteran working part time is well " +
      "under it — but modeled so a full-time earner is not overcharged.",
  }),

  /* Social Security taxability. Benefits are taxed on a provisional-income
   * test, not a flat rule: below the first threshold none is taxable, between
   * the thresholds up to half, above the second up to 85%. Never 100%. */

  ssProvisionalThreshold1Single: constant({
    value: 25000,
    unit: "USD per year",
    kind: "measured",
    source: "IRC 86 first provisional-income threshold, single (CRS IF11397)",
    sourceUrl: "https://www.congress.gov/crs-product/IF11397",
    sourcedOn: "2026-08-11",
    refresh: "rare",
    note:
      "VERIFIED not inflation-indexed: frozen since 1983 (50% tier) and 1993 " +
      "(85% tier). `rare` is correct, but it also means more retirees drift " +
      "into taxable territory every year as COLAs push provisional income up.",
  }),

  ssProvisionalThreshold2Single: constant({
    value: 34000,
    unit: "USD per year",
    kind: "measured",
    source: "IRC 86 second provisional-income threshold, single (CRS IF11397)",
    sourceUrl: "https://www.congress.gov/crs-product/IF11397",
    sourcedOn: "2026-08-11",
    refresh: "rare",
  }),

  ssProvisionalThreshold1Married: constant({
    value: 32000,
    unit: "USD per year",
    kind: "measured",
    source: "IRC 86 first provisional-income threshold, MFJ (CRS IF11397)",
    sourceUrl: "https://www.congress.gov/crs-product/IF11397",
    sourcedOn: "2026-08-11",
    refresh: "rare",
  }),

  ssProvisionalThreshold2Married: constant({
    value: 44000,
    unit: "USD per year",
    kind: "measured",
    source: "IRC 86 second provisional-income threshold, MFJ (CRS IF11397)",
    sourceUrl: "https://www.congress.gov/crs-product/IF11397",
    sourcedOn: "2026-08-11",
    refresh: "rare",
  }),
} satisfies Record<string, CostConstant>;

export type TaxConstantKey = keyof typeof TAX_CONSTANTS;

/** One federal marginal bracket. `upTo: null` marks the top, open-ended band. */
export interface TaxBracket {
  upTo: number | null;
  rate: number;
}

/**
 * Federal ordinary-income brackets, ascending, by filing status.
 *
 * Kept out of TAX_CONSTANTS because a bracket table is not a scalar. The seven
 * rates are unchanged for 2026; OBBBA gave the bottom two bands a larger
 * inflation adjustment (4%) than the rest (2.3%).
 */
export const FEDERAL_BRACKETS: {
  single: TaxBracket[];
  married: TaxBracket[];
  source: string;
  sourceUrl: string | null;
  sourcedOn: string | null;
} = {
  single: [
    { upTo: 12400, rate: 0.1 },
    { upTo: 50400, rate: 0.12 },
    { upTo: 105700, rate: 0.22 },
    { upTo: 201775, rate: 0.24 },
    { upTo: 256225, rate: 0.32 },
    { upTo: 640600, rate: 0.35 },
    { upTo: null, rate: 0.37 },
  ],
  married: [
    { upTo: 24800, rate: 0.1 },
    { upTo: 100800, rate: 0.12 },
    { upTo: 211400, rate: 0.22 },
    { upTo: 403550, rate: 0.24 },
    { upTo: 512450, rate: 0.32 },
    { upTo: 768700, rate: 0.35 },
    { upTo: null, rate: 0.37 },
  ],
  source: `IRS Rev. Proc. 2025-32, ordinary income tax rate schedules for ${TAX_YEAR}`,
  sourceUrl: IRS_2026,
  sourcedOn: "2026-08-11",
};

/** Resolved scalars, once every one has been sourced. */
export type ResolvedTaxConstants = Record<TaxConstantKey, number> & {
  brackets: { single: TaxBracket[]; married: TaxBracket[] };
};

export type TaxConstantsResolution =
  | { ok: true; constants: ResolvedTaxConstants }
  | { ok: false; missing: string[] };

/** Every tax constant still unsourced, including the bracket tables. */
export function missingTaxConstants(): string[] {
  const missing = (Object.keys(TAX_CONSTANTS) as TaxConstantKey[]).filter(
    (k) => TAX_CONSTANTS[k].value === null
  ) as string[];
  if (FEDERAL_BRACKETS.single.length === 0) missing.push("federalBrackets.single");
  if (FEDERAL_BRACKETS.married.length === 0) missing.push("federalBrackets.married");
  return missing;
}

/**
 * Narrow to plain numbers or report what is unsourced.
 *
 * Mirrors resolveCostConstants: a discriminated union rather than a throw or a
 * zero default, so "the tax model is not ready" is a state callers must handle
 * instead of silently estimating everyone's tax as zero.
 */
export function resolveTaxConstants(): TaxConstantsResolution {
  const missing = missingTaxConstants();
  if (missing.length > 0) return { ok: false, missing };

  const out = {} as ResolvedTaxConstants;
  for (const key of Object.keys(TAX_CONSTANTS) as TaxConstantKey[]) {
    (out as Record<string, unknown>)[key] = TAX_CONSTANTS[key].value as number;
  }
  out.brackets = { single: FEDERAL_BRACKETS.single, married: FEDERAL_BRACKETS.married };
  return { ok: true, constants: out };
}
