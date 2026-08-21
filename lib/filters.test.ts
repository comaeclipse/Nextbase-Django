import { describe, expect, it } from "vitest";
import { filterAndSort } from "./filters";
import type { EmployerIndex, EmployerPresence } from "./defense";
import type { MilitaryProximity, MilitaryProximityIndex } from "./military";
import type { LocationRow, StateInfoRow } from "./types";

function stateInfo(partial: Partial<StateInfoRow> & { state: string }): StateInfoRow {
  return {
    magazine_limit: null,
    gifford_score: null,
    ghost_gun_ban: null,
    assault_weapons_ban: null,
    high_cap_mag_ban: null,
    no_income_tax: null,
    retired_pay_tax: null,
    disabled_vet_property_tax: null,
    employment_preference: null,
    education_benefit: null,
    parks_benefit: null,
    hunt_fish_benefit: null,
    vet_benefits_summary: null,
    // Verified by default so benefit tests exercise the facet, not the gate;
    // the verification-gate test overrides this to null explicitly.
    vet_benefits_verified_on: "2026-08-11",
    ...partial,
  };
}

function loc(partial: Partial<LocationRow>): LocationRow {
  return {
    id: 1,
    name: "Test",
    state: "TX",
    county: null,
    climate: null,
    cost_of_living: "Moderate",
    tags: null,
    emoji: "",
    gradient: "",
    featured: false,
    state_party: null,
    governor: null,
    city_politics: null,
    election_2016: null,
    election_2016_percent: null,
    election_2024: null,
    election_2024_percent: null,
    election_change: null,
    population: null,
    density: null,
    sales_tax: null,
    income_tax: null,
    col_index: null,
    has_va: null,
    nearest_va: null,
    distance_to_va: null,
    nearest_va_kind: null,
    nearest_va_hospital: null,
    distance_to_va_hospital: null,
    veterans_benefits: null,
    tci: null,
    marijuana_status: null,
    lgbtq_rating: null,
    lgbtq_mei_score: null,
    lgbtq_state_policy_score: null,
    lgbtq_score_source: null,
    tech_hub: null,
    defense_hub: null,
    defense_hub_manual: null,
    has_walmart: null,
    has_costco: null,
    snow_annual: null,
    rain_annual: null,
    sun_days: null,
    alw: null,
    avg_high_summer: null,
    humidity_summer: null,
    gas_price: null,
    description: null,
    avg_home_value: null,
    avg_home_value_display: null,
    crime: null,
    climate_category: null,
    pace_category: null,
    rep_vote_share_change_pp: null,
    dem_vote_share_change_pp: null,
    ...partial,
  };
}

describe("retail access filters", () => {
  const rows = [
    loc({ id: 1, name: "Both", has_walmart: true, has_costco: true }),
    loc({ id: 2, name: "Walmart", has_walmart: true, has_costco: false }),
    loc({ id: 3, name: "Costco", has_walmart: false, has_costco: true }),
    loc({ id: 4, name: "Unknown", has_walmart: null, has_costco: null }),
  ];

  it("matches only Walmart-positive locations", () => {
    const result = filterAndSort(rows, [], { has_walmart: "true" });
    expect(result.map((location) => location.name)).toEqual(["Both", "Walmart"]);
  });

  it("matches only Costco-positive locations", () => {
    const result = filterAndSort(rows, [], { has_costco: "true" });
    expect(result.map((location) => location.name)).toEqual(["Both", "Costco"]);
  });

  it("requires both positives when both filters are selected", () => {
    const result = filterAndSort(rows, [], {
      has_walmart: "true",
      has_costco: "true",
    });
    expect(result.map((location) => location.name)).toEqual(["Both"]);
  });
});

