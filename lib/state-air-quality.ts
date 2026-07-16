import {
  aggregate,
  bandForValue,
  type BandName,
  type StateValue,
} from "@/lib/critters";

export type StateAirQualityValue = StateValue & {
  monitoredCounties: number;
  medianAqi: number;
  p90Aqi: number;
  maxAqi: number;
  unhealthyDaysPerYear: number;
};

export type StateAirQualityDataset = {
  slug: "air-quality";
  label: string;
  metricLabel: string;
  unit: string;
  blurb: string;
  dataVintage: string;
  sources: string[];
  methodology: string;
  data: StateAirQualityValue[];
};

const STATE_AQI_ROWS: [
  name: string,
  abbr: string,
  value: number,
  rank: number,
  band: BandName,
  monitoredCounties: number,
  medianAqi: number,
  p90Aqi: number,
  maxAqi: number,
  unhealthyDaysPerYear: number,
][] = [
  ["California", "CA", 100, 1, "Very High", 47, 46.5, 71.6, 704, 13.7],
  ["Arizona", "AZ", 86, 2, "Very High", 13, 44.9, 69.3, 1215, 8.8],
  ["New Mexico", "NM", 79, 3, "High", 16, 41.5, 68.7, 528, 9.7],
  ["Utah", "UT", 76, 4, "High", 17, 45, 68.9, 175, 2.5],
  ["Connecticut", "CT", 72, 5, "High", 8, 40.3, 64.4, 174, 9.9],
  ["Texas", "TX", 71, 6, "High", 45, 42.1, 64.2, 2122, 6.8],
  ["Ohio", "OH", 70, 7, "High", 37, 43.9, 64.7, 238, 3.4],
  ["Oklahoma", "OK", 67, 8, "High", 20, 43.8, 63.8, 508, 2.5],
  ["Iowa", "IA", 66, 9, "High", 15, 42.6, 63.9, 166, 3.3],
  ["Illinois", "IL", 65, 10, "High", 23, 41.9, 63.1, 260, 4.5],
  ["North Dakota", "ND", 64, 11, "High", 9, 37.9, 61.9, 285, 10.2],
  ["Wisconsin", "WI", 63, 12, "High", 29, 38.3, 63, 188, 8.3],
  ["Colorado", "CO", 61, 13, "High", 30, 40.8, 64, 652, 2.6],
  ["Minnesota", "MN", 61, 14, "High", 23, 35.5, 63, 216, 10.6],
  ["Michigan", "MI", 61, 15, "High", 27, 38.9, 62.7, 193, 6.5],
  ["Georgia", "GA", 61, 16, "High", 26, 44.3, 60.1, 181, 0.9],
  ["Delaware", "DE", 60, 17, "High", 3, 41.3, 62, 161, 3],
  ["Nevada", "NV", 58, 18, "Moderate", 9, 41, 59.5, 160, 3.9],
  ["Missouri", "MO", 58, 19, "Moderate", 21, 41.8, 59.3, 738, 3],
  ["Indiana", "IN", 56, 20, "Moderate", 33, 40.8, 59.5, 219, 2.7],
  ["South Carolina", "SC", 55, 21, "Moderate", 13, 43.2, 57.1, 170, 0.5],
  ["Pennsylvania", "PA", 54, 22, "Moderate", 38, 39.9, 60.7, 157, 1.8],
  ["New Jersey", "NJ", 54, 23, "Moderate", 15, 39.8, 59.2, 168, 2.9],
  ["Arkansas", "AR", 54, 24, "Moderate", 11, 42.9, 56.8, 138, 0.8],
  ["Mississippi", "MS", 52, 25, "Moderate", 10, 42.4, 56.7, 143, 0.1],
  ["Kansas", "KS", 50, 26, "Moderate", 12, 39.7, 57.5, 370, 2.2],
  ["Louisiana", "LA", 50, 27, "Moderate", 22, 41.5, 56.2, 122, 0.6],
  ["Alabama", "AL", 48, 28, "Moderate", 15, 41.2, 55.9, 133, 0.2],
  ["Maryland", "MD", 47, 29, "Moderate", 16, 39.7, 56.5, 143, 1.1],
  ["Florida", "FL", 45, 30, "Moderate", 38, 40.7, 53.7, 155, 0.5],
  ["West Virginia", "WV", 44, 31, "Moderate", 13, 39.2, 56, 105, 0.2],
  ["Kentucky", "KY", 44, 32, "Moderate", 25, 39.5, 54.5, 172, 0.9],
  ["New York", "NY", 43, 33, "Moderate", 27, 37, 55.5, 159, 3.1],
  ["Massachusetts", "MA", 43, 34, "Moderate", 13, 37.7, 55.2, 151, 2.6],
  ["New Hampshire", "NH", 41, 35, "Moderate", 7, 37.4, 54.5, 150, 2.3],
  ["Tennessee", "TN", 41, 36, "Moderate", 23, 38.4, 54.4, 156, 0.6],
  ["North Carolina", "NC", 41, 37, "Moderate", 34, 39.4, 53.1, 121, 0.1],
  ["South Dakota", "SD", 38, 38, "Low", 10, 35.2, 55.8, 154, 2.3],
  ["Vermont", "VT", 38, 39, "Low", 4, 35.5, 55, 156, 2.5],
  ["Rhode Island", "RI", 36, 40, "Low", 3, 35.7, 53.7, 196, 1.7],
  ["Oregon", "OR", 34, 41, "Low", 21, 32, 59.3, 208, 1.3],
  ["Idaho", "ID", 34, 42, "Low", 19, 33.8, 55.5, 215, 1.5],
  ["Maine", "ME", 34, 43, "Low", 11, 34.6, 52.9, 170, 2.7],
  ["Virginia", "VA", 33, 44, "Low", 30, 36.5, 51.7, 140, 0.3],
  ["Nebraska", "NE", 25, 45, "Low", 11, 32, 51.8, 137, 1.2],
  ["Washington", "WA", 23, 46, "Low", 31, 29.9, 53.1, 243, 1.7],
  ["Wyoming", "WY", 23, 47, "Low", 17, 31.8, 49.4, 723, 2.4],
  ["Alaska", "AK", 16, 48, "Very Low", 8, 24.7, 53.6, 190, 4.2],
  ["Montana", "MT", 10, 49, "Very Low", 23, 26.6, 48.8, 197, 1.6],
  ["Hawaii", "HI", 0, 50, "Very Low", 3, 27.4, 41.4, 93, 0],
];

