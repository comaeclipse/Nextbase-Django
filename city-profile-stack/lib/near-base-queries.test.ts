import { describe, expect, it } from "vitest";
import {
  rankCitiesNearBase,
  resolveInstallation,
  toNearBaseInstallation,
  type NearBaseInstallation,
  type ProximityRow,
} from "./near-base-queries";

function inst(id: number, commandName: string, branch: string, state = "XX"): NearBaseInstallation {
  const i = toNearBaseInstallation({ id, command_name: commandName, service_branch: branch, city: "Town", state });
  if (!i) throw new Error(`bad branch ${branch}`);
  return i;
}

const INSTALLATIONS = [
  inst(11, "Joint Base Lewis-McChord", "Army", "WA"),
  inst(12, "Joint Base Lewis-McChord", "Air Force", "WA"),
  inst(1, "Fort Bragg", "Army", "NC"),
  inst(2, "Naval Air Station Pensacola", "Navy", "FL"),
  inst(3, "Naval Air Station Oceana", "Navy", "VA"),
  inst(4, "Naval Station Norfolk", "Navy", "VA"),
  inst(5, "Joint Base Langley-Eustis", "Air Force", "VA"),
  inst(6, "Fort Hood", "Army", "TX"),
  inst(7, "Marine Corps Air Station Miramar", "Marine Corps", "CA"),
  inst(8, "Naval Base San Diego", "Navy", "CA"),
];

describe("toNearBaseInstallation", () => {
  it("drops a service the index does not cover rather than mislabeling it", () => {
    expect(
      toNearBaseInstallation({ id: 9, command_name: "Base Alameda", service_branch: "Coast Guard", city: "Alameda", state: "CA" })
    ).toBeNull();
    expect(inst(1, "Fort Bragg", "Army").branchSlug).toBe("army");
  });
});

describe("resolveInstallation", () => {
  it("expands common abbreviations", () => {
    const r = resolveInstallation("NAS Pensacola", INSTALLATIONS);
    expect(r.status).toBe("resolved");
    if (r.status === "resolved") {
      expect(r.installation.commandName).toBe("Naval Air Station Pensacola");
      expect(r.matchedVia).toBe("name");
    }
    const mcas = resolveInstallation("MCAS Miramar", INSTALLATIONS);
    expect(mcas.status).toBe("resolved");
  });

  it("is case- and punctuation-insensitive and accepts a partial name", () => {
    const r = resolveInstallation("langley eustis", INSTALLATIONS);
    expect(r.status).toBe("resolved");
    if (r.status === "resolved") expect(r.installation.id).toBe(5);
  });

  it("returns candidates when the words match several bases -- never picks one", () => {
    const r = resolveInstallation("naval air station", INSTALLATIONS);
    expect(r.status).toBe("ambiguous");
    if (r.status === "ambiguous") expect(r.candidates.map((c) => c.id).sort()).toEqual([2, 3]);
  });

  it("finds a base by its former or restored name and says so", () => {
    const liberty = resolveInstallation("Fort Liberty", INSTALLATIONS);
    expect(liberty.status).toBe("resolved");
    if (liberty.status === "resolved") {
      expect(liberty.installation.commandName).toBe("Fort Bragg");
      expect(liberty.matchedVia).toBe("former_name");
    }
    const cavazos = resolveInstallation("Ft. Cavazos", INSTALLATIONS);
    expect(cavazos.status).toBe("resolved");
    if (cavazos.status === "resolved") expect(cavazos.installation.id).toBe(6);
  });

  it("returns unknown for a base that is not indexed, and for blank input", () => {
    expect(resolveInstallation("Fort Carson", INSTALLATIONS).status).toBe("unknown");
    expect(resolveInstallation("   ", INSTALLATIONS).status).toBe("unknown");
  });

  it("treats a joint base stored once per service as ONE installation hosting both", () => {
    const r = resolveInstallation("JBLM", INSTALLATIONS);
    expect(r.status).toBe("resolved");
    if (r.status === "resolved") {
      expect(r.installation.commandName).toBe("Joint Base Lewis-McChord");
      expect(r.installation.branch).toBe("Army / Air Force");
      expect(r.rowIds).toEqual([11, 12]);
    }
  });

  it("prefers an exact name over a superset match", () => {
    const withSuperset = [...INSTALLATIONS, inst(10, "Naval Station Norfolk Annex", "Navy", "VA")];
    const r = resolveInstallation("Naval Station Norfolk", withSuperset);
    expect(r.status).toBe("resolved");
    if (r.status === "resolved") expect(r.installation.id).toBe(4);
  });
});

