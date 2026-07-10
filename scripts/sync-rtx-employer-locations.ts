/*
 * Snapshots RTX US job locations per business unit from the public careers API.
 *
 * RTX runs on Phenom People. The search-results page exposes a faceted endpoint
 * that returns exact per-city counts:
 *
 *   POST https://careers.rtx.com/widgets   { ddoKey: "refineSearch", ... }
 *
 * Two details make or break the data:
 *
 *   - Facet on `location` ("city, State, Country"), never on `city`. The bare
 *     city facet collides: Middletown exists in CT, PA and NY.
 *   - Filter on `locationType`. Remote postings are tagged to a city where the
 *     employer has no facility, so they must be counted separately and excluded
 *     from the defense-hub signal.
 *
 * Per-city counts sum to MORE than totalHits because a single posting can list
 * several cities. Never add them up to get a job total.
 *
 * Usage:
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/sync-rtx-employer-locations.ts [--dry-run]
 *
 * Set RTX_CSRF_TOKEN if the endpoint starts rejecting anonymous requests.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { DEFENSE_EMPLOYER_SEEDS, DEFENSE_HUB_MIN_POSTINGS } from "../lib/defense";
import { STATE_NAME_TO_ABBR } from "../lib/states";
import {
  getEmployerIdBySlug,
  getLocationIdByCityState,
  upsertPostingCounts,
  type PostingCounts,
} from "./lib/defense-db";

const dryRun = process.argv.includes("--dry-run");
const US = "United States of America";
const DATA_DIR = path.join(process.cwd(), "data");
const RAW_DIR = path.join(DATA_DIR, "raw");
const TODAY = new Date().toISOString().slice(0, 10);
const SEARCH_URL = "https://careers.rtx.com/global/en/search-results";

/** STATE_NAME_TO_ABBR is ported 1:1 from Django and omits territories. */
const TERRITORIES: Record<string, string> = {
  "Puerto Rico": "PR",
  "District of Columbia": "DC",
};

const WORK_TYPES = ["Onsite", "Hybrid", "Remote"] as const;
type WorkType = (typeof WORK_TYPES)[number];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function headers(): Record<string, string> {
  const h: Record<string, string> = {
    "content-type": "application/json",
    accept: "*/*",
    origin: "https://careers.rtx.com",
    referer: SEARCH_URL,
    "user-agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36",
  };
  if (process.env.RTX_CSRF_TOKEN) h["x-csrf-token"] = process.env.RTX_CSRF_TOKEN;
  return h;
}

interface FacetResult {
  totalHits: number;
  /** "city|ST" -> count */
  cities: Map<string, { city: string; state: string; count: number }>;
}

async function refineSearch(
  businessUnit: string,
  workType: WorkType | null,
  rawTag: string
): Promise<FacetResult> {
  const selected: Record<string, string[]> = {
    country: [US],
    businessUnit: [businessUnit],
  };
  if (workType) selected.locationType = [workType];

  const res = await fetch("https://careers.rtx.com/widgets", {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      lang: "en_global",
      deviceType: "desktop",
      country: "global",
      pageName: "search-results",
      pageId: "page19-ds",
      siteType: "external",
      refNum: "RAYTGLOBAL",
      locale: "en_global",
      ddoKey: "refineSearch",
      all_fields: ["location"],
      selected_fields: selected,
      keywords: "",
      global: true,
      counts: true,
      jobs: false,
      size: 1,
      from: 0,
      sortBy: "",
      subsearch: "",
      clearAll: false,
      jdsource: "facets",
      isSliderEnable: false,
      locationData: {},
      irs: false,
    }),
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`refineSearch ${businessUnit}/${workType ?? "all"} -> HTTP ${res.status}: ${text.slice(0, 200)}`);
  }

  mkdirSync(RAW_DIR, { recursive: true });
  writeFileSync(path.join(RAW_DIR, `rtx_${rawTag}.json`), text);

  const parsed = JSON.parse(text).refineSearch;
  if (!parsed || typeof parsed.totalHits !== "number") {
    throw new Error(`refineSearch ${businessUnit}: unexpected payload shape`);
  }

  const facet =
    (parsed.data?.aggregations ?? []).find(
      (a: { field: string }) => a.field === "location"
    )?.value ?? {};

  const cities = new Map<string, { city: string; state: string; count: number }>();
  for (const [key, count] of Object.entries(facet as Record<string, number>)) {
    // "tucson, Arizona, United States of America"
    const parts = key.split(", ");
    if (parts.length < 3 || parts[parts.length - 1] !== US) continue;
    const stateName = parts[parts.length - 2];
    const state = STATE_NAME_TO_ABBR[stateName] ?? TERRITORIES[stateName];
    if (!state) {
      console.warn(`  ! unmapped state "${stateName}" (${key}) — skipped`);
      continue;
    }
    const city = titleCase(parts.slice(0, parts.length - 2).join(", "));
    cities.set(`${city.toLowerCase()}|${state}`, { city, state, count });
  }
  return { totalHits: parsed.totalHits, cities };
}

