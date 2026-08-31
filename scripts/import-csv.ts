/*
 * Port of `python manage.py import_csv <path> [--clear]`
 * (locations/management/commands/import_csv.py).
 *
 * Usage:
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/import-csv.ts <csv> [--clear] [--dry-run] [--allow-incomplete]
 *
 * Upserts locations keyed on `slug`. That used to be (name, state), matching
 * Django's update_or_create, but below city level it is not unique -- a second
 * "Downtown, CA" silently overwrote the first.
 *
 * A CSV may declare `GeoType` (city | neighborhood | cdp | county | metro) and
 * `ParentSlug`. Omitted, a row is a city with no parent and behaves exactly as
 * it always has. A non-city row is imported with is_candidate=false, so it gets
 * a profile page and resolves employer postings but never enters /explore.
 *
 * --dry-run parses and reports without touching the database.
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { parse } from "csv-parse/sync";
import { getSql } from "../lib/db";
import {
  geoTypeOf,
  isCandidateOf,
  locationCsvCompletionProblems,
  locationCsvSafetyProblems,
} from "../lib/location-completeness";
import { assertLocationImportTransition, buildLocationUpsert, type ImportParent as ParentGeo } from "../lib/location-import";
import { isUnresolvedGeographyRow } from "../lib/geography-import-status";
import { geoSlug } from "../lib/geo-slug";
import { deriveCostOfLivingCategory } from "../lib/cost-of-living";
import { classifyClimate } from "../lib/climate-category";
import { classifyAndPersist, classifyLocation } from "../lib/pace";
import type { PaceDerivedBundle, PacePlaceCentroid } from "../lib/pace/types";

let centroidsCache: Record<string, PacePlaceCentroid> | null = null;

function getCentroids(): Record<string, PacePlaceCentroid> {
  if (centroidsCache) return centroidsCache;
  try {
    const bundlePath = path.join(process.cwd(), "data", "sources", "pace", "derived", "pace_derived.json");
    if (existsSync(bundlePath)) {
      const bundle = JSON.parse(readFileSync(bundlePath, "utf8")) as PaceDerivedBundle;
      centroidsCache = bundle.place_centroids ?? {};
    }
  } catch {
    centroidsCache = {};
  }
  return centroidsCache ?? {};
}

const PLACE_ALIASES: Record<string, string> = {
  "indianapolis|in": "indianapolis city (balance)|in",
  "honolulu|hi": "urban honolulu|hi",
  "boise|id": "boise city|id",
  "nashville|tn": "nashville-davidson metropolitan government (balance)|tn",
};

function resolveCoordinates(name: string, state: string, rawLat?: string, rawLon?: string): { latitude: number | null; longitude: number | null } {
  const csvLat = parseDecimalV(rawLat);
  const csvLon = parseDecimalV(rawLon);
  if (csvLat !== null && csvLon !== null) {
    return { latitude: csvLat, longitude: csvLon };
  }
  const centroids = getCentroids();
  const normName = name.trim().toLowerCase().replace(/\s+/g, " ");
  const normState = state.trim().toUpperCase();
  const rawKey = `${normName}|${normState}`;
  const key = PLACE_ALIASES[rawKey] ?? rawKey;
  const point = centroids[key];
  if (point) {
    return { latitude: point.lat, longitude: point.lon };
  }
  return { latitude: null, longitude: null };
}

type Row = Record<string, string>;

const cleanEmpty = (v: string | undefined): string | null => {
  if (v == null) return null;
  const t = String(v).trim();
  return t === "" || t === "?" || t === "NA" ? null : t;
};

const parseIntV = (v: string | undefined): number | null => {
  const c = cleanEmpty(v);
  if (c === null) return null;
  const s = c.replace(/,/g, "");
  return /^[+-]?\d+$/.test(s) ? parseInt(s, 10) : null; // strict int, like Python int()
};

const parseDecimalV = (v: string | undefined): number | null => {
  const c = cleanEmpty(v);
  if (c === null) return null;
  const n = Number(c);
  return Number.isFinite(n) ? n : null;
};

const parseFloatV = parseDecimalV;

const parseBoolV = (v: string | undefined): boolean | null => {
  const c = cleanEmpty(v);
  if (c === null) return null;
  return ["y", "yes", "true", "t", "1"].includes(c.toLowerCase());
};

const parseHomeValue = (v: string | undefined): number | null => {
  const c = cleanEmpty(v);
  if (c === null) return null;
  let norm = c.replace(/\$/g, "").replace(/,/g, "").trim();
  let multiplier = 1;
  if (norm.toLowerCase().endsWith("m")) {
    multiplier = 1_000_000;
    norm = norm.slice(0, -1);
  } else if (norm.toLowerCase().endsWith("k")) {
    multiplier = 1_000;
    norm = norm.slice(0, -1);
  }
  const n = Number(norm);
  return Number.isFinite(n) ? n * multiplier : null;
};

const parseTags = (v: string | undefined): string[] => {
  const c = cleanEmpty(v);
  if (c === null) return [];
  try {
    const parsed = JSON.parse(c);
    if (Array.isArray(parsed)) {
      return parsed.map((i) => String(i).trim()).filter((s) => s);
    }
  } catch {
    /* not JSON */
  }
  for (const sep of ["|", ";", ","]) {
    if (c.includes(sep)) {
      return c.split(sep).map((p) => p.trim()).filter((p) => p);
    }
  }
  return [c];
};

