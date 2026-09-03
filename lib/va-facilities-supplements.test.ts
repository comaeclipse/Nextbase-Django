import { describe, expect, it } from "vitest";
import {
  classifySupplements,
  SUPPLEMENT_REDUNDANT_RADIUS_MI,
  VA_FACILITY_SUPPLEMENTS,
  type KnownVaSite,
  type VaSupplementSite,
} from "./va-facilities-supplements";

const delRio: VaSupplementSite = {
  id: "SUP-TX-DELRIO",
  name: "Del Rio VA Clinic",
  city: "Del Rio",
  state: "TX",
  lat: 29.3909,
  lon: -100.9016,
  kind: "outpatient",
  reason: "test",
  source: "https://example.gov",
  verifiedOn: "2026-09-02",
};

describe("VA_FACILITY_SUPPLEMENTS", () => {
  it("ships the Del Rio CBOC that the feed omits (issue #303)", () => {
    const entry = VA_FACILITY_SUPPLEMENTS.find((s) => s.id === "SUP-TX-DELRIO");
    expect(entry).toBeDefined();
    expect(entry?.city).toBe("Del Rio");
    expect(entry?.kind).toBe("outpatient");
  });

  it("only carries provenance-complete, SUP-prefixed entries", () => {
    for (const s of VA_FACILITY_SUPPLEMENTS) {
      expect(s.id.startsWith("SUP-")).toBe(true);
      expect(s.reason.length).toBeGreaterThan(0);
      expect(s.source).toMatch(/^https?:\/\//);
      expect(s.verifiedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(Number.isFinite(s.lat) && Number.isFinite(s.lon)).toBe(true);
    }
  });
});

describe("classifySupplements", () => {
  it("injects a supplement the feed does not contain", () => {
    const feed: KnownVaSite[] = [
      // Kerrville VAMC, ~115 mi away — the only outpatient-capable site the
      // feed returns for Del Rio, which is why has_va fell to false.
      { name: "Kerrville VA Medical Center", lat: 30.0402, lon: -99.1403, kind: "hospital" },
    ];
    const { inject, redundant } = classifySupplements(feed, [delRio]);
    expect(inject).toHaveLength(1);
    expect(inject[0].id).toBe("SUP-TX-DELRIO");
    expect(redundant).toHaveLength(0);
  });

  it("marks a supplement redundant once a same-kind feed site is within radius", () => {
    const feed: KnownVaSite[] = [
      { name: "Del Rio VA Clinic", lat: 29.391, lon: -100.902, kind: "outpatient" },
    ];
    const { inject, redundant } = classifySupplements(feed, [delRio]);
    expect(inject).toHaveLength(0);
    expect(redundant).toHaveLength(1);
    expect(redundant[0].miles).toBeLessThanOrEqual(SUPPLEMENT_REDUNDANT_RADIUS_MI);
  });

  it("does not treat a far or different-kind feed site as covering the supplement", () => {
    const feed: KnownVaSite[] = [
      // Same coordinates but wrong kind: a hospital does not satisfy an
      // outpatient supplement's redundancy check.
      { name: "Phantom VAMC", lat: 29.3909, lon: -100.9016, kind: "hospital" },
      // Right kind but far away.
      { name: "Somewhere Clinic", lat: 30.0, lon: -100.0, kind: "outpatient" },
    ];
    const { inject, redundant } = classifySupplements(feed, [delRio]);
    expect(inject).toHaveLength(1);
    expect(redundant).toHaveLength(0);
  });
});
