/*
 * Ranks which unresearched city is worth writing a dossier for next, and
 * predicts what that dossier will say.
 *
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs city-profile-stack/scripts/tools/rank-dossier-candidates.ts
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs city-profile-stack/scripts/tools/rank-dossier-candidates.ts --like "Elko, NV"
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs city-profile-stack/scripts/tools/rank-dossier-candidates.ts --predict "Great Falls, MT"
 *
 * Three quantities, because they answer different questions:
 *
 *   likeness      — similarity to one named city. Answers "what is the next Elko."
 *   coverage      — similarity to the NEAREST already-researched city. High means
 *                   an existing dossier probably already describes this place, so
 *                   researching it teaches us little.
 *   represents    — how many unresearched cities sit within the similarity
 *                   threshold. High means one dossier would speak for many.
 *
 * Research priority multiplies reach by novelty: represents x (1 - coverage).
 * A city that is both central to an undescribed cluster AND unlike anything
 * already written up is where a dossier buys the most.
 *
 * --predict runs the propagation the pipeline does NOT yet do in production:
 * it borrows editorial values from similar researched cities, similarity-
 * weighted, and prints them as falsifiable predictions. Nothing is written to
 * the database. The point is to make the model commit before the next dossier
 * arrives, so the dossier can prove it wrong.
 */
import { getSql } from "../../../lib/db";
import { FEATURES } from "../../lib/ontology";
import { parsePopulation } from "../../lib/derive";

const args = process.argv.slice(2);
const flag = (name: string): string | null => {
  const i = args.indexOf(name);
  return i === -1 ? null : args[i + 1] ?? null;
};
const likeTarget = flag("--like");
const predictTarget = flag("--predict");

/** Similarity uses only features an unresearched city can actually have. */
const COMPARABLE = new Set(
  FEATURES.filter((f) => f.derivation !== "editorial").map((f) => f.key)
);
const SIMILARITY_THRESHOLD = 0.85;

interface CityInfo {
  id: string;
  label: string;
  population: number | null;
}

type Vector = Map<string, { value: number; confidence: number }>;

function similarity(a: Vector, b: Vector, keys: Iterable<string>): number | null {
  let weighted = 0;
  let weight = 0;
  for (const key of keys) {
    const x = a.get(key);
    const y = b.get(key);
    if (!x || !y) continue;
    const w = Math.min(x.confidence, y.confidence);
    weighted += Math.abs(x.value - y.value) * w;
    weight += w;
  }
  return weight === 0 ? null : 1 - weighted / weight;
}