/** The parent's slug, or null for a top-level place. */
function parentSlugOf(row: Row): string | null {
  return cleanEmpty(row["ParentSlug"] ?? "") ?? null;
}

function parseRow(row: Row): Record<string, unknown> {
  const rawHomeValue = row["AvgHomeValue"] ?? "";
  const city = cleanEmpty(row["City"] ?? "") ?? "";
  const state = cleanEmpty(row["State"] ?? "") ?? "";
  const coords = resolveCoordinates(city, state, row["Latitude"], row["Longitude"]);
  const geoType = geoTypeOf(row);
  const parentSlug = parentSlugOf(row);
  const isCandidate = isCandidateOf(row, geoType);

  const climate = cleanEmpty(row["Climate"] ?? "") ?? (isCandidate ? "" : null);
  const snow_annual = parseIntV(row["Snow"]);
  const rain_annual = parseIntV(row["Rain"]);
  const alw = parseIntV(row["AverageLowWinter"]);
  const avg_high_summer = parseIntV(row["AverageHighSummer"]);
  const humidity_summer = parseIntV(row["HumiditySummer"]);
  /*
   * Derive climate_category at ingest from the same classifier categorize-climate.ts
   * uses, so a newly imported city is never left with a null bucket that a later
   * follow-up has to remember to fill (issue #64). Only a ranked candidate gets a
   * value — a structural parent inherits its climate from a station at read time
   * (lib/geo-inheritance.ts), so a derived bucket here would be an inherited
   * placeholder. A candidate missing avg_high_summer is caught by the completion
   * gate before it reaches this point, so the derived value is well-grounded.
   */
  const climate_category = isCandidate
    ? classifyClimate({ climate, snow_annual, rain_annual, alw, avg_high_summer, humidity_summer })
    : null;

  return {
    name: city,
    state: state,
    county: cleanEmpty(row["County"]),
    /*
     * Identity. The slug is the upsert key -- (name, state) is not unique below
     * city level. is_candidate is the ranking gate and defaults to false for
     * anything that is not a city, so a neighborhood cannot reach /explore by
     * being imported; promoting one is a deliberate, separate act.
     */
    slug: geoSlug(city, state, parentSlug),
    geo_type: geoType,
    is_candidate: isCandidateOf(row, geoType),
    population_source: cleanEmpty(row["PopulationSource"]),
    ...("PopulationUnavailableReason" in row ? { population_unavailable_reason: cleanEmpty(row["PopulationUnavailableReason"]) } : {}),
    population_vintage: cleanEmpty(row["PopulationVintage"]),
    boundary_source: cleanEmpty(row["BoundarySource"]),
    boundary_geoid: cleanEmpty(row["BoundaryGeoid"]),
    latitude: coords.latitude,
    longitude: coords.longitude,
    // Nullable since the geo-hierarchy migration. A city keeps the historical
    // empty-string default; a geography that inherits its climate stores NULL,
    // because a placeholder is indistinguishable from a researched value.
    climate,
    // Derived above from the shared classifier; NULL for a non-candidate, which
    // resolves its bucket from a station at read time rather than storing one.
    climate_category,
    // locations_location.cost_of_living is NOT NULL. We initialize it from
    // the CSV or fallback, and then scripts/sync-col-index-from-rpp.ts standardizes
    // it from BEA all_items_rpp.
    /*
     * Only a ranked candidate gets the derived fallback. deriveCostOfLivingCategory
     * returns "Moderate" for a missing input, and on a structural parent that
     * placeholder would be inherited by every geography inside it and rendered
     * as though it were researched. NULL resolves to `absent` instead, which is
     * the truth until scripts/sync-col-index-from-rpp.ts writes a real band.
     */
    cost_of_living: isCandidateOf(row, geoType)
      ? deriveCostOfLivingCategory(parseIntV(row["CostOfLiving"]))
      : null,
    // State-owned CSV fields are intentionally ignored here. They belong in
    // locations_stateinfo after sourced adjudication, not on every city row.
    city_politics: cleanEmpty(row["CityPolitics"]),
    election_2016: cleanEmpty(row["2016Election"]),
    election_2016_percent: parseIntV(row["2016PresidentPercent"]),
    election_2024: cleanEmpty(row["2024 Election"]),
    election_2024_percent: parseIntV(row["2024PresidentPercent"]),
    election_change: cleanEmpty(row["ElectionChange"]),
    population: cleanEmpty(row["Population"]),
    density: parseIntV(row["Density"]),
    sales_tax: parseDecimalV(row["SalesTax"]),
    avg_home_value: parseHomeValue(rawHomeValue),
    avg_home_value_display: cleanEmpty(rawHomeValue),
    has_va: parseBoolV(row["VA"]),
    nearest_va: cleanEmpty(row["NearestVA"]),
    distance_to_va: cleanEmpty(row["DistanceToVA"]),
    tci: parseIntV(row["TCI"]),
    crime: cleanEmpty(row["CrimeRating"]),
    lgbtq_rating: cleanEmpty(row["LGBTQ"]),
    lgbtq_mei_score: parseIntV(row["LGBTQ_MEI"]),
    lgbtq_score_source: cleanEmpty(row["LGBTQSource"]),
    tech_hub: parseBoolV(row["TechHub"]),
    // The CSV's DefenseHub is a human judgment, so it feeds the curated input
    // `defense_hub_manual` (in particular, DefenseHub=N becomes a `false` veto).
    // The derived `defense_hub` column is left for scripts/recompute-defense-hub.ts
    // (manual===false ? false : presence ? true : manual). See lib/defense.ts.
    defense_hub_manual: parseBoolV(row["DefenseHub"]),
    has_walmart: parseBoolV(row["HasWalmart"]),
    has_costco: parseBoolV(row["HasCostco"]),
    snow_annual,
    rain_annual,
    sun_days: parseIntV(row["SunnyDays"]),
    alw,
    avg_high_summer,
    humidity_summer,
    gas_price: cleanEmpty(row["Gas"]),
    description: cleanEmpty(row["Description"]),
    rep_vote_share_change_pp: parseFloatV(row["rep_vote_share_change_pp"]),
    dem_vote_share_change_pp: parseFloatV(row["dem_vote_share_change_pp"]),
    emoji: "📍",
    gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    featured: false,
    tags: parseTags(row["Tags"]),
  };
}

