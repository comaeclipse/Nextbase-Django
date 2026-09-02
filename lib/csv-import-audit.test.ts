import { describe, expect, it } from "vitest";
import {
  auditCsvImports,
  expectedLocationsFromCsv,
  formatCsvImportAudit,
  isLocationCsv,
  mergeExpected,
} from "./csv-import-audit";

const CITY_CSV = "City,State,County,TCI\nMeridian,MS,Lauderdale,154\n";

describe("isLocationCsv", () => {
  it("accepts a curated location header, with or without a BOM", () => {
    expect(isLocationCsv("City,State,County\r\nX,MS,Y\r\n")).toBe(true);
    expect(isLocationCsv("﻿City,State\nX,MS\n")).toBe(true);
  });
  it("rejects every other CSV in data/", () => {
    expect(isLocationCsv("Company,Title,Location\n")).toBe(false);
    expect(isLocationCsv("CityName,State\n")).toBe(false);
    expect(isLocationCsv("")).toBe(false);
  });
});

describe("expectedLocationsFromCsv", () => {
  it("keys a city by the importer's slug and treats it as a candidate", () => {
    expect(expectedLocationsFromCsv("data/meridian_ms.csv", CITY_CSV)).toEqual([
      {
        files: ["data/meridian_ms.csv"],
        name: "Meridian",
        state: "MS",
        slug: "ms-meridian",
        geoType: "city",
        isCandidate: true,
      },
    ]);
  });

  it("drops the ZZ test fixtures the importer ships", () => {
    const csv = "City,State\nZzyzx Test City,ZZ\nReal Town,NV\n";
    expect(expectedLocationsFromCsv("f.csv", csv).map((r) => r.slug)).toEqual([
      "nv-real-town",
    ]);
  });

  it("honours GeoType, IsCandidate and ParentSlug like the importer", () => {
    const csv =
      "City,State,GeoType,IsCandidate,ParentSlug\n" +
      "Los Angeles,CA,city,No,\n" +
      "Canoga Park,CA,neighborhood,,ca-los-angeles\n";
    expect(expectedLocationsFromCsv("f.csv", csv)).toEqual([
      expect.objectContaining({ slug: "ca-los-angeles", geoType: "city", isCandidate: false }),
      expect.objectContaining({
        slug: "ca-los-angeles-canoga-park",
        geoType: "neighborhood",
        isCandidate: false,
      }),
    ]);
  });

  it("upper-cases a lower-case state so the slug still matches", () => {
    expect(expectedLocationsFromCsv("f.csv", "City,State\nBath,me\n")[0]).toMatchObject({
      state: "ME",
      slug: "me-bath",
    });
  });

  it("returns nothing for a non-location CSV instead of guessing", () => {
    expect(
      expectedLocationsFromCsv("jobs.csv", "Company,City,State\nX,Tampa,FL\n")
    ).toEqual([]);
  });

  it("throws on a malformed file rather than auditing half of it", () => {
    expect(() =>
      expectedLocationsFromCsv("f.csv", 'City,State\n"Unterminated,MS\n')
    ).toThrow();
  });
});

describe("mergeExpected", () => {
  it("collapses the same slug across files, lets any file promote, and names that file first", () => {
    const a = expectedLocationsFromCsv("a.csv", "City,State,IsCandidate\nTampa,FL,No\n");
    const b = expectedLocationsFromCsv("b.csv", "City,State\nTampa,FL\n");
    const merged = mergeExpected([a, b]);
    expect(merged.size).toBe(1);
    expect(merged.get("fl-tampa")).toMatchObject({
      files: ["b.csv", "a.csv"],
      isCandidate: true,
    });
    // The structural-only file cannot be the repair command's target.
    expect(formatCsvImportAudit(auditCsvImports(merged, []))[0]).toContain(
      "scripts/import-csv.ts b.csv"
    );
  });
});

describe("auditCsvImports", () => {
  const expected = mergeExpected([
    expectedLocationsFromCsv("data/meridian_ms.csv", CITY_CSV),
    expectedLocationsFromCsv("data/tampa_fl.csv", "City,State\nTampa,FL\n"),
    expectedLocationsFromCsv("data/la.csv", "City,State,IsCandidate\nLos Angeles,CA,No\n"),
    expectedLocationsFromCsv("data/killeen_tx.csv", "City,State\nKilleen,TX\n"),
  ]);

  it("reports a merged CSV whose import never ran, and a candidate left unpromoted", () => {
    const audit = auditCsvImports(expected, [
      { slug: "fl-tampa", is_candidate: true, geo_type: "city" },
      { slug: "ca-los-angeles", is_candidate: false, geo_type: "city" },
      { slug: "tx-killeen", is_candidate: false, geo_type: "city" },
    ]);
    expect(audit.missing.map((r) => r.slug)).toEqual(["ms-meridian"]);
    expect(audit.notPromoted.map((r) => r.slug)).toEqual(["tx-killeen"]);
    expect(audit.matched).toBe(2);
  });

  it("does not flag a structural parent that was meant to stay unranked", () => {
    const audit = auditCsvImports(expected, [
      { slug: "ms-meridian", is_candidate: true, geo_type: "city" },
      { slug: "fl-tampa", is_candidate: true, geo_type: "city" },
      { slug: "ca-los-angeles", is_candidate: false, geo_type: "city" },
      { slug: "tx-killeen", is_candidate: true, geo_type: "city" },
    ]);
    expect(audit).toEqual({ missing: [], notPromoted: [], matched: 4 });
    expect(formatCsvImportAudit(audit)).toEqual([]);
  });

  it("formats each finding with the file and the command that fixes it", () => {
    const audit = auditCsvImports(expected, []);
    const lines = formatCsvImportAudit(audit);
    expect(lines).toHaveLength(4);
    expect(lines[0]).toMatch(/^MISSING +Los Angeles, CA \(ca-los-angeles\) -- in data\/la\.csv/);
    expect(lines[2]).toContain("scripts/import-csv.ts data/meridian_ms.csv");
  });
});
