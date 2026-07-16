import { unstable_cache } from "next/cache";
import { getSql } from "@/lib/db";
import {
  STATE_WEATHER_INDEX_DATASETS,
  UV_INDEX_DATASET,
  type StateWeatherIndexDataset,
  type StateWeatherIndexSlug,
  type StateWeatherIndexValue,
} from "@/lib/state-weather-data";
import type { BandName } from "@/lib/critters";

type StateWeatherIndexRow = {
  index_slug: StateWeatherIndexSlug;
  index_label: string;
  metric_label: string;
  unit: string;
  blurb: string;
  state: string;
  state_name: string;
  value: number | string;
  rank: number | string;
  band: BandName;
  annual_mean_solar_noon_uvi: number | string | null;
  peak_monthly_mean_uvi: number | string | null;
  peak_month: string | null;
  data_vintage: string;
  sources: string[] | string;
  methodology: string;
};

const STATIC_BY_SLUG: Record<StateWeatherIndexSlug, StateWeatherIndexDataset> = {
  uv: UV_INDEX_DATASET,
};

function toNumber(value: number | string | null): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value);
  return 0;
}

function normalizeRow(row: StateWeatherIndexRow): StateWeatherIndexValue {
  return {
    state: row.state,
    name: row.state_name,
    value: toNumber(row.value),
    rank: toNumber(row.rank),
    band: row.band,
    annualMeanSolarNoonUvi: toNumber(row.annual_mean_solar_noon_uvi),
    peakMonthlyMeanUvi: toNumber(row.peak_monthly_mean_uvi),
    peakMonth: row.peak_month ?? "",
  };
}

function datasetFromRows(
  slug: StateWeatherIndexSlug,
  rows: StateWeatherIndexRow[]
): StateWeatherIndexDataset {
  const first = rows[0];
  const fallback = STATIC_BY_SLUG[slug];
  if (!first) return fallback;

  const sources = Array.isArray(first.sources)
    ? first.sources
    : String(first.sources)
        .split("|")
        .map((source) => source.trim())
        .filter(Boolean);

  return {
    slug,
    label: first.index_label,
    metricLabel: first.metric_label,
    unit: first.unit,
    blurb: first.blurb,
    dataVintage: first.data_vintage,
    sources,
    methodology: first.methodology,
    data: rows.map(normalizeRow).sort((a, b) => a.rank - b.rank),
  };
}

export const getStateWeatherIndex = unstable_cache(
  async (slug: StateWeatherIndexSlug): Promise<StateWeatherIndexDataset> => {
    const sql = getSql();
    try {
      const rows = (await sql`
        SELECT *
        FROM state_weather_indices
        WHERE index_slug = ${slug}
        ORDER BY rank ASC
      `) as StateWeatherIndexRow[];

      return datasetFromRows(slug, rows);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes("state_weather_indices")) {
        return STATIC_BY_SLUG[slug];
      }
      throw err;
    }
  },
  ["state-weather:getStateWeatherIndex"],
  { revalidate: 3600 }
);

export { STATE_WEATHER_INDEX_DATASETS };
