/**
 * First release gate: separate a usable neighborhood identity from researched
 * profile data. This module deliberately cannot certify evidence or approve a
 * candidate. Those require the reviewed evidence workflow, not populated columns.
 */
type Row = Record<string, unknown>;

function present(value: unknown): boolean {
  return value != null && !["", "?", "na", "n/a", "unknown"].includes(String(value).trim().toLowerCase());
}

function number(value: unknown): number | null {
  if (!present(value) || !["number", "string"].includes(typeof value)) return null;
  const raw = String(value).trim();
  if (!/^-?(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d+)?$/.test(raw)) return null;
  const parsed = Number(raw.replaceAll(",", ""));
  return Number.isFinite(parsed) ? parsed : null;
}

export interface NeighborhoodReadiness {
  structuralProblems: string[];
  /** Necessary data checks only. Passing them does not certify scope or freshness. */
  profileDataProblems: string[];
  reviewProblems: string[];
}

export function inspectNeighborhoodReadiness(row: Row): NeighborhoodReadiness {
  const structuralProblems: string[] = [];
  const profileDataProblems: string[] = [];
  for (const field of ["name", "state", "county", "boundary_source", "description"]) {
    if (!present(row[field])) structuralProblems.push(field + " is missing");
  }
  if (row.geo_type !== "neighborhood") structuralProblems.push("geo_type must be neighborhood");
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(String(row.slug ?? ""))) structuralProblems.push("slug is invalid");
  if (!/^[A-Z]{2}$/.test(String(row.state ?? ""))) structuralProblems.push("state must be a USPS abbreviation");
  const lat = number(row.latitude), lon = number(row.longitude);
  if (lat === null || lat < -90 || lat > 90) structuralProblems.push("latitude is missing or invalid");
  if (lon === null || lon < -180 || lon > 180) structuralProblems.push("longitude is missing or invalid");
  if (!Array.isArray(row.tags) || !row.tags.length || row.tags.some((tag) => typeof tag !== "string" || !tag.trim())) {
    structuralProblems.push("tags must be a non-empty array of strings");
  }
  const parent = number(row.parent_geo_id);
  if (parent === null || !Number.isSafeInteger(parent) || parent <= 0 || parent === number(row.id)) {
    structuralProblems.push("parent_geo_id is missing or invalid");
  }
  // Computed by the verifier from the canonical parent and active, sourced edge.
  if (row.has_valid_municipal_parent !== true) {
    structuralProblems.push("active sourced municipal containment to the canonical same-state city is missing");
  }

  const population = number(row.population);
  if (population !== null && population > 0 && Number.isInteger(population)) {
    for (const field of ["population_source", "population_vintage"]) {
      if (!present(row[field])) structuralProblems.push(field + " is missing");
    }
    if (present(row.population_unavailable_reason)) structuralProblems.push("population conflicts with population_unavailable_reason");
  } else if (present(row.population)) {
    structuralProblems.push("population must be a positive integer");
  } else if (!present(row.population_unavailable_reason)) {
    structuralProblems.push("population or a documented population_unavailable_reason is required");
  }

  for (const field of ["population", "density", "avg_home_value", "median_rent"]) {
    const value = number(row[field]);
    if (value === null || value <= 0) profileDataProblems.push(field + " needs a positive local measurement");
  }
  if (!present(row.crime)) profileDataProblems.push("local safety measurement is missing");
  if (!["urban", "suburban", "small_town", "rural"].includes(String(row.pace_category))) {
    profileDataProblems.push("approved neighborhood pace is missing");
  }
  // sync-va-facilities persists a display string, e.g. "10 miles".
  const distance = number(typeof row.distance_to_va === "string"
    ? row.distance_to_va.replace(/\s+miles?$/i, "") : row.distance_to_va);
  if (typeof row.has_va !== "boolean" || !present(row.nearest_va) || distance === null || distance < 0) {
    profileDataProblems.push("VA access must be refreshed from the neighborhood's own coordinates");
  }

  return {
    structuralProblems,
    profileDataProblems,
    // Never interpret direct/raw data as reviewed neighborhood evidence. Kept
    // explicit until the evidence registry, scope checks and approvals land.
    reviewProblems: [
      "Neighborhood profile evidence review is not implemented: local boundaries, safety methodology, source vintage, pace scope and resolved regional inputs are not certified",
      "Neighborhood candidate approval is not implemented; populated columns do not authorize ranking",
    ],
  };
}
