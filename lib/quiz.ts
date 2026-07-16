/*
 * Flash-card quiz for /quiz. Each answer is a hard constraint that can rule
 * locations in or out (via filterByQuizProfile). Soft Fit-score weighting is
 * intentionally not used here — the product pitch is decisive dealbreakers.
 *
 * FLASH_QUESTIONS is ordered highest-signal first: identity/values cards with
 * a sharp, evenly-split agree/disagree distribution (climate, gun laws,
 * marriage equality) come before the audience-specific dealbreaker
 * (VA/military access), which comes before softer lifestyle/preference cards
 * that skew toward "doesn't matter" (income tax, lakes). Front-loading the
 * biggest filters means an abandoned quiz still captured the most useful
 * signal, and it reads as a funnel narrowing from big-rock questions to
 * fine-tuning details.
 *
 * Some cards are dead ends given an earlier answer — e.g. once someone says
 * they need all four seasons, "I cannot tolerate any snow" and "I prefer dry
 * desert over humidity" can only ever produce zero matches, since our
 * climate_category buckets (cold_snowy / hot_dry / hot_humid / mild_coastal)
 * are mutually exclusive. Each FlashQuestion can declare `isRelevant` to skip
 * itself when an earlier answer has already made it moot or contradictory.
 * Dependencies only ever look at *earlier* questions in FLASH_QUESTIONS.
 *
 * Profile is persisted in a cookie so a visitor can resume or retake without a
 * server session. Cookie name is versioned; older wizard-shaped cookies are
 * ignored rather than migrated.
 */
import type { Location, LocationRow, StateInfoRow } from "./types";
import {
  calculateBaselineScore,
  parseLgbtqScore,
  parseNumber,
} from "./scoring";

export type Stance = "agree" | "disagree" | "neutral";

export type FlashQuestionId =
  | "transit"
  | "four_seasons"
  | "no_snow"
  | "dry_desert"
  | "nightlife"
  | "va_military"
  | "gun_control"
  | "same_sex_marriage"
  | "no_income_tax"
  | "lakes";

type AnswerMap = Record<FlashQuestionId, Stance | null>;

export interface FlashQuestion {
  id: FlashQuestionId;
  statement: string;
  /** Short note shown under the statement (optional). */
  hint?: string;
  /**
   * Returns false when an earlier answer already makes this card a dead end
   * (guaranteed contradiction) or redundant. Omit for cards with no
   * dependencies. Only ever inspects earlier answers — never itself or a
   * later question — since cards are walked in FLASH_QUESTIONS order.
   */
  isRelevant?: (answers: AnswerMap) => boolean;
}

const QUIZ_VERSION = 4;

export interface QuizProfile {
  version: typeof QUIZ_VERSION;
  answers: AnswerMap;
}

export const FLASH_QUESTIONS: FlashQuestion[] = [
  // -- Identity / values: sharpest agree-disagree splits, biggest filters --
  {
    id: "four_seasons",
    statement: "I need all four seasons",
    hint: "Distinct winters with real cold or snow — not mild year-round weather.",
  },
  {
    id: "no_snow",
    statement: "I cannot tolerate any snow",
    hint: "Agree keeps only places with zero annual snowfall.",
    // Wanting all four seasons already means wanting real winter snow, so
    // asking this next would only ever produce a contradiction.
    isRelevant: (answers) => answers.four_seasons !== "agree",
  },
  {
    id: "dry_desert",
    statement: "I prefer dry desert over humidity",
    hint: "Agree keeps hot/dry climates; disagree keeps hot/humid ones.",
    // Both dry-desert and humid climates are mutually exclusive with the
    // cold/snowy climate a "four seasons" answer already locked in.
    isRelevant: (answers) => answers.four_seasons !== "agree",
  },
  {
    id: "same_sex_marriage",
    statement: "Same-sex marriage rights are a must for me",
    hint: "Agree keeps places with strong LGBTQ friendliness scores.",
  },
  {
    id: "gun_control",
    statement: "I support common sense gun control",
    hint: "Agree keeps states with assault-weapon or high-capacity magazine bans.",
  },
  // -- Audience-specific dealbreaker --
  {
    id: "va_military",
    statement: "I'd like to be near a VA or military base",
    hint: "Local VA facility or a defense / military hub.",
  },
  // -- Lifestyle: real variance, less identity-charged --
  {
    id: "transit",
    statement: "Access to public transportation is very important",
    hint: "We treat walkable urban cores as the best transit proxy in our data.",
  },
  {
    id: "nightlife",
    statement: "I need an active nightlife scene",
  },
  // -- Softer preferences: skew toward "doesn't matter" --
  {
    id: "no_income_tax",
    statement: "No income tax is important to me",
  },
  {
    id: "lakes",
    statement: "I want to be near lakes",
  },
];

