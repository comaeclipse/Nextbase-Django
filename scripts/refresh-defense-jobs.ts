/**
 * #366 operational runbook: collect without DB access; Apply immutable merged snapshots.
 *
 * Collection: refresh-defense-jobs.ts collect --run UNIQUE_ID [--employers air,gci]
 * Review and merge data/defense-job-refresh/UNIQUE_ID/{manifest.json,*.csv}.
 * Apply: fetch origin/master, check it out, then run this script with `apply`
 * (read-only) before `apply --apply`. Never run a second local operator beside
 * the defense-jobs-apply Actions concurrency group. Pending batches are scanned
 * in capture order, reconciled by exact open URLs, and checkpointed for retry.
 * Then run purge-closed-job-listings.ts dry/live and verify-csv-imports.ts.
 *
 * Palo Alto Networks, Firestorm, Castelion, Cyntel and Tesla remain the owner's
 * manual responsibility: use the seed's standalone fetcher/capture instructions,
 * merge its complete CSV, then use sync-defense-job-listings --from-csv. A
 * missing NAVSEA key is an explicit skipped board, never zero job opportunity.
 * Workflow reports/artifacts retain all outcomes, including skipped sources.
 * A failed source has no Apply CSV; successful boards can still be reviewed.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { DEFENSE_EMPLOYER_SEEDS } from "../lib/defense";
import { getSql } from "../lib/db";
import { REFRESH_ROOT, planSync, readSnapshot, refreshSummary, sha256, validateManifest, validateRefreshRows, type RefreshManifest } from "../lib/defense-job-refresh";
import { ADAPTERS, sliceAndFilter } from "./defense-jobs-adapters";
import { csvText, syncEmployer } from "./sync-defense-job-listings";

const git = (...args: string[]) => execFileSync("git", args, { encoding: "utf8" }).trim();
const arg = (name: string) => { const i = process.argv.indexOf(name); return i < 0 ? undefined : process.argv[i + 1]; };
const REPORT = ".check_defense-refresh-report.md";
const opts = { apply: false, noPrune: false, force: false, pullOnly: false, includeInternational: false };

/** All outcomes are retained. Only successful, nonempty, validated boards receive CSV evidence. */
export async function collectRefresh(dir: string, employers: string[] | undefined, sourceCommit: string, adapters = ADAPTERS): Promise<RefreshManifest> {
  if (existsSync(dir)) throw new Error("Use a new run directory; never overwrite an earlier capture");
  const selected = employers ? DEFENSE_EMPLOYER_SEEDS.filter((s) => employers.includes(s.slug)) : DEFENSE_EMPLOYER_SEEDS;
  if (!selected.length || (employers && selected.length !== new Set(employers).size)) throw new Error("Unknown/empty employer selection");
  mkdirSync(dir, { recursive: true });
  const manifest: RefreshManifest = { version: 1, capturedAt: new Date().toISOString(), sourceCommit, entries: [] };
  for (const seed of selected) {
    const entry: RefreshManifest["entries"][number] = { employer: seed.slug, status: "failed", rows: 0 };
    try {
      const adapter = seed.ats_kind ? adapters[seed.ats_kind] : undefined;
      if (seed.ats_config?.manual) {
        entry.status = "manual"; entry.message = "Owner must capture this board and use the documented manual refresh path";
      } else if (!adapter) {
        entry.status = "unsupported"; entry.message = "No individual-listing adapter (may be an aggregate-only employer)";
      } else if (seed.ats_kind === "usajobs" && !process.env.USAJOBS_API_KEY) {
        entry.status = "missing_credentials"; entry.message = "NAVSEA skipped: USAJOBS_API_KEY is not configured";
      } else {
        const pulled = await adapter(seed);
        // Invalid candidates must fail even if classification would otherwise discard them.
        if (pulled.some((p) => !p.row.URL || !p.title?.trim())) throw new Error("Incomplete candidate row");
        const sliced = sliceAndFilter(seed, pulled);
        const rows = [...new Map(sliced.map((r) => [r.URL, r])).values()];
        const text = csvText(rows);
        validateRefreshRows(text, seed.slug);
        if (!rows.length) {
          entry.status = "empty"; entry.message = "No qualifying rows; no snapshot and never prune";
        } else {
          entry.status = "collected"; entry.rows = rows.length;
          entry.file = `${seed.slug}_${seed.ats_kind}_${manifest.capturedAt.slice(0, 10)}_${path.basename(dir)}.csv`;
          entry.sha256 = sha256(text);
          writeFileSync(path.join(dir, entry.file), text);
        }
      }
    } catch (error) {
      entry.status = "failed";
      entry.message = (error as Error).message.replace(/postgres(?:ql)?:\/\/\S+/gi, "[redacted connection]");
    }
    manifest.entries.push(entry);
    console.log(`${entry.employer}: ${entry.status} (${entry.rows}) ${entry.message ?? ""}`);
    // A timed-out collection leaves reviewable progress in the uploaded artifact.
    // Its workflow cannot open a PR unless the final complete manifest exists.
    writeFileSync(path.join(dir, "progress.json"), JSON.stringify(manifest, null, 2) + "\n");
  }
  validateManifest(manifest);
  writeFileSync(path.join(dir, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
  writeFileSync(REPORT, refreshSummary(manifest));
  return manifest;
}

function committed(file: string) {
  git("ls-files", "--error-unmatch", "--", file);
  git("diff", "--exit-code", "HEAD", "--", file);
}

/** Checkpoints support retry after a partial DB failure and prevent replay of older snapshots. */
async function ensureLedger(apply: boolean): Promise<boolean> {
  const sql = getSql();
  if (apply) {
    await sql.query(`CREATE TABLE IF NOT EXISTS defense_job_refresh_applies (
      manifest_path text NOT NULL, employer_slug text NOT NULL, manifest_sha256 text NOT NULL,
      captured_at timestamptz NOT NULL, applied_at timestamptz NOT NULL DEFAULT now(),
      PRIMARY KEY (manifest_path, employer_slug))`);
    await sql.query(`CREATE TABLE IF NOT EXISTS defense_job_refresh_batches (
      manifest_path text PRIMARY KEY, manifest_sha256 text NOT NULL,
      applied_at timestamptz NOT NULL DEFAULT now())`);
    return true;
  }
  const result = await sql.query("SELECT to_regclass('public.defense_job_refresh_applies') AS sources, to_regclass('public.defense_job_refresh_batches') AS batches");
  return Boolean(result[0].sources && result[0].batches);
}

export async function applyRefresh(manifestPaths: string[], apply: boolean): Promise<void> {
  if (apply && git("rev-parse", "HEAD") !== git("rev-parse", "origin/master")) throw new Error("Apply requires a checkout of fetched origin/master");
  const sql = getSql();
  const logs: string[] = ["## Defense jobs Apply", "", apply ? "Live Apply from merged master." : "Dry run: no DB writes or receipts.", ""];
  const log = (line: string) => { console.log(line); logs.push(line); writeFileSync(REPORT, logs.join("\n") + "\n"); };
  // Validate every candidate and byte hash before any database writes, including ledger DDL.
  const batches = manifestPaths.map((file) => {
    if (!/^data\/defense-job-refresh\/[a-zA-Z0-9_-]+\/manifest\.json$/.test(file)) throw new Error("Invalid manifest path");
    committed(file);
    const text = readFileSync(file, "utf8");
    const manifest = validateManifest(JSON.parse(text));
    if (Date.parse(manifest.capturedAt) > Date.now() + 60_000) throw new Error("Capture timestamp is in the future");
    for (const e of manifest.entries) {
      if (!DEFENSE_EMPLOYER_SEEDS.some((s) => s.slug === e.employer)) throw new Error(`Unknown employer ${e.employer}`);
      if (e.status === "collected") committed(readSnapshot(file, e));
    }
    return { file, manifest, hash: sha256(text) };
  }).sort((a, b) => a.manifest.capturedAt.localeCompare(b.manifest.capturedAt));
  const ledger = await ensureLedger(apply);
  let failed = false;
  for (const { file, manifest, hash } of batches) {
    const done = ledger ? await sql.query("SELECT manifest_sha256 FROM defense_job_refresh_batches WHERE manifest_path=$1", [file]) : [];
    if (done.length) {
      if (done[0].manifest_sha256 !== hash) throw new Error("Previously applied manifest was modified");
      log(`${file}: already applied`); continue;
    }
    let batchFailed = false;
    for (const e of manifest.entries) {
      if (e.status !== "collected") {
        log(`${e.employer}: skipped (${e.status}) — ${e.message ?? "no snapshot"}`);
        continue;
      }
      try {
        const receipt = ledger ? await sql.query("SELECT manifest_sha256 FROM defense_job_refresh_applies WHERE manifest_path=$1 AND employer_slug=$2", [file, e.employer]) : [];
        if (receipt.length) {
          if (receipt[0].manifest_sha256 !== hash) throw new Error("Previously applied snapshot was modified");
          log(`${e.employer}: already applied`); continue;
        }
        const newer = ledger ? await sql.query("SELECT 1 FROM defense_job_refresh_applies WHERE employer_slug=$1 AND captured_at >= $2::timestamptz LIMIT 1", [e.employer, manifest.capturedAt]) : [];
        if (newer.length) { log(`${e.employer}: superseded by a newer applied capture`); continue; }
        const csvPath = readSnapshot(file, e);
        const rows = validateRefreshRows(readFileSync(csvPath, "utf8"), e.employer);
        const existing = await sql.query("SELECT url,closed_at FROM defense_job_listings WHERE employer_slug=$1", [e.employer]) as { url: string; closed_at: string | null }[];
        const plan = planSync(existing, rows.map((r) => r.URL));
        log(`${e.employer}: ${JSON.stringify(plan)}`);
        if (plan.pruneBlocked) throw new Error("Closure guard refused this board; no writes");
        const seed = DEFENSE_EMPLOYER_SEEDS.find((s) => s.slug === e.employer)!;
        await syncEmployer(seed, rows, csvPath, { ...opts, apply }, true);
        if (apply) {
          const open = await sql.query("SELECT url FROM defense_job_listings WHERE employer_slug=$1 AND closed_at IS NULL", [e.employer]) as { url: string }[];
          const urls = new Set(rows.map((r) => r.URL));
          if (open.length !== urls.size || open.some((r) => !urls.has(r.url))) throw new Error("Post-apply URL reconciliation failed");
          await sql.query("INSERT INTO defense_job_refresh_applies (manifest_path,employer_slug,manifest_sha256,captured_at) VALUES ($1,$2,$3,$4)", [file, e.employer, hash, manifest.capturedAt]);
          log(`${e.employer}: applied and verified ${open.length} open URLs`);
        }
      } catch (error) {
        log(`${e.employer}: FAILED — ${(error as Error).message}`);
        batchFailed = true; failed = true;
      }
    }
    if (apply && !batchFailed) await sql.query("INSERT INTO defense_job_refresh_batches (manifest_path,manifest_sha256) VALUES ($1,$2)", [file, hash]);
  }
  if (failed) throw new Error("Refresh incomplete: inspect per-employer failures in the report");
}

async function main() {
  const mode = process.argv[2];
  if (mode === "collect") {
    const run = arg("--run");
    if (!run || !/^[a-zA-Z0-9_-]+$/.test(run)) throw new Error("collect requires a unique --run identifier");
    const manifest = await collectRefresh(`${REFRESH_ROOT}/${run}`, arg("--employers")?.split(",").filter(Boolean), git("rev-parse", "HEAD"));
    if (manifest.entries.some((e) => e.status === "failed")) process.exitCode = 1;
  } else if (mode === "apply") {
    const supplied = arg("--manifest");
    const paths = supplied ? [supplied] : existsSync(REFRESH_ROOT)
      ? readdirSync(REFRESH_ROOT).map((dir) => `${REFRESH_ROOT}/${dir}/manifest.json`).filter(existsSync) : [];
    await applyRefresh(paths, process.argv.includes("--apply"));
  } else throw new Error("Usage: refresh-defense-jobs collect --run ID [--employers a,b] | apply [--manifest PATH] [--apply]");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => { console.error((error as Error).message); process.exitCode = 1; });
}
