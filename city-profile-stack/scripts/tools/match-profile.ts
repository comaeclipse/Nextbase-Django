/*
 * Matches a person's preferences against every city and explains the result.
 *
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs city-profile-stack/scripts/tools/match-profile.ts city-profile-stack/data/profiles/examples/dry-mountain-remote.json
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs city-profile-stack/scripts/tools/match-profile.ts <file> --explain "Elko, NV"
 *
 * Ranking logic lives in city-profile-stack/lib/city-queries.ts (shared with /chat).
 */
import { readFileSync } from "node:fs";
import {
  matchProfileToCities,
  type Profile,
} from "../../lib/city-queries";

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

const profile = JSON.parse(readFileSync(profilePath, "utf8")) as Profile;

async function main() {
  // Fetch a large slice so --explain can find cities outside the default top-N.
  const result = await matchProfileToCities(profile, { limit: 10_000 });
  const ranked = result.ranked;

  if (explain) {
    const row = ranked.find((s) => s.city === explain);
    if (!row) throw new Error(`No city ${explain}`);
    console.log(`${profile.name}\n  vs  ${row.city}\n`);
    console.log(`match ${row.score.toFixed(3)}${row.disqualified ? "   DISQUALIFIED" : ""}\n`);
    console.log("feature                        city   you wanted            costs  source");
    for (const h of row.hits) {
      const mark = h.dealbroken ? " ✗ DEALBREAKER" : "";
      console.log(
        `${h.feature.padEnd(30)} ${h.cityValue.toFixed(2)}   ${h.wanted.padEnd(20)} ${h.penalty
          .toFixed(3)
          .padStart(6)}  ${h.source}${mark}`
      );
    }
    if (row.unknown.length) console.log(`\nno data for: ${row.unknown.join(", ")}`);
    if (row.disqualified && row.unknown.length) {
      console.log("(missing dealbreaker / requireKnown traits disqualify this city)");
    }
    return;
  }

  console.log(`${profile.name}`);
  if (profile.notes) console.log(profile.notes);
  console.log(
    `\n${result.preferenceCount} preferences, ${result.citiesScored} cities scored\n`
  );
  console.log(result.scopeNote);
  console.log("\nrank  city                     match  biggest problem");
  ranked.slice(0, limit).forEach((s, i) => {
    const tag = s.disqualified ? " [DQ]" : "";
    console.log(
      `${String(i + 1).padStart(4)}  ${s.city.padEnd(24).slice(0, 24)} ${s.score
        .toFixed(3)
        .padStart(5)}${tag}  ${s.topProblem}`
    );
  });

  if (result.disqualifiedCount) {
    console.log(`\n${result.disqualifiedCount} cities disqualified on a dealbreaker or missing required data.`);
  }
  console.log("\nWorst matches:");
  ranked.slice(-3).forEach((s) => {
    const worst = s.hits[0];
    console.log(
      `      ${s.city.padEnd(24).slice(0, 24)} ${s.score.toFixed(3).padStart(5)}  ${
        worst ? `${worst.feature} ${worst.cityValue.toFixed(2)}` : s.topProblem
      }`
    );
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
