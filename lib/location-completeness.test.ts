import { describe, expect, it } from "vitest";
import {
  formatCompletionProblem,
  locationCsvCompletionProblems,
  locationCsvSafetyProblems,
  missingLegacyCoreFields,
  REQUIRED_LOCATION_CSV_COLUMNS,
} from "./location-completeness";
import { inspectNeighborhoodReadiness } from "./neighborhood-readiness";

const completeRow = Object.fromEntries(
  REQUIRED_LOCATION_CSV_COLUMNS.map((column) => [column, "1"])
) as Record<string, string>;

Object.assign(completeRow, {
  City: "Example", State: "EX", VA: "No", TechHub: "Y", DefenseHub: "N",
  HasWalmart: "N", HasCostco: "Y",
  Tags: '["Hiking"]', Gas: "$3.19", CrimeRating: "Low", Description: "Sourced city summary.",
});

describe("CSV candidate safety", () => {
  it("preserves legacy city defaults and non-candidate geography imports", () => {
    expect(locationCsvSafetyProblems(completeRow)).toEqual([]);
    for (const GeoType of ["neighborhood", "cdp", "county", "metro"]) {
      expect(locationCsvSafetyProblems({ GeoType, IsCandidate: "No" })).toEqual([]);
      expect(locationCsvSafetyProblems({ GeoType })).toEqual([]);
      for (const IsCandidate of ["Yes", "true", "1", "Y", "T"]) {
        expect(locationCsvSafetyProblems({ GeoType, IsCandidate })).toContain(
          "Non-city candidates require reviewed promotion; CSV import cannot set IsCandidate=Yes"
        );
      }
    }
  });
  it("does not silently turn misspelled geography or candidate flags into defaults", () => {
    expect(locationCsvSafetyProblems({ GeoType: "neigborhood" })).toContain("Unrecognized GeoType: neigborhood");
    expect(locationCsvSafetyProblems({ GeoType: "__proto__" })).toContain("Unrecognized GeoType: __proto__");
    expect(locationCsvSafetyProblems({ IsCandidate: "maybe" })).toContain("IsCandidate must be an explicit Yes/No value");
    expect(locationCsvSafetyProblems({ IsCandidate: "unknown" })).toContain("IsCandidate must be an explicit Yes/No value");
    expect(locationCsvSafetyProblems({ GeoType: "unknown" })).toContain("Unrecognized GeoType: unknown");
  });
});

describe("neighborhood readiness", () => {
  const row = {
    id: 617, name: "Midland", state: "GA", county: "Muscogee", slug: "ga-columbus-midland",
    geo_type: "neighborhood", parent_geo_id: "126", latitude: "32.574867", longitude: "-84.827156",
    description: "Sourced community description.", tags: ["community"], boundary_source: "GNIS point",
    population: null, population_unavailable_reason: "No reviewed measurement boundary.",
    has_valid_municipal_parent: true,
  };
  it("allows an honest unknown population for browsing, never for a complete profile", () => {
    const result = inspectNeighborhoodReadiness(row);
    expect(result.structuralProblems).toEqual([]);
    expect(result.profileDataProblems).toContain("population needs a positive local measurement");
    expect(result.profileDataProblems).toContain("avg_home_value needs a positive local measurement");
    expect(result.profileDataProblems).toContain("local safety measurement is missing");
    expect(result.reviewProblems).not.toEqual([]);
  });
  it("requires provenance for a supplied population and rejects contradictory unavailable reasons", () => {
    const populated = { ...row, population: "53,227", population_unavailable_reason: null };
    expect(inspectNeighborhoodReadiness(populated).structuralProblems).toEqual([
      "population_source is missing", "population_vintage is missing",
    ]);
    expect(inspectNeighborhoodReadiness({ ...populated, population_source: "Census", population_vintage: "2000" }).structuralProblems).toEqual([]);
    expect(inspectNeighborhoodReadiness({ ...row, population: "53,227" }).structuralProblems).toContain("population conflicts with population_unavailable_reason");
  });
  it("requires active canonical containment, meaningful tags and valid own coordinates", () => {
    const result = inspectNeighborhoodReadiness({
      ...row, has_valid_municipal_parent: false, latitude: 91, longitude: "NaN", tags: [" "], parent_geo_id: 617,
    });
    expect(result.structuralProblems).toEqual(expect.arrayContaining([
      "latitude is missing or invalid", "longitude is missing or invalid",
      "tags must be a non-empty array of strings", "parent_geo_id is missing or invalid",
      "active sourced municipal containment to the canonical same-state city is missing",
    ]));
  });
  it("does not certify populated columns as sourced, current neighborhood facts", () => {
    const result = inspectNeighborhoodReadiness({
      ...row, population: 1000, population_unavailable_reason: null, population_source: "Source", population_vintage: "2024",
      density: 100, avg_home_value: "350000", median_rent: "1500", crime: "A", pace_category: "suburban",
      has_va: false, nearest_va: "Clinic", distance_to_va: "30 miles", is_candidate: true,
    });
    expect(result.structuralProblems).toEqual([]);
    expect(result.profileDataProblems).toEqual([]);
    expect(result.reviewProblems).toHaveLength(2);
  });
  it("does not accept unknowns, malformed numbers, negative distances or invalid population", () => {
    const result = inspectNeighborhoodReadiness({ ...row, population: "unknown", avg_home_value: "350k", median_rent: false,
      has_va: false, nearest_va: "Clinic", distance_to_va: -1 });
    expect(result.profileDataProblems).toEqual(expect.arrayContaining([
      "population needs a positive local measurement", "avg_home_value needs a positive local measurement",
      "median_rent needs a positive local measurement", "VA access must be refreshed from the neighborhood's own coordinates",
    ]));
    expect(inspectNeighborhoodReadiness({ ...row, population: -3 }).structuralProblems).toContain("population must be a positive integer");
  });
});

