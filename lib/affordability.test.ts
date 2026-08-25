/*
 * Algebra and behavior checks for the fixed-income cost model.
 *
 * These run on synthetic constants, so they verify the MATH independently of
 * whether the real national constants in lib/cost-constants.ts have been
 * sourced yet (Phase 0). That separation is deliberate: it means the model can
 * be proven correct before anyone looks up a BLS table.
 */
import { describe, it, expect } from "vitest";
import {
  COMFORT_COST_SHARE,
  nonHousingIndex,
  estimateMonthlyCost,
  assessAffordability,
  incomeTargets,
  rankByHeadroom,
  type CostEstimate,
  type CostInputs,
  type Tenure,
} from "./affordability";
import { resolveCostConstants, type ResolvedConstants } from "./cost-constants";

/**
 * Round synthetic constants chosen to make the arithmetic checkable by hand.
 * medigapMonthly + partDMonthly = 215, matching the old combined
 * supplementalHealthMonthly this file used before it was split — so every
 * test below that sums to 400 (185 + 215) is unaffected by the split.
 */
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
};

/**
 * Minimal location. Only the fields the model reads matter; the cast keeps the
 * test from having to enumerate every unrelated LocationRow column.
 */
function loc(over: Partial<CostInputs> = {}): CostInputs {
  return {
    id: 1,
    name: "Testville",
    state: "Colorado", // full name — the model resolves it to an abbr for insurance
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

describe("nonHousingIndex", () => {
  it("returns exactly 100 when every RPP component is 100", () => {
    expect(nonHousingIndex(loc(), C)).toBeCloseTo(100, 6);
  });

  it("scales goods and other services independently instead of averaging them", () => {
    // 850 at 120 and 750 at 100, plus 400 unscaled at 100:
    // (850*120 + 750*100 + 400*100) / 2000 = 108.5
    // A naive average of 120 and 100 would be 110.
    expect(
      nonHousingIndex(loc({ goods_rpp: 120, other_services_rpp: 100 }), C)
    ).toBeCloseTo(108.5, 6);
  });

  it("does not scale cash contributions and pensions", () => {
    const e = estimateMonthlyCost(
      loc({ goods_rpp: 200, other_services_rpp: 200, median_rent: 0 }),
      "rent",
      C
    );
    expect(e.nonHousing).toBeCloseTo(850 * 2 + 750 * 2 + 400, 6);
  });

  it("returns null when RPP is absent", () => {
    expect(
      nonHousingIndex(loc({ goods_rpp: null, other_services_rpp: null }), C)
    ).toBeNull();
  });

  it("labels a state nonmetro match as an approximation", () => {
    const approximations: string[] = [];
    const result = nonHousingIndex(
      loc({
        bea_geo_type: "nonmetro_state",
        bea_geo_name: "Iowa (Nonmetropolitan Portion)",
      }),
      C,
      approximations
    );
    expect(result).toBeCloseTo(100, 6);
    expect(approximations[0]).toMatch(/nonmetropolitan/i);
  });
});

describe("estimateMonthlyCost", () => {
  it("sums housing, scaled non-housing, and location-invariant premiums", () => {
    const e = estimateMonthlyCost(loc(), "own_outright", C);

    // nonHousingIndex = 100 -> baseline unscaled
    expect(e.nonHousing).toBeCloseTo(2000, 6);
    expect(e.nationalFixed).toBe(400);
    expect(e.monthlyCost).toBeCloseTo(e.housing! + 2000 + 400, 6);
  });

  it("prices owning outright below buying with a mortgage", () => {
    const outright = estimateMonthlyCost(loc(), "own_outright", C).monthlyCost!;
    const buying = estimateMonthlyCost(loc(), "buying", C).monthlyCost!;
    expect(outright).toBeLessThan(buying);
  });

  it("computes mortgage principal and interest correctly", () => {
    // $400k at 20% down = $320k financed, 6% / 30yr. The textbook payment on
    // $100k at 6% is $599.55, so $320k is 3.2x that.
    const outright = estimateMonthlyCost(loc(), "own_outright", C).monthlyCost!;
    const buying = estimateMonthlyCost(loc(), "buying", C).monthlyCost!;
    expect(buying - outright).toBeCloseTo(599.55 * 3.2, 0);
  });

  it("scales homeowners insurance with the home's insured value", () => {
    // The published premium is benchmarked at a fixed dwelling amount, so
    // applying it flat would charge an $80k home and a $1.6M home the same.
    // Zero out every other housing component so `housing` IS the premium and
    // the scaling can be asserted exactly rather than approximately.
    const insuranceOnly = {
      ...C,
      fallbackPropertyTaxRate: 0,
      annualMaintenanceRate: 0,
      nationalUtilitiesMonthly: 0,
      modestNationalUtilitiesMonthly: 0,
    };
    const cheap = estimateMonthlyCost(loc(), "own_outright", insuranceOnly, {
      homePriceOverride: 200_000,
    }).housing!;
    const dear = estimateMonthlyCost(loc(), "own_outright", insuranceOnly, {
      homePriceOverride: 800_000,
    }).housing!;

    expect(cheap).toBeGreaterThan(0);
    expect(dear / cheap).toBeCloseTo(4, 6);
  });

  it("honors a home price override for people not buying the city average", () => {
    const avg = estimateMonthlyCost(loc(), "own_outright", C).monthlyCost!;
    const downsized = estimateMonthlyCost(loc(), "own_outright", C, {
      homePriceOverride: 200_000,
    }).monthlyCost!;
    expect(downsized).toBeLessThan(avg);
  });

  it("blocks the rent path until median rent is ingested", () => {
    const e = estimateMonthlyCost(loc(), "rent", C);
    expect(e.monthlyCost).toBeNull();
    expect(e.missing).toContain("median rent");
  });

  it("prices rent directly once median rent is present", () => {
    const e = estimateMonthlyCost(loc({ median_rent: 1500 }), "rent", C);
    expect(e.housing).toBe(1500);
    expect(e.monthlyCost).toBeCloseTo(1500 + 2000 + 400, 6);
    expect(e.missing).toHaveLength(0);
  });

  it("REGRESSION: charges utilities to owners but not renters, scaled by local RPP", () => {
    const rent = estimateMonthlyCost(loc({ median_rent: 1500 }), "rent", C).housing!;
    expect(rent).toBe(1500);

    const owned = estimateMonthlyCost(loc(), "own_outright", C).housing!;
    const withoutUtilities = estimateMonthlyCost(loc(), "own_outright", {
      ...C,
      nationalUtilitiesMonthly: 0,
      modestNationalUtilitiesMonthly: 0,
    }).housing!;
    expect(owned - withoutUtilities).toBeCloseTo(C.modestNationalUtilitiesMonthly, 6);

    const expensiveUtilities = estimateMonthlyCost(
      loc({ utilities_rpp: 150 }),
      "own_outright",
      C
    ).housing!;
    expect(expensiveUtilities - withoutUtilities).toBeCloseTo(
      C.modestNationalUtilitiesMonthly * 1.5,
      6
    );
  });

  it("labels the national property tax fallback as an approximation", () => {
    const e = estimateMonthlyCost(loc(), "own_outright", C);
    expect(e.approximations.some((a) => /property tax/i.test(a))).toBe(true);
  });

  it("uses local property tax without approximating when available", () => {
    const e = estimateMonthlyCost(
      loc({ property_tax_rate: 0.02 }),
      "own_outright",
      C
    );
    expect(e.approximations.some((a) => /property tax/i.test(a))).toBe(false);
    // Double the tax rate must cost more than the 1% fallback.
    const fallback = estimateMonthlyCost(loc(), "own_outright", C).monthlyCost!;
    expect(e.monthlyCost!).toBeGreaterThan(fallback);
  });

  it("returns a null total, not a partial one, when any component is missing", () => {
    const e = estimateMonthlyCost(
      loc({ goods_rpp: null, other_services_rpp: null, utilities_rpp: null }),
      "own_outright",
      C
    );
    expect(e.monthlyCost).toBeNull();
    expect(e.missing).toContain("BEA regional price parity");
    expect(e.housing).toBeNull();
  });
});

describe("healthCoverage", () => {
  // Real, sourced national constants — these tests pin the actual dollar
  // figures from lib/cost-constants.ts, not the synthetic C above, because
  // the acceptance criteria for issue #60 are about the real numbers a user
  // sees: $455.90 default, $202.90 VA-primary, $253 difference.
  const resolution = resolveCostConstants();
  if (!resolution.ok) {
    throw new Error(
      `Real cost constants are unsourced (${resolution.missing.join(", ")}); ` +
        "healthCoverage acceptance tests require Phase 0 to be complete."
    );
  }
  const real = resolution.constants;

  it("defaults to medicare_supplement at exactly $455.90/month fixed health cost", () => {
    const e = estimateMonthlyCost(loc({ median_rent: 1000 }), "rent", real);
    expect(e.healthCoverage).toBe("medicare_supplement");
    expect(e.nationalFixed).toBeCloseTo(455.9, 6);
  });

  it("omitting healthCoverage entirely matches the explicit default (backward compatible)", () => {
    const withDefault = estimateMonthlyCost(
      loc({ median_rent: 1000 }),
      "rent",
      real,
      { healthCoverage: "medicare_supplement" }
    );
    const omitted = estimateMonthlyCost(loc({ median_rent: 1000 }), "rent", real);
    expect(omitted.nationalFixed).toBe(withDefault.nationalFixed);
    expect(omitted.monthlyCost).toBe(withDefault.monthlyCost);
  });

  it("va_primary is exactly $202.90/month fixed health cost — Part B only", () => {
    const e = estimateMonthlyCost(loc({ median_rent: 1000 }), "rent", real, {
      healthCoverage: "va_primary",
    });
    expect(e.nationalFixed).toBeCloseTo(202.9, 6);
    expect(e.nationalFixed).toBe(real.medicarePartBMonthly);
  });

  it("switching to va_primary reduces monthlyCost (and increases leftover) by exactly $253", () => {
    const location = loc({ median_rent: 1000 });
    const defaultCost = estimateMonthlyCost(location, "rent", real).monthlyCost!;
    const vaCost = estimateMonthlyCost(location, "rent", real, {
      healthCoverage: "va_primary",
    }).monthlyCost!;

    expect(defaultCost - vaCost).toBeCloseTo(253, 6);

    // Leftover (headroom) moves by exactly the same $253, in a household's
    // favor, since income is unchanged and only the coverage choice moved.
    const income = 3000;
    const defaultHeadroom = income - defaultCost;
    const vaHeadroom = income - vaCost;
    expect(vaHeadroom - defaultHeadroom).toBeCloseTo(253, 6);
  });

  it("does not touch housing or non-housing terms — only nationalFixed moves", () => {
    const location = loc({ median_rent: 1000 });
    const defaultEstimate = estimateMonthlyCost(location, "rent", real);
    const vaEstimate = estimateMonthlyCost(location, "rent", real, {
      healthCoverage: "va_primary",
    });
    expect(vaEstimate.housing).toBe(defaultEstimate.housing);
    expect(vaEstimate.nonHousing).toBe(defaultEstimate.nonHousing);
  });

  it("keeps Part B in both coverage paths", () => {
    const defaultEstimate = estimateMonthlyCost(loc({ median_rent: 1000 }), "rent", real);
    const vaEstimate = estimateMonthlyCost(loc({ median_rent: 1000 }), "rent", real, {
      healthCoverage: "va_primary",
    });
    expect(defaultEstimate.nationalFixed).toBeGreaterThanOrEqual(real.medicarePartBMonthly);
    expect(vaEstimate.nationalFixed).toBe(real.medicarePartBMonthly);
  });

  it("flags unknown VA access as missingContext, never as missing or a null total", () => {
    const e = estimateMonthlyCost(loc({ median_rent: 1000 }), "rent", real, {
      healthCoverage: "va_primary",
    });
    expect(e.missingContext.length).toBeGreaterThan(0);
    expect(e.missingContext.some((m) => /va healthcare access/i.test(m))).toBe(true);
    expect(e.missing).toHaveLength(0);
    expect(e.monthlyCost).not.toBeNull();
  });

  it("does not change the affordability band for an otherwise fully-priced city", () => {
    const location = loc({ median_rent: 1000 });
    const income = 3000;
    const vaEstimate = estimateMonthlyCost(location, "rent", real, {
      healthCoverage: "va_primary",
    });
    const band = assessAffordability(vaEstimate, income).band;
    // va_primary is strictly cheaper, so it must never read "unknown" or a
    // worse band than the default coverage would for the same income.
    const defaultBand = assessAffordability(
      estimateMonthlyCost(location, "rent", real),
      income
    ).band;
    expect(band).not.toBe("unknown");
    expect(["comfortable", "tight", "over"]).toContain(band);
    const rank = { comfortable: 0, tight: 1, over: 2, unknown: 3 } as const;
    expect(rank[band]).toBeLessThanOrEqual(rank[defaultBand]);
  });

  it("names VA copays/medication as an omission, not an estimate", () => {
    const e = estimateMonthlyCost(loc({ median_rent: 1000 }), "rent", real, {
      healthCoverage: "va_primary",
    });
    expect(e.missingContext.some((m) => /copay/i.test(m))).toBe(true);
  });

  it("does not reorder fully-priced cities — the adjustment is household-wide, not per-city", () => {
    const cities = [
      loc({ id: 1, name: "Expensive", goods_rpp: 120, other_services_rpp: 120 }),
      loc({ id: 2, name: "Cheap", goods_rpp: 85, other_services_rpp: 85 }),
      loc({ id: 3, name: "Mid" }),
    ];
    const order = (healthCoverage: "medicare_supplement" | "va_primary") =>
      rankByHeadroom(cities, 4000, "own_outright", real, { healthCoverage }).map(
        (r) => r.location.id
      );
    expect(order("va_primary")).toEqual(order("medicare_supplement"));
  });
});

describe("assessAffordability", () => {
  const estimate = (cost: number | null): CostEstimate => ({
    spendingProfile: "modest",
    healthCoverage: "medicare_supplement",
    monthlyCost: cost,
    housing: 0,
    nonHousing: 0,
    nationalFixed: 0,
    nonHousingIndex: 100,
    missing: [],
    approximations: [],
    missingContext: [],
  });

  it("bands at 80% and 100% of income", () => {
    expect(assessAffordability(estimate(2400), 3000).band).toBe("comfortable");
    expect(assessAffordability(estimate(2401), 3000).band).toBe("tight");
    expect(assessAffordability(estimate(3000), 3000).band).toBe("tight");
    expect(assessAffordability(estimate(3001), 3000).band).toBe("over");
  });

  it("reports headroom in dollars", () => {
    expect(assessAffordability(estimate(2500), 3000).headroom).toBe(500);
    expect(assessAffordability(estimate(3500), 3000).headroom).toBe(-500);
  });

  it("bands an incomputable estimate as unknown, not as unaffordable", () => {
    const unknown = assessAffordability(
      { ...estimate(null), missing: ["median rent"] },
      3000
    );
    expect(unknown.band).toBe("unknown");
    expect(unknown.headroom).toBeNull();
  });
});

describe("incomeTargets", () => {
  const estimate = (cost: number | null): CostEstimate => ({
    spendingProfile: "modest",
    healthCoverage: "medicare_supplement",
    monthlyCost: cost,
    housing: 0,
    nonHousing: 0,
    nationalFixed: 0,
    nonHousingIndex: 100,
    missing: [],
    approximations: [],
    missingContext: [],
  });

  it("is the exact inverse of the banding thresholds", () => {
    const e = estimate(2400);
    const targets = incomeTargets(e)!;

    // At the comfortable target the band is comfortable; a dollar under, tight.
    expect(assessAffordability(e, targets.comfortable).band).toBe("comfortable");
    expect(assessAffordability(e, targets.comfortable - 1).band).toBe("tight");

    // At break-even the band is tight; a dollar under, over.
    expect(assessAffordability(e, targets.breakEven).band).toBe("tight");
    expect(assessAffordability(e, targets.breakEven - 1).band).toBe("over");
  });

  it("holds at non-round costs where the naive quotient would band tight", () => {
    // For these costs `c <= (c / 0.8) * 0.8` is FALSE in doubles — without
    // the whole-dollar ceiling the "comfortable" target bands as tight at its
    // own number. Real monthlyCost values are arbitrary sums of index
    // products, so the FP-friendly 2400 above is the exception, not the rule.
    for (const cost of [500.04, 1878.1954]) {
      const e = estimate(cost);
      const targets = incomeTargets(e)!;
      expect(Number.isInteger(targets.breakEven)).toBe(true);
      expect(Number.isInteger(targets.comfortable)).toBe(true);
      expect(assessAffordability(e, targets.comfortable).band).toBe(
        "comfortable"
      );
      expect(assessAffordability(e, targets.breakEven).band).toBe("tight");
      expect(assessAffordability(e, targets.breakEven - 1).band).toBe("over");
    }
  });

  it("keeps the comfortable cushion at 1 - COMFORT_COST_SHARE of income", () => {
    const targets = incomeTargets(estimate(2400))!;
    expect(targets.breakEven).toBe(2400);
    // 2400 / 0.8 = 3000 exactly, so the ceiling is a no-op here.
    expect(targets.comfortable).toBe(2400 / COMFORT_COST_SHARE);
    // The cushion at the comfortable target is exactly the advertised share.
    expect(
      (targets.comfortable - 2400) / targets.comfortable
    ).toBeCloseTo(1 - COMFORT_COST_SHARE, 6);
  });

  it("returns null for an unpriceable city, mirroring monthlyCost", () => {
    expect(incomeTargets(estimate(null))).toBeNull();
  });
});

describe("rankByHeadroom", () => {
  it("sorts by money left over and never drops unpriceable cities", () => {
    const cities = [
      loc({ id: 1, name: "Expensive", goods_rpp: 120, other_services_rpp: 120 }),
      loc({ id: 2, name: "Cheap", goods_rpp: 85, other_services_rpp: 85 }),
      loc({
        id: 3,
        name: "NoData",
        goods_rpp: null,
        other_services_rpp: null,
        utilities_rpp: null,
        avg_home_value: null,
      }),
    ];
    const ranked = rankByHeadroom(cities, 4000, "own_outright", C);

    expect(ranked).toHaveLength(3); // nothing filtered out
    expect(ranked[0].location.name).toBe("Cheap");
    expect(ranked[1].location.name).toBe("Expensive");
    // Unpriceable sorts last but is still present and clearly labeled.
    expect(ranked[2].location.name).toBe("NoData");
    expect(ranked[2].band).toBe("unknown");
  });

  it("re-bands without changing order when only income changes", () => {
    const cities = [loc({ id: 1 }), loc({ id: 2, goods_rpp: 85, other_services_rpp: 85 })];
    const order = (income: number) =>
      rankByHeadroom(cities, income, "own_outright", C).map((r) => r.location.id);
    // Cost is income-independent, so ranking must be stable across incomes.
    expect(order(2000)).toEqual(order(9000));
  });
});

describe("tenure coverage", () => {
  it("owning paths compute when RPP is present; renting still needs median rent", () => {
    const tenures: Tenure[] = ["own_outright", "buying", "rent"];
    const computable = tenures.filter(
      (t) => estimateMonthlyCost(loc(), t, C).monthlyCost !== null
    );
    expect(computable).toEqual(["own_outright", "buying"]);
  });
});

describe("spending profiles", () => {
  const modestC: ResolvedConstants = {
    ...C,
    modestNonHousingGoodsMonthly: 600,
    modestNonHousingOtherServicesMonthly: 400,
    modestNonHousingUnscaledMonthly: 0,
    modestNationalUtilitiesMonthly: 250,
    nonHousingGoodsMonthly: 850,
    nonHousingOtherServicesMonthly: 750,
    nonHousingUnscaledMonthly: 400,
    nationalUtilitiesMonthly: 400,
  };

  it("defaults to modest and records the profile on the estimate", () => {
    const e = estimateMonthlyCost(loc({ median_rent: 1500 }), "rent", modestC);
    expect(e.spendingProfile).toBe("modest");
    expect(e.nonHousing).toBeCloseTo(600 + 400, 6);
  });

  it("does not silently replace modest with the 65+ mean", () => {
    const modest = estimateMonthlyCost(loc({ median_rent: 1500 }), "rent", modestC);
    const typical = estimateMonthlyCost(loc({ median_rent: 1500 }), "rent", modestC, {
      spendingProfile: "typical",
    });
    expect(typical.spendingProfile).toBe("typical");
    expect(typical.nonHousing).toBeCloseTo(850 + 750 + 400, 6);
    expect(modest.nonHousing).toBeLessThan(typical.nonHousing!);
    expect(modest.monthlyCost).toBeLessThan(typical.monthlyCost!);
  });

  it("scales modest owner utilities independently of the typical utilities bill", () => {
    const modestOwned = estimateMonthlyCost(loc(), "own_outright", modestC).housing!;
    const typicalOwned = estimateMonthlyCost(loc(), "own_outright", modestC, {
      spendingProfile: "typical",
    }).housing!;
    expect(typicalOwned - modestOwned).toBeCloseTo(400 - 250, 6);
  });
});
