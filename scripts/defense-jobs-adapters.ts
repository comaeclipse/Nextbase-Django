/*
 * In-process ATS adapters for the defense job-listings sync (issue #313, Phase 3).
 *
 * One `pull(seed) -> Pulled[]` per ats_kind, driven entirely by the board recorded
 * in the seed's ats_config. This is the single home for the pull logic that used
 * to live in the standalone scripts/fetch-*.ts — both the unified sync
 * (scripts/sync-defense-job-listings.ts) and those thin CLIs call it, so the
 * board endpoints, pagination, and per-vendor gotchas live in exactly one place.
 *
 * An adapter returns raw candidates carrying the base CSV columns PLUS the text
 * the #336 slice classifier reads (title / description / businessUnit); it does
 * NOT itself classify or US-filter — that is `sliceAndFilter()`, shared by every
 * caller so the policy is applied identically everywhere.
 *
 * For a big COMMERCIAL board (counts_as_defense:false) the adapter narrows at the
 * source first (Gate 1: the ATS's own keyword/query search per defense term) so it
 * isn't pulling tens of thousands of rows; `sliceAndFilter` is Gate 2. A defense
 * PRIME (counts_as_defense:true) pulls its whole board (every listing counts).
 *
 * Vendor gotchas captured here (all learned the hard way): Oracle's siteNumber
 * fallback + Cerner "government security clearance" boilerplate; amazon.jobs'
 * brotli truncation under undici; Eightfold's pcsx-not-apply/v2, OR-matched
 * multi-word queries, JSON-LD-only JD, and 429/403 rate-limiting.
 */
import { resolveStateAbbr } from "../lib/states";
import { classifyDefenseRelevance } from "../lib/defense-jobs-slice";
import type { EmployerSeed } from "../lib/defense";

export const CSV_HEADER = [
  "Company", "ATS", "Title", "Field", "Team", "Location", "Region",
  "Employment", "PayMin", "PayMax", "PayInterval", "Education", "URL",
  "DefenseRelevance", "DefenseSignal",
] as const;

/** A pulled listing: the base CSV columns plus the text the slice classifier reads. */
export interface Pulled {
  row: Record<string, string>;
  title: string;
  description: string;
  businessUnit: string;
}

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36";
const NON_CONUS = new Set(["AK", "HI", "PR", "GU", "VI", "MP", "AS"]);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const stripHtml = (h: string | null | undefined): string =>
  (h ?? "").replace(/<[^>]+>/g, " ").replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/&#\d+;/g, " ").replace(/&[a-z]+;/gi, " ").replace(/\s+/g, " ").trim();

/** Freeform-location → CSV Location + Region. Handles "City, ST", "City, State, US(A)", bare country, Remote. */
function locate(raw: string | undefined, opts: { remote?: boolean } = {}): { location: string; region: string; isUS: boolean } {
  const s = (raw ?? "").trim();
  const remote = opts.remote || /\bremote\b/i.test(s);
  // Country-FIRST: "United States, <State>[, <City>]" (Eightfold / Microsoft).
  let m = s.match(/^(?:United States|USA?|U\.S\.?),\s*([^,]+)(?:,\s*(.+))?$/i);
  if (m) {
    const state = m[1].trim();
    const city = (m[2] ?? "").trim();
    const abbr = resolveStateAbbr(state) ?? state;
    const isRemote = remote || /remote/i.test(state) || /remote/i.test(city);
    return { location: city ? `${city}, ${abbr}` : abbr, region: isRemote ? "US/Remote" : NON_CONUS.has(abbr) ? "US (non-CONUS)" : "US (CONUS)", isUS: true };
  }
  // Country-LAST: "City, State, United States|US" (Oracle / Workday).
  m = s.match(/^(.*),\s*([^,]+),\s*(United States|USA?|U\.S\.?)$/i);
  if (m) {
    const abbr = resolveStateAbbr(m[2].trim()) ?? m[2].trim();
    return { location: `${m[1].trim()}, ${abbr}`, region: remote ? "US/Remote" : NON_CONUS.has(abbr) ? "US (non-CONUS)" : "US (CONUS)", isUS: true };
  }
  // City, ST
  m = s.match(/^(.*),\s*([A-Z]{2})$/);
  if (m) {
    const abbr = m[2];
    return { location: s, region: remote ? "US/Remote" : NON_CONUS.has(abbr) ? "US (non-CONUS)" : "US (CONUS)", isUS: true };
  }
  if (/(United States|USA)$/i.test(s)) return { location: s.replace(/,?\s*(United States|USA)$/i, "").trim() || "United States", region: remote ? "US/Remote" : "US (CONUS)", isUS: true };
  if (remote && !s) return { location: "Remote", region: "US/Remote", isUS: true };
  return { location: s, region: "International", isUS: false };
}

