/*
 * Full state name -> USPS abbreviation, ported from views.py STATE_NAME_TO_ABBR.
 * Used to join Location.state against StateInfo.state (two-letter code) for the
 * city detail page.
 */
export const STATE_NAME_TO_ABBR: Record<string, string> = {
  Alabama: "AL", Alaska: "AK", Arizona: "AZ", Arkansas: "AR",
  California: "CA", Colorado: "CO", Connecticut: "CT", Delaware: "DE",
  Florida: "FL", Georgia: "GA", Hawaii: "HI", Idaho: "ID",
  Illinois: "IL", Indiana: "IN", Iowa: "IA", Kansas: "KS",
  Kentucky: "KY", Louisiana: "LA", Maine: "ME", Maryland: "MD",
  Massachusetts: "MA", Michigan: "MI", Minnesota: "MN",
  Mississippi: "MS", Missouri: "MO", Montana: "MT", Nebraska: "NE",
  Nevada: "NV", "New Hampshire": "NH", "New Jersey": "NJ",
  "New Mexico": "NM", "New York": "NY", "North Carolina": "NC",
  "North Dakota": "ND", Ohio: "OH", Oklahoma: "OK", Oregon: "OR",
  Pennsylvania: "PA", "Rhode Island": "RI", "South Carolina": "SC",
  "South Dakota": "SD", Tennessee: "TN", Texas: "TX", Utah: "UT",
  Vermont: "VT", Virginia: "VA", Washington: "WA",
  "West Virginia": "WV", Wisconsin: "WI", Wyoming: "WY",
};

const VALID_ABBRS = new Set(Object.values(STATE_NAME_TO_ABBR));

/**
 * Resolve a Location.state value to a USPS abbreviation.
 *
 * Django's view only maps full names (STATE_NAME_TO_ABBR.get), so rows that
 * already store a two-letter code resolve to None there and the firearm-law
 * panel does NOT render. Per MIGRATION_PLAN.md we additionally tolerate rows
 * that already store two-letter codes, so the panel renders for those rows.
 *
 * Product decision (2026-07-07): tolerate two-letter codes so the firearm-law
 * panel renders on every city (the dataset stores 2-letter codes, which Django's
 * full-name-only lookup missed). This intentionally shows more than the old
 * Django city page did.
 */
const TOLERATE_TWO_LETTER_CODES = true;

export function resolveStateAbbr(state: string | null | undefined): string | null {
  if (!state) return null;
  const mapped = STATE_NAME_TO_ABBR[state];
  if (mapped) return mapped;
  if (TOLERATE_TWO_LETTER_CODES) {
    const upper = state.trim().toUpperCase();
    if (VALID_ABBRS.has(upper)) return upper;
  }
  return null;
}
