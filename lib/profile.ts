/*
 * Saved site preferences for /profile.
 *
 * Every preference here is a HARD FILTER: a state that fails one is removed
 * from results, not merely ranked lower. That is the whole point — these are
 * dealbreakers ("I will not move to a state with an assault weapon ban"), not
 * priorities.
 *
 * Relationship to the Fit score: preferences do NOT change a city's Fit number.
 * `calculateBaselineScore` stays the fixed editorial 5-factor score. What they
 * change is *which* cities get ranked at all, so the Fit leaderboard is drawn
 * only from places the visitor would actually consider. The soft-weight path
 * (`calculatePersonalizedScore` + `PersonalizedWeights` in lib/scoring.ts) is
 * deliberately untouched and still belongs to /quiz2.
 *
 * Persistence mirrors lib/quiz.ts: a versioned cookie, decodable on the server
 * so the first paint is already personalized. Older cookie shapes are ignored
 * rather than migrated.
 */
import type { FilterParams } from "./filters";
import type { StateInfoRow } from "./types";
import { gunFreedomIndex, UNSETTLED_GUN_LAW_STATES } from "./state-gun-freedom";
import { BRANCH_LABELS, type MilitaryBranch } from "./career-transition-shared";

export { gunFreedomIndex, UNSETTLED_GUN_LAW_STATES };

const PROFILE_VERSION = 2;

export interface SitePreferences {
  version: typeof PROFILE_VERSION;
  /** Exclude states with a statewide assault-weapon ban. */
  noAssaultWeaponsBan: boolean;
  /** Exclude states with a high-capacity magazine ban. */
  noHighCapMagBan: boolean;
  /** Minimum Gun Freedom Index, 0-100. GUN_FREEDOM_ANY (0) = no minimum. */
  gunFreedomMin: number;
  /** Keep only states with no state income tax. */
  noStateIncomeTax: boolean;
  /** Keep only states that don't tax military retired pay. */
  retiredPayUntaxed: boolean;
  /** Keep only cities scoring at/above LGBTQ_FRIENDLY_THRESHOLD. */
  lgbtqFriendlyOnly: boolean;
  /**
   * Identity, not a filter: the 6-branch career-transition enum
   * (lib/career-transition-shared.ts), NOT lib/military.ts's 4-branch
   * SERVICE_BRANCH_SLUGS / the /explore `base_branch` "near an installation"
   * filter. "" = not set. Never feeds preferencesToFilterParams.
   */
  militaryBranch: MilitaryBranch | "";
  /**
   * Raw MOS/NEC/AFSC/rating code as typed, uppercased/trimmed on decode.
   * Not validated against the career-transition catalog here — decode has
   * no DB access. That resolution happens in app/profile/page.tsx against
   * the freshly-loaded catalog.
   */
  militarySpecialtyCode: string;
}

/** Slider floor meaning "no minimum" rather than "index must be >= 0". */
export const GUN_FREEDOM_ANY = 0;
export const GUN_FREEDOM_STEP = 5;

/** Longest real-world MOS/NEC/AFSC/rating code is well under this. */
export const MILITARY_SPECIALTY_CODE_MAX_LEN = 16;
const MILITARY_BRANCH_VALUES = new Set(Object.keys(BRANCH_LABELS));

/**
 * The score `lgbtq_friendly=true` already gates on in lib/filters.ts. Named
 * here so the UI can state the actual number instead of saying "friendly".
 */
export const LGBTQ_FRIENDLY_THRESHOLD = 70;

export const DEFAULT_PREFERENCES: SitePreferences = {
  version: PROFILE_VERSION,
  noAssaultWeaponsBan: false,
  noHighCapMagBan: false,
  gunFreedomMin: GUN_FREEDOM_ANY,
  noStateIncomeTax: false,
  retiredPayUntaxed: false,
  lgbtqFriendlyOnly: false,
  militaryBranch: "",
  militarySpecialtyCode: "",
};

/** Boolean preference keys — everything except `version` and the slider. */
export type BooleanPreferenceKey = Exclude<
  {
    [K in keyof SitePreferences]: SitePreferences[K] extends boolean ? K : never;
  }[keyof SitePreferences],
  undefined
>;

export type PreferenceGroup = "firearms" | "taxes" | "community";

export interface PreferenceFacet {
  key: BooleanPreferenceKey;
  group: PreferenceGroup;
  label: string;
  hint: string;
  /** Rendered as a smaller honesty note under the toggle. */
  caveat?: string;
}

/**
 * The single source of truth for the boolean facets: drives both the form and
 * `describePreferences`. Adding a facet later is one entry here plus one line
 * in `preferencesToFilterParams`.
 */
