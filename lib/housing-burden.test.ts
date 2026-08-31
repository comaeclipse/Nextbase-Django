/*
 * Algebra and behavior checks for the housing-burden metric family
 * (issue #170 Phase B). Synthetic constants, same convention as
 * affordability.test.ts: the math is proven independently of the sourced
 * values.
 */
import { describe, it, expect } from "vitest";
import {
  BURDEN_BAND_BOUNDS,
  HOUSING_BURDEN_SHARE,
  affordabilityRatio,
  burdenBand,
  cityHousingBurden,
  housingBurden,
  requiredIncomeGross,
} from "./housing-burden";
import {
  estimateMonthlyCost,
  estimatePitiMonthly,
  type CostInputs,
} from "./affordability";
import type { ResolvedConstants } from "./cost-constants";

const C: ResolvedConstants = {
  nonHousingBaseline65Plus: 2000,
  nonHousingGoodsMonthly: 850,
  nonHousingOtherServicesMonthly: 750,
  nonHousingUnscaledMonthly: 400,
  modestNonHousingBaseline65Plus: 2000,
  modestNonHousingGoodsMonthly: 850,
  modestNonHousingOtherServicesMonthly: 750,
  modestNonHousingUnscaledMonthly: 400,
  modestNationalUtilitiesMonthly: 400,
  nationalMedianHomeValue: 400_000,
  medicarePartBMonthly: 185,
  medigapMonthly: 179,
  partDMonthly: 36,
  fallbackPropertyTaxRate: 0.01,
  annualMaintenanceRate: 0.01,
  mortgageRate30yr: 0.06,
  defaultDownPaymentFraction: 0.2,
  insuranceBenchmarkDwelling: 300_000,
  structureShareOfValue: 0.7,
  nationalUtilitiesMonthly: 400,
  onePerson65GoodsAnnual: 6000,
  twoPerson65GoodsAnnual: 12000,
  onePerson65OtherServicesAnnual: 6000,
  twoPerson65OtherServicesAnnual: 9000,
  onePerson65UtilitiesAnnual: 3000,
  twoPerson65UtilitiesAnnual: 4500,
  onePerson65UnscaledAnnual: 4000,
  twoPerson65UnscaledAnnual: 8000,
  modestHouseholdSize: 1.5,
  typicalHouseholdSize: 1.5,
  tricarePrimeIndividualMonthly: 30,
  tricarePrimeFamilyMonthly: 55,
  tricareSelectIndividualMonthly: 15,
  tricareSelectFamilyMonthly: 28,
  oecdSecondAdultWeight: 0.5,
  oecdDependentWeight: 0.3,
};

function loc(over: Partial<CostInputs> = {}): CostInputs {
  return {
    id: 1,
    name: "Testville",
    state: "Colorado",
    col_index: 100,
    avg_home_value: "400000",
    avg_home_value_display: null,
    goods_rpp: 100,
    utilities_rpp: 100,
    other_services_rpp: 100,
    bea_geo_type: "msa",
    ...over,
  } as CostInputs;
}

describe("housingBurden / burdenBand", () => {
  it("computes the proposal's worked example", () => {
    // $2,460/mo at $85k gross = 34.7%; at $140k = 21.1%.
    expect(housingBurden(2460, 85_000)!).toBeCloseTo(0.34729, 4);
    expect(housingBurden(2460, 140_000)!).toBeCloseTo(0.21086, 4);
    expect(burdenBand(2460, 85_000)).toBe("stretched");
    expect(burdenBand(2460, 140_000)).toBe("very_affordable");
  });

  it("bands at the documented boundaries, inclusive on the affordable side", () => {
    // Income 120k: annual housing at exactly each bound.
    const income = 120_000;
    expect(burdenBand((income * 0.25) / 12, income)).toBe("very_affordable");
    expect(burdenBand((income * 0.25) / 12 + 1, income)).toBe("affordable");
    expect(burdenBand((income * 0.3) / 12, income)).toBe("affordable");
    expect(burdenBand((income * 0.3) / 12 + 1, income)).toBe("stretched");
    expect(burdenBand((income * 0.35) / 12, income)).toBe("stretched");
    expect(burdenBand((income * 0.4) / 12, income)).toBe("difficult");
    expect(burdenBand((income * 0.4) / 12 + 1, income)).toBe(
      "severely_unaffordable"
    );
  });

  it("keeps the affordable bound and HOUSING_BURDEN_SHARE as one constant", () => {
    expect(BURDEN_BAND_BOUNDS.affordable).toBe(HOUSING_BURDEN_SHARE);
  });

  it("returns null on unusable inputs instead of a verdict", () => {
    expect(housingBurden(2460, 0)).toBeNull();
    expect(housingBurden(-1, 85_000)).toBeNull();
    expect(housingBurden(NaN, 85_000)).toBeNull();
    expect(burdenBand(2460, 0)).toBeNull();
  });
});

