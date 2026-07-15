/*
 * Port of `python manage.py import_csv <path> [--clear]`
 * (locations/management/commands/import_csv.py).
 *
 * Usage:
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/import-csv.ts <csv> [--clear] [--dry-run]
 *
 * Upserts locations keyed on (name, state), matching Django's update_or_create.
 * --dry-run parses and reports without touching the database.
 */
import { readFileSync } from "node:fs";
import { parse } from "csv-parse/sync";
import { getSql } from "../lib/db";
import { classifyAndPersist, classifyLocation } from "../lib/pace";

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

const deriveCostOfLiving = (colIndex: number | null): string => {
  if (colIndex === null) return "Moderate";
  if (colIndex < 95) return "Low";
  if (colIndex <= 115) return "Moderate";
  return "High";
};

function parseRow(row: Row): Record<string, unknown> {
  const rawHomeValue = row["AvgHomeValue"] ?? "";
  const colIndex = parseIntV(row["CostOfLiving"]);
  return {
    name: cleanEmpty(row["City"] ?? ""),
    state: cleanEmpty(row["State"] ?? ""),
    county: cleanEmpty(row["County"]),
    climate: cleanEmpty(row["Climate"] ?? "") ?? "",
    cost_of_living: deriveCostOfLiving(colIndex),
    state_party: cleanEmpty(row["StateParty"]),
    governor: cleanEmpty(row["Governor"]),
    city_politics: cleanEmpty(row["CityPolitics"]),
    election_2016: cleanEmpty(row["2016Election"]),
    election_2016_percent: parseIntV(row["2016PresidentPercent"]),
    election_2024: cleanEmpty(row["2024 Election"]),
    election_2024_percent: parseIntV(row["2024PresidentPercent"]),
    election_change: cleanEmpty(row["ElectionChange"]),
    population: cleanEmpty(row["Population"]),
    density: parseIntV(row["Density"]),
    sales_tax: parseDecimalV(row["SalesTax"]),
    income_tax: parseDecimalV(row["Income"]),
    col_index: colIndex,
    avg_home_value: parseHomeValue(rawHomeValue),
    avg_home_value_display: cleanEmpty(rawHomeValue),
    has_va: parseBoolV(row["VA"]),
    nearest_va: cleanEmpty(row["NearestVA"]),
    distance_to_va: cleanEmpty(row["DistanceToVA"]),
    veterans_benefits: cleanEmpty(row["Veterans Benefits"]),
    tci: parseIntV(row["TCI"]),
    crime: cleanEmpty(row["CrimeRating"]),
    marijuana_status: cleanEmpty(row["Marijuana"]),
    lgbtq_rating: cleanEmpty(row["LGBTQ"]),
    lgbtq_mei_score: parseIntV(row["LGBTQ_MEI"]),
    lgbtq_state_policy_score: parseDecimalV(row["LGBTQStatePolicyScore"]),
    lgbtq_score_source: cleanEmpty(row["LGBTQSource"]),
    tech_hub: parseBoolV(row["TechHub"]),
    // The CSV's DefenseHub is a human judgment, so it feeds the curated input
    // `defense_hub_manual` (in particular, DefenseHub=N becomes a `false` veto).
    // The derived `defense_hub` column is left for scripts/recompute-defense-hub.ts
    // (manual===false ? false : presence ? true : manual). See lib/defense.ts.
    defense_hub_manual: parseBoolV(row["DefenseHub"]),
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

  const existing = (await sql.query(
    "SELECT id FROM locations_location WHERE name = $1 AND state = $2",
    [data.name, data.state]
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
  const csvPath = args.find((a) => !a.startsWith("--"));
  if (!csvPath) {
    console.error("Usage: import-csv <csv> [--clear] [--dry-run]");
    process.exit(1);
  }

  const text = readFileSync(csvPath, "utf-8");
  const rows: Row[] = parse(text, { columns: true, skip_empty_lines: true });
  console.log(`Importing locations from: ${csvPath}${dryRun ? " (dry run)" : ""}`);

  const sql = getSql();
  if (clear) {
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
        console.log(`  = Would upsert: ${data.name}, ${data.state}`);
        continue;
      }
      const result = await upsert(data);
      if (result.status === "created") {
        created++;
        console.log(`  + Created: ${data.name}, ${data.state}`);
      } else {
        updated++;
        console.log(`  ~ Updated: ${data.name}, ${data.state}`);
      }
      await classifyImportedLocation(
        result.id,
        String(data.name),
        String(data.state)
      );
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
