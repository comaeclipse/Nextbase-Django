/*
 * Quiz/profile model for the /quiz feature (GitHub issue #2). Captures a
 * visitor's retirement preferences and turns them into:
 *  - hard filters (via profileToFilterParams -> lib/filters.ts FilterParams)
 *  - personalized Fit-score weights (via profileToWeights -> lib/scoring.ts)
 * The resulting profile is persisted client-side in a cookie so /explore can
 * read it back and personalize matching without any server-side session.
 */
import type { FilterParams } from "./filters";
import type { PersonalizedWeights } from "./scoring";

/** How strongly a consideration should influence a visitor's ranking. */
export type PreferenceLevel = "priority" | "consider" | "skip";

const PREFERENCE_WEIGHT: Record<PreferenceLevel, number> = {
  priority: 1,
  consider: 0.5,
  skip: 0,
};

export interface QuizProfile {
  climate: string[];
  lifestyle: "urban" | "suburban" | "rural" | "";
  costOfLiving: "low" | "moderate" | "high" | ""; // retained for /explore filter compat
  priceMax: string; // "" (no limit) or thousands, e.g. "350"
  activities: string[];
  vaImportance: PreferenceLevel;
  lgbtqImportance: PreferenceLevel;
  gunRightsImportance: PreferenceLevel;
  affordabilityImportance: PreferenceLevel;
};

export const DEFAULT_QUIZ_PROFILE: QuizProfile = {
  climate: [],
  lifestyle: "",
  costOfLiving: "",
  priceMax: "",
  activities: [],
  vaImportance: "consider",
  lgbtqImportance: "consider",
  gunRightsImportance: "consider",
  affordabilityImportance: "consider",
};

export type QuizQuestionType = "single" | "multi";

export interface QuizQuestionOption {
  value: string;
  label: string;
}

export interface QuizQuestion {
  id: keyof QuizProfile;
  title: string;
  description?: string;
  type: QuizQuestionType;
  options: QuizQuestionOption[];
}

/** Data-driven question list — QuizClient renders generically from this. */
export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: "climate",
    type: "multi",
    title: "What kind of weather feels most like home?",
    description:
      "Choose any climates you would genuinely consider. We'll keep places that fit at least one of them.",
    options: [
      { value: "cold_snowy", label: "❄️ Four seasons, including real winter" },
      { value: "hot_humid", label: "💧 Warm, humid summers are fine" },
      { value: "hot_dry", label: "☀️ Lots of sun and dry air" },
      { value: "mild_coastal", label: "🌊 Milder weather, ideally near the coast" },
    ],
  },
  {
    id: "lifestyle",
    type: "single",
    title: "What should an ordinary week in retirement feel like?",
    description: "Think about the pace and surroundings you would enjoy day to day.",
    options: [
      { value: "", label: "I'm open to different settings" },
      { value: "urban", label: "Walkable, lively, and close to things" },
      { value: "suburban", label: "Convenient, with a little more breathing room" },
      { value: "rural", label: "Quiet, spacious, and a slower pace" },
    ],
  },
  {
    id: "priceMax",
    type: "single",
    title: "What home price would keep this move comfortable?",
    description: "Use this as a ceiling, not a target. Places above it won't appear in your matches.",
    options: [
      { value: "", label: "Don't use home price to narrow my options" },
      { value: "250", label: "Up to $250k" },
      { value: "350", label: "Up to $350k" },
      { value: "450", label: "Up to $450k" },
      { value: "600", label: "Up to $600k" },
    ],
  },
  {
    id: "activities",
    type: "multi",
    title: "What would make a good weekend even better?",
    description:
      "Choose any interests that would make a place more appealing. A match needs at least one of them nearby.",
    options: [
      { value: "golf", label: "⛳ Golf" },
      { value: "fishing", label: "🎣 Fishing" },
      { value: "hiking", label: "🥾 Hiking" },
      { value: "culture", label: "🎭 Arts & Culture" },
    ],
  },
  {
    id: "vaImportance",
    type: "single",
    title: "How should VA care factor into your search?",
    description: "This affects the order of your matches; it does not remove places from the list.",
    options: [
      { value: "priority", label: "Keep VA care close by" },
      { value: "consider", label: "A reasonable drive is fine, but closer is better" },
      { value: "skip", label: "Don't use it to rank my matches" },
    ],
  },
  {
    id: "affordabilityImportance",
    type: "single",
    title: "How much should everyday costs influence the results?",
    description: "This looks at both local cost of living and typical home prices.",
    options: [
      { value: "priority", label: "Keep my budget front and center" },
      { value: "consider", label: "Worth paying more for the right place" },
      { value: "skip", label: "Don't use cost to rank my matches" },
    ],
  },
  {
    id: "gunRightsImportance",
    type: "single",
    title: "How should state gun laws factor into your search?",
    options: [
      { value: "priority", label: "Make it a major consideration" },
      { value: "consider", label: "Factor it in, but don't lead with it" },
      { value: "skip", label: "Don't use it to rank my matches" },
    ],
  },
  {
    id: "lgbtqImportance",
    type: "single",
    title: "What role should an affirming local community play?",
    options: [
      { value: "priority", label: "Prioritize inclusive, welcoming communities" },
      { value: "consider", label: "It's a welcome plus" },
      { value: "skip", label: "Don't use it to rank my matches" },
    ],
  },
];

