/**
 * Pull FBI Crime Data Explorer (CDE) agency counts for a list of cities and
 * compute each city's Total Crime Index with the fixed method in
 * lib/crime-index.ts (data/sources/crime/TCI_METHODOLOGY.md). No DB access:
 * it reads an input list of (location id, ORI) pairs and writes a patch file
 * that scripts/apply-location-patches.ts applies after the PR merges.
 *
 * The CDE web app's own backend is keyless (unlike api.usa.gov, which needs
 * an api.data.gov key and rate-limits DEMO_KEY within minutes):
 *   https://cde.ucr.cjis.gov/LATEST/summarized/agency/{ORI}/{violent-crime|property-crime}?from=MM-YYYY&to=MM-YYYY
 * Each response carries the agency's monthly offense counts ("actuals"), its
 * covered population, and per-100k rates. Summing the 12 monthly actuals gives
 * the annual count; population is constant across the year.
 *
 * Year selection follows the methodology's NIBRS-gap rule: a city is indexed
 * against the newest year in NATIONAL_CRIME_REFERENCE_BY_YEAR for which the
 * agency reported all 12 months (see monthsReported); otherwise it is reported
 * as blocked, never indexed from a placeholder zero.
 *
 * Usage:
 *   node node_modules/tsx/dist/cli.mjs scripts/fetch-cde-tci.ts \
 *     --input data/sources/crime/cde_tci_backfill_2026-09-02.input.json \
 *     --out   data/sources/crime/cde_tci_backfill_2026-09-02.json
 */
import { readFileSync, writeFileSync } from "node:fs";
import {
  NATIONAL_CRIME_REFERENCE_BY_YEAR,
  ratesFromCounts,
  totalCrimeIndexBreakdown,
} from "../lib/crime-index";

interface InputRow {
  id: number;
  name: string;
  state: string;
  ori: string;
  agency: string;
  agency_kind: "city" | "county";
}

type MonthSeries = Record<string, number | null>;

interface CdeResponse {
  offenses: {
    rates: Record<string, MonthSeries>;
    actuals: Record<string, MonthSeries>;
  };
  populations: { population: Record<string, MonthSeries> };
}

interface YearPull {
  year: number;
  agency_label: string;
  months_reported: number;
  violent_count: number;
  property_count: number;
  population: number;
}

export interface TciPatchRow {
  id: number;
  name: string;
  state: string;
  fields: { tci: number; crime: string };
  method: string;
  source_url: string;
  evidence: {
    ori: string;
    agency: string;
    agency_kind: string;
    fbi_year: number;
    violent_count: number;
    property_count: number;
    covered_population: number;
    violent_rate_per_100k: number;
    property_rate_per_100k: number;
    violent_index: number;
    property_index: number;
    national_reference: { violent: number; property: number };
  };
}

interface BlockedRow {
  id: number;
  name: string;
  state: string;
  ori: string;
  agency: string;
  reason: string;
  years_tried: YearPull[];
}

const BASE = "https://cde.ucr.cjis.gov/LATEST/summarized/agency";

function arg(flag: string): string {
  const i = process.argv.indexOf(flag);
  if (i === -1 || !process.argv[i + 1]) throw new Error(`Missing ${flag}`);
  return process.argv[i + 1];
}

async function fetchJson(url: string): Promise<CdeResponse> {
  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return (await res.json()) as CdeResponse;
}

function total(series: MonthSeries | undefined): number {
  if (!series) return 0;
  let n = 0;
  for (const v of Object.values(series)) n += v ?? 0;
  return n;
}

/**
 * Months the agency actually reported. A small town legitimately logs zero
 * violent offenses in a month, so a month counts when BOTH families are
 * present (non-null) and at least one offense of either kind was recorded;
 * the CDE's placeholder for a non-reporting month is null or an all-zero row.
 */
function monthsReported(violent: MonthSeries | undefined, property: MonthSeries | undefined): number {
  if (!violent || !property) return 0;
  let months = 0;
  for (const m of Object.keys(violent)) {
    const v = violent[m];
    const p = property[m];
    if (v != null && p != null && v + p > 0) months += 1;
  }
  return months;
}

/**
 * The agency's display label. `offenses.actuals` carries only the agency's own
 * lines ("<Agency> Offenses" / "<Agency> Clearances"), unlike `rates` and
 * `populations`, which also carry the state and "United States" — and a state
 * name can tie an agency name on word count ("District of Columbia" vs
 * "Washington Police Department"), so the label is never inferred from those.
 */
function agencyLabelFrom(actuals: Record<string, MonthSeries>): string {
  const key = Object.keys(actuals).find((k) => k.endsWith(" Offenses"));
  if (!key) throw new Error(`CDE response has no "<Agency> Offenses" line (keys: ${Object.keys(actuals).join(", ")})`);
  return key.slice(0, -" Offenses".length);
}

