/*
 * Resolves the employer places that scripts/resolve-employer-geographies.ts
 * could not, using USGS GNIS and a sourced override table instead of the
 * Census Geocoder.
 *
 * Why a second script rather than a fourth fallback in the first one: these
 * places fail for a reason the Census Geocoder cannot fix. They are not Census
 * places at all -- military reservations, unincorporated communities, and Guam
 * villages -- so no amount of street guessing will find them. GNIS names
 * populated places and military features regardless of Census status, which is
 * exactly the gap.
 *
 * The renamed installations are handled by an explicit alias table rather than
 * fuzzy matching. Every entry is a documented, dated rename; a shared-token
 * match is what previously turned "Carson City, NV" into Fort Carson, Colorado.
 *
 * Both guards from the first script are enforced here too:
 *   - the GNIS hit must be in the state the feed named;
 *   - the reverse-geocoded county must decode to that same state.
 * A refusal is recorded with its reason, because an honest gap beats a wrong
 * county and a wrong metro.
 *
 * Writes files only. No database writes.
 *
 * Usage:
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/resolve-remaining-employer-geographies.ts
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { getSql } from "../lib/db";

const GNIS =
  "https://carto.nationalmap.gov/arcgis/rest/services/geonames/MapServer/find";
const COORDS =
  "https://geocoding.geo.census.gov/geocoder/geographies/coordinates";
const BENCHMARK = "Public_AR_Current";
const VINTAGE = "Current_Current";

/*
 * Documented installation renames. The employer feed uses the current name
 * while GNIS may still carry the historical one, or vice versa. Each entry
 * lists names to try, most-likely first.
 *
 * Space Force redesignations (2020-2021) renamed several Air Force bases;
 * Fort Rucker became Fort Novosel in 2023. These are recorded here rather than
 * inferred, so a reader can check them.
 */
/*
 * Sourced overrides for places GNIS cannot answer for, verified 2026-08-27.
 *
 * Two classes, both structural rather than incidental:
 *
 *   1. Military installations and airports. USGS REMOVED administrative
 *      features -- airport, military and 18 other classes -- from GNIS in 2021,
 *      so no amount of name juggling will find Buckley SFB there. The DoD MIRTA
 *      "DoD Sites" service is the authority, and the repo already cites it in
 *      data/army_installations_coordinates.json.
 *
 *   2. Pennsylvania townships. A township is a civil division, not a populated
 *      place, so a GNIS populated-place query for "Cranberry" in PA returns the
 *      Luzerne County hamlet and never Butler County's Cranberry Township --
 *      which is the Pittsburgh-area municipality the employer feed means. The
 *      Census TIGERweb county-subdivision internal point is the authority.
 *
 * Coordinates and CBSAs below are point-verified against the Census Geocoder.
 */
interface Override {
  county: string;
  lat: number;
  lon: number;
  cbsa: string | null;
  source: string;
  note?: string;
}

