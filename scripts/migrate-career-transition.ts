/*
 * Schema migration for the military specialty -> civilian career matcher.
 *
 * Usage:
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/migrate-career-transition.ts [--dry-run]
 */
import { getSql } from "../lib/db";

const dryRun = process.argv.includes("--dry-run");
const sql = getSql();

const log = (msg: string) => console.log(`  ${dryRun ? "=" : "+"} ${msg}`);

async function run(label: string, text: string, params: unknown[] = []) {
  if (dryRun) {
    log(`${label} (skipped)`);
    return;
  }
  await sql.query(text, params);
  log(label);
}

async function main() {
  console.log(`Career-transition migration${dryRun ? " (dry run)" : ""}\n`);

  await run(
    "create military_specialties",
    `CREATE TABLE IF NOT EXISTS military_specialties (
      id bigserial PRIMARY KEY,
      branch text NOT NULL,
      code_system text NOT NULL,
      code text NOT NULL,
      title text NOT NULL,
      population text NOT NULL DEFAULT 'enlisted',
      status text NOT NULL DEFAULT 'current',
      source_kind text NOT NULL,
      source_url text NOT NULL,
      source_retrieved_on date NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT military_specialties_branch_code_key UNIQUE (branch, code_system, code),
      CONSTRAINT military_specialties_population_check CHECK (population IN ('enlisted', 'warrant', 'officer')),
      CONSTRAINT military_specialties_status_check CHECK (status IN ('current', 'legacy', 'unknown'))
    )`
  );

  await run(
    "create civilian_transition_roles",
    `CREATE TABLE IF NOT EXISTS civilian_transition_roles (
      id bigserial PRIMARY KEY,
      slug text NOT NULL UNIQUE,
      title text NOT NULL,
      role_family text NOT NULL,
      onet_soc_code text,
      summary text NOT NULL,
      credential_notes text,
      source_kind text NOT NULL,
      source_url text NOT NULL,
      source_retrieved_on date NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )`
  );

  await run(
    "create specialty_role_matches",
    `CREATE TABLE IF NOT EXISTS specialty_role_matches (
      specialty_id bigint NOT NULL REFERENCES military_specialties(id) ON DELETE CASCADE,
      role_id bigint NOT NULL REFERENCES civilian_transition_roles(id) ON DELETE CASCADE,
      fit_score integer NOT NULL,
      directness text NOT NULL,
      rationale text NOT NULL,
      source_kind text NOT NULL,
      source_url text NOT NULL,
      source_retrieved_on date NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      PRIMARY KEY (specialty_id, role_id),
      CONSTRAINT specialty_role_matches_fit_check CHECK (fit_score BETWEEN 0 AND 100),
      CONSTRAINT specialty_role_matches_directness_check CHECK (directness IN ('direct', 'adjacent', 'requires_gap'))
    )`
  );

  await run(
    "create transition_employers",
    `CREATE TABLE IF NOT EXISTS transition_employers (
      id bigserial PRIMARY KEY,
      slug text NOT NULL UNIQUE,
      display_name text NOT NULL,
      parent_company text,
      employer_type text NOT NULL,
      defense_employer_slug text REFERENCES defense_employers(slug),
      website_url text,
      notes text,
      source_kind text NOT NULL,
      source_url text NOT NULL,
      source_retrieved_on date NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT transition_employers_type_check CHECK (
        employer_type IN ('oem', 'defense_contractor', 'mro', 'civilian_operator', 'commercial_cyber')
      )
    )`
  );

  await run(
    "refresh transition employer type constraint",
    `ALTER TABLE transition_employers
       DROP CONSTRAINT IF EXISTS transition_employers_type_check`
  );
  await run(
    "allow commercial cyber transition employers",
    `ALTER TABLE transition_employers
       ADD CONSTRAINT transition_employers_type_check CHECK (
         employer_type IN ('oem', 'defense_contractor', 'mro', 'civilian_operator', 'commercial_cyber')
       )`
  );

  await run(
    "create specialty_employer_matches",
    `CREATE TABLE IF NOT EXISTS specialty_employer_matches (
      specialty_id bigint NOT NULL REFERENCES military_specialties(id) ON DELETE CASCADE,
      employer_id bigint NOT NULL REFERENCES transition_employers(id) ON DELETE CASCADE,
      fit_score integer NOT NULL,
      directness text NOT NULL,
      platform_tags text[] NOT NULL DEFAULT '{}',
      requires_ap boolean NOT NULL DEFAULT false,
      values_ap boolean NOT NULL DEFAULT false,
      requires_clearance boolean NOT NULL DEFAULT false,
      values_clearance boolean NOT NULL DEFAULT false,
      requires_faa boolean NOT NULL DEFAULT false,
      requires_fcc boolean NOT NULL DEFAULT false,
      snapshot_date date NOT NULL,
      rationale text NOT NULL,
      source_kind text NOT NULL,
      source_url text NOT NULL,
      source_retrieved_on date NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      PRIMARY KEY (specialty_id, employer_id),
      CONSTRAINT specialty_employer_matches_fit_check CHECK (fit_score BETWEEN 0 AND 100),
      CONSTRAINT specialty_employer_matches_directness_check CHECK (directness IN ('direct', 'adjacent', 'requires_gap'))
    )`
  );

  await run(
    "create transition_skills",
    `CREATE TABLE IF NOT EXISTS transition_skills (
      id bigserial PRIMARY KEY,
      slug text NOT NULL UNIQUE,
      title text NOT NULL,
      skill_kind text NOT NULL,
      summary text NOT NULL,
      listing_keywords text[] NOT NULL DEFAULT '{}',
      source_kind text NOT NULL,
      source_url text NOT NULL,
      source_retrieved_on date NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT transition_skills_kind_check CHECK (
        skill_kind IN ('technical', 'domain', 'credential', 'clearance', 'safety')
      )
    )`
  );

  await run(
    "create specialty_skill_matches",
    `CREATE TABLE IF NOT EXISTS specialty_skill_matches (
      specialty_id bigint NOT NULL REFERENCES military_specialties(id) ON DELETE CASCADE,
      skill_id bigint NOT NULL REFERENCES transition_skills(id) ON DELETE CASCADE,
      fit_score integer NOT NULL,
      directness text NOT NULL,
      rationale text NOT NULL,
      source_kind text NOT NULL,
      source_url text NOT NULL,
      source_retrieved_on date NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      PRIMARY KEY (specialty_id, skill_id),
      CONSTRAINT specialty_skill_matches_fit_check CHECK (fit_score BETWEEN 0 AND 100),
      CONSTRAINT specialty_skill_matches_directness_check CHECK (directness IN ('direct', 'adjacent', 'requires_gap'))
    )`
  );

  await run(
    "index military_specialties branch/code",
    `CREATE INDEX IF NOT EXISTS military_specialties_branch_code_idx
     ON military_specialties (branch, code)`
  );
  await run(
    "index transition employers defense link",
    `CREATE INDEX IF NOT EXISTS transition_employers_defense_slug_idx
     ON transition_employers (defense_employer_slug)
     WHERE defense_employer_slug IS NOT NULL`
  );

  console.log(`\n${dryRun ? "Dry run" : "Migration"} complete.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
