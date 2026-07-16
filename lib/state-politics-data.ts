import type { BandName, StateValue } from "@/lib/critters";

export type PoliticsTier =
  | "Very conservative"
  | "Conservative"
  | "Lean conservative"
  | "Purple"
  | "Lean progressive"
  | "Progressive"
  | "Very progressive";

export type StatePoliticsValue = StateValue & {
  tier: PoliticsTier;
  cookPvi: string;
  cookPviNumeric: number;
  governmentConfiguration: string;
  governmentComponent: number;
  gallupConservativeAdvantage: number;
  bestRankAcrossWeightScenarios: number;
  worstRankAcrossWeightScenarios: number;
  minimumScoreAcrossWeightScenarios: number;
  maximumScoreAcrossWeightScenarios: number;
};

export type StatePoliticsDataset = {
  label: string;
  metricLabel: string;
  unit: string;
  blurb: string;
  dataVintage: string;
  sources: string[];
  methodology: string;
  data: StatePoliticsValue[];
};

export const POLITICS_SOURCES = [
  "Cook Political Report - 2025 Partisan Voting Index",
  "State government partisan-control classifications for 2026",
  "Gallup state ideology estimates",
  "Weight-sensitivity scenarios preserved in us_state_conservatism_index_2026.csv",
];

export const POLITICS_METHODOLOGY =
  "The index normalizes state-level conservative signals to a 0-100 scale, where 100 is the most conservative state and 0 is the most progressive state. Inputs include Cook PVI, state-government partisan configuration, and Gallup conservative ideological advantage; the min/max columns show how stable each state's rank and score were across alternate weighting scenarios.";

const TIER_TO_BAND: Record<PoliticsTier, BandName> = {
  "Very conservative": "Very High",
  Conservative: "High",
  "Lean conservative": "Moderate",
  Purple: "Moderate",
  "Lean progressive": "Low",
  Progressive: "Very Low",
  "Very progressive": "Very Low",
};

