import { aggregate, bandForValue, type StateValue } from "@/lib/critters";

export type StateGunFreedomValue = StateValue & {
  summary: string;
  legalStatus?: "Unsettled";
};

export type StateGunFreedomDataset = {
  label: string;
  metricLabel: string;
  unit: string;
  blurb: string;
  dataVintage: string;
  sources: { label: string; href: string }[];
  methodology: string;
  data: StateGunFreedomValue[];
};

const ROWS: [string, string, number, number, string, "Unsettled"?][] = [
  ["Idaho", "ID", 99, 1, "No statewide assault-weapon ban, no statewide magazine limit, permitless carry"],
  ["Mississippi", "MS", 99, 2, "No statewide assault-weapon ban, no statewide magazine limit, permitless carry"],
  ["South Dakota", "SD", 99, 3, "No statewide assault-weapon ban, no statewide magazine limit, permitless carry"],
  ["Arkansas", "AR", 98, 4, "No statewide assault-weapon ban, no statewide magazine limit, permitless carry"],
  ["Georgia", "GA", 98, 5, "No statewide assault-weapon ban, no statewide magazine limit, permitless carry"],
  ["Montana", "MT", 98, 6, "No statewide assault-weapon ban, no statewide magazine limit, permitless carry"],
  ["Wyoming", "WY", 98, 7, "No statewide assault-weapon ban, no statewide magazine limit, permitless carry"],
  ["Alaska", "AK", 97, 8, "No statewide assault-weapon ban, no statewide magazine limit, permitless carry"],
  ["Arizona", "AZ", 97, 9, "No statewide assault-weapon ban, no statewide magazine limit, permitless carry"],
  ["Kansas", "KS", 97, 10, "No statewide assault-weapon ban, no statewide magazine limit, permitless carry"],
  ["Kentucky", "KY", 97, 11, "No statewide assault-weapon ban, no statewide magazine limit, permitless carry"],
  ["Missouri", "MO", 97, 12, "No statewide assault-weapon ban, no statewide magazine limit, permitless carry"],
  ["New Hampshire", "NH", 97, 13, "No statewide assault-weapon ban, no statewide magazine limit, permitless carry"],
  ["Oklahoma", "OK", 97, 14, "No statewide assault-weapon ban, no statewide magazine limit, permitless carry"],
  ["Louisiana", "LA", 96, 15, "No statewide assault-weapon ban, no statewide magazine limit, permitless carry"],
  ["North Dakota", "ND", 96, 16, "No statewide assault-weapon ban, no statewide magazine limit, permitless carry"],
  ["Utah", "UT", 96, 17, "No statewide assault-weapon ban, no statewide magazine limit, permitless carry"],
  ["Iowa", "IA", 95, 18, "No statewide assault-weapon ban, no statewide magazine limit, permitless carry"],
  ["Ohio", "OH", 95, 19, "No statewide assault-weapon ban, no statewide magazine limit, permitless carry"],
  ["South Carolina", "SC", 95, 20, "No statewide assault-weapon ban, no statewide magazine limit, permitless carry"],
  ["Tennessee", "TN", 95, 21, "No statewide assault-weapon ban, no statewide magazine limit, permitless carry"],
  ["Texas", "TX", 95, 22, "No statewide assault-weapon ban, no statewide magazine limit, permitless carry"],
  ["Alabama", "AL", 94, 23, "No statewide assault-weapon ban, no statewide magazine limit, permitless carry"],
  ["Indiana", "IN", 94, 24, "No statewide assault-weapon ban, no statewide magazine limit, permitless carry"],
  ["West Virginia", "WV", 94, 25, "No statewide assault-weapon ban, no statewide magazine limit, permitless carry"],
  ["Nebraska", "NE", 92, 26, "No statewide assault-weapon ban, no statewide magazine limit, permitless carry"],
  ["Florida", "FL", 88, 27, "No statewide assault-weapon ban, no statewide magazine limit, permitless carry"],
  ["North Carolina", "NC", 86, 28, "No statewide assault-weapon ban, no statewide magazine limit, carry permit required"],
  ["Maine", "ME", 85, 29, "No statewide assault-weapon ban, no statewide magazine limit, permitless carry"],
  ["Wisconsin", "WI", 85, 30, "No statewide assault-weapon ban, no statewide magazine limit, carry permit required"],
  ["Michigan", "MI", 82, 31, "No statewide assault-weapon ban, no statewide magazine limit, carry permit required"],
  ["Nevada", "NV", 82, 32, "No statewide assault-weapon ban, no statewide magazine limit, carry permit required"],
  ["Pennsylvania", "PA", 81, 33, "No statewide assault-weapon ban, no statewide magazine limit, carry permit required"],
  ["New Mexico", "NM", 77, 34, "No statewide assault-weapon ban, no statewide magazine limit, carry permit required"],
  ["Minnesota", "MN", 73, 35, "No statewide assault-weapon ban, no statewide magazine limit, carry permit required"],
  ["Vermont", "VT", 65, 36, "No statewide assault-weapon ban, magazine-capacity restrictions, permitless carry"],
  ["Virginia", "VA", 58, 37, "Assault-weapon and magazine laws legally unsettled, carry permit required", "Unsettled"],
  ["Colorado", "CO", 51, 38, "No statewide assault-weapon ban, magazine-capacity restrictions, carry permit required"],
  ["Oregon", "OR", 47, 39, "No statewide assault-weapon ban, broad magazine-capacity restrictions, carry permit required"],
  ["New Jersey", "NJ", 42, 40, "Assault-weapon and magazine laws legally unsettled, carry permit required", "Unsettled"],
  ["Hawaii", "HI", 41, 41, "Partial assault-weapon restrictions, partial magazine restrictions, carry permit required"],
  ["Delaware", "DE", 23, 42, "Statewide assault-weapon ban, magazine-capacity restrictions, carry permit required"],
  ["Illinois", "IL", 15, 43, "Statewide assault-weapon ban, magazine-capacity restrictions, carry permit required"],
  ["Rhode Island", "RI", 12, 44, "Statewide assault-weapon ban, broad magazine-capacity restrictions, carry permit required"],
  ["Washington", "WA", 10, 45, "Statewide assault-weapon ban, broad magazine-capacity restrictions, carry permit required"],
  ["Connecticut", "CT", 9, 46, "Statewide assault-weapon ban, broad magazine-capacity restrictions, carry permit required"],
  ["Maryland", "MD", 8, 47, "Statewide assault-weapon ban, broad magazine-capacity restrictions, carry permit required"],
  ["Massachusetts", "MA", 8, 48, "Statewide assault-weapon ban, broad magazine-capacity restrictions, carry permit required"],
  ["New York", "NY", 8, 49, "Statewide assault-weapon ban, broad magazine-capacity restrictions, carry permit required"],
  ["California", "CA", 3, 50, "Statewide assault-weapon ban, broad magazine-capacity restrictions, carry permit required"],
];

