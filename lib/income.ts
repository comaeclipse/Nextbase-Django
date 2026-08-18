/*
 * Take-home income model for veteran households.
 *
 * WHY INCOME IS NOT A SINGLE NUMBER
 *
 * The cost model asks what a place costs. This asks what the household
 * actually has, and for this audience that cannot be answered from a gross
 * figure alone. The same $4,000/month behaves very differently depending on
 * where it comes from:
 *
 *   VA disability        federally tax-free, and no state taxes it
 *   Military retired pay federally taxable; state treatment varies widely
 *   Social Security      federally taxable only above a provisional-income
 *                        test, capped at 85%; state treatment varies
 *   Pension / IRA        federally taxable; state per its ordinary rate
 *   Wages                federally taxable, plus FICA, plus state
 *
 * A veteran living on disability alone is unaffected by state income tax, so
 * "move somewhere with no income tax" is noise for them. The same advice is
 * worth real money to someone drawing retired pay and working part time. A
 * scalar income input cannot tell those two people apart, and would rank
 * cities identically for both.
 *
 * The consequence worth noting: because state treatment varies, NET INCOME
 * VARIES BY LOCATION. Pairing this with lib/affordability.ts means both sides
 * of the comparison move per city, which is what makes the answer real.
 *
 * SCOPE — READ THIS BEFORE BUILDING ON IT
 *
 * This estimates take-home so places can be compared. It is not tax advice and
 * must never be presented as a tax liability or a filing aid. Known omissions,
 * all deliberate: itemized deductions, credits, dependents, self-employment
 * tax, capital gains, tax-exempt interest in the provisional-income test,
 * local/city income taxes, and state-specific deductions and exemptions.
 */
import type { RetiredPayTax } from "./types";
import type { ResolvedTaxConstants, TaxBracket } from "./tax-constants";

export type IncomeKind =
  | "va_disability"
  | "military_retirement"
  | "social_security"
  | "pension_or_ira"
  | "wages";

export interface IncomeSource {
  kind: IncomeKind;
  /** Gross dollars per month from this source. */
  monthlyAmount: number;
}

export type FilingStatus = "single" | "married";

/**
 * How a state treats Social Security benefits.
 *
 * Stored on locations_stateinfo. Callers pass null only when the row is
 * unsourced; the model flags that gap rather than guessing.
 */
export type SsTaxTreatment = "not_taxed" | "partial" | "taxed" | "unknown";

/** The state-level tax inputs the model needs for one location. */
export interface StateTaxProfile {
  /** Ordinary state income tax rate as a PERCENT (e.g. 4.4), or null. */
  stateIncomeTaxRatePct: number | null;
  /** From locations_stateinfo.retired_pay_tax. */
  retiredPayTax: RetiredPayTax | null;
  /** From locations_stateinfo.ss_tax_treatment. */
  ssTaxTreatment: SsTaxTreatment | null;
  /**
   * AGI at or below which the state exempts benefits entirely. Most states
   * that tax Social Security do so only above a threshold, and a fixed-income
   * retiree is usually under it — so having this turns a blanket "assume
   * taxed" into an actual answer.
   */
  ssTaxThresholdSingle?: number | null;
  ssTaxThresholdMarried?: number | null;
  /**
   * Age at year-end at or above which the SS exemption gate opens.
   * Null means no age condition. Compared against the UI's age65Plus flag:
   * under 65 fails any gate of 65+, and a gate older than 65 (Rhode Island
   * full retirement age) is treated as met for 65+ with an approximation.
   */
  ssTaxMinAge?: number | null;
  /**
   * If true, reaching ssTaxMinAge exempts benefits regardless of AGI
   * (Colorado 65+). If false, min age is required in addition to the
   * threshold (Rhode Island).
   */
  ssTaxAgeExemptsFully?: boolean | null;
  /**
   * General senior subtraction from state taxable income, dollars PER
   * QUALIFYING INDIVIDUAL — distinct from ssTaxTreatment because some states
   * (Montana, since TY2024) tax Social Security exactly as the IRS does and
   * instead subtract a flat amount from the combined taxable-income base.
   * Encoding that as an SS exemption would be false.
   */
  seniorDeductionAmount?: number | null;
  /** Age at which a filer qualifies for seniorDeductionAmount. */
  seniorDeductionMinAge?: number | null;
  /**
   * If true (Montana), each 65+ filer/spouse gets one unit. If false, the
   * amount is a household figure and is not multiplied by qualifying seniors.
   * Null/undefined means per-person, matching the statute that forced this.
   */
  seniorDeductionPerQualifyingPerson?: boolean | null;
}

/**
 * Whether this household meets a state's Social Security age gate.
 *
 * The UI only knows 65-or-older, so a gate of 67 (SSA full retirement age)
 * is treated as met for 65+ filers and flagged as an approximation.
 */
