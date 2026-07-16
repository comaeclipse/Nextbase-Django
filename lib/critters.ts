/*
 * Critter density datasets for the /critters choropleth.
 *
 * Each critter is a `CritterDataset` with one 0–100 index value per state.
 * The combobox on the page selects among these. Add a new critter by pushing
 * another dataset onto CRITTER_DATASETS (real data → set `sourced: true` and
 * list `sources`; anything invented stays `sourced: false` so the UI labels it
 * a sample).
 */

export type BandName = "Very Low" | "Low" | "Moderate" | "High" | "Very High";

export type StateValue = {
  /** USPS two-letter abbreviation, e.g. "TX". Drives the map join. */
  state: string;
  /** Full state name (labels/tooltips). */
  name: string;
  /** Primary 0–100 index the map colors by. Higher = more critters. */
  value: number;
  /** 1 = worst (highest value). */
  rank: number;
  /** Qualitative risk band. */
  band: BandName;
};

export type CritterDataset = {
  id: string;
  /** Display name, e.g. "Mosquito". */
  critter: string;
  /** What the index measures, e.g. "Mosquito index". */
  metricLabel: string;
  /** Unit / scale note, e.g. "0–100 index". */
  unit: string;
  /** One-line description shown under the map title. */
  blurb: string;
  /** True for real, cited data; false marks a sample dataset in the UI. */
  sourced: boolean;
  sources?: string[];
  data: StateValue[];
};

/** Warm YlOrBr sequential ramp — shared by the map fills and the legend. */
export const CRITTER_RAMP = [
  "#fff7bc",
  "#fee391",
  "#fec44f",
  "#fe9929",
  "#ec7014",
  "#cc4c02",
  "#8c2d04",
] as const;

/** Risk bands, low→high, each pinned to a ramp stop for the distribution chart. */
export const BANDS: { name: BandName; color: string }[] = [
  { name: "Very Low", color: CRITTER_RAMP[1] },
  { name: "Low", color: CRITTER_RAMP[2] },
  { name: "Moderate", color: CRITTER_RAMP[3] },
  { name: "High", color: CRITTER_RAMP[5] },
  { name: "Very High", color: CRITTER_RAMP[6] },
];

const BAND_ORDER: BandName[] = BANDS.map((b) => b.name);

/** Map a 0–100 index to a band (matches the mosquito source's own banding). */
export function bandForValue(value: number): BandName {
  if (value >= 80) return "Very High";
  if (value >= 60) return "High";
  if (value >= 40) return "Moderate";
  if (value >= 20) return "Low";
  return "Very Low";
}

// ── Mosquito ────────────────────────────────────────────────────────────────
// Real data from data/us_state_mosquito_index.csv (index/rank/band verbatim).
// Sources: NOAA NCEI · Current Results · USGS · CDC · Climate Central.
const MOSQUITO_ROWS: [name: string, abbr: string, value: number, rank: number][] = [
  ["Alabama", "AL", 75, 5], ["Alaska", "AK", 25, 40], ["Arizona", "AZ", 20, 41],
  ["Arkansas", "AR", 54, 13], ["California", "CA", 27, 38], ["Colorado", "CO", 5, 46],
  ["Connecticut", "CT", 47, 24], ["Delaware", "DE", 64, 8], ["Florida", "FL", 100, 1],
  ["Georgia", "GA", 75, 4], ["Hawaii", "HI", 61, 9], ["Idaho", "ID", 0, 50],
  ["Illinois", "IL", 50, 19], ["Indiana", "IN", 51, 17], ["Iowa", "IA", 39, 33],
  ["Kansas", "KS", 37, 34], ["Kentucky", "KY", 45, 26], ["Louisiana", "LA", 84, 2],
  ["Maine", "ME", 50, 20], ["Maryland", "MD", 52, 15], ["Massachusetts", "MA", 56, 10],
  ["Michigan", "MI", 47, 25], ["Minnesota", "MN", 48, 22], ["Mississippi", "MS", 73, 6],
  ["Missouri", "MO", 43, 29], ["Montana", "MT", 7, 45], ["Nebraska", "NE", 31, 37],
  ["Nevada", "NV", 2, 48], ["New Hampshire", "NH", 50, 21], ["New Jersey", "NJ", 55, 12],
  ["New Mexico", "NM", 17, 42], ["New York", "NY", 43, 28], ["North Carolina", "NC", 73, 7],
  ["North Dakota", "ND", 26, 39], ["Ohio", "OH", 39, 32], ["Oklahoma", "OK", 41, 31],
  ["Oregon", "OR", 10, 44], ["Pennsylvania", "PA", 37, 35], ["Rhode Island", "RI", 56, 11],
  ["South Carolina", "SC", 76, 3], ["South Dakota", "SD", 33, 36], ["Tennessee", "TN", 47, 23],
  ["Texas", "TX", 50, 18], ["Utah", "UT", 4, 47], ["Vermont", "VT", 42, 30],
  ["Virginia", "VA", 54, 14], ["Washington", "WA", 15, 43], ["West Virginia", "WV", 45, 27],
  ["Wisconsin", "WI", 51, 16], ["Wyoming", "WY", 2, 49],
];

