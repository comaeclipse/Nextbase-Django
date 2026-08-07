/*
 * Finds the cities most like a given city, using the resolved feature vector.
 *
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs city-profile-stack/scripts/tools/find-similar-locations.ts "Elko, NV" [--limit 10]
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs city-profile-stack/scripts/tools/find-similar-locations.ts "Billings, MT" --explain "Sierra Vista, AZ"
 *
 * WHY THIS IS NOT A SINGLE NUMBER
 *
 * The first version averaged absolute differences across every comparable
 * feature. That ranked Sierra Vista AZ as the 3rd most similar city to Billings
 * MT at 0.854 — two cities that differ by roughly 56 inches of annual snow and
 * 20F of winter low. One categorical mismatch was averaged against twenty
 * near-matches in unrelated categories and vanished.
 *
 * Raising the norm did not fix it (Sierra Vista rose to 2nd at p=3), because
 * the problem was never the aggregator's shape. It was that compatibility
 * between places is CONJUNCTIVE: a city is "like" another only if nothing
 * about it would blindside you. An arithmetic mean models the opposite —
 * that abundance on one axis compensates for absence on another.
 *
 * So similarity is reported as a profile: per-category scores, the weakest
 * category, and any single feature diverging past DIVERGENCE_THRESHOLD.
 * Ranking is by the weakest category, with overall as the tiebreak.
 *
 * Similarity is computed only over features BOTH cities have, and only over
 * structurally derivable ones — otherwise a researched city would look unlike
 * every unresearched city purely because it has more data.
 */
import { getSql } from "../../../lib/db";
import { FEATURES, getFeature } from "../../lib/ontology";
import { parsePopulation } from "../../lib/derive";

const args = process.argv.slice(2);
const target = args.find((a) => !a.startsWith("--") && a.includes(","));
const flag = (name: string): string | null => {
  const i = args.indexOf(name);
  return i === -1 ? null : args[i + 1] ?? null;
};
const limit = Number(flag("--limit") ?? 10);
const explain = flag("--explain");

if (!target) {
  console.error(
    'Usage: find-similar-locations.ts "Elko, NV" [--limit 10] [--explain "Other City, ST"]'
  );
  process.exit(1);
}
const [cityName, stateAbbr] = target.split(",").map((s) => s.trim());

/** Only features that can exist for an unresearched city are comparable. */
const COMPARABLE = new Set(
  FEATURES.filter((f) => f.derivation !== "editorial").map((f) => f.key)
);

/** A single feature differing by this much is reported outright, never averaged away. */
const DIVERGENCE_THRESHOLD = 0.3;

type Vector = Map<string, { value: number; confidence: number }>;

interface Profile {
  overall: number;
  byCategory: Map<string, number>;
  weakest: { category: string; score: number };
  divergences: { feature: string; a: number; b: number; diff: number }[];
}

function compare(a: Vector, b: Vector): Profile | null {
  const buckets = new Map<string, { sum: number; weight: number }>();
  const divergences: Profile["divergences"] = [];
  let allSum = 0;
  let allWeight = 0;

  for (const [key, x] of a) {
    if (!COMPARABLE.has(key)) continue;
    const y = b.get(key);
    if (!y) continue;
    const w = Math.min(x.confidence, y.confidence);
    const diff = Math.abs(x.value - y.value);
    allSum += diff * w;
    allWeight += w;

    const category = getFeature(key).category;
    const bucket = buckets.get(category) ?? { sum: 0, weight: 0 };
    bucket.sum += diff * w;
    bucket.weight += w;
    buckets.set(category, bucket);

    if (diff >= DIVERGENCE_THRESHOLD) {
      divergences.push({ feature: key, a: x.value, b: y.value, diff });
    }
  }
  if (allWeight === 0) return null;

  const byCategory = new Map<string, number>();
  let weakest: { category: string; score: number } | null = null;
  for (const [category, { sum, weight }] of buckets) {
    if (weight === 0) continue;
    const score = 1 - sum / weight;
    byCategory.set(category, score);
    if (weakest === null || score < weakest.score) weakest = { category, score };
  }
  if (weakest === null) return null;

  divergences.sort((p, q) => q.diff - p.diff);
  return { overall: 1 - allSum / allWeight, byCategory, weakest, divergences };
}

