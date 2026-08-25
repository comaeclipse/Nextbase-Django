import { describe, expect, it } from "vitest";
import {
  CUSHION_OPTIONS,
  DEFAULT_AFFORDABILITY_SCENARIO,
  cushionShare,
  healthCoverageLabel,
  parseMonthlyAmount,
  parseOptionalAmount,
  parseOptionalPercent,
  scenarioChipLabel,
  scenarioEstimateOptions,
  scenarioGrossMonthly,
  scenarioHousehold,
  scenarioIsActive,
  scenarioSources,
} from "./affordability-scenario";
import { COMFORT_COST_SHARE } from "./affordability";

describe("affordability scenario", () => {
  it("treats empty fields as inactive", () => {
    expect(scenarioIsActive(DEFAULT_AFFORDABILITY_SCENARIO)).toBe(false);
    expect(scenarioSources(DEFAULT_AFFORDABILITY_SCENARIO)).toEqual([]);
  });

  it("parses currency-ish monthly amounts and ignores zeros", () => {
    expect(parseMonthlyAmount("$1,200")).toBe(1200);
    expect(parseMonthlyAmount("0")).toBe(0);
    const scenario = {
      ...DEFAULT_AFFORDABILITY_SCENARIO,
      vaDisability: "1800",
      militaryRetirement: "900",
      wages: "",
    };
    expect(scenarioGrossMonthly(scenario)).toBe(2700);
    expect(scenarioSources(scenario).map((s) => s.kind)).toEqual([
      "va_disability",
      "military_retirement",
    ]);
    expect(scenarioIsActive(scenario)).toBe(true);
  });

  it("defaults to medicare_supplement, the backward-compatible coverage choice", () => {
    expect(DEFAULT_AFFORDABILITY_SCENARIO.healthCoverage).toBe(
      "medicare_supplement"
    );
  });

  it("only surfaces health coverage in the chip label when it isn't the default", () => {
    const defaultChip = scenarioChipLabel(DEFAULT_AFFORDABILITY_SCENARIO);
    expect(defaultChip).not.toMatch(/medicare|va primary/i);

    const vaScenario = {
      ...DEFAULT_AFFORDABILITY_SCENARIO,
      healthCoverage: "va_primary" as const,
    };
    expect(scenarioChipLabel(vaScenario)).toContain(
      healthCoverageLabel("va_primary")
    );
    // Every non-default coverage appears — TRICARE included, not just VA.
    const tricareScenario = {
      ...DEFAULT_AFFORDABILITY_SCENARIO,
      healthCoverage: "tricare_select" as const,
    };
    expect(scenarioChipLabel(tricareScenario)).toContain(
      healthCoverageLabel("tricare_select")
    );
  });
});

describe("optional override parsers", () => {
  it("treats junk, zero, and blank as unset for amounts", () => {
    expect(parseOptionalAmount("")).toBeUndefined();
    expect(parseOptionalAmount("0")).toBeUndefined();
    expect(parseOptionalAmount("abc")).toBeUndefined();
    expect(parseOptionalAmount("250,000")).toBe(250000);
  });

  it("parses human percentages as fractions with (0, 100) exclusive bounds", () => {
    expect(parseOptionalPercent("6.5")).toBeCloseTo(0.065, 9);
    expect(parseOptionalPercent("20")).toBeCloseTo(0.2, 9);
    // 0 and 100 are deliberately unset, not nonsense rates.
    expect(parseOptionalPercent("0")).toBeUndefined();
    expect(parseOptionalPercent("100")).toBeUndefined();
    expect(parseOptionalPercent("250")).toBeUndefined();
    expect(parseOptionalPercent("")).toBeUndefined();
  });
});

describe("scenarioEstimateOptions", () => {
  it("maps an untouched scenario to pure defaults (a pricing no-op)", () => {
    const opts = scenarioEstimateOptions(DEFAULT_AFFORDABILITY_SCENARIO);
    expect(opts.household).toBe("single");
    expect(opts.homePriceOverride).toBeUndefined();
    expect(opts.downPaymentFraction).toBeUndefined();
    expect(opts.mortgageRateOverride).toBeUndefined();
    expect(opts.propertyTaxRateOverride).toBeUndefined();
    expect(opts.hoaMonthly).toBeUndefined();
    expect(cushionShare(DEFAULT_AFFORDABILITY_SCENARIO.cushion)).toBe(
      COMFORT_COST_SHARE
    );
  });

  it("wires typed overrides through as model options", () => {
    const opts = scenarioEstimateOptions({
      ...DEFAULT_AFFORDABILITY_SCENARIO,
      filing: "married",
      homePrice: "250000",
      downPaymentPct: "30",
      mortgageRatePct: "5.5",
      propertyTaxPct: "1.2",
      hoaMonthly: "150",
    });
    expect(opts.household).toBe("couple");
    expect(opts.homePriceOverride).toBe(250000);
    expect(opts.downPaymentFraction).toBeCloseTo(0.3, 9);
    expect(opts.mortgageRateOverride).toBeCloseTo(0.055, 9);
    expect(opts.propertyTaxRateOverride).toBeCloseTo(0.012, 9);
    expect(opts.hoaMonthly).toBe(150);
  });

  it("maps filing to household in one place", () => {
    expect(scenarioHousehold(DEFAULT_AFFORDABILITY_SCENARIO)).toBe("single");
    expect(
      scenarioHousehold({ ...DEFAULT_AFFORDABILITY_SCENARIO, filing: "married" })
    ).toBe("couple");
  });

  it("keeps the default cushion in lockstep with COMFORT_COST_SHARE", () => {
    const comfortable = CUSHION_OPTIONS.find((o) => o.id === "comfortable")!;
    expect(comfortable.share).toBe(COMFORT_COST_SHARE);
  });
});
