import { describe, expect, it } from "vitest";
import {
  FIELD_RESOLUTION,
  describeProvenance,
  needsSourceLabel,
  resolveField,
  resolveLocationFields,
  type GeoNode,
} from "./geo-inheritance";
import type { LocationRow } from "./types";

function loc(partial: Partial<LocationRow>): LocationRow {
  return {
    id: 1,
    name: "Canoga Park",
    state: "CA",
    county: "Los Angeles",
    slug: "ca-los-angeles-canoga-park",
    geo_type: "neighborhood",
    is_candidate: false,
    parent_geo_id: 2,
    population_source: null,
    population_vintage: null,
    boundary_source: null,
    boundary_geoid: null,
    climate: null,
    cost_of_living: null,
    tags: null,
    emoji: "",
    gradient: "",
    featured: false,
    ...partial,
  } as LocationRow;
}

/** An ancestor node carrying only the columns a test cares about. */
function node(partial: Partial<GeoNode> & { row: Partial<LocationRow> }): GeoNode {
  return {
    geo_id: 2,
    slug: "ca-los-angeles",
    name: "Los Angeles",
    state: "CA",
    geo_type: "city",
    relationship: "municipal_containment",
    depth: 1,
    ...partial,
  };
}

const LA = (row: Partial<LocationRow>) => node({ row });
const LA_COUNTY = (row: Partial<LocationRow>) =>
  node({
    geo_id: 3,
    slug: "ca-los-angeles-county",
    name: "Los Angeles County",
    geo_type: "county",
    relationship: "county_containment",
    depth: 1,
    row,
  });
const LA_METRO = (row: Partial<LocationRow>) =>
  node({
    geo_id: 4,
    slug: "ca-los-angeles-metro",
    name: "Los Angeles-Long Beach-Anaheim, CA",
    geo_type: "metro",
    relationship: "metro_membership",
    depth: 1,
    row,
  });

describe("direct values always win", () => {
  it("keeps the subject's own value and marks it direct", () => {
    const r = resolveField("sales_tax", loc({ sales_tax: "9.5" }), [
      LA({ sales_tax: "9.75" }),
    ]);
    expect(r.value).toBe("9.5");
    expect(r.provenance).toEqual({ kind: "direct" });
  });

  it("treats an empty string as absent, not as a value", () => {
    const r = resolveField("climate", loc({ climate: "   " }), [
      LA({ climate: "Mediterranean" }),
    ]);
    expect(r.value).toBe("Mediterranean");
    expect(r.provenance.kind).toBe("inherited");
  });

  it("treats an empty array as absent", () => {
    const r = resolveField("tags", loc({ tags: [] }), [LA({ tags: ["x"] })]);
    // tags is policy "none", so it stays absent rather than borrowing.
    expect(r.value).toBeNull();
    expect(r.provenance).toEqual({
      kind: "absent",
      reason: "policy_forbids_inheritance",
    });
  });
});

describe("municipal inheritance", () => {
  it("takes sales tax from the containing municipality with full provenance", () => {
    const r = resolveField("sales_tax", loc({}), [LA({ sales_tax: "9.75" })]);
    expect(r.value).toBe("9.75");
    expect(r.provenance).toEqual({
      kind: "inherited",
      sourceEntityId: 2,
      sourceEntityLabel: "Los Angeles, CA",
      sourceGeoType: "city",
      relationship: "municipal_containment",
    });
    expect(r.presentation).toBe("value");
  });

  it("inherits the HRC municipal equality score, which is scored per municipality", () => {
    const r = resolveField("lgbtq_mei_score", loc({}), [LA({ lgbtq_mei_score: 100 })]);
    expect(r.value).toBe(100);
    expect(r.provenance.kind).toBe("inherited");
  });
});

