/*
 * Reconciles the research artifacts in data/*.csv against what actually
 * reached Neon.
 *
 * The two-phase ingest (ALL_DATA_RETRIEVAL_INSTRUCTIONS.md) lands a city's CSV
 * on master first and writes the database second, in a separate Apply phase.
 * That order protects provenance, but it has a failure mode of its own: the PR
 * merges, the Apply phase is never run, and the city silently never exists
 * (Rio Rancho, Yuma, Roseville in Aug 2026; Meridian, Columbus and Ocean
 * Springs MS in Sep 2026 -- issue #302). Nothing in CI can see the database,
 * so this module is the check the Apply operator runs to prove the repo and
 * the database agree. It is pure so the parsing and the diff are unit-tested;
 * scripts/verify-csv-imports.ts supplies the file system and the query.
 */

import { parse } from "csv-parse/sync";
import { geoSlug } from "./geo-slug";
import {
  geoTypeOf,
  isCandidateOf,
  type LocationCsvRow,
} from "./location-completeness";
import type { GeoType } from "./types";

/** A row a data/*.csv file says should exist in locations_location. */
export type ExpectedLocation = {
  /** Every CSV that carries this slug (a city can appear in more than one). */
  files: string[];
  name: string;
  state: string;
  slug: string;
  geoType: GeoType;
  isCandidate: boolean;
};

/** What the audit reads back for each slug. */
export type ImportedLocation = {
  slug: string;
  is_candidate: boolean | null;
  geo_type: string | null;
};

export type CsvImportAudit = {
  /** CSV rows with no locations_location row at all -- the import never ran. */
  missing: ExpectedLocation[];
  /**
   * CSV says the place ranks (a city defaults to IsCandidate=Yes) but the row
   * that exists is a non-candidate. The importer flips false -> true, so this
   * is the same skipped-Apply symptom hiding behind a structural parent.
   */
  notPromoted: ExpectedLocation[];
  /** Slugs that are present and agree; kept so a report can show coverage. */
  matched: number;
};

/**
 * Fixture rows the importer's own tests ship under a state that does not
 * exist. They are never imported on purpose.
 */
export const FIXTURE_STATES = new Set(["ZZ"]);

/** Only a curated location CSV starts with these two columns. */
export function isLocationCsv(text: string): boolean {
  const firstLine = text.split(/\r?\n/, 1)[0] ?? "";
  return /^﻿?City,State(,|$)/.test(firstLine);
}

function clean(value: string | undefined): string {
  return (value ?? "").trim();
}

/**
 * Parses one CSV with the importer's own csv-parse options and returns the
 * rows it would upsert, keyed by the same slug rule the importer uses.
 * Fixture states are dropped here so no caller has to remember to.
 * A malformed file throws, exactly as it would under the importer.
 */
export function expectedLocationsFromCsv(
  file: string,
  text: string
): ExpectedLocation[] {
  if (!isLocationCsv(text)) return [];
  const rows = parse(text, {
    columns: true,
    skip_empty_lines: true,
    bom: true,
  }) as LocationCsvRow[];
  const out: ExpectedLocation[] = [];
  for (const row of rows) {
    const name = clean(row.City);
    const state = clean(row.State).toUpperCase();
    if (!name || !state || FIXTURE_STATES.has(state)) continue;
    const geoType = geoTypeOf(row);
    const parentSlug = clean(row.ParentSlug) || null;
    out.push({
      files: [file],
      name,
      state,
      slug: geoSlug(name, state, parentSlug),
      geoType,
      isCandidate: isCandidateOf(row, geoType),
    });
  }
  return out;
}

/** Merges per-file lists into one slug-keyed set, remembering every file. */
export function mergeExpected(
  lists: ExpectedLocation[][]
): Map<string, ExpectedLocation> {
  const bySlug = new Map<string, ExpectedLocation>();
  for (const list of lists) {
    for (const row of list) {
      const existing = bySlug.get(row.slug);
      if (existing) {
        // A later CSV can promote but never demote: if any file says the
        // place ranks, the database is expected to agree -- and that file
        // goes first, because it is the one the repair command should name.
        const promotes = row.isCandidate && !existing.isCandidate;
        for (const f of row.files) {
          if (existing.files.includes(f)) continue;
          if (promotes) existing.files.unshift(f);
          else existing.files.push(f);
        }
        existing.isCandidate = existing.isCandidate || row.isCandidate;
      } else {
        bySlug.set(row.slug, { ...row, files: [...row.files] });
      }
    }
  }
  return bySlug;
}

/** The diff. Sorted by state then name so the report is stable. */
export function auditCsvImports(
  expected: Map<string, ExpectedLocation>,
  imported: Iterable<ImportedLocation>
): CsvImportAudit {
  const bySlug = new Map<string, ImportedLocation>();
  for (const row of imported) bySlug.set(row.slug, row);
  const missing: ExpectedLocation[] = [];
  const notPromoted: ExpectedLocation[] = [];
  let matched = 0;
  for (const exp of expected.values()) {
    const got = bySlug.get(exp.slug);
    if (!got) {
      missing.push(exp);
    } else if (exp.isCandidate && got.is_candidate !== true) {
      notPromoted.push(exp);
    } else {
      matched += 1;
    }
  }
  const order = (a: ExpectedLocation, b: ExpectedLocation) =>
    a.state.localeCompare(b.state) || a.name.localeCompare(b.name);
  missing.sort(order);
  notPromoted.sort(order);
  return { missing, notPromoted, matched };
}

/** Human-readable lines for the operator; empty when the audit is clean. */
export function formatCsvImportAudit(audit: CsvImportAudit): string[] {
  const lines: string[] = [];
  for (const row of audit.missing) {
    lines.push(
      `MISSING      ${row.name}, ${row.state} (${row.slug}) -- in ${row.files.join(", ")} ` +
        `but not in locations_location; run scripts/import-csv.ts ${row.files[0]} from master, ` +
        `then the Apply-phase syncs`
    );
  }
  for (const row of audit.notPromoted) {
    lines.push(
      `NOT_PROMOTED ${row.name}, ${row.state} (${row.slug}) -- ${row.files.join(", ")} says it ranks ` +
        `but the row has is_candidate=false; re-run scripts/import-csv.ts ${row.files[0]} from master ` +
        `(a city import promotes false -> true)`
    );
  }
  return lines;
}