async function main() {
  const sql = getSql();

  const locations = (await sql.query(
    "SELECT id, name, state, population FROM locations_location"
  )) as { id: string; name: string; state: string; population: string | null }[];
  const info = new Map(
    locations.map((l) => [
      l.id,
      { label: `${l.name}, ${l.state}`, population: parsePopulation(l.population) },
    ])
  );
  const idByLabel = new Map([...info].map(([id, c]) => [c.label, id]));

  const anchorId = idByLabel.get(`${cityName}, ${stateAbbr}`);
  if (!anchorId) throw new Error(`No location for ${target}`);

  const rows = (await sql.query(
    "SELECT location_id, feature_key, value, confidence FROM location_features_resolved"
  )) as { location_id: string; feature_key: string; value: string; confidence: string }[];

  const vectors = new Map<string, Vector>();
  for (const row of rows) {
    if (!COMPARABLE.has(row.feature_key)) continue;
    let v = vectors.get(row.location_id);
    if (!v) vectors.set(row.location_id, (v = new Map()));
    v.set(row.feature_key, { value: Number(row.value), confidence: Number(row.confidence) });
  }

  const anchor = vectors.get(anchorId);
  if (!anchor) throw new Error(`${target} has no comparable features`);

  // ── --explain: full profile for one pair ────────────────────────────────
  if (explain) {
    const otherId = idByLabel.get(explain);
    if (!otherId) throw new Error(`No location for ${explain}`);
    const profile = compare(anchor, vectors.get(otherId)!);
    if (!profile) throw new Error("No overlapping features");

    console.log(`${info.get(anchorId)!.label}  vs  ${info.get(otherId)!.label}\n`);
    console.log(`overall (mean, the misleading number): ${profile.overall.toFixed(3)}`);
    console.log(
      `weakest category (what ranking now uses): ${profile.weakest.category} ${profile.weakest.score.toFixed(3)}\n`
    );
    console.log("category      similarity");
    [...profile.byCategory.entries()]
      .sort((p, q) => p[1] - q[1])
      .forEach(([category, score]) =>
        console.log(`${category.padEnd(13)} ${score.toFixed(3)}`)
      );

    if (profile.divergences.length > 0) {
      console.log(`\nDivergences >= ${DIVERGENCE_THRESHOLD}:`);
      console.log("feature                        this   that   diff");
      for (const d of profile.divergences) {
        console.log(
          `${d.feature.padEnd(30)} ${d.a.toFixed(2)}   ${d.b.toFixed(2)}   ${d.diff.toFixed(2)}`
        );
      }
    } else {
      console.log(`\nNo single feature diverges by ${DIVERGENCE_THRESHOLD} or more.`);
    }
    return;
  }

  // ── ranking ─────────────────────────────────────────────────────────────
  const scored: { label: string; population: number | null; profile: Profile }[] = [];
  for (const [id, vector] of vectors) {
    if (id === anchorId) continue;
    const profile = compare(anchor, vector);
    if (profile) scored.push({ label: info.get(id)!.label, population: info.get(id)!.population, profile });
  }

  // Conjunctive ranking: weakest category first, overall only as a tiebreak.
  scored.sort(
    (a, b) => b.profile.weakest.score - a.profile.weakest.score || b.profile.overall - a.profile.overall
  );

  console.log(`Cities most like ${info.get(anchorId)!.label}\n`);
  console.log("Ranked by WEAKEST category — a city is only alike if nothing about it blindsides you.\n");
  console.log("rank  city                     population  weakest category      overall  biggest divergence");
  scored.slice(0, limit).forEach((row, i) => {
    const w = row.profile.weakest;
    const top = row.profile.divergences[0];
    console.log(
      `${String(i + 1).padStart(4)}  ${row.label.padEnd(24).slice(0, 24)} ${String(
        row.population ?? "?"
      ).padStart(10)}  ${(w.category + " " + w.score.toFixed(2)).padEnd(20)}  ${row.profile.overall
        .toFixed(3)
        .padStart(7)}  ${top ? `${top.feature} ${top.diff.toFixed(2)}` : "none"}`
    );
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