describe("rankCitiesNearBase", () => {
  function row(over: Partial<ProximityRow> & { location_id: number; installation_id: number; distance_miles: number }): ProximityRow {
    return {
      city_name: `City${over.location_id}`,
      city_state: "VA",
      population: "10,000",
      command_name: `Base${over.installation_id}`,
      service_branch: "Navy",
      installation_city: "Town",
      installation_state: "VA",
      ...over,
    };
  }

  it("groups rows by city, keeps the nearest as the headline, and ranks cities by that distance", () => {
    const cities = rankCitiesNearBase([
      row({ location_id: 1, installation_id: 10, distance_miles: 30.26 }),
      row({ location_id: 1, installation_id: 11, distance_miles: 8.04 }),
      row({ location_id: 2, installation_id: 10, distance_miles: 12 }),
    ]);
    expect(cities.map((c) => c.city)).toEqual(["City1, VA", "City2, VA"]);
    expect(cities[0].nearest.commandName).toBe("Base11");
    expect(cities[0].nearest.distanceMiles).toBe(8);
    expect(cities[0].othersWithinRadius.map((o) => o.distanceMiles)).toEqual([30.3]);
    expect(cities[0].population).toBe(10000);
  });

  it("skips rows for services outside the index and honors limit and per-city cap", () => {
    const rows: ProximityRow[] = [
      row({ location_id: 1, installation_id: 1, distance_miles: 1 }),
      row({ location_id: 1, installation_id: 2, distance_miles: 2 }),
      row({ location_id: 1, installation_id: 3, distance_miles: 3 }),
      row({ location_id: 1, installation_id: 4, distance_miles: 4 }),
      row({ location_id: 1, installation_id: 5, distance_miles: 5 }),
      row({ location_id: 2, installation_id: 6, distance_miles: 6 }),
      row({ location_id: 3, installation_id: 7, distance_miles: 7, service_branch: "Space Force" }),
    ];
    const cities = rankCitiesNearBase(rows, { limit: 1 });
    expect(cities).toHaveLength(1);
    expect(cities[0].othersWithinRadius).toHaveLength(3);
    expect(rankCitiesNearBase(rows).map((c) => c.city)).toEqual(["City1, VA", "City2, VA"]);
  });

  it("collapses a joint base's per-service rows into one hit for a city", () => {
    const cities = rankCitiesNearBase([
      row({ location_id: 1, installation_id: 11, distance_miles: 9, command_name: "Joint Base Lewis-McChord", service_branch: "Army" }),
      row({ location_id: 1, installation_id: 12, distance_miles: 9, command_name: "Joint Base Lewis-McChord", service_branch: "Air Force" }),
      row({ location_id: 1, installation_id: 13, distance_miles: 40, command_name: "Naval Base Kitsap", service_branch: "Navy" }),
    ]);
    expect(cities[0].nearest.commandName).toBe("Joint Base Lewis-McChord");
    expect(cities[0].nearest.branch).toBe("Army / Air Force");
    expect(cities[0].othersWithinRadius.map((o) => o.commandName)).toEqual(["Naval Base Kitsap"]);
  });

  it("returns an empty list for no rows", () => {
    expect(rankCitiesNearBase([])).toEqual([]);
  });
});