const MOSQUITO_DATA: StateValue[] = MOSQUITO_ROWS.map(([name, state, value, rank]) => ({
  name,
  state,
  value,
  rank,
  band: bandForValue(value),
}));

// -- Biting flies -------------------------------------------------------------
// Real data from data/us_state_biting_fly_index.csv (index/rank/band verbatim).
// Sources: Purdue Extension, NC State Extension, UF IFAS Extension,
// Colorado State Extension, NPS, NOAA NCEI, USDA FIA, USGS.
const BITING_FLY_ROWS: [
  name: string,
  abbr: string,
  value: number,
  rank: number,
  band: BandName,
][] = [
  ["Alabama", "AL", 96, 7, "Very High"],
  ["Alaska", "AK", 77, 21, "High"],
  ["Arizona", "AZ", 13, 49, "Very Low"],
  ["Arkansas", "AR", 67, 24, "High"],
  ["California", "CA", 42, 38, "Moderate"],
  ["Colorado", "CO", 29, 45, "Low"],
  ["Connecticut", "CT", 80, 18, "Very High"],
  ["Delaware", "DE", 80, 16, "Very High"],
  ["Florida", "FL", 98, 4, "Very High"],
  ["Georgia", "GA", 96, 6, "Very High"],
  ["Hawaii", "HI", 70, 22, "High"],
  ["Idaho", "ID", 32, 42, "Low"],
  ["Illinois", "IL", 51, 35, "Moderate"],
  ["Indiana", "IN", 53, 34, "Moderate"],
  ["Iowa", "IA", 45, 36, "Moderate"],
  ["Kansas", "KS", 32, 43, "Low"],
  ["Kentucky", "KY", 62, 29, "High"],
  ["Louisiana", "LA", 97, 5, "Very High"],
  ["Maine", "ME", 98, 3, "Very High"],
  ["Maryland", "MD", 77, 20, "High"],
  ["Massachusetts", "MA", 92, 9, "Very High"],
  ["Michigan", "MI", 81, 15, "Very High"],
  ["Minnesota", "MN", 77, 19, "High"],
  ["Mississippi", "MS", 95, 8, "Very High"],
  ["Missouri", "MO", 58, 31, "Moderate"],
  ["Montana", "MT", 35, 41, "Low"],
  ["Nebraska", "NE", 31, 44, "Low"],
  ["Nevada", "NV", 0, 50, "Very Low"],
  ["New Hampshire", "NH", 90, 10, "Very High"],
  ["New Jersey", "NJ", 80, 17, "Very High"],
  ["New Mexico", "NM", 15, 48, "Very Low"],
  ["New York", "NY", 81, 14, "Very High"],
  ["North Carolina", "NC", 100, 1, "Very High"],
  ["North Dakota", "ND", 41, 39, "Moderate"],
  ["Ohio", "OH", 54, 32, "Moderate"],
  ["Oklahoma", "OK", 37, 40, "Low"],
  ["Oregon", "OR", 54, 33, "Moderate"],
  ["Pennsylvania", "PA", 66, 26, "High"],
  ["Rhode Island", "RI", 89, 11, "Very High"],
  ["South Carolina", "SC", 98, 2, "Very High"],
  ["South Dakota", "SD", 44, 37, "Moderate"],
  ["Tennessee", "TN", 67, 25, "High"],
  ["Texas", "TX", 65, 27, "High"],
  ["Utah", "UT", 16, 47, "Very Low"],
  ["Vermont", "VT", 63, 28, "High"],
  ["Virginia", "VA", 83, 12, "Very High"],
  ["Washington", "WA", 58, 30, "Moderate"],
  ["West Virginia", "WV", 67, 23, "High"],
  ["Wisconsin", "WI", 82, 13, "Very High"],
  ["Wyoming", "WY", 22, 46, "Low"],
];