describe("requiredIncomeGross", () => {
  it("computes the proposal's worked example", () => {
    // $2,460/mo at the 30% rule -> $98,400/yr exactly.
    expect(requiredIncomeGross(2460)).toBe(98_400);
  });

  it("never contradicts its own band, including at non-round costs", () => {
    for (const monthly of [2460, 2460.37, 1878.1954, 4090.5, 500.04]) {
      const income = requiredIncomeGross(monthly)!;
      expect(Number.isInteger(income)).toBe(true);
      // At the printed required income, housing is affordable...
      const band = burdenBand(monthly, income);
      expect(band === "affordable" || band === "very_affordable").toBe(true);
      // ...and a dollar less crosses the 30% line. (True at realistic cost
      // magnitudes like these — for sub-dollar monthly costs a $1 income
      // step is too coarse for this to hold, which no real PITI produces.)
      expect(burdenBand(monthly, income - 1)).toBe("stretched");
    }
  });

  it("supports a non-default share and stays consistent with it", () => {
    const income = requiredIncomeGross(2460, 0.25)!;
    expect(2460 * 12).toBeLessThanOrEqual(income * 0.25);
    expect(income).toBeGreaterThan(requiredIncomeGross(2460, 0.3)!);
  });

  it("returns null on unusable inputs", () => {
    expect(requiredIncomeGross(0)).toBeNull();
    expect(requiredIncomeGross(2460, 0)).toBeNull();
  });
});

describe("affordabilityRatio", () => {
  it("computes the proposal's worked example", () => {
    expect(affordabilityRatio(120_000, 98_400)!).toBeCloseTo(1.2195, 4);
    expect(affordabilityRatio(120_000, 163_600)!).toBeCloseTo(0.7335, 4);
    expect(affordabilityRatio(0, 98_400)).toBeNull();
  });
});

describe("estimatePitiMonthly", () => {
  it("sums exactly P&I + tax + insurance + HOA — no maintenance, no utilities", () => {
    const piti = estimatePitiMonthly(loc(), 400_000, C, { hoaMonthly: 100 });
    // $320k at 6%/30yr: 3.2x the textbook $599.55 payment on $100k.
    expect(piti.principalAndInterest).toBeCloseTo(599.55 * 3.2, 0);
    // Fallback 1% tax on $400k.
    expect(piti.tax).toBeCloseTo(4000 / 12, 6);
    expect(piti.approximations.some((a) => /property tax/.test(a))).toBe(true);
    expect(piti.hoa).toBe(100);
    expect(piti.insurance).not.toBeNull();
    expect(piti.total).toBeCloseTo(
      piti.principalAndInterest + piti.tax + piti.insurance! + piti.hoa,
      6
    );
  });

  it("honors rate, down payment, and property-tax overrides", () => {
    const base = estimatePitiMonthly(loc(), 400_000, C);
    const cheaperRate = estimatePitiMonthly(loc(), 400_000, C, {
      mortgageRateOverride: 0.03,
    });
    expect(cheaperRate.principalAndInterest).toBeLessThan(base.principalAndInterest);

    const bigDown = estimatePitiMonthly(loc(), 400_000, C, {
      downPaymentFraction: 0.5,
    });
    expect(bigDown.principalAndInterest).toBeCloseTo(
      base.principalAndInterest * (0.5 / 0.8),
      6
    );

    const taxed = estimatePitiMonthly(loc(), 400_000, C, {
      propertyTaxRateOverride: 0.02,
    });
    expect(taxed.tax).toBeCloseTo(8000 / 12, 6);
    expect(taxed.approximations.some((a) => /property tax/.test(a))).toBe(false);
  });

  it("nulls the total when insurance cannot be priced, with a missing note", () => {
    const piti = estimatePitiMonthly(loc({ state: "Atlantis" }), 400_000, C);
    expect(piti.insurance).toBeNull();
    expect(piti.total).toBeNull();
    expect(piti.missing.some((m) => /insurance/.test(m))).toBe(true);
  });
});