function baseRow(seed: EmployerSeed, ats: string, o: {
  title: string; field?: string; team?: string; location: string; region?: string; url: string; employment?: string;
}): Record<string, string> {
  return {
    Company: seed.display_name, ATS: ats, Title: o.title, Field: o.field ?? "", Team: o.team ?? "",
    Location: o.location, Region: o.region ?? "", Employment: o.employment ?? "",
    PayMin: "", PayMax: "", PayInterval: "", Education: "", URL: o.url, DefenseRelevance: "", DefenseSignal: "",
  };
}

const cfg = (seed: EmployerSeed, key: string): string | undefined => {
  const v = seed.ats_config?.[key];
  return v == null ? undefined : String(v);
};

async function getJson(url: string, init?: RequestInit): Promise<unknown> {
  const res = await fetch(url, { ...init, headers: { Accept: "application/json", "User-Agent": UA, "Accept-Encoding": "gzip, deflate", ...(init?.headers ?? {}) } });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url.slice(0, 80)}`);
  return res.json();
}

/** GET/POST with back-off on 429/403 (Eightfold). Returns null after exhausting retries (JD pages). */
async function withBackoff<T>(fn: () => Promise<T>, tries = 6): Promise<T | null> {
  for (let i = 0; i < tries; i++) {
    try {
      return await fn();
    } catch (err) {
      const msg = (err as Error).message;
      if (/HTTP (429|403)/.test(msg) && i < tries - 1) { await sleep(3000 * (i + 1)); continue; }
      if (i < tries - 1) { await sleep(1000 * (i + 1)); continue; }
      throw err;
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Greenhouse / Lever / Ashby — pure public JSON boards (defense pure-plays + spacex/xai)
// ---------------------------------------------------------------------------

async function greenhouse(seed: EmployerSeed): Promise<Pulled[]> {
  const board = cfg(seed, "board");
  const json = (await getJson(`https://boards-api.greenhouse.io/v1/boards/${board}/jobs?content=true`)) as {
    jobs?: { title: string; location?: { name?: string }; absolute_url: string; departments?: { name: string }[]; content?: string }[];
  };
  return (json.jobs ?? []).map((j) => {
    const field = (j.departments ?? []).map((d) => d.name).join(" / ");
    const loc = locate(j.location?.name);
    return { row: baseRow(seed, "Greenhouse", { title: j.title, field, location: loc.location, region: loc.region, url: j.absolute_url }), title: j.title, description: stripHtml(j.content), businessUnit: field };
  });
}

async function lever(seed: EmployerSeed): Promise<Pulled[]> {
  const board = cfg(seed, "board");
  const json = (await getJson(`https://api.lever.co/v0/postings/${board}?mode=json`)) as {
    text: string; categories?: { location?: string; team?: string; commitment?: string }; descriptionPlain?: string; hostedUrl: string;
  }[];
  return (json ?? []).map((p) => {
    const team = p.categories?.team ?? "";
    const loc = locate(p.categories?.location);
    return { row: baseRow(seed, "Lever", { title: p.text, field: team, team, location: loc.location, region: loc.region, url: p.hostedUrl, employment: p.categories?.commitment ?? "" }), title: p.text, description: p.descriptionPlain ?? "", businessUnit: team };
  });
}

async function ashby(seed: EmployerSeed): Promise<Pulled[]> {
  const board = cfg(seed, "board");
  const json = (await getJson(`https://api.ashbyhq.com/posting-api/job-board/${board}?includeCompensation=true`)) as {
    jobs?: { title: string; location?: string; department?: string; team?: string; employmentType?: string; descriptionPlain?: string; jobUrl: string }[];
  };
  return (json.jobs ?? []).map((j) => {
    const field = [j.department, j.team].filter(Boolean).join(" / ");
    const loc = locate(j.location);
    return { row: baseRow(seed, "Ashby", { title: j.title, field, team: j.team ?? "", location: loc.location, region: loc.region, url: j.jobUrl, employment: j.employmentType ?? "" }), title: j.title, description: j.descriptionPlain ?? "", businessUnit: field };
  });
}

// ---------------------------------------------------------------------------
// Workday CXS (Cisco) — Phenom front over Workday; pull Workday.
// ---------------------------------------------------------------------------

