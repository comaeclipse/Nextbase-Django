import { describe, expect, it } from "vitest";
import {
  DEFAULT_PREFERENCES,
  GUN_FREEDOM_ANY,
  PREFERENCE_FACETS,
  applyPreferenceFloor,
  blockedByPreferences,
  decodePreferences,
  describePreferences,
  encodePreferences,
  gunFreedomIndex,
  hasActivePreferences,
  preferencesToFilterParams,
  type SitePreferences,
} from "./profile";
import type { FilterParams } from "./filters";
import type { StateInfoRow } from "./types";

function prefs(partial: Partial<SitePreferences> = {}): SitePreferences {
  return { ...DEFAULT_PREFERENCES, ...partial };
}

function stateInfo(
  partial: Partial<StateInfoRow> & { state: string }
): StateInfoRow {
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
    vet_benefits_verified_on: "2026-08-11",
    ...partial,
  };
}

describe("preferencesToFilterParams", () => {
  it("is a no-op for an untouched profile", () => {
    const params = preferencesToFilterParams(DEFAULT_PREFERENCES);
    for (const [key, value] of Object.entries(params)) {
      expect(value, `${key} should be null by default`).toBeNull();
    }
    expect(hasActivePreferences(DEFAULT_PREFERENCES)).toBe(false);
  });

  it("maps each facet to the param the rest of the site already understands", () => {
    expect(
      preferencesToFilterParams(prefs({ noAssaultWeaponsBan: true })).no_awb
    ).toBe("true");
    expect(
      preferencesToFilterParams(prefs({ noHighCapMagBan: true })).no_hcm
    ).toBe("true");
    expect(
      preferencesToFilterParams(prefs({ noStateIncomeTax: true })).no_income_tax
    ).toBe("true");
    expect(
      preferencesToFilterParams(prefs({ lgbtqFriendlyOnly: true })).lgbtq_friendly
    ).toBe("true");
  });

  it("excludes partial and conditional military retired-pay exemptions", () => {
    const params = preferencesToFilterParams(prefs({ retiredPayUntaxed: true }));
    expect(params.retired_pay_tax).toBe("no_income_tax,exempt");
    expect(params.retired_pay_tax).not.toContain("partial");
    expect(params.retired_pay_tax).not.toContain("conditional");
  });

  it("sends the gun-freedom floor only when it is above 'no minimum'", () => {
    expect(
      preferencesToFilterParams(prefs({ gunFreedomMin: GUN_FREEDOM_ANY }))
        .gun_freedom_min
    ).toBeNull();
    expect(
      preferencesToFilterParams(prefs({ gunFreedomMin: 80 })).gun_freedom_min
    ).toBe("80");
  });
});

describe("applyPreferenceFloor", () => {
  it("narrows session filters but never widens a saved dealbreaker", () => {
    const session: FilterParams = { no_awb: null, sort: "best" };
    const merged = applyPreferenceFloor(
      session,
      prefs({ noAssaultWeaponsBan: true })
    );
    expect(merged.no_awb).toBe("true");
    expect(merged.sort).toBe("best");
  });

  it("keeps the stricter of the two gun-freedom floors", () => {
    expect(
      applyPreferenceFloor({ gun_freedom_min: "50" }, prefs({ gunFreedomMin: 80 }))
        .gun_freedom_min
    ).toBe("80");
    expect(
      applyPreferenceFloor({ gun_freedom_min: "90" }, prefs({ gunFreedomMin: 80 }))
        .gun_freedom_min
    ).toBe("90");
  });

  it("intersects the retired-pay values rather than letting either side win", () => {
    const merged = applyPreferenceFloor(
      { retired_pay_tax: "exempt,partial" },
      prefs({ retiredPayUntaxed: true })
    );
    expect(merged.retired_pay_tax).toBe("exempt");
  });

  it("leaves session params untouched when no preferences are set", () => {
    const session: FilterParams = { climate: "hot_dry", sort: "best" };
    expect(applyPreferenceFloor(session, DEFAULT_PREFERENCES)).toEqual(session);
  });
});

