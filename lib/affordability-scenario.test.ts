import { describe, expect, it } from "vitest";
import {
  DEFAULT_AFFORDABILITY_SCENARIO,
  healthCoverageLabel,
  parseMonthlyAmount,
  scenarioChipLabel,
  scenarioGrossMonthly,
  scenarioIsActive,
  scenarioSources,
} from "./affordability-scenario";

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
  });
});
