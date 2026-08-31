/*
 * Fetch HII (Huntington Ingalls Industries) shipbuilding job listings into the
 * standard defense_job_listings CSV.
 *
 * ATS: SAP SuccessFactors career site at careers.huntingtoningalls.com — the
 * Newport News Shipbuilding + Ingalls Shipbuilding + HII Corporate entities
 * (the marine-electrician side of HII; Mission Technologies is a separate
 * jobs.hii-tsd.com site, not pulled here). Job cards are server-rendered in the
 * /search/ HTML, so we fetch each page and regex-parse the rows. Pay and
 * education are detail-page-gated on SuccessFactors, so this is LIST-LEVEL only
 * (PayMin/PayMax/Education left blank), same as the Northrop Grumman/Radancy
 * feeds.
 *
 * Usage:
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/fetch-hii-jobs.ts
 * Output: data/hii_successfactors_<YYYY-MM-DD>.csv (import with
 *   scripts/import-defense-job-listings.ts). No DB access; env file not required.
 */
import { writeFileSync } from "node:fs";
import path from "node:path";

const BASE = "https://careers.huntingtoningalls.com";
const PAGE_SIZE = 50; // SuccessFactors returns 50 rows per /search page.
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36";

const STATE_ABBR: Record<string, string> = {
  Alabama: "AL", Alaska: "AK", Arizona: "AZ", Arkansas: "AR", California: "CA",
  Colorado: "CO", Connecticut: "CT", Delaware: "DE", "District of Columbia": "DC",
  Florida: "FL", Georgia: "GA", Hawaii: "HI", Idaho: "ID", Illinois: "IL",
  Indiana: "IN", Iowa: "IA", Kansas: "KS", Kentucky: "KY", Louisiana: "LA",
  Maine: "ME", Maryland: "MD", Massachusetts: "MA", Michigan: "MI", Minnesota: "MN",
  Mississippi: "MS", Missouri: "MO", Montana: "MT", Nebraska: "NE", Nevada: "NV",
  "New Hampshire": "NH", "New Jersey": "NJ", "New Mexico": "NM", "New York": "NY",
  "North Carolina": "NC", "North Dakota": "ND", Ohio: "OH", Oklahoma: "OK",
  Oregon: "OR", Pennsylvania: "PA", "Rhode Island": "RI", "South Carolina": "SC",
  "South Dakota": "SD", Tennessee: "TN", Texas: "TX", Utah: "UT", Vermont: "VT",
  Virginia: "VA", Washington: "WA", "West Virginia": "WV", Wisconsin: "WI", Wyoming: "WY",
};
const NON_CONUS = new Set(["HI", "AK", "PR", "GU", "VI"]);

interface Job {
  title: string;
  location: string;
  field: string;
  url: string;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}
const stripTags = (s: string) => decodeEntities(s.replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();

/** Parse one /search page of server-rendered rows. */
function parsePage(html: string): Job[] {
  const jobs: Job[] = [];
  const blocks = html.split(/<tr[^>]*class="[^"]*data-row[^"]*"/i).slice(1);
  for (const block of blocks) {
    const link = block.match(/href="(\/job\/[^"]+)"\s+class="jobTitle-link">([\s\S]*?)<\/a>/i);
    if (!link) continue;
    const url = BASE + link[1];
    const title = stripTags(link[2]);
    const locCell = block.match(/class="colLocation[^"]*"[^>]*>([\s\S]*?)<\/td>/i);
    const deptCell = block.match(/class="colDepartment[^"]*"[^>]*>([\s\S]*?)<\/td>/i);
    const locRaw = locCell ? stripTags(locCell[1]).replace(/,\s*United States$/, "") : "";
    const [city, stateName] = locRaw.split(",").map((p) => p.trim());
    const abbr = stateName ? STATE_ABBR[stateName] ?? stateName : "";
    const location = city && abbr ? `${city}, ${abbr}` : locRaw;
    jobs.push({ title, location, field: deptCell ? stripTags(deptCell[1]) : "", url });
  }
  return jobs;
}

async function fetchPage(startrow: number, attempt = 0): Promise<Job[]> {
  const url = `${BASE}/search/?q=&startrow=${startrow}&sortColumn=referencedate&sortDirection=desc`;
  const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "text/html" } });
  if (!res.ok) {
    if (attempt < 5) {
      await new Promise((r) => setTimeout(r, (attempt + 1) * 2000));
      return fetchPage(startrow, attempt + 1);
    }
    throw new Error(`HII fetch ${startrow} failed: ${res.status}`);
  }
  return parsePage(await res.text());
}

function region(location: string): string {
  const abbr = (location.split(",")[1] || "").trim();
  return NON_CONUS.has(abbr) ? "US (non-CONUS)" : "US (CONUS)";
}

function q(v: string): string {
  return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

async function main() {
  const seen = new Map<string, Job>();
  for (let start = 0; ; start += PAGE_SIZE) {
    const page = await fetchPage(start);
    if (page.length === 0) break;
    for (const j of page) if (!seen.has(j.url)) seen.set(j.url, j);
    console.log(`  startrow=${start}: +${page.length} (total ${seen.size})`);
    if (page.length < PAGE_SIZE) break;
    if (start > 5000) break; // safety
    await new Promise((r) => setTimeout(r, 400));
  }

  const header = [
    "Company", "ATS", "Title", "Field", "Team", "Location", "Region",
    "Employment", "PayMin", "PayMax", "PayInterval", "Education", "URL",
  ];
  const lines = [header.join(",")];
  for (const j of seen.values()) {
    lines.push(
      [q("HII"), "successfactors", q(j.title), q(j.field), "", q(j.location), region(j.location),
        "", "", "", "", "", q(j.url)].join(",")
    );
  }

  const date = new Date().toISOString().slice(0, 10);
  const outPath = path.join(process.cwd(), "data", `hii_successfactors_${date}.csv`);
  writeFileSync(outPath, lines.join("\n") + "\n", "utf-8");
  console.log(`\nWrote ${seen.size} HII listings -> ${outPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
