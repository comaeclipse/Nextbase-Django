/*
 * Schema migration for the defense-employer feature.
 *
 *   - creates + seeds `defense_employers` (the employer dimension)
 *   - reshapes `defense_employer_locations` around `employer_id`
 *   - adds `locations_location.defense_hub_manual` and backfills it from the
 *     current curated `defense_hub`
 *
 * Idempotent: safe to re-run. The one step that is NOT safe to repeat blindly is
 * the `defense_hub_manual` backfill — once `defense_hub` becomes derived, copying
 * it back into `defense_hub_manual` would launder computed values into the
 * curated column. It therefore runs only when the column is first created.
 *
 * Usage:
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/migrate-defense-employers.ts [--dry-run]
 */
import { getSql } from "../lib/db";
import { DEFENSE_EMPLOYER_SEEDS, LEGACY_EMPLOYER_ALIASES } from "../lib/defense";

const dryRun = process.argv.includes("--dry-run");
const sql = getSql();

const log = (msg: string) => console.log(`  ${dryRun ? "=" : "+"} ${msg}`);
const skip = (msg: string) => console.log(`  . ${msg}`);

async function run(label: string, text: string, params: unknown[] = []) {
  if (dryRun) {
    log(`${label} (skipped)`);
    return;
  }
  await sql.query(text, params);
  log(label);
}

async function columnExists(table: string, column: string): Promise<boolean> {
  const rows = (await sql.query(
    `SELECT 1 FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = $1 AND column_name = $2`,
    [table, column]
  )) as unknown[];
  return rows.length > 0;
}

async function tableExists(table: string): Promise<boolean> {
  const rows = (await sql.query(`SELECT to_regclass($1) AS t`, [`public.${table}`])) as {
    t: string | null;
  }[];
  return rows[0]?.t != null;
}

async function uniqueConstraintNames(table: string): Promise<string[]> {
  const rows = (await sql.query(
    `SELECT conname FROM pg_constraint
     WHERE conrelid = $1::regclass AND contype = 'u'`,
    [`public.${table}`]
  )) as { conname: string }[];
  return rows.map((r) => r.conname);
}

const NEW_UNIQUE = "defense_employer_locations_employer_city_key";

