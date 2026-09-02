import { describe, expect, it } from "vitest";
import {
  loadCareerTransitionCsvCatalog,
  parseSkillBridgeParticipationType,
  parseSkillBridgeStatus,
  skillBridgeScoreBonus,
  effectiveEmployerFitScore,
  normalizeSpecialtyKey,
  resolveSpecialty,
  searchSpecialties,
  sortRoleMatches,
  validateSourceFields,
  type MilitaryBranch,
  type MilitarySpecialty,
  type EmployerMatchView,
  type TransitionEmployer,
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

  it('treats an "aircraft carrier" electrician as ambiguous, not aviation AE', () => {
    // A carrier is a ship that carries BOTH aviation (AE) and ship's (EM)
    // electricians; "aircraft" must not auto-resolve the shipboard context to AE.
    for (const q of [
      "navy electrician aboard an aircraft carrier",
      "electrician on aircraft carrier navy",
    ]) {
      const result = resolveSpecialty(RESOLVER_FIXTURE, q);
      expect(result.status, q).toBe("ambiguous");
      if (result.status !== "ambiguous") throw new Error("expected ambiguous");
      expect(result.candidates.map((c) => c.code).sort(), q).toEqual(["AE", "EM"]);
    }
  });

  it('resolves "navy AE" and "aviation electrician" to the aviation rate', () => {
    for (const q of ["navy AE", "aviation electrician", "navy aircraft electrician"]) {
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

  it("asks even when only the aviation rate is seeded — never returns AE", () => {
    // Integrity guarantee independent of catalog contents: with ONLY AE seeded,
    // "electrician" must still ask, not auto-resolve to the one seeded neighbor.
    // Uses an explicit AE-only fixture so a later data seed of EM (issue #219)
    // cannot silently invalidate this test's premise.
    const aeOnly = {
      specialties: [specialty("navy", "AE", "Aviation Electrician's Mate", { id: 1 })],
    };

    const result = resolveSpecialty(aeOnly, "navy electrician");
    expect(result.status).toBe("ambiguous");
    if (result.status !== "ambiguous") throw new Error("expected ambiguous");
    const em = result.candidates.find((c) => c.code === "EM");
    const ae = result.candidates.find((c) => c.code === "AE");
    expect(em?.specialty).toBeNull(); // EM absent from this fixture
    expect(ae?.specialty).not.toBeNull(); // AE present
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
    expect(searchSpecialties(catalog.specialties, "navy", "stg")[0]?.code).toBe("STG");
    // "submarines" now matches several ratings by title — STS plus the ITS/ITN/ITR
    // Information Systems Technician Submarines ratings — and results sort by code,
    // so assert STS is among the hits rather than pinning it to first place.
    expect(
      searchSpecialties(catalog.specialties, "navy", "submarines").map((s) => s.code)
    ).toContain("STS");
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
    expect(catalog.listingEvidence.length).toBeGreaterThan(0);
    expect(catalog.roles.map((role) => role.slug)).toContain("naval-weapons-technician");
    expect(catalog.roles.map((role) => role.slug)).toContain("qasas-specialist");
    expect(catalog.roles.map((role) => role.slug)).toContain("cyber-operator");
    expect(catalog.roles.map((role) => role.slug)).toContain("dfir-analyst");
    expect(catalog.roles.map((role) => role.slug)).toContain("space-cybersecurity-specialist");
    expect(catalog.roles.map((role) => role.slug)).toContain("electronic-warfare-specialist");
    expect(catalog.roles.map((role) => role.slug)).toContain("elint-analyst");
    expect(catalog.roles.map((role) => role.slug)).toContain("rf-systems-technician");
    expect(catalog.roles.map((role) => role.slug)).toContain("sonar-systems-technician");
    expect(catalog.roles.map((role) => role.slug)).toContain("acoustic-analyst");
    expect(catalog.roles.map((role) => role.slug)).toContain("undersea-systems-specialist");
    expect(catalog.employers.map((employer) => employer.slug)).toContain("three-saints-bay");
    expect(catalog.employers.map((employer) => employer.slug)).toContain(
      "office-of-naval-intelligence"
    );
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

  it("loads active SkillBridge as structured employer data", () => {
    const catalog = loadCareerTransitionCsvCatalog();
    const l3harris = catalog.employers.find((employer) => employer.slug === "l3harris");

    expect(l3harris?.skillbridge_status).toBe("active");
    expect(l3harris?.skillbridge_participation_type).toBe("direct_employer");
    expect(l3harris?.skillbridge_pathways).toContain("dedicated_requisitions");
    expect(l3harris?.skillbridge_target_domains).toContain("ew_rf");
    expect(l3harris?.skillbridge_source_url).toContain("bridge");
  });

  it("keeps unverified SkillBridge fields unknown/null rather than false", () => {
    const catalog = loadCareerTransitionCsvCatalog();
    const collins = catalog.employers.find((employer) => employer.slug === "collins-aerospace");

    expect(collins?.skillbridge_status).toBe("unknown");
    expect(collins?.skillbridge_participation_type).toBeNull();
    expect(collins?.skillbridge_remote_available).toBeNull();
    expect(collins?.skillbridge_pathways).toEqual([]);
  });

  it("rejects unsupported SkillBridge enum values", () => {
    expect(() => parseSkillBridgeStatus("maybe")).toThrow("Unsupported SkillBridge status");
    expect(() => parseSkillBridgeParticipationType("vendor")).toThrow(
      "Unsupported SkillBridge participation type"
    );
  });

  it("applies SkillBridge as a capped transition ranking signal without mutating fit score", () => {
    const employer = {
      skillbridge_status: "active",
      skillbridge_participation_type: "direct_employer",
    } as TransitionEmployer;
    const match = {
      fit_score: 97,
      directness: "direct",
      employer,
    } as EmployerMatchView;

    expect(skillBridgeScoreBonus(employer)).toBe(6);
    expect(effectiveEmployerFitScore(match)).toBe(100);
    expect(match.fit_score).toBe(97);
  });

  it("loads pinned listing evidence for STG, STS, and T42A without hiding the employer", () => {
    const catalog = loadCareerTransitionCsvCatalog();
    const stg = catalog.matches.find((match) => match.specialty.code === "STG");
    const sts = catalog.matches.find((match) => match.specialty.code === "STS");
    const master = catalog.matches.find((match) => match.specialty.code === "T42A");

    expect(stg?.listingEvidence.map((evidence) => evidence.company_name)).toContain(
      "Booz Allen Hamilton"
    );
    expect(sts?.listingEvidence.map((evidence) => evidence.company_name)).toContain(
      "Three Saints Bay / Ghostrock"
    );
    expect(sts?.listingEvidence.map((evidence) => evidence.listing_title)).toContain(
      "US Navy Submarine Fire Control or SONAR Technician (FT/STS) Test Engineer"
    );
    expect(master?.listingEvidence.some((evidence) => evidence.platform_tags.includes("ACINT"))).toBe(
      true
    );
    expect(catalog.listingEvidence.every((evidence) => evidence.source_url)).toBe(true);
  });
});

describe("career-transition skills layer (issue #222)", () => {
  const catalog = loadCareerTransitionCsvCatalog();
  const skillsFor = (code: string) =>
    catalog.matches.find((m) => m.specialty.code === code)?.skills ?? [];

  it("loads skills into the catalog", () => {
    expect(catalog.skills.length).toBeGreaterThan(0);
    expect(catalog.skills.map((s) => s.slug)).toContain("shipboard-power-distribution");
    expect(catalog.skills.map((s) => s.slug)).toContain("nec-electrical-code");
    expect(catalog.skills.map((s) => s.slug)).toContain("active-passive-sonar");
    expect(catalog.skills.map((s) => s.slug)).toContain("acoustic-analysis");
  });

  it("gives every Phase 1 electrical specialty at least one skill", () => {
    for (const code of ["EM", "ET", "IC"]) {
      expect(skillsFor(code).length, code).toBeGreaterThan(0);
    }
    expect(skillsFor("12R").length).toBeGreaterThan(0);
  });

  it("gives EM electrical skills, not avionics", () => {
    const slugs = skillsFor("EM").map((m) => m.skill.slug);
    expect(slugs).toContain("shipboard-power-distribution");
    expect(slugs).toContain("marine-electrical-systems");
    expect(slugs.some((s) => s.includes("avionic"))).toBe(false);
  });

  it("carries listing keywords and kinds skills can be queried and labelled with", () => {
    const power = catalog.skills.find((s) => s.slug === "shipboard-power-distribution");
    expect(power?.skill_kind).toBe("domain");
    expect(power?.listing_keywords).toContain("power distribution");
    const nec = catalog.skills.find((s) => s.slug === "nec-electrical-code");
    expect(nec?.skill_kind).toBe("credential");
  });

  it("models NEC licensure as a gap, not a held skill, for military electricians", () => {
    const nec = skillsFor("EM").find((m) => m.skill.slug === "nec-electrical-code");
    expect(nec?.directness).toBe("requires_gap");
  });

  it("leaves uncovered specialties with empty skills — never borrowed AE skills", () => {
    // AE (aviation electrician) is seeded but has no skills; it must not inherit
    // the shipboard electrical skills.
    expect(skillsFor("AE")).toEqual([]);
    expect(skillsFor("AO")).toEqual([]);
  });

  it("gives seeded sonar specialties direct acoustic and electronics skills", () => {
    const stg = skillsFor("STG").map((m) => m.skill.slug);
    const sts = skillsFor("STS").map((m) => m.skill.slug);
    const master = skillsFor("T42A").map((m) => m.skill.slug);

    expect(stg).toContain("active-passive-sonar");
    expect(stg).toContain("sonar-electronics-maintenance");
    expect(sts).toContain("acoustic-analysis");
    expect(sts).toContain("underwater-communications");
    expect(master).toContain("acoustic-analysis");
  });
});
