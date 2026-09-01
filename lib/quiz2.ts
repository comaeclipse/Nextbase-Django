/*
 * Profile model for /quiz2: a live "profile studio" where every control
 * re-ranks the whole location list on the spot. Unlike lib/quiz.ts — which
 * buckets each consideration into priority/consider/skip — this version exposes
 * the Fit-score weights directly as 0-100 sliders, so it drives lib/scoring.ts's
 * PersonalizedWeights without any lossy bucketing.
 *
 * This is now the shipping weighted-profile flow (issues #2/#3): the profile is
 * persisted in a versioned cookie (same pattern as lib/quiz.ts and lib/profile.ts)
 * and read server-side on /city/[id] to personalize the Veteran Fit Score.
 * lib/profile.ts's `vr_profile_v1` cookie is a *separate*, complementary thing —
 * hard dealbreakers that decide which cities rank; this cookie carries the soft
 * weights that reshape the score itself.
 */
import type { FilterParams } from "./filters";
import type { PersonalizedWeights } from "./scoring";

/** Slider positions, 0-100. Divided by 100 to become PersonalizedWeights. */
export type WeightKey = keyof PersonalizedWeights;

/** Bumped when the persisted shape changes; older cookies are discarded. */
const QUIZ2_VERSION = 1;

export interface Quiz2Profile {
  version: typeof QUIZ2_VERSION;
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
  version: QUIZ2_VERSION,
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

/*
 * Persistence. Mirrors lib/quiz.ts / lib/profile.ts: a versioned, URL-encoded
 * JSON cookie, decodable on the server so the first paint (both /quiz2's own
 * form and the personalized city rail) already reflects the saved profile.
 * A version mismatch discards rather than migrates.
 */
export const QUIZ2_COOKIE_NAME = "vr_quiz2_v1";
const QUIZ2_COOKIE_MAX_AGE = 60 * 60 * 24 * 180; // 180 days

const WEIGHT_KEYS = WEIGHT_FACTORS.map((f) => f.key);
const CLIMATE_VALUES = new Set(CLIMATE_OPTIONS.map((o) => o.value));
const LIFESTYLE_VALUES = new Set(LIFESTYLE_OPTIONS.map((o) => o.value));
const ACTIVITY_VALUES = new Set(ACTIVITY_OPTIONS.map((o) => o.value));
const SNOW_VALUES = new Set(SNOW_OPTIONS.map((o) => o.value));

/** Clamp a slider position to a whole number in [min, max]. */
function clampInt(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}

/**
 * True once the visitor has meaningfully engaged — i.e. the saved profile
 * differs from the defaults. A cookie that decodes to the exact defaults is
 * treated as "no profile" so the city page still shows the invite rather than a
 * personalization that changed nothing.
 */
export function hasActiveQuiz2Profile(profile: Quiz2Profile): boolean {
  return JSON.stringify(profile) !== JSON.stringify(DEFAULT_QUIZ2_PROFILE);
}

export function encodeQuiz2Profile(profile: Quiz2Profile): string {
  return encodeURIComponent(JSON.stringify(profile));
}

/**
 * Parse a cookie value into a Quiz2Profile, overlaying only well-formed fields
 * onto the defaults. Returns null for anything unrecognized (wrong version,
 * non-object, unparseable) so a bad or stale cookie can never poison scoring.
 */
export function decodeQuiz2Profile(
  raw: string | null | undefined
): Quiz2Profile | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(raw));
    if (typeof parsed !== "object" || parsed === null) return null;
    if (parsed.version !== QUIZ2_VERSION) return null;

    const out: Quiz2Profile = {
      ...DEFAULT_QUIZ2_PROFILE,
      weights: { ...DEFAULT_QUIZ2_PROFILE.weights },
    };

    const w = parsed.weights;
    if (typeof w === "object" && w !== null) {
      for (const key of WEIGHT_KEYS) {
        const v = w[key];
        if (typeof v === "number" && Number.isFinite(v)) {
          out.weights[key] = clampInt(v, 0, 100);
        }
      }
    }

    if (Array.isArray(parsed.climate)) {
      out.climate = parsed.climate.filter(
        (c: unknown): c is string => typeof c === "string" && CLIMATE_VALUES.has(c)
      );
    }
    if (Array.isArray(parsed.activities)) {
      out.activities = parsed.activities.filter(
        (a: unknown): a is string => typeof a === "string" && ACTIVITY_VALUES.has(a)
      );
    }
    if (typeof parsed.lifestyle === "string" && LIFESTYLE_VALUES.has(parsed.lifestyle)) {
      out.lifestyle = parsed.lifestyle;
    }
    if (typeof parsed.snow === "string" && SNOW_VALUES.has(parsed.snow)) {
      out.snow = parsed.snow;
    }
    if (typeof parsed.priceMax === "number" && Number.isFinite(parsed.priceMax)) {
      out.priceMax = clampInt(parsed.priceMax, PRICE_MIN, PRICE_ANY);
    }
    for (const key of ["priceIsHardFilter", "noAssaultWeaponsBan", "noHighCapMagBan", "lgbtqFriendlyOnly"] as const) {
      if (typeof parsed[key] === "boolean") out[key] = parsed[key];
    }

    return out;
  } catch {
    return null;
  }
}

export function setQuiz2ProfileCookie(profile: Quiz2Profile): void {
  if (typeof document === "undefined") return;
  document.cookie = `${QUIZ2_COOKIE_NAME}=${encodeQuiz2Profile(profile)}; path=/; max-age=${QUIZ2_COOKIE_MAX_AGE}; samesite=lax`;
}

export function clearQuiz2ProfileCookie(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${QUIZ2_COOKIE_NAME}=; path=/; max-age=0`;
}

export function readQuiz2ProfileCookieClient(): Quiz2Profile | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${QUIZ2_COOKIE_NAME}=([^;]*)`)
  );
  return match ? decodeQuiz2Profile(match[1]) : null;
}
