import { describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({
  unstable_cache: (fn: unknown) => fn,
}));

import { buildDefenseJobWhere, parseDefenseJobFilter, toClientListing } from "./defense-jobs";
import type { DefenseJobListingRow } from "./types";

describe("defense-jobs SkillBridge filter", () => {
  it("parses the active SkillBridge query flag", () => {
    const filter = parseDefenseJobFilter(new URLSearchParams("skillbridge=true&remote=true"));

    expect(filter.skillbridge).toBe(true);
    expect(filter.remote).toBe(true);
  });

  it("filters on the SkillBridge join when metadata is available", () => {
    const params: unknown[] = [];
    const where = buildDefenseJobWhere(
      { skillbridge: true, sectors: ["Cyber"], q: "rf" },
      params,
      { includeSkillBridge: true, listingAlias: "j" }
    );

    expect(where).toContain("j.sector = ANY($1)");
    expect(where).toContain("sb.skillbridge_status = 'active'");
    expect(where).toContain("j.title ILIKE $2");
    expect(params).toEqual([["Cyber"], "%rf%"]);
  });

  it("returns no rows for active SkillBridge when metadata has not migrated yet", () => {
    const params: unknown[] = [];
    const where = buildDefenseJobWhere({ skillbridge: true }, params, {
      includeSkillBridge: false,
      listingAlias: "j",
    });

    expect(where).toBe("WHERE FALSE");
    expect(params).toEqual([]);
  });

  it("composes the open-listing lifecycle filter with other clauses", () => {
    const params: unknown[] = [];
    const where = buildDefenseJobWhere({ remote: true }, params, {
      listingAlias: "j",
      openOnly: true,
    });

    expect(where).toBe("WHERE j.closed_at IS NULL AND j.is_remote = TRUE");
    expect(params).toEqual([]);
  });
});

describe("defense-jobs listing freshness", () => {
  it("passes snapshot_date through the client-facing listing shape", () => {
    const row: DefenseJobListingRow = {
      id: 1,
      company: "Shield AI",
      employer_slug: "shield-ai",
      ats: "greenhouse",
      title: "Systems Engineer",
      field_raw: "Hivemind",
      sector: "Autonomy",
      location_raw: "Dallas, TX",
      city: "Dallas",
      state: "TX",
      country: "US",
      region: "Texas",
      is_remote: false,
      latitude: 32.7767,
      longitude: -96.797,
      employment_type: "Full-time",
      pay_min: null,
      pay_max: null,
      pay_interval: null,
      education: null,
      url: "https://example.com/job",
      snapshot_date: "2026-09-01",
    };

    expect(toClientListing(row).snapshotDate).toBe("2026-09-01");
  });
});