const BITING_FLY_DATA: StateValue[] = BITING_FLY_ROWS.map(
  ([name, state, value, rank, band]) => ({
    name,
    state,
    value,
    rank,
    band,
  })
);

export const CRITTER_DATASETS: CritterDataset[] = [
  {
    id: "mosquito",
    critter: "Mosquito",
    metricLabel: "Mosquito index",
    unit: "0–100 index",
    blurb:
      "Relative mosquito pressure by state, from climate, standing water, and surveillance signals. 100 = worst in the nation.",
    sourced: true,
    sources: [
      "NOAA National Centers for Environmental Information (NCEI)",
      "Current Results Weather and Science Facts",
      "U.S. Geological Survey (USGS)",
      "Centers for Disease Control and Prevention (CDC)",
      "Climate Central",
    ],
    data: MOSQUITO_DATA,
  },
  {
    id: "biting_flies",
    critter: "Biting Flies",
    metricLabel: "Biting-fly index",
    unit: "0–100 index",
    blurb:
      "Relative biting-fly pressure by state, combining black fly, deer and horse fly, no-see-um, climate, water, and forest-edge signals. 100 = worst in the nation.",
    sourced: true,
    sources: [
      "Purdue University Extension",
      "North Carolina State University Extension",
      "University of Florida IFAS Extension",
      "Colorado State University Extension",
      "National Park Service",
      "NOAA National Centers for Environmental Information",
      "USDA Forest Service — Forest Inventory and Analysis",
      "U.S. Geological Survey (USGS)",
    ],
    data: BITING_FLY_DATA,
  },
];

export function getDataset(id: string): CritterDataset {
  return CRITTER_DATASETS.find((d) => d.id === id) ?? CRITTER_DATASETS[0];
}

export type CritterAggregate = {
  /** Rank-1 (highest-value) state. */
  worst: StateValue;
  avg: number;
  /** States in the High or Very High band. */
  highCount: number;
  maxValue: number;
  /** All states sorted by value, descending. */
  ranked: StateValue[];
  /** State count per band, ordered low→high (for the distribution chart). */
  bandCounts: { band: BandName; count: number; color: string }[];
  modeBand: BandName;
};

/** Everything the page derives from a dataset. Pure — safe on the server. */
export function aggregate(data: StateValue[]): CritterAggregate {
  // Sort by authoritative rank (1 = worst); value alone leaves ties arbitrary.
  const ranked = [...data].sort((a, b) => a.rank - b.rank);
  const worst = ranked[0];
  const maxValue = worst?.value ?? 100;
  const avg = data.length
    ? Math.round(data.reduce((s, d) => s + d.value, 0) / data.length)
    : 0;
  const highCount = data.filter(
    (d) => d.band === "High" || d.band === "Very High"
  ).length;

  const counts = new Map<BandName, number>(BAND_ORDER.map((b) => [b, 0]));
  for (const d of data) counts.set(d.band, (counts.get(d.band) ?? 0) + 1);
  const bandCounts = BANDS.map((b) => ({
    band: b.name,
    count: counts.get(b.name) ?? 0,
    color: b.color,
  }));
  const modeBand = [...bandCounts].sort((a, b) => b.count - a.count)[0].band;

  return { worst, avg, highCount, maxValue, ranked, bandCounts, modeBand };
}
