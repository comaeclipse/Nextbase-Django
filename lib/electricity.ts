import { type BandName, type StateValue } from "@/lib/critters";

export type ElectricityStateValue = StateValue & {
  priceCentsPerKwh: number;
  affordabilityScore: number;
  priceBand: string;
};

const ELECTRICITY_ROWS: [string, string, number, number, number][] = [
  ["North Dakota", "ND", 1, 11.92, 100], ["Idaho", "ID", 2, 12.52, 98.2], ["Nebraska", "NE", 3, 12.59, 98], ["Missouri", "MO", 4, 12.83, 97.2], ["Oklahoma", "OK", 5, 13.1, 96.4],
  ["Utah", "UT", 6, 13.12, 96.3], ["Arkansas", "AR", 7, 13.28, 95.8], ["Iowa", "IA", 8, 13.31, 95.7], ["Louisiana", "LA", 9, 13.52, 95.1], ["Montana", "MT", 10, 13.56, 95],
  ["Wyoming", "WY", 11, 13.66, 94.7], ["Tennessee", "TN", 12, 13.87, 94], ["Nevada", "NV", 13, 14.04, 93.5], ["South Dakota", "SD", 14, 14.15, 93.2], ["Washington", "WA", 15, 14.27, 92.8],
  ["Kentucky", "KY", 16, 14.39, 92.4], ["New Mexico", "NM", 17, 14.75, 91.3], ["Georgia", "GA", 18, 14.9, 90.9], ["North Carolina", "NC", 19, 14.93, 90.8], ["Kansas", "KS", 20, 15.05, 90.4],
  ["Oregon", "OR", 21, 15.14, 90.2], ["West Virginia", "WV", 22, 15.41, 89.3], ["Florida", "FL", 23, 15.43, 89.3], ["Mississippi", "MS", 24, 15.47, 89.1], ["Arizona", "AZ", 25, 15.55, 88.9],
  ["Minnesota", "MN", 26, 15.67, 88.5], ["Texas", "TX", 27, 16.15, 87.1], ["South Carolina", "SC", 28, 16.16, 87], ["Colorado", "CO", 29, 16.53, 85.9], ["Virginia", "VA", 30, 16.58, 85.7],
  ["Alabama", "AL", 31, 16.62, 85.6], ["Indiana", "IN", 32, 17.03, 84.4], ["Delaware", "DE", 33, 17.45, 83.1], ["Ohio", "OH", 34, 18.4, 80.2], ["Wisconsin", "WI", 35, 18.87, 78.7],
  ["Illinois", "IL", 36, 19.06, 78.2], ["Michigan", "MI", 37, 20.72, 73.1], ["Pennsylvania", "PA", 38, 20.75, 73], ["Maryland", "MD", 39, 21.16, 71.7], ["New Jersey", "NJ", 40, 23.28, 65.2],
  ["Vermont", "VT", 41, 23.9, 63.4], ["Alaska", "AK", 42, 26.68, 54.8], ["New Hampshire", "NH", 43, 26.8, 54.5], ["New York", "NY", 44, 29.22, 47.1], ["Rhode Island", "RI", 45, 29.48, 46.3],
  ["Maine", "ME", 46, 29.68, 45.7], ["Connecticut", "CT", 47, 29.78, 45.4], ["Massachusetts", "MA", 48, 30.15, 44.2], ["California", "CA", 49, 32.83, 36], ["Hawaii", "HI", 50, 44.61, 0],
];

export const ELECTRICITY_BANDS: { label: string; color: string; matches: (price: number) => boolean }[] = [
  { label: "Up to 14.00¢", color: "#fff7bc", matches: (price) => price <= 14 },
  { label: "14.01–16.00¢", color: "#fec44f", matches: (price) => price > 14 && price <= 16 },
  { label: "16.01–20.00¢", color: "#fe9929", matches: (price) => price > 16 && price <= 20 },
  { label: "20.01–30.00¢", color: "#cc4c02", matches: (price) => price > 20 && price <= 30 },
  { label: "Over 30.00¢", color: "#8c2d04", matches: (price) => price > 30 },
];

function priceBand(price: number) {
  return ELECTRICITY_BANDS.find((band) => band.matches(price)) ?? ELECTRICITY_BANDS.at(-1)!;
}

export const STATE_ELECTRICITY_DATA: ElectricityStateValue[] = ELECTRICITY_ROWS.map(([name, state, rank, priceCentsPerKwh, affordabilityScore]) => {
  const band = priceBand(priceCentsPerKwh);
  return {
    name, state, rank, value: priceCentsPerKwh, priceCentsPerKwh, affordabilityScore,
    band: (rank <= 10 ? "Very Low" : rank <= 25 ? "Low" : rank <= 36 ? "Moderate" : rank <= 45 ? "High" : "Very High") as BandName,
    priceBand: band.label,
  };
});

export const ELECTRICITY_DATASET = {
  title: "U.S. Residential Electricity Cost by State",
  metricLabel: "Average residential electricity price",
  unit: "¢/kWh",
  period: "January–May 2026 year-to-date",
  releaseDate: "July 23, 2026",
  nationalAverage: 18.11,
  sourceUrl: "https://www.eia.gov/electricity/monthly/epm_table_grapher.php?t=epmt_5_6_b",
  sourceLabel: "U.S. Energy Information Administration — Electric Power Monthly, Table 5.6.B",
  data: STATE_ELECTRICITY_DATA,
} as const;
