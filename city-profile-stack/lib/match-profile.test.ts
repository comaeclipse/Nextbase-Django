import { describe, expect, it } from "vitest";
import {
  scoreCitiesAgainstProfile,
  validateProfile,
  type Profile,
} from "./city-queries";

function cell(v: number, c = 0.9, p = "derived_structural") {
  return { v, c, p };
}

function city(
  id: string,
  label: string,
  features: Record<string, ReturnType<typeof cell>>
) {
  return {
    id,
    label,
    features: new Map(Object.entries(features)),
  };
}

describe("scoreCitiesAgainstProfile strict missing data", () => {
  const basePrefs: Profile = {
    name: "Verified VA only",
    preferences: {
      va_outpatient_access: {
        min: 0.6,
        importance: 0.9,
        dealbreaker: true,
        requireKnown: true,
      },
      housing_affordability: { min: 0.4, importance: 0.5 },
    },
  };

  it("disqualifies a city when a dealbreaker trait is missing", () => {
    const result = scoreCitiesAgainstProfile(basePrefs, [
      city("a", "Alpha, AA", {
        housing_affordability: cell(0.9),
        // no va_outpatient_access
      }),
      city("b", "Beta, BB", {
        housing_affordability: cell(0.5),
        va_outpatient_access: cell(0.8),
      }),
    ]);

    const alpha = result.ranked.find((r) => r.city === "Alpha, AA")!;
    const beta = result.ranked.find((r) => r.city === "Beta, BB")!;
    expect(alpha.disqualified).toBe(true);
    expect(alpha.unknown).toContain("va_outpatient_access");
    expect(beta.disqualified).toBe(false);
    expect(result.ranked[0].city).toBe("Beta, BB");
    expect(result.scopeNote).toMatch(/profile features/);
  });

  it("disqualifies when requireKnown is set without dealbreaker", () => {
    const profile: Profile = {
      name: "Require known street life",
      preferences: {
        street_life_vibrancy: { min: 0.5, importance: 0.7, requireKnown: true },
        housing_affordability: { min: 0.3, importance: 0.4 },
      },
    };
    const result = scoreCitiesAgainstProfile(profile, [
      city("a", "Quiet, QQ", { housing_affordability: cell(0.9) }),
      city("b", "Alive, AL", {
        housing_affordability: cell(0.5),
        street_life_vibrancy: cell(0.7, 0.8, "editorial"),
      }),
    ]);
    expect(result.ranked.find((r) => r.city === "Quiet, QQ")!.disqualified).toBe(true);
    const alive = result.ranked.find((r) => r.city === "Alive, AL")!;
    expect(alive.disqualified).toBe(false);
    expect(alive.hits.find((h) => h.feature === "street_life_vibrancy")!.source).toBe("researched");
  });

  it("keeps missing non-dealbreaker traits as unknown without disqualifying", () => {
    const profile: Profile = {
      name: "Nice to have street life",
      preferences: {
        street_life_vibrancy: { min: 0.5, importance: 0.3 },
        housing_affordability: { min: 0.4, importance: 0.8 },
      },
    };
    const result = scoreCitiesAgainstProfile(profile, [
      city("a", "Unknown Downtown, UD", { housing_affordability: cell(0.85) }),
    ]);
    const row = result.ranked[0];
    expect(row.disqualified).toBe(false);
    expect(row.unknown).toEqual(["street_life_vibrancy"]);
  });

  it("disqualifies when a known dealbreaker value misses the threshold", () => {
    const result = scoreCitiesAgainstProfile(basePrefs, [
      city("a", "Far VA, FV", {
        housing_affordability: cell(0.9),
        va_outpatient_access: cell(0.1),
      }),
    ]);
    expect(result.ranked[0].disqualified).toBe(true);
    expect(result.ranked[0].hits.some((h) => h.dealbroken)).toBe(true);
  });

  it("includes cities that only fail on missing required traits as disqualified", () => {
    const profile: Profile = {
      name: "VA only",
      preferences: {
        va_outpatient_access: {
          min: 0.6,
          importance: 1,
          dealbreaker: true,
          requireKnown: true,
        },
      },
    };
    const result = scoreCitiesAgainstProfile(profile, [
      city("a", "No VA Feature, NV", { housing_affordability: cell(0.9) }),
    ]);
    expect(result.citiesScored).toBe(1);
    expect(result.disqualifiedCount).toBe(1);
    expect(result.ranked[0].topProblem).toMatch(/no data for/);
  });
});

describe("scoreCitiesAgainstProfile unsupported proxies", () => {
  // Issue #18: "low taxes" must not be scored via a proxy. The ontology has no
  // tax trait, so any tax-shaped preference key must be rejected at validation
  // time rather than silently ranked. If someone later adds a real tax feature,
  // this test forces a conscious update.
  it("refuses to rank an unsupported tax trait", () => {
    expect(() =>
      validateProfile({
        name: "Low taxes",
        preferences: { tax_burden: { min: 0.6, importance: 0.9 } },
      })
    ).toThrow(/Unknown feature "tax_burden"/);
  });

  it("refuses a low_taxes key as well", () => {
    expect(() =>
      validateProfile({
        name: "Low taxes",
        preferences: { low_taxes: { min: 0.6, importance: 0.9 } },
      })
    ).toThrow(/Unknown feature "low_taxes"/);
  });
});
