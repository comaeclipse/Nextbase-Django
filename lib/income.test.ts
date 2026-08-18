/*
 * Behavior checks for the take-home income model.
 *
 * Runs on synthetic constants shaped like real ones, so the tax ARITHMETIC is
 * verified independently of whether the IRS figures in lib/tax-constants.ts
 * have been sourced yet. The numbers below are invented for testability and
 * are not the real brackets.
 */
import { describe, it, expect } from "vitest";
import {
  estimateNetMonthlyIncome,
  taxableSocialSecurity,
  applyBrackets,
  isStateTaxIrrelevant,
  seniorBonusDeduction,
  type IncomeSource,
  type StateTaxProfile,
} from "./income";
import type { ResolvedTaxConstants } from "./tax-constants";

const C: ResolvedTaxConstants = {
  standardDeductionSingle: 15_000,
  standardDeductionMarried: 30_000,
  additionalDeduction65Single: 2_000,
  additionalDeduction65Married: 1_600,
  seniorBonusDeduction: 6_000,
  seniorBonusPhaseOutStartSingle: 75_000,
  seniorBonusPhaseOutStartMarried: 150_000,
  seniorBonusPhaseOutRate: 0.06,
  ficaRate: 0.0765,
  ficaSocialSecurityWageBase: 170_000,
  ssProvisionalThreshold1Single: 25_000,
  ssProvisionalThreshold2Single: 34_000,
  ssProvisionalThreshold1Married: 32_000,
  ssProvisionalThreshold2Married: 44_000,
  brackets: {
    single: [
      { upTo: 11_000, rate: 0.1 },
      { upTo: 45_000, rate: 0.12 },
      { upTo: 95_000, rate: 0.22 },
      { upTo: null, rate: 0.24 },
    ],
    married: [
      { upTo: 22_000, rate: 0.1 },
      { upTo: 90_000, rate: 0.12 },
      { upTo: null, rate: 0.22 },
    ],
  },
};

const NO_TAX_STATE: StateTaxProfile = {
  stateIncomeTaxRatePct: 0,
  retiredPayTax: "no_income_tax",
  ssTaxTreatment: null,
};
const EXEMPT_STATE: StateTaxProfile = {
  stateIncomeTaxRatePct: 5,
  retiredPayTax: "exempt",
  ssTaxTreatment: null,
};
const TAXING_STATE: StateTaxProfile = {
  stateIncomeTaxRatePct: 5,
  retiredPayTax: "taxed",
  ssTaxTreatment: null,
};

const OPTS = { filing: "single" as const, age65Plus: true };
const src = (kind: IncomeSource["kind"], monthlyAmount: number): IncomeSource => ({
  kind,
  monthlyAmount,
});

describe("applyBrackets", () => {
  it("taxes progressively, not at a single marginal rate", () => {
    // 11,000 @ 10% = 1,100; next 9,000 @ 12% = 1,080
    expect(applyBrackets(20_000, C.brackets.single)).toBeCloseTo(2_180, 6);
  });

  it("returns zero at or below zero taxable income", () => {
    expect(applyBrackets(0, C.brackets.single)).toBe(0);
    expect(applyBrackets(-5_000, C.brackets.single)).toBe(0);
  });

  it("handles the open-ended top bracket", () => {
    // 1,100 + 4,080 + 11,000 + (105,000-95,000)*0.24 = 18,580
    expect(applyBrackets(105_000, C.brackets.single)).toBeCloseTo(18_580, 6);
  });
});

describe("taxableSocialSecurity", () => {
  it("taxes nothing below the first threshold", () => {
    expect(taxableSocialSecurity(20_000, 0, "single", C)).toBe(0);
  });

  it("never taxes more than 85% of benefits", () => {
    const ss = 30_000;
    const taxable = taxableSocialSecurity(ss, 200_000, "single", C);
    expect(taxable).toBeCloseTo(0.85 * ss, 6);
  });

  it("phases in between the thresholds", () => {
    const low = taxableSocialSecurity(24_000, 20_000, "single", C);
    const high = taxableSocialSecurity(24_000, 40_000, "single", C);
    expect(low).toBeGreaterThan(0);
    expect(high).toBeGreaterThan(low);
  });

  it("uses the higher married thresholds", () => {
    const single = taxableSocialSecurity(24_000, 20_000, "single", C);
    const married = taxableSocialSecurity(24_000, 20_000, "married", C);
    expect(married).toBeLessThan(single);
  });
});