/** Map preference answers onto the existing /explore filter shape. */
export function profileToFilterParams(profile: QuizProfile): FilterParams {
  return {
    climate: profile.climate.length ? profile.climate.join(",") : null,
    lifestyle: profile.lifestyle || null,
    cost_of_living: profile.costOfLiving || null,
    price_max: profile.priceMax || null,
    activities: profile.activities.length ? profile.activities.join(",") : null,
    sort: "best",
  };
}

/**
 * Map the separate ranking preferences onto Fit-score weights. Affordability
 * covers two individual score factors, so its weight is divided between them.
 */
export function profileToWeights(profile: QuizProfile): PersonalizedWeights {
  const preferenceWeight = (value: unknown) => {
    if (typeof value === "string" && value in PREFERENCE_WEIGHT) {
      return PREFERENCE_WEIGHT[value as PreferenceLevel];
    }
    // Preserve older numeric 0-4 cookies from the original quiz.
    const numeric = Number(value);
    if (Number.isFinite(numeric)) return Math.max(0, Math.min(numeric, 4)) / 4;
    return PREFERENCE_WEIGHT.consider;
  };
  const affordability = preferenceWeight(profile.affordabilityImportance) / 2;
  return {
    lgbtq: preferenceWeight(profile.lgbtqImportance),
    va: preferenceWeight(profile.vaImportance),
    safety: 0,
    gunRights: preferenceWeight(profile.gunRightsImportance),
    costOfLiving: affordability,
    homeValue: affordability,
  };
}

export const QUIZ_COOKIE_NAME = "vr_quiz_profile";
const QUIZ_COOKIE_MAX_AGE = 60 * 60 * 24 * 180; // 180 days

export function encodeQuizProfile(profile: QuizProfile): string {
  return encodeURIComponent(JSON.stringify(profile));
}

/**
 * Convert a point-budget cookie into the separate-preference shape. This keeps
 * people who used the previous quiz version from losing their saved profile.
 */
function migratePriorityBudget(parsed: Record<string, unknown>): Record<string, unknown> {
  if (!parsed.priorities || typeof parsed.priorities !== "object") return parsed;
  const priorities = parsed.priorities as Record<string, unknown>;
  const level = (key: string): PreferenceLevel => {
    const points = Number(priorities[key]);
    if (!Number.isFinite(points) || points <= 0) return "skip";
    return points >= 3 ? "priority" : "consider";
  };
  return {
    ...parsed,
    vaImportance: level("va"),
    lgbtqImportance: level("lgbtq"),
    gunRightsImportance: level("gunRights"),
    affordabilityImportance: level("affordability"),
  };
}

export function decodeQuizProfile(raw: string | null | undefined): QuizProfile | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(raw));
    if (typeof parsed !== "object" || parsed === null) return null;
    const migrated = migratePriorityBudget(parsed as Record<string, unknown>);
    return { ...DEFAULT_QUIZ_PROFILE, ...migrated };
  } catch {
    return null;
  }
}

/** Persist the profile client-side. No server session/middleware required. */
export function setQuizProfileCookie(profile: QuizProfile): void {
  if (typeof document === "undefined") return;
  document.cookie = `${QUIZ_COOKIE_NAME}=${encodeQuizProfile(profile)}; path=/; max-age=${QUIZ_COOKIE_MAX_AGE}; samesite=lax`;
}

export function clearQuizProfileCookie(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${QUIZ_COOKIE_NAME}=; path=/; max-age=0`;
}

export function readQuizProfileCookieClient(): QuizProfile | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${QUIZ_COOKIE_NAME}=([^;]*)`)
  );
  return match ? decodeQuizProfile(match[1]) : null;
}
