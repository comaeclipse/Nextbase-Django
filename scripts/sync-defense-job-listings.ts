/*
 * Unified sync for defense_job_listings (issue #313, Phase 3).
 *
 * Pulls an employer's current openings from the board recorded in its seed
 * (DEFENSE_EMPLOYER_SEEDS.ats_kind / ats_config), upserts them (reopening any
 * that reappear), and RETIRES the ones that are gone by stamping closed_at — the
 * piece the plain importer never did. For a commercial / dual-use employer
 * (counts_as_defense: false) it ingests only the #336 defense slice.
 *
 * The per-vendor pull lives in scripts/defense-jobs-adapters.ts (one place,
 * shared with the standalone fetch-*.ts CLIs). This file is the engine: pull ->
 * slice/US-filter -> upsert (via importListingsCsv) -> prune stale -> summary.
 *
 * Rows reach the engine two ways:
 *   1. An in-process adapter (ADAPTERS): greenhouse / lever / ashby / workday /
 *      oracle_orc / amazon_jobs / eightfold — driven straight from the seed.
 *   2. --from-csv <path>: for boards without an in-process adapter yet
 *      (successfactors/HII, usajobs) — run their standalone fetcher, hand the
 *      (already-sliced) CSV here to upsert + prune through the same engine.
 *
 * Safety (issue #313):
 *   - Default is a DRY RUN (reads the DB, prints the plan, writes nothing). Pass
 *     --apply to write.
 *   - A failed or empty pull NEVER prunes.
 *   - The prune refuses to close >80% of an employer's currently-open rows without
 *     --force. --no-prune upserts only.
 *   - A preflight requires the Phase-1 last_seen_at/closed_at columns.
 *
 * Every apply writes data/<slug>_<ats>_<date>.csv (audit trail). Requires .env
 * (DATABASE_URL) for anything but --pull-only.
 *
 * Usage:
 *   ... sync-defense-job-listings.ts --employer <slug> [--apply] [--no-prune] [--force] [--include-international]
 *   ... sync-defense-job-listings.ts --all [--apply]
 *   ... sync-defense-job-listings.ts --employer cisco --from-csv data/cisco_workday_<date>.csv [--apply]
 *   ... sync-defense-job-listings.ts --employer anduril --pull-only     # writes the CSV, no DB
 */
import { writeFileSync, readFileSync } from "node:fs";
import { parse } from "csv-parse/sync";
import { getSql } from "../lib/db";
import { DEFENSE_EMPLOYER_SEEDS, type EmployerSeed } from "../lib/defense";
import { importListingsCsv } from "./import-defense-job-listings";
import { ADAPTERS, sliceAndFilter, CSV_HEADER } from "./defense-jobs-adapters";

