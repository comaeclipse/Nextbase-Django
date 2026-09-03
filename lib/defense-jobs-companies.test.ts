/*
 * Registry integrity for the defense job-listings pipeline (issue #313).
 *
 * The board an employer's listings are scraped from must live in the repo, not
 * in someone's notes: every company label a committed listings CSV emits has to
 * map to an employer seed, and that seed has to record its ATS (`ats_kind` +
 * `ats_config`) so the sync script can re-pull the board and retire listings
 * that are gone. A new feed that forgets either step fails here, not in prod.
 */
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { parse } from "csv-parse/sync";
import { describe, expect, it } from "vitest";
import { DEFENSE_EMPLOYER_SEEDS } from "./defense";
import { COMPANY_SLUG, companySlug } from "./defense-jobs-companies";

const seedsBySlug = new Map(DEFENSE_EMPLOYER_SEEDS.map((s) => [s.slug, s]));
const DATA_DIR = path.join(process.cwd(), "data");

/** The listings-CSV contract the importer parses (see scripts/import-defense-job-listings.ts). */
const LISTING_COLUMNS = ["Company", "ATS", "Title", "Location", "URL"];

/** Distinct Company labels per committed listings CSV (files with the listing header). */
function committedListingCompanies(): Map<string, Set<string>> {
  const out = new Map<string, Set<string>>();
  for (const file of readdirSync(DATA_DIR).filter((f) => f.endsWith(".csv"))) {
    const text = readFileSync(path.join(DATA_DIR, file), "utf8");
    let rows: Record<string, string>[];
    try {
      rows = parse(text, { columns: true, bom: true, skip_empty_lines: true, relax_column_count: true });
    } catch {
      continue; // not a listings CSV (city research files use other shapes)
    }
    const first = rows[0];
    if (!first || !LISTING_COLUMNS.every((c) => c in first)) continue;
    const companies = new Set<string>();
    for (const r of rows) {
      const c = (r.Company ?? "").trim();
      if (c) companies.add(c);
    }
    out.set(file, companies);
  }
  return out;
}

describe("COMPANY_SLUG registry", () => {
  it("maps every slug to a seeded employer", () => {
    const missing = [...new Set(Object.values(COMPANY_SLUG))].filter((slug) => !seedsBySlug.has(slug));
    expect(missing).toEqual([]);
  });

  it("resolves labels case- and whitespace-insensitively", () => {
    expect(companySlug("  Anduril Industries ")).toBe("anduril");
    expect(companySlug("GOVINI")).toBe("air");
    expect(companySlug("Fantom Corporation")).toBe("fantom-corporation");
    expect(companySlug("Some Unknown Co")).toBeNull();
  });
});

describe("committed listings CSVs", () => {
  const byFile = committedListingCompanies();

  it("finds the committed feeds", () => {
    expect(byFile.size).toBeGreaterThan(0);
  });

  it("map every Company label to a seeded employer", () => {
    const unmapped: string[] = [];
    for (const [file, companies] of byFile) {
      for (const c of companies) {
        if (!companySlug(c)) unmapped.push(`${file}: "${c}"`);
      }
    }
    expect(unmapped).toEqual([]);
  });

  it("record the board each employer was scraped from (ats_kind + ats_config)", () => {
    const unrecorded: string[] = [];
    for (const [file, companies] of byFile) {
      for (const c of companies) {
        const slug = companySlug(c);
        if (!slug) continue; // reported by the previous test
        const seed = seedsBySlug.get(slug);
        if (!seed?.ats_kind || !seed.ats_config) unrecorded.push(`${file}: ${slug}`);
      }
    }
    expect(unrecorded).toEqual([]);
  });
});

describe("employer seeds with an ATS", () => {
  it("carry the config key their adapter needs", () => {
    const REQUIRED: Record<string, string[]> = {
      greenhouse: ["board"],
      lever: ["board"],
      ashby: ["board"],
      eightfold: ["domain"],
      phenom: ["site"],
      successfactors: ["site"],
      usajobs: ["organization"],
      radancy: ["site", "tenant"],
      manatal: ["board"],
      gem: ["board"],
      "careers-site": ["site"],
      oracle_orc: ["host", "siteNumber"],
      amazon_jobs: ["business_category"],
      workday: ["host", "tenant", "site"],
      ultipro: ["tenant", "board"], // UKG Recruiting JobBoard (GCI)
      dsd_labs: ["site"], // bespoke self-hosted SSR careers page (DSD Laboratories)
    };
    const bad: string[] = [];
    for (const seed of DEFENSE_EMPLOYER_SEEDS) {
      if (!seed.ats_kind) continue;
      const required = REQUIRED[seed.ats_kind];
      if (!required) {
        bad.push(`${seed.slug}: unknown ats_kind "${seed.ats_kind}"`);
        continue;
      }
      for (const key of required) {
        if (!seed.ats_config || !(key in seed.ats_config)) bad.push(`${seed.slug}: ats_config.${key} missing`);
      }
    }
    expect(bad).toEqual([]);
  });
});
