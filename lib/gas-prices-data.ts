import { bandForValue, type BandName, type StateValue } from "@/lib/critters";

/**
 * Static gas-price dataset for the /gas choropleth.
 *
 * This is the fallback the reader (`lib/gas-prices.ts`) serves when the
 * `state_gas_prices` table is absent. The map colors by `value`, a 0–100
 * expensiveness index where 100 = the most expensive state in the nation (so
 * rank 1 is the warmest fill, matching /uv's "rank 1 = worst" convention).
 * `price` is the real regular price in $/gal and is what the UI leads with.
 */

export type GasPriceValue = StateValue & {
  /** Regular unleaded price in USD per gallon. */
  price: number;
};

export type GasPriceDataset = {
  metricLabel: string;
  /** Unit for the index the map colors by. */
  unit: string;
  /** Unit for the real dollar price. */
  priceUnit: string;
  blurb: string;
  dataVintage: string;
  sources: string[];
  methodology: string;
  data: GasPriceValue[];
};

// [name, abbr, price ($/gal), rank (1 = most expensive), score (0 = most
// expensive, 100 = cheapest — an affordability score)].
const GAS_ROWS: [
  name: string,
  abbr: string,
  price: number,
  rank: number,
  score: number,
][] = [
  ["California", "CA", 5.497, 1, 0],
  ["Hawaii", "HI", 5.415, 2, 4],
  ["Washington", "WA", 5.014, 3, 23],
  ["Alaska", "AK", 4.657, 4, 39],
  ["Nevada", "NV", 4.62, 5, 41],
  ["Oregon", "OR", 4.558, 6, 44],
  ["Arizona", "AZ", 4.271, 7, 57],
  ["Pennsylvania", "PA", 4.193, 8, 61],
  ["Illinois", "IL", 4.153, 9, 63],
  ["New York", "NY", 4.147, 10, 63],
  ["Michigan", "MI", 4.146, 11, 63],
  ["Vermont", "VT", 4.121, 12, 64],
  ["Montana", "MT", 4.119, 13, 64],
  ["Connecticut", "CT", 4.1, 14, 65],
  ["New Jersey", "NJ", 4.068, 15, 67],
  ["Idaho", "ID", 4.056, 16, 67],
  ["Rhode Island", "RI", 4.04, 17, 68],
  ["Massachusetts", "MA", 4.034, 18, 68],
  ["Maine", "ME", 4.03, 19, 68],
  ["Wyoming", "WY", 4.024, 20, 69],
  ["Maryland", "MD", 4.004, 21, 70],
  ["Utah", "UT", 4.0, 22, 70],
  ["New Hampshire", "NH", 3.999, 23, 70],
  ["New Mexico", "NM", 3.988, 24, 70],
  ["Delaware", "DE", 3.972, 25, 71],
  ["Colorado", "CO", 3.955, 26, 72],
  ["Florida", "FL", 3.933, 27, 73],
  ["Virginia", "VA", 3.914, 28, 74],
  ["Ohio", "OH", 3.875, 29, 76],
  ["Minnesota", "MN", 3.873, 30, 76],
  ["South Dakota", "SD", 3.872, 31, 76],
  ["Nebraska", "NE", 3.847, 32, 77],
  ["West Virginia", "WV", 3.833, 33, 78],
  ["Iowa", "IA", 3.808, 34, 79],
  ["Wisconsin", "WI", 3.789, 35, 80],
  ["Georgia", "GA", 3.768, 36, 81],
  ["North Dakota", "ND", 3.75, 37, 81],
  ["North Carolina", "NC", 3.682, 38, 85],
  ["South Carolina", "SC", 3.675, 39, 85],
  ["Kansas", "KS", 3.673, 40, 85],
  ["Kentucky", "KY", 3.664, 41, 85],
  ["Missouri", "MO", 3.65, 42, 86],
  ["Alabama", "AL", 3.638, 43, 87],
  ["Tennessee", "TN", 3.613, 44, 88],
  ["Arkansas", "AR", 3.61, 45, 88],
  ["Oklahoma", "OK", 3.59, 46, 89],
  ["Louisiana", "LA", 3.586, 47, 89],
  ["Texas", "TX", 3.571, 48, 90],
  ["Mississippi", "MS", 3.57, 49, 90],
  ["Indiana", "IN", 3.353, 50, 100],
];

const GAS_DATA: GasPriceValue[] = GAS_ROWS.map(
  ([name, state, price, rank, score]) => {
    // 100 = most expensive so the warm ramp peaks on the priciest states.
    const value = 100 - score;
    return { name, state, price, rank, value, band: bandForValue(value) };
  }
);

export const GAS_PRICE_DATASET: GasPriceDataset = {
  metricLabel: "Regular gas price",
  unit: "0–100 index",
  priceUnit: "$/gal",
  blurb:
    "Average price of regular unleaded gasoline by state. The map shades a 0–100 expensiveness index (100 = priciest in the nation); hover for the real per-gallon price.",
  dataVintage: "State average regular unleaded, 2025",
  sources: [
    "AAA — Daily Fuel Gauge Report (state averages)",
    "U.S. Energy Information Administration (EIA) — Gasoline and Diesel Fuel Update",
    "GasBuddy — State Gas Price Averages",
  ],
  methodology:
    "State-level average regular unleaded prices were ranked highest-to-lowest and converted to a 0–100 index, where 100 marks the most expensive state and 0 the cheapest. Risk bands follow the shared 0–100 banding used across the state data maps.",
  data: GAS_DATA,
};

export type { BandName };
