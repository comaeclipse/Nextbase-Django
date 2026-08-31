import { describe, it, expect } from "vitest";
import {
  CLIMATE_CATEGORIES,
  classifyClimate,
  explainClimate,
  hasClassifiableClimate,
  isClimateCategory,
  type ClimateInputs,
} from "./climate-category";

/** A fully-null row; each test overrides only the fields that drive its rule. */
const base: ClimateInputs = {
  climate: null,
  snow_annual: null,
  rain_annual: null,
  alw: null,
  avg_high_summer: null,
  humidity_summer: null,
};

describe("issue #64 acceptance fixtures", () => {
  it("Grand Junction, CO => hot_dry (arid + hot summers win over a modest snow total)", () => {
    const result = explainClimate({
      ...base,
      climate: "Cold semi-arid / steppe (BSk)",
      snow_annual: 18,
      rain_annual: 9,
      alw: 17,
      avg_high_summer: 95,
      humidity_summer: 37,
    });
    expect(result.category).toBe("hot_dry");
    expect(result.rule).toBe("arid_hot_dry");
  });

  it("Grand Junction stays hot_dry even if summer humidity is missing", () => {
    expect(
      classifyClimate({
        ...base,
        climate: "Cold semi-arid / steppe (BSk)",
        snow_annual: 18,
        rain_annual: 9,
        alw: 17,
        avg_high_summer: 95,
        humidity_summer: null,
      }),
    ).toBe("hot_dry");
  });

  it("Oklahoma City, OK => hot_humid via the Cfa fallback when humidity is null", () => {
    const result = explainClimate({
      ...base,
      climate: "Humid subtropical (Cfa)",
      snow_annual: 9,
      rain_annual: 36,
      alw: 26,
      avg_high_summer: 93,
      humidity_summer: null,
    });
    expect(result.category).toBe("hot_humid");
    expect(result.rule).toBe("humid_subtropical_fallback");
  });

  it("Oklahoma City => hot_humid via measured humidity when present", () => {
    const result = explainClimate({
      ...base,
      climate: "Humid subtropical (Cfa)",
      snow_annual: 9,
      rain_annual: 36,
      alw: 26,
      avg_high_summer: 93,
      humidity_summer: 62,
    });
    expect(result.category).toBe("hot_humid");
    expect(result.rule).toBe("humid_summer");
  });

  it("Binghamton, NY => cold_snowy (heavy snow)", () => {
    expect(
      classifyClimate({
        ...base,
        climate: "Humid Continental",
        snow_annual: 50,
        rain_annual: 40,
        alw: 18,
        avg_high_summer: 80,
        humidity_summer: 73,
      }),
    ).toBe("cold_snowy");
  });
});

describe("preserves truly snowy high-desert cities as cold_snowy", () => {
  const snowy: Array<[string, ClimateInputs]> = [
    ["Elko, NV", { ...base, climate: "High desert", snow_annual: 41, rain_annual: 10, alw: 16, avg_high_summer: 92, humidity_summer: 29 }],
    ["Bend, OR", { ...base, climate: "High desert four-season", snow_annual: 22, rain_annual: 11, alw: 25, avg_high_summer: 84, humidity_summer: 44 }],
    ["Rapid City, SD", { ...base, climate: "Semi-arid / continental transition", snow_annual: 39, rain_annual: 16, alw: 15, avg_high_summer: 87, humidity_summer: 57 }],
    ["Flagstaff, AZ", { ...base, climate: "High-altitude mountain cold-snowy four-season", snow_annual: 90, rain_annual: 21, alw: 18, avg_high_summer: 82, humidity_summer: 38 }],
    ["Cheyenne, WY", { ...base, climate: "Cold continental / alpine", snow_annual: 65, rain_annual: 15, alw: 18, avg_high_summer: 84, humidity_summer: 51 }],
  ];
  it.each(snowy)("%s stays cold_snowy", (_name, loc) => {
    expect(classifyClimate(loc)).toBe("cold_snowy");
  });
});

