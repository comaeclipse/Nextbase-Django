/*
 * Profile model for the /quiz2 demo: a live "profile studio" where every
 * control re-ranks the whole location list on the spot. Unlike lib/quiz.ts —
 * which buckets each consideration into priority/consider/skip — this version
 * exposes the Fit-score weights directly as 0-100 sliders, so the demo drives
 * lib/scoring.ts's PersonalizedWeights without any lossy bucketing.
 *
 * Demo only: nothing here is persisted, and /quiz remains the shipping flow.
 */
import type { FilterParams } from "./filters";
import type { PersonalizedWeights } from "./scoring";

/** Slider positions, 0-100. Divided by 100 to become PersonalizedWeights. */
export type WeightKey = keyof PersonalizedWeights;

export interface Quiz2Profile {
  weights: Record<WeightKey, number>;
  climate: string[];
  lifestyle: string; // "" = any
  activities: string[];
  /** Home-price ceiling in thousands. PRICE_ANY means "no ceiling". */
  priceMax: number;
  /** When false, price only nudges ranking; when true it removes places. */
  priceIsHardFilter: boolean;
  snow: string; // "" = any
  noAssaultWeaponsBan: boolean;
  noHighCapMagBan: boolean;
  lgbtqFriendlyOnly: boolean;
}

/** Top of the price slider, treated as "no ceiling" rather than $800k. */
export const PRICE_ANY = 800;
export const PRICE_MIN = 100;
export const PRICE_STEP = 25;

export const DEFAULT_QUIZ2_PROFILE: Quiz2Profile = {
  weights: {
    va: 70,
    costOfLiving: 55,
    homeValue: 55,
    safety: 45,
    lgbtq: 30,
    gunRights: 30,
  },
  climate: [],
  lifestyle: "",
  activities: [],
  priceMax: PRICE_ANY,
  priceIsHardFilter: false,
  snow: "",
  noAssaultWeaponsBan: false,
  noHighCapMagBan: false,
  lgbtqFriendlyOnly: false,
};

export interface WeightFactor {
  key: WeightKey;
  label: string;
  hint: string;
  /** Hue for the mix bar and slider accent. */
  color: string;
}

/** Ordered for display; the order also drives the weight-mix bar. */
export const WEIGHT_FACTORS: WeightFactor[] = [
  { key: "va", label: "VA healthcare access", hint: "Proximity to VA hospitals and clinics", color: "#2563eb" },
  { key: "costOfLiving", label: "Cost of living", hint: "Everyday expenses, taxes, and gas", color: "#0891b2" },
  { key: "homeValue", label: "Home affordability", hint: "Typical home price in the area", color: "#059669" },
  { key: "safety", label: "Safety", hint: "Local crime index", color: "#ca8a04" },
  { key: "lgbtq", label: "LGBTQ+ friendliness", hint: "State and local inclusiveness rating", color: "#c026d3" },
  { key: "gunRights", label: "Gun rights", hint: "State firearm laws", color: "#dc2626" },
];

export const CLIMATE_OPTIONS = [
  { value: "cold_snowy", label: "Four seasons", emoji: "❄️" },
  { value: "hot_humid", label: "Warm & humid", emoji: "💧" },
  { value: "hot_dry", label: "Sunny & dry", emoji: "☀️" },
  { value: "mild_coastal", label: "Mild & coastal", emoji: "🌊" },
];

export const LIFESTYLE_OPTIONS = [
  { value: "urban", label: "Urban", hint: "Walkable and lively" },
  { value: "suburban", label: "Suburban", hint: "Room to breathe" },
  { value: "small_town", label: "Small Town", hint: "Local and unhurried" },
  { value: "rural", label: "Rural", hint: "Quiet and spacious" },
];

export const ACTIVITY_OPTIONS = [
  { value: "golf", label: "Golf", emoji: "⛳" },
  { value: "fishing", label: "Fishing", emoji: "🎣" },
  { value: "hiking", label: "Hiking", emoji: "🥾" },
  { value: "culture", label: "Arts & culture", emoji: "🎭" },
];

