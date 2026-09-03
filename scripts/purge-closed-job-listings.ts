/*
 * Retention purge for defense_job_listings closed rows (issue #313).
 *
 * The unified sync (scripts/sync-defense-job-listings.ts) retires a listing that
 * is gone from its board by stamping `closed_at` — it never deletes, so a URL
 * that reappears can reopen the SAME row (importer clears closed_at, preserving
 * created_at). Closed rows are invisible to every reader (`closed_at IS NULL`),
 * so without a purge they accumulate forever on high-churn boards with no
 * consumer. This script is the retention policy decided for #313: hard-delete a
 * closed row once it has been closed longer than CLOSED_RETENTION_DAYS (90d).
 * The window comfortably exceeds a normal ATS repost gap, so the reopen path is
 * preserved for the cases that matter; a listing gone longer than that which
 * returns is legitimately a new posting.
 *
 * Same safety posture as the sync: DEFAULT DRY RUN (prints the plan, deletes
 * nothing); pass --apply to delete. Only ever touches rows with a non-null
 * closed_at older than the window — never an open (live) listing.
 *
 * Usage:
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/purge-closed-job-listings.ts [--apply] [--days N] [--employer <slug>]
 *
 * Pair it after a full refresh (the Phase-5 cron will do both):
 *   sync-defense-job-listings.ts --all --apply  &&  purge-closed-job-listings.ts --apply
 */
import { getSql } from "../lib/db";
import { CLOSED_RETENTION_DAYS } from "../lib/defense-jobs";

/** The lifecycle column this purge depends on must exist (issue #313 Phase 1). */
async function ensureSchema(): Promise<void> {
  const cols = (await getSql().query(
    "SELECT column_name FROM information_schema.columns WHERE table_name = 'defense_job_listings' AND column_name = 'closed_at'",
  )) as { column_name: string }[];
  if (cols.length === 0) {
    throw new Error("defense_job_listings is missing closed_at — run scripts/migrate-defense-job-listings.ts first (issue #313 Phase 1).");
  }
}

async function main() {
  const args = process.argv.slice(2);
  const apply = args.includes("--apply");
  const daysArg = args.includes("--days") ? Number(args[args.indexOf("--days") + 1]) : CLOSED_RETENTION_DAYS;
  const employer = args.includes("--employer") ? args[args.indexOf("--employer") + 1] : undefined;

  if (!Number.isFinite(daysArg) || daysArg < 0) {
    console.error(`--days must be a non-negative number (got "${daysArg}").`);
    process.exit(1);
  }

  console.log(
    `Closed-listing retention purge (retain ${daysArg}d)${employer ? ` — employer ${employer}` : ""}` +
      `${apply ? "" : " (DRY RUN — no deletes; pass --apply)"}\n`,
  );
  await ensureSchema();

  const sql = getSql();
  // Rows past the retention window: closed, and closed_at older than N days.
  // `make_interval(days => $1)` keeps the window parameterized (never string-built).
  const where = `closed_at IS NOT NULL AND closed_at < now() - make_interval(days => $1)` + (employer ? ` AND employer_slug = $2` : "");
  const params: unknown[] = employer ? [daysArg, employer] : [daysArg];

  const breakdown = (await sql.query(
    `SELECT employer_slug, count(*)::int AS n, min(closed_at) AS oldest
       FROM defense_job_listings
      WHERE ${where}
      GROUP BY employer_slug
      ORDER BY n DESC`,
    params,
  )) as { employer_slug: string; n: number; oldest: string }[];

  const total = breakdown.reduce((sum, r) => sum + r.n, 0);
  if (total === 0) {
    console.log(`Nothing to purge — no closed listing has been closed longer than ${daysArg} day(s).`);
    return;
  }

  console.log(`${apply ? "Deleting" : "Would delete"} ${total} closed listing(s) across ${breakdown.length} employer(s):`);
  for (const r of breakdown) {
    console.log(`  ${String(r.n).padStart(5)}  ${r.employer_slug}  (oldest closed ${new Date(r.oldest).toISOString().slice(0, 10)})`);
  }

  if (!apply) {
    console.log(`\nDry run — re-run with --apply to delete.`);
    return;
  }

  await sql.query(`DELETE FROM defense_job_listings WHERE ${where}`, params);
  console.log(`\nPurged ${total} closed listing(s).`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