async function upsert(query: ReturnType<typeof buildLocationUpsert>): Promise<{ status: "created" | "updated"; id: number }> {
  const rows = await getSql().query(query.text, query.params) as { id: number; created: boolean }[];
  if (rows.length !== 1) throw new Error("Import blocked: parent or existing geography/candidate state changed; no location written");
  return { status: rows[0].created ? "created" : "updated", id: Number(rows[0].id) };
}

/**
 * Look the declared parent up. Resolved BEFORE the child is written, so a bad
 * ParentSlug fails without leaving anything behind -- doing this after the
 * upsert creates an orphaned row with a null parent_geo_id, which is exactly
 * the inconsistent state scripts/verify-geo-hierarchy.ts exists to catch.
 */
async function resolveParent(parentSlug: string): Promise<ParentGeo> {
  const sql = getSql();
  const found = (await sql.query(
    "SELECT id, name, state, geo_type FROM locations_location WHERE slug = $1",
    [parentSlug]
  )) as { id: number; name: string; state: string; geo_type: string }[];

  if (!found.length) {
    throw new Error(
      `ParentSlug "${parentSlug}" does not exist. Import the parent geography first — ` +
        `a child with no parent has nothing to inherit from.`
    );
  }
  const parent = found[0];
  if (!["city", "county"].includes(parent.geo_type)) throw new Error("Parent must be a city or county");
  return {
    ...parent,
    id: Number(parent.id),
    relationship:
      parent.geo_type === "county" ? "county_containment" : "municipal_containment",
  };
}