/**
 * Coordinates come from the *locations* page's map endpoint, which aggregates
 * across every business unit and is the only facet that carries latlong.
 * Returns "city|ST" -> [lat, lon].
 */
async function fetchCoordinates(): Promise<Map<string, [number, number]>> {
  const res = await fetch("https://careers.rtx.com/widgets", {
    method: "POST",
    headers: { ...headers(), referer: "https://careers.rtx.com/global/en/locations" },
    body: JSON.stringify({
      selected_fields: { country: [US] },
      all_fields: ["country", "state", "city", "location"],
      maps: true,
      aggfield: "city",
      locale: "en_global",
      counts: true,
      pageName: "locations",
      pageType: "content",
      lang: "en_global",
      deviceType: "desktop",
      country: "global",
      refNum: "RAYTGLOBAL",
      siteType: "external",
      pageId: "page15-ds",
      pageStateData: {},
      ddoKey: "refineMapSearch",
    }),
  });
  const text = await res.text();
  if (!res.ok) {
    console.warn(`  ! coordinate fetch failed (HTTP ${res.status}) — continuing without latlong`);
    return new Map();
  }
  mkdirSync(RAW_DIR, { recursive: true });
  writeFileSync(path.join(RAW_DIR, "rtx_map.json"), text);

  const agg =
    (JSON.parse(text).refineMapSearch?.data?.aggregations ?? []).find(
      (a: { field: string }) => a.field === "city"
    )?.value ?? [];

  const out = new Map<string, [number, number]>();
  for (const row of agg as {
    city: string;
    state: string;
    country: string;
    latlong?: { lat: number; lon: number };
  }[]) {
    if (row.country !== US || !row.latlong) continue;
    const state = STATE_NAME_TO_ABBR[row.state] ?? TERRITORIES[row.state];
    if (!state) continue;
    out.set(`${row.city.toLowerCase()}|${state}`, [row.latlong.lat, row.latlong.lon]);
  }
  return out;
}

/** The API lowercases city names; restore display casing. */
function titleCase(s: string): string {
  return s
    .split(/(\s+|-)/)
    .map((w) => (/^[a-z]/.test(w) ? w[0].toUpperCase() + w.slice(1) : w))
    .join("");
}

const csvCell = (v: unknown) =>
  v === null || v === undefined ? "" : `"${String(v).replace(/"/g, '""')}"`;