export const PREFERENCE_FACETS: PreferenceFacet[] = [
  {
    key: "noAssaultWeaponsBan",
    group: "firearms",
    label: "No statewide assault weapon ban",
    hint: "Removes states that ban the sale or possession of so-called assault weapons.",
    caveat:
      "Based on the states we've recorded a ban for. A state we have no record for is kept, not hidden.",
  },
  {
    key: "noHighCapMagBan",
    group: "firearms",
    label: "No high-capacity magazine ban",
    hint: "Removes states with a statewide magazine-capacity limit.",
  },
  {
    key: "noStateIncomeTax",
    group: "taxes",
    label: "No state income tax",
    hint: "Keeps only states with no personal income tax at all.",
    caveat: "Matches only states we've verified against a primary source.",
  },
  {
    key: "retiredPayUntaxed",
    group: "taxes",
    label: "Military retired pay not taxed",
    hint: "Keeps states with no income tax, or that fully exempt military retired pay.",
    caveat:
      "Partial and conditional exemptions are excluded — they'd mislead a retiree who doesn't meet the gate.",
  },
  {
    key: "lgbtqFriendlyOnly",
    group: "community",
    label: `Only LGBTQ-friendly places (${LGBTQ_FRIENDLY_THRESHOLD}+)`,
    hint: `Keeps cities scoring ${LGBTQ_FRIENDLY_THRESHOLD} or higher on our LGBTQ friendliness rating.`,
    caveat: "This one is scored per city, not per state.",
  },
];

export const PREFERENCE_GROUPS: {
  id: PreferenceGroup;
  title: string;
  description: string;
}[] = [
  {
    id: "firearms",
    title: "Firearm laws",
    description: "Rule out states whose gun laws you won't live under.",
  },
  {
    id: "taxes",
    title: "Taxes",
    description: "State-level tax treatment, verified against primary sources.",
  },
  {
    id: "community",
    title: "Community",
    description: "How welcoming a place is likely to feel day to day.",
  },
];

/**
 * Translate saved preferences into the shared FilterParams shape, so /explore,
 * /api/locations and the live preview on /profile all run the exact same
 * `filterAndSort` code path. Modeled on lib/quiz2.ts `profileToFilterParams`.
 *
 * Defaults must produce an all-null result — an untouched profile is a no-op.
 */
export function preferencesToFilterParams(p: SitePreferences): FilterParams {
  return {
    no_awb: p.noAssaultWeaponsBan ? "true" : null,
    no_hcm: p.noHighCapMagBan ? "true" : null,
    gun_freedom_min:
      p.gunFreedomMin > GUN_FREEDOM_ANY ? String(p.gunFreedomMin) : null,
    no_income_tax: p.noStateIncomeTax ? "true" : null,
    // "Not taxed" = no income tax at all OR retired pay explicitly exempt.
    // `partial`/`conditional` are deliberately excluded (issue #6), matching
    // the same choice ExploreClient makes for its own toggle.
    retired_pay_tax: p.retiredPayUntaxed ? "no_income_tax,exempt" : null,
    lgbtq_friendly: p.lgbtqFriendlyOnly ? "true" : null,
  };
}

/** True when nothing is set — used to skip the "profile is filtering" notice. */
export function hasActivePreferences(p: SitePreferences): boolean {
  const params = preferencesToFilterParams(p);
  return Object.values(params).some((v) => v != null);
}

/**
 * Merge saved preferences into a set of session filters as a FLOOR: a saved
 * dealbreaker can never be widened by the filter bar, only narrowed further.
 * For the comma-separated `retired_pay_tax` facet that means intersecting the
 * two value sets rather than letting either side win outright.
 */
export function applyPreferenceFloor(
  params: FilterParams,
  p: SitePreferences
): FilterParams {
  const floor = preferencesToFilterParams(p);
  const merged: FilterParams = { ...params };

  for (const key of ["no_awb", "no_hcm", "no_income_tax", "lgbtq_friendly"] as const) {
    if (floor[key] === "true") merged[key] = "true";
  }

  if (floor.gun_freedom_min) {
    const existing = Number(merged.gun_freedom_min);
    const floorValue = Number(floor.gun_freedom_min);
    merged.gun_freedom_min = String(
      Number.isFinite(existing) ? Math.max(existing, floorValue) : floorValue
    );
  }

  if (floor.retired_pay_tax) {
    const allowed = new Set(floor.retired_pay_tax.split(","));
    const existing = merged.retired_pay_tax?.split(",").filter(Boolean);
    merged.retired_pay_tax = existing?.length
      ? existing.filter((v) => allowed.has(v)).join(",")
      : floor.retired_pay_tax;
  }

  return merged;
}

