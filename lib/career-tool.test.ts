import { describe, expect, it, vi } from "vitest";
import { loadCareerTransitionCsvCatalog } from "./career-transition";
import { exploreSpecialtyTransition } from "./career-tool";
import type { SpecialtyListings } from "./career-listings-bridge";

// Exercise the real compose path over the real seeded catalog; only the listings
// bridge is stubbed (it needs a DB), so we can also assert WHEN it is / isn't called.
const CATALOG = loadCareerTransitionCsvCatalog();
const loadCatalog = async () => CATALOG;

const STUB_LISTINGS: SpecialtyListings = {
  status: "no_hits",
  mappedEmployerSlugs: ["general-dynamics"],
  keywords: ["electrician"],
  listings: [],
  employerLinks: [],
  note: "stub",
};

describe("exploreSpecialtyTransition (issue #228)", () => {
  it("asks on an ambiguous occupation and never touches the listings bridge", async () => {
    const listListings = vi.fn(async () => STUB_LISTINGS);
    const r = await exploreSpecialtyTransition("navy electrician", {}, { loadCatalog, listListings });
    expect(r.status).toBe("ambiguous");
    if (r.status !== "ambiguous") throw new Error("expected ambiguous");
    expect(r.candidates.map((c) => c.code).sort()).toEqual(["AE", "EM"]);
    expect(r.clarification).toMatch(/electrician/i);
    expect(listListings).not.toHaveBeenCalled();
  });

  it("ignores a blank code the model passes and uses the occupation text (regression)", async () => {
    // The live chat model calls the tool with code: "" / nec: "" rather than
    // omitting them; a blank code must NOT override the real occupation.
    const listListings = vi.fn(async () => STUB_LISTINGS);
    const r = await exploreSpecialtyTransition(
      "retired Navy electrician",
      { branch: "navy", code: "", nec: "" },
      { loadCatalog, listListings }
    );
    expect(r.status).toBe("ambiguous");
    if (r.status !== "ambiguous") throw new Error("expected ambiguous");
    expect(r.candidates.map((c) => c.code).sort()).toEqual(["AE", "EM"]);
    expect(listListings).not.toHaveBeenCalled();
  });

  it("keeps an aircraft-carrier electrician ambiguous (not aviation AE)", async () => {
    const r = await exploreSpecialtyTransition(
      "navy electrician aboard an aircraft carrier",
      {},
      { loadCatalog, listListings: async () => STUB_LISTINGS }
    );
    expect(r.status).toBe("ambiguous");
  });

  it("resolves navy EM to electrical skills and relays the listings result", async () => {
    const listListings = vi.fn(async () => STUB_LISTINGS);
    const r = await exploreSpecialtyTransition("navy EM", {}, { loadCatalog, listListings });
    expect(r.status).toBe("resolved");
    if (r.status !== "resolved") throw new Error("expected resolved");
    expect(r.specialty.code).toBe("EM");
    const skills = r.skills.map((s) => s.title.toLowerCase());
    expect(skills.some((t) => t.includes("shipboard power"))).toBe(true);
    expect(skills.some((t) => t.includes("avionic"))).toBe(false);
    expect(r.roles.length).toBeGreaterThan(0);
    expect(r.employers.length).toBeGreaterThan(0);
    expect(r.listings).toBe(STUB_LISTINGS);
    expect(listListings).toHaveBeenCalledOnce();
  });

  it("resolves an explicit branch + code even with a vague free-text query", async () => {
    const r = await exploreSpecialtyTransition(
      "I did electrical work on ships",
      { branch: "navy", code: "EM" },
      { loadCatalog, listListings: async () => STUB_LISTINGS }
    );
    expect(r.status).toBe("resolved");
    if (r.status !== "resolved") throw new Error("expected resolved");
    expect(r.specialty.code).toBe("EM");
  });

  it("declines an uncovered occupation without borrowing a neighbor", async () => {
    const listListings = vi.fn(async () => STUB_LISTINGS);
    const r = await exploreSpecialtyTransition(
      "navy underwater basket weaver",
      {},
      { loadCatalog, listListings }
    );
    expect(r.status).toBe("uncovered");
    if (r.status !== "uncovered") throw new Error("expected uncovered");
    expect(r.explanation.length).toBeGreaterThan(0);
    expect(listListings).not.toHaveBeenCalled();
  });
});