describe("estimateNetMonthlyIncome", () => {
  it("does not tax VA disability, federally or by any state", () => {
    const sources = [src("va_disability", 4_000)];
    for (const state of [NO_TAX_STATE, EXEMPT_STATE, TAXING_STATE]) {
      const e = estimateNetMonthlyIncome(sources, state, OPTS, C);
      expect(e.netMonthly).toBeCloseTo(4_000, 6);
      expect(e.federalMonthly).toBe(0);
      expect(e.stateMonthly).toBe(0);
      expect(e.ficaMonthly).toBe(0);
    }
  });

  it("THE POINT: identical gross nets differently by income composition", () => {
    // Same $4,000/month, same state, three different lives.
    const disabilityOnly = estimateNetMonthlyIncome(
      [src("va_disability", 4_000)], TAXING_STATE, OPTS, C
    );
    const retiredPayOnly = estimateNetMonthlyIncome(
      [src("military_retirement", 4_000)], TAXING_STATE, OPTS, C
    );
    const working = estimateNetMonthlyIncome(
      [src("wages", 4_000)], TAXING_STATE, OPTS, C
    );

    expect(disabilityOnly.netMonthly).toBeGreaterThan(retiredPayOnly.netMonthly);
    // Wages carry FICA on top of the same income tax, so they net least.
    expect(retiredPayOnly.netMonthly).toBeGreaterThan(working.netMonthly);
    expect(working.ficaMonthly).toBeGreaterThan(0);
    expect(retiredPayOnly.ficaMonthly).toBe(0);
  });

  it("THE OTHER POINT: net income varies by state for the same household", () => {
    const sources = [src("military_retirement", 4_000)];
    const exempt = estimateNetMonthlyIncome(sources, EXEMPT_STATE, OPTS, C);
    const taxed = estimateNetMonthlyIncome(sources, TAXING_STATE, OPTS, C);

    expect(exempt.stateMonthly).toBe(0);
    expect(taxed.stateMonthly).toBeGreaterThan(0);
    expect(exempt.netMonthly).toBeGreaterThan(taxed.netMonthly);
  });

  it("state income tax is irrelevant to a disability-only household", () => {
    expect(isStateTaxIrrelevant([src("va_disability", 3_000)])).toBe(true);
    expect(
      isStateTaxIrrelevant([src("va_disability", 3_000), src("wages", 500)])
    ).toBe(false);
    // And the estimate says so in words the UI can surface.
    const e = estimateNetMonthlyIncome([src("va_disability", 3_000)], TAXING_STATE, OPTS, C);
    expect(e.notes.some((n) => /not taxed/i.test(n))).toBe(true);
  });

  it("applies FICA to wages only, never to benefits or retired pay", () => {
    const wages = estimateNetMonthlyIncome([src("wages", 3_000)], NO_TAX_STATE, OPTS, C);
    expect(wages.ficaMonthly).toBeCloseTo(3_000 * C.ficaRate, 6);

    for (const kind of ["military_retirement", "social_security", "pension_or_ira"] as const) {
      const e = estimateNetMonthlyIncome([src(kind, 3_000)], NO_TAX_STATE, OPTS, C);
      expect(e.ficaMonthly).toBe(0);
    }
  });

  it("caps the Social Security portion of FICA at the wage base", () => {
    const belowCap = estimateNetMonthlyIncome([src("wages", 10_000)], NO_TAX_STATE, OPTS, C);
    const aboveCap = estimateNetMonthlyIncome([src("wages", 20_000)], NO_TAX_STATE, OPTS, C);
    // Doubling wages past the cap must less than double FICA.
    expect(aboveCap.ficaMonthly).toBeLessThan(belowCap.ficaMonthly * 2);
  });

  it("applies the senior bonus in full below the phase-out", () => {
    expect(seniorBonusDeduction(40_000, 1, "single", C)).toBe(6_000);
    // Per qualifying individual: a couple both 65+ claims twice.
    expect(seniorBonusDeduction(40_000, 2, "married", C)).toBe(12_000);
    expect(seniorBonusDeduction(40_000, 0, "single", C)).toBe(0);
  });

  it("phases the senior bonus out at 6 cents per dollar over the threshold", () => {
    // $10k over the single threshold => 6,000 - 600 = 5,400
    expect(seniorBonusDeduction(85_000, 1, "single", C)).toBeCloseTo(5_400, 6);
    // Fully eliminated at $175k single, per the statute.
    expect(seniorBonusDeduction(175_000, 1, "single", C)).toBeCloseTo(0, 6);
    expect(seniorBonusDeduction(200_000, 1, "single", C)).toBe(0);
  });

  it("counts a 65+ spouse for both age deductions", () => {
    const sources = [src("military_retirement", 4_000)];
    const one = estimateNetMonthlyIncome(
      sources, NO_TAX_STATE, { filing: "married", age65Plus: true }, C
    );
    const both = estimateNetMonthlyIncome(
      sources, NO_TAX_STATE, { filing: "married", age65Plus: true, spouse65Plus: true }, C
    );
    expect(both.federalMonthly).toBeLessThan(one.federalMonthly);
  });

  it("gives a 65+ filer the larger standard deduction", () => {
    const sources = [src("military_retirement", 3_000)];
    const older = estimateNetMonthlyIncome(sources, NO_TAX_STATE, { filing: "single", age65Plus: true }, C);
    const younger = estimateNetMonthlyIncome(sources, NO_TAX_STATE, { filing: "single", age65Plus: false }, C);
    expect(older.federalMonthly).toBeLessThan(younger.federalMonthly);
  });

  it("flags partial and conditional retired-pay exemptions as conservative", () => {
    for (const classification of ["partial", "conditional"] as const) {
      const e = estimateNetMonthlyIncome(
        [src("military_retirement", 4_000)],
        { stateIncomeTaxRatePct: 5, retiredPayTax: classification, ssTaxTreatment: null },
        OPTS,
        C
      );
      expect(e.stateMonthly).toBeGreaterThan(0);
      expect(e.approximations.some((a) => /likely higher|may be higher/i.test(a))).toBe(true);
    }
  });

  it("exempts Social Security below a partial state's income threshold", () => {
    // A partial state taxes benefits only above a line. Under it, nothing.
    const under = estimateNetMonthlyIncome(
      [src("social_security", 1_800), src("pension_or_ira", 500)],
      {
        stateIncomeTaxRatePct: 5,
        retiredPayTax: "exempt",
        ssTaxTreatment: "partial",
        ssTaxThresholdSingle: 50_000,
      },
      OPTS,
      C
    );
    expect(under.stateMonthly).toBeCloseTo(500 * 12 * 0.05 / 12, 6); // pension only
    expect(under.notes.some((n) => /below the state/i.test(n))).toBe(true);
    expect(under.approximations).toHaveLength(0);
  });

  it("taxes Social Security above a partial state's threshold", () => {
    const over = estimateNetMonthlyIncome(
      [src("social_security", 2_500), src("pension_or_ira", 5_000)],
      {
        stateIncomeTaxRatePct: 5,
        retiredPayTax: "exempt",
        ssTaxTreatment: "partial",
        ssTaxThresholdSingle: 50_000,
      },
      OPTS,
      C
    );
    expect(over.taxableSocialSecurityAnnual).toBeGreaterThan(0);
    // State base includes the taxable SS on top of the pension.
    expect(over.stateMonthly).toBeGreaterThan(5_000 * 0.05);
  });

  it("falls back to assuming taxed when a partial state has no threshold", () => {
    const e = estimateNetMonthlyIncome(
      [src("social_security", 2_000), src("pension_or_ira", 3_000)],
      { stateIncomeTaxRatePct: 5, retiredPayTax: "exempt", ssTaxTreatment: "partial" },
      OPTS,
      C
    );
    expect(e.approximations.some((a) => /threshold is not on file/i.test(a))).toBe(true);
  });

  it("exempts a 65+ Colorado filer above the AGI threshold", () => {
    const colorado: StateTaxProfile = {
      stateIncomeTaxRatePct: 4.4,
      retiredPayTax: "taxed",
      ssTaxTreatment: "partial",
      ssTaxThresholdSingle: 75_000,
      ssTaxThresholdMarried: 95_000,
      ssTaxMinAge: 65,
      ssTaxAgeExemptsFully: true,
    };
    const e = estimateNetMonthlyIncome(
      [src("social_security", 2_000), src("pension_or_ira", 6_000)],
      colorado,
      { filing: "single", age65Plus: true },
      C
    );
    expect(e.stateMonthly).toBeCloseTo(6_000 * 0.044, 6);
    expect(e.notes.some((n) => /age 65 or older/i.test(n))).toBe(true);
  });

  it("still applies Colorado's AGI threshold under age 65", () => {
    const colorado: StateTaxProfile = {
      stateIncomeTaxRatePct: 4.4,
      retiredPayTax: "taxed",
      ssTaxTreatment: "partial",
      ssTaxThresholdSingle: 75_000,
      ssTaxThresholdMarried: 95_000,
      ssTaxMinAge: 65,
      ssTaxAgeExemptsFully: true,
    };
    const over = estimateNetMonthlyIncome(
      [src("social_security", 2_000), src("pension_or_ira", 6_000)],
      colorado,
      { filing: "single", age65Plus: false },
      C
    );
    expect(over.stateMonthly).toBeGreaterThan(6_000 * 0.044);
  });

  it("taxes a Rhode Island filer below full retirement age even under the AGI line", () => {
    const rhodeIsland: StateTaxProfile = {
      stateIncomeTaxRatePct: 3.75,
      retiredPayTax: "taxed",
      ssTaxTreatment: "partial",
      ssTaxThresholdSingle: 107_000,
      ssTaxThresholdMarried: 133_750,
      ssTaxMinAge: 67,
      ssTaxAgeExemptsFully: false,
    };
    const e = estimateNetMonthlyIncome(
      [src("social_security", 2_000), src("pension_or_ira", 3_000)],
      rhodeIsland,
      { filing: "single", age65Plus: false },
      C
    );
    expect(e.taxableSocialSecurityAnnual).toBeGreaterThan(0);
    expect(e.stateMonthly).toBeGreaterThan(3_000 * 0.0375);
    expect(e.notes.some((n) => /before the required retirement age/i.test(n))).toBe(
      true
    );
  });

  it("says so when a state does not tax benefits at all", () => {
    const e = estimateNetMonthlyIncome(
      [src("social_security", 2_000)],
      { stateIncomeTaxRatePct: 5, retiredPayTax: "exempt", ssTaxTreatment: "not_taxed" },
      OPTS,
      C
    );
    expect(e.stateMonthly).toBe(0);
    expect(e.notes.some((n) => /does not tax Social Security/i.test(n))).toBe(true);
  });

  it("reports the missing Social Security state treatment instead of guessing", () => {
    const e = estimateNetMonthlyIncome(
      [src("social_security", 2_500), src("pension_or_ira", 2_000)],
      TAXING_STATE,
      OPTS,
      C
    );
    expect(e.missing).toContain("state treatment of Social Security");
  });

  it("reports an unknown retired-pay classification rather than assuming exempt", () => {
    const e = estimateNetMonthlyIncome(
      [src("military_retirement", 4_000)],
      { stateIncomeTaxRatePct: 5, retiredPayTax: null, ssTaxTreatment: null },
      OPTS,
      C
    );
    expect(e.missing).toContain("state treatment of military retired pay");
    expect(e.stateMonthly).toBeGreaterThan(0); // conservative, not optimistic
  });

  it("handles the combined case the model exists for", () => {
    // Disability + retired pay + a part-time job, all at once.
    const e = estimateNetMonthlyIncome(
      [
        src("va_disability", 1_800),
        src("military_retirement", 2_200),
        src("wages", 1_500),
      ],
      TAXING_STATE,
      OPTS,
      C
    );
    expect(e.grossMonthly).toBe(5_500);
    expect(e.netMonthly).toBeLessThan(e.grossMonthly);
    // FICA touches only the $1,500 of wages.
    expect(e.ficaMonthly).toBeCloseTo(1_500 * C.ficaRate, 6);
    expect(e.effectiveRate).toBeGreaterThan(0);
    expect(e.effectiveRate).toBeLessThan(0.35);
  });

  it("returns zeros for an empty income mix rather than dividing by zero", () => {
    const e = estimateNetMonthlyIncome([], TAXING_STATE, OPTS, C);
    expect(e.grossMonthly).toBe(0);
    expect(e.netMonthly).toBe(0);
    expect(e.effectiveRate).toBe(0);
  });
});

