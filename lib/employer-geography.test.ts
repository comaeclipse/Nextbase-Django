import { describe, expect, it, vi } from "vitest";
import { assessGeography, exactPlaceName, findInstallation, formatGeographyAudit, lookupCensusPlace, nameAgrees } from "./employer-geography";

describe("employer geography identity", () => {
  it.each([
    ["Lexington", "Lexington-Fayette", true], ["Augusta", "Augusta-Richmond County consolidated government", true],
    ["Tewksbury", "Tewksbury (county subdivision)", true], ["Langley Afb", "Joint Base Langley-Eustis", true],
    ["Bedford", "Medford", false], ["Bedford", "New Bedford", false], ["Annapolis Junction", "Annapolis", false],
    ["Harrison Township", "Redding", false], ["Santa Isabel", "Isabela", false],
    ["Air Force Base", "Somewhere", false], ["Kāneʻohe", "Kane'ohe", true],
  ])("%s -> %s = %s", (a, b, agrees) => expect(nameAgrees(a, b)).toBe(agrees));
  it("does not call a partial name an exact namesake", () => {
    expect(exactPlaceName("Bedford", "New Bedford")).toBe(false);
    expect(exactPlaceName("Bedford", "Bedford town")).toBe(true);
  });
  it("requires installation intent, state, full distinctive identity, and one match", () => {
    const carson = { command_name: "Fort Carson", state: "CO", latitude: 1, longitude: 2 };
    expect(findInstallation("Carson City", "CO", [carson])).toBeNull();
    expect(findInstallation("Fort Carson", "NV", [carson])).toBeNull();
    expect(findInstallation("Fort Johnson", "NC", [{ ...carson, command_name: "Seymour Johnson Air Force Base", state: "NC" }])).toBeNull();
    expect(findInstallation("Fort Carson", "CO", [carson])).toEqual(carson);
    expect(findInstallation("Fort Carson", "CO", [carson, carson])).toBeNull();
  });
});
describe("geography audit", () => {
  const row = { id: 270, slug: "ma-bedford", name: "Bedford", state: "MA", latitude: 42.414454, longitude: -71.110558 };
  const lookup = { status: "ok" as const, name: "Medford", geoid: "2539835", sourceUrl: "https://example.test/census" };
  const points = [{ name: "New Bedford", state: "MA", lat: 41.66, lon: -70.94 }];
  it("keeps a mismatch even when no exact namesake exists", () => {
    const finding = assessGeography(row, lookup, points);
    expect(finding.status).toBe("review");
    expect(finding.exactNamesakeMiles).toBeNull();
  });
  it("prints both review classes and incomplete coverage together", () => {
    const same = assessGeography(row, lookup, points);
    const cross = assessGeography({ ...row, id: 324, slug: "nv-carson-city", state: "NV" }, lookup, points);
    const unavailable = assessGeography({ ...row, id: 999 }, { status: "unavailable", reason: "timeout", sourceUrl: "https://example.test" }, points);
    const report = formatGeographyAudit([same, cross, unavailable], "fixture");
    expect(report).toContain("ma-bedford");
    expect(report).toContain("nv-carson-city");
    expect(report).toContain("1 unchecked");
    expect(report).toContain("INCOMPLETE");
  });
  it.each(["Eglin Air Force Base", "Fort Campbell"])("keeps %s as review evidence", (name) => {
    const result = assessGeography({ ...row, name }, lookup, points);
    expect(result.status).toBe("review");
    expect(formatGeographyAudit([result], "fixture")).toContain("No geography is cleared automatically");
  });
  it("does not treat empty geography or a transport error as agreement", async () => {
    const empty = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({ result: { geographies: {} } })));
    expect((await lookupCensusPlace(1, 2, empty)).status).toBe("unavailable");
    const failed = vi.fn<typeof fetch>().mockRejectedValue(new Error("offline"));
    expect((await lookupCensusPlace(1, 2, failed)).status).toBe("unavailable");
    expect(failed).toHaveBeenCalledTimes(3);
  });
});
