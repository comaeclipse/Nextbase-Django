/*
 * Unified sync for defense_job_listings (issue #313, Phase 3).
 *
 * Pulls an employer's current openings from the board recorded in its seed
 * (DEFENSE_EMPLOYER_SEEDS.ats_kind / ats_config), upserts them (reopening any
 * that reappear), and RETIRES the ones that are gone by stamping closed_at — the
 * piece the plain importer never did. For a commercial / dual-use employer
 * (counts_as_defense: false) it ingests only the #336 defense slice via
 * classifyDefenseRelevance().
 *
 * Two ways an employer's rows reach the engine:
 *   1. An in-process adapter (this file): Greenhouse / Lever / Ashby — pure public
 *      JSON APIs, so the pull lives here.
 *   2. --from-csv <path>: for boards whose pull is a standalone fetcher
 *      (scripts/fetch-*.ts: cisco/workday, oracle_orc, amazon_jobs, microsoft &
 *      northrop eightfold, hii successfactors, usajobs). Run that fetcher, then
 *      hand its CSV here to upsert + prune through the same engine. Those CSVs are
 *      already sliced, so --from-csv does not re-classify.
 *
 * Safety (issue #313):
 *   - Default is a DRY RUN (reads the DB, prints the plan, writes nothing). Pass
 *     --apply to write.
 *   - A failed or empty pull NEVER prunes (an adapter error or zero rows skips the
 *     employer, so a transient outage can't wipe its listings).
 *   - The prune refuses to close >80% of an employer's currently-open rows without
 *     --force (a board that changed shape shouldn't mass-retire silently).
 *   - --no-prune upserts only.
 *
 * Every run writes the pulled CSV to data/<slug>_<ats>_<date>.csv (same audit
 * trail as a manual ingest). Requires .env (DATABASE_URL) for anything but a pure
 * pull. Never run two Eightfold pulls at once (that adapter is a standalone
 * fetcher; not driven from here yet).
 *
 * Usage:
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/sync-defense-job-listings.ts --employer <slug> [--apply] [--no-prune] [--force]
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/sync-defense-job-listings.ts --all [--apply]
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/sync-defense-job-listings.ts --employer cisco --from-csv data/cisco_workday_2026-09-03.csv [--apply]
 */
import { writeFileSync, readFileSync } from "node:fs";
import { parse } from "csv-parse/sync";
import { getSql } from "../lib/db";
import { DEFENSE_EMPLOYER_SEEDS, type EmployerSeed } from "../lib/defense";
import { classifyDefenseRelevance } from "../lib/defense-jobs-slice";
import { importListingsCsv } from "./import-defense-job-listings";

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36";
const CSV_HEADER = [
  "Company", "ATS", "Title", "Field", "Team", "Location", "Region",
  "Employment", "PayMin", "PayMax", "PayInterval", "Education", "URL",
  "DefenseRelevance", "DefenseSignal",
] as const;

/** A pulled listing: the base CSV columns plus the text the slice classifier reads. */
interface Pulled {
  row: Record<string, string>;
  title: string;
  description: string;
  businessUnit: string;
}