describe("cityHousingBurden", () => {
  it("prices entry and median separately, entry needing less income", () => {
    const city = cityHousingBurden(
      loc({ entry_home_value: 200_000 }),
      C
    );
    expect(city.entry).not.toBeNull();
    expect(city.median).not.toBeNull();
    expect(city.entry!.homePrice).toBe(200_000);
    expect(city.median!.homePrice).toBe(400_000);
    expect(city.entry!.requiredIncome!).toBeLessThan(city.median!.requiredIncome!);
    // No salary given: burden/band/ratio stay null.
    expect(city.entry!.burden).toBeNull();
    expect(city.entry!.band).toBeNull();
    expect(city.entry!.ratio).toBeNull();
    expect(city.notPriced.length).toBeGreaterThan(0);
  });

  it("evaluates burden, band, and ratio at a salary", () => {
    const city = cityHousingBurden(loc({ entry_home_value: 200_000 }), C, {
      salaryAnnual: 100_000,
    });
    const entry = city.entry!;
    expect(entry.burden).toBeCloseTo(
      (entry.piti.total! * 12) / 100_000,
      6
    );
    expect(entry.band).toBe(burdenBand(entry.piti.total!, 100_000));
    expect(entry.ratio).toBeCloseTo(100_000 / entry.requiredIncome!, 6);
  });

  it("REGRESSION: PITI is exactly the buying tenure minus maintenance and utilities", () => {
    // The drift-pin between estimatePitiMonthly and housingCost's buying
    // path: if either twin changes alone (PMI, loan term, a new carrying
    // component), this identity breaks loudly instead of silently.
    const l = loc({ property_tax_rate: 0.015 });
    const buying = estimateMonthlyCost(l, "buying", C, { hoaMonthly: 120 }).housing!;
    const piti = estimatePitiMonthly(l, 400_000, C, { hoaMonthly: 120 }).total!;
    const maintenance = (400_000 * C.annualMaintenanceRate) / 12;
    const utilities = C.modestNationalUtilitiesMonthly; // RPP 100, modest default
    expect(buying).toBeCloseTo(piti + maintenance + utilities, 6);
  });

  it("threads hoaMonthly through cityHousingBurden's estimate options", () => {
    const withHoa = cityHousingBurden(loc({ entry_home_value: 200_000 }), C, {
      estimate: { hoaMonthly: 150 },
    });
    const without = cityHousingBurden(loc({ entry_home_value: 200_000 }), C);
    expect(withHoa.entry!.piti.total! - without.entry!.piti.total!).toBeCloseTo(150, 6);
  });

  it("refuses non-positive prices instead of banding them affordable", () => {
    const city = cityHousingBurden(
      loc({ entry_home_value: 0, avg_home_value: "0" }),
      C,
      { salaryAnnual: 100_000 }
    );
    expect(city.entry).toBeNull();
    expect(city.median).toBeNull();
  });

  it("returns null sides for missing data instead of guessing", () => {
    const noEntry = cityHousingBurden(loc(), C);
    expect(noEntry.entry).toBeNull();
    expect(noEntry.median).not.toBeNull();

    const noMedian = cityHousingBurden(
      loc({ avg_home_value: null, entry_home_value: 200_000 }),
      C
    );
    expect(noMedian.median).toBeNull();
    expect(noMedian.entry).not.toBeNull();
  });
});
