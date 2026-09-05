import { createHash } from "node:crypto";
import { readFileSync, realpathSync } from "node:fs";
import path from "node:path";
import { parse } from "csv-parse/sync";
import { companySlug } from "./defense-jobs-companies";

export const REFRESH_ROOT = "data/defense-job-refresh";
export type RefreshStatus = "collected" | "empty" | "failed" | "manual" | "unsupported" | "missing_credentials";
export interface RefreshEntry {
  employer: string;
  status: RefreshStatus;
  rows: number;
  message?: string;
  file?: string;
  sha256?: string;
}
export interface RefreshManifest {
  version: 1;
  capturedAt: string;
  sourceCommit: string;
  entries: RefreshEntry[];
}
export const sha256 = (text: string) => createHash("sha256").update(text).digest("hex");

/** Reject malformed/mixed-employer rows before either importing or pruning. */
export function validateRefreshRows(text: string, employer: string): Record<string, string>[] {
  const rows = parse(text, { columns: true, skip_empty_lines: true, bom: true }) as Record<string, string>[];
  const seen = new Set<string>();
  for (const row of rows) {
    if (!row.Title?.trim() || !/^https?:\/\//.test(row.URL ?? "") || companySlug(row.Company ?? "") !== employer) {
      throw new Error(`${employer}: malformed row or mismatched employer`);
    }
    if (seen.has(row.URL)) throw new Error(`${employer}: duplicate URL`);
    if (!["prime", "cleared", "gov_customer"].includes(row.DefenseRelevance)) throw new Error(`${employer}: missing classification`);
    seen.add(row.URL);
  }
  return rows;
}

export function validateManifest(value: unknown): RefreshManifest {
  const m = value as RefreshManifest;
  if (!m || m.version !== 1 || !Number.isFinite(Date.parse(m.capturedAt)) || !/^[a-f0-9]{40}$/.test(m.sourceCommit) || !Array.isArray(m.entries) || !m.entries.length) {
    throw new Error("Invalid refresh manifest");
  }
  const seen = new Set<string>();
  for (const e of m.entries) {
    if (!e || !/^[a-z0-9-]+$/.test(e.employer) || seen.has(e.employer) || !["collected", "empty", "failed", "manual", "unsupported", "missing_credentials"].includes(e.status)) throw new Error("Invalid/duplicate manifest employer");
    seen.add(e.employer);
    if (!Number.isInteger(e.rows) || e.rows < 0) throw new Error("Invalid row count");
    if (e.status === "collected") {
      if (!e.rows || !e.file || !/^[a-f0-9]{64}$/.test(e.sha256 ?? "")) throw new Error("Collected board lacks snapshot evidence");
    } else if (e.file || e.sha256 || e.rows) throw new Error("An unsuccessful board must not supply an apply snapshot");
  }
  return m;
}

/** Bind each file to the reviewed manifest directory; never follow traversal/symlinks outside it. */
export function readSnapshot(manifestPath: string, entry: RefreshEntry): string {
  if (entry.status !== "collected") throw new Error("Only completed boards can be applied");
  if (!entry.file || path.basename(entry.file) !== entry.file || !/^[a-z0-9_-]+\.csv$/.test(entry.file)) throw new Error("Invalid snapshot path");
  const dir = realpathSync(path.dirname(manifestPath));
  const file = realpathSync(path.join(dir, entry.file));
  if (path.dirname(file) !== dir) throw new Error("Snapshot escapes manifest directory");
  const text = readFileSync(file, "utf8");
  if (sha256(text) !== entry.sha256) throw new Error(`${entry.employer}: snapshot checksum mismatch`);
  if (validateRefreshRows(text, entry.employer).length !== entry.rows) throw new Error(`${entry.employer}: snapshot row count mismatch`);
  return file;
}

export function planSync(existing: { url: string; closed_at: string | null }[], urls: string[]) {
  const pulled = new Set(urls);
  const open = new Set(existing.filter((r) => !r.closed_at).map((r) => r.url));
  const closed = new Set(existing.filter((r) => r.closed_at).map((r) => r.url));
  const retired = [...open].filter((u) => !pulled.has(u));
  return {
    rows: pulled.size,
    created: [...pulled].filter((u) => !open.has(u) && !closed.has(u)).length,
    updated: [...pulled].filter((u) => open.has(u)).length,
    reopened: [...pulled].filter((u) => closed.has(u)).length,
    closed: retired.length,
    pruneBlocked: !pulled.size || (open.size > 0 && retired.length / open.size > 0.8),
  };
}

export function refreshSummary(manifest: RefreshManifest): string {
  const escape = (s: string) => s.replace(/[\r\n|]/g, " ");
  return ["## Defense jobs collection", "", `Captured: ${manifest.capturedAt}`, "", "| Employer | Status | Rows | Detail |", "|---|---|---:|---|",
    ...manifest.entries.map((e) => `| ${e.employer} | ${e.status} | ${e.rows} | ${escape(e.message ?? "")} |`), "",
    "Only collected boards have snapshots eligible for Apply. Empty, failed, manual, unsupported, and unconfigured boards never prune.", ""].join("\n");
}