export const STATE_GUN_FREEDOM_DATASET: StateGunFreedomDataset = {
  label: "Gun Freedom",
  metricLabel: "Gun Freedom Index",
  unit: "0–100 index",
  blurb: "Higher scores indicate fewer statewide restrictions under this provisional policy rubric.",
  dataVintage: "Provisional index — current through July 28, 2026",
  sources: [
    { label: "Everytown Research & Policy — State rankings", href: "https://everytownresearch.org/rankings/" },
    { label: "NRA-ILA — Virginia preliminary-injunction update", href: "https://www.nraila.org/articles/20260708/judge-rules-preliminary-injunction-against-virginia-assault-firearm-and-magazine-bans-secured-by-nra-applies-statewide" },
    { label: "Handgunlaw.us", href: "https://handgunlaw.us/" },
    { label: "USCCA — State gun-law guides", href: "https://www.usconcealedcarry.com/resources/ccw_reciprocity_map/" },
  ],
  methodology: "Scores run from 100 (least restrictive) to 0 (most restrictive). Hardware freedom accounts for 55 points: 30 for no statewide assault-weapon ban and 25 for no magazine-capacity restriction. The remaining 45 points cover purchase and ownership restrictions, private-transfer rules, licensing and registration, carry laws, and waiting periods. Everytown supplied the broad restriction baseline; NRA-ILA, Handgunlaw.us, and USCCA were used as counter-sources for ownership, equipment, and permitless-carry status. Virginia and New Jersey are legally unsettled and should be revisited as litigation progresses.",
  data: ROWS.map(([name, state, value, rank, summary, legalStatus]) => ({
    name, state, value, rank, summary, legalStatus, band: bandForValue(value),
    displayBand: value >= 80 ? "Higher freedom" : value >= 40 ? "Mixed restrictions" : "More restrictive",
  })),
};

export const GUN_FREEDOM_AGGREGATE = aggregate(STATE_GUN_FREEDOM_DATASET.data);

/** Abbr -> Gun Freedom Index, built once from the dataset above. */
const INDEX_BY_STATE: Map<string, number> = new Map(
  STATE_GUN_FREEDOM_DATASET.data.map((d) => [d.state, d.value])
);

/**
 * The 0-100 index for a USPS abbreviation, or null when the state isn't in the
 * dataset. Callers treat null as "unknown, keep it" rather than as a zero, so
 * a gap in the rubric never silently filters a place out.
 */
export function gunFreedomIndex(
  stateAbbr: string | null | undefined
): number | null {
  if (!stateAbbr) return null;
  return INDEX_BY_STATE.get(stateAbbr) ?? null;
}

/** States whose bans are enjoined or under active litigation (VA and NJ today). */
export const UNSETTLED_GUN_LAW_STATES: string[] = STATE_GUN_FREEDOM_DATASET.data
  .filter((d) => d.legalStatus === "Unsettled")
  .map((d) => d.state);
