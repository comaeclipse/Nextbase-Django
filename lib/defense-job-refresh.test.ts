import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { planSync, readSnapshot, sha256, validateManifest, validateRefreshRows } from "./defense-job-refresh";
import { assertCompleteCount, assertCompletePage } from "../scripts/defense-jobs-adapters";

const text = 'Company,Title,URL,DefenseRelevance\n"Air (Govini)",Engineer,https://example.com/job,prime\n';
const dirs: string[] = [];
afterEach(() => { for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true }); });

describe("reviewed refresh evidence", () => {
  it("validates every committed manifest and snapshot in data PRs", () => {
    const files = execFileSync("git", ["ls-files", "data/defense-job-refresh/*/manifest.json"], { encoding: "utf8" }).trim().split(/\r?\n/).filter(Boolean);
    for (const file of files) {
      const manifest = validateManifest(JSON.parse(readFileSync(file, "utf8")));
      for (const entry of manifest.entries) if (entry.status === "collected") readSnapshot(file, entry);
    }
  });
  it("rejects unknown/mixed employer rows and duplicates before prune", () => {
    expect(() => validateRefreshRows(text, "gci")).toThrow("mismatched");
    expect(() => validateRefreshRows(text + text.split("\n")[1] + "\n", "air")).toThrow("duplicate");
    expect(() => validateRefreshRows(text.replace(",prime", ","), "air")).toThrow("classification");
  });
  it("binds snapshots to exact reviewed bytes and rejects path traversal", () => {
    const dir = mkdtempSync(path.join(tmpdir(), "refresh-evidence-")); dirs.push(dir);
    const manifest = path.join(dir, "manifest.json");
    writeFileSync(path.join(dir, "air.csv"), text);
    const entry = { employer: "air", status: "collected" as const, rows: 1, file: "air.csv", sha256: sha256(text) };
    expect(readSnapshot(manifest, entry)).toBe(path.join(dir, "air.csv"));
    expect(() => readSnapshot(manifest, { ...entry, file: "../air.csv" })).toThrow("path");
    writeFileSync(path.join(dir, "air.csv"), text.replace("Engineer", "Changed"));
    expect(() => readSnapshot(manifest, entry)).toThrow("checksum");
  });
  it("does not let failed or empty entries carry an apply snapshot", () => {
    const entry = { employer: "air", status: "failed", rows: 1, file: "air.csv", sha256: sha256(text) };
    expect(() => validateManifest({ version: 1, capturedAt: new Date().toISOString(), sourceCommit: "a".repeat(40), entries: [entry] })).toThrow("unsuccessful");
  });
});

describe("listing lifecycle and completeness guards", () => {
  const existing = Array.from({ length: 10 }, (_, i) => ({ url: `job${i}`, closed_at: null }));
  it("refuses empty pulls and closures above 80%, but permits exactly 80%", () => {
    expect(planSync(existing, []).pruneBlocked).toBe(true);
    expect(planSync(existing, ["job0"]).pruneBlocked).toBe(true);
    expect(planSync(existing, ["job0", "job1"]).pruneBlocked).toBe(false);
  });
  it("distinguishes new, updated, closed, and reopened URLs", () => {
    const plan = planSync([...existing, { url: "returning", closed_at: "2026-09-01" }], ["job0", "returning", "new"]);
    expect(plan).toMatchObject({ created: 1, updated: 1, reopened: 1, closed: 9 });
  });
  it("fails short or missing-count pages and overlapping/incomplete board sweeps", () => {
    expect(() => assertCompletePage([], 10, 0, 10)).toThrow("Truncated");
    expect(() => assertCompletePage([1], undefined, 0, 10)).toThrow("unknown");
    expect(() => assertCompleteCount(99, 100)).toThrow("Incomplete");
    expect(() => assertCompletePage([1, 2], 12, 10, 10)).not.toThrow();
    expect(() => assertCompletePage([], 0, 0, 10)).not.toThrow();
  });
});
