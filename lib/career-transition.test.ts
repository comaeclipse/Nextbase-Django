import { describe, expect, it } from "vitest";
import {
  loadCareerTransitionCsvCatalog,
  normalizeSpecialtyKey,
  searchSpecialties,
  sortRoleMatches,
  validateSourceFields,
} from "./career-transition";

describe("career-transition taxonomy", () => {
  it("normalizes branch and specialty codes into stable keys", () => {
    expect(normalizeSpecialtyKey("army", " 15t ")).toBe("army:15T");
    expect(normalizeSpecialtyKey("air_force", "2a5 x1")).toBe("air_force:2A5X1");
  });

  it("searches branch specialties by code or title", () => {
    const catalog = loadCareerTransitionCsvCatalog();

    expect(searchSpecialties(catalog.specialties, "army", "15t")[0]?.code).toBe("15T");
    expect(searchSpecialties(catalog.specialties, "navy", "machinist")[0]?.code).toBe("AD");
    expect(searchSpecialties(catalog.specialties, "navy", "ordnance")[0]?.code).toBe("AO");
    expect(searchSpecialties(catalog.specialties, "navy", "gunner")[0]?.code).toBe("GM");
    expect(searchSpecialties(catalog.specialties, "space_force", "")).toEqual([]);
  });

  it("sorts role matches by fit score, then directness", () => {
    const sorted = sortRoleMatches([
      { fit_score: 80, directness: "adjacent" as const },
      { fit_score: 90, directness: "requires_gap" as const },
      { fit_score: 90, directness: "direct" as const },
    ]);

    expect(sorted.map((match) => match.directness)).toEqual([
      "direct",
      "requires_gap",
      "adjacent",
    ]);
  });
});

describe("career-transition csv bundle", () => {
  it("loads a seeded catalog with roles and employers for every seeded specialty", () => {
    const catalog = loadCareerTransitionCsvCatalog();

    expect(catalog.source).toBe("csv_fallback");
    expect(catalog.specialties.length).toBeGreaterThanOrEqual(12);
    expect(catalog.roles.length).toBeGreaterThan(0);
    expect(catalog.employers.length).toBeGreaterThan(0);
    expect(catalog.roles.map((role) => role.slug)).toContain("naval-weapons-technician");
    expect(catalog.roles.map((role) => role.slug)).toContain("qasas-specialist");
    expect(
      catalog.matches.filter((match) => match.roles.length === 0 || match.employers.length === 0)
    ).toEqual([]);
  });

  it("requires source metadata on curated rows", () => {
    expect(() =>
      validateSourceFields(
        { SourceKind: "official_crosswalk", SourceUrl: "https://example.com" },
        "broken row"
      )
    ).toThrow("broken row missing SourceRetrievedOn");
  });

  it("keeps unmapped employers distinct from zero-location employer footprints", () => {
    const catalog = loadCareerTransitionCsvCatalog();
    const uh60 = catalog.matches.find((match) => match.specialty.code === "15T");

    expect(uh60).toBeDefined();
    expect(
      uh60?.employers.some(
        (match) => match.employer.slug === "air-methods" && match.mapped_location_count === null
      )
    ).toBe(true);
  });
});