async function pullYear(row: InputRow, year: number): Promise<YearPull> {
  const q = `from=01-${year}&to=12-${year}`;
  const [v, p] = await Promise.all([
    fetchJson(`${BASE}/${row.ori}/violent-crime?${q}`),
    fetchJson(`${BASE}/${row.ori}/property-crime?${q}`),
  ]);
  const agencyLabel = agencyLabelFrom(v.offenses.actuals);
  const expectedHead = row.agency.toLowerCase().split(" ")[0];
  if (!agencyLabel.toLowerCase().startsWith(expectedHead)) {
    throw new Error(
      `Agency mismatch for ${row.ori}: CDE says "${agencyLabel}", input says "${row.agency}"`,
    );
  }
  const popSeries = v.populations.population[agencyLabel];
  const population = popSeries ? Math.max(...Object.values(popSeries).map((x) => x ?? 0)) : 0;
  const violentSeries = v.offenses.actuals[`${agencyLabel} Offenses`];
  const propertySeries = p.offenses.actuals[`${agencyLabel} Offenses`];
  return {
    year,
    agency_label: agencyLabel,
    months_reported: monthsReported(violentSeries, propertySeries),
    violent_count: total(violentSeries),
    property_count: total(propertySeries),
    population,
  };
}

async function main() {
  const input = JSON.parse(readFileSync(arg("--input"), "utf8")) as { rows: InputRow[] };
  const out = arg("--out");
  const years = Object.keys(NATIONAL_CRIME_REFERENCE_BY_YEAR)
    .map(Number)
    .sort((a, b) => b - a);

  const patches: TciPatchRow[] = [];
  const blocked: BlockedRow[] = [];

  for (const row of input.rows) {
    const tried: YearPull[] = [];
    let done = false;
    for (const year of years) {
      const pull = await pullYear(row, year);
      tried.push(pull);
      const label =
        `${row.name}, ${row.state} ${year}: ${pull.agency_label} pop ${pull.population} ` +
        `violent ${pull.violent_count} property ${pull.property_count} months ${pull.months_reported}`;
      const usable = pull.months_reported === 12 && pull.violent_count > 0 && pull.population > 0;
      if (!usable) {
        console.log(`  skip ${label}`);
        continue;
      }
      const reference = NATIONAL_CRIME_REFERENCE_BY_YEAR[year];
      const rates = ratesFromCounts({
        violentCount: pull.violent_count,
        propertyCount: pull.property_count,
        population: pull.population,
      });
      const b = totalCrimeIndexBreakdown(rates, reference);
      console.log(`  ok   ${label} -> TCI ${b.tci} (${b.label}; v${b.violentIndex}/p${b.propertyIndex})`);
      patches.push({
        id: row.id,
        name: row.name,
        state: row.state,
        fields: { tci: b.tci, crime: b.label },
        method:
          row.agency_kind === "county"
            ? `FBI CDE ${year} counts for ${pull.agency_label} (county sheriff proxy: the town has no municipal police agency in the CDE), indexed per TCI_METHODOLOGY.md`
            : `FBI CDE ${year} counts for ${pull.agency_label}, indexed per TCI_METHODOLOGY.md`,
        source_url: `${BASE}/${row.ori}/violent-crime?from=01-${year}&to=12-${year}`,
        evidence: {
          ori: row.ori,
          agency: pull.agency_label,
          agency_kind: row.agency_kind,
          fbi_year: year,
          violent_count: pull.violent_count,
          property_count: pull.property_count,
          covered_population: pull.population,
          violent_rate_per_100k: Math.round(rates.violentRatePer100k * 10) / 10,
          property_rate_per_100k: Math.round(rates.propertyRatePer100k * 10) / 10,
          violent_index: b.violentIndex,
          property_index: b.propertyIndex,
          national_reference: {
            violent: reference.violentRatePer100k,
            property: reference.propertyRatePer100k,
          },
        },
      });
      done = true;
      break;
    }
    if (!done) {
      blocked.push({
        id: row.id,
        name: row.name,
        state: row.state,
        ori: row.ori,
        agency: row.agency,
        reason:
          "no stored reference year in which the agency reported all 12 months with a non-zero annual violent count " +
          "(usually a NIBRS coverage gap; a tiny agency with a genuine zero-offense month is also held back on purpose)",
        years_tried: tried,
      });
    }
  }

  const file = {
    retrieved_on: new Date().toISOString().slice(0, 10),
    source: "FBI Crime Data Explorer, summarized agency endpoint (cde.ucr.cjis.gov)",
    method: "data/sources/crime/TCI_METHODOLOGY.md via lib/crime-index.ts",
    patches,
    blocked,
  };
  writeFileSync(out, JSON.stringify(file, null, 2) + "\n");
  console.log(`\nwrote ${out}: ${patches.length} patches, ${blocked.length} blocked`);
  for (const b of blocked) console.log(`  BLOCKED ${b.name}, ${b.state} (${b.agency})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
