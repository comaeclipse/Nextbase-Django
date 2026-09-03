/*
 * Guard for the defense-slice enforcement point (issue #336).
 *
 * classifyDefenseRelevance() (unit-tested in defense-jobs-slice.test.ts) is the
 * policy; `sliceAndFilter()` is where the sync APPLIES it to a fresh pull before
 * anything is written. This test locks that wiring so a regression there — the
 * one that would silently ingest a commercial employer's whole board or let a
 * generic role through — fails here, not in production:
 *
 *   - a defense PRIME keeps every row (tagged `prime`, classifier bypassed);
 *   - a COMMERCIAL / dual-use employer keeps only rows that clear the slice, each
 *     tagged with its winning signal, and is restricted to US roles;
 *   - a row an adapter PRE-TAGGED (e.g. the USAJOBS agency adapter) is trusted,
 *     not reclassified.
 */
import { describe, expect, it } from "vitest";
import { sliceAndFilter, type Pulled } from "@/scripts/defense-jobs-adapters";
import type { EmployerSeed } from "@/lib/defense";

function seed(over: Partial<EmployerSeed>): EmployerSeed {
  return {
    slug: "test",
    display_name: "Test",
    parent_company: "Test",
    sector: "corporate",
    counts_as_defense: false,
    ats_kind: "greenhouse",
    ats_config: { board: "test" },
    legacy_aliases: [],
    ...over,
  };
}

/** A pulled candidate carrying only the fields sliceAndFilter reads/writes. */
function pulled(
  o: { title?: string; description?: string; businessUnit?: string; region: string; url: string; preTag?: string }
): Pulled {
  return {
    row: {
      Company: "Test",
      Title: o.title ?? "",
      Region: o.region,
      URL: o.url,
      DefenseRelevance: o.preTag ?? "",
      DefenseSignal: "",
    },
    title: o.title ?? "",
    description: o.description ?? "",
    businessUnit: o.businessUnit ?? "",
  };
}

describe("sliceAndFilter — defense prime", () => {
  const prime = seed({ slug: "anduril", sector: "defense", counts_as_defense: true });

  it("keeps every row and tags it prime, classifier bypassed", () => {
    const out = sliceAndFilter(prime, [
      pulled({ title: "Barista", region: "US (CONUS)", url: "a" }),
      pulled({ title: "Autonomy Engineer", region: "US (CONUS)", url: "b" }),
    ]);
    expect(out.map((r) => r.URL)).toEqual(["a", "b"]);
    expect(out.every((r) => r.DefenseRelevance === "prime")).toBe(true);
  });

  it("does not US-filter a prime (international listings are kept)", () => {
    const out = sliceAndFilter(prime, [pulled({ title: "Engineer", region: "International", url: "x" })]);
    expect(out).toHaveLength(1);
  });
});

describe("sliceAndFilter — commercial / dual-use", () => {
  const commercial = seed({ slug: "microsoft", counts_as_defense: false });

  it("drops a generic commercial role", () => {
    const out = sliceAndFilter(commercial, [
      pulled({ title: "Software Engineer", description: "Build Azure retail features.", region: "US (CONUS)", url: "drop" }),
    ]);
    expect(out).toEqual([]);
  });

  it("keeps a cleared role, tagged cleared with the matched signal", () => {
    const out = sliceAndFilter(commercial, [
      pulled({ title: "Cloud Engineer", description: "Requires an active TS/SCI clearance.", region: "US (CONUS)", url: "keep" }),
    ]);
    expect(out).toHaveLength(1);
    expect(out[0].DefenseRelevance).toBe("cleared");
    expect(out[0].DefenseSignal).toBeTruthy();
  });

  it("keeps a gov-customer role via its business unit", () => {
    const out = sliceAndFilter(commercial, [
      pulled({ title: "Program Manager", businessUnit: "Azure Government", region: "US (CONUS)", url: "gov" }),
    ]);
    expect(out).toHaveLength(1);
    expect(out[0].DefenseRelevance).toBe("gov_customer");
  });

  it("US-filters the slice: an international cleared role is dropped by default", () => {
    const rows = [pulled({ title: "Engineer", description: "Active security clearance required.", region: "International", url: "intl" })];
    expect(sliceAndFilter(commercial, rows)).toEqual([]);
    // ...but retained when the caller opts in.
    expect(sliceAndFilter(commercial, rows, { includeInternational: true })).toHaveLength(1);
  });

  it("trusts an adapter's pre-tag instead of reclassifying", () => {
    // A generic title that the classifier would DROP, but the adapter pre-tagged
    // (the USAJOBS agency case). The pre-tag must survive.
    const out = sliceAndFilter(commercial, [
      pulled({ title: "Contract Specialist", region: "US (CONUS)", url: "pre", preTag: "prime" }),
    ]);
    expect(out).toHaveLength(1);
    expect(out[0].DefenseRelevance).toBe("prime");
  });
});