describe("cookie encoding", () => {
  it("round-trips a saved profile", () => {
    const saved = prefs({
      noAssaultWeaponsBan: true,
      gunFreedomMin: 75,
      retiredPayUntaxed: true,
    });
    expect(decodePreferences(encodePreferences(saved))).toEqual(saved);
  });

  it("rejects a different version rather than migrating it", () => {
    const stale = encodeURIComponent(
      JSON.stringify({ version: 0, noAssaultWeaponsBan: true })
    );
    expect(decodePreferences(stale)).toBeNull();
  });

  it("returns null for junk and for an absent cookie", () => {
    expect(decodePreferences("not-json")).toBeNull();
    expect(decodePreferences(null)).toBeNull();
    expect(decodePreferences(undefined)).toBeNull();
  });

  it("ignores wrongly-typed fields and clamps the slider", () => {
    const raw = encodeURIComponent(
      JSON.stringify({
        version: 1,
        noAssaultWeaponsBan: "yes",
        gunFreedomMin: 500,
      })
    );
    const decoded = decodePreferences(raw);
    expect(decoded?.noAssaultWeaponsBan).toBe(false);
    expect(decoded?.gunFreedomMin).toBe(100);
  });
});

describe("blockedByPreferences", () => {
  it("passes a state that satisfies everything", () => {
    const reasons = blockedByPreferences(
      prefs({ noAssaultWeaponsBan: true }),
      stateInfo({ state: "TX", assault_weapons_ban: false }),
      "TX"
    );
    expect(reasons).toEqual([]);
  });

  it("blocks a state with a recorded assault weapon ban", () => {
    const reasons = blockedByPreferences(
      prefs({ noAssaultWeaponsBan: true }),
      stateInfo({ state: "CA", assault_weapons_ban: true }),
      "CA"
    );
    expect(reasons).toHaveLength(1);
    expect(reasons[0]).toMatch(/assault weapon ban/i);
  });

  it("does not claim a ban for a NULL column", () => {
    // NULL means our source was silent, not that the law exists (issue #6).
    const reasons = blockedByPreferences(
      prefs({ noAssaultWeaponsBan: true, noHighCapMagBan: true }),
      stateInfo({ state: "TX", assault_weapons_ban: null, high_cap_mag_ban: null }),
      "TX"
    );
    expect(reasons).toEqual([]);
  });

  it("blocks a state below the gun-freedom floor and keeps one above it", () => {
    expect(
      blockedByPreferences(prefs({ gunFreedomMin: 80 }), null, "CA")
    ).toHaveLength(1);
    expect(blockedByPreferences(prefs({ gunFreedomMin: 80 }), null, "TX")).toEqual(
      []
    );
  });

  it("keeps a state the index has no entry for", () => {
    expect(
      blockedByPreferences(prefs({ gunFreedomMin: 90 }), null, "ZZ")
    ).toEqual([]);
  });

  it("requires a verified row for the tax facets", () => {
    const unverified = stateInfo({
      state: "TX",
      no_income_tax: true,
      vet_benefits_verified_on: null,
    });
    expect(
      blockedByPreferences(prefs({ noStateIncomeTax: true }), unverified, "TX")
    ).toHaveLength(1);

    const verified = stateInfo({ state: "TX", no_income_tax: true });
    expect(
      blockedByPreferences(prefs({ noStateIncomeTax: true }), verified, "TX")
    ).toEqual([]);
  });

  it("treats a partial retired-pay exemption as not untaxed", () => {
    const partial = stateInfo({ state: "MD", retired_pay_tax: "partial" });
    expect(
      blockedByPreferences(prefs({ retiredPayUntaxed: true }), partial, "MD")
    ).toHaveLength(1);

    const exempt = stateInfo({ state: "AL", retired_pay_tax: "exempt" });
    expect(
      blockedByPreferences(prefs({ retiredPayUntaxed: true }), exempt, "AL")
    ).toEqual([]);
  });
});

describe("describePreferences", () => {
  it("is empty by default and names each active constraint", () => {
    expect(describePreferences(DEFAULT_PREFERENCES)).toEqual([]);

    const chips = describePreferences(
      prefs({ noAssaultWeaponsBan: true, gunFreedomMin: 80 })
    );
    expect(chips).toContain(
      PREFERENCE_FACETS.find((f) => f.key === "noAssaultWeaponsBan")!.label
    );
    expect(chips).toContain("Gun Freedom Index 80+");
  });
});

describe("gunFreedomIndex", () => {
  it("reads the curated index and returns null for unknown states", () => {
    expect(gunFreedomIndex("CA")).toBe(3);
    expect(gunFreedomIndex("ID")).toBe(99);
    expect(gunFreedomIndex("ZZ")).toBeNull();
    expect(gunFreedomIndex(null)).toBeNull();
  });
});
