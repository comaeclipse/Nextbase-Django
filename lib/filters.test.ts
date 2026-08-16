import { describe, expect, it } from "vitest";
import { filterAndSort } from "./filters";
import type { LocationRow } from "./types";

function loc(partial: Partial<LocationRow>): LocationRow {
  return {
    id: 1,
    name: "Test",
    state: "TX",
    county: null,
    climate: null,
    cost_of_living: "Moderate",
    tags: null,
    emoji: "",
    gradient: "",
    featured: false,
    state_party: null,
    governor: null,
    city_politics: null,
    election_2016: null,
    election_2016_percent: null,
    election_2024: null,
    election_2024_percent: null,
    election_change: null,
    population: null,
    density: null,
    sales_tax: null,
    income_tax: null,
    col_index: null,
    has_va: null,
    nearest_va: null,
    distance_to_va: null,
    nearest_va_hospital: null,
    distance_to_va_hospital: null,
    veterans_benefits: null,
    tci: null,
    marijuana_status: null,
    lgbtq_rating: null,
    lgbtq_mei_score: null,
    lgbtq_state_policy_score: null,
    lgbtq_score_source: null,
    tech_hub: null,
    defense_hub: null,
    defense_hub_manual: null,
    has_walmart: null,
    has_costco: null,
    snow_annual: null,
    rain_annual: null,
    sun_days: null,
    alw: null,
    avg_high_summer: null,
    humidity_summer: null,
    gas_price: null,
    description: null,
    avg_home_value: null,
    avg_home_value_display: null,
    crime: null,
    climate_category: null,
    pace_category: null,
    rep_vote_share_change_pp: null,
    dem_vote_share_change_pp: null,
    ...partial,
  };
}

describe("retail access filters", () => {
  const rows = [
    loc({ id: 1, name: "Both", has_walmart: true, has_costco: true }),
    loc({ id: 2, name: "Walmart", has_walmart: true, has_costco: false }),
    loc({ id: 3, name: "Costco", has_walmart: false, has_costco: true }),
    loc({ id: 4, name: "Unknown", has_walmart: null, has_costco: null }),
  ];

  it("matches only Walmart-positive locations", () => {
    const result = filterAndSort(rows, [], { has_walmart: "true" });
    expect(result.map((location) => location.name)).toEqual(["Both", "Walmart"]);
  });

  it("matches only Costco-positive locations", () => {
    const result = filterAndSort(rows, [], { has_costco: "true" });
    expect(result.map((location) => location.name)).toEqual(["Both", "Costco"]);
  });

  it("requires both positives when both filters are selected", () => {
    const result = filterAndSort(rows, [], {
      has_walmart: "true",
      has_costco: "true",
    });
    expect(result.map((location) => location.name)).toEqual(["Both"]);
  });
});
