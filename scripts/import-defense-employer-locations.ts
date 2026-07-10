/*
 * Imports hand-researched defense-employer location rows into Neon.
 *
 * Accepts either the current CSV shape (an `EmployerSlug` column) or the legacy
 * `Company` + `BusinessUnit` pair, which is resolved through
 * LEGACY_EMPLOYER_ALIASES so data/raytheon_usa_job_locations.csv still loads.
 *
 * This path owns *provenance* (source_url, is_featured, notes). Posting counts
 * are owned by scripts/sync-rtx-employer-locations.ts and are not clobbered here.
 *
 * Usage:
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/import-defense-employer-locations.ts <csv> [--dry-run]
 */
import { readFileSync } from "node:fs";
import { parse } from "csv-parse/sync";
import { LEGACY_EMPLOYER_ALIASES } from "../lib/defense";
import {
  getEmployerIdBySlug,
  getLocationIdByCityState,
  resolveLocationId,
  upsertSourcedLocation,
  type SourcedLocation,
} from "./lib/defense-db";

type Row = Record<string, string>;

const clean = (value: string | undefined): string | null => {
  if (value == null) return null;
  const trimmed = String(value).trim();
  return trimmed === "" || trimmed === "NA" ? null : trimmed;
};

const parseBool = (value: string | undefined): boolean => {
  const cleaned = clean(value);
  return cleaned ? ["1", "true", "t", "y", "yes"].includes(cleaned.toLowerCase()) : false;
};

const parseIntValue = (value: string | undefined): number | null => {
  const cleaned = clean(value);
  if (!cleaned) return null;
  const parsed = Number.parseInt(cleaned.replace(/,/g, ""), 10);
  return Number.isFinite(parsed) ? parsed : null;
};

function resolveSlug(row: Row): string {
  const explicit = clean(row.EmployerSlug);
  if (explicit) return explicit;

  const company = clean(row.Company);
  const unit = clean(row.BusinessUnit);
  if (company && unit) {
    const slug = LEGACY_EMPLOYER_ALIASES[`${company}|${unit}`];
    if (slug) return slug;
    throw new Error(
      `No employer slug for "${company}|${unit}". Add a legacy_alias in lib/defense.ts.`
    );
  }
  throw new Error("Row needs either EmployerSlug, or both Company and BusinessUnit.");
}

function parseRow(row: Row): SourcedLocation {
  const state = clean(row.State);
  const city = clean(row.City);
  if (!state || !city) throw new Error(`Missing City/State in row: ${JSON.stringify(row)}`);

  return {
    employer_slug: resolveSlug(row),
    country: clean(row.Country) ?? "US",
    state,
    city,
    region_label: clean(row.RegionLabel) ?? "",
    location_name: clean(row.LocationName),
    location_type: clean(row.LocationType),
    source_kind: clean(row.SourceKind),
    source_url: clean(row.SourceUrl),
    source_retrieved_on: clean(row.SourceRetrievedOn),
    // ActivePostingCount is the legacy column name; the sync script owns the
    // split onsite/hybrid/remote counts.
    total_posting_count: parseIntValue(row.TotalPostings ?? row.ActivePostingCount),
    is_featured: parseBool(row.IsFeatured),
    notes: clean(row.Notes),
  };
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const csvPath = args.find((arg) => !arg.startsWith("--"));

  if (!csvPath) {
    console.error("Usage: import-defense-employer-locations <csv> [--dry-run]");
    process.exit(1);
  }

  const rows: Row[] = parse(readFileSync(csvPath, "utf-8"), {
    columns: true,
    skip_empty_lines: true,
  });
  const parsed = rows.map(parseRow);

  console.log(`Importing defense employer locations from: ${csvPath}${dryRun ? " (dry run)" : ""}`);

  const employers = await getEmployerIdBySlug();
  const locations = await getLocationIdByCityState();

  for (const row of parsed) {
    if (!employers.has(row.employer_slug)) {
      throw new Error(
        `Unknown employer "${row.employer_slug}". Run scripts/migrate-defense-employers.ts first.`
      );
    }
    const linked = resolveLocationId(locations, row.city, row.state);
    console.log(
      `  ${dryRun ? "=" : "+"} ${row.employer_slug}: ${row.city}, ${row.state}` +
        (linked ? ` -> location #${linked}` : " (no retirement location)")
    );
  }

  if (!dryRun) {
    for (const row of parsed) await upsertSourcedLocation(row, employers, locations);
  }

  console.log(`${dryRun ? "Dry run" : "Import"} complete. ${parsed.length} row(s).`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