describe("classifies hot semi-arid cities as hot_dry", () => {
  const dry: Array<[string, ClimateInputs]> = [
    ["Reno, NV", { ...base, climate: "High desert", snow_annual: 21, rain_annual: 7, alw: 26, avg_high_summer: 94, humidity_summer: 27 }],
    ["Boise, ID", { ...base, climate: "Cold semi-arid", snow_annual: 18, rain_annual: 12, alw: 26, avg_high_summer: 93, humidity_summer: 30 }],
    ["Albuquerque, NM", { ...base, climate: "Cold semi-arid", snow_annual: 9, rain_annual: 9, alw: 26, avg_high_summer: 91, humidity_summer: 44 }],
    ["Yuma, AZ", { ...base, climate: "Hot desert", snow_annual: 0, rain_annual: 3, alw: 48, avg_high_summer: 107, humidity_summer: 32 }],
    // A mild-winter SoCal coast: marine-layer humidity (71%) but genuinely dry
    // (11"/yr) and not tropical — stays hot_dry, not hot_humid.
    ["Costa Mesa, CA", { ...base, climate: "Semi-arid climate", snow_annual: 0, rain_annual: 11, alw: 48, avg_high_summer: 90, humidity_summer: 71 }],
  ];
  it.each(dry)("%s is hot_dry", (_name, loc) => {
    expect(classifyClimate(loc)).toBe("hot_dry");
  });
});

describe("a measured high humidity overrides a dry rainfall label", () => {
  it("Honolulu, HI ('Hot semi-arid' by leeward rainfall, but 67% humid) => hot_humid, not hot_dry", () => {
    const result = explainClimate({
      ...base,
      climate: "Hot semi-arid",
      snow_annual: 0,
      rain_annual: 16,
      alw: 67,
      avg_high_summer: 89,
      humidity_summer: 67,
    });
    expect(result.category).toBe("hot_humid");
  });

  const snowyPrairie: Array<[string, ClimateInputs]> = [
    ["North Platte, NE", { ...base, climate: "Cold semi-arid", snow_annual: 30, rain_annual: 21, alw: 12, avg_high_summer: 90, humidity_summer: 65 }],
    ["Pierre, SD", { ...base, climate: "Humid continental / semi-arid prairie", snow_annual: 31, rain_annual: 20, alw: 10, avg_high_summer: 89, humidity_summer: 64 }],
  ];
  it.each(snowyPrairie)("%s (semi-arid label but real snow + humidity) stays cold_snowy", (_name, loc) => {
    expect(classifyClimate(loc)).toBe("cold_snowy");
  });
});

describe("coastal fallback", () => {
  it("Redondo Beach, CA => mild_coastal (mild summers, not hot)", () => {
    expect(
      classifyClimate({
        ...base,
        climate: "Coastal Mediterranean",
        snow_annual: 0,
        rain_annual: 13,
        alw: 48,
        avg_high_summer: 74,
        humidity_summer: 72,
      }),
    ).toBe("mild_coastal");
  });
});

describe("enum guard", () => {
  it("every classifier output is a member of the accepted enum", () => {
    // A grid of plausible inputs must never produce a value outside the enum.
    for (const climate of [null, "Humid subtropical (Cfa)", "Cold semi-arid (BSk)", "Coastal Mediterranean", "High desert"]) {
      for (const avg_high_summer of [null, 70, 85, 92, 100]) {
        for (const snow_annual of [null, 0, 20, 40, 80]) {
          for (const rain_annual of [null, 5, 20, 45]) {
            for (const humidity_summer of [null, 30, 55, 70]) {
              for (const alw of [null, 15, 30, 50]) {
                const category = classifyClimate({ climate, avg_high_summer, snow_annual, rain_annual, humidity_summer, alw });
                expect(CLIMATE_CATEGORIES).toContain(category);
              }
            }
          }
        }
      }
    }
  });

  it("isClimateCategory accepts the four keys and rejects everything else", () => {
    for (const key of CLIMATE_CATEGORIES) expect(isClimateCategory(key)).toBe(true);
    for (const bad of ["humid_continental", "", "cold", null, undefined, 3]) {
      expect(isClimateCategory(bad)).toBe(false);
    }
  });
});

describe("hasClassifiableClimate", () => {
  it("is false without a summer high (would silently default to mild_coastal)", () => {
    expect(hasClassifiableClimate({ ...base, avg_high_summer: null })).toBe(false);
  });
  it("is true once a summer high is present", () => {
    expect(hasClassifiableClimate({ ...base, avg_high_summer: 90 })).toBe(true);
  });
});