/** Classify pace after upsert; never blocks the city import on failure. */
async function classifyImportedLocation(
  id: number,
  name: string,
  state: string
): Promise<void> {
  try {
    const result = await classifyLocation({ locationId: id, name, state });
    await classifyAndPersist(result, false);
    const cat = result.scored.category ?? "n/a";
    console.log(
      `    pace: ${cat} (${result.reviewState}` +
        (result.scored.reviewReasons.length
          ? `; ${result.scored.reviewReasons.join(",")}`
          : "") +
        ")"
    );
  } catch (err) {
    // Keep the city; queue a review row when possible.
    console.error(
      `    pace classify failed (city kept): ${(err as Error).message}`
    );
    try {
      const sql = getSql();
      await sql.query(
        `INSERT INTO location_pace_classifications (
           location_id, scope, input_values, source_versions, source_checksums,
           review_state, algorithm_version
         ) VALUES ($1, 'place', $2::jsonb, '{}'::jsonb, '{}'::jsonb, 'needs_review', 'pace-v1')`,
        [
          id,
          JSON.stringify({
            reviewReasons: ["classify_exception"],
            error: err instanceof Error ? err.message : String(err),
          }),
        ]
      );
    } catch {
      /* table may not exist yet; city import still succeeds */
    }
  }
}