const q = (v: unknown): string => '"' + String(v == null ? "" : v).replace(/"/g, '""') + '"';
const stripHtml = (h: string | null | undefined): string =>
  (h ?? "").replace(/<[^>]+>/g, " ").replace(/&[a-z#0-9]+;/gi, " ").replace(/\s+/g, " ").trim();

/** Best-effort Region from a freeform location string. */
function region(loc: string): string {
  const s = (loc ?? "").trim();
  if (/\bremote\b/i.test(s)) return "US/Remote";
  if (/,\s*[A-Z]{2}$/.test(s)) return "US (CONUS)";
  return ""; // let the importer geocode / default to US
}

function baseRow(seed: EmployerSeed, ats: string, o: {
  title: string; field?: string; team?: string; location: string; url: string; employment?: string;
}): Record<string, string> {
  return {
    Company: seed.display_name, ATS: ats, Title: o.title, Field: o.field ?? "", Team: o.team ?? "",
    Location: o.location, Region: region(o.location), Employment: o.employment ?? "",
    PayMin: "", PayMax: "", PayInterval: "", Education: "", URL: o.url,
    DefenseRelevance: "", DefenseSignal: "",
  };
}

// ---- In-process adapters (public JSON boards) -------------------------------

async function greenhouse(seed: EmployerSeed): Promise<Pulled[]> {
  const board = String(seed.ats_config?.board);
  const res = await fetch(`https://boards-api.greenhouse.io/v1/boards/${board}/jobs?content=true`, {
    headers: { Accept: "application/json", "User-Agent": UA },
  });
  if (!res.ok) throw new Error(`greenhouse HTTP ${res.status}`);
  const json = (await res.json()) as { jobs?: { title: string; location?: { name?: string }; absolute_url: string; departments?: { name: string }[]; content?: string }[] };
  return (json.jobs ?? []).map((j) => {
    const description = stripHtml(j.content);
    const field = (j.departments ?? []).map((d) => d.name).join(" / ");
    return {
      row: baseRow(seed, "Greenhouse", { title: j.title, field, location: j.location?.name ?? "", url: j.absolute_url }),
      title: j.title, description, businessUnit: field,
    };
  });
}

async function lever(seed: EmployerSeed): Promise<Pulled[]> {
  const board = String(seed.ats_config?.board);
  const res = await fetch(`https://api.lever.co/v0/postings/${board}?mode=json`, {
    headers: { Accept: "application/json", "User-Agent": UA },
  });
  if (!res.ok) throw new Error(`lever HTTP ${res.status}`);
  const json = (await res.json()) as { text: string; categories?: { location?: string; team?: string; commitment?: string }; descriptionPlain?: string; hostedUrl: string }[];
  return (json ?? []).map((p) => {
    const team = p.categories?.team ?? "";
    return {
      row: baseRow(seed, "Lever", { title: p.text, field: team, team, location: p.categories?.location ?? "", url: p.hostedUrl, employment: p.categories?.commitment ?? "" }),
      title: p.text, description: p.descriptionPlain ?? "", businessUnit: team,
    };
  });
}

async function ashby(seed: EmployerSeed): Promise<Pulled[]> {
  const board = String(seed.ats_config?.board);
  const res = await fetch(`https://api.ashbyhq.com/posting-api/job-board/${board}?includeCompensation=true`, {
    headers: { Accept: "application/json", "User-Agent": UA },
  });
  if (!res.ok) throw new Error(`ashby HTTP ${res.status}`);
  const json = (await res.json()) as { jobs?: { title: string; location?: string; department?: string; team?: string; employmentType?: string; descriptionPlain?: string; jobUrl: string }[] };
  return (json.jobs ?? []).map((j) => {
    const field = [j.department, j.team].filter(Boolean).join(" / ");
    return {
      row: baseRow(seed, "Ashby", { title: j.title, field, team: j.team ?? "", location: j.location ?? "", url: j.jobUrl, employment: j.employmentType ?? "" }),
      title: j.title, description: j.descriptionPlain ?? "", businessUnit: field,
    };
  });
}

const ADAPTERS: Record<string, (seed: EmployerSeed) => Promise<Pulled[]>> = {
  greenhouse, lever, ashby,
};

// ---- Sync engine ------------------------------------------------------------

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Apply the #336 slice: prime employers keep everything; commercial ones are filtered + tagged. */
function applySlice(seed: EmployerSeed, pulled: Pulled[]): Pulled[] {
  const kept: Pulled[] = [];
  for (const p of pulled) {
    const v = classifyDefenseRelevance(
      { title: p.title, description: p.description, businessUnit: p.businessUnit },
      { countsAsDefense: seed.counts_as_defense },
    );
    if (v.relevance === null) continue;
    p.row.DefenseRelevance = v.relevance;
    p.row.DefenseSignal = v.signal ?? "";
    kept.push(p);
  }
  return kept;
}

/** Read a pre-pulled CSV (from a standalone fetcher) into the row shape. Already sliced. */
function rowsFromCsv(path: string): Record<string, string>[] {
  return parse(readFileSync(path, "utf-8"), { columns: true, skip_empty_lines: true, bom: true });
}

function writeCsv(path: string, rows: Record<string, string>[]): void {
  const lines = [CSV_HEADER.map(q).join(",")];
  for (const r of rows) lines.push(CSV_HEADER.map((c) => q(r[c])).join(","));
  writeFileSync(path, lines.join("\n") + "\n", "utf-8");
}

interface SyncOpts { apply: boolean; noPrune: boolean; force: boolean; pullOnly: boolean }

/** The lifecycle columns this sync depends on must exist (issue #313 Phase 1). */
async function ensureSchema(): Promise<void> {
  const sql = getSql();
  const cols = (await sql.query(
    "SELECT column_name FROM information_schema.columns WHERE table_name = 'defense_job_listings' AND column_name IN ('last_seen_at', 'closed_at')",
  )) as { column_name: string }[];
  if (cols.length < 2) {
    throw new Error(
      "defense_job_listings is missing last_seen_at/closed_at — run scripts/migrate-defense-job-listings.ts first (issue #313 Phase 1).",
    );
  }
}

async function syncEmployer(seed: EmployerSeed, rows: Record<string, string>[], csvPath: string, opts: SyncOpts): Promise<void> {
  const label = `${seed.display_name} (${seed.slug})`;
  const pulledUrls = rows.map((r) => r.URL).filter(Boolean);
  const uniqueUrls = [...new Set(pulledUrls)];

  // Guard: a failed/empty pull must never prune.
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
  const ats = seed.ats_kind ?? "unknown";
  const csvPath = fromCsv ?? `data/${seed.slug}_${ats}_${today}.csv`;

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
    let pulled: Pulled[];
    try {
      pulled = await adapter(seed);
    } catch (err) {
      console.log(`  ${seed.display_name} (${seed.slug}): pull FAILED (${(err as Error).message}) — skipping, no prune.`);
      return;
    }
    rows = applySlice(seed, pulled).map((p) => p.row);
  }

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
  };

  if (!employer && !all) {
    console.error("Usage: sync-defense-job-listings --employer <slug> [--from-csv <path>] | --all  [--apply] [--no-prune] [--force] [--pull-only]");
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
    // In-process-adapter employers only; the rest need their standalone fetcher + --from-csv.
    seeds = DEFENSE_EMPLOYER_SEEDS.filter((s) => s.ats_kind && ADAPTERS[s.ats_kind]);
    console.log(`--all: ${seeds.length} employer(s) with an in-process adapter (greenhouse/lever/ashby).\n`);
  } else {
    const seed = DEFENSE_EMPLOYER_SEEDS.find((s) => s.slug === employer);
    if (!seed) {
      console.error(`Unknown employer slug "${employer}".`);
      process.exit(1);
    }
    seeds = [seed];
  }

  for (const seed of seeds) {
    await runEmployer(seed, opts, all ? undefined : fromCsv);
    if (all) await sleep(300); // be polite to the boards
  }

  console.log(`\n${opts.pullOnly ? "Pull-only" : opts.apply ? "Sync" : "Dry run"} complete.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
