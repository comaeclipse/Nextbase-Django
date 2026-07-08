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

export type ImportanceLevel = 0 | 1 | 2 | 3 | 4;

export const IMPORTANCE_OPTIONS: { value: ImportanceLevel; label: string }[] = [
  { value: 0, label: "Not at all" },
  { value: 1, label: "A little" },
  { value: 2, label: "Neutral" },
  { value: 3, label: "Somewhat" },
  { value: 4, label: "Very important" },
];

const IMPORTANCE_WEIGHT: Record<ImportanceLevel, number> = {
  0: 0,
  1: 0.25,
  2: 0.5,
  3: 0.75,
  4: 1,
};

export interface QuizProfile {
  climate: string[];
  lifestyle: "urban" | "suburban" | "rural" | "";
  costOfLiving: "low" | "moderate" | "high" | "";
  priceMax: string; // "" (no limit) or thousands, e.g. "350"
  activities: string[];
  vaImportance: ImportanceLevel;
  safetyImportance: ImportanceLevel;
  lgbtqImportance: ImportanceLevel;
  gunRightsImportance: ImportanceLevel;
  affordabilityImportance: ImportanceLevel;
}

export const DEFAULT_QUIZ_PROFILE: QuizProfile = {
  climate: [],
  lifestyle: "",
  costOfLiving: "",
  priceMax: "",
  activities: [],
  vaImportance: 2,
  safetyImportance: 2,
  lgbtqImportance: 2,
  gunRightsImportance: 2,
  affordabilityImportance: 2,
};

export type QuizQuestionType = "single" | "multi" | "importance";

export interface QuizQuestionOption {
  value: string;
  label: string;
}

export interface QuizQuestion {
  id: keyof QuizProfile;
  title: string;
  description?: string;
  type: QuizQuestionType;
  options?: QuizQuestionOption[]; // omitted for "importance" (uses IMPORTANCE_OPTIONS)
}

/** Data-driven question list — QuizClient renders generically from this. */
export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: "climate",
    type: "multi",
    title: "What kind of climate do you like?",
    description: "Pick as many as you're open to, or leave blank for no preference.",
    options: [
      { value: "cold_snowy", label: "❄️ Cold / Snowy" },
      { value: "hot_humid", label: "💧 Hot / Humid" },
      { value: "hot_dry", label: "☀️ Hot / Dry" },
      { value: "mild_coastal", label: "🌊 Mild / Coastal" },
    ],
  },
  {
    id: "lifestyle",
    type: "single",
    title: "What kind of setting do you want to live in?",
    options: [
      { value: "", label: "No preference" },
      { value: "urban", label: "Urban" },
      { value: "suburban", label: "Suburban" },
      { value: "rural", label: "Rural" },
    ],
  },
  {
    id: "costOfLiving",
    type: "single",
    title: "What's your target cost-of-living tier?",
    options: [
      { value: "", label: "No preference" },
      { value: "low", label: "Low ($)" },
      { value: "moderate", label: "Moderate ($$)" },
      { value: "high", label: "High ($$$)" },
    ],
  },
  {
    id: "priceMax",
    type: "single",
    title: "What's the most you'd want to spend on a home?",
    options: [
      { value: "", label: "No limit" },
      { value: "250", label: "Up to $250k" },
      { value: "350", label: "Up to $350k" },
      { value: "450", label: "Up to $450k" },
      { value: "600", label: "Up to $600k" },
    ],
  },
  {
    id: "activities",
    type: "multi",
    title: "Any activities you want nearby?",
    description: "Pick as many as you like.",
    options: [
      { value: "golf", label: "⛳ Golf" },
      { value: "fishing", label: "🎣 Fishing" },
      { value: "hiking", label: "🥾 Hiking" },
      { value: "culture", label: "🎭 Arts & Culture" },
    ],
  },
  {
    id: "vaImportance",
    type: "importance",
    title: "How important is easy access to VA care?",
  },
  {
    id: "safetyImportance",
    type: "importance",
    title: "How important is living in a low-crime area?",
  },
  {
    id: "lgbtqImportance",
    type: "importance",
    title: "How important is LGBTQ friendliness?",
  },
  {
    id: "gunRightsImportance",
    type: "importance",
    title: "How important are gun rights to you?",
    description: "Locations in states with more permissive gun laws will rank higher.",
  },
  {
    id: "affordabilityImportance",
    type: "importance",
    title: "How much should cost of living and home prices drive your ranking?",
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

/** Map importance answers onto normalized Fit-score weights. */
export function profileToWeights(profile: QuizProfile): PersonalizedWeights {
  const affordability = IMPORTANCE_WEIGHT[profile.affordabilityImportance];
  return {
    lgbtq: IMPORTANCE_WEIGHT[profile.lgbtqImportance],
    va: IMPORTANCE_WEIGHT[profile.vaImportance],
    safety: IMPORTANCE_WEIGHT[profile.safetyImportance],
    gunRights: IMPORTANCE_WEIGHT[profile.gunRightsImportance],
    costOfLiving: affordability,
    homeValue: affordability,
  };
}

export const QUIZ_COOKIE_NAME = "vr_quiz_profile";
const QUIZ_COOKIE_MAX_AGE = 60 * 60 * 24 * 180; // 180 days

export function encodeQuizProfile(profile: QuizProfile): string {
  return encodeURIComponent(JSON.stringify(profile));
}

export function decodeQuizProfile(raw: string | null | undefined): QuizProfile | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(raw));
    if (typeof parsed !== "object" || parsed === null) return null;
    return { ...DEFAULT_QUIZ_PROFILE, ...parsed };
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
