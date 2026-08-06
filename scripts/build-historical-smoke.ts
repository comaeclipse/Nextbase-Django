/**
 * Builds a compact, state-level historical wildfire-smoke summary from the
 * Stanford ECHO Lab county predictions. The source only includes smoke-day
 * rows: days absent from the file are zero by construction.
 *
 * Usage:
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/build-historical-smoke.ts \
 *     --smoke tmp/smoke-county/smokePM2pt5_predictions_daily_county_20060101-20201231.csv \
 *     --population tmp/co-est2024-alldata.csv
 */

import { createReadStream, promises as fs } from "node:fs";
import { dirname, resolve } from "node:path";
import { parse } from "csv-parse";

const STATE_NAMES: Record<string, string> = {
  "01": "Alabama", "04": "Arizona", "05": "Arkansas", "06": "California",
  "08": "Colorado", "09": "Connecticut", "10": "Delaware", "11": "District of Columbia",
  "12": "Florida", "13": "Georgia", "16": "Idaho", "17": "Illinois",
  "18": "Indiana", "19": "Iowa", "20": "Kansas", "21": "Kentucky", "22": "Louisiana",
  "23": "Maine", "24": "Maryland", "25": "Massachusetts", "26": "Michigan",
  "27": "Minnesota", "28": "Mississippi", "29": "Missouri", "30": "Montana",
  "31": "Nebraska", "32": "Nevada", "33": "New Hampshire", "34": "New Jersey",
  "35": "New Mexico", "36": "New York", "37": "North Carolina", "38": "North Dakota",
  "39": "Ohio", "40": "Oklahoma", "41": "Oregon", "42": "Pennsylvania",
  "44": "Rhode Island", "45": "South Carolina", "46": "South Dakota", "47": "Tennessee",
  "48": "Texas", "49": "Utah", "50": "Vermont", "51": "Virginia", "53": "Washington",
  "54": "West Virginia", "55": "Wisconsin", "56": "Wyoming",
};

const args = new Map<string, string>();
for (let index = 2; index < process.argv.length; index += 2) {
  args.set(process.argv[index], process.argv[index + 1]);
}

const smokePath = args.get("--smoke");
const populationPath = args.get("--population");
const outputPath = args.get("--out") ?? "data/state_historical_smoke_2006_2020.csv";
if (!smokePath || !populationPath) {
  throw new Error("Pass --smoke <county-predictions.csv> and --population <Census county-estimates.csv>.");
}
const smokeInput = smokePath;
const populationInput = populationPath;

type PopulationRow = { SUMLEV: string; STATE: string; COUNTY: string; POPESTIMATE2020: string };
type SmokeRow = { GEOID: string; date: string; smokePM_pred: string };

async function readCsv<T>(path: string): Promise<T[]> {
  const rows: T[] = [];
  await new Promise<void>((resolvePromise, reject) => {
    createReadStream(path)
      .pipe(parse({ columns: true, bom: true, relax_column_count: true, trim: true }))
      .on("data", (row: T) => rows.push(row))
      .on("error", reject)
      .on("end", () => resolvePromise());
  });
  return rows;
}

async function main() {
const populationRows = await readCsv<PopulationRow>(populationInput);
const countyPopulation = new Map<string, number>();
const statePopulation = new Map<string, number>();
for (const row of populationRows) {
  if (row.SUMLEV !== "050" || !STATE_NAMES[row.STATE]) continue;
  const population = Number(row.POPESTIMATE2020);
  if (!Number.isFinite(population) || population <= 0) continue;
  countyPopulation.set(`${row.STATE}${row.COUNTY}`, population);
  statePopulation.set(row.STATE, (statePopulation.get(row.STATE) ?? 0) + population);
}

type StateYear = { burden: number; significantDays: number; daily: Map<string, number>; months: number[] };
const years = Array.from({ length: 15 }, (_, index) => 2006 + index);
const byStateYear = new Map<string, StateYear>();
for (const state of Object.keys(STATE_NAMES)) {
  for (const year of years) {
    byStateYear.set(`${state}-${year}`, { burden: 0, significantDays: 0, daily: new Map(), months: Array(12).fill(0) });
  }
}

let rowCount = 0;
await new Promise<void>((resolvePromise, reject) => {
  createReadStream(smokeInput)
    .pipe(parse({ columns: true, bom: true, trim: true }))
    .on("data", (row: SmokeRow) => {
      const state = row.GEOID.slice(0, 2);
      const population = countyPopulation.get(row.GEOID);
      const smoke = Math.max(0, Number(row.smokePM_pred));
      if (!STATE_NAMES[state] || !population || !Number.isFinite(smoke)) return;
      const year = Number(row.date.slice(0, 4));
      const month = Number(row.date.slice(4, 6)) - 1;
      const summary = byStateYear.get(`${state}-${year}`);
      if (!summary || month < 0 || month > 11) return;
      const weightedSmoke = population * smoke;
      summary.burden += weightedSmoke;
      summary.months[month] += weightedSmoke;
      summary.daily.set(row.date, (summary.daily.get(row.date) ?? 0) + weightedSmoke);
      if (smoke >= 5) summary.significantDays += population;
      rowCount += 1;
    })
    .on("error", reject)
    .on("end", () => resolvePromise());
});

const out = [
  "state_fips,state,recurrence_pct,smoke_days_per_year,annual_smoke_burden,typical_worst_day,worst_year,typical_smoke_season",
];
for (const [state, name] of Object.entries(STATE_NAMES)) {
  if (state === "11") continue; // The UI maps states, not the District of Columbia.
  const population = statePopulation.get(state);
  if (!population) continue;
  const annual = years.map((year) => {
    const summary = byStateYear.get(`${state}-${year}`)!;
    const smokeDays = summary.significantDays / population;
    const burden = summary.burden / population;
    const worstDay = Math.max(0, ...[...summary.daily.values()].map((value) => value / population));
    return { year, smokeDays, burden, worstDay, months: summary.months.map((value) => value / population) };
  });
  const recurrence = (annual.filter((value) => value.smokeDays >= 5).length / annual.length) * 100;
  const mean = (key: "smokeDays" | "burden") => annual.reduce((sum, value) => sum + value[key], 0) / annual.length;
  const median = (values: number[]) => {
    const sorted = [...values].sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length / 2)];
  };
  const monthTotals = Array.from({ length: 12 }, (_, month) =>
    annual.reduce((sum, value) => sum + value.months[month], 0)
  );
  const peakMonth = monthTotals.indexOf(Math.max(...monthTotals));
  const nextMonth = (peakMonth + 1) % 12;
  const monthLabel = new Intl.DateTimeFormat("en-US", { month: "long", timeZone: "UTC" });
  const season = `${monthLabel.format(new Date(Date.UTC(2020, peakMonth, 1)))}-${monthLabel.format(new Date(Date.UTC(2020, nextMonth, 1)))}`;
  const worstYear = annual.reduce((worst, value) => value.burden > worst.burden ? value : worst).year;
  out.push([
    state, name, recurrence.toFixed(1), mean("smokeDays").toFixed(1), mean("burden").toFixed(1),
    median(annual.map((value) => value.worstDay)).toFixed(1), worstYear, season,
  ].join(","));
}

const absoluteOutput = resolve(outputPath);
await fs.mkdir(dirname(absoluteOutput), { recursive: true });
await fs.writeFile(absoluteOutput, `${out.join("\n")}\n`);
console.log(`Wrote ${out.length - 1} contiguous-state summaries from ${rowCount.toLocaleString()} smoke-day rows to ${absoluteOutput}.`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
