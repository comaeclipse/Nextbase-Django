import { describe, expect, it } from "vitest";
import { parseMiles, shapeCityFacts, type CityFactsRow } from "./city-facts-queries";

function row(over: Partial<CityFactsRow> = {}): CityFactsRow {
  return {
    id: "7",
    name: "Elko",
    state: "NV",
    county: "Elko",
    geo_type: "city",
    is_candidate: true,
    description: "High-desert mining town.",
    population: "20,696",
    density: "1160",
    pace_category: "small_town",
    tags: ["Mountains", "Hiking"],
    vibes: ["mountain_living", "quiet_retreat"],
    near_lake: false,
    near_ocean: false,
    near_mountains: true,
    climate: "High desert",
    climate_category: "cold_snowy",
    snow_annual: "41",
    rain_annual: 10,
    sun_days: 231,
    alw: 16,
    avg_high_summer: 92,
    has_va: true,
    nearest_va: "Elko VA Clinic",
    distance_to_va: "1 miles",
    nearest_va_kind: "outpatient",
    nearest_va_hospital: "Boise VA Medical Center",
    distance_to_va_hospital: "193 miles",
    has_walmart: true,
    has_costco: false,
    tech_hub: null,
    defense_hub: false,
    col_index: "95",
    cost_of_living: "Moderate",
    avg_home_value: "364923.40",
    entry_home_value: 193800,
    median_rent: 1267,
    property_tax_rate: "0.00560",
    tci: 111,
    crime: "Moderate",
    city_politics: "County-level: Strongly Conservative",
    election_2016: "Trump",
    election_2016_percent: 80,
    election_2024: "Trump",
    election_2024_percent: "79",
    election_change: "1.0 pp more Democratic since 2016",
    lgbtq_rating: "50",
    lgbtq_mei_score: 50,
    lgbtq_score_source: "HRC 2025 Elko MEI scorecard",
    lgbtq_state_policy_score: "60.5",
    marijuana_status: "Recreational",
    no_income_tax: true,
    base_command_name: "Mountain Home Air Force Base",
    base_service_branch: "Air Force",
    base_city: "Mountain Home",
    base_state: "ID",
    base_distance_miles: "158.44",
    ...over,
  };
}

describe("parseMiles", () => {
  it("reads the legacy '<n> miles' strings and the '<1' form", () => {
    expect(parseMiles("7 miles")).toBe(7);
    expect(parseMiles("193 miles")).toBe(193);
    expect(parseMiles("<1 miles")).toBe(0.5);
    expect(parseMiles(null)).toBeNull();
    expect(parseMiles("unknown")).toBeNull();
  });
});

describe("shapeCityFacts", () => {
  it("shapes a candidate city with parsed numbers, labels, and named facilities", () => {
    const f = shapeCityFacts(row());
    expect(f.city).toBe("Elko, NV");
    expect(f.stateName).toBe("Nevada");
    expect(f.isCandidate).toBe(true);
    expect(f.population).toBe(20696);
    expect(f.densityPerSqMi).toBe(1160);
    expect(f.pace).toBe("small town");
    expect(f.vibes).toEqual(["mountain living", "quiet retreat"]);
    expect(f.geography.nearMountains).toBe("yes");
    expect(f.climate.categoryLabel).toBe("four seasons with real winter");
    expect(f.climate.snowInchesPerYear).toBe(41);
    expect(f.va.nearestOutpatient).toEqual({ name: "Elko VA Clinic", miles: 1, kind: "outpatient" });
    expect(f.va.nearestMedicalCenter).toEqual({ name: "Boise VA Medical Center", miles: 193 });
    expect(f.nearestBase).toEqual({
      commandName: "Mountain Home Air Force Base",
      branch: "Air Force",
      city: "Mountain Home",
      state: "ID",
      miles: 158.4,
    });
    expect(f.housing.typicalHomeValue).toBe(364923);
    expect(f.housing.propertyTaxRatePct).toBe(0.56);
    expect(f.politics.election2024).toEqual({ winner: "Trump", percent: 79 });
    expect(f.lgbtq.statePolicyScore).toBe(60.5);
    expect(f.noStateIncomeTax).toBe("yes");
    expect(shapeCityFacts(row({ no_income_tax: null })).noStateIncomeTax).toBe("not_recorded");
    expect(f.notes.some((n) => /medical center is a long way/.test(n))).toBe(true);
  });

  it("exposes three-valued booleans as yes / no / not_recorded", () => {
    const f = shapeCityFacts(row({ has_walmart: null, tech_hub: null, defense_hub: false }));
    expect(f.retail).toEqual({ walmart: "not_recorded", costco: "no" });
    expect(f.hubs).toEqual({ techHub: "not_recorded", defenseHub: "no" });
  });

  it("marks crime and politics as context-only with a scope note", () => {
    const f = shapeCityFacts(row());
    expect(f.safety.contextOnly).toBe(true);
    expect(f.safety.scope).toMatch(/jurisdiction/);
    expect(f.politics.contextOnly).toBe(true);
    expect(f.politics.lean).toMatch(/County-level/);
  });

  it("flags a non-candidate parent place instead of pretending it is unknown", () => {
    const f = shapeCityFacts(
      row({ name: "Los Angeles", state: "CA", is_candidate: false, tci: null, crime: null, election_2016: null, vibes: [] })
    );
    expect(f.isCandidate).toBe(false);
    expect(f.notes[0]).toMatch(/not one of the retirement candidates/);
    expect(f.safety.totalCrimeIndex).toBeNull();
    expect(f.politics.election2016).toBeNull();
  });

  it("drops a nearest base whose service is outside the index", () => {
    const f = shapeCityFacts(row({ base_service_branch: "Coast Guard" }));
    expect(f.nearestBase).toBeNull();
    const none = shapeCityFacts(row({ base_command_name: null, base_service_branch: null }));
    expect(none.nearestBase).toBeNull();
  });
});
