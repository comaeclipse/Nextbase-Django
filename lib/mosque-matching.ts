/*
 * Decides which OpenStreetMap elements count as a mosque, and collapses the ones
 * that describe the same mosque twice. Pure functions, no IO — the Overpass
 * fetch in scripts/fetch-mosques-overpass.ts feeds them raw tags and gets back a
 * clean set. Lives here rather than beside the script so it is unit-testable
 * (vitest only picks up lib/**\/*.test.ts).
 *
 * See lib/mosque-matching.test.ts for the tagging cases these rules exist for.
 */

/*
 * Ordered by confidence. A record matched by an earlier rule always wins a
 * de-duplication tie against a later one, which is what guarantees every mosque
 * the v1 query already found survives v2 unchanged — v2 can only ever add rows,
 * never swap an existing (osm_type, osm_id) for a different one. That matters
 * because import-mosques.ts upserts and never deletes: a swap would strand the
 * old row in Neon and put two dots on the same mosque.
 */
export const MATCH_RULES = [
  "amenity_religion", // v1 rule: amenity=place_of_worship + religion=muslim
  "building_mosque", // building=mosque, however else it is tagged
  "named_place_of_worship", // place_of_worship, no religion tag, mosque-shaped name
  "religion_muslim_site", // religion=muslim on something else (usually a landuse=religious parcel)
] as const;

export type MatchRule = (typeof MATCH_RULES)[number];

export interface MosqueRecord {
  osm_type: "node" | "way" | "relation";
  osm_id: number;
  name: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  latitude: number;
  longitude: number;
  phone: string | null;
  website: string | null;
  source_url: string;
  /** Which MATCH_RULES entry admitted this record. Audit only — not imported to Neon. */
  match_rule: MatchRule;
}

/** Tagged Muslim but not a mosque: Islamic schools, Muslim cemeteries, and the like. */
const EXCLUDED_AMENITY = new Set([
  "school",
  "kindergarten",
  "college",
  "university",
  "library",
  "grave_yard",
  "childcare",
  "driving_school",
]);
const EXCLUDED_LANDUSE = new Set(["cemetery"]);

/** Mosque-shaped names, and the Spanish place names that otherwise trip that pattern. */
const MOSQUE_NAME = /masjid|mosque|islamic cent|musalla/i;
const NOT_A_MOSQUE_NAME = /mosque(r|d|t|ir)|mezquite/i;

/*
 * Two OSM elements within this distance AND with compatible names are treated as
 * one mosque. Proximity alone is not enough: at 120m the 2026-08-20 extract
 * merges Shahjalal Masjid into Gawsiah Jame Masjid (60m apart) and Lansdale
 * Mosque into North Penn Mosque (85m), which are different mosques that happen
 * to share a block. The duplicate we actually need to collapse is a POI node
 * sitting inside its own building footprint, and that pair is either
 * identically named or has an unnamed footprint — hence namesCompatible.
 */
export const DEDUPE_METERS = 120;

/**
 * Shortest name length for a containment match to count. Set above the generic
 * vocabulary ("masjid", "mosque", "islamic" are all 6-7 characters) so a
 * bare-generic name cannot swallow every specific one within range. The cost is
 * that a very short distinct name like "ICNA" never merges into "ICNA Masjid" —
 * erring toward two dots rather than silently dropping a mosque.
 */
const MIN_CONTAINMENT_CHARS = 8;

function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

/**
 * True when two records could name the same mosque. An unnamed record is
 * compatible with anything — that is the building-footprint case, which is the
 * bulk of real duplicates.
 */
export function namesCompatible(a: string | null, b: string | null): boolean {
  if (a === null || b === null) return true;
  const left = normalizeName(a);
  const right = normalizeName(b);
  if (left === "" || right === "") return true;
  if (left === right) return true;
  const [shorter, longer] = left.length <= right.length ? [left, right] : [right, left];
  return shorter.length >= MIN_CONTAINMENT_CHARS && longer.includes(shorter);
}

