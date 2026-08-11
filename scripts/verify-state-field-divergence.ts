/**
 * Reports duplicated state-owned fields that disagree across location rows.
 *
 * This is a read-only audit for the normalization work tracked in GitHub issue
 * #5. It intentionally checks the legacy duplicated columns on
 * locations_location so drift stays visible until sourced values are
 * adjudicated into locations_stateinfo.
 *
 * Usage:
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/verify-state-field-divergence.ts
 */
import { getSql } from "../lib/db";

const STATE_OWNED_LOCATION_COLUMNS = [
  "state_party",
  "governor",
  "income_tax",
  "veterans_benefits",
  "marijuana_status",
  "lgbtq_state_policy_score",
] as const;

type StateOwnedColumn = (typeof STATE_OWNED_LOCATION_COLUMNS)[number];
const normalizedOnly = process.argv.includes("--normalized-only");

const NORMALIZED_READY_SQL: Record<StateOwnedColumn, string> = {
  state_party: "state_party IS NOT NULL AND state_party_source_url IS NOT NULL AND state_party_verified_on IS NOT NULL",
  governor: "governor IS NOT NULL AND governor_source_url IS NOT NULL AND governor_verified_on IS NOT NULL",
  income_tax:
    "income_tax IS NOT NULL AND income_tax_semantics IS NOT NULL AND income_tax_source_url IS NOT NULL AND income_tax_verified_on IS NOT NULL",
  veterans_benefits:
    "vet_benefits_summary IS NOT NULL AND vet_benefits_source_url IS NOT NULL AND vet_benefits_verified_on IS NOT NULL",
  marijuana_status:
    "marijuana_status IS NOT NULL AND marijuana_status_source_url IS NOT NULL AND marijuana_status_verified_on IS NOT NULL",
  lgbtq_state_policy_score:
    "lgbtq_state_policy_score IS NOT NULL AND lgbtq_state_policy_source_url IS NOT NULL AND lgbtq_state_policy_verified_on IS NOT NULL",
};

interface DivergenceRow {
  state: string;
  rows: number;
  distinct_non_null: number;
  values: unknown[];
}

async function divergentStates(column: StateOwnedColumn): Promise<DivergenceRow[]> {
  const sql = getSql();
  return (await sql.query(
    `
      SELECT state,
             count(*)::int AS rows,
             count(DISTINCT ${column}) FILTER (WHERE ${column} IS NOT NULL)::int AS distinct_non_null,
             array_agg(DISTINCT ${column}) FILTER (WHERE ${column} IS NOT NULL) AS values
      FROM locations_location
      GROUP BY state
      HAVING count(DISTINCT ${column}) FILTER (WHERE ${column} IS NOT NULL) > 1
      ORDER BY state
    `,
    []
  )) as DivergenceRow[];
}

async function normalizedResolvedStates(column: StateOwnedColumn, states: string[]): Promise<Set<string>> {
  if (states.length === 0) return new Set();
  const sql = getSql();
  const rows = (await sql.query(
    `
      SELECT state
      FROM locations_stateinfo
      WHERE state = ANY($1)
        AND ${NORMALIZED_READY_SQL[column]}
      ORDER BY state
    `,
    [states]
  )) as { state: string }[];
  return new Set(rows.map((row) => row.state));
}