describe("fallback geography is field-specific, not just 'the parent'", () => {
  it("prefers the county over the municipality for property tax", () => {
    const r = resolveField("property_tax_rate", loc({}), [
      LA({ property_tax_rate: 0.00111 }),
      LA_COUNTY({ property_tax_rate: 0.00722 }),
    ]);
    expect(r.value).toBe(0.00722);
    expect(r.provenance).toMatchObject({
      kind: "inherited",
      sourceGeoType: "county",
      relationship: "county_containment",
    });
  });

  it("falls through to the municipality when no county reports it", () => {
    const r = resolveField("property_tax_rate", loc({}), [
      LA({ property_tax_rate: 0.00111 }),
    ]);
    expect(r.value).toBe(0.00111);
    expect(r.provenance).toMatchObject({ sourceGeoType: "city" });
  });

  it("takes regional price parities from the metro, not the city", () => {
    const r = resolveField("all_items_rpp", loc({}), [
      LA({ all_items_rpp: 111 }),
      LA_METRO({ all_items_rpp: 114.5 }),
    ]);
    expect(r.value).toBe(114.5);
    expect(r.provenance).toMatchObject({
      sourceGeoType: "metro",
      relationship: "metro_membership",
    });
  });

  it("ignores an ancestor whose geo_type cannot carry the field", () => {
    // A county is not a municipality, so it must not answer for sales tax.
    const r = resolveField("sales_tax", loc({}), [LA_COUNTY({ sales_tax: "9.5" })]);
    expect(r.value).toBeNull();
    expect(r.provenance).toEqual({
      kind: "absent",
      reason: "no_eligible_ancestor",
    });
  });
});

describe("values that must never be inherited", () => {
  it("refuses to inherit population, and says the policy forbids it", () => {
    const r = resolveField("population", loc({}), [LA({ population: "3.8M" })]);
    expect(r.value).toBeNull();
    expect(r.provenance).toEqual({
      kind: "absent",
      reason: "policy_forbids_inheritance",
    });
  });

  it.each(["density", "median_rent", "avg_home_value", "near_ocean"] as const)(
    "refuses to inherit %s",
    (field) => {
      const r = resolveField(field, loc({}), [
        LA({ density: 8300, median_rent: 2100, avg_home_value: "950000", near_ocean: true }),
      ]);
      expect(r.value).toBeNull();
      expect(r.provenance).toMatchObject({ kind: "absent" });
    }
  );

  it("refuses to inherit VA access and flags it as recomputable, not forbidden", () => {
    const r = resolveField("has_va", loc({}), [LA({ has_va: true })]);
    expect(r.value).toBeNull();
    // "no_direct_value" rather than "policy_forbids_inheritance": the fix is to
    // run sync-va-facilities.ts, not to research the neighborhood by hand.
    expect(r.provenance).toEqual({ kind: "absent", reason: "no_direct_value" });
  });

  it("does not let a downtown facility make a neighborhood a defense hub", () => {
    const r = resolveField("defense_hub", loc({}), [LA({ defense_hub: true })]);
    expect(r.value).toBeNull();
  });
});

describe("context_only presentation", () => {
  it("marks inherited crime as context_only so it cannot render bare", () => {
    const r = resolveField("crime", loc({}), [LA_COUNTY({ crime: "C+" })]);
    expect(r.value).toBe("C+");
    expect(r.presentation).toBe("context_only");
    expect(needsSourceLabel(r)).toBe(true);
  });

  it("marks a citywide election margin context_only", () => {
    const r = resolveField("election_2024", loc({}), [LA({ election_2024: "Dem" })]);
    expect(r.presentation).toBe("context_only");
    expect(needsSourceLabel(r)).toBe(true);
  });

  it("does not demand a label for an ordinary direct value", () => {
    const r = resolveField("population", loc({ population: "60k" }), []);
    expect(needsSourceLabel(r)).toBe(false);
  });
});