const QUESTION_IDS = FLASH_QUESTIONS.map((q) => q.id);

function emptyAnswers(): AnswerMap {
  return Object.fromEntries(QUESTION_IDS.map((id) => [id, null])) as AnswerMap;
}

export const DEFAULT_QUIZ_PROFILE: QuizProfile = {
  version: QUIZ_VERSION,
  answers: emptyAnswers(),
};

/** Whether `q` is still askable given the answers gathered so far. */
export function isQuestionRelevant(
  q: FlashQuestion,
  answers: AnswerMap
): boolean {
  return q.isRelevant ? q.isRelevant(answers) : true;
}

/** The subset of FLASH_QUESTIONS that aren't dead ends given `answers`. */
export function getVisibleQuestions(answers: AnswerMap): FlashQuestion[] {
  return FLASH_QUESTIONS.filter((q) => isQuestionRelevant(q, answers));
}

/**
 * Null out any answer whose question is no longer relevant (e.g. the visitor
 * went back and changed an earlier answer). Keeps filterByQuizProfile from
 * ever combining two answers that are guaranteed to zero out the results.
 */
export function sanitizeQuizProfile(profile: QuizProfile): QuizProfile {
  const visible = new Set(getVisibleQuestions(profile.answers).map((q) => q.id));
  const answers = emptyAnswers();
  for (const id of QUESTION_IDS) {
    answers[id] = visible.has(id) ? profile.answers[id] : null;
  }
  return { version: QUIZ_VERSION, answers };
}

/** First still-relevant question with no answer yet, or null if complete. */
export function firstUnansweredQuestionId(
  profile: QuizProfile
): FlashQuestionId | null {
  const visible = getVisibleQuestions(profile.answers);
  const next = visible.find((q) => profile.answers[q.id] == null);
  return next ? next.id : null;
}

function nearVaOrMilitary(loc: LocationRow): boolean {
  return Boolean(loc.has_va) || Boolean(loc.defense_hub);
}

function hasCommonSenseGunControl(stateInfo: StateInfoRow | null | undefined): boolean {
  return (
    stateInfo?.assault_weapons_ban === true ||
    stateInfo?.high_cap_mag_ban === true
  );
}

/** Whether a location survives one flash-card stance. Neutral never filters. */
export function matchesFlashStance(
  loc: LocationRow,
  id: FlashQuestionId,
  stance: Stance,
  stateInfo?: StateInfoRow | null
): boolean {
  if (stance === "neutral") return true;

  switch (id) {
    case "transit": {
      // No dedicated transit metric yet — urban pace is the closest proxy.
      if (stance === "agree") return loc.pace_category === "urban";
      return loc.pace_category != null && loc.pace_category !== "urban";
    }
    case "four_seasons": {
      if (stance === "agree") return loc.climate_category === "cold_snowy";
      return (
        loc.climate_category != null && loc.climate_category !== "cold_snowy"
      );
    }
    case "no_snow": {
      if (stance === "agree") {
        return loc.snow_annual === 0 || loc.snow_annual == null;
      }
      return loc.snow_annual != null && loc.snow_annual > 0;
    }
    case "nightlife": {
      const hasNightlife = loc.vibes?.includes("nightlife") ?? false;
      return stance === "agree" ? hasNightlife : !hasNightlife;
    }
    case "va_military": {
      const near = nearVaOrMilitary(loc);
      return stance === "agree" ? near : !near;
    }
    case "gun_control": {
      const controlled = hasCommonSenseGunControl(stateInfo);
      return stance === "agree" ? controlled : !controlled;
    }
    case "same_sex_marriage": {
      // Marriage is federally protected; local LGBTQ friendliness is the
      // practical signal for whether a place feels affirming day to day.
      const score = parseLgbtqScore(loc);
      if (score === null) return false;
      return stance === "agree" ? score >= 70 : score < 50;
    }
    case "no_income_tax": {
      const rate = parseNumber(loc.income_tax);
      if (rate === null) return false;
      return stance === "agree" ? rate === 0 : rate > 0;
    }
    case "lakes": {
      const near = loc.near_lake === true;
      return stance === "agree" ? near : !near;
    }
    case "dry_desert": {
      if (stance === "agree") return loc.climate_category === "hot_dry";
      return loc.climate_category === "hot_humid";
    }
    default:
      return true;
  }
}

