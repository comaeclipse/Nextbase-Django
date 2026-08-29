import { describe, expect, it } from "vitest";
import {
  loadCareerTransitionCsvCatalog,
  normalizeSpecialtyKey,
  resolveSpecialty,
  searchSpecialties,
  sortRoleMatches,
  validateSourceFields,
  type MilitaryBranch,
  type MilitarySpecialty,
} from "./career-transition";

function specialty(
  branch: MilitaryBranch,
  code: string,
  title: string,
  overrides: Partial<MilitarySpecialty> = {}
): MilitarySpecialty {
  return {
    id: overrides.id ?? 1,
    branch,
    code_system: overrides.code_system ?? "Rating",
    code,
    title,
    population: overrides.population ?? "enlisted",
    status: overrides.status ?? "current",
    source_kind: overrides.source_kind ?? "official_crosswalk",
    source_url: overrides.source_url ?? "https://example.com",
    source_retrieved_on: overrides.source_retrieved_on ?? "2026-08-29",
  };
}

// Fixture modelling the post-Phase-1 catalog: both the aviation rate (AE, seeded
// today) and the shipboard rate (EM, seeded by issue #219) are present.
const RESOLVER_FIXTURE = {
  specialties: [
    specialty("navy", "AE", "Aviation Electrician's Mate", { id: 1 }),
    specialty("navy", "EM", "Electrician's Mate", { id: 2 }),
    specialty("navy", "AO", "Aviation Ordnanceman", { id: 3 }),
  ],
};

describe("resolveSpecialty (issue #221)", () => {
  it('treats bare "navy electrician" as ambiguous — never auto-picks AE', () => {
    const result = resolveSpecialty(RESOLVER_FIXTURE, "navy electrician");
    expect(result.status).toBe("ambiguous");
    if (result.status !== "ambiguous") throw new Error("expected ambiguous");
    expect(result.term).toBe("electrician");
    expect(result.candidates.map((c) => c.code).sort()).toEqual(["AE", "EM"]);
  });

  it("honors an explicit branch hint for the ambiguous term", () => {
    const result = resolveSpecialty(RESOLVER_FIXTURE, "electrician", "navy");
    expect(result.status).toBe("ambiguous");
  });

  it('resolves "navy EM" to the shipboard rate', () => {
    const result = resolveSpecialty(RESOLVER_FIXTURE, "navy EM");
    expect(result.status).toBe("resolved");
    if (result.status !== "resolved") throw new Error("expected resolved");
    expect(result.specialty.code).toBe("EM");
  });

  it('resolves "Electrician\'s Mate" to EM and infers the Navy', () => {
    const result = resolveSpecialty(RESOLVER_FIXTURE, "Electrician's Mate");
    expect(result.status).toBe("resolved");
    if (result.status !== "resolved") throw new Error("expected resolved");
    expect(result.specialty.code).toBe("EM");
  });

  it('resolves "navy AE" and "aviation electrician" to the aviation rate', () => {
    for (const q of ["navy AE", "aviation electrician"]) {
      const result = resolveSpecialty(RESOLVER_FIXTURE, q);
      expect(result.status, q).toBe("resolved");
      if (result.status !== "resolved") throw new Error("expected resolved");
      expect(result.specialty.code, q).toBe("AE");
    }
  });

  it("resolves an unambiguous exact title", () => {
    const result = resolveSpecialty(RESOLVER_FIXTURE, "Aviation Ordnanceman");
    expect(result.status).toBe("resolved");
    if (result.status !== "resolved") throw new Error("expected resolved");
    expect(result.specialty.code).toBe("AO");
  });

  it("returns uncovered — never a neighbor — for an unseeded specialty", () => {
    const result = resolveSpecialty(RESOLVER_FIXTURE, "navy underwater welder");
    expect(result.status).toBe("uncovered");
  });

  it("stays ambiguous against the real seed even before EM is seeded", () => {
    // Integrity in production today: EM is not in the CSV bundle yet, but the
    // resolver must still ask rather than return AE.
    const catalog = loadCareerTransitionCsvCatalog();
    expect(catalog.specialties.some((s) => s.branch === "navy" && s.code === "EM")).toBe(false);

    const result = resolveSpecialty(catalog, "navy electrician");
    expect(result.status).toBe("ambiguous");
    if (result.status !== "ambiguous") throw new Error("expected ambiguous");
    const em = result.candidates.find((c) => c.code === "EM");
    const ae = result.candidates.find((c) => c.code === "AE");
    expect(em?.specialty).toBeNull(); // not seeded yet
    expect(ae?.specialty).not.toBeNull(); // AE is seeded today
  });
});

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
    expect(searchSpecialties(catalog.specialties, "navy", "ctt")[0]?.code).toBe("CTT");
    expect(searchSpecialties(catalog.specialties, "army", "electromagnetic")[0]?.code).toBe("17E");
    expect(searchSpecialties(catalog.specialties, "space_force", "cyber")[0]?.code).toBe("5C0X1");
    expect(searchSpecialties(catalog.specialties, "coast_guard", "mission")[0]?.code).toBe("CMS");
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
    expect(catalog.roles.map((role) => role.slug)).toContain("cyber-operator");
    expect(catalog.roles.map((role) => role.slug)).toContain("dfir-analyst");
    expect(catalog.roles.map((role) => role.slug)).toContain("space-cybersecurity-specialist");
    expect(catalog.roles.map((role) => role.slug)).toContain("electronic-warfare-specialist");
    expect(catalog.roles.map((role) => role.slug)).toContain("elint-analyst");
    expect(catalog.roles.map((role) => role.slug)).toContain("rf-systems-technician");
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
