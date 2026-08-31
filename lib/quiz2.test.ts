import { describe, expect, it } from "vitest";
import {
  DEFAULT_QUIZ2_PROFILE,
  PRICE_ANY,
  PRICE_MIN,
  decodeQuiz2Profile,
  encodeQuiz2Profile,
  hasActiveQuiz2Profile,
  profileToWeights,
  type Quiz2Profile,
} from "./quiz2";

function profile(partial: Partial<Quiz2Profile> = {}): Quiz2Profile {
  return {
    ...DEFAULT_QUIZ2_PROFILE,
    ...partial,
    weights: { ...DEFAULT_QUIZ2_PROFILE.weights, ...(partial.weights ?? {}) },
  };
}

describe("decodeQuiz2Profile", () => {
  it("returns null for empty / unparseable input", () => {
    expect(decodeQuiz2Profile(null)).toBeNull();
    expect(decodeQuiz2Profile(undefined)).toBeNull();
    expect(decodeQuiz2Profile("")).toBeNull();
    expect(decodeQuiz2Profile("not-json")).toBeNull();
  });

  it("round-trips a saved profile", () => {
    const saved = profile({
      weights: { va: 90, costOfLiving: 20, homeValue: 55, safety: 40, lgbtq: 10, gunRights: 75 },
      climate: ["hot_dry"],
      lifestyle: "small_town",
      activities: ["golf", "hiking"],
      priceMax: 300,
      priceIsHardFilter: true,
      snow: "zero",
      lgbtqFriendlyOnly: true,
    });
    expect(decodeQuiz2Profile(encodeQuiz2Profile(saved))).toEqual(saved);
  });

  it("discards a cookie from a different version", () => {
    const bumped = encodeURIComponent(
      JSON.stringify({ ...DEFAULT_QUIZ2_PROFILE, version: 999 })
    );
    expect(decodeQuiz2Profile(bumped)).toBeNull();
  });

  it("drops unknown option values instead of trusting them", () => {
    const raw = encodeURIComponent(
      JSON.stringify({
        ...DEFAULT_QUIZ2_PROFILE,
        climate: ["hot_dry", "on_the_moon"],
        activities: ["golf", "spelunking"],
        lifestyle: "megacity",
        snow: "blizzard",
      })
    );
    const decoded = decodeQuiz2Profile(raw);
    expect(decoded?.climate).toEqual(["hot_dry"]);
    expect(decoded?.activities).toEqual(["golf"]);
    // Unknown enum values fall back to the "any" default, not the bad value.
    expect(decoded?.lifestyle).toBe("");
    expect(decoded?.snow).toBe("");
  });

  it("clamps weights and price into range", () => {
    const raw = encodeURIComponent(
      JSON.stringify({
        ...DEFAULT_QUIZ2_PROFILE,
        weights: { ...DEFAULT_QUIZ2_PROFILE.weights, va: 5000, safety: -20 },
        priceMax: 99999,
      })
    );
    const decoded = decodeQuiz2Profile(raw);
    expect(decoded?.weights.va).toBe(100);
    expect(decoded?.weights.safety).toBe(0);
    expect(decoded?.priceMax).toBe(PRICE_ANY);

    const low = encodeURIComponent(
      JSON.stringify({ ...DEFAULT_QUIZ2_PROFILE, priceMax: 1 })
    );
    expect(decodeQuiz2Profile(low)?.priceMax).toBe(PRICE_MIN);
  });

  it("ignores a non-boolean deal-breaker rather than coercing it", () => {
    const raw = encodeURIComponent(
      JSON.stringify({ ...DEFAULT_QUIZ2_PROFILE, lgbtqFriendlyOnly: "yes" })
    );
    expect(decodeQuiz2Profile(raw)?.lgbtqFriendlyOnly).toBe(false);
  });
});

describe("hasActiveQuiz2Profile", () => {
  it("is false for the untouched defaults", () => {
    expect(hasActiveQuiz2Profile(DEFAULT_QUIZ2_PROFILE)).toBe(false);
  });

  it("is true once anything is changed", () => {
    expect(hasActiveQuiz2Profile(profile({ lgbtqFriendlyOnly: true }))).toBe(true);
    expect(
      hasActiveQuiz2Profile(profile({ weights: { ...DEFAULT_QUIZ2_PROFILE.weights, va: 100 } }))
    ).toBe(true);
  });
});

describe("profileToWeights", () => {
  it("maps 0-100 slider positions onto 0-1 weights", () => {
    const w = profileToWeights(
      profile({ weights: { va: 100, costOfLiving: 50, homeValue: 0, safety: 25, lgbtq: 75, gunRights: 10 } })
    );
    expect(w).toEqual({
      va: 1,
      costOfLiving: 0.5,
      homeValue: 0,
      safety: 0.25,
      lgbtq: 0.75,
      gunRights: 0.1,
    });
  });
});