/** Apply every answered flash card as a hard AND filter, then baseline-rank. */
export function filterByQuizProfile(
  all: LocationRow[],
  stateInfos: StateInfoRow[],
  profile: QuizProfile
): Location[] {
  const stateByAbbr: Record<string, StateInfoRow> = {};
  for (const s of stateInfos) stateByAbbr[s.state] = s;

  // Ignore any answer whose question isn't relevant given the rest of the
  // profile — defends against stale answers (e.g. a visitor went back and
  // changed an earlier answer) ever compounding into a guaranteed-empty
  // combination of constraints.
  const visible = new Set(getVisibleQuestions(profile.answers).map((q) => q.id));
  const constraints = QUESTION_IDS.filter((id) => {
    if (!visible.has(id)) return false;
    const stance = profile.answers[id];
    return stance === "agree" || stance === "disagree";
  });

  const filtered = all.filter((loc) =>
    constraints.every((id) =>
      matchesFlashStance(
        loc,
        id,
        profile.answers[id] as Stance,
        stateByAbbr[loc.state]
      )
    )
  );

  const scored: Location[] = filtered.map((loc) => ({
    ...loc,
    calculated_match_score: calculateBaselineScore(loc),
  }));

  scored.sort(
    (a, b) =>
      b.calculated_match_score - a.calculated_match_score ||
      (a.name < b.name ? -1 : a.name > b.name ? 1 : 0)
  );
  return scored;
}

/** Plain-language tags summarizing hard constraints for the results screen. */
export function summarizeQuizConstraints(profile: QuizProfile): string[] {
  const labels: Partial<
    Record<FlashQuestionId, { agree: string; disagree: string }>
  > = {
    transit: {
      agree: "Needs transit-friendly urban areas",
      disagree: "Avoids urban cores",
    },
    four_seasons: {
      agree: "Requires four seasons",
      disagree: "Skips four-season climates",
    },
    no_snow: {
      agree: "Zero snow only",
      disagree: "Needs some snowfall",
    },
    nightlife: {
      agree: "Needs nightlife",
      disagree: "Skips nightlife cities",
    },
    va_military: {
      agree: "Near VA or military hub",
      disagree: "Away from VA / military hubs",
    },
    no_income_tax: {
      agree: "No state income tax",
      disagree: "States with income tax",
    },
    gun_control: {
      agree: "States with stronger gun laws",
      disagree: "States without AWB / mag bans",
    },
    same_sex_marriage: {
      agree: "LGBTQ-affirming communities",
      disagree: "Lower LGBTQ friendliness",
    },
    lakes: { agree: "Near lakes", disagree: "Not near lakes" },
    dry_desert: {
      agree: "Hot / dry climate",
      disagree: "Hot / humid climate",
    },
  };

  const visible = new Set(getVisibleQuestions(profile.answers).map((q) => q.id));
  const out: string[] = [];
  for (const q of FLASH_QUESTIONS) {
    if (!visible.has(q.id)) continue;
    const stance = profile.answers[q.id];
    if (stance !== "agree" && stance !== "disagree") continue;
    const pair = labels[q.id];
    if (pair) out.push(pair[stance]);
  }
  return out;
}

export const QUIZ_COOKIE_NAME = "vr_quiz_flash_v4";
const QUIZ_COOKIE_MAX_AGE = 60 * 60 * 24 * 180; // 180 days

export function encodeQuizProfile(profile: QuizProfile): string {
  return encodeURIComponent(JSON.stringify(profile));
}

export function decodeQuizProfile(
  raw: string | null | undefined
): QuizProfile | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(raw));
    if (typeof parsed !== "object" || parsed === null) return null;
    if (parsed.version !== QUIZ_VERSION || typeof parsed.answers !== "object") {
      return null;
    }

    const answers = emptyAnswers();
    for (const id of QUESTION_IDS) {
      const value = parsed.answers[id];
      if (value === "agree" || value === "disagree" || value === "neutral") {
        answers[id] = value;
      }
    }
    return sanitizeQuizProfile({ version: QUIZ_VERSION, answers });
  } catch {
    return null;
  }
}

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

/** True once every still-relevant question (skipped ones don't count) has an answer. */
export function isQuizComplete(profile: QuizProfile): boolean {
  return firstUnansweredQuestionId(profile) === null;
}
