/*
 * Phase 2 (#12) exit-criterion check: the gold packs and experience
 * observations load into the knowledge model losslessly — including
 * conflicting stances and time-specific schedules — and the new eval-v1
 * constructs (measures, coverage, causal_status, divergences) are expressible
 * against the existing corpus.
 *
 *   node node_modules/tsx/dist/cli.mjs city-profile-stack/scripts/tools/validate-knowledge-model.ts
 *
 * Run from the repo root. No database, no network, no env file.
 */
import { readFileSync } from "node:fs";
import {
  parsePack,
  packToJson,
  parseObservations,
  observationToClaim,
  claimToObservation,
  validateDivergence,
  deepDiff,
  MEASURES,
  type PackFile,
  type Schedule,
  type Divergence,
  type Measures,
} from "../../lib/knowledge-model";

const PACK_FILES = [
  "city-profile-stack/data/gold-packs/elko-tuesday-after-8pm.claims.json",
  "city-profile-stack/data/gold-packs/odessa-vs-elko-after-dark.claims.json",
  "city-profile-stack/data/gold-packs/elko-trans-teenager-insufficient-evidence.claims.json",
  "city-profile-stack/data/gold-packs/elko-marketing-vs-lived.claims.json",
];
const OBSERVATIONS_FILE = "city-profile-stack/data/experience-observations.json";

let failures = 0;
function check(name: string, errors: string[]): void {
  if (errors.length === 0) {
    console.log(`PASS  ${name}`);
  } else {
    failures += errors.length;
    console.log(`FAIL  ${name}`);
    for (const e of errors) console.log(`      - ${e}`);
  }
}

// --- 1. Every pack parses strictly and round-trips byte-for-byte -----------

const packs = new Map<string, PackFile>();
for (const file of PACK_FILES) {
  const raw = JSON.parse(readFileSync(file, "utf8")) as unknown;
  const { value, errors } = parsePack(raw, file);
  packs.set(file, value);
  check(`parse + vocabulary closure: ${file.split("/").pop()}`, errors);
  check(`lossless round-trip: ${file.split("/").pop()}`, deepDiff(raw, packToJson(value)));
}

// Strictness is load-bearing: an unknown field must be an error, never a drop.
{
  const raw = JSON.parse(readFileSync(PACK_FILES[0], "utf8")) as Record<string, unknown>;
  raw.newer_schema_field = true;
  (raw.claims as Record<string, unknown>[])[0].sentiment_score = 0.7;
  const { errors } = parsePack(raw, "strictness-probe");
  check(
    "strictness: unknown fields are rejected, not silently dropped",
    errors.length >= 2 ? [] : ["injected unknown fields were not both reported"]
  );
}

// --- 2. Conflicts survive loading (exit: "including conflicts") ------------

const elko = packs.get(PACK_FILES[0])!;
{
  const stances = new Set(elko.claims.map((c) => c.stance));
  const errors: string[] = [];
  for (const s of ["supports", "contradicts", "attribution_gap"]) {
    if (!stances.has(s)) errors.push(`Elko pack lost its "${s}" pole`);
  }
  check("conflict preservation: both poles + attribution gap load", errors);
}

// --- 3. Time-specific schedules (exit: "time-specific schedules") ----------
// Structured encodings of the Elko pack's five venue claims. Hand-authored on
// purpose (docs §9: schedule structuring is a reviewable act, not parsing).

const WEEK = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
const ELKO_SCHEDULES: Schedule[] = [
  {
    id: "elko_nv/star_hotel/venue",
    place_id: "elko_nv/star_hotel",
    component: "venue",
    rows: [{ days: ["mon", "tue", "wed", "thu", "fri", "sat"], open: "11:00", close: "21:30" }],
    temporal_pattern: "year_round_weekly",
    as_of: "2026-08-07",
    claim_ids: ["C1_star_hotel_hours"],
  },
  {
    id: "elko_nv/matties/kitchen",
    place_id: "elko_nv/matties",
    component: "kitchen",
    rows: [{ days: ["mon", "tue"], open: "11:00", close: "20:00" }],
    temporal_pattern: "year_round_weekly",
    as_of: "2026-08-07",
    claim_ids: ["C2_matties_hours"],
  },
  {
    id: "elko_nv/matties/bar",
    place_id: "elko_nv/matties",
    component: "bar",
    rows: [{ days: [...WEEK], open: "11:00", close: "22:00", approximate: true }],
    temporal_pattern: "year_round_weekly",
    as_of: "2026-08-07",
    claim_ids: ["C2_matties_hours"],
  },
  {
    id: "elko_nv/charlees/venue",
    place_id: "elko_nv/charlees",
    component: "venue",
    rows: [{ days: ["tue"], open: "10:00", close: "02:00", closes_next_day: true }],
    temporal_pattern: "year_round_weekly",
    as_of: "2026-08-07",
    claim_ids: ["C3_charlees_karaoke"],
  },
  {
    id: "elko_nv/charlees/karaoke",
    place_id: "elko_nv/charlees",
    component: "program",
    program_name: "karaoke",
    rows: [{ days: [...WEEK], open: "20:00", close: null }],
    temporal_pattern: "year_round_weekly",
    as_of: "2026-08-07",
    claim_ids: ["C3_charlees_karaoke"],
  },
  {
    id: "elko_nv/rubies/venue",
    place_id: "elko_nv/rubies",
    component: "venue",
    rows: [
      { days: ["tue", "wed", "thu"], open: "16:00", close: "23:00" },
      { days: ["fri", "sat"], open: "16:00", close: "04:00", closes_next_day: true },
    ],
    temporal_pattern: "year_round_weekly",
    as_of: "2026-08-07",
    claim_ids: ["C4_rubies_hours"],
  },
  {
    id: "elko_nv/underground/venue",
    place_id: "elko_nv/underground",
    component: "venue",
    rows: [{ days: ["tue", "wed", "thu", "fri", "sat"], open: "16:30", close: "00:00", closes_next_day: true }],
    temporal_pattern: "year_round_weekly",
    as_of: "2026-08-07",
    claim_ids: ["C5_underground_hours"],
  },
];

