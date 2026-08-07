/*
 * Matches a person's preferences against every city and explains the result.
 *
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs city-profile-stack/scripts/tools/match-profile.ts city-profile-stack/data/profiles/examples/dry-mountain-remote.json
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs city-profile-stack/scripts/tools/match-profile.ts <file> --explain "Elko, NV"
 *
 * This is the read side the whole city-feature stack exists to serve.
 *
 * The three matching rules come straight from each feature's `kind`, which is
 * why that field exists:
 *
 *   capacity  — more is better. The user sets a MINIMUM. At or above it costs
 *               nothing; below it the penalty grows with the shortfall. Nobody
 *               is harmed by extra hospitals.
 *   intensity — neither good nor bad. The user sets a TARGET and a TOLERANCE.
 *               Wanting heavy snow and wanting none are both valid; what hurts
 *               is distance from what you asked for, in either direction.
 *   position  — a spectrum with a neutral middle. Distance from target, same
 *               as intensity but without a natural "more is safer" direction.
 *
 * Scoring is deliberately NOT a weighted average. A weighted average lets a
 * dozen small wins bury one disqualifying miss — the same failure that ranked
 * Sierra Vista as similar to Billings across a 56-inch snow gap. Instead each
 * preference produces a penalty, and the final score is driven by the worst
 * ones. A city you would hate for one reason is a city you would hate.
 */
import { readFileSync } from "node:fs";
import { getSql } from "../../../lib/db";
import { getFeature, isFeatureKey } from "../../lib/ontology";

const args = process.argv.slice(2);
const profilePath = args.find((a) => !a.startsWith("--") && a.endsWith(".json"));
const flag = (n: string) => {
  const i = args.indexOf(n);
  return i === -1 ? null : args[i + 1] ?? null;
};
const explain = flag("--explain");
const limit = Number(flag("--limit") ?? 10);

if (!profilePath) {
  console.error('Usage: match-profile.ts <profile.json> [--limit 10] [--explain "City, ST"]');
  process.exit(1);
}

interface Preference {
  /** capacity: the least you will accept. */
  min?: number;
  /**
   * capacity: the MOST you want.
   *
   * Added the first time the matcher was run. "More is better for everyone" is
   * true of hospitals and false of nightlife — someone choosing a quiet town
   * actively wants less of it, and that is a preference, not a low minimum.
   * So a capacity feature accepts min, max, or both.
   */
  max?: number;
  /** intensity / position: what you actually want. */
  target?: number;
  /** intensity / position: how far off is still fine. Defaults to 0.2. */
  tolerance?: number;
  /** 0..1 — how much this matters relative to your other preferences. */
  importance: number;
  /** If true, a city failing this is disqualified outright rather than penalized. */
  dealbreaker?: boolean;
}

interface Profile {
  name: string;
  notes?: string;
  preferences: Record<string, Preference>;
}

const profile = JSON.parse(readFileSync(profilePath, "utf8")) as Profile;

for (const [key, pref] of Object.entries(profile.preferences)) {
  if (!isFeatureKey(key)) throw new Error(`Unknown feature in profile: ${key}`);
  const kind = getFeature(key).kind;
  if (kind === "capacity" && pref.min === undefined && pref.max === undefined) {
    throw new Error(`${key} is a capacity feature — it needs "min" and/or "max"`);
  }
  if (kind !== "capacity" && pref.target === undefined) {
    throw new Error(`${key} is a ${kind} feature — it needs "target", not "min"`);
  }
}

interface Hit {
  feature: string;
  kind: string;
  cityValue: number;
  wanted: string;
  /** 0 = perfect, 1 = maximally wrong, before importance weighting. */
  miss: number;
  /** miss x importance — what this actually costs the city. */
  penalty: number;
  confidence: number;
  provenance: string;
  dealbroken: boolean;
}

/** How badly does `value` violate this preference, 0..1. */
function computeMiss(kind: string, value: number, pref: Preference): number {
  if (kind === "capacity") {
    if (pref.min !== undefined && value < pref.min) {
      // Shortfall scaled by how much room there was to fall short.
      return pref.min <= 0 ? 0 : Math.min(1, (pref.min - value) / pref.min);
    }
    if (pref.max !== undefined && value > pref.max) {
      const room = 1 - pref.max;
      return room <= 0 ? 0 : Math.min(1, (value - pref.max) / room);
    }
    return 0;
  }
  const target = pref.target ?? 0.5;
  const tolerance = pref.tolerance ?? 0.2;
  const distance = Math.abs(value - target);
  if (distance <= tolerance) return 0;
  return Math.min(1, (distance - tolerance) / Math.max(0.001, 1 - tolerance));
}

function describeWant(kind: string, pref: Preference): string {
  if (kind === "capacity") {
    const parts: string[] = [];
    if (pref.min !== undefined) parts.push(`>= ${pref.min.toFixed(2)}`);
    if (pref.max !== undefined) parts.push(`<= ${pref.max.toFixed(2)}`);
    return parts.join(" and ");
  }
  return `about ${(pref.target ?? 0.5).toFixed(2)} (±${(pref.tolerance ?? 0.2).toFixed(2)})`;
}

