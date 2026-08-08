import { describe, expect, it } from "vitest";
import { filterAndSort } from "./filters";
import type { LocationRow, StateInfoRow } from "./types";

const loc = (id: number, state: string) =>
  ({
    id,
    name: `City ${state}`,
    state,
    tags: [],
  }) as unknown as LocationRow;

const state = (
  stateCode: string,
  values: Partial<StateInfoRow> = {}
) =>
  ({
    state: stateCode,
    vet_benefits_verified_on: "2026-08-07",
    no_income_tax: false,
    retired_pay_tax: "taxed",
    disabled_vet_property_tax: null,
    employment_preference: null,
    education_benefit: null,
    parks_benefit: null,
    hunt_fish_benefit: null,
    ...values,
  }) as unknown as StateInfoRow;

const options = { scoreFn: () => 0 };

describe("verified veteran-benefit filters", () => {
  it("does not match an unverified state row", () => {
    const results = filterAndSort(
      [loc(1, "AA")],
      [state("AA", { no_income_tax: true, vet_benefits_verified_on: null })],
      { no_income_tax: "true" },
      options
    );
    expect(results).toHaveLength(0);
  });

  it("matches nullable boolean facets only when the value is explicitly true", () => {
    const results = filterAndSort(
      [loc(1, "AA"), loc(2, "BB")],
      [
        state("AA", { disabled_vet_property_tax: true }),
        state("BB", { disabled_vet_property_tax: null }),
      ],
      { disabled_vet_property_tax: "true" },
      options
    );
    expect(results.map((row) => row.state)).toEqual(["AA"]);
  });

  it("treats exempt and no-income-tax states as fully untaxed retirement", () => {
    const results = filterAndSort(
      [loc(1, "AA"), loc(2, "BB"), loc(3, "CC")],
      [
        state("AA", { retired_pay_tax: "exempt" }),
        state("BB", { retired_pay_tax: "no_income_tax" }),
        state("CC", { retired_pay_tax: "partial" }),
      ],
      { retired_pay_tax: "untaxed" },
      options
    );
    expect(results.map((row) => row.state).sort()).toEqual(["AA", "BB"]);
  });
});
