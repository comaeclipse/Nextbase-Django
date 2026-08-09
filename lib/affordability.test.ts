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
  nonHousingIndex,
  estimateMonthlyCost,
  assessAffordability,
  rankByHeadroom,
  type CostEstimate,
  type CostInputs,
  type Tenure,
} from "./affordability";
import type { ResolvedConstants } from "./cost-constants";

/** Round synthetic constants chosen to make the arithmetic checkable by hand. */
const C: ResolvedConstants = {
  nonHousingBaseline65Plus: 2000,
  housingWeight: 0.28,
  nationalMedianHomeValue: 400_000,
  medicarePartBMonthly: 185,
  supplementalHealthMonthly: 215,
  fallbackPropertyTaxRate: 0.01,
  annualMaintenanceRate: 0.01,
  mortgageRate30yr: 0.06,
  defaultDownPaymentFraction: 0.2,
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
    ...over,
  } as CostInputs;
}

describe("nonHousingIndex", () => {
  it("returns exactly 100 for an average city at the national median home value", () => {
    // (100 - 0.28*100) / 0.72 = 100
    expect(nonHousingIndex(loc(), C)).toBeCloseTo(100, 6);
  });

  it("REGRESSION: does not double-count housing", () => {
    // Two cities with an IDENTICAL composite index. The one with pricier
    // housing must have CHEAPER everything-else, because more of its index is
    // explained by housing. A model that skipped the back-out step would score
    // these two identically — that was the original bug this whole module
    // exists to fix.
    const average = nonHousingIndex(loc({ avg_home_value: "400000" }), C)!;
    const pricey = nonHousingIndex(loc({ avg_home_value: "600000" }), C)!;

    expect(pricey).toBeLessThan(average);
    // (100 - 0.28*150) / 0.72 = 80.55...
    expect(pricey).toBeCloseTo(80.5556, 3);
  });

  it("increases with col_index when housing is held constant", () => {
    const cheap = nonHousingIndex(loc({ col_index: 90 }), C)!;
    const mid = nonHousingIndex(loc({ col_index: 100 }), C)!;
    const dear = nonHousingIndex(loc({ col_index: 110 }), C)!;
    expect(cheap).toBeLessThan(mid);
    expect(mid).toBeLessThan(dear);
  });

  it("returns null for implausible results rather than shipping them", () => {
    // An average composite index alongside triple-median housing implies
    // absurdly cheap non-housing costs. That is inconsistent source data, not
    // a bargain city, so it must be flagged rather than scored.
    expect(nonHousingIndex(loc({ avg_home_value: "1200000" }), C)).toBeNull();
  });

  it("returns null when col_index is absent", () => {
    expect(nonHousingIndex(loc({ col_index: null }), C)).toBeNull();
  });

  it("falls back to col_index when home value is absent, and says so", () => {
    const approximations: string[] = [];
    const result = nonHousingIndex(
      loc({ avg_home_value: null, col_index: 95 }),
      C,
      approximations
    );
    expect(result).toBe(95);
    expect(approximations).toHaveLength(1);
    expect(approximations[0]).toMatch(/home value/i);
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
    const e = estimateMonthlyCost(loc({ col_index: null }), "own_outright", C);
    expect(e.monthlyCost).toBeNull();
    expect(e.missing).toContain("local cost index");
    // The components it COULD compute are still exposed for debugging.
    expect(e.housing).not.toBeNull();
  });
});

describe("assessAffordability", () => {
  const estimate = (cost: number | null): CostEstimate => ({
    monthlyCost: cost,
    housing: 0,
    nonHousing: 0,
    nationalFixed: 0,
    nonHousingIndex: 100,
    missing: [],
    approximations: [],
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

describe("rankByHeadroom", () => {
  it("sorts by money left over and never drops unpriceable cities", () => {
    const cities = [
      loc({ id: 1, name: "Expensive", col_index: 120, avg_home_value: "500000" }),
      loc({ id: 2, name: "Cheap", col_index: 85, avg_home_value: "250000" }),
      loc({ id: 3, name: "NoData", col_index: null, avg_home_value: null }),
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
    const cities = [loc({ id: 1 }), loc({ id: 2, col_index: 85 })];
    const order = (income: number) =>
      rankByHeadroom(cities, income, "own_outright", C).map((r) => r.location.id);
    // Cost is income-independent, so ranking must be stable across incomes.
    expect(order(2000)).toEqual(order(9000));
  });
});

describe("tenure coverage", () => {
  it("owning paths compute today; renting waits on ingestion", () => {
    const tenures: Tenure[] = ["own_outright", "buying", "rent"];
    const computable = tenures.filter(
      (t) => estimateMonthlyCost(loc(), t, C).monthlyCost !== null
    );
    expect(computable).toEqual(["own_outright", "buying"]);
  });
});