/** Plain-language chips describing the active constraints. */
export function describePreferences(p: SitePreferences): string[] {
  const out: string[] = [];
  for (const facet of PREFERENCE_FACETS) {
    if (p[facet.key]) out.push(facet.label);
  }
  if (p.gunFreedomMin > GUN_FREEDOM_ANY) {
    out.push(`Gun Freedom Index ${p.gunFreedomMin}+`);
  }
  if (p.militaryBranch) {
    out.push(
      p.militarySpecialtyCode
        ? `${BRANCH_LABELS[p.militaryBranch]} · ${p.militarySpecialtyCode}`
        : BRANCH_LABELS[p.militaryBranch]
    );
  }
  return out;
}

/**
 * Why a given state fails the saved preferences, in plain language. Empty means
 * it passes. Used by the city page to explain an incompatible city rather than
 * silently hiding it — arriving at a city detail page directly should tell you
 * it's ruled out, not pretend everything is fine.
 *
 * The three-valued columns are matched with `=== true` only: a NULL means our
 * source was silent, not that the state lacks the law, so we never claim a ban
 * we haven't recorded (issue #6).
 */
export function blockedByPreferences(
  p: SitePreferences,
  stateInfo: StateInfoRow | null | undefined,
  stateAbbr: string | null | undefined
): string[] {
  const reasons: string[] = [];

  if (p.noAssaultWeaponsBan && stateInfo?.assault_weapons_ban === true) {
    reasons.push("This state has a statewide assault weapon ban.");
  }
  if (p.noHighCapMagBan && stateInfo?.high_cap_mag_ban === true) {
    reasons.push("This state limits magazine capacity.");
  }

  if (p.gunFreedomMin > GUN_FREEDOM_ANY) {
    const index = gunFreedomIndex(stateAbbr);
    if (index !== null && index < p.gunFreedomMin) {
      reasons.push(
        `Gun Freedom Index is ${index}, below your ${p.gunFreedomMin} minimum.`
      );
    }
  }

  const verified = stateInfo?.vet_benefits_verified_on != null;
  if (p.noStateIncomeTax && !(verified && stateInfo?.no_income_tax === true)) {
    reasons.push("This state isn't on our verified no-income-tax list.");
  }
  if (
    p.retiredPayUntaxed &&
    !(
      verified &&
      (stateInfo?.retired_pay_tax === "no_income_tax" ||
        stateInfo?.retired_pay_tax === "exempt")
    )
  ) {
    reasons.push("Military retired pay isn't fully untaxed here.");
  }

  return reasons;
}

export const PROFILE_COOKIE_NAME = "vr_profile_v1";
const PROFILE_COOKIE_MAX_AGE = 60 * 60 * 24 * 180; // 180 days

export function encodePreferences(p: SitePreferences): string {
  return encodeURIComponent(JSON.stringify(p));
}

/**
 * Parse a cookie value. Returns null for anything we don't recognize — a
 * version bump discards the old profile rather than guessing a migration.
 */
export function decodePreferences(
  raw: string | null | undefined
): SitePreferences | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(raw));
    if (typeof parsed !== "object" || parsed === null) return null;
    if (parsed.version !== PROFILE_VERSION) return null;

    const out: SitePreferences = { ...DEFAULT_PREFERENCES };
    for (const facet of PREFERENCE_FACETS) {
      if (typeof parsed[facet.key] === "boolean") {
        out[facet.key] = parsed[facet.key];
      }
    }
    const min = parsed.gunFreedomMin;
    if (typeof min === "number" && Number.isFinite(min)) {
      out.gunFreedomMin = Math.max(0, Math.min(100, Math.round(min)));
    }

    if (
      typeof parsed.militaryBranch === "string" &&
      MILITARY_BRANCH_VALUES.has(parsed.militaryBranch)
    ) {
      out.militaryBranch = parsed.militaryBranch as MilitaryBranch;
    }
    if (typeof parsed.militarySpecialtyCode === "string") {
      out.militarySpecialtyCode = parsed.militarySpecialtyCode
        .trim()
        .toUpperCase()
        .slice(0, MILITARY_SPECIALTY_CODE_MAX_LEN);
    }
    // A code with no branch is meaningless — never carry a stale one forward.
    if (!out.militaryBranch) out.militarySpecialtyCode = "";

    return out;
  } catch {
    return null;
  }
}

export function setPreferencesCookie(p: SitePreferences): void {
  if (typeof document === "undefined") return;
  document.cookie = `${PROFILE_COOKIE_NAME}=${encodePreferences(p)}; path=/; max-age=${PROFILE_COOKIE_MAX_AGE}; samesite=lax`;
}

export function clearPreferencesCookie(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${PROFILE_COOKIE_NAME}=; path=/; max-age=0`;
}

export function readPreferencesCookieClient(): SitePreferences | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${PROFILE_COOKIE_NAME}=([^;]*)`)
  );
  return match ? decodePreferences(match[1]) : null;
}