const POLITICS_ROWS: [
  name: string,
  abbr: string,
  value: number,
  rank: number,
  tier: PoliticsTier,
  cookPvi: string,
  cookPviNumeric: number,
  governmentConfiguration: string,
  governmentComponent: number,
  gallupConservativeAdvantage: number,
  bestRankAcrossWeightScenarios: number,
  worstRankAcrossWeightScenarios: number,
  minimumScoreAcrossWeightScenarios: number,
  maximumScoreAcrossWeightScenarios: number,
][] = [
  ["Wyoming", "WY", 100, 1, "Very conservative", "R+23", 23, "Republican trifecta", 100, 28.8, 1, 1, 100, 100],
  ["West Virginia", "WV", 94.2, 2, "Very conservative", "R+21", 21, "Republican trifecta", 100, 21.7, 2, 4, 91.3, 94.8],
  ["North Dakota", "ND", 92.5, 3, "Very conservative", "R+18", 18, "Republican trifecta", 100, 27.5, 2, 3, 90.3, 93.9],
  ["Idaho", "ID", 91.6, 4, "Very conservative", "R+18", 18, "Republican trifecta", 100, 25.3, 4, 6, 89.4, 93],
  ["Oklahoma", "OK", 90, 5, "Very conservative", "R+17", 17, "Republican trifecta", 100, 24.8, 5, 7, 87.3, 91.7],
  ["Alabama", "AL", 90, 6, "Very conservative", "R+15", 15, "Republican trifecta", 100, 31.2, 3, 6, 86.5, 92.2],
  ["Arkansas", "AR", 88.4, 7, "Very conservative", "R+15", 15, "Republican trifecta", 100, 27.4, 7, 8, 84.8, 90.6],
  ["South Dakota", "SD", 86.6, 8, "Very conservative", "R+15", 15, "Republican trifecta", 100, 23.3, 8, 10, 83, 88.9],
  ["Tennessee", "TN", 86.5, 9, "Very conservative", "R+14", 14, "Republican trifecta", 100, 26.4, 9, 9, 82.6, 89.1],
  ["Mississippi", "MS", 86.5, 10, "Very conservative", "R+11", 11, "Republican trifecta", 100, 36, 5, 10, 81.3, 90.9],
  ["Louisiana", "LA", 83.2, 11, "Conservative", "R+11", 11, "Republican trifecta", 100, 28.3, 11, 11, 77.9, 86.5],
  ["Utah", "UT", 82.7, 12, "Conservative", "R+11", 11, "Republican trifecta", 100, 27.2, 12, 13, 77.5, 86.1],
  ["Nebraska", "NE", 79.4, 13, "Conservative", "R+10", 10, "Republican trifecta", 100, 22.5, 13, 14, 73.6, 83],
  ["Montana", "MT", 79.1, 14, "Conservative", "R+10", 10, "Republican trifecta", 100, 22, 14, 15, 73.3, 82.8],
  ["Missouri", "MO", 77.5, 15, "Conservative", "R+9", 9, "Republican trifecta", 100, 21.4, 15, 17, 71.3, 81.4],
  ["South Carolina", "SC", 77.5, 16, "Conservative", "R+8", 8, "Republican trifecta", 100, 24.6, 15, 17, 70.9, 81.7],
  ["Indiana", "IN", 76.6, 17, "Conservative", "R+9", 9, "Republican trifecta", 100, 19.2, 17, 18, 70.3, 80.5],
  ["Kentucky", "KY", 76.3, 18, "Conservative", "R+15", 15, "D governor; R House and Senate", 70, 23.6, 12, 20, 75.4, 78.2],
  ["Texas", "TX", 73.2, 19, "Conservative", "R+6", 6, "Republican trifecta", 100, 20.9, 18, 19, 65.6, 77.9],
  ["Iowa", "IA", 72.5, 20, "Conservative", "R+6", 6, "Republican trifecta", 100, 19.3, 19, 20, 64.9, 77.3],
  ["Ohio", "OH", 69.7, 21, "Lean conservative", "R+5", 5, "Republican trifecta", 100, 16.1, 21, 22, 61.6, 74.8],
  ["Florida", "FL", 69.2, 22, "Lean conservative", "R+5", 5, "Republican trifecta", 100, 14.9, 22, 23, 61.1, 74.3],
  ["Georgia", "GA", 65.9, 23, "Lean conservative", "R+1", 1, "Republican trifecta", 100, 20.2, 23, 25, 56.2, 72.1],
  ["Kansas", "KS", 64.3, 24, "Lean conservative", "R+8", 8, "D governor; R House and Senate", 70, 18, 21, 25, 62.6, 65.4],
  ["New Hampshire", "NH", 60.3, 25, "Lean conservative", "D+2", -2, "Republican trifecta", 100, 16.7, 24, 28, 49.2, 67.3],
  ["Alaska", "AK", 58.4, 26, "Lean conservative", "R+6", 6, "R governor; bipartisan coalitions in both chambers", 65, 14.8, 24, 26, 56.6, 59.6],
  ["North Carolina", "NC", 54.4, 27, "Purple", "R+1", 1, "D governor; R House and Senate", 70, 17.4, 27, 27, 49.6, 57.4],
  ["Arizona", "AZ", 54.2, 28, "Purple", "R+2", 2, "D governor; R House and Senate", 70, 13.8, 26, 28, 49.8, 57],
  ["Wisconsin", "WI", 51.9, 29, "Purple", "EVEN", 0, "D governor; R Assembly and Senate", 70, 14.9, 29, 29, 46.6, 55.2],
  ["Pennsylvania", "PA", 39.9, 30, "Lean progressive", "R+1", 1, "D governor; D House, R Senate", 35, 12, 30, 32, 39.3, 41.9],
  ["Michigan", "MI", 39.4, 31, "Lean progressive", "EVEN", 0, "D governor; R House, D Senate", 35, 13.9, 30, 32, 39, 42.3],
  ["Nevada", "NV", 38.8, 32, "Lean progressive", "R+1", 1, "R governor; D Assembly and Senate", 30, 13.5, 31, 32, 37.7, 42],
  ["Minnesota", "MN", 27.6, 33, "Progressive", "D+3", -3, "D governor; tied/power-sharing House, D Senate", 17.5, 10.3, 33, 34, 26.3, 31.2],
  ["Virginia", "VA", 23.7, 34, "Progressive", "D+3", -3, "Democratic trifecta", 0, 15.4, 33, 34, 20.5, 31.5],
  ["New Mexico", "NM", 21.5, 35, "Progressive", "D+4", -4, "Democratic trifecta", 0, 13.4, 35, 35, 18.6, 28.5],
  ["Maine", "ME", 19.8, 36, "Progressive", "D+4", -4, "Democratic trifecta", 0, 9.4, 36, 36, 16.9, 25],
  ["New Jersey", "NJ", 17.7, 37, "Progressive", "D+4", -4, "Democratic trifecta", 0, 4.4, 37, 38, 14.8, 22.2],
  ["Colorado", "CO", 16.7, 38, "Progressive", "D+6", -6, "Democratic trifecta", 0, 8.7, 37, 38, 14.4, 21.8],
  ["Illinois", "IL", 16, 39, "Progressive", "D+6", -6, "Democratic trifecta", 0, 7, 39, 39, 13.7, 20.3],
  ["Oregon", "OR", 12.9, 40, "Very progressive", "D+8", -8, "Democratic trifecta", 0, 6.3, 40, 40, 11.2, 17.2],
  ["Delaware", "DE", 12.6, 41, "Very progressive", "D+8", -8, "Democratic trifecta", 0, 5.5, 41, 41, 10.8, 16.5],
  ["Connecticut", "CT", 12.3, 42, "Very progressive", "D+8", -8, "Democratic trifecta", 0, 4.8, 42, 43, 10.6, 15.9],
  ["Rhode Island", "RI", 11.9, 43, "Very progressive", "D+8", -8, "Democratic trifecta", 0, 3.9, 43, 44, 10.2, 15.1],
  ["New York", "NY", 11, 44, "Very progressive", "D+8", -8, "Democratic trifecta", 0, 1.8, 44, 45, 9.3, 13.7],
  ["Washington", "WA", 9.5, 45, "Very progressive", "D+10", -10, "Democratic trifecta", 0, 4.7, 45, 46, 8.3, 13.2],
  ["Vermont", "VT", 6.8, 46, "Very progressive", "D+17", -17, "R governor; D House and Senate", 30, -3.2, 42, 49, 0.5, 10.8],
  ["California", "CA", 5.9, 47, "Very progressive", "D+12", -12, "Democratic trifecta", 0, 2.7, 46, 47, 5.3, 8.9],
  ["Hawaii", "HI", 2.5, 48, "Very progressive", "D+13", -13, "Democratic trifecta", 0, -1.9, 47, 49, 2.2, 3.6],
  ["Maryland", "MD", 2.5, 49, "Very progressive", "D+15", -15, "Democratic trifecta", 0, 4.5, 47, 49, 2.2, 6.6],
  ["Massachusetts", "MA", 0, 50, "Very progressive", "D+14", -14, "Democratic trifecta", 0, -4.6, 50, 50, 0, 0],
];

