import { describe, expect, it } from "vitest";
import {
  rankStateVeteranBenefits,
  toStateVeteranBenefitsEntry,
  type StateVeteranBenefitsEntry,
  type StateVeteranBenefitsRow,
} from "./city-queries";

function row(over: Partial<StateVeteranBenefitsRow> & { state: string }): StateVeteranBenefitsRow {
  return {
    vet_benefits_verified_on: "2026-08-11",
    vet_benefits_source_url: "https://example.gov/vets",
    vet_benefits_summary: "Summary.",
    no_income_tax: false,
    retired_pay_tax: "exempt",
    retired_pay_exclusion_amount: null,
    retired_pay_exclusion_pct: null,
    retired_pay_condition: null,
    disabled_vet_property_tax: true,
    employment_preference: true,
    education_benefit: true,
    parks_benefit: null,
    hunt_fish_benefit: true,
    ss_tax_treatment: "not_taxed",
    ss_tax_threshold_single: null,
    ss_tax_threshold_married: null,
    ss_tax_min_age: null,
    ss_tax_age_exempts_fully: null,
    senior_deduction_amount: null,
    senior_deduction_min_age: null,
    senior_deduction_per_qualifying_person: null,
    senior_deduction_tax_year: null,
    ...over,
  };
}

function entry(over: Partial<StateVeteranBenefitsRow> & { state: string }): StateVeteranBenefitsEntry {
  const e = toStateVeteranBenefitsEntry(row(over));
  if (!e) throw new Error(`row ${over.state} did not shape`);
  return e;
}

describe("toStateVeteranBenefitsEntry", () => {
  it("exposes three-valued flags as yes / no / not_recorded, never null", () => {
    const e = entry({ state: "AK", parks_benefit: null, employment_preference: false });
    expect(e.benefits.parks_benefit).toBe("not_recorded");
    expect(e.benefits.employment_preference).toBe("no");
    expect(e.benefits.disabled_vet_property_tax).toBe("yes");
    // not_recorded counts as zero, not as a benefit
    expect(e.recordedBenefitCount).toBe(3);
  });

  it("drops an unverified row entirely", () => {
    expect(toStateVeteranBenefitsEntry(row({ state: "ZZ", vet_benefits_verified_on: null }))).toBeNull();
  });

  it("parses numeric strings from Postgres and carries the condition text", () => {
    const e = entry({
      state: "VA",
      retired_pay_tax: "partial",
      retired_pay_exclusion_amount: "40000",
      retired_pay_condition: "$40,000/yr TY2025 and later.",
      ss_tax_treatment: "partial",
      ss_tax_threshold_single: "75000",
      senior_deduction_amount: "5500",
      senior_deduction_tax_year: "2024",
    });
    expect(e.retiredPay.treatment).toBe("partial");
    expect(e.retiredPay.exclusionAmountPerYear).toBe(40000);
    expect(e.retiredPay.condition).toMatch(/40,000/);
    expect(e.retiredPay.label).toMatch(/partially exempt/);
    expect(e.socialSecurity.exemptAtOrBelowAgiSingle).toBe(75000);
    expect(e.seniorDeduction).toEqual({
      amountPerYear: 5500,
      minAge: null,
      perQualifyingPerson: null,
      taxYear: 2024,
    });
    expect(e.stateName).toBe("Virginia");
    expect(e.verifiedOn).toBe("2026-08-11");
  });

  it("treats an unrecognized classification as unknown rather than guessing", () => {
    const e = entry({ state: "MO", retired_pay_tax: null, ss_tax_treatment: "weird" });
    expect(e.retiredPay.treatment).toBe("unknown");
    expect(e.socialSecurity.treatment).toBe("unknown");
    expect(e.seniorDeduction).toBeNull();
  });

  it("formats a Date verified_on as an ISO date and sorts cities when given", () => {
    const e = toStateVeteranBenefitsEntry(
      row({ state: "TX", vet_benefits_verified_on: new Date("2026-08-11T00:00:00Z") }),
      ["Odessa, TX", "Abilene, TX"]
    )!;
    expect(e.verifiedOn).toBe("2026-08-11");
    expect(e.cities).toEqual(["Abilene, TX", "Odessa, TX"]);
  });
});

describe("rankStateVeteranBenefits", () => {
  const entries = [
    entry({ state: "TX", retired_pay_tax: "no_income_tax", no_income_tax: true }),
    entry({ state: "AL", retired_pay_tax: "exempt" }),
    entry({ state: "CA", retired_pay_tax: "partial", parks_benefit: true }),
    entry({ state: "MT", retired_pay_tax: "conditional", disabled_vet_property_tax: null }),
    entry({ state: "NV", retired_pay_tax: "no_income_tax", no_income_tax: true, hunt_fish_benefit: null }),
  ];

  it("defaults to the neutral retired-pay order, then benefit count, then name", () => {
    const r = rankStateVeteranBenefits(entries);
    expect(r.sortedBy).toBe("retired_pay");
    // TX (4 yes) beats NV (3 yes) inside the no_income_tax tier
    expect(r.states.map((s) => s.state)).toEqual(["TX", "NV", "AL", "CA", "MT"]);
    expect(r.filters).toEqual({ retiredPayTax: null, mustHave: null });
  });

  it("filters retired-pay treatment to the requested classifications", () => {
    const r = rankStateVeteranBenefits(entries, { retiredPayTax: ["no_income_tax", "exempt"] });
    expect(r.states.map((s) => s.state)).toEqual(["TX", "NV", "AL"]);
    expect(r.filters.retiredPayTax).toEqual(["no_income_tax", "exempt"]);
  });

  it("mustHave matches only an explicit yes -- not_recorded is excluded, same as lib/filters", () => {
    const r = rankStateVeteranBenefits(entries, { mustHave: ["disabled_vet_property_tax"] });
    expect(r.states.map((s) => s.state)).not.toContain("MT");
    expect(r.states).toHaveLength(4);

    const hunt = rankStateVeteranBenefits(entries, { mustHave: ["hunt_fish_benefit", "no_income_tax"] });
    expect(hunt.states.map((s) => s.state)).toEqual(["TX"]);
  });

  it("accepts full state names and USPS codes and returns all of them when states is given", () => {
    const r = rankStateVeteranBenefits(entries, { states: ["Montana", "ca"], sortBy: "name" });
    expect(r.states.map((s) => s.state)).toEqual(["CA", "MT"]);
  });

  it("benefit_count sort ranks by recorded yes-count first", () => {
    const r = rankStateVeteranBenefits(entries, { sortBy: "benefit_count" });
    expect(r.states[0].state).toBe("CA"); // 5 yes
    expect(r.states[1].state).toBe("TX"); // 4 yes, no_income_tax tier
  });

  it("applies the default limit of 15 only when no states were named", () => {
    const many = Array.from({ length: 20 }, (_, i) =>
      entry({ state: `S${String(i).padStart(2, "0")}` })
    );
    expect(rankStateVeteranBenefits(many).states).toHaveLength(15);
    expect(rankStateVeteranBenefits(many, { limit: 3 }).states).toHaveLength(3);
  });
});