const q = (v: unknown): string => '"' + String(v == null ? "" : v).replace(/"/g, '""') + '"';
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function writeCsv(path: string, rows: Record<string, string>[]): void {
  const lines = [CSV_HEADER.map(q).join(",")];
  for (const r of rows) lines.push(CSV_HEADER.map((c) => q(r[c])).join(","));
  writeFileSync(path, lines.join("\n") + "\n", "utf-8");
}

function rowsFromCsv(path: string): Record<string, string>[] {
  return parse(readFileSync(path, "utf-8"), { columns: true, skip_empty_lines: true, bom: true });
}

interface SyncOpts { apply: boolean; noPrune: boolean; force: boolean; pullOnly: boolean; includeInternational: boolean }

/** The lifecycle columns this sync depends on must exist (issue #313 Phase 1). */
async function ensureSchema(): Promise<void> {
  const cols = (await getSql().query(
    "SELECT column_name FROM information_schema.columns WHERE table_name = 'defense_job_listings' AND column_name IN ('last_seen_at', 'closed_at')",
  )) as { column_name: string }[];
  if (cols.length < 2) {
    throw new Error("defense_job_listings is missing last_seen_at/closed_at — run scripts/migrate-defense-job-listings.ts first (issue #313 Phase 1).");
  }
}

async function syncEmployer(seed: EmployerSeed, rows: Record<string, string>[], csvPath: string, opts: SyncOpts): Promise<void> {
  const label = `${seed.display_name} (${seed.slug})`;
  const uniqueUrls = [...new Set(rows.map((r) => r.URL).filter(Boolean))];

  if (uniqueUrls.length === 0) {
    console.log(`  ${label}: 0 rows pulled — skipping (never prune on an empty pull).`);
    return;
  }

  const sql = getSql();
  const existing = (await sql.query(
    "SELECT url, closed_at FROM defense_job_listings WHERE employer_slug = $1",
    [seed.slug],
  )) as { url: string; closed_at: string | null }[];
  const openUrls = new Set(existing.filter((r) => !r.closed_at).map((r) => r.url));
  const closedUrls = new Set(existing.filter((r) => r.closed_at).map((r) => r.url));
  const pulledSet = new Set(uniqueUrls);

  const created = uniqueUrls.filter((u) => !openUrls.has(u) && !closedUrls.has(u)).length;
  const reopened = uniqueUrls.filter((u) => closedUrls.has(u)).length;
  const updated = uniqueUrls.filter((u) => openUrls.has(u)).length;
  const toClose = [...openUrls].filter((u) => !pulledSet.has(u));
  const closeFrac = openUrls.size ? toClose.length / openUrls.size : 0;
  const pruneBlocked = !opts.noPrune && openUrls.size > 0 && closeFrac > 0.8 && !opts.force;

  console.log(
    `  ${label}: pulled ${uniqueUrls.length} | new ${created}, updated ${updated}, reopened ${reopened}, ` +
      `${opts.noPrune ? "prune off" : `would close ${toClose.length}/${openUrls.size} open (${Math.round(closeFrac * 100)}%)`}` +
      `${pruneBlocked ? " ⚠ >80% — refusing to prune without --force" : ""}`,
  );

  if (!opts.apply) return;

  writeCsv(csvPath, rows); // audit trail, same as a manual ingest
  await importListingsCsv(csvPath, {}); // upsert + reopen (closed_at = NULL)

  if (opts.noPrune) return;
  if (pruneBlocked) {
    console.log(`  ${label}: prune skipped (>80% guard). Re-run with --force if the board really shrank.`);
    return;
  }
  if (toClose.length > 0) {
    await sql.query(
      "UPDATE defense_job_listings SET closed_at = now() WHERE employer_slug = $1 AND closed_at IS NULL AND NOT (url = ANY($2))",
      [seed.slug, uniqueUrls],
    );
    console.log(`  ${label}: closed ${toClose.length} stale listing(s).`);
  }
}

async function runEmployer(seed: EmployerSeed, opts: SyncOpts, fromCsv: string | undefined): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);
  const csvPath = fromCsv ?? `data/${seed.slug}_${seed.ats_kind ?? "unknown"}_${today}.csv`;

  let rows: Record<string, string>[];
  if (fromCsv) {
    rows = rowsFromCsv(fromCsv); // already pulled + sliced by a standalone fetcher
  } else {
    const adapter = seed.ats_kind ? ADAPTERS[seed.ats_kind] : undefined;
    if (!adapter) {
      console.log(
        `  ${seed.display_name} (${seed.slug}): no in-process adapter for ats_kind="${seed.ats_kind ?? "null"}". ` +
          `Run its standalone fetcher (scripts/fetch-*.ts), then re-run with --from-csv <path>.`,
      );
      return;
    }
    try {
      rows = sliceAndFilter(seed, await adapter(seed), { includeInternational: opts.includeInternational });
    } catch (err) {
      console.log(`  ${seed.display_name} (${seed.slug}): pull FAILED (${(err as Error).message}) — skipping, no prune.`);
      return;
    }
  }

  // Dedup by URL (the upsert conflict key): a chunk with two rows sharing a URL
  // makes Postgres' ON CONFLICT fail (21000). Keep the first occurrence.
  const seenUrl = new Set<string>();
  rows = rows.filter((r) => r.URL && !seenUrl.has(r.URL) && (seenUrl.add(r.URL), true));

  if (opts.pullOnly) {
    writeCsv(csvPath, rows);
    const byRel: Record<string, number> = {};
    for (const r of rows) byRel[r.DefenseRelevance || "?"] = (byRel[r.DefenseRelevance || "?"] ?? 0) + 1;
    console.log(`  ${seed.display_name} (${seed.slug}): pulled ${rows.length} listing(s) -> ${csvPath} | ${JSON.stringify(byRel)}`);
    return;
  }

  await syncEmployer(seed, rows, csvPath, opts);
}

async function main() {
  const args = process.argv.slice(2);
  const get = (flag: string) => (args.includes(flag) ? args[args.indexOf(flag) + 1] : undefined);
  const employer = get("--employer");
  const fromCsv = get("--from-csv");
  const all = args.includes("--all");
  const opts: SyncOpts = {
    apply: args.includes("--apply"), noPrune: args.includes("--no-prune"),
    force: args.includes("--force"), pullOnly: args.includes("--pull-only"),
    includeInternational: args.includes("--include-international"),
  };

  if (!employer && !all) {
    console.error("Usage: sync-defense-job-listings --employer <slug> [--from-csv <path>] | --all  [--apply] [--no-prune] [--force] [--pull-only] [--include-international]");
    process.exit(1);
  }
  if (all && fromCsv) {
    console.error("--from-csv is per-employer; use it with --employer, not --all.");
    process.exit(1);
  }

  console.log(
    opts.pullOnly
      ? "Defense job-listings sync (PULL ONLY — writes CSVs, no DB)\n"
      : `Defense job-listings sync${opts.apply ? "" : " (DRY RUN — no writes; pass --apply)"}\n`,
  );
  if (!opts.pullOnly) await ensureSchema();

  let seeds: EmployerSeed[];
  if (all) {
    seeds = DEFENSE_EMPLOYER_SEEDS.filter((s) => s.ats_kind && ADAPTERS[s.ats_kind]);
    console.log(`--all: ${seeds.length} employer(s) with an in-process adapter.\n`);
  } else {
    const seed = DEFENSE_EMPLOYER_SEEDS.find((s) => s.slug === employer);
    if (!seed) { console.error(`Unknown employer slug "${employer}".`); process.exit(1); }
    seeds = [seed];
  }

  for (const seed of seeds) {
    await runEmployer(seed, opts, all ? undefined : fromCsv);
    if (all) await sleep(300);
  }

  console.log(`\n${opts.pullOnly ? "Pull-only" : opts.apply ? "Sync" : "Dry run"} complete.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
