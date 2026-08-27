/*
 * Resolves the places that carry defense-employer postings but are not yet
 * geographies in this database, and writes them out as an importable CSV.
 *
 * Why these are not curated cities: they are ordinary places that happen to
 * host a facility -- Tewksbury MA, Woburn MA, East Hartford CT, Cedar Rapids
 * IA. They exist only to anchor employer postings, so they are imported with
 * IsCandidate=No and never enter /explore.
 *
 * The `City` column is deliberately the RAW employer-feed spelling, not the
 * Census-matched name. locations_location carries an AFTER INSERT trigger,
 * trg_link_city_to_employer_locations, which links postings on exact
 * lower(city)/upper(state) -- so a row named "St Petersburg" links where one
 * named "St. Petersburg" would not. The Census name is recorded in the report
 * instead, where a mismatch is visible rather than silently breaking the link.
 *
 * Geocoding uses the same Census Geocoder path as lib/pace/geography.ts:
 * the gazetteer centroid when the place is a Census place, and a street guess
 * when it is not (New England towns are county subdivisions, not places, and
 * are absent from the place gazetteer entirely).
 *
 * CBSA comes from the geocoder's MSA layer when present, and falls back to the
 * county -> CBSA crosswalk in pace_derived.json, because the geocoder omits the
 * MSA layer fairly often.
 *
 * Writes files only. No database writes.
 *
 * Usage:
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/resolve-employer-geographies.ts [--limit N]
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { getSql } from "../lib/db";
import { DEFENSE_HUB_MIN_POSTINGS } from "../lib/defense";
import { nameAgrees, findInstallation } from "../lib/employer-geography";

const args = process.argv.slice(2);
const limitIdx = args.indexOf("--limit");
const LIMIT = limitIdx >= 0 ? Number(args[limitIdx + 1]) : Infinity;

const BENCHMARK = "Public_AR_Current";
const VINTAGE = "Current_Current";
const COORDS = "https://geocoding.geo.census.gov/geocoder/geographies/coordinates";
const ADDRESS = "https://geocoding.geo.census.gov/geocoder/geographies/address";
/* One-per-place street guesses; the geocoder needs an address, not a city. */
const STREET_GUESSES = ["1 Main St", "100 Main St", "1 Broadway", "1 First St"];
const CONCURRENCY = 4;

interface Layer {
  GEOID?: string;
  NAME?: string;
  BASENAME?: string;
}
interface Geographies {
  Counties?: Layer[];
  "Census Tracts"?: Layer[];
  "Incorporated Places"?: Layer[];
  "Census Designated Places"?: Layer[];
  "County Subdivisions"?: Layer[];
  "Metropolitan Statistical Areas/Micropolitan Statistical Areas"?: Layer[];
}

interface Resolved {
  city: string;
  state: string;
  onsiteHybrid: number;
  employers: string;
  lat: number | null;
  lon: number | null;
  countyFips: string | null;
  countyName: string | null;
  placeGeoid: string | null;
  censusName: string | null;
  cbsaGeoid: string | null;
  cbsaName: string | null;
  cbsaSource: "geocoder" | "county_crosswalk" | null;
  method: string;
  note: string;
}

async function getJson(url: string): Promise<{ result?: Record<string, unknown> } | null> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
      if (res.ok) return (await res.json()) as { result?: Record<string, unknown> };
      // 5xx is worth retrying; a 4xx will not improve.
      if (res.status < 500) return null;
    } catch {
      /* network hiccup; retry */
    }
    await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
  }
  return null;
}

function layersFrom(body: unknown): Geographies | null {
  const result = (body as { result?: Record<string, unknown> } | null)?.result;
  if (!result) return null;
  const matches = result.addressMatches as
    | { geographies?: Geographies; coordinates?: { x: number; y: number } }[]
    | undefined;
  return (matches?.[0]?.geographies ?? (result.geographies as Geographies)) ?? null;
}