export const AIR_QUALITY_SOURCES = [
  "U.S. Environmental Protection Agency AirData - annual_aqi_by_county_2025.zip",
  "EPA Air Quality System annual AQI county summaries",
];

export const AIR_QUALITY_METHODOLOGY =
  "For each state, EPA county annual AQI rows were aggregated across monitored counties using Days with AQI as the weight. The 0-100 index combines normalized weighted median AQI (45%), weighted 90th-percentile AQI (35%), and unhealthy-or-worse day rate (20%), then rescales the composite so 100 is the highest 2025 state burden and 0 is the lowest. County monitor coverage varies by state, so this is a monitored-county statewide burden index, not a modeled reading for every square mile.";

export const STATE_AIR_QUALITY_DATASET: StateAirQualityDataset = {
  slug: "air-quality",
  label: "Air Quality",
  metricLabel: "AQI burden index",
  unit: "0-100 index",
  blurb:
    "Relative state air-quality burden from EPA annual county AQI summaries. 100 = highest burden among states in 2025.",
  dataVintage: "EPA AirData annual_aqi_by_county_2025",
  sources: AIR_QUALITY_SOURCES,
  methodology: AIR_QUALITY_METHODOLOGY,
  data: STATE_AQI_ROWS.map(
    ([
      name,
      state,
      value,
      rank,
      band,
      monitoredCounties,
      medianAqi,
      p90Aqi,
      maxAqi,
      unhealthyDaysPerYear,
    ]) => ({
      name,
      state,
      value,
      rank,
      band,
      displayBand: `${band} burden`,
      monitoredCounties,
      medianAqi,
      p90Aqi,
      maxAqi,
      unhealthyDaysPerYear,
    })
  ),
};

export const AIR_QUALITY_AGGREGATE = aggregate(STATE_AIR_QUALITY_DATASET.data);
export { bandForValue };
