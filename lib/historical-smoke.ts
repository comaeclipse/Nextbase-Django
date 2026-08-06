import { bandForValue, type BandName, type StateValue } from "@/lib/critters";

export type HistoricalSmokeMetric =
  | "recurrence"
  | "smokeDays"
  | "burden"
  | "worstDay";

export type HistoricalSmokeState = {
  name: string;
  state: string;
  recurrencePct: number;
  smokeDaysPerYear: number;
  annualSmokeBurden: number;
  typicalWorstDay: number;
  worstYear: number;
  typicalSmokeSeason: string;
};

export type HistoricalSmokeMapValue = StateValue & HistoricalSmokeState;

export const HISTORICAL_SMOKE_METRICS: Record<
  HistoricalSmokeMetric,
  { label: string; unit: string; description: string; format: (value: number) => string }
> = {
  recurrence: {
    label: "Recurring-smoke years",
    unit: "% of years",
    description: "Share of 2006-2020 years with at least five significant smoke days.",
    format: (value) => `${value.toFixed(1)}%`,
  },
  smokeDays: {
    label: "Significant smoke days",
    unit: "days/year",
    description: "Average annual days with wildfire-attributable PM2.5 at or above 5 micrograms per cubic meter.",
    format: (value) => value.toFixed(1),
  },
  burden: {
    label: "Annual smoke burden",
    unit: "ug-day/m3/year",
    description: "Average annual cumulative wildfire-attributable PM2.5 exposure.",
    format: (value) => value.toFixed(1),
  },
  worstDay: {
    label: "Typical worst day",
    unit: "ug/m3",
    description: "Median of each year's highest population-weighted wildfire PM2.5 day.",
    format: (value) => value.toFixed(1),
  },
};

const ROWS: [
  name: string, state: string, recurrencePct: number, smokeDaysPerYear: number,
  annualSmokeBurden: number, typicalWorstDay: number, worstYear: number, typicalSmokeSeason: string,
][] = [
  ["Alabama", "AL", 46.7, 8.7, 128.0, 6.9, 2007, "May-June"],
  ["Arizona", "AZ", 6.7, 3.0, 50.2, 4.8, 2020, "June-July"],
  ["Arkansas", "AR", 73.3, 12.3, 183.3, 8.5, 2011, "September-October"],
  ["California", "CA", 40.0, 8.5, 194.6, 4.5, 2020, "September-October"],
  ["Colorado", "CO", 40.0, 9.1, 147.7, 9.0, 2020, "August-September"],
  ["Connecticut", "CT", 0.0, 0.0, 0.0, 0.0, 2006, "January-February"],
  ["Delaware", "DE", 53.3, 6.7, 97.1, 13.9, 2011, "June-July"],
  ["Florida", "FL", 20.0, 5.2, 90.3, 5.0, 2007, "May-June"],
  ["Georgia", "GA", 53.3, 9.9, 137.0, 8.6, 2007, "May-June"],
  ["Idaho", "ID", 80.0, 19.2, 368.4, 18.8, 2020, "August-September"],
  ["Illinois", "IL", 93.3, 12.1, 177.1, 10.7, 2012, "August-September"],
  ["Indiana", "IN", 73.3, 10.2, 146.1, 10.2, 2007, "August-September"],
  ["Iowa", "IA", 93.3, 13.8, 196.8, 10.8, 2012, "August-September"],
  ["Kansas", "KS", 93.3, 13.4, 201.5, 8.5, 2011, "September-October"],
  ["Kentucky", "KY", 80.0, 8.9, 123.7, 7.7, 2007, "August-September"],
  ["Louisiana", "LA", 60.0, 8.4, 131.9, 7.8, 2011, "May-June"],
  ["Maine", "ME", 60.0, 5.2, 75.0, 7.9, 2015, "July-August"],
  ["Maryland", "MD", 46.7, 6.5, 95.4, 12.0, 2011, "August-September"],
  ["Massachusetts", "MA", 53.3, 7.4, 92.7, 11.4, 2015, "August-September"],
  ["Michigan", "MI", 73.3, 9.6, 140.1, 10.9, 2007, "August-September"],
  ["Minnesota", "MN", 100.0, 12.8, 195.9, 12.4, 2015, "August-September"],
  ["Mississippi", "MS", 53.3, 8.1, 123.3, 6.3, 2011, "September-October"],
  ["Missouri", "MO", 93.3, 13.0, 186.9, 8.6, 2011, "September-October"],
  ["Montana", "MT", 86.7, 20.3, 395.6, 21.0, 2017, "August-September"],
  ["Nebraska", "NE", 86.7, 12.6, 200.0, 10.9, 2012, "August-September"],
  ["Nevada", "NV", 46.7, 8.2, 143.8, 10.5, 2020, "August-September"],
  ["New Hampshire", "NH", 53.3, 6.1, 79.7, 9.5, 2015, "July-August"],
  ["New Jersey", "NJ", 66.7, 7.6, 107.2, 13.0, 2007, "June-July"],
  ["New Mexico", "NM", 33.3, 4.7, 81.6, 5.8, 2020, "June-July"],
  ["New York", "NY", 60.0, 7.9, 106.3, 13.3, 2007, "August-September"],
  ["North Carolina", "NC", 46.7, 6.7, 100.6, 9.3, 2011, "June-July"],
  ["North Dakota", "ND", 100.0, 14.2, 242.6, 12.2, 2015, "August-September"],
  ["Ohio", "OH", 73.3, 8.5, 118.6, 9.1, 2007, "August-September"],
  ["Oklahoma", "OK", 80.0, 10.8, 170.8, 8.7, 2011, "September-October"],
  ["Oregon", "OR", 66.7, 10.6, 347.1, 10.1, 2020, "September-October"],
  ["Pennsylvania", "PA", 53.3, 6.6, 94.2, 10.1, 2007, "June-July"],
  ["Rhode Island", "RI", 53.3, 7.5, 95.5, 13.1, 2015, "August-September"],
  ["South Carolina", "SC", 53.3, 8.3, 119.0, 7.8, 2011, "June-July"],
  ["South Dakota", "SD", 80.0, 13.0, 209.4, 10.8, 2012, "August-September"],
  ["Tennessee", "TN", 53.3, 7.7, 111.3, 7.6, 2007, "August-September"],
  ["Texas", "TX", 66.7, 8.8, 135.8, 8.1, 2011, "May-June"],
  ["Utah", "UT", 53.3, 9.3, 139.8, 7.3, 2020, "August-September"],
  ["Vermont", "VT", 53.3, 5.2, 74.7, 9.1, 2015, "July-August"],
  ["Virginia", "VA", 53.3, 6.4, 94.6, 7.1, 2011, "August-September"],
  ["Washington", "WA", 66.7, 9.2, 256.8, 8.8, 2020, "September-October"],
  ["West Virginia", "WV", 33.3, 5.1, 80.3, 7.2, 2007, "August-September"],
  ["Wisconsin", "WI", 93.3, 11.7, 170.4, 10.2, 2012, "August-September"],
  ["Wyoming", "WY", 60.0, 12.1, 196.5, 8.2, 2020, "August-September"],
];

