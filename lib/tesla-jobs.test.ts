import { describe, expect, it } from "vitest";
import { teslaStateToRows, teslaJobUrl, type TeslaState } from "./tesla-jobs";

/*
 * Fixture built from real Tesla `cua-api` state shapes (captured 2026-09-03) plus
 * two synthetic defense titles and one international row to exercise the #336
 * slice. Real Tesla listings carry no clearance/gov text, so a live decode keeps
 * nothing (the documented outcome) — the synthetic rows prove the slice PATH,
 * the real ones prove the drop and the decode.
 */
const state: TeslaState = {
  lookup: {
    locations: {
      "401022": "Palo Alto, California",
      "4242": "Columbus, Ohio",
      "900": "Berlin, Germany",
      "20899": "Toronto, Ontario",
      "555": "Honolulu, Hawaii",
    },
    departments: {
      "3": "Tesla AI",
      "4": "Energy - Solar & Storage",
      "7": "Vehicle Software",
    },
    types: { "1": "fulltime", "2": "parttime", "3": "intern" },
  },
  listings: [
    // Real, commercial — dropped (no defense signal in title/department).
    { id: "224501", t: "AI Engineer, Manipulation, Optimus", dp: "3", l: "401022", y: 1 },
    { id: "281607", t: "Internship, Product Support Engineer", dp: "7", l: "401022", y: 3 },
    // Synthetic — a US role whose TITLE names a clearance (kept: cleared).
    { id: "300001", t: "Systems Engineer, Active TS/SCI Clearance Required", dp: "4", l: "4242", y: 1 },
    // Synthetic — a US role serving a gov customer (kept: gov_customer).
    { id: "300002", t: "Program Manager, Department of Defense Programs", dp: "3", l: "555", y: 1 },
    // Synthetic — a cleared role but INTERNATIONAL (dropped by default US filter).
    { id: "300003", t: "Engineer, Security Clearance", dp: "3", l: "900", y: 1 },
    // Synthetic — international non-US (Ontario) commercial (dropped both ways).
    { id: "300004", t: "Sales Advisor", dp: "3", l: "20899", y: 2 },
  ],
};

describe("teslaJobUrl", () => {
  it("is the deterministic id-only apply URL", () => {
    expect(teslaJobUrl("224501")).toBe("https://www.tesla.com/careers/search/job/224501");
    expect(teslaJobUrl(300001)).toBe("https://www.tesla.com/careers/search/job/300001");
  });
});

describe("teslaStateToRows — default (US-only) defense slice", () => {
  const { rows, stats } = teslaStateToRows(state);
  const byUrl = new Map(rows.map((r) => [r.URL, r]));

  it("keeps only the two US defense-signal titles", () => {
    expect(stats.kept).toBe(2);
    expect([...byUrl.keys()].sort()).toEqual([
      "https://www.tesla.com/careers/search/job/300001",
      "https://www.tesla.com/careers/search/job/300002",
    ]);
  });

  it("classifies the clearance title as cleared with the matched signal", () => {
    const r = byUrl.get("https://www.tesla.com/careers/search/job/300001")!;
    expect(r.DefenseRelevance).toBe("cleared");
    expect(r.DefenseSignal.toLowerCase()).toContain("ts/sci");
    expect(r.Company).toBe("Tesla");
    expect(r.ATS).toBe("Tesla");
    expect(r.Field).toBe("Energy - Solar & Storage");
    expect(r.Employment).toBe("Full-time");
    expect(r.Location).toBe("Columbus, OH"); // full state name normalized to USPS
    expect(r.Region).toBe("US (CONUS)");
  });

  it("classifies the DoD title as gov_customer and marks non-CONUS regions", () => {
    const r = byUrl.get("https://www.tesla.com/careers/search/job/300002")!;
    expect(r.DefenseRelevance).toBe("gov_customer");
    expect(r.Location).toBe("Honolulu, HI");
    expect(r.Region).toBe("US (non-CONUS)");
  });

  it("drops commercial titles and international roles, and counts them", () => {
    expect(stats.total).toBe(6);
    expect(stats.droppedNotDefense).toBe(3); // 2 real commercial + 1 intl commercial
    expect(stats.droppedNonUs).toBe(1); // the intl cleared role
    expect(stats.byRelevance).toEqual({ cleared: 1, gov_customer: 1 });
  });
});

describe("teslaStateToRows — includeInternational", () => {
  it("keeps the international clearance role too", () => {
    const { rows, stats } = teslaStateToRows(state, { includeInternational: true });
    expect(stats.kept).toBe(3);
    const intl = rows.find((r) => r.URL.endsWith("/300003"))!;
    expect(intl.DefenseRelevance).toBe("cleared");
    expect(intl.Region).toBe("International");
    expect(intl.Location).toBe("Berlin, Germany");
    expect(stats.droppedNonUs).toBe(0);
  });
});

describe("teslaStateToRows — robustness", () => {
  it("dedupes a repeated id (would break the upsert conflict key)", () => {
    const dupe: TeslaState = {
      lookup: state.lookup,
      listings: [state.listings![2], state.listings![2]],
    };
    const { rows, stats } = teslaStateToRows(dupe);
    expect(rows).toHaveLength(1);
    expect(stats.kept).toBe(1);
  });

  it("skips rows missing an id or title, and empty state", () => {
    const bad: TeslaState = {
      lookup: state.lookup,
      listings: [
        { id: "", t: "Engineer, Security Clearance", l: "4242" } as never,
        { id: "9", t: "", l: "4242" } as never,
      ],
    };
    expect(teslaStateToRows(bad).stats.kept).toBe(0);
    expect(teslaStateToRows({}).stats.total).toBe(0);
  });
});