export function ssAgeGate(
  minAge: number | null | undefined,
  age65Plus: boolean
): { met: boolean; approximated: boolean } {
  if (minAge == null || minAge <= 0) return { met: true, approximated: false };
  if (!age65Plus) return { met: false, approximated: false };
  if (minAge <= 65) return { met: true, approximated: false };
  return { met: true, approximated: true };
}

export interface NetIncomeEstimate {
  grossMonthly: number;
  netMonthly: number;
  federalMonthly: number;
  ficaMonthly: number;
  stateMonthly: number;
  /** Portion of Social Security that ended up federally taxable, annualized. */
  taxableSocialSecurityAnnual: number;
  /** Total tax as a share of gross. Useful for showing why two places differ. */
  effectiveRate: number;
  /** Inputs absent entirely — the estimate is incomplete in a named way. */
  missing: string[];
  /** Inputs where a conservative assumption stood in for real data. */
  approximations: string[];
  /** Reader-facing facts worth surfacing, e.g. why state tax is irrelevant. */
  notes: string[];
}

/** Sum the monthly amounts for one kind. */
function monthlyFor(sources: IncomeSource[], kind: IncomeKind): number {
  return sources
    .filter((s) => s.kind === kind)
    .reduce((sum, s) => sum + Math.max(0, s.monthlyAmount), 0);
}

/** Progressive tax over ascending brackets. */
export function applyBrackets(taxable: number, brackets: TaxBracket[]): number {
  if (taxable <= 0 || brackets.length === 0) return 0;
  let tax = 0;
  let floor = 0;
  for (const bracket of brackets) {
    const ceiling = bracket.upTo ?? Infinity;
    if (taxable <= floor) break;
    const slice = Math.min(taxable, ceiling) - floor;
    if (slice > 0) tax += slice * bracket.rate;
    floor = ceiling;
    if (!Number.isFinite(ceiling)) break;
  }
  return tax;
}

/**
 * Federally taxable portion of Social Security benefits (IRS Pub. 915 logic).
 *
 * Benefits are never fully taxable — 85% is the ceiling — and are entirely
 * untaxed below the first threshold. Treating them as ordinary income would
 * badly overstate tax for exactly the low-income retirees this tool serves.
 *
 * Tax-exempt interest belongs in provisional income and is not modeled here;
 * omitting it understates tax slightly for households that hold munis.
 */
export function taxableSocialSecurity(
  annualSocialSecurity: number,
  otherTaxableAnnual: number,
  filing: FilingStatus,
  c: ResolvedTaxConstants
): number {
  if (annualSocialSecurity <= 0) return 0;

  const t1 =
    filing === "married"
      ? c.ssProvisionalThreshold1Married
      : c.ssProvisionalThreshold1Single;
  const t2 =
    filing === "married"
      ? c.ssProvisionalThreshold2Married
      : c.ssProvisionalThreshold2Single;

  const provisional = otherTaxableAnnual + 0.5 * annualSocialSecurity;
  if (provisional <= t1) return 0;

  if (provisional <= t2) {
    return Math.min(0.5 * (provisional - t1), 0.5 * annualSocialSecurity);
  }
  const middleBand = Math.min(0.5 * (t2 - t1), 0.5 * annualSocialSecurity);
  return Math.min(
    0.85 * (provisional - t2) + middleBand,
    0.85 * annualSocialSecurity
  );
}

/**
 * The OBBBA senior bonus deduction after its MAGI phase-out.
 *
 * TEMPORARY: tax years 2025-2028. When TAX_YEAR passes 2028 this must return 0
 * and the constants should be deleted rather than left to quietly keep
 * applying a deduction that no longer exists.
 *
 * Rarely reduced for this audience — a fixed-income veteran is well under the
 * threshold — but a retiree working full time can cross it.
 */
export function seniorBonusDeduction(
  magi: number,
  qualifying65Count: number,
  filing: FilingStatus,
  c: ResolvedTaxConstants
): number {
  if (qualifying65Count <= 0) return 0;

  const full = c.seniorBonusDeduction * qualifying65Count;
  const threshold =
    filing === "married"
      ? c.seniorBonusPhaseOutStartMarried
      : c.seniorBonusPhaseOutStartSingle;

  const excess = Math.max(0, magi - threshold);
  return Math.max(0, full - excess * c.seniorBonusPhaseOutRate);
}

/**
 * Whether a state taxes military retired pay, given its classification.
 *
 * `partial` and `conditional` are treated as FULLY taxable and flagged. Both
 * mean the real burden is somewhere between zero and full — partial exempts
 * some fixed amount, conditional depends on age or income we do not model.
 * Assuming the worst understates take-home, which is the safe direction to err
 * for someone deciding where to live; the flag tells the reader the true
 * figure is likely better.
 */