async function main() {
  if (normalizedOnly) {
    const sql = getSql();
    const incomeTaxRows = (await sql.query(
      `
        SELECT state
        FROM locations_stateinfo
        WHERE income_tax IS NOT NULL
          AND (
            income_tax_semantics IS NULL
            OR income_tax_source_url IS NULL
            OR income_tax_verified_on IS NULL
          )
        ORDER BY state
      `,
      []
    )) as { state: string }[];

    const statePartyRows = (await sql.query(
      `
        SELECT state
        FROM locations_stateinfo
        WHERE state_party IS NOT NULL
          AND (
            state_party_source_url IS NULL
            OR state_party_verified_on IS NULL
          )
        ORDER BY state
      `,
      []
    )) as { state: string }[];

    const governorRows = (await sql.query(
      `
        SELECT state
        FROM locations_stateinfo
        WHERE governor IS NOT NULL
          AND (
            governor_source_url IS NULL
            OR governor_verified_on IS NULL
          )
        ORDER BY state
      `,
      []
    )) as { state: string }[];

    const marijuanaRows = (await sql.query(
      `
        SELECT state
        FROM locations_stateinfo
        WHERE marijuana_status IS NOT NULL
          AND (
            marijuana_status_source_url IS NULL
            OR marijuana_status_verified_on IS NULL
          )
        ORDER BY state
      `,
      []
    )) as { state: string }[];

    const lgbtqRows = (await sql.query(
      `
        SELECT state
        FROM locations_stateinfo
        WHERE lgbtq_state_policy_score IS NOT NULL
          AND (
            lgbtq_state_policy_source_url IS NULL
            OR lgbtq_state_policy_verified_on IS NULL
          )
        ORDER BY state
      `,
      []
    )) as { state: string }[];

    const vetBenefitsRows = (await sql.query(
      `
        SELECT state
        FROM locations_stateinfo
        WHERE vet_benefits_summary IS NOT NULL
          AND (
            vet_benefits_source_url IS NULL
            OR vet_benefits_verified_on IS NULL
          )
        ORDER BY state
      `,
      []
    )) as { state: string }[];

    if (statePartyRows.length) {
      console.error("Normalized state_party rows missing source/verified metadata:");
      for (const row of statePartyRows) console.error(`  - ${row.state}`);
      process.exitCode = 1;
      return;
    }
    if (governorRows.length) {
      console.error("Normalized governor rows missing source/verified metadata:");
      for (const row of governorRows) console.error(`  - ${row.state}`);
      process.exitCode = 1;
      return;
    }
    if (incomeTaxRows.length) {
      console.error("Normalized income_tax rows missing semantics/source/verified metadata:");
      for (const row of incomeTaxRows) console.error(`  - ${row.state}`);
      process.exitCode = 1;
      return;
    }
    if (marijuanaRows.length) {
      console.error("Normalized marijuana_status rows missing source/verified metadata:");
      for (const row of marijuanaRows) console.error(`  - ${row.state}`);
      process.exitCode = 1;
      return;
    }
    if (lgbtqRows.length) {
      console.error("Normalized lgbtq_state_policy_score rows missing source/verified metadata:");
      for (const row of lgbtqRows) console.error(`  - ${row.state}`);
      process.exitCode = 1;
      return;
    }
    if (vetBenefitsRows.length) {
      console.error("Normalized vet_benefits_summary rows missing source/verified metadata:");
      for (const row of vetBenefitsRows) console.error(`  - ${row.state}`);
      process.exitCode = 1;
      return;
    }
    console.log("normalized state_party: all populated rows have source URL and verified date");
    console.log("normalized governor: all populated rows have source URL and verified date");
    console.log("normalized income_tax: all populated rows have semantics, source URL, and verified date");
    console.log("normalized marijuana_status: all populated rows have source URL and verified date");
    console.log("normalized lgbtq_state_policy_score: all populated rows have source URL and verified date");
    console.log("normalized vet_benefits_summary: all populated rows have source URL and verified date");
    return;
  }

  let unresolvedTotal = 0;

  for (const column of STATE_OWNED_LOCATION_COLUMNS) {
    const rows = await divergentStates(column);
    if (rows.length === 0) {
      console.log(`${column}: no divergence`);
      continue;
    }

    const resolved = await normalizedResolvedStates(column, rows.map((row) => row.state));
    const unresolved = rows.filter((row) => !resolved.has(row.state));
    if (unresolved.length === 0) {
      console.log(`${column}: ${rows.length} legacy divergent state(s), all resolved by sourced locations_stateinfo rows`);
      continue;
    }

    unresolvedTotal += unresolved.length;
    console.error(`${column}: ${unresolved.length} unresolved divergent state(s) (${rows.length} legacy divergent total)`);
    for (const row of unresolved) {
      console.error(
        `  - ${row.state}: ${row.distinct_non_null} values across ${row.rows} rows: ${row.values
          .map((value) => JSON.stringify(value))
          .join(", ")}`
      );
    }
  }

  if (unresolvedTotal > 0) {
    console.error(
      `Unresolved state-field divergence found in ${unresolvedTotal} field/state pair(s). Resolve with sourced locations_stateinfo values before treating these fields as normalized.`
    );
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
