import { neon } from "@neondatabase/serverless";
import { STATE_WEATHER_INDEX_DATASETS } from "../lib/state-weather-data";

const sql = neon(process.env.DATABASE_URL ?? "");
const dryRun = process.argv.includes("--dry-run");

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required");
  }

  console.log(`state_weather_indices migration${dryRun ? " (dry run)" : ""}`);
  console.log(`datasets: ${STATE_WEATHER_INDEX_DATASETS.map((d) => d.slug).join(", ")}`);

  if (dryRun) {
    for (const dataset of STATE_WEATHER_INDEX_DATASETS) {
      console.log(`${dataset.slug}: would upsert ${dataset.data.length} rows`);
    }
    return;
  }

  await sql`
    CREATE TABLE IF NOT EXISTS state_weather_indices (
      index_slug text NOT NULL,
      state text NOT NULL,
      state_name text NOT NULL,
      index_label text NOT NULL,
      metric_label text NOT NULL,
      unit text NOT NULL,
      blurb text NOT NULL,
      value numeric NOT NULL,
      rank integer NOT NULL,
      band text NOT NULL,
      annual_mean_solar_noon_uvi numeric,
      peak_monthly_mean_uvi numeric,
      peak_month text,
      data_vintage text NOT NULL,
      sources text[] NOT NULL,
      methodology text NOT NULL,
      source_file text NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now(),
      PRIMARY KEY (index_slug, state)
    )
  `;

  for (const dataset of STATE_WEATHER_INDEX_DATASETS) {
    for (const row of dataset.data) {
      await sql`
        INSERT INTO state_weather_indices (
          index_slug,
          state,
          state_name,
          index_label,
          metric_label,
          unit,
          blurb,
          value,
          rank,
          band,
          annual_mean_solar_noon_uvi,
          peak_monthly_mean_uvi,
          peak_month,
          data_vintage,
          sources,
          methodology,
          source_file,
          updated_at
        )
        VALUES (
          ${dataset.slug},
          ${row.state},
          ${row.name},
          ${dataset.label},
          ${dataset.metricLabel},
          ${dataset.unit},
          ${dataset.blurb},
          ${row.value},
          ${row.rank},
          ${row.band},
          ${row.annualMeanSolarNoonUvi},
          ${row.peakMonthlyMeanUvi},
          ${row.peakMonth},
          ${dataset.dataVintage},
          ${dataset.sources},
          ${dataset.methodology},
          ${`data/us_state_${dataset.slug}_index.csv`},
          now()
        )
        ON CONFLICT (index_slug, state) DO UPDATE SET
          state_name = EXCLUDED.state_name,
          index_label = EXCLUDED.index_label,
          metric_label = EXCLUDED.metric_label,
          unit = EXCLUDED.unit,
          blurb = EXCLUDED.blurb,
          value = EXCLUDED.value,
          rank = EXCLUDED.rank,
          band = EXCLUDED.band,
          annual_mean_solar_noon_uvi = EXCLUDED.annual_mean_solar_noon_uvi,
          peak_monthly_mean_uvi = EXCLUDED.peak_monthly_mean_uvi,
          peak_month = EXCLUDED.peak_month,
          data_vintage = EXCLUDED.data_vintage,
          sources = EXCLUDED.sources,
          methodology = EXCLUDED.methodology,
          source_file = EXCLUDED.source_file,
          updated_at = now()
      `;
    }
    console.log(`${dataset.slug}: upserted ${dataset.data.length} rows`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