function retiredPayStateTaxable(
  classification: RetiredPayTax | null,
  approximations: string[],
  missing: string[]
): boolean {
  switch (classification) {
    case "no_income_tax":
    case "exempt":
      return false;
    case "taxed":
      return true;
    case "partial":
      approximations.push(
        "state partially exempts military retired pay; assumed fully taxed, so actual take-home is likely higher"
      );
      return true;
    case "conditional":
      approximations.push(
        "state exempts military retired pay under conditions (typically age or income); assumed fully taxed, so actual take-home may be higher"
      );
      return true;
    case "unknown":
    case null:
    default:
      missing.push("state treatment of military retired pay");
      return true;
  }
}

/**
 * Estimate monthly take-home for one household in one state.
 *
 * Returns a breakdown rather than a single number so a caller can explain the
 * difference between two places instead of asserting it.
 */
export function estimateNetMonthlyIncome(
  sources: IncomeSource[],
  state: StateTaxProfile,
  opts: {
    filing: FilingStatus;
    age65Plus: boolean;
    /** Married only: whether the spouse also qualifies for age-65 amounts. */
    spouse65Plus?: boolean;
  },
  c: ResolvedTaxConstants
): NetIncomeEstimate {
  const missing: string[] = [];
  const approximations: string[] = [];
  const notes: string[] = [];

  const vaMonthly = monthlyFor(sources, "va_disability");
  const retiredMonthly = monthlyFor(sources, "military_retirement");
  const ssMonthly = monthlyFor(sources, "social_security");
  const pensionMonthly = monthlyFor(sources, "pension_or_ira");
  const wagesMonthly = monthlyFor(sources, "wages");

  const grossMonthly =
    vaMonthly + retiredMonthly + ssMonthly + pensionMonthly + wagesMonthly;

  const va = vaMonthly * 12;
  const retired = retiredMonthly * 12;
  const ss = ssMonthly * 12;
  const pension = pensionMonthly * 12;
  const wages = wagesMonthly * 12;

  if (va > 0) {
    notes.push(
      "VA disability compensation is not taxed federally or by any state."
    );
  }

  /* ---- FICA: wages only ---- */
  const socialSecurityTaxedWages = Math.min(wages, c.ficaSocialSecurityWageBase);
  // 6.2% capped at the wage base, 1.45% uncapped. Derived from the combined
  // rate so there is a single sourced constant rather than two.
  const medicareRate = 0.0145;
  const socialSecurityRate = c.ficaRate - medicareRate;
  const ficaAnnual =
    socialSecurityTaxedWages * socialSecurityRate + wages * medicareRate;

  /* ---- Federal ---- */
  const otherTaxable = retired + pension + wages;
  const taxableSS = taxableSocialSecurity(ss, otherTaxable, opts.filing, c);

  const baseDeduction =
    opts.filing === "married"
      ? c.standardDeductionMarried
      : c.standardDeductionSingle;

  // Both age-65 deductions are per qualifying INDIVIDUAL, so a couple where
  // both are 65+ claims each amount twice.
  const qualifying65 =
    (opts.age65Plus ? 1 : 0) +
    (opts.filing === "married" && opts.spouse65Plus ? 1 : 0);

  const ageDeduction =
    qualifying65 *
    (opts.filing === "married"
      ? c.additionalDeduction65Married
      : c.additionalDeduction65Single);

  // The OBBBA senior bonus stacks on top of the standard and 63(f) amounts,
  // and phases out on MAGI. AGI stands in for MAGI here; the model has none of
  // the add-backs that separate them.
  const magi = otherTaxable + taxableSS;
  const seniorBonus = seniorBonusDeduction(magi, qualifying65, opts.filing, c);
  if (seniorBonus > 0) {
    notes.push(
      "Includes the temporary senior deduction for filers 65 and older, which expires after tax year 2028."
    );
  }

  const federalTaxableIncome = Math.max(
    0,
    otherTaxable + taxableSS - (baseDeduction + ageDeduction + seniorBonus)
  );
  const brackets =
    opts.filing === "married" ? c.brackets.married : c.brackets.single;
  const federalAnnual = applyBrackets(federalTaxableIncome, brackets);

  /* ---- State ---- */
  let stateAnnual = 0;
  const rate = state.stateIncomeTaxRatePct;
  // States phrase their Social Security exemption against an income measure
  // close to federal AGI. Reusing the federal figure is an approximation --
  // state AGI starts from it but each state adjusts -- and it is far closer
  // than ignoring the threshold entirely.
  const magiForStateTest = magi;

  if (rate === null) {
    missing.push("state income tax rate");
  } else if (rate === 0) {
    notes.push("This state has no income tax.");
  } else {
    let stateBase = pension + wages;

    if (retired > 0 && retiredPayStateTaxable(state.retiredPayTax, approximations, missing)) {
      stateBase += retired;
    }

    if (ss > 0) {
      const threshold =
        opts.filing === "married"
          ? state.ssTaxThresholdMarried
          : state.ssTaxThresholdSingle;

      switch (state.ssTaxTreatment) {
        case "not_taxed":
          notes.push("This state does not tax Social Security benefits.");
          break;
        case "taxed":
          stateBase += taxableSS;
          break;
        case "partial": {
          // Age gate first. Colorado 65+ is fully exempt regardless of AGI.
          // Rhode Island requires full retirement age *and* the AGI line.
          const gate = ssAgeGate(state.ssTaxMinAge, opts.age65Plus);
          if (state.ssTaxAgeExemptsFully && gate.met) {
            notes.push(
              "This state does not tax Social Security benefits at age 65 or older."
            );
            break;
          }
          if (!gate.met && !state.ssTaxAgeExemptsFully) {
            stateBase += taxableSS;
            notes.push(
              "This state taxes Social Security benefits before the required retirement age."
            );
            break;
          }
          if (gate.approximated) {
            approximations.push(
              `state Social Security exemption requires age ${state.ssTaxMinAge}+; modeled using the 65-or-older flag`
            );
          }
          // A `partial` state exempts benefits below an income line. With the
          // line on file this is a calculation; without it, fall back to
          // assuming taxed and say so. Colorado under 65 falls through here
          // (the 55–64 AGI test).
          if (threshold === null || threshold === undefined) {
            approximations.push(
              "state partially taxes Social Security but the income threshold is not on file; assumed fully taxed"
            );
            stateBase += taxableSS;
          } else if (magiForStateTest <= threshold) {
            notes.push(
              "This household's income is below the state's Social Security exemption threshold, so benefits are not taxed here."
            );
          } else {
            stateBase += taxableSS;
          }
          break;
        }
        default:
          // Most states do not tax benefits, so assuming taxed would overstate
          // the burden for most of them -- but guessing either way is worse
          // than saying we do not know.
          missing.push("state treatment of Social Security");
          break;
      }
    }

    // A general senior subtraction from state taxable income, not an SS
    // exemption (see seniorDeductionAmount doc comment). Applied after the
    // base is assembled so it offsets retired pay / SS / pension / wages
    // alike — Montana starts from federal taxable income and then subtracts.
    const stateBaseBeforeSeniorDeduction = stateBase;
    if (
      state.seniorDeductionAmount &&
      qualifying65 > 0 &&
      stateBaseBeforeSeniorDeduction > 0
    ) {
      if (
        state.seniorDeductionMinAge != null &&
        state.seniorDeductionMinAge !== 65
      ) {
        approximations.push(
          `this state's senior deduction begins at age ${state.seniorDeductionMinAge}; the 65+ filing flag is used as an approximation`
        );
      }
      const units =
        state.seniorDeductionPerQualifyingPerson === false ? 1 : qualifying65;
      const deduction = units * state.seniorDeductionAmount;
      stateBase = Math.max(0, stateBase - deduction);
      notes.push(
        "Includes this state's general deduction for filers 65 and older, which reduces taxable income regardless of source."
      );
    }

    stateAnnual = stateBase * (rate / 100);

    if (stateBaseBeforeSeniorDeduction === 0 && grossMonthly > 0) {
      notes.push(
        "None of this household's income is taxable by this state, so its income tax rate does not affect them."
      );
    }
  }

  const totalTaxAnnual = federalAnnual + ficaAnnual + stateAnnual;
  const netMonthly = grossMonthly - totalTaxAnnual / 12;

  return {
    grossMonthly,
    netMonthly,
    federalMonthly: federalAnnual / 12,
    ficaMonthly: ficaAnnual / 12,
    stateMonthly: stateAnnual / 12,
    taxableSocialSecurityAnnual: taxableSS,
    effectiveRate: grossMonthly > 0 ? totalTaxAnnual / (grossMonthly * 12) : 0,
    missing,
    approximations,
    notes,
  };
}

/**
 * True when no source in the mix can be touched by a state income tax.
 *
 * Lets a caller correctly tell a disability-only household that state tax is
 * irrelevant to them, instead of showing a comparison that implies otherwise.
 */
export function isStateTaxIrrelevant(sources: IncomeSource[]): boolean {
  const exposed: IncomeKind[] = [
    "military_retirement",
    "social_security",
    "pension_or_ira",
    "wages",
  ];
  return !sources.some(
    (s) => s.monthlyAmount > 0 && exposed.includes(s.kind)
  );
}