{
  const errors: string[] = [];
  const elkoClaimIds = new Set(elko.claims.map((c) => c.id));
  for (const s of ELKO_SCHEDULES) {
    for (const id of s.claim_ids) {
      if (!elkoClaimIds.has(id)) errors.push(`schedule ${s.id} cites unknown claim ${id}`);
    }
  }
  const matties = ELKO_SCHEDULES.filter((s) => s.place_id === "elko_nv/matties");
  if (matties.length !== 2 || matties[0].rows[0].close === matties[1].rows[0].close) {
    errors.push("Mattie's kitchen/bar split lost (the E03-shape hazard)");
  }
  const rubies = ELKO_SCHEDULES.find((s) => s.place_id === "elko_nv/rubies")!;
  if (rubies.rows.length !== 2 || rubies.rows[0].close === rubies.rows[1].close) {
    errors.push("Rubies weekday/weekend day-split lost");
  }
  const karaoke = ELKO_SCHEDULES.find((s) => s.program_name === "karaoke")!;
  if (karaoke.rows[0].open !== "20:00" || karaoke.rows[0].days.length !== 7) {
    errors.push("Charlee's nightly-8pm karaoke program lost");
  }
  check("schedules: components, day-splits, and programs survive structuring", errors);
}

// Schedules must be computable, not just stored: who is open Tuesday 22:30?
{
  const minutes = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3));
  const openAt = (day: (typeof WEEK)[number], time: string) =>
    ELKO_SCHEDULES.filter(
      (s) =>
        s.component !== "program" &&
        s.rows.some(
          (r) =>
            r.days.includes(day) &&
            minutes(r.open) <= minutes(time) &&
            (r.closes_next_day ? true : r.close !== null && minutes(time) < minutes(r.close))
        )
    ).map((s) => s.id);
  const open = openAt("tue", "22:30").sort();
  const expected = ["elko_nv/charlees/venue", "elko_nv/rubies/venue", "elko_nv/underground/venue"];
  check(
    "schedules are computable: Tuesday 22:30 open set matches the pack's answer",
    deepDiff(open, expected)
  );
}

// --- 4. The E09 divergence is real data now (docs §4.4) --------------------
// The marketing pole was captured 2026-08-19 (Packet 1); both poles must load
// as tagged claims from the marketing-vs-lived pack.

{
  const mvl = packs.get(PACK_FILES[3])!;
  const errors: string[] = [];
  const d = (mvl.divergences ?? []).find((x) => x.id === "elko_nv/after_dark_character");
  if (!d) {
    errors.push("the E09 divergence is missing from the marketing-vs-lived pack");
  } else {
    for (const perspective of ["marketing", "lived"]) {
      const pole = d.poles.find((p) => p.perspective === perspective);
      if (!pole || pole.status !== "present" || pole.claim_ids.length === 0) {
        errors.push(`the ${perspective} pole is not present with claims`);
      }
    }
    if (d.stance !== "co_true_different_measures") {
      errors.push(`expected co_true_different_measures, got "${d.stance}"`);
    }
  }
  check("divergence: E09 loads with both poles present as tagged claims", errors);

  const broken: Divergence = {
    id: "probe",
    city: "Elko, NV",
    topic: "probe",
    poles: [{ perspective: "lived", claim_ids: [], status: "present" }],
    stance: "genuine_conflict",
    note: "",
  };
  const caught = validateDivergence(broken, new Set<string>());
  check(
    "divergence: a prose-only pole is rejected (poles must be claims)",
    caught.length >= 2 ? [] : ["a present pole without claims was accepted"]
  );
}

// --- 5. measures annotations resolve against the live pack -----------------
// Venue hours prove doors open (availability); sentiment describes how it
// feels to be there (attendance). The answer layer may not satisfy an
// attendance question with availability evidence alone.

{
  const ANNOTATIONS: Record<string, Measures> = {
    C1_star_hotel_hours: "availability",
    C2_matties_hours: "availability",
    C3_charlees_karaoke: "availability",
    C4_rubies_hours: "availability",
    C5_underground_hours: "availability",
    S1_reddit_narrow_nightlife: "attendance",
    S2_reddit_drinking_centered: "attendance",
  };
  const errors: string[] = [];
  const elkoClaimIds = new Set(elko.claims.map((c) => c.id));
  for (const [id, m] of Object.entries(ANNOTATIONS)) {
    if (!elkoClaimIds.has(id)) errors.push(`measures annotation on unknown claim ${id}`);
    if (!MEASURES.includes(m)) errors.push(`"${m}" is not a registered measure`);
  }
  check("measures: availability/attendance annotations resolve on the Elko pack", errors);
}

// --- 6. Experience observations map losslessly ------------------------------

{
  const raw = JSON.parse(readFileSync(OBSERVATIONS_FILE, "utf8")) as unknown;
  const { value, errors } = parseObservations(raw, OBSERVATIONS_FILE);
  check(`parse + vocabulary closure: experience-observations.json (${value.observations.length} rows)`, errors);

  const roundTrip: string[] = [];
  for (const row of value.observations) {
    roundTrip.push(...deepDiff(row, claimToObservation(observationToClaim(row)), `$.${row.observation_key}`));
  }
  check("lossless round-trip: all observations map to claims and back", roundTrip);
}

// ---------------------------------------------------------------------------

console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} failure(s).`);
process.exit(failures === 0 ? 0 : 1);