describe("resolveLocationFields", () => {
  it("returns a city untouched and pays nothing for it", () => {
    const city = loc({ geo_type: "city", is_candidate: true, parent_geo_id: null });
    const out = resolveLocationFields(city, []);
    expect(out.row).toBe(city); // same reference: no copy, no walk
    expect(out.resolution).toEqual({});
    expect(out.chain).toEqual([]);
  });

  it("writes inherited values into the row so existing consumers need no changes", () => {
    const out = resolveLocationFields(loc({ population: "60k" }), [
      LA({ sales_tax: "9.75", climate: "Mediterranean", population: "3.8M" }),
    ]);
    expect(out.row.sales_tax).toBe("9.75");
    expect(out.row.climate).toBe("Mediterranean");
    // The neighborhood keeps its own population and does not take LA's.
    expect(out.row.population).toBe("60k");
    expect(out.resolution.population?.provenance).toEqual({ kind: "direct" });
    expect(out.resolution.sales_tax?.provenance).toMatchObject({
      kind: "inherited",
      sourceEntityLabel: "Los Angeles, CA",
    });
  });

  it("does not mutate the subject row", () => {
    const subject = loc({});
    resolveLocationFields(subject, [LA({ sales_tax: "9.75" })]);
    expect(subject.sales_tax).toBeUndefined();
  });

  it("leaves a field absent when nothing in the chain reports it", () => {
    const out = resolveLocationFields(loc({}), [LA({})]);
    expect(out.row.sales_tax ?? null).toBeNull();
    expect(out.resolution.sales_tax?.provenance).toEqual({
      kind: "absent",
      reason: "no_eligible_ancestor",
    });
  });
});

describe("registry integrity", () => {
  it("every rule that can inherit names at least one relationship", () => {
    for (const [field, rule] of Object.entries(FIELD_RESOLUTION)) {
      const canInherit = !["none", "recompute", "state"].includes(rule.fallback);
      if (canInherit) {
        expect(rule.via.length, `${field} can inherit but names no relationship`).toBeGreaterThan(0);
      }
    }
  });

  it("every rule that cannot inherit names no relationship", () => {
    for (const [field, rule] of Object.entries(FIELD_RESOLUTION)) {
      if (rule.fallback === "none" || rule.fallback === "recompute") {
        expect(rule.via.length, `${field} cannot inherit but names a relationship`).toBe(0);
      }
    }
  });

  it("every rule explains itself, or points at a rule that does", () => {
    const keys = new Set(Object.keys(FIELD_RESOLUTION));
    for (const [field, rule] of Object.entries(FIELD_RESOLUTION)) {
      // "See other_field." is a legitimate note, but only if the target
      // actually exists -- otherwise a renamed field leaves a dangling pointer.
      const ref = rule.note.match(/^See ([a-z_0-9]+)\.$/);
      if (ref) {
        expect(keys.has(ref[1]), `${field} points at unknown rule ${ref[1]}`).toBe(true);
        const target = FIELD_RESOLUTION[ref[1] as keyof typeof FIELD_RESOLUTION];
        expect(
          (target as { note: string }).note.length,
          `${field} points at ${ref[1]}, which has no substantive note`
        ).toBeGreaterThan(20);
      } else {
        expect(rule.note.length, `${field} has no note`).toBeGreaterThan(20);
      }
    }
  });
});

describe("describeProvenance", () => {
  it("says nothing for a direct value", () => {
    expect(describeProvenance(resolveField("population", loc({ population: "60k" }), []))).toBeNull();
  });

  it("names the source geography for an inherited value", () => {
    const r = resolveField("sales_tax", loc({}), [LA({ sales_tax: "9.75" })]);
    expect(describeProvenance(r)).toContain("Los Angeles, CA");
  });

  it("explains a forbidden inheritance differently from a missing one", () => {
    const forbidden = describeProvenance(resolveField("population", loc({}), [LA({ population: "3.8M" })]));
    const missing = describeProvenance(resolveField("sales_tax", loc({}), [LA({})]));
    expect(forbidden).not.toBe(missing);
    expect(forbidden).toContain("misdescribe");
  });
});