describe("gun_freedom_min filter", () => {
  // Index values come from the curated rubric in lib/state-gun-freedom.ts:
  // ID 99, TX 95, CO 51, CA 3. "ZZ" is absent from it on purpose.
  const rows = [
    loc({ id: 1, name: "Boise", state: "ID" }),
    loc({ id: 2, name: "Austin", state: "TX" }),
    loc({ id: 3, name: "Denver", state: "CO" }),
    loc({ id: 4, name: "Fresno", state: "CA" }),
    loc({ id: 5, name: "Nowhere", state: "ZZ" }),
  ];

  it("keeps only states at or above the floor", () => {
    const result = filterAndSort(rows, [], { gun_freedom_min: "90" });
    expect(result.map((l) => l.name).sort()).toEqual([
      "Austin",
      "Boise",
      "Nowhere",
    ]);
  });

  it("keeps a state the index has no entry for rather than dropping it", () => {
    // Consistent with the three-valued DB columns: unknown is not "fails".
    const result = filterAndSort(rows, [], { gun_freedom_min: "100" });
    expect(result.map((l) => l.name)).toContain("Nowhere");
  });

  it("treats the exact floor as passing", () => {
    const result = filterAndSort(rows, [], { gun_freedom_min: "95" });
    expect(result.map((l) => l.name)).toContain("Austin");
  });

  it("ignores a missing or non-numeric value instead of filtering", () => {
    expect(filterAndSort(rows, [], {})).toHaveLength(5);
    expect(filterAndSort(rows, [], { gun_freedom_min: "abc" })).toHaveLength(5);
    expect(filterAndSort(rows, [], { gun_freedom_min: "" })).toHaveLength(5);
  });
});

describe("veteran-benefit filters (state-level)", () => {
  // TX: no income tax at all. VA: partial retired-pay exemption + disabled-vet
  // property tax. NE: retired pay fully exempt. CA: taxed, no property benefit.
  const rows = [
    loc({ id: 1, name: "Austin", state: "TX" }),
    loc({ id: 2, name: "Norfolk", state: "VA" }),
    loc({ id: 3, name: "Omaha", state: "NE" }),
    loc({ id: 4, name: "San Diego", state: "CA" }),
  ];
  const stateInfos: StateInfoRow[] = [
    stateInfo({
      state: "TX",
      no_income_tax: true,
      retired_pay_tax: "no_income_tax",
      disabled_vet_property_tax: true,
    }),
    stateInfo({
      state: "VA",
      no_income_tax: false,
      retired_pay_tax: "partial",
      disabled_vet_property_tax: true,
    }),
    stateInfo({
      state: "NE",
      no_income_tax: false,
      retired_pay_tax: "exempt",
      // deliberately NULL, not false: source summary was silent
      disabled_vet_property_tax: null,
    }),
    stateInfo({
      state: "CA",
      no_income_tax: false,
      retired_pay_tax: "taxed",
      disabled_vet_property_tax: false,
    }),
  ];

  it("matches only states whose no_income_tax IS TRUE", () => {
    expect(
      names(filterAndSort(rows, stateInfos, { no_income_tax: "true" }))
    ).toEqual(["Austin"]);
  });

  it("treats a NULL boolean as 'not a match', never as false", () => {
    // NE's disabled_vet_property_tax is NULL; it must not appear, and the filter
    // must never behave like `!= false` (which would include CA's explicit false).
    expect(
      names(filterAndSort(rows, stateInfos, { disabled_vet_property_tax: "true" }))
    ).toEqual(["Austin", "Norfolk"].sort());
  });

  it("selects retired_pay_tax by enum membership (untaxed = no_income_tax + exempt)", () => {
    expect(
      names(
        filterAndSort(rows, stateInfos, {
          retired_pay_tax: "no_income_tax,exempt",
        })
      )
    ).toEqual(["Austin", "Omaha"].sort());
  });

  it("excludes partial/conditional from the 'untaxed' retired-pay set", () => {
    const result = names(
      filterAndSort(rows, stateInfos, { retired_pay_tax: "no_income_tax,exempt" })
    );
    expect(result).not.toContain("Norfolk"); // partial
    expect(result).not.toContain("San Diego"); // taxed
  });

  it("ignores unverified rows even when the column is TRUE", () => {
    const unverified: StateInfoRow[] = [
      stateInfo({ state: "TX", no_income_tax: true, vet_benefits_verified_on: null }),
    ];
    expect(
      names(filterAndSort(rows, unverified, { no_income_tax: "true" }))
    ).toEqual([]);
  });

  it("ANDs a benefit boolean against a retired-pay selection", () => {
    // disabled_vet_property_tax TRUE ∩ retired pay untaxed → only Austin (VA is
    // partial retired pay; NE has no property benefit).
    expect(
      names(
        filterAndSort(rows, stateInfos, {
          disabled_vet_property_tax: "true",
          retired_pay_tax: "no_income_tax,exempt",
        })
      )
    ).toEqual(["Austin"]);
  });
});

