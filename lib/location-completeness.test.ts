import { describe, expect, it } from "vitest";
import {
  formatCompletionProblem,
  locationCsvCompletionProblems,
  missingLegacyCoreFields,
  REQUIRED_LOCATION_CSV_COLUMNS,
} from "./location-completeness";

const completeRow = Object.fromEntries(
  REQUIRED_LOCATION_CSV_COLUMNS.map((column) => [column, "1"])
) as Record<string, string>;

Object.assign(completeRow, {
  City: "Example", State: "EX", VA: "No", TechHub: "Y", DefenseHub: "N",
  HasWalmart: "N", HasCostco: "Y",
  Tags: '["Hiking"]', Gas: "$3.19", CrimeRating: "Low", Description: "Sourced city summary.",
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
