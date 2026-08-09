/*
 * Shared normalizers for joining external geographic datasets to
 * locations_location by name.
 *
 * Name joins are where this kind of import quietly loses rows: a source that
 * writes "St. Louis County" will not match a `county` column that says
 * "Saint Louis", and the failure looks like a city with no data rather than an
 * error. Both importers use these helpers and both print an explicit unmatched
 * report, so a bad join is visible instead of silent.
 */

/** Suffixes Census/Tax Foundation append to county-equivalent names. */
const COUNTY_SUFFIXES = [
  "county",
  "parish", // Louisiana
  "borough", // Alaska
  "census area", // Alaska
  "municipality",
  "city and borough", // Alaska
  "planning region",
  "municipio", // Puerto Rico
];

/** Suffixes Census appends to incorporated place names. */
const PLACE_SUFFIXES = [
  "city",
  "town",
  "village",
  "borough",
  "cdp", // census designated place
  "municipality",
  "consolidated government",
  "metro government",
  "unified government",
  "urban county government",
];

/** Lowercase, strip punctuation and accents, collapse whitespace. */
function baseNormalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[.'`]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

/**
 * Expand the abbreviations that differ between sources. "St" vs "Saint" is the
 * single most common cause of a missed county join.
 */
function expandAbbreviations(value: string): string {
  return value
    .replace(/\bst\b/g, "saint")
    .replace(/\bste\b/g, "sainte")
    .replace(/\bmt\b/g, "mount")
    .replace(/\bft\b/g, "fort")
    .replace(/\bde kalb\b/g, "dekalb")
    .replace(/\bla porte\b/g, "laporte");
}

function stripSuffixes(value: string, suffixes: string[]): string {
  let out = value;
  // Loop because names like "Anchorage municipality city" carry two.
  let changed = true;
  while (changed) {
    changed = false;
    for (const suffix of suffixes) {
      if (out.endsWith(` ${suffix}`)) {
        out = out.slice(0, -(suffix.length + 1)).trim();
        changed = true;
      }
    }
  }
  return out;
}

/** Normalize a county-equivalent name for joining. */
export function normalizeCounty(value: string): string {
  return stripSuffixes(expandAbbreviations(baseNormalize(value)), COUNTY_SUFFIXES);
}

/** Normalize an incorporated-place / city name for joining. */
export function normalizePlace(value: string): string {
  return stripSuffixes(expandAbbreviations(baseNormalize(value)), PLACE_SUFFIXES);
}

/** Key a location for lookup: "co|boulder". */
export function geoKey(stateAbbr: string, normalizedName: string): string {
  return `${stateAbbr.toLowerCase()}|${normalizedName}`;
}

/**
 * Split a Census NAME field like "Boulder city, Colorado" into its parts.
 * Returns null when the shape is unexpected, so callers can report it rather
 * than silently mis-parse.
 */
export function splitCensusName(name: string): { place: string; state: string } | null {
  const parts = name.split(",").map((p) => p.trim());
  if (parts.length < 2) return null;
  return { place: parts[0], state: parts[parts.length - 1] };
}
