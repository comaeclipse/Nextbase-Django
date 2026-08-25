import { describe, expect, it } from "vitest";
import {
  GENRE_ONTOLOGY_VERSION,
  GENRES,
  getGenre,
  validateGenreAssignment,
  validateGenreOntology,
} from "./genre-ontology";

describe("genre ontology", () => {
  it("contains only internally valid definitions", () => {
    expect(validateGenreOntology()).toEqual([]);
  });

  it("keeps anchor and position traits out of the service-hub identity", () => {
    const genre = getGenre("regional_service_hub");
    expect(genre.status).toBe("provisional");
    expect(genre.priorLabels).toContain("Interior Regional Service Hub");
    expect(genre.validationMembers).toContain("Pensacola, FL");
    expect(genre.variableTraitKeys).toContain("economic_cycle_exposure");
    expect(genre.variableTraitKeys).toContain("wind_exposure");
  });

  it("does not admit a broad or nano genre before evidence supports one", () => {
    expect(GENRES.every((genre) => genre.level === "micro")).toBe(true);
    expect(GENRES.every((genre) => genre.status === "provisional")).toBe(true);
  });

  it("accepts a grounded assignment using the current ontology", () => {
    expect(
      validateGenreAssignment({
        level: "micro",
        genreKey: "regional_service_hub",
        isPrimary: true,
        confidence: 0.82,
        rationale: "Regional institutions serve a broad hinterland.",
        evidence: { featureKeys: ["geographic_isolation"] },
        ontologyVersion: GENRE_ONTOLOGY_VERSION,
        methodVersion: "nanogenre_taxonomy_v1",
        assignedOn: "2026-08-25",
      })
    ).toEqual([]);
  });

  it("rejects ungrounded, mismatched, or partially reviewed assignments", () => {
    const errors = validateGenreAssignment({
      level: "nano",
      genreKey: "regional_service_hub",
      isPrimary: true,
      confidence: 1.2,
      rationale: "",
      evidence: {},
      ontologyVersion: "old_version",
      methodVersion: "",
      assignedOn: "08/25/2026",
      reviewedBy: "reviewer",
    });

    expect(errors).toContain('genre "regional_service_hub" is micro, not nano');
    expect(errors).toContain("confidence must be between 0 and 1");
    expect(errors).toContain("rationale is required");
    expect(errors).toContain("at least one evidence reference is required");
    expect(errors).toContain("reviewedBy and reviewedAt must be provided together");
  });
});