async function main() {
  const sql = getSql();

  const locations = (await sql.query(
    "SELECT id, name, state, population FROM locations_location"
  )) as { id: string; name: string; state: string; population: string | null }[];
  const info = new Map(locations.map((l) => [l.id, { label: `${l.name}, ${l.state}` }]));

  const rows = (await sql.query(
    "SELECT location_id, feature_key, value, confidence, provenance FROM location_features_resolved"
  )) as {
    location_id: string;
    feature_key: string;
    value: string;
    confidence: string;
    provenance: string;
  }[];

  const byCity = new Map<string, Map<string, { v: number; c: number; p: string }>>();
  for (const r of rows) {
    let m = byCity.get(r.location_id);
    if (!m) byCity.set(r.location_id, (m = new Map()));
    m.set(r.feature_key, { v: Number(r.value), c: Number(r.confidence), p: r.provenance });
  }

  const scored: {
    id: string;
    label: string;
    score: number;
    hits: Hit[];
    unknown: string[];
    disqualified: boolean;
  }[] = [];

  for (const [id, features] of byCity) {
    const hits: Hit[] = [];
    const unknown: string[] = [];
    let disqualified = false;

    for (const [key, pref] of Object.entries(profile.preferences)) {
      const f = features.get(key);
      if (!f) {
        unknown.push(key);
        continue;
      }
      const kind = getFeature(key).kind;
      const miss = computeMiss(kind, f.v, pref);
      // A low-confidence value gets a softened penalty: we should not reject a
      // city hard on a number we are not sure about.
      const penalty = miss * pref.importance * (0.5 + 0.5 * f.c);
      const dealbroken = Boolean(pref.dealbreaker) && miss > 0.25;
      if (dealbroken) disqualified = true;
      hits.push({
        feature: key,
        kind,
        cityValue: f.v,
        wanted: describeWant(kind, pref),
        miss,
        penalty,
        confidence: f.c,
        provenance: f.p,
        dealbroken,
      });
    }

    if (hits.length === 0) continue;

    // Worst-driven, not averaged. The three biggest penalties carry most of the
    // weight, so one disqualifying miss cannot be diluted by many small wins.
    const sorted = [...hits].sort((a, b) => b.penalty - a.penalty);
    const worst = sorted.slice(0, 3).reduce((a, h) => a + h.penalty, 0) / 3;
    const rest =
      sorted.length > 3
        ? sorted.slice(3).reduce((a, h) => a + h.penalty, 0) / (sorted.length - 3)
        : 0;
    const score = Math.max(0, 1 - (0.75 * worst + 0.25 * rest));

    scored.push({ id, label: info.get(id)!.label, score, hits: sorted, unknown, disqualified });
  }

  scored.sort((a, b) => {
    if (a.disqualified !== b.disqualified) return a.disqualified ? 1 : -1;
    return b.score - a.score;
  });

  // ── --explain one city ──────────────────────────────────────────────────
  if (explain) {
    const row = scored.find((s) => s.label === explain);
    if (!row) throw new Error(`No city ${explain}`);
    console.log(`${profile.name}\n  vs  ${row.label}\n`);
    console.log(`match ${row.score.toFixed(3)}${row.disqualified ? "   DISQUALIFIED" : ""}\n`);
    console.log("feature                        city   you wanted            costs  source");
    for (const h of row.hits) {
      const mark = h.dealbroken ? " ✗ DEALBREAKER" : "";
      console.log(
        `${h.feature.padEnd(30)} ${h.cityValue.toFixed(2)}   ${h.wanted.padEnd(20)} ${h.penalty
          .toFixed(3)
          .padStart(6)}  ${h.provenance === "editorial" ? "researched" : "computed"}${mark}`
      );
    }
    if (row.unknown.length) console.log(`\nno data for: ${row.unknown.join(", ")}`);
    return;
  }

  // ── ranking ─────────────────────────────────────────────────────────────
  console.log(`${profile.name}`);
  if (profile.notes) console.log(profile.notes);
  console.log(
    `\n${Object.keys(profile.preferences).length} preferences, ${scored.length} cities scored\n`
  );
  console.log("rank  city                     match  biggest problem");
  scored.slice(0, limit).forEach((s, i) => {
    const worst = s.hits[0];
    const problem =
      worst && worst.penalty > 0.01
        ? `${worst.feature} is ${worst.cityValue.toFixed(2)}, wanted ${worst.wanted}`
        : "nothing significant";
    console.log(
      `${String(i + 1).padStart(4)}  ${s.label.padEnd(24).slice(0, 24)} ${s.score
        .toFixed(3)
        .padStart(5)}  ${problem}`
    );
  });

  const dq = scored.filter((s) => s.disqualified).length;
  if (dq) console.log(`\n${dq} cities disqualified on a dealbreaker.`);
  console.log("\nWorst matches:");
  scored.slice(-3).forEach((s) => {
    const worst = s.hits[0];
    console.log(
      `      ${s.label.padEnd(24).slice(0, 24)} ${s.score.toFixed(3).padStart(5)}  ${
        worst ? `${worst.feature} ${worst.cityValue.toFixed(2)}` : ""
      }`
    );
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
