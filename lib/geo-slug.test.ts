import { describe, expect, it } from "vitest";
import { geoSlug, slugifyName } from "./geo-slug";
import {
  REQUIRED_LOCATION_CSV_COLUMNS,
  geoTypeOf,
  isCandidateOf,
  locationCsvCompletionProblems,
} from "./location-completeness";

/**
 * The migration's SQL, reimplemented here so the TypeScript and the SQL can be
 * asserted equal on the same inputs. If someone "tidies" one of them, this
 * fails rather than letting the importer miss an existing row and insert a
 * duplicate under a near-identical slug.
 *
 *   lower(state) || '-' ||
 *   regexp_replace(regexp_replace(lower(name), '[^a-z0-9]+', '-', 'g'),
 *                  '(^-|-$)', '', 'g')
 */
function sqlSlugExpression(name: string, state: string): string {
  const inner = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return `${state.toLowerCase()}-${inner.replace(/^-/, "").replace(/-$/, "")}`;
}

describe("slugifyName", () => {
  it.each([
    ["Los Angeles", "los-angeles"],
    ["Canoga Park", "canoga-park"],
    ["Winston-Salem", "winston-salem"],
    ["St. Louis", "st-louis"],
    ["Coeur d'Alene", "coeur-d-alene"],
    ["Lake Havasu City", "lake-havasu-city"],
    ["  Padded  ", "padded"],
  ])("%s -> %s", (input, expected) => {
    expect(slugifyName(input)).toBe(expected);
  });
});

describe("geoSlug", () => {
  it("prefixes a top-level place with its state", () => {
    expect(geoSlug("Los Angeles", "CA")).toBe("ca-los-angeles");
  });

  it("nests a contained place under its parent's slug", () => {
    expect(geoSlug("Canoga Park", "CA", "ca-los-angeles")).toBe(
      "ca-los-angeles-canoga-park"
    );
  });

  it("keeps two same-named neighborhoods distinct by parent", () => {
    // The exact case that silently overwrote under the old (name, state) key.
    const a = geoSlug("Downtown", "CA", "ca-los-angeles");
    const b = geoSlug("Downtown", "CA", "ca-san-diego");
    expect(a).not.toBe(b);
  });

  it("matches the SQL backfill expression for top-level places", () => {
    const cases: [string, string][] = [
      ["Los Angeles", "CA"],
      ["Winston-Salem", "NC"],
      ["St. Louis", "MO"],
      ["Coeur d'Alene", "ID"],
      ["Fort Walton Beach", "FL"],
    ];
    for (const [name, state] of cases) {
      expect(geoSlug(name, state)).toBe(sqlSlugExpression(name, state));
    }
  });
});

describe("geoTypeOf", () => {
  it("defaults to city, so an existing CSV is unchanged", () => {
    expect(geoTypeOf({ City: "Trenton", State: "NJ" })).toBe("city");
    expect(geoTypeOf({ GeoType: "" })).toBe("city");
  });

  it("reads a declared type case-insensitively", () => {
    expect(geoTypeOf({ GeoType: "Neighborhood" })).toBe("neighborhood");
    expect(geoTypeOf({ GeoType: "metro" })).toBe("metro");
  });

  it("falls back to city for an unrecognized value", () => {
    // The completion gate reports the bad value; this must not throw.
    expect(geoTypeOf({ GeoType: "borough" })).toBe("city");
  });
});

describe("locationCsvCompletionProblems", () => {
  const completeCity = Object.fromEntries(
    REQUIRED_LOCATION_CSV_COLUMNS.map((c) => [c, "x"])
  ) as Record<string, string>;
  completeCity.Tags = '["retirement"]';
  completeCity.LGBTQ_MEI = "100";
  for (const b of ["VA", "TechHub", "DefenseHub", "HasWalmart", "HasCostco"]) {
    completeCity[b] = "Yes";
  }

  const neighborhood = {
    City: "Canoga Park",
    State: "CA",
    County: "Los Angeles",
    GeoType: "neighborhood",
    ParentSlug: "ca-los-angeles",
    Latitude: "34.2011",
    Longitude: "-118.5981",
    Population: "60,578",
    PopulationSource: "ACS 2019-2023 tract aggregation",
    PopulationVintage: "acs_2019_2023",
    BoundarySource: "LA Times Mapping L.A.",
    Description: "A San Fernando Valley neighborhood.",
    Tags: '["suburban"]',
  };

  it("accepts a complete city with no geoType argument", () => {
    expect(locationCsvCompletionProblems(completeCity)).toEqual([]);
  });

  it("rejects a neighborhood judged against the city column set", () => {
    // Proves the gate genuinely changes shape rather than being permissive.
    expect(locationCsvCompletionProblems(neighborhood, "city").length).toBeGreaterThan(10);
  });

  it("accepts a complete neighborhood", () => {
    expect(locationCsvCompletionProblems(neighborhood, "neighborhood")).toEqual([]);
  });

  it("requires a parent", () => {
    const { ParentSlug: _drop, ...orphan } = neighborhood;
    expect(locationCsvCompletionProblems(orphan, "neighborhood")).toContain(
      "ParentSlug is blank"
    );
  });

  it("requires population provenance when a population is given", () => {
    const { PopulationSource: _drop, ...noSource } = neighborhood;
    const problems = locationCsvCompletionProblems(noSource, "neighborhood");
    expect(problems).toContain("PopulationSource is blank");
    expect(problems).toContain("Population is set but PopulationSource is blank");
  });

  it("refuses a hand-written VA distance, which must be recomputed", () => {
    const problems = locationCsvCompletionProblems(
      { ...neighborhood, DistanceToVA: "8 mi" },
      "neighborhood"
    );
    expect(problems.some((p) => p.startsWith("DistanceToVA must not be set"))).toBe(true);
  });

  it("does not hold a structural parent city to the curated column set", () => {
    // Los Angeles exists so Canoga Park has a municipality to inherit from.
    // It is not a retirement destination, so demanding a TCI and a crime grade
    // for it would be demanding research nobody will ever read.
    const parentCity = {
      City: "Los Angeles",
      State: "CA",
      County: "Los Angeles",
      GeoType: "city",
      IsCandidate: "No",
      Description: "The second-largest city in the United States.",
      Tags: '["urban"]',
    };
    expect(locationCsvCompletionProblems(parentCity, "city", false)).toEqual([]);
    // ...but as a candidate it is judged like any other curated city.
    expect(
      locationCsvCompletionProblems(parentCity, "city", true).length
    ).toBeGreaterThan(10);
  });

  it("treats silence as candidacy for a city, so existing CSVs are unchanged", () => {
    expect(isCandidateOf({ City: "Trenton" }, "city")).toBe(true);
    expect(isCandidateOf({ IsCandidate: "No" }, "city")).toBe(false);
    // A neighborhood is never promoted by silence.
    expect(isCandidateOf({ City: "Canoga Park" }, "neighborhood")).toBe(false);
  });

  it("does not demand identity fields a container geography lacks", () => {
    const metro = {
      City: "Los Angeles-Long Beach-Anaheim",
      State: "CA",
      GeoType: "metro",
      Description: "The Los Angeles CBSA.",
      Tags: '["metro"]',
    };
    expect(locationCsvCompletionProblems(metro, "metro")).toEqual([]);
  });
});
