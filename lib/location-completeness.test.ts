import { describe, expect, it } from "vitest";
import { locationCsvCompletionProblems, REQUIRED_LOCATION_CSV_COLUMNS } from "./location-completeness";

const completeRow = Object.fromEntries(
  REQUIRED_LOCATION_CSV_COLUMNS.map((column) => [column, "1"])
) as Record<string, string>;

Object.assign(completeRow, {
  City: "Example", State: "EX", VA: "No", TechHub: "Y", DefenseHub: "N",
  HasWalmart: "N", HasCostco: "Y",
  Tags: '["Hiking"]', Gas: "$3.19", CrimeRating: "Low", Description: "Sourced city summary.",
});

describe("locationCsvCompletionProblems", () => {
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
});
