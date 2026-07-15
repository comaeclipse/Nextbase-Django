/*
 * Apply editorial pace review recommendations from the needs_review queue.
 *
 * Inserts a new history row per location with review_state='approved' and an
 * override_category (even when approving the candidate unchanged, so the
 * decision is explicit and preserved on later reruns).
 *
 * Usage:
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/apply-pace-review-recommendations.ts [--dry-run]
 */
import { getSql } from "../lib/db";
import type { PaceCategory } from "../lib/pace";

const dryRun = process.argv.includes("--dry-run");

type Decision = {
  name: string;
  state: string;
  category: PaceCategory;
  reason: string;
};

/** Explicit overrides + bulk-approvals from the review pass. */
const DECISIONS: Decision[] = [
  // Place vs CBSA mismatches
  {
    name: "Malabar",
    state: "FL",
    category: "rural",
    reason: "Palm Bay–Melbourne CBSA inflated score; place is sparse coastal/exurban",
  },
  {
    name: "Burnsville",
    state: "MN",
    category: "suburban",
    reason: "Minneapolis CBSA; south-metro suburb, not principal-city urban",
  },
  {
    name: "Warren",
    state: "MI",
    category: "suburban",
    reason: "Detroit CBSA; large inner suburb rather than principal-city pace",
  },
  {
    name: "Chantilly",
    state: "VA",
    category: "suburban",
    reason: "DC CBSA; edge-city / suburban employment node",
  },
  {
    name: "Bath",
    state: "ME",
    category: "small_town",
    reason: "Shares Portland ME CBSA; Bath itself is a small shipyard town",
  },
  {
    name: "Rome",
    state: "NY",
    category: "small_town",
    reason: "Utica–Rome area; small-city / town pace, not suburban metro",
  },
  {
    name: "Charleston",
    state: "WV",
    category: "small_town",
    reason: "Barely over suburban threshold; small state capital feel",
  },
  {
    name: "Forest",
    state: "MS",
    category: "small_town",
    reason: "Approve small_town candidate; town center with rural surroundings",
  },
  {
    name: "Sierra Vista",
    state: "AZ",
    category: "small_town",
    reason: "Approve small_town candidate; military mid-town",
  },
  {
    name: "King of Prussia",
    state: "PA",
    category: "suburban",
    reason: "Philly CBSA auto-approved urban; place is a classic suburb",
  },
  {
    name: "Bridgeport",
    state: "CT",
    category: "urban",
    reason:
      "Classifier missed CBSA 14860 (CT planning-region FIPS); Bridgeport is a principal city",
  },

  // Principal cities scored high-suburban → urban
  {
    name: "El Paso",
    state: "TX",
    category: "urban",
    reason: "Principal city; CBSA average held score just under urban band",
  },
  {
    name: "San Antonio",
    state: "TX",
    category: "urban",
    reason: "Principal city; CBSA average held score just under urban band",
  },
  {
    name: "Orlando",
    state: "FL",
    category: "urban",
    reason: "Principal city; CBSA average held score just under urban band",
  },
  {
    name: "Norfolk",
    state: "VA",
    category: "urban",
    reason: "Principal city in Hampton Roads; urban core pace",
  },
  {
    name: "Virginia Beach",
    state: "VA",
    category: "suburban",
    reason: "Same CBSA as Norfolk but beach/suburban character for retirees",
  },
  {
    name: "Columbus",
    state: "OH",
    category: "urban",
    reason: "Principal city; promote from high-suburban CBSA score",
  },
  {
    name: "Albuquerque",
    state: "NM",
    category: "urban",
    reason: "Principal city; promote from high-suburban CBSA score",
  },
  {
    name: "Atlanta",
    state: "GA",
    category: "urban",
    reason: "Principal city; promote from high-suburban CBSA score",
  },
  {
    name: "Indianopolis",
    state: "IN",
    category: "urban",
    reason: "Principal city (Indianapolis); promote from high-suburban CBSA score",
  },

  // Bulk-approve remaining urban close-boundary candidates
  ...[
    ["San Diego", "CA"],
    ["Honolulu", "HI"],
    ["Providence", "RI"],
    ["Las Vegas", "NV"],
    ["Phoenix", "AZ"],
    ["Salt Lake City", "UT"],
    ["Houston", "TX"],
    ["Portland", "OR"],
    ["Minneapolis", "MN"],
    ["Baltimore", "MD"],
    ["Milwaukee", "WI"],
    ["New Orleans", "LA"],
  ].map(([name, state]) => ({
    name,
    state,
    category: "urban" as PaceCategory,
    reason: "Approve urban candidate; close_boundary only",
  })),

  // Bulk-approve remaining suburban close-boundary candidates
  ...[
    ["Colorado Springs", "CO"],
    ["Omaha", "NE"],
    ["Tucson", "AZ"],
    ["Cincinnati", "OH"],
    ["Fargo", "ND"],
    ["Raleigh", "NC"],
    ["Louisville", "KY"],
    ["Akron", "OH"],
    ["Anchorage", "AK"],
    ["Syracuse", "NY"],
    ["Des Moines", "IA"],
    ["Wichita", "KS"],
    ["Manchester", "NH"],
    ["Billings", "MT"],
    ["Mobile", "AL"],
    ["Burlington", "VT"],
    ["Greenville", "SC"],
    ["Huntsville", "AL"],
    ["Jackson", "MS"],
    ["Fayetteville", "NC"],
    ["Overland Park", "KS"],
    ["St. Charles", "MO"],
    ["Marietta", "GA"],
    ["Portland", "ME"],
    ["Bremerton", "WA"],
  ].map(([name, state]) => ({
    name,
    state,
    category: "suburban" as PaceCategory,
    reason: "Approve suburban candidate; close_boundary only",
  })),

  // Bulk-approve remaining small_town candidates
  ...[
    ["Jamestown", "ND"],
    ["Decorah", "IA"],
  ].map(([name, state]) => ({
    name,
    state,
    category: "small_town" as PaceCategory,
    reason: "Approve small_town candidate; close_boundary only",
  })),
];

