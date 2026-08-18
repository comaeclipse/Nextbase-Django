/*
 * Military-installation proximity. Separate from defense employers
 * (`lib/defense.ts`): a command is a public facility, not a contractor
 * footprint, and `defense_hub` is left untouched.
 *
 * Distances live in `location_military_proximity` (every geocoded city × every
 * geocoded active installation). The app ships a compact index: nearest overall
 * plus nearest-per-branch, which is enough for the near_base filter and the
 * city-page "NAS Pensacola — Navy — 8 mi" line.
 */

export const SERVICE_BRANCH_SLUGS = [
  "army",
  "navy",
  "air_force",
  "marine_corps",
] as const;

export type ServiceBranchSlug = (typeof SERVICE_BRANCH_SLUGS)[number];

export const SERVICE_BRANCH_LABEL: Record<ServiceBranchSlug, string> = {
  army: "Army",
  navy: "Navy",
  air_force: "Air Force",
  marine_corps: "Marine Corps",
};

export const BASE_DISTANCE_BANDS = [25, 50, 100] as const;
export type BaseDistanceBand = (typeof BASE_DISTANCE_BANDS)[number];

/** Default radius when near_base / a branch is set without an explicit band. */
export const DEFAULT_BASE_MAX_DISTANCE_MILES = 50;

const EARTH_RADIUS_MI = 3958.8;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function haversineMiles(
  aLat: number,
  aLon: number,
  bLat: number,
  bLon: number
): number {
  const dLat = toRad(bLat - aLat);
  const dLon = toRad(bLon - aLon);
  const lat1 = toRad(aLat);
  const lat2 = toRad(bLat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_MI * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function slugForBranch(label: string): ServiceBranchSlug | null {
  switch (label) {
    case "Army":
      return "army";
    case "Navy":
      return "navy";
    case "Air Force":
      return "air_force";
    case "Marine Corps":
      return "marine_corps";
    default:
      return null;
  }
}

export function isServiceBranchSlug(value: string): value is ServiceBranchSlug {
  return (SERVICE_BRANCH_SLUGS as readonly string[]).includes(value);
}

export interface MilitaryProximity {
  installation_id: number;
  command_name: string;
  service_branch: string;
  branch_slug: ServiceBranchSlug;
  city: string;
  state: string;
  distance_miles: number;
}

export interface LocationMilitaryProximity {
  nearest: MilitaryProximity;
  nearest_by_branch: Partial<Record<ServiceBranchSlug, MilitaryProximity>>;
}

/** location_id -> nearest installation + nearest per branch. */
export type MilitaryProximityIndex = Record<number, LocationMilitaryProximity>;

export interface MilitaryProximityRow {
  location_id: number;
  installation_id: number;
  command_name: string;
  service_branch: string;
  city: string;
  state: string;
  distance_miles: number;
  nearest_rank: number;
  branch_rank: number;
}

export function toMilitaryProximity(row: MilitaryProximityRow): MilitaryProximity | null {
  const branch_slug = slugForBranch(row.service_branch);
  if (!branch_slug) return null;
  return {
    installation_id: row.installation_id,
    command_name: row.command_name,
    service_branch: row.service_branch,
    branch_slug,
    city: row.city,
    state: row.state,
    distance_miles: row.distance_miles,
  };
}

export function buildMilitaryProximityIndex(
  rows: readonly MilitaryProximityRow[]
): MilitaryProximityIndex {
  const index: MilitaryProximityIndex = {};
  for (const row of rows) {
    const proximity = toMilitaryProximity(row);
    if (!proximity) continue;
    const entry = (index[row.location_id] ??= {
      nearest: proximity,
      nearest_by_branch: {},
    });
    if (row.nearest_rank === 1) entry.nearest = proximity;
    if (row.branch_rank === 1) {
      entry.nearest_by_branch[proximity.branch_slug] = proximity;
    }
  }
  return index;
}

export function matchesNearBase(
  proximity: LocationMilitaryProximity | undefined,
  opts: {
    maxDistance: number;
    branches?: readonly ServiceBranchSlug[];
  }
): boolean {
  if (!proximity) return false;
  const branches = opts.branches ?? [];
  if (branches.length === 0) {
    return proximity.nearest.distance_miles <= opts.maxDistance;
  }
  return branches.some((slug) => {
    const hit = proximity.nearest_by_branch[slug];
    return hit != null && hit.distance_miles <= opts.maxDistance;
  });
}

export function formatNearestBase(proximity: MilitaryProximity): string {
  const miles =
    proximity.distance_miles < 0.5
      ? "<1"
      : String(Math.round(proximity.distance_miles));
  return `${proximity.command_name} — ${proximity.service_branch} — ${miles} mi`;
}

export function parseBaseMaxDistance(value: string | null | undefined): number {
  if (value && /^\d+$/.test(value)) {
    const n = parseInt(value, 10);
    if ((BASE_DISTANCE_BANDS as readonly number[]).includes(n)) return n;
  }
  return DEFAULT_BASE_MAX_DISTANCE_MILES;
}