async function main() {
  const employers = DEFENSE_EMPLOYER_SEEDS.filter(
    (e) => e.ats_kind === "phenom" && e.ats_config?.businessUnit
  );

  console.log(`RTX careers sync${dryRun ? " (dry run)" : ""} — ${employers.length} business units\n`);

  const coords = await fetchCoordinates();
  console.log(`Coordinates for ${coords.size} US cities\n`);
  await sleep(400);

  let grandTotal = 0;
  const perEmployer: { slug: string; rows: PostingCounts[]; totalHits: number }[] = [];

  for (const emp of employers) {
    const bu = String(emp.ats_config!.businessUnit);

    // Unfiltered first: this is the authoritative per-city total, because a
    // city can also carry postings whose locationType is "Unspecified".
    const all = await refineSearch(bu, null, `${emp.slug}_all`);
    await sleep(400);

    const byType = {} as Record<WorkType, FacetResult>;
    for (const wt of WORK_TYPES) {
      byType[wt] = await refineSearch(bu, wt, `${emp.slug}_${wt.toLowerCase()}`);
      await sleep(400);
    }

    const rows: PostingCounts[] = [];
    for (const [key, { city, state, count }] of all.cities) {
      const onsite = byType.Onsite.cities.get(key)?.count ?? 0;
      const hybrid = byType.Hybrid.cities.get(key)?.count ?? 0;
      const remote = byType.Remote.cities.get(key)?.count ?? 0;
      if (onsite + hybrid + remote > count) {
        throw new Error(
          `${emp.slug} ${city}, ${state}: onsite+hybrid+remote (${onsite + hybrid + remote}) exceeds total (${count})`
        );
      }
      const latlon = coords.get(key);
      rows.push({
        employer_slug: emp.slug,
        country: "US",
        state,
        city,
        latitude: latlon?.[0] ?? null,
        longitude: latlon?.[1] ?? null,
        onsite,
        hybrid,
        remote,
        total: count,
        snapshot_date: TODAY,
        source_url: SEARCH_URL,
      });
    }

    rows.sort((a, b) => b.total - a.total || a.city.localeCompare(b.city));
    perEmployer.push({ slug: emp.slug, rows, totalHits: all.totalHits });
    grandTotal += all.totalHits;

    const hub = rows.filter((r) => r.onsite + r.hybrid >= DEFENSE_HUB_MIN_POSTINGS).length;
    console.log(
      `${emp.display_name.padEnd(20)} totalHits=${String(all.totalHits).padStart(5)}  ` +
        `us_cities=${String(rows.length).padStart(3)}  >=${DEFENSE_HUB_MIN_POSTINGS} onsite+hybrid: ${hub}`
    );
    console.log(
      `  onsite=${byType.Onsite.totalHits} hybrid=${byType.Hybrid.totalHits} remote=${byType.Remote.totalHits}`
    );
  }

  // Tripwire: if RTX reshapes their facets, the parts stop summing to the whole.
  console.log(`\nSum of per-BU totalHits: ${grandTotal}`);
  if (grandTotal < 2500 || grandTotal > 4000) {
    throw new Error(`Implausible US job total ${grandTotal}; refusing to write. Inspect data/raw/.`);
  }

  // CSV snapshots — committed so a re-sync is diffable and auditable.
  for (const { slug, rows } of perEmployer) {
    const header =
      "EmployerSlug,Country,State,City,OnsitePostings,HybridPostings,RemotePostings,TotalPostings,SnapshotDate,SourceUrl";
    const body = rows
      .map((r) =>
        [
          r.employer_slug, r.country, r.state, r.city,
          r.onsite, r.hybrid, r.remote, r.total, r.snapshot_date, r.source_url,
        ].map(csvCell).join(",")
      )
      .join("\n");
    const file = path.join(DATA_DIR, `rtx_${slug}_job_locations.csv`);
    if (dryRun) console.log(`  = would write ${file} (${rows.length} rows)`);
    else {
      writeFileSync(file, `${header}\n${body}\n`);
      console.log(`  + wrote ${file} (${rows.length} rows)`);
    }
  }

  if (dryRun) {
    console.log("\nDry run complete — nothing written to the database.");
    return;
  }

  const employerIds = await getEmployerIdBySlug();
  const locationIds = await getLocationIdByCityState();
  let upserted = 0;
  let linked = 0;
  for (const { rows } of perEmployer) {
    for (const row of rows) {
      await upsertPostingCounts(row, employerIds, locationIds);
      upserted++;
      if (locationIds.has(`${row.city.toLowerCase()}|${row.state}`)) linked++;
    }
  }
  console.log(`\nUpserted ${upserted} employer-location rows (${linked} linked to a retirement location).`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
