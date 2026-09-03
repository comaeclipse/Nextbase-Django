import { describe, expect, it } from "vitest";
import type { DefenseJobListingRow } from "./types";
import type { DefenseJobListingsPage } from "./defense-jobs";
import type { SpecialtyMatchView } from "./career-transition";
import {
  keywordsForSpecialty,
  listingsForSpecialty,
  type ListPageFn,
} from "./career-listings-bridge";

// --- fixtures ---------------------------------------------------------------

function specialtyMatch(opts: {
  employers: Array<[slug: string, defenseSlug: string | null]>;
  keywords?: string[];
  roleTitles?: string[];
}): SpecialtyMatchView {
  return {
    specialty: { code: "EM", branch: "navy" },
    roles: (opts.roleTitles ?? []).map((title) => ({ role: { title } })),
    employers: opts.employers.map(([slug, defenseSlug]) => ({
      employer: {
        slug,
        display_name: slug,
        website_url: `https://${slug}.test/careers`,
        defense_employer_slug: defenseSlug,
      },
    })),
    skills: (opts.keywords ?? []).map((kw) => ({ skill: { listing_keywords: [kw] } })),
  } as unknown as SpecialtyMatchView;
}

function row(id: number, employerSlug: string, title: string): DefenseJobListingRow {
  return {
    id,
    company: employerSlug,
    employer_slug: employerSlug,
    title,
    field_raw: null,
    sector: "Hardware & Engineering",
    city: null,
    state: null,
    region: null,
    is_remote: false,
    latitude: null,
    longitude: null,
    employment_type: null,
    pay_min: null,
    pay_max: null,
    pay_interval: null,
    education: null,
    url: `https://jobs.test/${id}`,
  } as unknown as DefenseJobListingRow;
}

// A stub that honours the employers filter and the single-substring `q`, exactly
// like getDefenseJobListingsPage, so the bridge's merge/dedup logic is exercised.
function makeListPage(rows: DefenseJobListingRow[]): ListPageFn {
  return async (filter): Promise<DefenseJobListingsPage> => {
    let out = rows;
    if (filter.employers?.length) {
      out = out.filter((r) => filter.employers!.includes(r.employer_slug ?? r.company));
    }
    if (filter.q) {
      const q = filter.q.toLowerCase();
      out = out.filter((r) => r.title.toLowerCase().includes(q));
    }
    if (filter.city) {
      const [city, state] = filter.city.split("|");
      out = out.filter((r) => r.city === city && r.state === state);
    }
    return { listings: out, total: out.length };
  };
}

// --- tests ------------------------------------------------------------------

describe("listingsForSpecialty (issue #224)", () => {
  it("returns unmapped + career URLs when no employer maps to a defense slug", async () => {
    const match = specialtyMatch({
      employers: [
        ["hii", null],
        ["austal-usa", null],
      ],
      keywords: ["electrician"],
    });
    const result = await listingsForSpecialty(match, makeListPage([row(1, "hii", "Marine Electrician")]));

    expect(result.status).toBe("unmapped");
    expect(result.listings).toEqual([]);
    expect(result.mappedEmployerSlugs).toEqual([]);
    expect(result.employerLinks.map((e) => e.slug)).toEqual(["hii", "austal-usa"]);
    expect(result.employerLinks[0].website_url).toBe("https://hii.test/careers");
  });

  it("returns no_hits (never invents a posting) when mapped employers have no matching title", async () => {
    const match = specialtyMatch({
      employers: [["gd-nassco", "general-dynamics"]],
      keywords: ["electrician"],
    });
    // Employer matches the filter, but no title contains the keyword.
    const result = await listingsForSpecialty(
      match,
      makeListPage([row(1, "general-dynamics", "Software Engineer")])
    );

    expect(result.status).toBe("no_hits");
    expect(result.listings).toEqual([]);
    expect(result.mappedEmployerSlugs).toEqual(["general-dynamics"]);
    expect(result.employerLinks.length).toBe(1);
  });

  it("returns only mapped-employer listings whose title matches a keyword, deduped", async () => {
    const match = specialtyMatch({
      employers: [
        ["gd-electric-boat", "general-dynamics"],
        ["hii", null], // unmapped — its listings must never appear
      ],
      keywords: ["electrician", "electrical"],
    });
    const result = await listingsForSpecialty(
      match,
      makeListPage([
        row(10, "general-dynamics", "Marine Electrician"), // hits "electrician"
        row(11, "general-dynamics", "Electrical Technician"), // hits "electrical"
        row(12, "general-dynamics", "Electrician / Electrical Lead"), // hits BOTH -> dedup
        row(20, "hii", "Marine Electrician"), // unmapped employer -> excluded
        row(30, "raytheon", "Electrician"), // not an employer of this specialty
      ])
    );

    expect(result.status).toBe("listings");
    const ids = result.listings.map((l) => l.id).sort((a, b) => a - b);
    expect(ids).toEqual([10, 11, 12]); // 20 and 30 excluded, 12 not duplicated
    expect(result.listings.every((l) => l.company === "general-dynamics")).toBe(true);
  });

  it("can scope specialty listings to one city and state", async () => {
    const match = specialtyMatch({
      employers: [["gd-nassco", "general-dynamics"]],
      keywords: ["electrician"],
    });
    const sanDiego = row(10, "general-dynamics", "Marine Electrician");
    sanDiego.city = "San Diego";
    sanDiego.state = "CA";
    const groton = row(11, "general-dynamics", "Marine Electrician");
    groton.city = "Groton";
    groton.state = "CT";

    const result = await listingsForSpecialty(match, makeListPage([sanDiego, groton]), {
      city: "San Diego",
      state: "California",
    });

    expect(result.city).toBe("San Diego");
    expect(result.state).toBe("CA");
    expect(result.listings.map((l) => l.id)).toEqual([10]);
    expect(result.note).toContain("San Diego, CA");
  });

  it("derives keywords from skills first, then role titles, deduped and lower-cased", () => {
    const match = specialtyMatch({
      employers: [["gd-nassco", "general-dynamics"]],
      keywords: ["Power Distribution", "power distribution"],
      roleTitles: ["Marine Electrician"],
    });
    expect(keywordsForSpecialty(match)).toEqual(["power distribution", "marine electrician"]);
  });
});