describe("near_base filter", () => {
  const navy: MilitaryProximity = {
    installation_id: 10,
    command_name: "NAS Pensacola",
    service_branch: "Navy",
    branch_slug: "navy",
    city: "Pensacola",
    state: "FL",
    distance_miles: 8,
  };
  const airForce: MilitaryProximity = {
    installation_id: 11,
    command_name: "Eglin Air Force Base",
    service_branch: "Air Force",
    branch_slug: "air_force",
    city: "Valparaiso",
    state: "FL",
    distance_miles: 45,
  };
  const armyFar: MilitaryProximity = {
    installation_id: 12,
    command_name: "Fort Moore",
    service_branch: "Army",
    branch_slug: "army",
    city: "Columbus",
    state: "GA",
    distance_miles: 120,
  };

  const rows = [
    loc({ id: 1, name: "Pensacola" }),
    loc({ id: 2, name: "Elko" }),
    loc({ id: 3, name: "Marietta", defense_hub: true }),
  ];
  const militaryIndex: MilitaryProximityIndex = {
    1: {
      nearest: navy,
      nearest_by_branch: { navy, air_force: airForce },
    },
    3: {
      nearest: armyFar,
      nearest_by_branch: { army: armyFar },
    },
  };

  it("matches cities with any base inside the distance band", () => {
    const result = filterAndSort(
      rows,
      [],
      { near_base: "true", base_max_distance: "25" },
      { militaryIndex }
    );
    expect(result.map((location) => location.name)).toEqual(["Pensacola"]);
  });

  it("matches a branch inside the band", () => {
    const result = filterAndSort(
      rows,
      [],
      { base_branch: "air_force", base_max_distance: "50" },
      { militaryIndex }
    );
    expect(result.map((location) => location.name)).toEqual(["Pensacola"]);
  });

  it("rejects the same branch outside the band", () => {
    const result = filterAndSort(
      rows,
      [],
      { base_branch: "air_force", base_max_distance: "25" },
      { militaryIndex }
    );
    expect(result.map((location) => location.name)).toEqual([]);
  });

  it("does not treat defense_hub as near_base", () => {
    const result = filterAndSort(
      rows,
      [],
      { near_base: "true", base_max_distance: "50" },
      { militaryIndex }
    );
    expect(result.map((location) => location.name)).toEqual(["Pensacola"]);
  });
});

function names(rows: { name: string }[]): string[] {
  return rows.map((row) => row.name).sort();
}

function presence(partial: Partial<EmployerPresence> = {}): EmployerPresence {
  return {
    slug: "raytheon",
    display_name: "Raytheon",
    parent_company: "RTX",
    counts_as_defense: true,
    onsite: 0,
    hybrid: 0,
    remote: 0,
    total: 0,
    ...partial,
  };
}

const nearbyBase: MilitaryProximity = {
  installation_id: 1,
  command_name: "Fort Example",
  service_branch: "Army",
  branch_slug: "army",
  city: "Example",
  state: "GA",
  distance_miles: 12,
};