const WORKDAY_QUERIES = ["clearance", "security clearance", "federal", "defense", "public sector", "national security", "government", "govcloud", "intelligence community", "dod", "warfighter", "fedramp"];

async function workday(seed: EmployerSeed): Promise<Pulled[]> {
  const host = cfg(seed, "host")!, tenant = cfg(seed, "tenant")!, site = cfg(seed, "site")!;
  const cxs = `https://${host}/wday/cxs/${tenant}/${site}`;
  const byPath = new Map<string, { title: string }>();
  for (const query of WORKDAY_QUERIES) {
    for (let offset = 0; ; offset += 20) {
      const page = (await withBackoff(() => getJson(`${cxs}/jobs`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ limit: 20, offset, searchText: query, appliedFacets: {} }) }))) as { jobPostings?: { title: string; externalPath: string }[]; total?: number } | null;
      const rows = page?.jobPostings ?? [];
      if (rows.length === 0) break;
      // A row missing externalPath (seen on Cisco's board) would otherwise key the
      // map on the literal string "undefined" and 404/406 loop below.
      for (const r of rows) if (r.externalPath) byPath.set(r.externalPath, { title: r.title });
      await sleep(120);
      if (offset + 20 >= (page?.total ?? 0)) break;
    }
  }
  const out: Pulled[] = [];
  for (const [externalPath, { title }] of byPath) {
    // One listing's detail page failing (dead link, transient error) must not sink
    // the whole employer's pull — skip it and keep going.
    let d: { jobPostingInfo?: { title?: string; jobDescription?: string; location?: string; externalUrl?: string; timeType?: string; remoteType?: string } } | null;
    try {
      d = (await withBackoff(() => getJson(`${cxs}${externalPath}`), 4)) as typeof d;
    } catch {
      await sleep(90);
      continue;
    }
    await sleep(90);
    const info = d?.jobPostingInfo;
    if (!info) continue;
    const loc = locate(info.location, { remote: /remote/i.test(info.remoteType ?? "") });
    out.push({
      row: baseRow(seed, "Workday", { title: info.title ?? title, location: loc.location, region: loc.region, url: info.externalUrl ?? `https://${host}/${site}${externalPath}`, employment: /full/i.test(info.timeType ?? "") ? "Full-time" : info.timeType ?? "" }),
      title: info.title ?? title, description: stripHtml(info.jobDescription), businessUnit: "",
    });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Oracle Cloud Recruiting (Oracle, Dell) — findReqs keyword union + detail JD.
// ---------------------------------------------------------------------------

const ORACLE_QUERIES = ["clearance", "security clearance", "defense", "federal", "national security", "public sector", "govcloud", "dod", "fedramp", "intelligence community"];

/** Oracle appends a Cerner "government security clearance" facility-access clause + export disclaimer to non-defense roles. */
function stripOracleBoilerplate(text: string): string {
  return text
    .replace(/[^.]*\bgovernment security clearance\b[^.]*\.?/gi, " ")
    .replace(/certain (?:u\.?s\.?|united states)[^.]*?(?:export control|security clearance)[^.]*?\.?/gi, " ")
    .replace(/\s+/g, " ").trim();
}

async function oracleOrc(seed: EmployerSeed): Promise<Pulled[]> {
  const host = cfg(seed, "host")!, siteNumber = cfg(seed, "siteNumber")!, sitePath = cfg(seed, "sitePath") ?? "jobsearch";
  const listBase = `https://${host}/hcmRestApi/resources/latest/recruitingCEJobRequisitions`;
  const detailBase = `https://${host}/hcmRestApi/resources/latest/recruitingCEJobRequisitionDetails`;
  const byId = new Map<number, { title: string; location?: string }>();
  for (const kw of ORACLE_QUERIES) {
    for (let offset = 0; ; offset += 200) {
      const finder = `findReqs;siteNumber=${siteNumber},keyword=${encodeURIComponent(kw)},limit=200,offset=${offset},sortBy=POSTING_DATES_DESC`;
      const json = (await getJson(`${listBase}?onlyData=true&expand=requisitionList.secondaryLocations&finder=${finder}`)) as { items?: { TotalJobsCount?: number; requisitionList?: { Id: number; Title: string; PrimaryLocation?: string }[] }[] };
      const it = json.items?.[0];
      const rows = it?.requisitionList ?? [];
      if (rows.length === 0) break;
      for (const r of rows) byId.set(r.Id, { title: r.Title, location: r.PrimaryLocation });
      await sleep(120);
      if (offset + 200 >= (it?.TotalJobsCount ?? 0)) break;
    }
  }
  const out: Pulled[] = [];
  for (const [id, { title, location }] of byId) {
    const d = (await withBackoff(() => getJson(`${detailBase}/${id}?expand=all&onlyData=true`), 4)) as { ExternalDescriptionStr?: string; ExternalQualificationsStr?: string; ExternalResponsibilitiesStr?: string; Department?: string; Organization?: string; JobFamily?: string } | null;
    await sleep(90);
    if (!d) continue;
    const fullText = stripOracleBoilerplate([d.ExternalDescriptionStr, d.ExternalQualificationsStr, d.ExternalResponsibilitiesStr].map(stripHtml).join(" "));
    const businessUnit = [d.JobFamily, d.Department, d.Organization].filter(Boolean).join(" ");
    const loc = locate(location);
    out.push({ row: baseRow(seed, "Oracle Recruiting", { title, field: d.JobFamily ?? "", location: loc.location, region: loc.region, url: `https://${host}/hcmUI/CandidateExperience/en/sites/${sitePath}/job/${id}` }), title, description: fullText, businessUnit });
  }
  return out;
}

// ---------------------------------------------------------------------------
// amazon.jobs (AWS) — base_query union; list carries the JD inline.
// ---------------------------------------------------------------------------

const AMAZON_QUERIES = ["security clearance", "TS/SCI", "top secret", "DoD", "GovCloud", "national security", "public sector", "fedramp", "intelligence community", "warfighter"];

async function amazonJobs(seed: EmployerSeed): Promise<Pulled[]> {
  const category = cfg(seed, "business_category")!;
  const byId = new Map<string, Pulled>();
  for (const term of AMAZON_QUERIES) {
    for (let offset = 0; ; offset += 100) {
      // amazon.jobs' brotli truncates under undici -> force gzip/deflate (getJson does).
      const json = (await getJson(`https://www.amazon.jobs/en/search.json?business_category%5B%5D=${category}&result_limit=100&offset=${offset}&sort=relevant&base_query=${encodeURIComponent(term)}`)) as {
        hits?: number; jobs?: { id_icims: string; title: string; city?: string; state?: string; country_code?: string; normalized_location?: string; job_path: string; business_category?: string; job_family?: string; is_intern?: boolean; description?: string; basic_qualifications?: string; preferred_qualifications?: string; team?: { label?: string } }[];
      };
      const jobs = json.jobs ?? [];
      if (jobs.length === 0) break;
      for (const j of jobs) {
        const isUS = (j.country_code ?? "").toUpperCase() === "USA";
        const location = isUS && j.city && j.state ? `${j.city}, ${j.state}` : (j.normalized_location ?? "");
        const businessUnit = [j.business_category, j.team?.label, j.job_family].filter(Boolean).join(" ");
        byId.set(j.id_icims, {
          row: baseRow(seed, "Amazon Jobs", { title: j.title, field: j.team?.label ?? j.job_family ?? "", location, region: isUS ? "US (CONUS)" : "International", url: `https://www.amazon.jobs${j.job_path}`, employment: j.is_intern ? "Internship" : "Full-time" }),
          title: j.title, description: `${stripHtml(j.description)} ${stripHtml(j.basic_qualifications)} ${stripHtml(j.preferred_qualifications)}`, businessUnit,
        });
      }
      await sleep(150);
      if (offset + 100 >= (json.hits ?? 0)) break;
    }
  }
  return [...byId.values()];
}

// ---------------------------------------------------------------------------
// Eightfold (Northrop / Lockheed prime; Microsoft commercial) — pcsx/search.
// ---------------------------------------------------------------------------

const EIGHTFOLD_QUERIES = ["clearance", "security clearance", "polygraph", "federal", "public sector", "dod", "fedramp"];

function eightfoldHost(seed: EmployerSeed): string {
  const host = cfg(seed, "host") ?? cfg(seed, "site");
  if (!host) throw new Error(`eightfold: no host/site in ats_config for ${seed.slug} (add one)`);
  return host.replace(/^https?:\/\//, "");
}

const eightfoldHeaders = (host: string) => ({ "X-Requested-With": "XMLHttpRequest", Referer: `https://${host}/careers` });

async function eightfold(seed: EmployerSeed): Promise<Pulled[]> {
  const host = eightfoldHost(seed);
  const domain = cfg(seed, "domain")!;
  interface P { id: number; name: string; locations?: string[]; standardizedLocations?: string[]; department?: string }

  if (seed.counts_as_defense) {
    // Defense prime: whole board, list-level (pay/JD are detail-only). Every listing counts.
    // Dedup by position id — Eightfold pages overlap (esp. under back-off/retry).
    const byId = new Map<number, P>();
    for (let start = 0; ; start += 10) {
      const json = (await withBackoff(() => getJson(`https://${host}/api/pcsx/search?domain=${domain}&query=&location=&start=${start}&sort_by=timestamp`, { headers: eightfoldHeaders(host) }))) as { data?: { positions?: P[]; count?: number } } | null;
      const positions = json?.data?.positions ?? [];
      if (positions.length === 0) break;
      for (const p of positions) byId.set(p.id, p);
      await sleep(150);
      if (start + 10 >= (json?.data?.count ?? 0)) break;
    }
    return [...byId.values()].map((p) => {
      const loc = locate((p.locations ?? p.standardizedLocations ?? [])[0]);
      return { row: baseRow(seed, "Eightfold", { title: p.name, field: p.department ?? "", location: loc.location, region: loc.region, url: `https://${host}/careers/job/${p.id}` }), title: p.name, description: "", businessUnit: p.department ?? "" };
    });
  }

  // Commercial (Microsoft): narrow by precise query terms, US-prefilter, JD from the page JSON-LD.
  const byId = new Map<number, P>();
  for (const query of EIGHTFOLD_QUERIES) {
    for (let start = 0; ; ) {
      const json = (await withBackoff(() => getJson(`https://${host}/api/pcsx/search?domain=${domain}&query=${encodeURIComponent(query)}&start=${start}&num=50&sort_by=relevance`, { headers: eightfoldHeaders(host) }))) as { data?: { positions?: P[]; count?: number } } | null;
      const positions = json?.data?.positions ?? [];
      if (positions.length === 0) break;
      for (const p of positions) byId.set(p.id, p);
      start += positions.length;
      await sleep(250);
      if (start >= (json?.data?.count ?? 0)) break;
    }
  }
  const out: Pulled[] = [];
  for (const p of byId.values()) {
    const loc = locate((p.locations ?? p.standardizedLocations ?? [])[0]);
    if (!loc.isUS) continue; // US pre-filter BEFORE the ~700KB JD page fetch
    const html = (await withBackoff(async () => {
      const res = await fetch(`https://${host}/careers/job/${p.id}`, { headers: { "User-Agent": UA, Referer: `https://${host}/careers`, "Accept-Encoding": "gzip, deflate" } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.text();
    }, 4)) as string | null;
    await sleep(400);
    if (!html) continue;
    const jd = extractJsonLdJd(html);
    out.push({ row: baseRow(seed, "Eightfold", { title: p.name, field: p.department ?? "", location: loc.location, region: loc.region, url: `https://${host}/careers/job/${p.id}`, employment: "Full-time" }), title: p.name, description: jd, businessUnit: p.department ?? "" });
  }
  return out;
}

function extractJsonLdJd(html: string): string {
  const re = /<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    try {
      const j = JSON.parse(m[1]) as { "@type"?: string; description?: string };
      if (j["@type"] === "JobPosting") return stripHtml(j.description ?? "");
    } catch { /* skip */ }
  }
  return "";
}

// ---------------------------------------------------------------------------

export const ADAPTERS: Record<string, (seed: EmployerSeed) => Promise<Pulled[]>> = {
  greenhouse, lever, ashby, workday, oracle_orc: oracleOrc, amazon_jobs: amazonJobs, eightfold,
};

/**
 * Gate 2 + US filter, shared by the sync engine and the standalone CLIs. Prime
 * employers keep everything (tagged prime); commercial ones are sliced and, by
 * default, restricted to US roles (the #336 slice is US clearance / US gov).
 */
export function sliceAndFilter(seed: EmployerSeed, pulled: Pulled[], opts: { includeInternational?: boolean } = {}): Record<string, string>[] {
  const usOnly = seed.counts_as_defense ? false : !opts.includeInternational;
  const out: Record<string, string>[] = [];
  for (const p of pulled) {
    const v = classifyDefenseRelevance({ title: p.title, description: p.description, businessUnit: p.businessUnit }, { countsAsDefense: seed.counts_as_defense });
    if (v.relevance === null) continue;
    if (usOnly && !(p.row.Region || "").startsWith("US")) continue;
    p.row.DefenseRelevance = v.relevance;
    p.row.DefenseSignal = v.signal ?? "";
    out.push(p.row);
  }
  return out;
}
