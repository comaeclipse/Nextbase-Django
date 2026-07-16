import type { BandName } from "@/lib/critters";

export type StateWeatherIndexSlug = "uv";

export type StateWeatherIndexValue = {
  state: string;
  name: string;
  value: number;
  rank: number;
  band: BandName;
  annualMeanSolarNoonUvi: number;
  peakMonthlyMeanUvi: number;
  peakMonth: string;
};

export type StateWeatherIndexDataset = {
  slug: StateWeatherIndexSlug;
  label: string;
  metricLabel: string;
  unit: string;
  blurb: string;
  dataVintage: string;
  sources: string[];
  methodology: string;
  data: StateWeatherIndexValue[];
};

export const UV_SOURCES = [
  "NASA Earth Observations — UV Index Climatology",
  "NASA Aura Ozone Monitoring Instrument (OMI)",
  "NASA Earthdata / GES DISC",
  "U.S. Environmental Protection Agency — Monthly Average UV Index",
  "NOAA Climate Prediction Center — Long-Term Monthly Mean UV Index",
];

export const UV_METHODOLOGY =
  "The state calculations were based primarily on the NASA NEO monthly floating-point GeoTIFF climatology, with EPA and NOAA used as independent comparison sources.";

const UV_ROWS: [
  name: string,
  abbr: string,
  value: number,
  rank: number,
  band: BandName,
  annualMeanSolarNoonUvi: number,
  peakMonthlyMeanUvi: number,
  peakMonth: string,
][] = [
  ["Alabama", "AL", 64, 11, "High", 7.699, 11.304, "Jul"],
  ["Alaska", "AK", 0, 50, "Very Low", 2.48, 5.527, "Jun"],
  ["Arizona", "AZ", 76, 4, "High", 8.669, 12.715, "Jul"],
  ["Arkansas", "AR", 58, 16, "Moderate", 7.197, 11.063, "Jul"],
  ["California", "CA", 62, 13, "High", 7.461, 11.512, "Jul"],
  ["Colorado", "CO", 70, 6, "High", 8.142, 12.501, "Jul"],
  ["Connecticut", "CT", 38, 38, "Low", 5.536, 9.59, "Jul"],
  ["Delaware", "DE", 43, 30, "Moderate", 5.999, 10.009, "Jul"],
  ["Florida", "FL", 77, 3, "High", 8.716, 11.901, "Jul"],
  ["Georgia", "GA", 65, 10, "High", 7.713, 11.299, "Jul"],
  ["Hawaii", "HI", 100, 1, "Very High", 10.575, 13.127, "Aug"],
  ["Idaho", "ID", 52, 21, "Moderate", 6.685, 10.89, "Jul"],
  ["Illinois", "IL", 43, 31, "Moderate", 5.988, 10.132, "Jul"],
  ["Indiana", "IN", 44, 29, "Moderate", 6.058, 10.164, "Jul"],
  ["Iowa", "IA", 40, 35, "Moderate", 5.728, 9.981, "Jul"],
  ["Kansas", "KS", 53, 20, "Moderate", 6.79, 11.036, "Jul"],
  ["Kentucky", "KY", 51, 22, "Moderate", 6.618, 10.613, "Jul"],
  ["Louisiana", "LA", 70, 7, "High", 8.113, 11.605, "Jul"],
  ["Maine", "ME", 29, 49, "Low", 4.834, 8.822, "Jul"],
  ["Maryland", "MD", 45, 28, "Moderate", 6.087, 10.105, "Jul"],
  ["Massachusetts", "MA", 36, 41, "Low", 5.388, 9.431, "Jul"],
  ["Michigan", "MI", 31, 46, "Low", 4.991, 9.073, "Jul"],
  ["Minnesota", "MN", 30, 47, "Low", 4.902, 9.033, "Jul"],
  ["Mississippi", "MS", 64, 12, "High", 7.659, 11.291, "Jul"],
  ["Missouri", "MO", 49, 25, "Moderate", 6.459, 10.586, "Jul"],
  ["Montana", "MT", 39, 36, "Low", 5.653, 9.805, "Jul"],
  ["Nebraska", "NE", 47, 26, "Moderate", 6.31, 10.663, "Jul"],
  ["Nevada", "NV", 65, 9, "High", 7.731, 11.947, "Jul"],
  ["New Hampshire", "NH", 34, 42, "Low", 5.231, 9.27, "Jul"],
  ["New Jersey", "NJ", 41, 34, "Moderate", 5.799, 9.841, "Jul"],
  ["New Mexico", "NM", 80, 2, "Very High", 8.967, 13.027, "Jul"],
  ["New York", "NY", 36, 40, "Low", 5.406, 9.468, "Jul"],
  ["North Carolina", "NC", 56, 19, "Moderate", 6.989, 10.807, "Jul"],
  ["North Dakota", "ND", 30, 48, "Low", 4.887, 9.029, "Jul"],
  ["Ohio", "OH", 43, 32, "Moderate", 5.969, 10.067, "Jul"],
  ["Oklahoma", "OK", 60, 15, "High", 7.305, 11.331, "Jul"],
  ["Oregon", "OR", 45, 27, "Moderate", 6.1, 10.176, "Jul"],
  ["Pennsylvania", "PA", 43, 33, "Moderate", 5.921, 9.995, "Jul"],
  ["Rhode Island", "RI", 37, 39, "Low", 5.449, 9.498, "Jul"],
  ["South Carolina", "SC", 60, 14, "High", 7.336, 11.021, "Jul"],
  ["South Dakota", "SD", 38, 37, "Low", 5.587, 9.897, "Jul"],
  ["Tennessee", "TN", 57, 18, "Moderate", 7.067, 10.942, "Jul"],
  ["Texas", "TX", 74, 5, "High", 8.479, 12.135, "Jul"],
  ["Utah", "UT", 68, 8, "High", 7.981, 12.31, "Jul"],
  ["Vermont", "VT", 34, 43, "Low", 5.219, 9.251, "Jul"],
  ["Virginia", "VA", 51, 23, "Moderate", 6.574, 10.521, "Jul"],
  ["Washington", "WA", 32, 45, "Low", 5.069, 9.032, "Jun"],
  ["West Virginia", "WV", 50, 24, "Moderate", 6.546, 10.571, "Jul"],
  ["Wisconsin", "WI", 33, 44, "Low", 5.145, 9.29, "Jul"],
  ["Wyoming", "WY", 57, 17, "Moderate", 7.108, 11.482, "Jul"],
];

export const UV_INDEX_DATASET: StateWeatherIndexDataset = {
  slug: "uv",
  label: "UV Exposure",
  metricLabel: "UV exposure index",
  unit: "0–100 index",
  blurb:
    "Relative UV exposure by state, based on annual and peak monthly solar-noon UV climatology. 100 = highest exposure in the nation.",
  dataVintage: "NASA NEO monthly climatology with EPA/NOAA comparison sources",
  sources: UV_SOURCES,
  methodology: UV_METHODOLOGY,
  data: UV_ROWS.map(
    ([
      name,
      state,
      value,
      rank,
      band,
      annualMeanSolarNoonUvi,
      peakMonthlyMeanUvi,
      peakMonth,
    ]) => ({
      name,
      state,
      value,
      rank,
      band,
      annualMeanSolarNoonUvi,
      peakMonthlyMeanUvi,
      peakMonth,
    })
  ),
};

export const STATE_WEATHER_INDEX_DATASETS = [UV_INDEX_DATASET];