describe("general senior state-income deduction (e.g. Montana)", () => {
  // Montana taxes Social Security exactly as the IRS does (no ss_tax_*
  // exemption) but subtracts a flat amount per 65+ filer from taxable income
  // generally. This is deliberately NOT expressed via ssTaxTreatment.
  const MONTANA_LIKE: StateTaxProfile = {
    stateIncomeTaxRatePct: 5,
    retiredPayTax: "taxed",
    ssTaxTreatment: "taxed",
    seniorDeductionAmount: 5_660,
    seniorDeductionMinAge: 65,
    seniorDeductionPerQualifyingPerson: true,
  };

  it("gives a 65+ filer the subtraction; a filer under 65 gets nothing", () => {
    const sources = [src("pension_or_ira", 3_000)];
    const older = estimateNetMonthlyIncome(
      sources, MONTANA_LIKE, { filing: "single", age65Plus: true }, C
    );
    const younger = estimateNetMonthlyIncome(
      sources, MONTANA_LIKE, { filing: "single", age65Plus: false }, C
    );
    expect(older.stateMonthly).toBeLessThan(younger.stateMonthly);
    // 5,660 less taxable, at 5% => 283/yr less state tax.
    expect(younger.stateMonthly - older.stateMonthly).toBeCloseTo(
      (5_660 * 0.05) / 12, 6
    );
  });

  it("does not touch Social Security's own taxed-as-IRS treatment", () => {
    const e = estimateNetMonthlyIncome(
      [src("social_security", 1_800), src("pension_or_ira", 3_000)],
      MONTANA_LIKE,
      { filing: "single", age65Plus: true },
      C
    );
    // Still taxed like the IRS taxes it -- no "does not tax" / threshold note.
    expect(
      e.notes.some((n) => /does not tax Social Security/i.test(n))
    ).toBe(false);
    expect(e.taxableSocialSecurityAnnual).toBeGreaterThan(0);
  });

  it("doubles the subtraction when both spouses are 65+", () => {
    const sources = [src("pension_or_ira", 6_000)];
    const one = estimateNetMonthlyIncome(
      sources, MONTANA_LIKE, { filing: "married", age65Plus: true }, C
    );
    const both = estimateNetMonthlyIncome(
      sources,
      MONTANA_LIKE,
      { filing: "married", age65Plus: true, spouse65Plus: true },
      C
    );
    expect(both.stateMonthly).toBeLessThan(one.stateMonthly);
    expect(one.stateMonthly - both.stateMonthly).toBeCloseTo(
      (5_660 * 0.05) / 12, 6
    );
  });

  it("gives one unit when only one spouse of a married couple is 65+", () => {
    const sources = [src("pension_or_ira", 6_000)];
    const none = estimateNetMonthlyIncome(
      sources,
      MONTANA_LIKE,
      { filing: "married", age65Plus: false, spouse65Plus: false },
      C
    );
    const one = estimateNetMonthlyIncome(
      sources,
      MONTANA_LIKE,
      { filing: "married", age65Plus: true, spouse65Plus: false },
      C
    );
    expect(none.stateMonthly - one.stateMonthly).toBeCloseTo(
      (5_660 * 0.05) / 12, 6
    );
  });

  it("never taxes taxable income below zero", () => {
    const e = estimateNetMonthlyIncome(
      [src("pension_or_ira", 200)],
      MONTANA_LIKE,
      { filing: "single", age65Plus: true },
      C
    );
    expect(e.stateMonthly).toBe(0);
  });

  it("flags an off-65 minimum age as an approximation", () => {
    const e = estimateNetMonthlyIncome(
      [src("pension_or_ira", 3_000)],
      { ...MONTANA_LIKE, seniorDeductionMinAge: 62 },
      { filing: "single", age65Plus: true },
      C
    );
    expect(
      e.approximations.some((a) => /begins at age 62/i.test(a))
    ).toBe(true);
  });

  it("does nothing for a state with no senior deduction on file", () => {
    const e = estimateNetMonthlyIncome(
      [src("pension_or_ira", 3_000)],
      TAXING_STATE,
      { filing: "single", age65Plus: true },
      C
    );
    expect(
      e.notes.some((n) => /general deduction for filers 65/i.test(n))
    ).toBe(false);
  });
});
