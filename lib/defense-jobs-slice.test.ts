/*
 * Spec for the commercial-employer defense slice (issue #336).
 *
 * classifyDefenseRelevance() is the single authority for which listings from a
 * `counts_as_defense: false` employer count as defense. This table IS the
 * policy: a listing is admitted iff it shows a clearance signal or a
 * gov/defense-customer signal; generic commercial roles are dropped. Prime
 * employers bypass the classifier entirely.
 */
import { describe, expect, it } from "vitest";
import {
  classifyDefenseRelevance,
  isDefenseRelevant,
  type DefenseSliceInput,
} from "./defense-jobs-slice";

const commercial = { countsAsDefense: false };

describe("classifyDefenseRelevance — prime bypass", () => {
  it("counts every listing for a counts_as_defense employer, no signal", () => {
    expect(classifyDefenseRelevance({ title: "Barista" }, { countsAsDefense: true })).toEqual({
      relevance: "prime",
      signal: null,
    });
    // Even empty input is "prime" for a defense pure-play.
    expect(classifyDefenseRelevance({}, { countsAsDefense: true }).relevance).toBe("prime");
  });
});

describe("classifyDefenseRelevance — cleared", () => {
  const cases: [string, DefenseSliceInput][] = [
    ["TS/SCI in description", { title: "Software Engineer", description: "Requires an active TS/SCI clearance." }],
    ["Secret security clearance", { title: "Systems Engineer", description: "Must hold an active Secret security clearance." }],
    ["ability to obtain a clearance", { title: "Cloud Engineer", description: "Must be able to obtain a security clearance." }],
    ["top secret", { title: "Network Engineer", description: "Top Secret eligibility required." }],
    ["polygraph", { title: "SDE", description: "Position requires a CI polygraph." }],
    ["special access program", { title: "Program Manager", description: "Supports a Special Access Program." }],
    ["title-only clearance", { title: "Cleared Software Engineer (Security Clearance Required)" }],
  ];
  it.each(cases)("admits: %s", (_label, input) => {
    const v = classifyDefenseRelevance(input, commercial);
    expect(v.relevance).toBe("cleared");
    expect(v.signal).toBeTruthy();
  });
});

describe("classifyDefenseRelevance — gov_customer", () => {
  const cases: [string, DefenseSliceInput][] = [
    ["Azure Government", { title: "Cloud Solution Architect - Azure Government" }],
    ["AWS Public Sector via businessUnit", { title: "Program Manager", businessUnit: "AWS Worldwide Public Sector" }],
    ["Department of Defense", { title: "Consultant", description: "Supporting the Department of Defense mission." }],
    ["GovCloud", { title: "GovCloud Support Engineer" }],
    ["DoD acronym", { title: "Account Manager", description: "Serves DoD and IC customers." }],
    ["national security", { title: "Researcher", description: "Advancing national security outcomes." }],
    ["warfighter", { title: "Field Engineer", description: "Delivering capability to the warfighter." }],
    ["federal government", { title: "Sales", description: "Selling to the U.S. federal government." }],
    ["FedRAMP High", { title: "Security Engineer", description: "Operating a FedRAMP High environment." }],
    ["AWS Dedicated Cloud", { title: "SDE", description: "Builds in the AWS Dedicated Cloud." }],
  ];
  it.each(cases)("admits: %s", (_label, input) => {
    const v = classifyDefenseRelevance(input, commercial);
    expect(v.relevance).toBe("gov_customer");
    expect(v.signal).toBeTruthy();
  });
});

describe("classifyDefenseRelevance — dropped (false positives)", () => {
  const cases: [string, DefenseSliceInput][] = [
    ["retail SDE", { title: "Software Development Engineer", description: "Build features for Amazon.com retail customers." }],
    ["defensive coding", { title: "Backend Engineer", description: "Follows defensive coding and defense in depth practices." }],
    ["SAP the ERP", { title: "SAP Consultant", description: "Configure SAP ERP modules." }],
    ["clearance sale", { title: "Retail Associate", description: "Manages the clearance sale floor." }],
    ["security engineer, no clearance", { title: "Security Engineer", description: "Improve our product's attack surface." }],
    ["government relations PR", { title: "Government Relations Manager", description: "Corporate communications and policy." }],
    ["Federal Reserve", { title: "Economist", description: "Analyzes Federal Reserve policy." }],
    ["empty", {}],
  ];
  it.each(cases)("drops: %s", (_label, input) => {
    expect(classifyDefenseRelevance(input, commercial)).toEqual({ relevance: null, signal: null });
  });
});

describe("classifyDefenseRelevance — details", () => {
  it("prefers cleared over gov_customer when both present", () => {
    const v = classifyDefenseRelevance(
      { title: "SDE, Azure Government", description: "Requires an active Secret security clearance." },
      commercial,
    );
    expect(v.relevance).toBe("cleared");
  });

  it("is case-insensitive", () => {
    expect(
      classifyDefenseRelevance({ description: "SECURITY CLEARANCE REQUIRED" }, commercial).relevance,
    ).toBe("cleared");
    expect(
      classifyDefenseRelevance({ title: "azure government engineer" }, commercial).relevance,
    ).toBe("gov_customer");
  });

  it("caps the signal length", () => {
    const v = classifyDefenseRelevance({ description: "security clearance" }, commercial);
    expect(v.signal && v.signal.length).toBeLessThanOrEqual(120);
  });

  it("isDefenseRelevant mirrors a non-null relevance", () => {
    expect(isDefenseRelevant({ title: "GovCloud Engineer" }, commercial)).toBe(true);
    expect(isDefenseRelevant({ title: "Barista" }, commercial)).toBe(false);
    expect(isDefenseRelevant({ title: "Barista" }, { countsAsDefense: true })).toBe(true);
  });
});
