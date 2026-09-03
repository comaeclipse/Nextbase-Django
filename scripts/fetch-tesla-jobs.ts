/*
 * Tesla careers — browser-captured defense-slice fetcher (issue #313, Phase 4).
 *
 * Tesla is the one seeded employer with no curl-able feed. Its careers backend
 *   https://www.tesla.com/cua-api/apps/careers/state
 * sits behind Akamai + Tesla's own `cpr_chlge` proof-of-work challenge: a plain
 * server-side GET hard-403s, and even a warmed request 429s the challenge. The
 * only thing that returns the data is a *same-origin* fetch from a real browser
 * tab that has already solved the challenge. So — unlike every other adapter —
 * this is not a live fetch; it parses a hand-captured `state.json`. That is why
 * Tesla is seeded `ats_config.manual: true` with an `ats_kind` that has NO entry
 * in defense-jobs-adapters.ADAPTERS, so `--all` skips it loudly instead of
 * crashing (the castelion / firestorm / palo-alto / cyntel precedent).
 *
 * CAPTURE RECIPE (one manual step, ~30s):
 *   1. Open https://www.tesla.com/careers/search/ in a normal browser and let it
 *      finish loading (this solves the Akamai + cpr_chlge challenge and sets the
 *      cookies). The page's own first `state` call 429s the challenge, then a
 *      second call 200s — wait for the listings to render.
 *   2. Open DevTools → Console and run:
 *        copy(await (await fetch('/cua-api/apps/careers/state')).text())
 *      (The state blob is now on your clipboard, ~1.5 MB.)
 *   3. Paste it into data/tesla_state.json.
 *   4. node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/fetch-tesla-jobs.ts
 *
 * The decode + #336 slice live in lib/tesla-jobs.ts (pure, unit-tested). This
 * file is only argv + file IO. It writes data/tesla_tesla_<date>.csv in the same
 * 15-column shape the importer parses; bridge it into the retire-stale sync with:
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/sync-defense-job-listings.ts \
 *     --employer tesla --from-csv data/tesla_tesla_<date>.csv --apply
 *
 * Note the state blob is LIST-LEVEL (no job descriptions), so the slice matches
 * on title + department only. Tesla's departments are all commercial and its
 * titles rarely name a clearance, so the slice is near-empty today (the x.ai
 * outcome). That is expected, not a bug — a real cleared/gov title is still kept.
 *
 * No DB access. Re-runnable; overwrites the dated CSV.
 *
 * Usage:
 *   ... fetch-tesla-jobs.ts [--input data/tesla_state.json] [--out <path>] [--include-international] [--dry-run]
 */
import { readFileSync, writeFileSync } from "node:fs";
import { teslaStateToRows, TESLA_CSV_HEADER, type TeslaState } from "../lib/tesla-jobs";

const q = (v: unknown): string => '"' + String(v == null ? "" : v).replace(/"/g, '""') + '"';

function main() {
  const args = process.argv.slice(2);
  const get = (flag: string, fallback: string) =>
    args.includes(flag) && args[args.indexOf(flag) + 1] ? args[args.indexOf(flag) + 1] : fallback;

  const today = new Date().toISOString().slice(0, 10);
  const inputPath = get("--input", "data/tesla_state.json");
  const outPath = get("--out", `data/tesla_tesla_${today}.csv`);
  const includeInternational = args.includes("--include-international");
  const dryRun = args.includes("--dry-run");

  console.log("Tesla / cua-api (browser-captured) — defense slice (#336)\n");

  let state: TeslaState;
  try {
    state = JSON.parse(readFileSync(inputPath, "utf-8")) as TeslaState;
  } catch (err) {
    console.error(
      `Could not read a captured careers state from ${inputPath} (${(err as Error).message}).\n` +
        "Capture it first — see the recipe at the top of scripts/fetch-tesla-jobs.ts.",
    );
    process.exit(1);
  }

  const { rows, stats } = teslaStateToRows(state, { includeInternational });

  const lines = [TESLA_CSV_HEADER.map(q).join(",")];
  for (const r of rows) lines.push(TESLA_CSV_HEADER.map((c) => q(r[c])).join(","));

  if (dryRun) {
    console.log(`(dry run) would write ${stats.kept} listing(s) to ${outPath}`);
  } else {
    writeFileSync(outPath, lines.join("\n") + "\n", "utf-8");
    console.log(`Wrote ${stats.kept} listing(s) to ${outPath}`);
  }

  console.log(
    `\nFrom ${stats.total} listing(s): kept ${stats.kept}, dropped ${stats.droppedNotDefense} (not defense-relevant)` +
      (includeInternational ? "" : `, dropped ${stats.droppedNonUs} (non-US)`),
  );
  const byRel = Object.entries(stats.byRelevance).sort((a, b) => b[1] - a[1]);
  if (byRel.length) {
    console.log("By relevance:");
    for (const [k, v] of byRel) console.log(`  ${String(v).padStart(4)}  ${k}`);
  } else {
    console.log("No listing matched the defense slice (expected for Tesla — see the header note).");
  }
}

main();