/**
 * Returns the highest-confidence rule that admits this element, or null to drop
 * it. A non-Muslim `religion` tag is always disqualifying — that is what keeps a
 * church that happens to sit on a `landuse=religious` parcel out of the set.
 */
export function classify(tags: Record<string, string> | undefined): MatchRule | null {
  if (!tags) return null;

  const religion = tags.religion;
  if (religion && religion !== "muslim") return null;
  if (tags.amenity && EXCLUDED_AMENITY.has(tags.amenity)) return null;
  if (tags.landuse && EXCLUDED_LANDUSE.has(tags.landuse)) return null;

  const name = tags.name ?? "";
  if (NOT_A_MOSQUE_NAME.test(name)) return null;

  if (tags.amenity === "place_of_worship" && religion === "muslim") return "amenity_religion";
  if (tags.building === "mosque") return "building_mosque";
  if (tags.amenity === "place_of_worship" && !religion && MOSQUE_NAME.test(name)) {
    return "named_place_of_worship";
  }
  if (religion === "muslim") return "religion_muslim_site";
  return null;
}

function metersBetween(a: MosqueRecord, b: MosqueRecord): number {
  const latMeters = (a.latitude - b.latitude) * 111_320;
  const lonMeters =
    (a.longitude - b.longitude) * 111_320 * Math.cos((a.latitude * Math.PI) / 180);
  return Math.hypot(latMeters, lonMeters);
}

/** How many optional fields this record actually carries. Richer record wins a tie. */
function richness(record: MosqueRecord): number {
  return [
    record.name,
    record.address,
    record.city,
    record.state,
    record.phone,
    record.website,
  ].filter((value) => value !== null).length;
}

const OSM_TYPE_ORDER: Record<MosqueRecord["osm_type"], number> = {
  node: 0,
  way: 1,
  relation: 2,
};

/**
 * Total order over candidates for the same mosque. Fully deterministic — the
 * osm_id tiebreak means two runs over identical data always keep the same
 * element, so re-importing never strands an orphan row in Neon.
 */
function preferFirst(a: MosqueRecord, b: MosqueRecord): number {
  const byRule = MATCH_RULES.indexOf(a.match_rule) - MATCH_RULES.indexOf(b.match_rule);
  if (byRule !== 0) return byRule;
  const byRichness = richness(b) - richness(a);
  if (byRichness !== 0) return byRichness;
  const byType = OSM_TYPE_ORDER[a.osm_type] - OSM_TYPE_ORDER[b.osm_type];
  if (byType !== 0) return byType;
  return a.osm_id - b.osm_id;
}

/**
 * Collapses records that describe the same mosque (a POI node and its building
 * footprint, typically). Sorted by preference first, so the winner of each
 * cluster is decided before any comparison happens and the result does not
 * depend on the order Overpass returned things in.
 */
export function dedupe(records: MosqueRecord[]): { kept: MosqueRecord[]; merged: number } {
  const ordered = [...records].sort(preferFirst);
  const kept: MosqueRecord[] = [];
  // Cheap latitude prefilter before the trig: 120m is ~0.0011 degrees.
  const degrees = DEDUPE_METERS / 111_320;
  let merged = 0;

  for (const record of ordered) {
    const duplicate = kept.some(
      (other) =>
        Math.abs(other.latitude - record.latitude) <= degrees &&
        metersBetween(other, record) <= DEDUPE_METERS &&
        namesCompatible(other.name, record.name)
    );
    if (duplicate) {
      merged += 1;
      continue;
    }
    kept.push(record);
  }

  kept.sort(
    (a, b) => OSM_TYPE_ORDER[a.osm_type] - OSM_TYPE_ORDER[b.osm_type] || a.osm_id - b.osm_id
  );
  return { kept, merged };
}
