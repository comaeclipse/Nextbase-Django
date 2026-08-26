import { describe, expect, it } from "vitest";
import {
  CUSHION_OPTIONS,
  DEFAULT_AFFORDABILITY_SCENARIO,
  cushionShare,
  healthCoverageLabel,
  parseMonthlyAmount,
  parseOptionalAmount,
  parseOptionalPercent,
  scenarioAnnotationActive,
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
    // Coverage lives on the DETAILED chip; quick mode has its own label.
    const detailed = {
      ...DEFAULT_AFFORDABILITY_SCENARIO,
      mode: "detailed" as const,
    };
    expect(scenarioChipLabel(detailed)).not.toMatch(/medicare|va primary/i);

    expect(
      scenarioChipLabel({ ...detailed, healthCoverage: "va_primary" as const })
    ).toContain(healthCoverageLabel("va_primary"));
    // Every non-default coverage appears — TRICARE included, not just VA.
    expect(
      scenarioChipLabel({
        ...detailed,
        healthCoverage: "tricare_select" as const,
      })
    ).toContain(healthCoverageLabel("tricare_select"));
  });

  it("labels a quick-mode scenario by its take-home, tenure, and household", () => {
    const chip = scenarioChipLabel({
      ...DEFAULT_AFFORDABILITY_SCENARIO,
      quickIncome: "3000",
      quickHousehold: "couple",
      tenure: "rent",
    });
    expect(chip).toContain("Quick check");
    expect(chip).toContain("$3,000/mo take-home");
    expect(chip).toContain("Rent");
    expect(chip).toContain("Couple");
  });

  it("gates annotation on the CURRENT mode's input", () => {
    // Quick mode default, nothing typed: inactive.
    expect(scenarioAnnotationActive(DEFAULT_AFFORDABILITY_SCENARIO)).toBe(false);
    // Quick income typed: active — even with no detailed sources.
    expect(
      scenarioAnnotationActive({
        ...DEFAULT_AFFORDABILITY_SCENARIO,
        quickIncome: "2500",
      })
    ).toBe(true);
    // Detailed mode ignores quick income and requires sources.
    expect(
      scenarioAnnotationActive({
        ...DEFAULT_AFFORDABILITY_SCENARIO,
        mode: "detailed",
        quickIncome: "2500",
      })
    ).toBe(false);
    expect(
      scenarioAnnotationActive({
        ...DEFAULT_AFFORDABILITY_SCENARIO,
        mode: "detailed",
        socialSecurity: "2500",
      })
    ).toBe(true);
    // scenarioIsActive keeps its detailed-only meaning for the city card.
    expect(
      scenarioIsActive({
        ...DEFAULT_AFFORDABILITY_SCENARIO,
        quickIncome: "2500",
      })
    ).toBe(false);
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
