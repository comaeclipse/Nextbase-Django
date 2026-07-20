import { neon } from "@neondatabase/serverless";
import { GAS_PRICE_DATASET } from "../lib/gas-prices-data";

const sql = neon(process.env.DATABASE_URL ?? "");
const dryRun = process.argv.includes("--dry-run");

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required");
  }

  console.log(`state_gas_prices migration${dryRun ? " (dry run)" : ""}`);

  if (dryRun) {
    console.log(`would upsert ${GAS_PRICE_DATASET.data.length} rows`);
    return;
  }

  await sql`
    CREATE TABLE IF NOT EXISTS state_gas_prices (
      state text NOT NULL,
      state_name text NOT NULL,
      price numeric NOT NULL,
      value integer NOT NULL,
      rank integer NOT NULL,
      band text NOT NULL,
      metric_label text NOT NULL,
      unit text NOT NULL,
      price_unit text NOT NULL,
      blurb text NOT NULL,
      data_vintage text NOT NULL,
      sources text[] NOT NULL,
      methodology text NOT NULL,
      source_file text NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now(),
      PRIMARY KEY (state)
    )
  `;

  const dataset = GAS_PRICE_DATASET;
  for (const row of dataset.data) {
    await sql`
      INSERT INTO state_gas_prices (
        state,
        state_name,
        price,
        value,
        rank,
        band,
        metric_label,
        unit,
        price_unit,
        blurb,
        data_vintage,
        sources,
        methodology,
        source_file,
        updated_at
      )
      VALUES (
        ${row.state},
        ${row.name},
        ${row.price},
        ${row.value},
        ${row.rank},
        ${row.band},
        ${dataset.metricLabel},
        ${dataset.unit},
        ${dataset.priceUnit},
        ${dataset.blurb},
        ${dataset.dataVintage},
        ${dataset.sources},
        ${dataset.methodology},
        ${"data/us_state_gas_prices.csv"},
        now()
      )
      ON CONFLICT (state) DO UPDATE SET
        state_name = EXCLUDED.state_name,
        price = EXCLUDED.price,
        value = EXCLUDED.value,
        rank = EXCLUDED.rank,
        band = EXCLUDED.band,
        metric_label = EXCLUDED.metric_label,
        unit = EXCLUDED.unit,
        price_unit = EXCLUDED.price_unit,
        blurb = EXCLUDED.blurb,
        data_vintage = EXCLUDED.data_vintage,
        sources = EXCLUDED.sources,
        methodology = EXCLUDED.methodology,
        source_file = EXCLUDED.source_file,
        updated_at = now()
    `;
  }
  console.log(`upserted ${dataset.data.length} rows`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