async function main() {
  console.log(
    `Applying ${DECISIONS.length} pace review decision(s)${dryRun ? " (dry run)" : ""}\n`
  );
  const sql = getSql();
  let applied = 0;
  let missing = 0;

  for (const d of DECISIONS) {
    const locs = (await sql.query(
      `SELECT id, name, state FROM locations_location
       WHERE lower(name) = lower($1) AND upper(state) = upper($2)`,
      [d.name, d.state]
    )) as { id: number; name: string; state: string }[];

    if (!locs.length) {
      missing++;
      console.log(`  X not found: ${d.name}, ${d.state}`);
      continue;
    }

    const loc = locs[0];
    const latest = (await sql.query(
      `SELECT id, scope, cbsa_geoid, place_geoid, tract_geoids, census_vintage,
              input_values, source_versions, source_checksums,
              score, candidate_category, confidence, algorithm_version
       FROM location_pace_classifications
       WHERE location_id = $1
       ORDER BY created_at DESC, id DESC
       LIMIT 1`,
      [loc.id]
    )) as Record<string, unknown>[];

    const prev = latest[0];
    const mark = dryRun ? "=" : "+";
    console.log(
      `  ${mark} ${loc.name}, ${loc.state}: → ${d.category}` +
        (prev?.candidate_category && prev.candidate_category !== d.category
          ? ` (was ${prev.candidate_category})`
          : "") +
        ` — ${d.reason}`
    );

    if (dryRun) {
      applied++;
      continue;
    }

    await sql.query(
      `INSERT INTO location_pace_classifications (
         location_id, scope, cbsa_geoid, place_geoid, tract_geoids,
         census_vintage, input_values, source_versions, source_checksums,
         score, candidate_category, confidence, review_state,
         override_category, override_reason, reviewed_at, algorithm_version
       ) VALUES (
         $1, $2, $3, $4, $5::jsonb,
         $6, $7::jsonb, $8::jsonb, $9::jsonb,
         $10, $11, $12, 'approved',
         $13, $14, now(), $15
       )`,
      [
        loc.id,
        prev?.scope ?? "place",
        prev?.cbsa_geoid ?? null,
        prev?.place_geoid ?? null,
        JSON.stringify(prev?.tract_geoids ?? []),
        prev?.census_vintage ?? null,
        JSON.stringify({
          ...(typeof prev?.input_values === "object" && prev.input_values
            ? prev.input_values
            : {}),
          reviewDecision: d.reason,
        }),
        JSON.stringify(prev?.source_versions ?? {}),
        JSON.stringify(prev?.source_checksums ?? {}),
        prev?.score ?? null,
        prev?.candidate_category ?? d.category,
        prev?.confidence ?? null,
        d.category,
        d.reason,
        prev?.algorithm_version ?? "pace-v1",
      ]
    );
    applied++;
  }

  console.log(`\n${dryRun ? "Would apply" : "Applied"}: ${applied}`);
  if (missing) console.log(`Missing locations: ${missing}`);

  if (!dryRun) {
    const dist = await sql.query(
      `SELECT category, count(*)::int AS n
       FROM location_pace_current
       GROUP BY category
       ORDER BY category`
    );
    const remaining = await sql.query(
      `SELECT count(*)::int AS n FROM (
         SELECT location_id
         FROM location_pace_classifications
         GROUP BY location_id
         HAVING (array_agg(review_state ORDER BY created_at DESC, id DESC))[1]
                = 'needs_review'
       ) t`
    );
    console.log("\nlocation_pace_current:", dist);
    console.log("still needs_review (latest):", remaining);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