async function main() {
  const args = process.argv.slice(2);
  const clear = args.includes("--clear");
  const dryRun = args.includes("--dry-run");
  const allowIncomplete = args.includes("--allow-incomplete");
  const csvPath = args.find((a) => !a.startsWith("--"));
  if (!csvPath) {
    console.error("Usage: import-csv <csv> [--clear] [--dry-run] [--allow-incomplete]");
    process.exit(1);
  }

  const text = readFileSync(csvPath, "utf-8");
  const parsed: Row[] = parse(text, { columns: true, skip_empty_lines: true });
  const rows = parsed.filter((row) => {
    if (!isUnresolvedGeographyRow(row)) return true;
    console.log(`Skipped unresolved geography: ${row.City}, ${row.State}: ${row.GeoResolutionNote}`);
    return false;
  });
  if (clear && rows.length !== parsed.length) throw new Error("--clear cannot be combined with unresolved audit rows");
  console.log(`Importing locations from: ${csvPath}${dryRun ? " (dry run)" : ""}`);

  /*
   * Two rows computing the same slug is a silent overwrite: the first is
   * inserted, the second updates it, and the import reports success. Catch it
   * at parse time, by name, rather than letting the UNIQUE constraint surface
   * it later as a confusing database error.
   */
  const slugCounts = new Map<string, number[]>();
  rows.forEach((row, index) => {
    const slug = geoSlug(
      cleanEmpty(row["City"] ?? "") ?? "",
      cleanEmpty(row["State"] ?? "") ?? "",
      cleanEmpty(row["ParentSlug"] ?? "") ?? null
    );
    slugCounts.set(slug, [...(slugCounts.get(slug) ?? []), index + 2]);
  });
  const duplicateSlugs = [...slugCounts].filter(([, lines]) => lines.length > 1);
  if (duplicateSlugs.length) {
    console.error("Import blocked: two or more rows resolve to the same geography.");
    for (const [slug, lines] of duplicateSlugs) {
      console.error(`  - ${slug} on rows ${lines.join(", ")}`);
    }
    console.error(
      "Give them distinct names, or distinct parents via ParentSlug. Importing as-is would silently keep only the last."
    );
    process.exit(1);
  }

  const safetyProblems = rows.flatMap((row, index) =>
    locationCsvSafetyProblems(row).map((problem) => "row " + (index + 2) + ": " + problem)
  );
  if (safetyProblems.length) {
    throw new Error("Import blocked (--allow-incomplete cannot bypass safety rules):\n" + safetyProblems.join("\n"));
  }
  const completionProblems = rows.flatMap((row, index) =>
    locationCsvCompletionProblems(row, geoTypeOf(row), isCandidateOf(row, geoTypeOf(row))).map(
      (problem) => `row ${index + 2}: ${problem}`
    )
  );
  if (completionProblems.length && !allowIncomplete) {
    console.error("Import blocked: a location cannot be imported incomplete.");
    for (const problem of completionProblems) console.error(`  - ${problem}`);
    console.error("Research and source every required field, or use --allow-incomplete only for a legacy repair that will not be reported as complete.");
    process.exit(1);
  }
  if (completionProblems.length) {
    console.warn("WARNING: --allow-incomplete bypassed the city-completion gate. This import must not be reported as complete.");
    for (const problem of completionProblems) console.warn(`  - ${problem}`);
  }

  const sql = getSql();
  if (clear) {
    /*
     * The self-FK is ON DELETE RESTRICT, so a blanket delete would fail
     * partway through anyway. Refuse up front with an explanation instead of
     * a foreign-key error, because "delete everything" is not a safe way to
     * remove a hierarchy: it would either fail or, under CASCADE, silently
     * take every contained geography with it.
     */
    const contained = (await sql.query(
      "SELECT count(*)::int AS n FROM locations_location WHERE parent_geo_id IS NOT NULL"
    )) as { n: number }[];
    if (contained[0].n > 0) {
      console.error(
        `Refusing --clear: ${contained[0].n} location(s) are contained by another geography.`
      );
      console.error(
        "Deleting the parents would fail on the ON DELETE RESTRICT self-FK, or silently"
      );
      console.error(
        "remove their children. Remove the contained rows deliberately first."
      );
      process.exit(1);
    }
    console.log("Clearing existing locations...");
    if (!dryRun) await sql.query("DELETE FROM locations_location", []);
    console.log("Cleared!");
  }

  let created = 0,
    updated = 0,
    errors = 0;
  for (let i = 0; i < rows.length; i++) {
    try {
      const data = parseRow(rows[i]);
      const existing = await sql.query(
        "SELECT geo_type, is_candidate FROM locations_location WHERE slug = $1", [data.slug]
      ) as { geo_type: string; is_candidate: boolean }[];
      assertLocationImportTransition(data, existing[0]);
      const parentSlug = parentSlugOf(rows[i]);
      const parent = parentSlug ? await resolveParent(parentSlug) : null;
      if (parent && (parent.state !== data.state || data.geo_type === "city")) throw new Error("Invalid child/parent geography");
      // Build the exact write query during dry-run too; validation must not diverge.
      const query = buildLocationUpsert(data, parent, cleanEmpty(rows[i]["ParentSource"]) ?? "CSV import");
      if (dryRun) {
        console.log(
          `  = Would upsert: ${data.name}, ${data.state}` +
            (data.geo_type === "city" ? "" : ` [${data.geo_type}]`) +
            ` -> slug ${data.slug}` +
            (parentSlugOf(rows[i]) ? ` under ${parentSlugOf(rows[i])}` : "")
        );
        continue;
      }
      const result = await upsert(query);
      const label = `${data.name}, ${data.state}` +
        (data.geo_type === "city" ? "" : ` [${data.geo_type}]`);
      if (result.status === "created") {
        created++;
        console.log(`  + Created: ${label}`);
      } else {
        updated++;
        console.log(`  ~ Updated: ${label}`);
      }

      if (parent) console.log(`    contained by: ${parent.name}, ${parent.state} (${parent.relationship})`);

      /*
       * A county or metro has no settlement pace of its own -- it exists to be
       * inherited from. A neighborhood does, and classify-pace resolves it from
       * its own tract, so it is classified like a city.
       */
      if (
        data.geo_type === "county" ||
        data.geo_type === "metro" ||
        (data.geo_type === "city" && data.is_candidate === false)
      ) {
        // A container, or a city that exists only to anchor employer postings.
        // Pace describes what living somewhere feels like; nothing ranks these,
        // and classifying ~400 of them would cost a geocoder round trip each
        // for a value no surface reads.
        console.log("    pace: skipped (not a ranked candidate)");
      } else {
        await classifyImportedLocation(
          result.id,
          String(data.name),
          String(data.state)
        );
      }
    } catch (e) {
      errors++;
      console.error(`  X Error on row ${i + 2}: ${(e as Error).message}`);
    }
  }

  if (errors) process.exitCode = 1;
  console.log(
    dryRun
      ? `\nDry run complete. ${rows.length} row(s) parsed, ${errors} error(s).`
      : `\nImport complete! Created: ${created}, Updated: ${updated}, Errors: ${errors}`
  );
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