describe("locationCsvCompletionProblems", () => {
  const community = {
    City: "Midland", State: "GA", County: "Muscogee", GeoType: "neighborhood", IsCandidate: "No",
    ParentSlug: "ga-columbus", ParentSource: "Census point-in-polygon evidence",
    Latitude: "32.574867", Longitude: "-84.827156", BoundarySource: "USGS GNIS 318098",
    Description: "Named community within Columbus.", Tags: '["community"]',
    PopulationUnavailableReason: "GNIS point has no defined population boundary; ZCTA is not the community.",
  };
  it("allows documented unavailable population only for a non-candidate neighborhood", () => {
    expect(locationCsvCompletionProblems(community, "neighborhood", false)).toEqual([]);
    expect(locationCsvCompletionProblems(community, "neighborhood", true)).toContain("Population is blank");
    expect(locationCsvCompletionProblems(community, "cdp", false)).toContain("Population is blank");
    expect(locationCsvCompletionProblems({ ...community, ParentSource: "" }, "neighborhood", false)).toContain("ParentSource is blank");
    expect(locationCsvCompletionProblems({ ...community, PopulationUnavailableReason: "" }, "neighborhood", false)).toContain("Population is blank");
  });
  it("still requires provenance for a supplied neighborhood population", () => {
    const errors = locationCsvCompletionProblems({ ...community, Population: "100", PopulationUnavailableReason: "" }, "neighborhood", false);
    expect(errors).toContain("Population is set but PopulationSource is blank");
    expect(errors).toContain("Population is set but PopulationVintage is blank");
  });
  it("accepts a complete row with explicit negative booleans", () => {
    expect(locationCsvCompletionProblems(completeRow)).toEqual([]);
  });

  it("rejects the core fields that previously slipped through as blanks", () => {
    const incomplete = { ...completeRow, TCI: "", CrimeRating: "?", Gas: "NA", DefenseHub: "", HasWalmart: "" };
    expect(locationCsvCompletionProblems(incomplete)).toEqual([
      "TCI is blank",
      "CrimeRating is blank",
      "DefenseHub is blank",
      "HasWalmart is blank",
      "Gas is blank",
    ]);
  });

  it("requires deliberate booleans and structured tags", () => {
    const invalid = { ...completeRow, DefenseHub: "maybe", HasCostco: "maybe", Tags: "Hiking" };
    expect(locationCsvCompletionProblems(invalid)).toEqual([
      "DefenseHub must be an explicit Yes/No value",
      "HasCostco must be an explicit Yes/No value",
      "Tags must be a non-empty JSON array",
    ]);
  });

  it("accepts documented not-rated MEI values without treating them as missing", () => {
    const notRated = { ...completeRow, LGBTQ_MEI: "Not Rated" };
    expect(locationCsvCompletionProblems(notRated)).toEqual([]);
  });

  it("rejects arbitrary nonnumeric MEI values", () => {
    const invalid = { ...completeRow, LGBTQ_MEI: "not researched" };
    expect(locationCsvCompletionProblems(invalid)).toEqual([
      "LGBTQ_MEI must be numeric or Not Rated",
    ]);
  });

  it("explains the next expected action for DB completion gaps", () => {
    expect(formatCompletionProblem("defense_hub_manual")).toContain("run recompute-defense-hub.ts");
    expect(formatCompletionProblem("gas_price")).toContain("AAA or EIA regular-gas price");
  });

  it("computes the issue #20 legacy core-field gap queue", () => {
    const missing = missingLegacyCoreFields({
      tci: null,
      crime: "",
      gas_price: "$3.19",
      defense_hub_manual: false,
    });
    expect(missing.map((requirement) => requirement.field)).toEqual(["tci", "crime"]);
  });
});