export const STATE_POLITICS_DATASET: StatePoliticsDataset = {
  label: "Political Lean",
  metricLabel: "Conservatism index",
  unit: "0-100 index",
  blurb:
    "Relative state political lean based on partisan voting, state-government control, and survey ideology signals. 100 = most conservative in the nation.",
  dataVintage: "2026 state conservatism index with alternate weighting scenarios",
  sources: POLITICS_SOURCES,
  methodology: POLITICS_METHODOLOGY,
  data: POLITICS_ROWS.map(
    ([
      name,
      state,
      value,
      rank,
      tier,
      cookPvi,
      cookPviNumeric,
      governmentConfiguration,
      governmentComponent,
      gallupConservativeAdvantage,
      bestRankAcrossWeightScenarios,
      worstRankAcrossWeightScenarios,
      minimumScoreAcrossWeightScenarios,
      maximumScoreAcrossWeightScenarios,
    ]) => ({
      name,
      state,
      value,
      rank,
      tier,
      band: TIER_TO_BAND[tier],
      displayBand: tier,
      cookPvi,
      cookPviNumeric,
      governmentConfiguration,
      governmentComponent,
      gallupConservativeAdvantage,
      bestRankAcrossWeightScenarios,
      worstRankAcrossWeightScenarios,
      minimumScoreAcrossWeightScenarios,
      maximumScoreAcrossWeightScenarios,
    })
  ),
};
