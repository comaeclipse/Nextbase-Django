/*
 * Curated VA medical sites that the authoritative feed (the VHA ArcGIS / VAST
 * layer, and the Lighthouse VA Facilities API) omits, but which VA operates on
 * the ground. `scripts/sync-va-facilities.ts` merges these into the fetched
 * facility set before it computes each city's nearest outpatient/hospital site
 * and the `has_va` access gate.
 *
 * This exists because the feed is not exhaustive: some border/rural CBOCs are
 * absent from it, which made `has_va` fall to `false` for a city with an
 * in-city clinic (issue #303, Del Rio, TX). Without a supplement path the sync
 * silently reports "no VA access" for such a city.
 *
 * Rules for this list:
 *   - Keep it minimal and provenance-backed. Every entry records the coverage
 *     gap it patches and an authoritative VA source.
 *   - Coordinates are the facility's own location (geocode the street address),
 *     not the city centroid.
 *   - When the feed catches up and starts returning a supplemented site, the
 *     sync warns (see `classifySupplements`) so the redundant entry can be
 *     removed rather than double-counted.
 */

export interface VaSupplementSite {
  /** Synthetic id, `SUP-` prefixed so it can never collide with a real VAST STA_NO. */
  id: string;
  name: string;
  city: string;
  state: string;
  lat: number;
  lon: number;
  /** Same kinds the sync classifier emits; supplements are typically outpatient CBOCs. */
  kind: "hospital" | "outpatient";
  /** Why this site is curated in rather than read from the feed. */
  reason: string;
  /** Authoritative VA source for the facility's existence and location. */
  source: string;
  /** ISO date the entry was last verified against that source. */
  verifiedOn: string;
}

export const VA_FACILITY_SUPPLEMENTS: VaSupplementSite[] = [
  {
    id: "SUP-TX-DELRIO",
    name: "Del Rio VA Clinic",
    city: "Del Rio",
    state: "TX",
    lat: 29.3909,
    lon: -100.9016,
    kind: "outpatient",
    reason:
      "CBOC (VA South Texas Veterans Health Care System), in-city, but absent from the VHA ArcGIS/VAST layer and the Lighthouse VA Facilities API, so the sync computed has_va=false. See issue #303.",
    source: "https://www.va.gov/south-texas-health-care/locations/",
    verifiedOn: "2026-09-02",
  },
];

/** Minimal shape the classifier needs from a feed-sourced site. */
export interface KnownVaSite {
  name: string;
  lat: number;
  lon: number;
  kind: "hospital" | "outpatient";
}

/*
 * A supplement is considered already covered by the feed when a same-kind feed
 * site sits within this radius of it. 3 miles comfortably absorbs the geocoding
 * spread between a street address and VA's own coordinate while staying well
 * inside any real inter-facility spacing.
 */
export const SUPPLEMENT_REDUNDANT_RADIUS_MI = 3;

const EARTH_RADIUS_MI = 3958.8;

function haversineMiles(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLon = toRad(bLon - aLon);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_MI * Math.asin(Math.min(1, Math.sqrt(h)));
}

export interface SupplementClassification {
  /** Supplements the feed does not have — these should be injected. */
  inject: VaSupplementSite[];
  /** Supplements the feed now covers — injecting would double-count; remove them. */
  redundant: { supplement: VaSupplementSite; match: KnownVaSite; miles: number }[];
}

/**
 * Split the curated supplements into the ones the feed is still missing (to be
 * injected) and the ones the feed has since started returning (redundant, so
 * the sync can warn instead of silently double-counting a facility).
 */
export function classifySupplements(
  feed: KnownVaSite[],
  supplements: VaSupplementSite[] = VA_FACILITY_SUPPLEMENTS
): SupplementClassification {
  const inject: VaSupplementSite[] = [];
  const redundant: SupplementClassification["redundant"] = [];

  for (const supplement of supplements) {
    let match: { site: KnownVaSite; miles: number } | null = null;
    for (const site of feed) {
      if (site.kind !== supplement.kind) continue;
      const miles = haversineMiles(supplement.lat, supplement.lon, site.lat, site.lon);
      if (miles <= SUPPLEMENT_REDUNDANT_RADIUS_MI && (!match || miles < match.miles)) {
        match = { site, miles };
      }
    }
    if (match) redundant.push({ supplement, match: match.site, miles: match.miles });
    else inject.push(supplement);
  }

  return { inject, redundant };
}