async function main() {
  console.log(`Defense employer migration${dryRun ? " (dry run)" : ""}\n`);

  // ---------------------------------------------------------------- employers
  console.log("1. defense_employers");
  await run(
    "create table",
    `CREATE TABLE IF NOT EXISTS defense_employers (
      id bigserial PRIMARY KEY,
      slug text NOT NULL UNIQUE,
      display_name text NOT NULL,
      parent_company text NOT NULL,
      sector text NOT NULL,
      counts_as_defense boolean NOT NULL DEFAULT true,
      ats_kind text,
      ats_config jsonb,
      active boolean NOT NULL DEFAULT true,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )`
  );

  for (const e of DEFENSE_EMPLOYER_SEEDS) {
    await run(
      `seed ${e.slug}`,
      `INSERT INTO defense_employers
         (slug, display_name, parent_company, sector, counts_as_defense, ats_kind, ats_config)
       VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)
       ON CONFLICT (slug) DO UPDATE SET
         display_name = EXCLUDED.display_name,
         parent_company = EXCLUDED.parent_company,
         sector = EXCLUDED.sector,
         counts_as_defense = EXCLUDED.counts_as_defense,
         ats_kind = EXCLUDED.ats_kind,
         ats_config = EXCLUDED.ats_config,
         updated_at = now()`,
      [
        e.slug,
        e.display_name,
        e.parent_company,
        e.sector,
        e.counts_as_defense,
        e.ats_kind,
        e.ats_config ? JSON.stringify(e.ats_config) : null,
      ]
    );
  }

  // ------------------------------------------------------- employer locations
  console.log("\n2. defense_employer_locations");
  const hadTable = await tableExists("defense_employer_locations");
  if (!hadTable) {
    await run(
      "create table (fresh, new shape)",
      `CREATE TABLE defense_employer_locations (
        id bigserial PRIMARY KEY,
        employer_id bigint NOT NULL REFERENCES defense_employers(id),
        location_id bigint REFERENCES locations_location(id),
        country text NOT NULL DEFAULT 'US',
        state text NOT NULL,
        city text NOT NULL,
        region_label text NOT NULL DEFAULT '',
        location_name text,
        location_type text,
        latitude numeric,
        longitude numeric,
        onsite_posting_count integer,
        hybrid_posting_count integer,
        remote_posting_count integer,
        total_posting_count integer,
        snapshot_date date,
        source_kind text,
        source_url text,
        source_retrieved_on date,
        is_featured boolean NOT NULL DEFAULT false,
        notes text,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT ${NEW_UNIQUE} UNIQUE (employer_id, country, state, city, region_label)
      )`
    );
  } else {
    skip("table exists — altering in place");
    for (const [col, type] of [
      ["employer_id", "bigint REFERENCES defense_employers(id)"],
      ["location_id", "bigint REFERENCES locations_location(id)"],
      ["latitude", "numeric"],
      ["longitude", "numeric"],
      ["onsite_posting_count", "integer"],
      ["hybrid_posting_count", "integer"],
      ["remote_posting_count", "integer"],
      ["total_posting_count", "integer"],
      ["snapshot_date", "date"],
    ] as const) {
      await run(
        `add column ${col}`,
        `ALTER TABLE defense_employer_locations ADD COLUMN IF NOT EXISTS ${col} ${type}`
      );
    }

    // Backfill employer_id from the legacy free-text pair. In a dry run the
    // ALTERs above were skipped, so employer_id may not exist yet to probe.
    const canProbeEmployerId = await columnExists("defense_employer_locations", "employer_id");
    if (await columnExists("defense_employer_locations", "company_name")) {
      const pairs = canProbeEmployerId
        ? ((await sql.query(
            `SELECT DISTINCT company_name, business_unit FROM defense_employer_locations
             WHERE employer_id IS NULL`
          )) as { company_name: string; business_unit: string }[])
        : ((await sql.query(
            `SELECT DISTINCT company_name, business_unit FROM defense_employer_locations`
          )) as { company_name: string; business_unit: string }[]);

      for (const { company_name, business_unit } of pairs) {
        const slug = LEGACY_EMPLOYER_ALIASES[`${company_name}|${business_unit}`];
        if (!slug) {
          throw new Error(
            `No employer slug for legacy pair "${company_name}|${business_unit}". ` +
              `Add a legacy_alias in lib/defense.ts before migrating.`
          );
        }
        await run(
          `backfill employer_id: ${company_name}/${business_unit} -> ${slug}`,
          `UPDATE defense_employer_locations SET employer_id = e.id
           FROM defense_employers e
           WHERE e.slug = $1 AND defense_employer_locations.employer_id IS NULL
             AND company_name = $2 AND business_unit = $3`,
          [slug, company_name, business_unit]
        );
      }
    }

    if (await columnExists("defense_employer_locations", "active_posting_count")) {
      await run(
        "backfill total_posting_count from active_posting_count",
        `UPDATE defense_employer_locations
         SET total_posting_count = active_posting_count
         WHERE total_posting_count IS NULL AND active_posting_count IS NOT NULL`
      );
    }

    // Resolve the link to curated retirement locations. Most employer cities
    // have no matching row; that is expected and stays NULL.
    await run(
      "backfill location_id by (city, state)",
      `UPDATE defense_employer_locations d SET location_id = l.id
       FROM locations_location l
       WHERE d.location_id IS NULL
         AND lower(d.city) = lower(l.name) AND upper(d.state) = upper(l.state)`
    );

    if (!dryRun) {
      const orphans = (await sql.query(
        `SELECT count(*)::int AS n FROM defense_employer_locations WHERE employer_id IS NULL`
      )) as { n: number }[];
      if (orphans[0].n > 0) {
        throw new Error(`${orphans[0].n} row(s) still have a NULL employer_id; aborting.`);
      }
    }

    await run(
      "employer_id NOT NULL",
      `ALTER TABLE defense_employer_locations ALTER COLUMN employer_id SET NOT NULL`
    );

    // Swap the unique key from the free-text pair to employer_id.
    const existing = await uniqueConstraintNames("defense_employer_locations");
    for (const name of existing) {
      if (name === NEW_UNIQUE) continue;
      await run(
        `drop legacy unique constraint ${name}`,
        `ALTER TABLE defense_employer_locations DROP CONSTRAINT "${name}"`
      );
    }
    if (!existing.includes(NEW_UNIQUE)) {
      await run(
        `add unique constraint ${NEW_UNIQUE}`,
        `ALTER TABLE defense_employer_locations
         ADD CONSTRAINT ${NEW_UNIQUE} UNIQUE (employer_id, country, state, city, region_label)`
      );
    }

    for (const col of ["company_name", "business_unit", "active_posting_count"]) {
      await run(
        `drop legacy column ${col}`,
        `ALTER TABLE defense_employer_locations DROP COLUMN IF EXISTS ${col}`
      );
    }
  }

  await run(
    "index on location_id",
    `CREATE INDEX IF NOT EXISTS defense_employer_locations_location_id_idx
     ON defense_employer_locations (location_id)`
  );

  // -------------------------------------------------- defense_hub_manual
  console.log("\n3. locations_location.defense_hub_manual");
  if (await columnExists("locations_location", "defense_hub_manual")) {
    skip("column already exists — NOT re-backfilling (would overwrite curation)");
  } else if (dryRun) {
    log("add column defense_hub_manual + backfill from defense_hub (skipped)");
  } else {
    await sql.query(`ALTER TABLE locations_location ADD COLUMN defense_hub_manual boolean`);
    await sql.query(`UPDATE locations_location SET defense_hub_manual = defense_hub`);
    log("add column defense_hub_manual + backfill from defense_hub");
  }

  // ------------------------------------------------------------------ report
  if (!dryRun) {
    const dist = (await sql.query(
      `SELECT defense_hub_manual AS v, count(*)::int AS n
       FROM locations_location GROUP BY 1 ORDER BY 1 NULLS LAST`
    )) as { v: boolean | null; n: number }[];
    console.log("\ndefense_hub_manual distribution:");
    for (const r of dist) console.log(`  ${String(r.v)}: ${r.n}`);
  }

  console.log(`\n${dryRun ? "Dry run" : "Migration"} complete.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