const OVERRIDES: Record<string, Override> = {
  "cranberry township|PA": {
    county: "Butler", lat: 40.7099671, lon: -80.1056416, cbsa: "38300",
    source: "Census TIGERweb county subdivision 4201916920 internal point",
    note: "Butler County, Pittsburgh metro. NOT the Luzerne County hamlet a GNIS populated-place query returns.",
  },
  "dulles|VA": {
    county: "Loudoun", lat: 38.947464, lon: -77.459931, cbsa: "47900",
    source: "FAA US_Airport service, KIAD airport reference point",
    note: "Not a place name: 'Dulles' is an airport, a Loudoun magisterial district and a USPS mailing name. No GNIS feature, no CDP.",
  },
  "buckley sfb|CO": {
    county: "Arapahoe", lat: 39.706670022, lon: -104.757689049, cbsa: "19740",
    source: "DoD MIRTA DoD Sites, SITENAME 'Buckley Space Force Base'",
    note: "Renamed from Buckley AFB on 2021-06-04. Inside Aurora city limits.",
  },
  "peterson afb|CO": {
    county: "El Paso", lat: 38.822897304, lon: -104.696135201, cbsa: "17820",
    source: "DoD MIRTA DoD Sites, SITENAME 'Peterson Space Force Base'",
    note: "Renamed from Peterson AFB on 2021-07-26.",
  },
  "patrick air force base|FL": {
    county: "Brevard", lat: 28.233570331, lon: -80.608413490, cbsa: "37340",
    source: "DoD MIRTA DoD Sites, SITENAME 'Patrick Space Force Base'",
    note: "Renamed from Patrick AFB on 2020-12-09. Census CDP is still named 'Patrick AFB CDP'.",
  },
  "fort novosel|AL": {
    county: "Dale", lat: 31.403955, lon: -85.747317, cbsa: "37120",
    source: "DoD MIRTA DoD Sites, SITENAME 'Fort Novosel'",
    note: "CBSA is Ozark AL Micro (37120), not Enterprise. The post was renamed BACK to Fort Rucker on 2025-07-17; MIRTA and Census both still carry 'Fort Novosel', and the employer feed uses it, so the row keeps that name.",
  },
  "fort shafter|HI": {
    county: "Honolulu", lat: 21.345840, lon: -157.883504, cbsa: "46520",
    source: "DoD MIRTA DoD Sites, SITENAME 'Fort Shafter'",
  },
  "jber|AK": {
    county: "Anchorage", lat: 61.269787, lon: -149.811208, cbsa: "11260",
    source: "DoD MIRTA DoD Sites, SITENAME 'Joint Base Elmendorf-Richardson', ISJOINTBASE=yes",
    note: "GNIS answers 'Fort Richardson' for this point, which is one of the two merged installations rather than the joint base.",
  },
  "hanover|MD": {
    county: "Anne Arundel", lat: 39.1714186, lon: -76.7233284, cbsa: "12580",
    source: "Census TIGERweb ZCTA 21076 internal point",
    note: "Contested. The GNIS point (584857) is a historical village locus in HOWARD county that falls inside Elkridge CDP; the modern Hanover MD 21076 community, which carries the BWI / Fort Meade / National Business Park office addresses this employer row refers to, centres in ANNE ARUNDEL. CBSA is 12580 either way, so the metro join is unaffected by the choice.",
  },
};

const NAME_ALIASES: Record<string, string[]> = {
  "buckley sfb|CO": ["Buckley Space Force Base", "Buckley Air Force Base", "Buckley Field"],
  "peterson afb|CO": ["Peterson Space Force Base", "Peterson Air Force Base", "Peterson Field"],
  "patrick air force base|FL": ["Patrick Space Force Base", "Patrick Air Force Base"],
  "fort novosel|AL": ["Fort Novosel", "Fort Rucker"],
  "jber|AK": [
    "Joint Base Elmendorf-Richardson",
    "Elmendorf Air Force Base",
    "Fort Richardson",
  ],
  "fort shafter|HI": ["Fort Shafter"],
  "dulles|VA": ["Dulles", "Washington Dulles International Airport"],
  "opa locka|FL": ["Opa-locka"],
  "cranberry township|PA": ["Cranberry Township", "Cranberry"],
  "merrimack|NH": ["Merrimack"],
  "linthicum heights|MD": ["Linthicum Heights", "Linthicum"],
  "santa rita|GU": ["Santa Rita", "Santa Rita-Sumay"],
};

interface GnisHit {
  name: string;
  lat: number;
  lon: number;
  county: string | null;
  gnisId: string | null;
  featureClass: string | null;
}

interface Row {
  city: string;
  state: string;
  oh: number;
  employers: string;
  tried: string[];
  gnis: GnisHit | null;
  countyFips: string | null;
  countyName: string | null;
  cbsaGeoid: string | null;
  censusPlace: string | null;
  refusal: string | null;
  sourceNote?: string;
}

async function getJson(url: string): Promise<unknown> {
  for (let i = 0; i < 3; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return await res.json();
      if (res.status < 500) return null;
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 400 * (i + 1)));
  }
  return null;
}

async function gnisLookup(name: string, state: string): Promise<GnisHit | null> {
  const url =
    `${GNIS}?searchText=${encodeURIComponent(name)}&contains=false` +
    `&searchFields=gaz_name&layers=0,1,2,3,4,5&returnGeometry=true&sr=4326&f=json`;
  const body = (await getJson(url)) as
    | { results?: { attributes?: Record<string, string>; geometry?: { points?: number[][] } }[] }
    | null;
  const results = body?.results ?? [];

  for (const r of results) {
    const a = r.attributes ?? {};
    // The state filter is the first guard: a same-named feature in another
    // state is exactly the failure mode that shipped seven bad rows.
    if (String(a.state_alpha ?? "").toUpperCase() !== state.toUpperCase()) continue;
    const pt = r.geometry?.points?.[0];
    if (!pt || pt.length < 2) continue;
    return {
      name: String(a.gaz_name ?? name),
      lon: Number(pt[0]),
      lat: Number(pt[1]),
      county: a.county_name ? String(a.county_name) : null,
      gnisId: a.gaz_id ? String(a.gaz_id) : null,
      featureClass: a.gaz_featureclass ? String(a.gaz_featureclass) : null,
    };
  }
  return null;
}

