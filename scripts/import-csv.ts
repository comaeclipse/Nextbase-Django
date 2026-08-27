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
} from "../lib/location-completeness";
import { geoSlug } from "../lib/geo-slug";
import { deriveCostOfLivingCategory } from "../lib/cost-of-living";
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
    population_vintage: cleanEmpty(row["PopulationVintage"]),
    boundary_source: cleanEmpty(row["BoundarySource"]),
    boundary_geoid: cleanEmpty(row["BoundaryGeoid"]),
    latitude: coords.latitude,
    longitude: coords.longitude,
    // Nullable since the geo-hierarchy migration. A city keeps the historical
    // empty-string default; a geography that inherits its climate stores NULL,
    // because a placeholder is indistinguishable from a researched value.
    climate:
      cleanEmpty(row["Climate"] ?? "") ?? (isCandidateOf(row, geoType) ? "" : null),
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
    snow_annual: parseIntV(row["Snow"]),
    rain_annual: parseIntV(row["Rain"]),
    sun_days: parseIntV(row["SunnyDays"]),
    alw: parseIntV(row["AverageLowWinter"]),
    avg_high_summer: parseIntV(row["AverageHighSummer"]),
    humidity_summer: parseIntV(row["HumiditySummer"]),
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

async function upsert(
  data: Record<string, unknown>
): Promise<{ status: "created" | "updated"; id: number }> {
  const sql = getSql();
  const cols = Object.keys(data);
  // jsonb column needs a text param cast; everything else coerces fine.
  const value = (c: string) => (c === "tags" ? JSON.stringify(data[c]) : data[c]);
  const placeholder = (c: string, i: number) =>
    c === "tags" ? `$${i + 1}::jsonb` : `$${i + 1}`;

  /*
   * Keyed on slug, not (name, state). Below city level the old key is not
   * unique -- a second "Downtown, CA" silently overwrote the first, with
   * nothing in the database to stop it.
   */
  const existing = (await sql.query(
    "SELECT id FROM locations_location WHERE slug = $1",
    [data.slug]
  )) as { id: number }[];

  if (existing.length) {
    const setClause = cols.map((c, i) => `${c} = ${placeholder(c, i)}`).join(", ");
    await sql.query(
      `UPDATE locations_location SET ${setClause}, updated_at = now() WHERE id = $${cols.length + 1}`,
      [...cols.map(value), existing[0].id]
    );
    return { status: "updated", id: Number(existing[0].id) };
  }
  const colList = cols.join(", ");
  const placeholders = cols.map((c, i) => placeholder(c, i)).join(", ");
  const inserted = (await sql.query(
    `INSERT INTO locations_location (${colList}, created_at, updated_at)
     VALUES (${placeholders}, now(), now())
     RETURNING id`,
    cols.map(value)
  )) as { id: number }[];
  return { status: "created", id: Number(inserted[0].id) };
}

interface ParentGeo {
  id: number;
  name: string;
  state: string;
  geo_type: string;
  relationship: string;
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
  return {
    ...parent,
    id: Number(parent.id),
    relationship:
      parent.geo_type === "county" ? "county_containment" : "municipal_containment",
  };
}

/**
 * Record the containment, both as the canonical parent_geo_id column and as the
 * typed geo_relationships row.
 *
 * Both are written because they mean different things: the column is the
 * canonical containment and the fast path, the table is the typed,
 * multi-parent graph. Writing only one leaves the graph inconsistent.
 *
 * Only municipal/county containment is written here. Metro membership is a
 * different relationship with a different source (OMB delineations), so it is
 * not inferred from a CSV column.
 */
async function recordContainment(
  childId: number,
  parent: ParentGeo,
  sourceLabel: string
): Promise<string> {
  const sql = getSql();
  await sql.query(
    "UPDATE locations_location SET parent_geo_id = $1, updated_at = now() WHERE id = $2",
    [parent.id, childId]
  );
  await sql.query(
    `INSERT INTO geo_relationships (parent_geo_id, child_geo_id, relationship_type, source)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (parent_geo_id, child_geo_id, relationship_type, valid_from) DO NOTHING`,
    [parent.id, childId, parent.relationship, sourceLabel]
  );
  return `${parent.name}, ${parent.state} (${parent.relationship})`;
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
  const rows: Row[] = parse(text, { columns: true, skip_empty_lines: true });
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
      if (dryRun) {
        console.log(
          `  = Would upsert: ${data.name}, ${data.state}` +
            (data.geo_type === "city" ? "" : ` [${data.geo_type}]`) +
            ` -> slug ${data.slug}` +
            (parentSlugOf(rows[i]) ? ` under ${parentSlugOf(rows[i])}` : "")
        );
        continue;
      }
      // Resolved before the upsert so a bad ParentSlug writes nothing at all.
      const parentSlug = parentSlugOf(rows[i]);
      const parent = parentSlug ? await resolveParent(parentSlug) : null;

      const result = await upsert(data);
      const label = `${data.name}, ${data.state}` +
        (data.geo_type === "city" ? "" : ` [${data.geo_type}]`);
      if (result.status === "created") {
        created++;
        console.log(`  + Created: ${label}`);
      } else {
        updated++;
        console.log(`  ~ Updated: ${label}`);
      }

      if (parent) {
        const linked = await recordContainment(
          result.id,
          parent,
          cleanEmpty(rows[i]["ParentSource"] ?? "") ?? "CSV import"
        );
        console.log(`    contained by: ${linked}`);
      }

      /*
       * A county or metro has no settlement pace of its own -- it exists to be
       * inherited from. A neighborhood does, and classify-pace resolves it from
       * its own tract, so it is classified like a city.
       */
      if (data.geo_type === "county" || data.geo_type === "metro") {
        console.log("    pace: skipped (container geography)");
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

  console.log(
    dryRun
      ? `\nDry run complete. ${rows.length} row(s) parsed, ${errors} error(s).`
      : `\nImport complete! Created: ${created}, Updated: ${updated}, Errors: ${errors}`
  );
}

main();
