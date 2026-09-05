import { describe, expect, it } from "vitest";
import {
  buildStateTaxGasEntries,
  rankStateTaxGas,
  resolveStateIncomeTax,
  type CityTaxRow,
  type StateInfoTaxRow,
  type StateTaxGasEntry,
} from "./city-queries";

describe("resolveStateIncomeTax", () => {
  it("returns 0 for a verified no-income-tax state, ignoring any legacy city values", () => {
    expect(resolveStateIncomeTax({ income_tax: null, no_income_tax: true }, [0, 2.5])).toEqual({
      pct: 0,
      source: "no_income_tax",
    });
  });

  it("prefers the verified state rate even when the legacy city rows disagree (the B3 bug)", () => {
    // CA: locations_stateinfo says 13.3, but city rows still carry 9.3 and 13.3.
    expect(resolveStateIncomeTax({ income_tax: "13.3", no_income_tax: false }, [9.3, 13.3])).toEqual({
      pct: 13.3,
      source: "verified",
    });
  });

  it("falls back to the legacy per-city rate only when it is the single agreed value", () => {
    expect(resolveStateIncomeTax({ income_tax: null, no_income_tax: false }, [5.75])).toEqual({
      pct: 5.75,
      source: "legacy",
    });
    expect(resolveStateIncomeTax(undefined, [4.9])).toEqual({ pct: 4.9, source: "legacy" });
  });

  it("is unknown (never a guess) when unverified and the legacy rows disagree or are absent", () => {
    expect(resolveStateIncomeTax({ income_tax: null, no_income_tax: false }, [4, 4.4, 4.7])).toEqual({
      pct: null,
      source: "unknown",
    });
    expect(resolveStateIncomeTax(undefined, [])).toEqual({ pct: null, source: "unknown" });
  });
});

function cityRow(over: Partial<CityTaxRow> & { state: string; name: string }): CityTaxRow {
  return { sales_tax: null, income_tax: null, ...over };
}

describe("buildStateTaxGasEntries", () => {
  const stateInfoRows: StateInfoTaxRow[] = [
    { state: "CA", income_tax: "13.3", no_income_tax: false },
    { state: "TX", income_tax: null, no_income_tax: true },
    { state: "VA", income_tax: null, no_income_tax: false },
    { state: "MS", income_tax: null, no_income_tax: false },
  ];
  const gasByState = new Map<string, number>([
    ["CA", 4.8],
    ["TX", 3.1],
    ["VA", 3.3],
    ["MS", 2.9],
  ]);

  const cityRows: CityTaxRow[] = [
    cityRow({ state: "CA", name: "Fresno", sales_tax: "8.35", income_tax: "9.3" }),
    cityRow({ state: "CA", name: "Bakersfield", sales_tax: "8.25", income_tax: "13.3" }),
    cityRow({ state: "TX", name: "Odessa", sales_tax: "8.25", income_tax: "0" }),
    cityRow({ state: "VA", name: "Roanoke", sales_tax: "5.3", income_tax: "5.75" }),
    // MS: cities disagree AND no verified value -> unknown
    cityRow({ state: "MS", name: "Columbus", sales_tax: "7", income_tax: "4" }),
    cityRow({ state: "MS", name: "Meridian", sales_tax: "7", income_tax: "4.7" }),
  ];

  function byState(entries: StateTaxGasEntry[]): Record<string, StateTaxGasEntry> {
    return Object.fromEntries(entries.map((e) => [e.state, e]));
  }

  it("uses the verified state income tax and averages sales tax across cities", () => {
    const e = byState(buildStateTaxGasEntries({ cityRows, stateInfoRows, gasByState }));
    expect(e.CA.incomeTaxPct).toBe(13.3);
    expect(e.CA.incomeTaxSource).toBe("verified");
    expect(e.CA.salesTaxPct).toBe(8.3); // (8.35 + 8.25) / 2
    expect(e.CA.stateName).toBe("California");
    expect(e.CA.gasPricePerGallon).toBe(4.8);
  });

  it("marks a no-income-tax state as 0 / no_income_tax and an unverified-disagreeing state as unknown", () => {
    const e = byState(buildStateTaxGasEntries({ cityRows, stateInfoRows, gasByState }));
    expect(e.TX.incomeTaxPct).toBe(0);
    expect(e.TX.incomeTaxSource).toBe("no_income_tax");
    expect(e.VA.incomeTaxPct).toBe(5.75);
    expect(e.VA.incomeTaxSource).toBe("legacy");
    expect(e.MS.incomeTaxPct).toBeNull();
    expect(e.MS.incomeTaxSource).toBe("unknown");
  });

  it("includes sorted city names only when asked", () => {
    const without = byState(buildStateTaxGasEntries({ cityRows, stateInfoRows, gasByState }));
    expect(without.CA.cities).toBeUndefined();
    const withCities = byState(
      buildStateTaxGasEntries({ cityRows, stateInfoRows, gasByState, includeCities: true })
    );
    expect(withCities.CA.cities).toEqual(["Bakersfield, CA", "Fresno, CA"]);
  });
});

describe("rankStateTaxGas", () => {
  const entries: StateTaxGasEntry[] = [
    { state: "CA", stateName: "California", salesTaxPct: 8.3, incomeTaxPct: 13.3, incomeTaxSource: "verified", gasPricePerGallon: 4.8 },
    { state: "TX", stateName: "Texas", salesTaxPct: 8.25, incomeTaxPct: 0, incomeTaxSource: "no_income_tax", gasPricePerGallon: 3.1 },
    { state: "VA", stateName: "Virginia", salesTaxPct: 5.3, incomeTaxPct: 5.75, incomeTaxSource: "legacy", gasPricePerGallon: 3.3 },
    { state: "MS", stateName: "Mississippi", salesTaxPct: 7, incomeTaxPct: null, incomeTaxSource: "unknown", gasPricePerGallon: 2.9 },
  ];

  it("sorts by income tax ascending with unknowns last", () => {
    const r = rankStateTaxGas(entries, { sortBy: "income_tax" });
    expect(r.states.map((s) => s.state)).toEqual(["TX", "VA", "CA", "MS"]);
    expect(r.sortedBy).toBe("income_tax");
  });

  it("filters to named states (USPS codes or full names) and returns all of them", () => {
    const r = rankStateTaxGas(entries, { states: ["Texas", "va"], sortBy: "sales_tax" });
    expect(r.states.map((s) => s.state)).toEqual(["VA", "TX"]);
    expect(r.states).toHaveLength(2);
  });

  it("applies the default limit of 15 only when no states were named", () => {
    const many: StateTaxGasEntry[] = Array.from({ length: 20 }, (_, i) => ({
      state: `S${String(i).padStart(2, "0")}`,
      stateName: null,
      salesTaxPct: i,
      incomeTaxPct: i,
      incomeTaxSource: "legacy",
      gasPricePerGallon: i,
    }));
    expect(rankStateTaxGas(many, { sortBy: "sales_tax" }).states).toHaveLength(15);
    expect(rankStateTaxGas(many, { sortBy: "sales_tax", limit: 3 }).states).toHaveLength(3);
  });
});
