import { describe, expect, it } from "vitest";
import {
  buildMilitaryProximityIndex,
  formatNearestBase,
  haversineMiles,
  matchesNearBase,
  parseBaseMaxDistance,
  type MilitaryProximity,
  type MilitaryProximityRow,
} from "./military";

function row(
  partial: Partial<MilitaryProximityRow> &
    Pick<MilitaryProximityRow, "location_id" | "installation_id" | "command_name">
): MilitaryProximityRow {
  return {
    service_branch: "Navy",
    city: "Pensacola",
    state: "FL",
    distance_miles: 8,
    nearest_rank: 1,
    branch_rank: 1,
    ...partial,
  };
}

const pensacolaNavy: MilitaryProximity = {
  installation_id: 10,
  command_name: "NAS Pensacola",
  service_branch: "Navy",
  branch_slug: "navy",
  city: "Pensacola",
  state: "FL",
  distance_miles: 8,
};

const eglinAf: MilitaryProximity = {
  installation_id: 11,
  command_name: "Eglin Air Force Base",
  service_branch: "Air Force",
  branch_slug: "air_force",
  city: "Valparaiso",
  state: "FL",
  distance_miles: 45,
};

describe("haversineMiles", () => {
  it("is zero for the same point", () => {
    expect(haversineMiles(30.4, -87.2, 30.4, -87.2)).toBe(0);
  });

  it("is about 69 miles per degree of latitude", () => {
    const miles = haversineMiles(30, -87, 31, -87);
    expect(miles).toBeGreaterThan(68);
    expect(miles).toBeLessThan(70);
  });
});

describe("buildMilitaryProximityIndex", () => {
  it("keeps nearest overall and nearest per branch", () => {
    const index = buildMilitaryProximityIndex([
      row({
        location_id: 1,
        installation_id: 10,
        command_name: "NAS Pensacola",
        nearest_rank: 1,
        branch_rank: 1,
      }),
      row({
        location_id: 1,
        installation_id: 11,
        command_name: "Eglin Air Force Base",
        service_branch: "Air Force",
        city: "Valparaiso",
        distance_miles: 45,
        nearest_rank: 2,
        branch_rank: 1,
      }),
    ]);
    expect(index[1]?.nearest.command_name).toBe("NAS Pensacola");
    expect(index[1]?.nearest_by_branch.navy?.distance_miles).toBe(8);
    expect(index[1]?.nearest_by_branch.air_force?.distance_miles).toBe(45);
  });
});

describe("matchesNearBase", () => {
  const proximity = {
    nearest: pensacolaNavy,
    nearest_by_branch: {
      navy: pensacolaNavy,
      air_force: eglinAf,
    },
  };

  it("matches any base inside the distance band", () => {
    expect(matchesNearBase(proximity, { maxDistance: 25 })).toBe(true);
    expect(matchesNearBase(proximity, { maxDistance: 5 })).toBe(false);
  });

  it("matches a branch inside the band even when nearest overall is a different branch", () => {
    expect(
      matchesNearBase(proximity, { maxDistance: 50, branches: ["air_force"] })
    ).toBe(true);
    expect(
      matchesNearBase(proximity, { maxDistance: 25, branches: ["air_force"] })
    ).toBe(false);
  });

  it("ORs selected branches", () => {
    expect(
      matchesNearBase(proximity, {
        maxDistance: 25,
        branches: ["army", "navy"],
      })
    ).toBe(true);
    expect(
      matchesNearBase(proximity, {
        maxDistance: 25,
        branches: ["army", "marine_corps"],
      })
    ).toBe(false);
  });

  it("rejects cities with no proximity rows", () => {
    expect(matchesNearBase(undefined, { maxDistance: 100 })).toBe(false);
  });
});

describe("formatNearestBase", () => {
  it("formats a named installation, branch, and rounded miles", () => {
    expect(formatNearestBase(pensacolaNavy)).toBe(
      "NAS Pensacola — Navy — 8 mi"
    );
  });

  it("uses <1 for sub-half-mile distances", () => {
    expect(formatNearestBase({ ...pensacolaNavy, distance_miles: 0.2 })).toBe(
      "NAS Pensacola — Navy — <1 mi"
    );
  });
});

describe("parseBaseMaxDistance", () => {
  it("accepts the predefined bands and defaults to 50", () => {
    expect(parseBaseMaxDistance("25")).toBe(25);
    expect(parseBaseMaxDistance("100")).toBe(100);
    expect(parseBaseMaxDistance("17")).toBe(50);
    expect(parseBaseMaxDistance(null)).toBe(50);
  });
});