export const SNOW_OPTIONS = [
  { value: "zero", label: "None" },
  { value: "some", label: "A dusting" },
  { value: "lots", label: "Bring it on" },
];

/** Format a slider position as a price ceiling label. */
export function formatPriceCeiling(priceMax: number): string {
  return priceMax >= PRICE_ANY ? "No limit" : `$${priceMax}k`;
}

export function profileToFilterParams(profile: Quiz2Profile): FilterParams {
  const capped = profile.priceIsHardFilter && profile.priceMax < PRICE_ANY;
  return {
    climate: profile.climate.length ? profile.climate.join(",") : null,
    lifestyle: profile.lifestyle || null,
    activities: profile.activities.length ? profile.activities.join(",") : null,
    price_max: capped ? String(profile.priceMax) : null,
    snow: profile.snow || null,
    no_awb: profile.noAssaultWeaponsBan ? "true" : null,
    no_hcm: profile.noHighCapMagBan ? "true" : null,
    lgbtq_friendly: profile.lgbtqFriendlyOnly ? "true" : null,
    sort: "best",
  };
}

/** Slider positions (0-100) become scoring weights (0-1). */
export function profileToWeights(profile: Quiz2Profile): PersonalizedWeights {
  const w = profile.weights;
  return {
    va: w.va / 100,
    costOfLiving: w.costOfLiving / 100,
    homeValue: w.homeValue / 100,
    safety: w.safety / 100,
    lgbtq: w.lgbtq / 100,
    gunRights: w.gunRights / 100,
  };
}

/**
 * Each factor's share of the final score, as whole percents. Mirrors the
 * normalization in calculatePersonalizedScore: an all-zero profile falls back
 * to equal weighting rather than dividing by zero.
 */
export function weightShares(profile: Quiz2Profile): Record<WeightKey, number> {
  const keys = WEIGHT_FACTORS.map((f) => f.key);
  const total = keys.reduce((sum, k) => sum + profile.weights[k], 0);
  const shares = {} as Record<WeightKey, number>;
  for (const k of keys) {
    shares[k] = total > 0 ? (profile.weights[k] / total) * 100 : 100 / keys.length;
  }
  return shares;
}

export interface Quiz2Preset {
  id: string;
  label: string;
  emoji: string;
  blurb: string;
  profile: Quiz2Profile;
}

/** One-click starting points, so the demo shows a range without dragging. */
export const PRESETS: Quiz2Preset[] = [
  {
    id: "care-first",
    label: "Care first",
    emoji: "🏥",
    blurb: "VA access above all else",
    profile: {
      ...DEFAULT_QUIZ2_PROFILE,
      weights: { va: 100, costOfLiving: 40, homeValue: 30, safety: 60, lgbtq: 25, gunRights: 15 },
    },
  },
  {
    id: "stretch-the-pension",
    label: "Stretch the pension",
    emoji: "💵",
    blurb: "Low costs, modest home prices",
    profile: {
      ...DEFAULT_QUIZ2_PROFILE,
      weights: { va: 45, costOfLiving: 100, homeValue: 95, safety: 40, lgbtq: 20, gunRights: 25 },
      priceMax: 300,
      priceIsHardFilter: true,
    },
  },
  {
    id: "sun-and-golf",
    label: "Sun & golf",
    emoji: "⛳",
    blurb: "Warm, dry, and a course nearby",
    profile: {
      ...DEFAULT_QUIZ2_PROFILE,
      weights: { va: 50, costOfLiving: 45, homeValue: 40, safety: 55, lgbtq: 30, gunRights: 30 },
      climate: ["hot_dry", "mild_coastal"],
      activities: ["golf"],
    },
  },
  {
    id: "wide-open",
    label: "Wide open",
    emoji: "🏔️",
    blurb: "Trails, water, gun friendly",
    profile: {
      ...DEFAULT_QUIZ2_PROFILE,
      // No lifestyle filter: rural pace is sparse, and pairing it with outdoor
      // tags collapses the preset to very few results.
      weights: { va: 40, costOfLiving: 60, homeValue: 70, safety: 35, lgbtq: 10, gunRights: 95 },
      activities: ["hiking", "fishing"],
    },
  },
];
