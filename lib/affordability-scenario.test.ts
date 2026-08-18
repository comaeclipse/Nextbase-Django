import { describe, expect, it } from "vitest";
import {
  DEFAULT_AFFORDABILITY_SCENARIO,
  parseMonthlyAmount,
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
});
