import { unstable_cache } from "next/cache";
import { getSql } from "@/lib/db";
import {
  GAS_PRICE_DATASET,
  type GasPriceDataset,
  type GasPriceValue,
} from "@/lib/gas-prices-data";
import type { BandName } from "@/lib/critters";

type GasPriceRow = {
  state: string;
  state_name: string;
  price: number | string;
  value: number | string;
  rank: number | string;
  band: BandName;
  metric_label: string;
  unit: string;
  price_unit: string;
  blurb: string;
  data_vintage: string;
  sources: string[] | string;
  methodology: string;
};

function toNumber(value: number | string | null): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value);
  return 0;
}

function normalizeRow(row: GasPriceRow): GasPriceValue {
  return {
    state: row.state,
    name: row.state_name,
    price: toNumber(row.price),
    value: toNumber(row.value),
    rank: toNumber(row.rank),
    band: row.band,
  };
}

function datasetFromRows(rows: GasPriceRow[]): GasPriceDataset {
  const first = rows[0];
  if (!first) return GAS_PRICE_DATASET;

  const sources = Array.isArray(first.sources)
    ? first.sources
    : String(first.sources)
        .split("|")
        .map((source) => source.trim())
        .filter(Boolean);

  return {
    metricLabel: first.metric_label,
    unit: first.unit,
    priceUnit: first.price_unit,
    blurb: first.blurb,
    dataVintage: first.data_vintage,
    sources,
    methodology: first.methodology,
    data: rows.map(normalizeRow).sort((a, b) => a.rank - b.rank),
  };
}

export const getGasPrices = unstable_cache(
  async (): Promise<GasPriceDataset> => {
    try {
      const sql = getSql();
      const rows = (await sql`
        SELECT *
        FROM state_gas_prices
        ORDER BY rank ASC
      `) as GasPriceRow[];

      return datasetFromRows(rows);
    } catch (err) {
      // Degrade gracefully to the static dataset whenever the DB can't serve
      // (table missing, or no DATABASE_URL / connection failure) so the public
      // page never 500s. The DB stays the source of truth when it is reachable.
      const message = err instanceof Error ? err.message : String(err);
      console.warn(`getGasPrices: falling back to static dataset (${message})`);
      return GAS_PRICE_DATASET;
    }
  },
  ["gas-prices:getGasPrices"],
  { revalidate: 3600 }
);

export { GAS_PRICE_DATASET };
export type { GasPriceDataset, GasPriceValue };
