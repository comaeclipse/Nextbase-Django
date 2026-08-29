import { describe, expect, it } from "vitest";
import { parseGenreAssignmentsFile } from "./genre-assignments";

function validFile() {
  return {
    ontology_version: "city_genres_v1",
    method_version: "nanogenre_taxonomy_v1",
    assignments: [
      {
        city: "Casper",
        state: "WY",
        level: "micro",
        genre_key: "regional_service_hub",
        is_primary: true,
        confidence: 0.8,
        rationale: "Recurring regional-service structure.",
        evidence: {
          feature_keys: ["geographic_isolation"],
          dossier_keys: ["nanogenre_proposal_v1_2026"],
        },
        assigned_on: "2026-08-25",
      },
    ],
  };
}

describe("genre assignment files", () => {
  it("accepts a grounded assignment file", () => {
    expect(parseGenreAssignmentsFile(validFile(), "test.json").errors).toEqual([]);
  });

  it("rejects notes as the only evidence", () => {
    const source = validFile();
    source.assignments[0].evidence = { notes: ["Needs evidence later"] } as never;
    expect(parseGenreAssignmentsFile(source, "test.json").errors).toContain(
      "test.json assignments[0]: at least one evidence reference is required"
    );
  });

  it("rejects two primary genres at the same city and level", () => {
    const source = validFile();
    source.assignments.push({
      ...source.assignments[0],
      genre_key: "historic_coastal_port_city",
    });
    expect(
      parseGenreAssignmentsFile(source, "test.json").errors.some((error) =>
        error.includes("more than one primary assignment")
      )
    ).toBe(true);
  });

  it("rejects unknown fields and stale ontology versions", () => {
    const source = { ...validFile(), ontology_version: "city_genres_v0", extra: true };
    const errors = parseGenreAssignmentsFile(source, "test.json").errors;
    expect(errors).toContain('test.json: unknown field "extra"');
    expect(errors.some((error) => error.includes("ontology_version must be"))).toBe(true);
  });

  it("reports malformed file and evidence types without throwing", () => {
    const source = validFile() as unknown as Record<string, unknown>;
    source.method_version = 3;
    const assignments = source.assignments as Array<Record<string, unknown>>;
    assignments[0].evidence = { feature_keys: "geographic_isolation" };

    expect(() => parseGenreAssignmentsFile(source, "test.json")).not.toThrow();
    const errors = parseGenreAssignmentsFile(source, "test.json").errors;
    expect(errors).toContain("test.json: method_version is required");
    expect(errors).toContain(
      "test.json assignments[0] evidence.feature_keys: must be an array"
    );
  });
});