describe("veteran proximity axes", () => {
  // A: base only. B: defense employer only. C: VA only (clinic).
  // D: base + defense. E: base + VA hospital. F: all three.
  const rows = [
    loc({ id: 1, name: "A-base", defense_hub: true }),
    loc({
      id: 2,
      name: "B-defense",
      defense_hub: false,
      has_va: false,
    }),
    loc({
      id: 3,
      name: "C-va-clinic",
      has_va: true,
      nearest_va: "Example VA Clinic",
      nearest_va_kind: "outpatient",
      nearest_va_hospital: "Far VA Medical Center",
      distance_to_va_hospital: "80 miles",
    }),
    loc({ id: 4, name: "D-base-defense" }),
    loc({
      id: 5,
      name: "E-base-va-hospital",
      has_va: true,
      nearest_va: "Local VA Medical Center",
      nearest_va_kind: "hospital",
      nearest_va_hospital: "Local VA Medical Center",
    }),
    loc({
      id: 6,
      name: "F-all",
      has_va: true,
      nearest_va: "Hub VA Clinic",
      nearest_va_kind: "outpatient",
      nearest_va_hospital: "Hub VA Medical Center",
    }),
    loc({
      id: 7,
      name: "G-hub-no-employer",
      defense_hub: true,
    }),
    loc({
      id: 8,
      name: "H-remote-only",
    }),
    loc({
      id: 9,
      name: "I-corporate",
    }),
  ];

  const militaryIndex: MilitaryProximityIndex = {
    1: { nearest: nearbyBase, nearest_by_branch: { army: nearbyBase } },
    4: { nearest: nearbyBase, nearest_by_branch: { army: nearbyBase } },
    5: { nearest: nearbyBase, nearest_by_branch: { army: nearbyBase } },
    6: { nearest: nearbyBase, nearest_by_branch: { army: nearbyBase } },
  };

  const employerIndex: EmployerIndex = {
    2: [presence({ onsite: 3, total: 3 })],
    4: [
      presence({
        slug: "lockheed-martin",
        display_name: "Lockheed Martin",
        onsite: 2,
        total: 2,
      }),
    ],
    6: [
      presence({
        slug: "anduril",
        display_name: "Anduril Industries",
        hybrid: 1,
        total: 1,
      }),
    ],
    8: [presence({ onsite: 0, hybrid: 0, remote: 8, total: 8 })],
    9: [
      presence({
        slug: "rtx-corporate",
        display_name: "RTX Corporate",
        counts_as_defense: false,
        onsite: 12,
        total: 12,
      }),
    ],
  };

  const opts = { militaryIndex, employerIndex };

  it("matches near_base without pulling in defense or VA-only cities", () => {
    expect(
      names(
        filterAndSort(rows, [], { near_base: "true", base_max_distance: "50" }, opts)
      )
    ).toEqual(["A-base", "D-base-defense", "E-base-va-hospital", "F-all"].sort());
  });

  it("matches defense_ecosystem from physical defense employers, not defense_hub", () => {
    expect(
      names(filterAndSort(rows, [], { defense_ecosystem: "true" }, opts))
    ).toEqual(["B-defense", "D-base-defense", "F-all"].sort());
  });

  it("does not treat remote-only or corporate presence as defense_ecosystem", () => {
    const result = names(
      filterAndSort(rows, [], { defense_ecosystem: "true" }, opts)
    );
    expect(result).not.toContain("H-remote-only");
    expect(result).not.toContain("I-corporate");
    expect(result).not.toContain("G-hub-no-employer");
    expect(result).not.toContain("A-base");
  });

  it("keeps specific-employer filtering independent of defense_ecosystem", () => {
    expect(
      names(filterAndSort(rows, [], { employers: "raytheon" }, opts))
    ).toEqual(["B-defense", "H-remote-only"].sort());
  });

  it("requires a hospital for va_hospital and does not treat a clinic as one", () => {
    expect(
      names(filterAndSort(rows, [], { healthcare: "va_hospital" }, opts))
    ).toEqual(["E-base-va-hospital"]);
  });

  it("lets a medical center satisfy va_clinic outpatient access", () => {
    expect(
      names(filterAndSort(rows, [], { healthcare: "va_clinic" }, opts))
    ).toEqual(["C-va-clinic", "E-base-va-hospital", "F-all"].sort());
  });

  it("ORs VA options within the healthcare facet", () => {
    expect(
      names(
        filterAndSort(rows, [], { healthcare: "va_hospital,va_clinic" }, opts)
      )
    ).toEqual(["C-va-clinic", "E-base-va-hospital", "F-all"].sort());
  });

  it("ANDs the three veteran-proximity axes against each other", () => {
    expect(
      names(
        filterAndSort(
          rows,
          [],
          {
            near_base: "true",
            defense_ecosystem: "true",
            healthcare: "va_clinic",
          },
          opts
        )
      )
    ).toEqual(["F-all"]);
  });

  it("falls back to name equality when nearest_va_kind is not yet backfilled", () => {
    const unsynced = loc({
      id: 10,
      name: "Unsynced-hospital",
      has_va: true,
      nearest_va: "Town VA Medical Center",
      nearest_va_kind: null,
      nearest_va_hospital: "Town VA Medical Center",
    });
    const clinicFallback = loc({
      id: 11,
      name: "Unsynced-clinic",
      has_va: true,
      nearest_va: "Town VA Clinic",
      nearest_va_kind: null,
      nearest_va_hospital: "Distant VA Medical Center",
    });
    expect(
      names(
        filterAndSort([unsynced, clinicFallback], [], { healthcare: "va_hospital" })
      )
    ).toEqual(["Unsynced-hospital"]);
  });
});