async function main() {
  const sql = getSql();
  const derived = JSON.parse(
    readFileSync(
      path.join(process.cwd(), "data", "sources", "pace", "derived", "pace_derived.json"),
      "utf8"
    )
  ) as {
    place_centroids: Record<string, { geoid: string; state: string }>;
    county_cbsa: Record<string, string>;
  };
  const countyCbsa = derived.county_cbsa;
  const stateFips: Record<string, string> = {};
  for (const c of Object.values(derived.place_centroids)) {
    stateFips[String(c.geoid).slice(0, 2)] = c.state.toUpperCase();
  }
  // Guam has no entry in the place gazetteer, so seed its FIPS explicitly.
  stateFips["66"] = "GU";

  const places = (await sql.query(
    `SELECT d.city, d.state,
            SUM(COALESCE(d.onsite_posting_count,0) + COALESCE(d.hybrid_posting_count,0))::int AS oh,
            string_agg(DISTINCT e.display_name, '; ') AS employers
     FROM defense_employer_locations d
     JOIN defense_employers e ON e.id = d.employer_id
     WHERE d.location_id IS NULL AND d.country = 'US'
       AND e.active AND e.counts_as_defense
     GROUP BY 1, 2
     HAVING SUM(COALESCE(d.onsite_posting_count,0) + COALESCE(d.hybrid_posting_count,0)) >= 1
     ORDER BY 3 DESC, 1`
  )) as { city: string; state: string; oh: number; employers: string }[];

  console.log(`Resolving ${places.length} remaining place(s) via GNIS\n`);
  const out: Row[] = [];

  for (const p of places) {
    const key = `${p.city.trim().toLowerCase()}|${p.state.toUpperCase()}`;
    const candidates = NAME_ALIASES[key] ?? [p.city];
    const row: Row = {
      city: p.city, state: p.state, oh: p.oh, employers: p.employers,
      tried: candidates, gnis: null, countyFips: null, countyName: null,
      cbsaGeoid: null, censusPlace: null, refusal: null,
    };

    /*
     * A sourced override wins outright. These are the places GNIS structurally
     * cannot answer for, so trying it first would only risk a near-miss like
     * the Luzerne "Cranberry".
     */
    const override = OVERRIDES[key];
    if (override) {
      row.gnis = {
        name: p.city, lat: override.lat, lon: override.lon,
        county: override.county, gnisId: null, featureClass: "sourced override",
      };
      row.countyName = override.county;
      row.cbsaGeoid = override.cbsa;
      row.sourceNote = override.source + (override.note ? ` — ${override.note}` : "");
      out.push(row);
      console.log(
        `  ✓ ${(p.city + ", " + p.state).padEnd(30)} [override] county=${override.county} ` +
          `cbsa=${override.cbsa ?? "-"} ${override.lat.toFixed(4)},${override.lon.toFixed(4)}`
      );
      continue;
    }

    for (const candidate of candidates) {
      const hit = await gnisLookup(candidate, p.state);
      if (hit) { row.gnis = hit; break; }
    }
    if (!row.gnis) {
      row.refusal = `no GNIS feature named ${candidates.map((c) => `"${c}"`).join(" or ")} in ${p.state}`;
      out.push(row);
      console.log(`  ✗ ${(p.city + ", " + p.state).padEnd(30)} ${row.refusal}`);
      continue;
    }

    // Reverse-geocode for the county FIPS, which is what the CBSA crosswalk needs.
    const q = new URLSearchParams({
      benchmark: BENCHMARK, vintage: VINTAGE, format: "json",
      x: String(row.gnis.lon), y: String(row.gnis.lat),
    });
    const body = (await getJson(`${COORDS}?${q}`)) as
      | { result?: { geographies?: Record<string, { GEOID?: string; NAME?: string; BASENAME?: string }[]> } }
      | null;
    const g = body?.result?.geographies;
    const county = g?.["Counties"]?.[0];
    const place = g?.["Incorporated Places"]?.[0] ?? g?.["Census Designated Places"]?.[0];
    if (place) row.censusPlace = place.BASENAME ?? place.NAME ?? null;

    if (county?.GEOID) {
      const fips = String(county.GEOID);
      const decoded = stateFips[fips.slice(0, 2)];
      if (decoded && decoded !== p.state.toUpperCase()) {
        row.refusal = `GNIS point reverse-geocodes to ${decoded}, not ${p.state}`;
        out.push(row);
        console.log(`  ✗ ${(p.city + ", " + p.state).padEnd(30)} ${row.refusal}`);
        continue;
      }
      row.countyFips = fips;
      row.countyName = (county.BASENAME ?? county.NAME ?? "").replace(/\s+County$/i, "").trim() || null;
      row.cbsaGeoid = countyCbsa[fips] ?? null;
    } else if (row.gnis.county) {
      // Guam and some territories return no Counties layer; GNIS still names one.
      row.countyName = row.gnis.county;
    }

    out.push(row);
    console.log(
      `  ✓ ${(p.city + ", " + p.state).padEnd(30)} ${row.gnis.name} ` +
        `[${row.gnis.featureClass}] county=${row.countyName ?? "?"} ` +
        `cbsa=${row.cbsaGeoid ?? "-"} ${row.gnis.lat.toFixed(4)},${row.gnis.lon.toFixed(4)}`
    );
  }

  const resolved = out.filter((r) => r.gnis && !r.refusal && r.countyName);
  const refused = out.filter((r) => !r.gnis || r.refusal || !r.countyName);

  const esc = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  const csv = [
    "City,State,County,GeoType,IsCandidate,Latitude,Longitude,BoundarySource",
    ...resolved.map((r) =>
      [
        esc(r.city), r.state, esc(r.countyName ?? ""), "city", "No",
        r.gnis!.lat, r.gnis!.lon,
        esc(
          r.sourceNote
            ? r.sourceNote.split(" — ")[0]
            : `USGS GNIS ${r.gnis!.featureClass ?? "feature"}${r.gnis!.gnisId ? ` (ID ${r.gnis!.gnisId})` : ""}`
        ),
      ].join(",")
    ),
  ].join("\n") + "\n";
  writeFileSync(path.join("data", "employer_geographies_remaining.csv"), csv);

  const metro = [
    "Slug,City,State,CbsaGeoid,OnsiteHybrid",
    ...resolved.filter((r) => r.cbsaGeoid).map((r) =>
      [
        `${r.state.toLowerCase()}-${r.city.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`,
        esc(r.city), r.state, r.cbsaGeoid, r.oh,
      ].join(",")
    ),
  ].join("\n") + "\n";
  writeFileSync(path.join("data", "employer_geographies_remaining_metro.csv"), metro);

  const md = [
    "# Remaining employer geographies — GNIS resolution",
    "",
    "Resolved with USGS GNIS rather than the Census Geocoder, because these places",
    "have no Census place geography: military reservations, unincorporated",
    "communities, and Guam villages. Renamed installations use the documented",
    "alias table in the script, not fuzzy matching.",
    "",
    `- attempted: **${out.length}**`,
    `- resolved: **${resolved.length}**`,
    `- refused: **${refused.length}**`,
    "",
    "## Resolved",
    "",
    "| place | onsite+hybrid | source and provenance | county | CBSA | coordinates |",
    "|---|---:|---|---|---|---|",
    ...resolved.map((r) =>
      `| ${r.city}, ${r.state} | ${r.oh} | ${r.sourceNote ?? `USGS GNIS ${r.gnis!.name}${r.gnis!.gnisId ? ` (${r.gnis!.gnisId})` : ""}`} | ${r.countyName ?? "—"} | ${r.cbsaGeoid ?? "—"} | ${r.gnis!.lat.toFixed(6)}, ${r.gnis!.lon.toFixed(6)} |`
    ),
    "",
    "## Refused — no row written",
    "",
    refused.length
      ? refused.map((r) =>
          `- **${r.city}, ${r.state}** (${r.oh} onsite/hybrid) — ${r.refusal ?? "no county resolved"}. Tried: ${r.tried.join(", ")}`
        ).join("\n")
      : "_none_",
    "",
    "## Name aliases applied",
    "",
    ...resolved
      .filter((r) => r.gnis!.name.toLowerCase() !== r.city.toLowerCase())
      .map((r) => `- feed \`${r.city}, ${r.state}\` → GNIS \`${r.gnis!.name}\``),
    "",
  ].join("\n");
  writeFileSync(path.join("data", "employer_geographies_remaining_report.md"), md);

  console.log(`\nresolved ${resolved.length}/${out.length}; refused ${refused.length}`);
  console.log("wrote data/employer_geographies_remaining.csv");
  console.log("wrote data/employer_geographies_remaining_metro.csv");
  console.log("wrote data/employer_geographies_remaining_report.md");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
