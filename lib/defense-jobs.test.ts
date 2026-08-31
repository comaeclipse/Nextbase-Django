import { describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({
  unstable_cache: (fn: unknown) => fn,
}));

import { buildDefenseJobWhere, parseDefenseJobFilter } from "./defense-jobs";

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
});
