import { expect, it } from "vitest";
import { geographyPatchStatements, validateGeographyPatches, type GeographyPatch } from "./geography-patch";
import { assertTargetsExist, parseLocationIds } from "./location-targets";
import { buildLocationUpsert } from "./location-import";
import { isUnresolvedGeographyRow, isUnresolvedMetroRow } from "./geography-import-status";

const geo = { county: "Middlesex", latitude: 42.49, longitude: -71.28, boundary_geoid: "2501704615", boundary_source: "Census" };
const patch: GeographyPatch = { slug: "ma-bedford", expected: geo, replacement: geo, expectedMetroSlugs: ["cbsa-14460"], metroSlugs: ["cbsa-14460"], sourceUrl: "https://www.census.gov", reason: "Bedford, not Medford" };
it("accepts scoped idempotent patches and refuses arbitrary field writes", () => {
  expect(validateGeographyPatches([patch])).toEqual([patch]);
  expect(() => validateGeographyPatches([{ ...patch, replacement: { ...geo, defense_hub: false } }])).toThrow();
  expect(() => validateGeographyPatches([patch, patch])).toThrow();
  expect(() => validateGeographyPatches([{ ...patch, replacement: { ...geo, latitude: 100 } }])).toThrow();
  expect(() => validateGeographyPatches([{ ...patch, sourceUrl: "" }])).toThrow();
});
it("guards every expected state before mutating and never deletes a geography or posting", () => {
  const queries = geographyPatchStatements([patch, { ...patch, slug: "mi-harrison-township" }]);
  expect(queries.slice(0, 5).every((q) => q.text.startsWith("SELECT"))).toBe(true);
  expect(queries.some((q) => /DELETE FROM|UPDATE defense_employer_locations/.test(q.text))).toBe(false);
  expect(queries[1].params).toContain(JSON.stringify(patch.expected));
  expect(queries[1].params).toContain(JSON.stringify(patch.replacement));
});
it("fails closed on misspelled or invalid targeting", () => {
  expect(parseLocationIds(["--dry-run", "--ids", "270,270,351"])).toEqual([270, 351]);
  for (const args of [["--id", "270"], ["--ids"], ["--ids", "0"], ["--ids", "1;DELETE"], ["--all"]]) expect(() => parseLocationIds(args)).toThrow();
  expect(() => assertTargetsExist([270, 351], [{ id: "270" }])).toThrow("351");
});
it("parameterizes source text and writes containment in the same statement", () => {
  const source = "A source with ' quotes";
  const query = buildLocationUpsert({ name: "Midland", slug: "ga-columbus-midland", tags: [] }, { id: 126, name: "Columbus", state: "GA", geo_type: "city", relationship: "municipal_containment" }, source);
  expect(query.text).toContain("INSERT INTO geo_relationships");
  expect(query.text).toContain("FROM saved");
  expect(query.text).not.toContain(source);
  expect(query.params).toContain(source);
  expect(() => buildLocationUpsert({ "name;drop": "x" }, null, "")).toThrow();
});
it("keeps rejected geography out of replay and rejects ambiguous status", () => {
  const row = { GeoResolutionStatus: "unresolved", IsCandidate: "No", GeoResolutionNote: "Wrong-state match rejected" };
  expect(isUnresolvedGeographyRow(row)).toBe(true);
  expect(() => isUnresolvedGeographyRow({ ...row, Latitude: "40" })).toThrow();
  expect(() => isUnresolvedGeographyRow({ ...row, IsCandidate: "Yes" })).toThrow();
  expect(isUnresolvedMetroRow(row)).toBe(true);
  expect(() => isUnresolvedMetroRow({ ...row, CbsaGeoid: "35620" })).toThrow();
});
