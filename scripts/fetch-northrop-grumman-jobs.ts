/*
 * Fetches every open Northrop Grumman job from its Eightfold ATS
 * (jobs.northropgrumman.com, tenant domain "ngc.com") and writes a CSV in the
 * shape import-defense-job-listings.ts expects:
 *   Company,ATS,Title,Field,Team,Location,Region,Employment,PayMin,PayMax,PayInterval,Education,URL
 *
 * Eightfold's public search endpoint is /api/pcsx/search — page size is fixed
 * at 10, so we paginate by `start`. It needs an XHR-style request (a plain
 * curl/GET returns the SPA HTML), and the tenant `domain` is ngc.com, not
 * northropgrumman.com. Each position carries title, standardized location(s),
 * department (kept as the sub-team Field), and a work-location option; pay and
 * education are only on the per-job detail pages, so — like the Lockheed feed —
 * this is a list-level pull and those columns are left blank.
 *
 * No DB access. Re-runnable; overwrites the dated CSV.
 *
 * Usage:
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/fetch-northrop-grumman-jobs.ts [--out <path>] [--max N]
 */
import { writeFileSync } from "node:fs";

const BASE = "https://jobs.northropgrumman.com/api/pcsx/search";
const DOMAIN = "ngc.com";
const PAGE = 10;

/** USPS codes that are US soil but outside the contiguous 48 + DC. */
const NON_CONUS = new Set(["AK", "HI", "PR", "GU", "VI", "MP", "AS"]);

interface Position {
  id: number;
  name: string;
  department: string | null;
  standardizedLocations: string[] | null;
  workLocationOption: string | null;
}

const q = (v: unknown): string =>
  '"' + String(v == null ? "" : v).replace(/"/g, '""') + '"';

/** Map a standardized location string to a CSV Location + Region. */
function locate(raw: string): { location: string; region: string } {
  const s = (raw ?? "").trim();
  const m = s.match(/^(.*),\s*([A-Z]{2}),\s*US$/);
  if (m) {
    const city = m[1].trim();
    const st = m[2];
    return {
      location: `${city}, ${st}`,
      region: NON_CONUS.has(st) ? "US (non-CONUS)" : "US (CONUS)",
    };
  }
  if (/,\s*US$/.test(s) || /^United States$/i.test(s)) {
    // US but only a state/country was given — no city to geocode.
    return { location: s.replace(/,\s*US$/, "").trim(), region: "US (CONUS)" };
  }
  return { location: s, region: "International" };
}

async function fetchPage(start: number): Promise<{
  positions: Position[];
  count: number;
}> {
  const url =
    `${BASE}?domain=${DOMAIN}&query=&location=&start=${start}&sort_by=timestamp&`;
  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36",
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} at start=${start}`);
  const json = (await res.json()) as {
    data?: { positions?: Position[]; count?: number };
  };
  return {
    positions: json.data?.positions ?? [],
    count: json.data?.count ?? 0,
  };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const args = process.argv.slice(2);
  const today = new Date().toISOString().slice(0, 10);
  const outPath =
    args[args.indexOf("--out") + 1] && args.includes("--out")
      ? args[args.indexOf("--out") + 1]
      : `data/northrop-grumman_eightfold_${today}.csv`;
  const maxArg = args.includes("--max")
    ? Number(args[args.indexOf("--max") + 1])
    : Infinity;

  const first = await fetchPage(0);
  const total = Math.min(first.count, maxArg);
  console.log(`Northrop Grumman / Eightfold: ${first.count} open position(s).`);

  const seen = new Map<number, Position>();
  for (const p of first.positions) seen.set(p.id, p);

  for (let start = PAGE; start < total; start += PAGE) {
    // The ATS throttles sustained scraping with 403s; back off generously and
    // retry rather than abandoning a nearly-complete pull. Do not run two of
    // these concurrently — parallel pulls trip the 403 much sooner.
    let page: Awaited<ReturnType<typeof fetchPage>> | null = null;
    for (let attempt = 0; attempt < 6 && !page; attempt++) {
      try {
        page = await fetchPage(start);
      } catch (err) {
        if (attempt === 5) throw err;
        await sleep(2000 * (attempt + 1)); // 2s,4s,6s,8s,10s
      }
    }
    if (!page || page.positions.length === 0) break;
    for (const p of page.positions) seen.set(p.id, p);
    if (start % 500 === 0) console.log(`  fetched ${seen.size}/${total}`);
    await sleep(120); // be polite; the ATS throttles bursts
  }

  const header = [
    "Company", "ATS", "Title", "Field", "Team", "Location", "Region",
    "Employment", "PayMin", "PayMax", "PayInterval", "Education", "URL",
  ];
  const lines = [header.map(q).join(",")];
  const regionCounts: Record<string, number> = {};
  for (const p of seen.values()) {
    const { location, region } = locate((p.standardizedLocations ?? [])[0] ?? "");
    regionCounts[region] = (regionCounts[region] ?? 0) + 1;
    const row = [
      "Northrop Grumman",
      "Eightfold",
      p.name ?? "",
      p.department ?? "",
      "",
      location,
      region,
      "", "", "", "", "",
      `https://jobs.northropgrumman.com/careers/job/${p.id}`,
    ];
    lines.push(row.map(q).join(","));
  }

  writeFileSync(outPath, lines.join("\n") + "\n", "utf-8");
  console.log(`\nWrote ${seen.size} listing(s) to ${outPath}`);
  console.log("By region:");
  for (const [k, v] of Object.entries(regionCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${String(v).padStart(4)}  ${k}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