function coordsFrom(body: unknown): { lat: number; lon: number } | null {
  const matches = (body as { result?: { addressMatches?: { coordinates?: { x: number; y: number } }[] } } | null)
    ?.result?.addressMatches;
  const c = matches?.[0]?.coordinates;
  return c ? { lat: c.y, lon: c.x } : null;
}

const first = (l?: Layer[]) => (l && l.length ? l[0] : null);

async function main() {
  const sql = getSql();
  const derivedPath = path.join(
    process.cwd(), "data", "sources", "pace", "derived", "pace_derived.json"
  );
  const derived = JSON.parse(readFileSync(derivedPath, "utf8")) as {
    place_centroids: Record<string, { geoid: string; name: string; state: string; lat: number; lon: number }>;
    county_cbsa: Record<string, string>;
  };
  const centroids = derived.place_centroids;
  const countyCbsa = derived.county_cbsa;

  /*
   * State FIPS -> USPS, derived from the gazetteer (a place GEOID is
   * SSPPPPP, so its first two digits are the state).
   *
   * This exists because both fallbacks can silently answer with the wrong
   * state. The installation lookup matched "Carson City, NV" to Fort Carson in
   * Colorado on the token "carson", and "Fort Johnson, LA" to Seymour Johnson
   * AFB in North Carolina on "johnson". The Census street guess put
   * "Schriever Afb, CO" in Schriever, Louisiana. A wrong-state answer is worse
   * than no answer: it assigns a real place to the wrong metro, where it then
   * shows up on some other city's metro employment line.
   */
  const stateFips: Record<string, string> = {};
  for (const c of Object.values(centroids)) {
    stateFips[String(c.geoid).slice(0, 2)] = c.state.toUpperCase();
  }
  const centKey = (c: string, s: string) =>
    `${c.trim().toLowerCase().replace(/\s+/g, " ")}|${s.trim().toUpperCase()}`;

  /*
   * Only places with a real physical presence. A remote-only posting is not a
   * facility and must not create a geography, matching how defense_hub already
   * refuses to promote on remote postings.
   */
  /*
   * Military reservations are not Census places, so the geocoder returns
   * nothing for "Langley Afb" or "Tinker Afb". The repo already carries
   * military_installations with coordinates, which is a sourced answer rather
   * than a guess -- use it to place them, then reverse-geocode for county/CBSA.
   */
  const installations = (await sql.query(
    `SELECT command_name, state, latitude, longitude FROM military_installations
     WHERE latitude IS NOT NULL AND longitude IS NOT NULL`
  )) as { command_name: string; state: string; latitude: number; longitude: number }[];

  const places = (await sql.query(
    `SELECT d.city, d.state,
            SUM(COALESCE(d.onsite_posting_count,0) + COALESCE(d.hybrid_posting_count,0))::int AS oh,
            string_agg(DISTINCT e.display_name, '; ' ORDER BY e.display_name) AS employers
     FROM defense_employer_locations d
     JOIN defense_employers e ON e.id = d.employer_id
     WHERE d.location_id IS NULL AND d.country = 'US'
       AND e.active AND e.counts_as_defense
     GROUP BY 1, 2
     HAVING SUM(COALESCE(d.onsite_posting_count,0) + COALESCE(d.hybrid_posting_count,0)) >= $1
     ORDER BY 3 DESC, 1`,
    [DEFENSE_HUB_MIN_POSTINGS]
  )) as { city: string; state: string; oh: number; employers: string }[];

  const targets = places.slice(0, LIMIT === Infinity ? places.length : LIMIT);
  console.log(`Resolving ${targets.length} employer place(s) with a physical presence\n`);

  const out: Resolved[] = [];
  let done = 0;

  async function resolveOne(p: { city: string; state: string; oh: number; employers: string }): Promise<Resolved> {
    const base: Resolved = {
      city: p.city, state: p.state, onsiteHybrid: p.oh, employers: p.employers,
      lat: null, lon: null, countyFips: null, countyName: null, placeGeoid: null,
      censusName: null, cbsaGeoid: null, cbsaName: null, cbsaSource: null,
      method: "unresolved", note: "",
    };

    let geo: Geographies | null = null;
    const centroid = centroids[centKey(p.city, p.state)];

    if (centroid) {
      const q = new URLSearchParams({
        benchmark: BENCHMARK, vintage: VINTAGE, format: "json",
        x: String(centroid.lon), y: String(centroid.lat),
      });
      geo = layersFrom(await getJson(`${COORDS}?${q}`));
      if (geo) {
        base.method = "gazetteer_centroid";
        base.lat = centroid.lat; base.lon = centroid.lon;
        base.placeGeoid = centroid.geoid;
        base.censusName = `${centroid.name}, ${centroid.state}`;
      }
    }

    if (!geo) {
      // New England towns and CDP-less places are not in the place gazetteer,
      // so fall back to geocoding a plausible address inside them.
      for (const street of STREET_GUESSES) {
        const q = new URLSearchParams({
          benchmark: BENCHMARK, vintage: VINTAGE, format: "json",
          street, city: p.city, state: p.state,
        });
        const body = await getJson(`${ADDRESS}?${q}`);
        const g = layersFrom(body);
        if (g) {
          geo = g;
          base.method = `street_guess:${street}`;
          const c = coordsFrom(body);
          if (c) { base.lat = c.lat; base.lon = c.lon; }
          break;
        }
      }
    }

    if (!geo) {
      const inst = findInstallation(p.city, p.state, installations);
      if (inst) {
        const q = new URLSearchParams({
          benchmark: BENCHMARK, vintage: VINTAGE, format: "json",
          x: String(inst.longitude), y: String(inst.latitude),
        });
        geo = layersFrom(await getJson(`${COORDS}?${q}`));
        if (geo) {
          base.method = `military_installation:${inst.command_name}`;
          base.lat = Number(inst.latitude);
          base.lon = Number(inst.longitude);
          base.censusName = inst.command_name;
        }
      }
    }

    if (!geo) { base.note = "geocoder returned nothing"; return base; }

    const county = first(geo.Counties);

    // Refuse a resolution that landed in a different state than the feed says.
    if (county?.GEOID) {
      const resolvedState = stateFips[String(county.GEOID).slice(0, 2)];
      if (resolvedState && resolvedState !== p.state.trim().toUpperCase()) {
        base.method = "unresolved";
        base.lat = null;
        base.lon = null;
        base.note =
          `resolved to ${resolvedState} but the feed says ${p.state} — refused ` +
          `(a wrong-state match assigns the place to the wrong metro)`;
        return base;
      }
    }

    if (county?.GEOID) {
      base.countyFips = String(county.GEOID);
      base.countyName = (county.BASENAME ?? county.NAME ?? "").replace(/\s+County$/i, "").trim() || null;
    }
    const place = first(geo["Incorporated Places"]) ?? first(geo["Census Designated Places"]);
    if (place?.GEOID && !base.placeGeoid) base.placeGeoid = String(place.GEOID);
    if (place && !base.censusName) base.censusName = place.BASENAME ?? place.NAME ?? null;
    if (!base.censusName) {
      const sub = first(geo["County Subdivisions"]);
      if (sub) base.censusName = `${sub.BASENAME ?? sub.NAME} (county subdivision)`;
    }

    /*
     * The gazetteer path found the place BY name, so it cannot have substituted
     * one. The street-guess and installation paths can, and did.
     */
    if (base.method !== "gazetteer_centroid" && !nameAgrees(p.city, base.censusName)) {
      base.method = "unresolved";
      base.lat = null;
      base.lon = null;
      base.countyFips = null;
      base.countyName = null;
      base.placeGeoid = null;
      base.note =
        `resolved to "${base.censusName}", which is not "${p.city}" — refused ` +
        `(a same-state substitution puts the place in the wrong county and metro)`;
      base.censusName = null;
      return base;
    }

    const cbsa = first(geo["Metropolitan Statistical Areas/Micropolitan Statistical Areas"]);
    if (cbsa?.GEOID) {
      base.cbsaGeoid = String(cbsa.GEOID);
      base.cbsaName = cbsa.NAME ?? null;
      base.cbsaSource = "geocoder";
    } else if (base.countyFips && countyCbsa[base.countyFips]) {
      // The geocoder omits the MSA layer often enough that this is the common path.
      base.cbsaGeoid = countyCbsa[base.countyFips];
      base.cbsaSource = "county_crosswalk";
    }
    if (!base.cbsaGeoid) base.note = "no CBSA (likely outside any metro/micro area)";
    return base;
  }

  // Modest concurrency: the Census geocoder is a public service, not ours.
  const queue = [...targets];
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      for (;;) {
        const next = queue.shift();
        if (!next) return;
        const r = await resolveOne(next);
        out.push(r);
        done++;
        if (done % 25 === 0) console.log(`  ${done}/${targets.length}`);
      }
    })
  );

  out.sort((a, b) => b.onsiteHybrid - a.onsiteHybrid || a.city.localeCompare(b.city));

  const resolved = out.filter((r) => r.countyName);
  const withCbsa = resolved.filter((r) => r.cbsaGeoid);
  const failed = out.filter((r) => !r.countyName);

  const esc = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  /*
   * The employer feed spells the same place more than one way -- "St Petersburg"
   * and "St. Petersburg", "Schriever AFB" and "Schriever Afb". Those are one
   * geography, not two, so only the best-attested spelling becomes a location
   * row and the rest become geo_aliases. Importing both would create duplicate
   * geographies for one place, which the slug preflight rightly refuses.
   *
   * Canonical = most onsite/hybrid postings, tie-broken by matching the Census
   * name, so the surviving row is the spelling the feed uses most and the one a
   * human would recognise.
   */
  const slugOf = (city: string, state: string) =>
    `${state.toLowerCase()}-${city.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
  const bySlug = new Map<string, Resolved[]>();
  for (const r of resolved) {
    const k = slugOf(r.city, r.state);
    if (!bySlug.has(k)) bySlug.set(k, []);
    bySlug.get(k)!.push(r);
  }
  const canonical: Resolved[] = [];
  const aliases: { alias: Resolved; canonicalCity: string }[] = [];
  for (const group of bySlug.values()) {
    if (group.length === 1) { canonical.push(group[0]); continue; }
    const nameMatches = (r: Resolved) =>
      r.censusName?.split(",")[0].trim().toLowerCase() === r.city.trim().toLowerCase() ? 1 : 0;
    const ranked = [...group].sort(
      (a, b) => b.onsiteHybrid - a.onsiteHybrid || nameMatches(b) - nameMatches(a)
    );
    canonical.push(ranked[0]);
    for (const other of ranked.slice(1)) aliases.push({ alias: other, canonicalCity: ranked[0].city });
  }

  const header = "City,State,County,GeoType,IsCandidate,Latitude,Longitude,BoundaryGeoid";
  const csv = [header, ...canonical.map((r) =>
    [
      esc(r.city), r.state, esc(r.countyName ?? ""), "city", "No",
      r.lat ?? "", r.lon ?? "", r.placeGeoid ?? "",
    ].join(",")
  )].join("\n") + "\n";
  writeFileSync(path.join("data", "employer_geographies.csv"), csv);

  const aliasCsv = ["RawCity,RawState,CanonicalCity,AliasKind,Source,OnsiteHybrid",
    ...aliases.map((a) => [
      esc(a.alias.city), a.alias.state, esc(a.canonicalCity), "employer_location",
      "defense employer feed spelling variant", a.alias.onsiteHybrid,
    ].join(","))].join("\n") + "\n";
  writeFileSync(path.join("data", "employer_geographies_aliases.csv"), aliasCsv);

  const canonicalSet = new Set(canonical);
  const memb = ["Slug,City,State,CbsaGeoid,CbsaSource,OnsiteHybrid",
    ...withCbsa.filter((r) => canonicalSet.has(r)).map((r) => [
      `${r.state.toLowerCase()}-${r.city.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`,
      esc(r.city), r.state, r.cbsaGeoid, r.cbsaSource, r.onsiteHybrid,
    ].join(","))].join("\n") + "\n";
  writeFileSync(path.join("data", "employer_geographies_metro.csv"), memb);

  const nameMismatch = resolved.filter(
    (r) => r.censusName && r.censusName.split(",")[0].trim().toLowerCase() !== r.city.trim().toLowerCase()
  );

  const md = [
    "# Employer geographies — resolution report",
    "",
    `**Generated:** by \`scripts/resolve-employer-geographies.ts\``,
    `**Source:** Census Geocoder (${BENCHMARK}/${VINTAGE}) + county→CBSA crosswalk from \`pace_derived.json\``,
    "",
    `- places with a physical presence: **${targets.length}**`,
    `- resolved to a county: **${resolved.length}**`,
    `- of those, assigned a CBSA: **${withCbsa.length}** ` +
      `(${withCbsa.filter((r) => r.cbsaSource === "geocoder").length} from the geocoder's MSA layer, ` +
      `${withCbsa.filter((r) => r.cbsaSource === "county_crosswalk").length} from the county crosswalk)`,
    `- unresolved: **${failed.length}**`,
    `- distinct geographies written: **${canonical.length}** (plus **${aliases.length}** feed spelling variant(s) recorded as aliases)`,
    "",
    "## Unresolved — no row written",
    "",
    failed.length
      ? failed.map((r) => `- ${r.city}, ${r.state} (${r.onsiteHybrid} onsite/hybrid) — ${r.note}`).join("\n")
      : "_none_",
    "",
    "## Name differs from the Census name",
    "",
    "The `City` column keeps the employer feed's spelling on purpose: the",
    "`trg_link_city_to_employer_locations` trigger links postings on an exact",
    "`lower(city)`/`upper(state)` match, so the Census spelling would silently fail to link.",
    "",
    nameMismatch.length
      ? nameMismatch.map((r) => `- feed \`${r.city}, ${r.state}\` ↔ census \`${r.censusName}\``).join("\n")
      : "_none_",
    "",
    "## Spelling variants recorded as aliases, not separate geographies",
    "",
    aliases.length
      ? aliases.map((a) => `- ${a.alias.city}, ${a.alias.state} (${a.alias.onsiteHybrid} onsite/hybrid) -> ${a.canonicalCity}`).join("\n")
      : "_none_",
    "",
    "## Resolved places",
    "",
    "| place | onsite+hybrid | county | CBSA | CBSA via | method | employers |",
    "|---|---:|---|---|---|---|---|",
    ...resolved.map((r) =>
      `| ${r.city}, ${r.state} | ${r.onsiteHybrid} | ${r.countyName ?? "—"} | ${r.cbsaGeoid ?? "—"} | ${r.cbsaSource ?? "—"} | ${r.method} | ${r.employers} |`
    ),
    "",
  ].join("\n");
  writeFileSync(path.join("data", "employer_geographies_report.md"), md);

  console.log(`\nresolved ${resolved.length}/${targets.length}; ${withCbsa.length} with a CBSA; ${failed.length} unresolved`);
  console.log(`${canonical.length} geographies + ${aliases.length} spelling alias(es)`);
  console.log("wrote data/employer_geographies.csv");
  console.log("wrote data/employer_geographies_aliases.csv");
  console.log("wrote data/employer_geographies_metro.csv");
  console.log("wrote data/employer_geographies_report.md");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