export const HISTORICAL_SMOKE_DATA: HistoricalSmokeState[] = ROWS.map(
  ([name, state, recurrencePct, smokeDaysPerYear, annualSmokeBurden, typicalWorstDay, worstYear, typicalSmokeSeason]) => ({
    name, state, recurrencePct, smokeDaysPerYear, annualSmokeBurden, typicalWorstDay, worstYear, typicalSmokeSeason,
  })
);

export function historicalSmokeMap(metric: HistoricalSmokeMetric): HistoricalSmokeMapValue[] {
  const key: Record<HistoricalSmokeMetric, keyof Pick<HistoricalSmokeState, "recurrencePct" | "smokeDaysPerYear" | "annualSmokeBurden" | "typicalWorstDay">> = {
    recurrence: "recurrencePct", smokeDays: "smokeDaysPerYear", burden: "annualSmokeBurden", worstDay: "typicalWorstDay",
  };
  const maximum = Math.max(...HISTORICAL_SMOKE_DATA.map((row) => row[key[metric]]), 1);
  const ranked = [...HISTORICAL_SMOKE_DATA].sort((a, b) => b[key[metric]] - a[key[metric]]);
  const rank = new Map(ranked.map((row, index) => [row.state, index + 1]));
  return HISTORICAL_SMOKE_DATA.map((row) => {
    const value = row[key[metric]];
    const normalized = (value / maximum) * 100;
    return { ...row, value, rank: rank.get(row.state) ?? 0, band: bandForValue(normalized) as BandName };
  });
}

export const HISTORICAL_SMOKE_SOURCES = [
  "Stanford ECHO Lab / Childs et al. county-level daily wildfire PM2.5 predictions (2006-2020)",
  "U.S. Census Bureau County Population Totals: 2020-2024 (2020 estimates for weighting)",
];
