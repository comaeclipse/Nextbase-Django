import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ query: vi.fn(), importer: vi.fn(), git: vi.fn() }));
vi.mock("./db", () => ({ getSql: () => ({ query: mocks.query }) }));
vi.mock("node:child_process", () => ({ execFileSync: mocks.git }));
vi.mock("../scripts/import-defense-job-listings", () => ({ importListingsCsv: mocks.importer }));
import { applyRefresh, collectRefresh } from "../scripts/refresh-defense-jobs";
import { sha256, type RefreshManifest } from "./defense-job-refresh";

const dirs: string[] = [];
const text = 'Company,Title,URL,DefenseRelevance\n"Air (Govini)",Engineer,https://example.com/job,prime\n';
let existing: { url: string; closed_at: string | null }[];
let open: { url: string }[];
let done: boolean;
function fixture() {
  const dir = `data/defense-job-refresh/test-${randomUUID()}`;
  dirs.push(dir); mkdirSync(dir, { recursive: true });
  const manifest: RefreshManifest = { version: 1, capturedAt: new Date().toISOString(), sourceCommit: "a".repeat(40), entries: [{ employer: "air", status: "collected", rows: 1, file: "air.csv", sha256: sha256(text) }] };
  writeFileSync(path.join(dir, "air.csv"), text);
  const file = `${dir}/manifest.json`;
  writeFileSync(file, JSON.stringify(manifest));
  return { dir, file, manifest };
}
beforeEach(() => {
  vi.clearAllMocks(); done = false; existing = []; open = [];
  mocks.git.mockReturnValue("a".repeat(40));
  mocks.query.mockImplementation(async (q: string) => {
    if (q.includes("to_regclass")) return [{ sources: "sources", batches: "batches" }];
    if (q.includes("FROM defense_job_refresh_batches")) return done ? [{ manifest_sha256: sha256(readFileSync(`${dirs[dirs.length - 1]}/manifest.json`, "utf8")) }] : [];
    if (q.includes("SELECT url,closed_at") || q.includes("SELECT url, closed_at")) return existing;
    if (q.includes("SELECT url FROM defense_job_listings")) return open;
    if (q.startsWith("INSERT INTO defense_job_refresh_batches")) done = true;
    return [];
  });
  mocks.importer.mockImplementation(async () => { open = [{ url: "https://example.com/job" }]; return { parsed: 1, skipped: 0, urls: open.map((r) => r.url) }; });
});
afterEach(() => { vi.unstubAllEnvs(); for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true }); });

describe("collection and merged Apply", () => {
  it("collects only successful boards; retains errors/skips without reading the DB", async () => {
    const dir = `data/defense-job-refresh/test-${randomUUID()}`; dirs.push(dir);
    vi.stubEnv("USAJOBS_API_KEY", "");
    const manifest = await collectRefresh(dir, ["air", "gci", "xai", "tesla", "navsea", "kratos"], "a".repeat(40), {
      greenhouse: async (seed) => seed.slug === "xai" ? [] : [{ row: { Company: "Air (Govini)", Title: "Engineer", URL: "https://example.com/job" }, title: "Engineer", description: "", businessUnit: "" }],
      ultipro: async () => { throw new Error("page 2 failed"); },
      usajobs: async () => { throw new Error("must not run without credentials"); },
    });
    expect(Object.fromEntries(manifest.entries.map((e) => [e.employer, e.status]))).toEqual({ air: "collected", gci: "failed", xai: "empty", tesla: "manual", navsea: "missing_credentials", kratos: "unsupported" });
    expect(manifest.entries.filter((e) => e.file)).toHaveLength(1);
    expect(mocks.query).not.toHaveBeenCalled();
    expect(mocks.importer).not.toHaveBeenCalled();
  });
  it("dry run does not create tables, import rows, retire rows, or persist receipts", async () => {
    const { file } = fixture();
    await applyRefresh([file], false);
    expect(mocks.importer).not.toHaveBeenCalled();
    expect(mocks.query.mock.calls.every(([q]) => String(q).startsWith("SELECT"))).toBe(true);
  });
  it("rejects tampered snapshots before database writes", async () => {
    const { file, dir } = fixture(); writeFileSync(path.join(dir, "air.csv"), text + "bad");
    await expect(applyRefresh([file], true)).rejects.toThrow("checksum");
    expect(mocks.query).not.toHaveBeenCalled();
  });
  it("does not import or prune when the closure guard blocks a board", async () => {
    const { file } = fixture(); existing = Array.from({ length: 10 }, (_, i) => ({ url: `old${i}`, closed_at: null }));
    await expect(applyRefresh([file], true)).rejects.toThrow("incomplete");
    expect(mocks.importer).not.toHaveBeenCalled();
    expect(mocks.query.mock.calls.some(([q]) => String(q).startsWith("UPDATE defense_job_listings"))).toBe(false);
  });
  it("reopens through the importer, verifies URLs, and does not replay a completed manifest", async () => {
    const { file } = fixture(); existing = [{ url: "https://example.com/job", closed_at: "2026-09-01" }];
    await applyRefresh([file], true);
    expect(mocks.importer).toHaveBeenCalledTimes(1);
    expect(mocks.query.mock.calls.some(([q]) => String(q).startsWith("INSERT INTO defense_job_refresh_applies"))).toBe(true);
    await applyRefresh([file], true);
    expect(mocks.importer).toHaveBeenCalledTimes(1);
  });
  it("refuses a live Apply from a feature checkout", async () => {
    mocks.git.mockImplementation((_bin, args: string[]) => args.includes("HEAD") ? "a".repeat(40) : "b".repeat(40));
    await expect(applyRefresh([], true)).rejects.toThrow("origin/master");
  });
  it("never retires listings or records success after the importer fails", async () => {
    const { file } = fixture(); mocks.importer.mockRejectedValueOnce(new Error("import interrupted"));
    await expect(applyRefresh([file], true)).rejects.toThrow("incomplete");
    expect(mocks.query.mock.calls.some(([q]) => /^(UPDATE defense_job_listings|INSERT INTO defense_job_refresh)/.test(String(q)))).toBe(false);
  });
  it("does not overwrite a newer applied capture with an older merged snapshot", async () => {
    const { file } = fixture();
    const query = mocks.query.getMockImplementation()!;
    mocks.query.mockImplementation(async (q: string, ...args: unknown[]) => q.includes("captured_at >=") ? [{ exists: 1 }] : query(q, ...args));
    await applyRefresh([file], true);
    expect(mocks.importer).not.toHaveBeenCalled();
  });
});