async function main() {
  const sql = getSql();

  const locations = (await sql.query(
    "SELECT id, name, state, population FROM locations_location"
  )) as { id: string; name: string; state: string; population: string | null }[];
  const info = new Map<string, CityInfo>(
    locations.map((l) => [
      l.id,
      {
        id: l.id,
        label: `${l.name}, ${l.state}`,
        population: parsePopulation(l.population),
      },
    ])
  );
  const idByLabel = new Map([...info.values()].map((c) => [c.label, c.id]));

  const rows = (await sql.query(
    `SELECT location_id, feature_key, value, confidence, provenance
     FROM location_features_resolved`
  )) as {
    location_id: string;
    feature_key: string;
    value: string;
    confidence: string;
    provenance: string;
  }[];

  const comparableVectors = new Map<string, Vector>();
  const editorialVectors = new Map<string, Vector>();
  for (const row of rows) {
    const entry = { value: Number(row.value), confidence: Number(row.confidence) };
    if (COMPARABLE.has(row.feature_key)) {
      let v = comparableVectors.get(row.location_id);
      if (!v) comparableVectors.set(row.location_id, (v = new Map()));
      v.set(row.feature_key, entry);
    }
    if (row.provenance === "editorial") {
      let v = editorialVectors.get(row.location_id);
      if (!v) editorialVectors.set(row.location_id, (v = new Map()));
      v.set(row.feature_key, entry);
    }
  }

  // "Researched" means a stored dossier, not merely some editorial values.
  const dossiers = (await sql.query(
    "SELECT DISTINCT location_id FROM location_research_dossiers"
  )) as { location_id: string }[];
  const researched = new Set(dossiers.map((d) => d.location_id));
  const candidates = [...comparableVectors.keys()].filter((id) => !researched.has(id));

  const simTo = (a: string, b: string): number | null => {
    const va = comparableVectors.get(a);
    const vb = comparableVectors.get(b);
    if (!va || !vb) return null;
    return similarity(va, vb, COMPARABLE);
  };

  // ── --predict ───────────────────────────────────────────────────────────
  if (predictTarget) {
    const targetId = idByLabel.get(predictTarget);
    if (!targetId) throw new Error(`Unknown city: ${predictTarget}`);

    const neighbours = [...researched]
      .map((id) => ({ id, sim: simTo(targetId, id) ?? 0 }))
      .filter((n) => n.sim > 0)
      .sort((a, b) => b.sim - a.sim);

    console.log(`Predicted dossier features for ${predictTarget}`);
    console.log(
      `Borrowed from: ${neighbours
        .map((n) => `${info.get(n.id)!.label} (${n.sim.toFixed(3)})`)
        .join(", ")}\n`
    );
    console.log("These are PREDICTIONS, not stored values. Nothing was written to the database.");
    console.log("A dossier that contradicts them is the useful outcome.\n");

    const keys = new Set<string>();
    for (const n of neighbours) {
      for (const key of editorialVectors.get(n.id)?.keys() ?? []) keys.add(key);
    }

    const predictions: { key: string; value: number; confidence: number; spread: number }[] = [];
    for (const key of keys) {
      let weighted = 0;
      let weight = 0;
      const observed: number[] = [];
      for (const n of neighbours) {
        const entry = editorialVectors.get(n.id)?.get(key);
        if (!entry) continue;
        // Weight by similarity cubed: a 0.92 neighbour should dominate a 0.85 one.
        const w = n.sim ** 3 * entry.confidence;
        weighted += entry.value * w;
        weight += w;
        observed.push(entry.value);
      }
      if (weight === 0) continue;
      const spread = observed.length > 1 ? Math.max(...observed) - Math.min(...observed) : 0;
      predictions.push({
        key,
        value: weighted / weight,
        // Propagated confidence is capped hard and cut further when the
        // researched cities disagree with each other about this feature.
        confidence: Math.min(0.4, 0.4 * neighbours[0].sim * (1 - spread * 0.6)),
        spread,
      });
    }

    predictions.sort((a, b) => a.spread - b.spread || b.confidence - a.confidence);
    console.log("feature                          predicted  conf   sources agree?");
    for (const p of predictions) {
      const agreement =
        p.spread === 0 ? "single source" : p.spread < 0.2 ? "yes" : p.spread < 0.45 ? "partly" : "NO — low value";
      console.log(
        `${p.key.padEnd(32)} ${p.value.toFixed(2).padStart(9)}  ${p.confidence
          .toFixed(2)
          .padStart(4)}   ${agreement}`
      );
    }

    const confident = predictions.filter((p) => p.spread > 0 && p.spread < 0.2);
    console.log(
      `\n${confident.length} feature(s) where all researched cities agree — these are the real predictions.`
    );
    console.log(
      `${predictions.filter((p) => p.spread >= 0.45).length} where they disagree outright — the dossier is the only way to settle those.`
    );
    return;
  }

  // ── ranking ─────────────────────────────────────────────────────────────
  const scored = candidates.map((id) => {
    const coverage = Math.max(
      ...[...researched].map((r) => simTo(id, r) ?? 0),
      0
    );
    const represents = candidates.filter(
      (other) => other !== id && (simTo(id, other) ?? 0) >= SIMILARITY_THRESHOLD
    ).length;
    const likeness = likeTarget ? simTo(id, idByLabel.get(likeTarget)!) ?? 0 : 0;
    return {
      id,
      label: info.get(id)!.label,
      population: info.get(id)!.population,
      coverage,
      represents,
      likeness,
      priority: represents * (1 - coverage),
    };
  });

  if (likeTarget) {
    scored.sort((a, b) => b.likeness - a.likeness);
    console.log(`Unresearched cities most like ${likeTarget}\n`);
    console.log("rank  city                     population  likeness  already covered by a dossier");
    scored.slice(0, 12).forEach((c, i) => {
      console.log(
        `${String(i + 1).padStart(4)}  ${c.label.padEnd(24).slice(0, 24)} ${String(
          c.population ?? "?"
        ).padStart(10)}  ${c.likeness.toFixed(3).padStart(8)}  ${c.coverage.toFixed(3)}`
      );
    });
    return;
  }

  scored.sort((a, b) => b.priority - a.priority);
  console.log(
    `Dossier priority — ${candidates.length} unresearched cities, ${researched.size} researched\n`
  );
  console.log(
    `"represents" = unresearched cities within ${SIMILARITY_THRESHOLD} similarity`
  );
  console.log(`"covered" = similarity to the nearest city that already has a dossier\n`);
  console.log("rank  city                     population  represents  covered  priority");
  scored.slice(0, 15).forEach((c, i) => {
    console.log(
      `${String(i + 1).padStart(4)}  ${c.label.padEnd(24).slice(0, 24)} ${String(
        c.population ?? "?"
      ).padStart(10)}  ${String(c.represents).padStart(10)}  ${c.coverage
        .toFixed(3)
        .padStart(7)}  ${c.priority.toFixed(2).padStart(8)}`
    );
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
