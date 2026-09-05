import { describe, expect, it } from "vitest";
import { resolveEmployer } from "./defense-jobs";

describe("resolveEmployer", () => {
  it("resolves a bare first word to the single matching employer", () => {
    expect(resolveEmployer("Lockheed")).toEqual({
      status: "resolved",
      slug: "lockheed-martin",
      name: "Lockheed Martin",
    });
    expect(resolveEmployer("northrop")).toMatchObject({ status: "resolved", slug: "northrop-grumman" });
    expect(resolveEmployer("boeing")).toMatchObject({ status: "resolved", slug: "boeing" });
  });

  it("resolves an exact display name, slug, and hyphenated slug alike", () => {
    expect(resolveEmployer("Raytheon")).toMatchObject({ status: "resolved", slug: "raytheon" });
    expect(resolveEmployer("lockheed-martin")).toMatchObject({ status: "resolved", slug: "lockheed-martin" });
    expect(resolveEmployer("general dynamics")).toMatchObject({ status: "resolved", slug: "general-dynamics" });
  });

  it("resolves feed aliases (e.g. AWS) to the canonical employer", () => {
    expect(resolveEmployer("AWS")).toMatchObject({ status: "resolved", slug: "amazon-web-services" });
    expect(resolveEmployer("amazon web services")).toMatchObject({ status: "resolved", slug: "amazon-web-services" });
  });

  it("accepts a more specific legal name than the stored display name", () => {
    expect(resolveEmployer("Lockheed Martin Corporation")).toMatchObject({
      status: "resolved",
      slug: "lockheed-martin",
    });
  });

  it("reports ambiguity for a shared parent company instead of guessing a sibling", () => {
    const r = resolveEmployer("RTX");
    expect(r.status).toBe("ambiguous");
    if (r.status !== "ambiguous") throw new Error("expected ambiguous");
    expect(r.candidates).toContain("Raytheon");
    expect(r.candidates).toContain("Collins Aerospace");
    expect(r.candidates).toContain("Pratt & Whitney");
    expect(r.candidates).toContain("RTX Corporate");
    expect(r.candidates).toEqual([...r.candidates].sort());
  });

  it("returns unknown for an employer we do not track, and for empty input", () => {
    expect(resolveEmployer("Totally Fake Defense Co")).toEqual({ status: "unknown" });
    expect(resolveEmployer("   ")).toEqual({ status: "unknown" });
  });

  it("does not resolve a too-short fragment to a nearby company", () => {
    // "lo" must not slide into Lockheed via a loose substring match.
    expect(resolveEmployer("lo")).toEqual({ status: "unknown" });
  });
});
