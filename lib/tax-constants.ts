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
 * Same discipline as lib/cost-constants.ts: every value starts null, is filled
 * from a named published source, and records the date it was retrieved. Tax
 * figures are indexed annually, so all of these need a yearly pass.
 *
 * HOW TO FILL THIS IN: set `value`, `sourceUrl`, and `sourcedOn` from the IRS
 * revenue procedure or publication for the relevant tax year, then run
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/verify-affordability.ts
 */
import type { CostConstant } from "./cost-constants";

/** Same identity helper as cost-constants: keeps `value` typed number | null. */
const constant = (c: CostConstant): CostConstant => c;

/** The tax year every figure in this file must come from. Keep them in sync. */
export const TAX_YEAR = 2026;

export const TAX_CONSTANTS = {
  /** Base standard deduction, single filer. */
  standardDeductionSingle: constant({
    value: null,
    unit: "USD per year",
    kind: "measured",
    source: `IRS standard deduction for tax year ${TAX_YEAR}, single filer`,
    sourceUrl: null,
    sourcedOn: null,
    refresh: "annual",
  }),

  /** Base standard deduction, married filing jointly. */
  standardDeductionMarried: constant({
    value: null,
    unit: "USD per year",
    kind: "measured",
    source: `IRS standard deduction for tax year ${TAX_YEAR}, married filing jointly`,
    sourceUrl: null,
    sourcedOn: null,
    refresh: "annual",
  }),

  /**
   * Extra standard deduction for a filer aged 65+. Matters here: most of this
   * audience qualifies, and omitting it overstates federal tax for them.
   */
  additionalDeduction65Single: constant({
    value: null,
    unit: "USD per year",
    kind: "measured",
    source: `IRS additional standard deduction for age 65+, ${TAX_YEAR}, single`,
    sourceUrl: null,
    sourcedOn: null,
    refresh: "annual",
  }),

  /** Extra standard deduction per qualifying spouse aged 65+, married filing jointly. */
  additionalDeduction65Married: constant({
    value: null,
    unit: "USD per year per qualifying spouse",
    kind: "measured",
    source: `IRS additional standard deduction for age 65+, ${TAX_YEAR}, married`,
    sourceUrl: null,
    sourcedOn: null,
    refresh: "annual",
  }),

  /**
   * Combined employee FICA rate: Social Security plus Medicare.
   * Applies to WAGES ONLY — not to pensions, retired pay, or benefits.
   */
  ficaRate: constant({
    value: null,
    unit: "fraction of wages",
    kind: "measured",
    source:
      "SSA/IRS employee payroll tax: Social Security 6.2% + Medicare 1.45%",
    sourceUrl: null,
    sourcedOn: null,
    refresh: "annual",
    note:
      "Employee share only. The Social Security portion stops at the wage " +
      "base below; the Medicare portion does not cap. Self-employment would " +
      "roughly double this, which the model does not handle.",
  }),

  /** Wage base above which the Social Security portion of FICA stops. */
  ficaSocialSecurityWageBase: constant({
    value: null,
    unit: "USD per year",
    kind: "measured",
    source: `SSA contribution and benefit base for ${TAX_YEAR}`,
    sourceUrl: null,
    sourcedOn: null,
    refresh: "annual",
    note:
      "Rarely binding for this audience — a veteran working part time is well " +
      "under it — but modeled so a full-time earner is not overcharged.",
  }),

  /* Social Security taxability. Benefits are taxed on a provisional-income
   * test, not a flat rule: below the first threshold none is taxable, between
   * the thresholds up to half, above the second up to 85%. Never 100%. */

  ssProvisionalThreshold1Single: constant({
    value: null,
    unit: "USD per year",
    kind: "measured",
    source: "IRS Publication 915, first provisional-income threshold, single",
    sourceUrl: null,
    sourcedOn: null,
    refresh: "rare",
    note:
      "These thresholds are NOT inflation-indexed and have been unchanged for " +
      "decades, so `rare` is correct — but confirm rather than assume.",
  }),

  ssProvisionalThreshold2Single: constant({
    value: null,
    unit: "USD per year",
    kind: "measured",
    source: "IRS Publication 915, second provisional-income threshold, single",
    sourceUrl: null,
    sourcedOn: null,
    refresh: "rare",
  }),

  ssProvisionalThreshold1Married: constant({
    value: null,
    unit: "USD per year",
    kind: "measured",
    source: "IRS Publication 915, first provisional-income threshold, MFJ",
    sourceUrl: null,
    sourcedOn: null,
    refresh: "rare",
  }),

  ssProvisionalThreshold2Married: constant({
    value: null,
    unit: "USD per year",
    kind: "measured",
    source: "IRS Publication 915, second provisional-income threshold, MFJ",
    sourceUrl: null,
    sourcedOn: null,
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
 * Kept out of TAX_CONSTANTS because a bracket table is not a scalar. Same
 * provenance discipline applies: leave empty until sourced from the IRS
 * revenue procedure for TAX_YEAR.
 */
export const FEDERAL_BRACKETS: {
  single: TaxBracket[];
  married: TaxBracket[];
  source: string;
  sourceUrl: string | null;
  sourcedOn: string | null;
} = {
  single: [],
  married: [],
  source: `IRS revenue procedure, ordinary income tax rate schedules for ${TAX_YEAR}`,
  sourceUrl: null,
  sourcedOn: null,
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
