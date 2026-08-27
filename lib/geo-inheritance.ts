/*
 * Field-specific, relationship-aware inheritance for non-city geographies.
 *
 * A neighborhood is not a small city. Some of its facts are genuinely its own
 * (population, rent, home value), some belong to the municipality that contains
 * it (sales tax, the HRC municipal equality score), some to the county (the
 * assessed property-tax rate), some to the metro (BEA regional price parities),
 * some to a weather station tens of miles away, and some must be recomputed
 * from its own coordinates rather than borrowed at all (VA access).
 *
 * So this is deliberately NOT "copy from parent". Every field declares the
 * fallback geography it is allowed to come from, and every resolved value
 * carries provenance saying whether it is direct, inherited (and from which
 * entity, over which relationship), derived, or absent.
 *
 * WHY THIS IS TYPESCRIPT AND NOT A SQL COALESCE CHAIN
 *
 * 1. COALESCE(l.x, parent.x) produces a value and loses which arm won.
 *    Recovering provenance means a hand-written parallel CASE for every field,
 *    and two expressions that must stay in sync forever. scripts/recompute-
 *    defense-hub.ts already has that bug shape (the derivation is written once
 *    in TS and once in SQL); adding forty more instances is not the move.
 * 2. Different fields need different JOINS, not different COALESCE arms --
 *    municipality, county, and CBSA are three different ancestors. A SQL chain
 *    would add those joins to LOCATION_FROM, which fetchAllLocations runs over
 *    every candidate on each /explore, /quiz and /map render, to serve rows
 *    that path deliberately excludes.
 * 3. FIELD_RESOLUTION is `satisfies Record<InheritableField, FieldRule>`, so
 *    adding a column to LocationRow without declaring a policy for it is a
 *    compile error. "Someone added median_rent and it silently inherited Los
 *    Angeles's" is exactly what this module exists to prevent.
 * 4. resolveLocationFields is a pure function, matching lib/filters.ts and
 *    lib/scoring.ts, so it is unit-testable without a live database.
 *
 * Cities pay nothing: the resolver short-circuits on a row with no ancestry.
 */
import type { GeoRelationshipType, GeoType, LocationRow } from "./types";

/** Where a field is allowed to come from when the subject has no direct value. */
export type FallbackGeography =
  /** Subject-scoped or absent. Never inherit -- borrowing would be a lie. */
  | "none"
  | "municipality"
  | "county"
  | "county_then_municipality"
  | "cbsa"
  | "precinct_then_municipality"
  /** Served by the existing locations_stateinfo join in LOCATION_SELECT. */
  | "state"
  /** Satellite tables keyed by station distance, not by containment. */
  | "nearest_station"
  /** Must be recomputed from the subject's own coordinates by a sync script. */
  | "recompute";

/**
 * Whether a resolved value may be shown as this place's own number.
 * `context_only` values are true of a wider geography and say little about the
 * subject -- they must never render without a source label.
 */
export type Presentation = "value" | "context_only";

export type Provenance =
  | { kind: "direct" }
  | {
      kind: "inherited";
      sourceEntityId: number;
      sourceEntityLabel: string;
      sourceGeoType: GeoType;
      relationship: GeoRelationshipType;
    }
  | { kind: "derived"; method: string; inputs: string[] }
  | {
      kind: "absent";
      reason:
        | "no_direct_value"
        | "no_eligible_ancestor"
        | "policy_forbids_inheritance";
    };

export interface ResolvedField<T> {
  value: T | null;
  provenance: Provenance;
  presentation: Presentation;
}

export interface FieldRule {
  fallback: FallbackGeography;
  /** Relationship types eligible to carry this field, in priority order. */
  via: readonly GeoRelationshipType[];
  presentation: Presentation;
  /** Why this policy. Kept in code so the next reader does not "fix" it. */
  note: string;
}

/** One ancestor, with its own column values (not a LOCATION_SELECT join row). */
export interface GeoNode {
  geo_id: number;
  slug: string;
  name: string;
  state: string;
  geo_type: GeoType;
  /** How this node is reached from the subject. */
  relationship: GeoRelationshipType;
  depth: number;
  row: Partial<LocationRow>;
}

/*
 * Identity and geography columns are not inheritable by construction -- they
 * are what make the row a distinct place. Excluding them here is what lets the
 * `satisfies` check below be exhaustive over everything that remains.
 */
type NonInheritableField =
  | "id"
  | "name"
  | "state"
  | "county"
  | "latitude"
  | "longitude"
  | "slug"
  | "geo_type"
  | "is_candidate"
  | "parent_geo_id"
  | "population_source"
  | "population_vintage"
  | "boundary_source"
  | "boundary_geoid";

export type InheritableField = Exclude<keyof LocationRow, NonInheritableField>;

export type ResolutionMap = Partial<{
  [K in InheritableField]: ResolvedField<LocationRow[K]>;
}>;

export interface ResolvedLocation {
  /**
   * Resolved values written back into a plain LocationRow. This is what keeps
   * the blast radius small: calculateBaselineScore, the affordability cards and
   * every existing consumer keep taking a LocationRow and need no changes.
   */
  row: LocationRow;
  /** Provenance sidecar. Only render sites that want a label read this. */
  resolution: ResolutionMap;
  chain: GeoNode[];
}

const MUNICIPAL = ["municipal_containment"] as const;
const COUNTY = ["county_containment"] as const;
const COUNTY_THEN_MUNI = ["county_containment", "municipal_containment"] as const;
const METRO = ["metro_membership", "municipal_containment"] as const;
const PRECINCT_THEN_MUNI = [
  "precinct_containment",
  "municipal_containment",
] as const;
const NONE = [] as const;

/** Subject-scoped or absent: inheriting these would misdescribe the place. */
function own(note: string): FieldRule {
  return { fallback: "none", via: NONE, presentation: "value", note };
}

/** Already denormalized onto every row by the locations_stateinfo join. */
function fromState(note: string): FieldRule {
  return { fallback: "state", via: NONE, presentation: "value", note };
}

/** Temperature and precipitation normals travel; the station is what matters. */
function fromStation(note: string): FieldRule {
  return {
    fallback: "nearest_station",
    via: MUNICIPAL,
    presentation: "value",
    note,
  };
}

/** BEA publishes regional price parities per metro, never per neighborhood. */
function fromMetro(note: string): FieldRule {
  return { fallback: "cbsa", via: METRO, presentation: "value", note };
}

/** Reported by an agency whose jurisdiction is wider than the subject. */
function jurisdictional(
  fallback: FallbackGeography,
  via: readonly GeoRelationshipType[],
  note: string
): FieldRule {
  return { fallback, via, presentation: "context_only", note };
}

const RPP_NOTE =
  "BEA publishes regional price parities at metro level, so every neighborhood in a metro shares one value by construction.";
const ELECTION_NOTE =
  "No precinct-level source is modelled yet, so this falls through to the municipality. A citywide margin can describe a single neighborhood badly, hence context_only.";
const CLIMATE_NOTE =
  "Normals come from a station that can sit tens of miles away (SCHEMA.md hourly-normals note), so the parent's station is as representative for the neighborhood as it is for the city.";
const VA_NOTE =
  "scripts/sync-va-facilities.ts writes this per row from lat/lon. Inheriting the parent's 25-mile access gate would be a lie about a city 20 miles wide -- run the sync instead.";

/**
 * The policy table. `satisfies` makes this exhaustive: add a column to
 * LocationRow and this file stops compiling until you decide where it comes
 * from for a geography that does not own one.
 */
export const FIELD_RESOLUTION = {
  // ── Levied or scored by the municipality. Genuinely the same value. ──
  sales_tax: {
    fallback: "municipality",
    via: MUNICIPAL,
    presentation: "value",
    note: "The combined state/county/district rate is levied by the municipality; a neighborhood has no separate rate.",
  },
  lgbtq_rating: {
    fallback: "municipality",
    via: MUNICIPAL,
    presentation: "value",
    note: "HRC scores the Municipal Equality Index per municipality. A neighborhood is not separately rated, so the city's rating IS its rating.",
  },
  lgbtq_mei_score: {
    fallback: "municipality",
    via: MUNICIPAL,
    presentation: "value",
    note: "See lgbtq_rating.",
  },
  lgbtq_score_source: {
    fallback: "municipality",
    via: MUNICIPAL,
    presentation: "value",
    note: "Travels with the score it cites.",
  },

  // ── Assessed by the county. ──
  property_tax_rate: {
    fallback: "county_then_municipality",
    via: COUNTY_THEN_MUNI,
    presentation: "value",
    note: "The effective rate is set by the assessing county; fall back to the municipality only where the city assesses.",
  },

  // ── Reported at a jurisdiction wider than the subject. Must be labelled. ──
  crime: jurisdictional(
    "county_then_municipality",
    COUNTY_THEN_MUNI,
    "Police departments report citywide. A city grade says little about one neighborhood inside it, so it may be shown as context but never as the neighborhood's own safety."
  ),
  tci: jurisdictional(
    "county_then_municipality",
    COUNTY_THEN_MUNI,
    "See crime -- the total crime index shares its reporting geography."
  ),
  city_politics: jurisdictional(
    "precinct_then_municipality",
    PRECINCT_THEN_MUNI,
    ELECTION_NOTE
  ),
  election_2016: jurisdictional(
    "precinct_then_municipality",
    PRECINCT_THEN_MUNI,
    ELECTION_NOTE
  ),
  election_2016_percent: jurisdictional(
    "precinct_then_municipality",
    PRECINCT_THEN_MUNI,
    ELECTION_NOTE
  ),
  election_2024: jurisdictional(
    "precinct_then_municipality",
    PRECINCT_THEN_MUNI,
    ELECTION_NOTE
  ),
  election_2024_percent: jurisdictional(
    "precinct_then_municipality",
    PRECINCT_THEN_MUNI,
    ELECTION_NOTE
  ),
  election_change: jurisdictional(
    "precinct_then_municipality",
    PRECINCT_THEN_MUNI,
    ELECTION_NOTE
  ),
  rep_vote_share_change_pp: jurisdictional(
    "precinct_then_municipality",
    PRECINCT_THEN_MUNI,
    ELECTION_NOTE
  ),
  dem_vote_share_change_pp: jurisdictional(
    "precinct_then_municipality",
    PRECINCT_THEN_MUNI,
    ELECTION_NOTE
  ),

  // ── Station-based climate. ──
  climate: fromStation(CLIMATE_NOTE),
  climate_category: fromStation(CLIMATE_NOTE),
  snow_annual: fromStation(CLIMATE_NOTE),
  rain_annual: fromStation(CLIMATE_NOTE),
  sun_days: fromStation(CLIMATE_NOTE),
  alw: fromStation(CLIMATE_NOTE),
  avg_high_summer: fromStation(CLIMATE_NOTE),
  humidity_summer: fromStation(CLIMATE_NOTE),

  // ── Metro-level cost. ──
  col_index: fromMetro(RPP_NOTE),
  cost_of_living: fromMetro(RPP_NOTE),
  goods_rpp: fromMetro(RPP_NOTE),
  housing_rpp: fromMetro(RPP_NOTE),
  utilities_rpp: fromMetro(RPP_NOTE),
  other_services_rpp: fromMetro(RPP_NOTE),
  all_items_rpp: fromMetro(RPP_NOTE),
  bea_geo_type: fromMetro(RPP_NOTE),
  bea_geo_code: fromMetro(RPP_NOTE),
  bea_geo_name: fromMetro(RPP_NOTE),
  rpp_vintage_year: fromMetro(RPP_NOTE),

  // ── Recompute from the subject's own coordinates. Never inherit. ──
  has_va: { fallback: "recompute", via: NONE, presentation: "value", note: VA_NOTE },
  nearest_va: { fallback: "recompute", via: NONE, presentation: "value", note: VA_NOTE },
  distance_to_va: { fallback: "recompute", via: NONE, presentation: "value", note: VA_NOTE },
  nearest_va_kind: { fallback: "recompute", via: NONE, presentation: "value", note: VA_NOTE },
  nearest_va_hospital: { fallback: "recompute", via: NONE, presentation: "value", note: VA_NOTE },
  distance_to_va_hospital: { fallback: "recompute", via: NONE, presentation: "value", note: VA_NOTE },

  // ── Subject-scoped or absent. ──
  population: own(
    "Inheriting a 3.8M city population onto a 60k neighborhood is the single worst failure this module exists to prevent."
  ),
  density: own("Density is the whole point of distinguishing a neighborhood from the city average."),
  median_rent: own("A neighborhood rent that is really the citywide median would mislead on the one number people check first."),
  avg_home_value: own("See median_rent."),
  avg_home_value_display: own("Travels with avg_home_value."),
  has_walmart: own("Store presence is a within-city fact; the existing ingest rule already refuses to infer it from an adjacent town."),
  has_costco: own("See has_walmart."),
  near_lake: own("A geographic adjacency that varies within a city, which is exactly the resolution a neighborhood adds."),
  near_ocean: own("See near_lake -- an inland neighborhood of a coastal city is not coastal."),
  near_mountains: own("See near_lake."),
  vibes: own("Curated per place; a neighborhood having its own character is the whole reason to model it separately."),
  tags: own("Curated per place; borrowing a city's tag set would describe the wrong place."),
  description: own("Written about this place specifically; an inherited blurb would describe somewhere else."),
  emoji: own("Presentation, curated per place. An inherited icon would make a neighborhood look like its parent."),
  gradient: own("Presentation, curated per place. See emoji."),
  featured: own("An editorial choice about this row, not a fact about geography."),
  tech_hub: own("Curated per place. Employment concentration varies sharply within a large city."),
  defense_hub: own(
    "Derived by scripts/recompute-defense-hub.ts. Employer presence rolls UP from a neighborhood to its city, never down -- a facility downtown does not make every neighborhood a defense hub."
  ),
  defense_hub_manual: own("A curated override on this row, deliberately not inheritable -- see defense_hub."),
  pace_category: own(
    "scripts/classify-pace.ts runs per row from that row's own Census tract and CBSA, so a neighborhood gets a real classification rather than a borrowed one."
  ),

  // ── State-owned, already joined onto every row. ──
  state_party: fromState("Denormalized from locations_stateinfo by LOCATION_SELECT."),
  governor: fromState("See state_party."),
  income_tax: fromState("See state_party."),
  marijuana_status: fromState("See state_party."),
  lgbtq_state_policy_score: fromState("See state_party."),
  veterans_benefits: fromState("See state_party."),
  retired_pay_tax: fromState("See state_party."),
  no_income_tax: fromState("See state_party."),
  ss_tax_treatment: fromState("See state_party."),
  ss_tax_threshold_single: fromState("See state_party."),
  ss_tax_threshold_married: fromState("See state_party."),
  ss_tax_min_age: fromState("See state_party."),
  ss_tax_age_exempts_fully: fromState("See state_party."),
  senior_deduction_amount: fromState("See state_party."),
  senior_deduction_min_age: fromState("See state_party."),
  senior_deduction_per_qualifying_person: fromState("See state_party."),
  gas_price: fromState("Sourced per state by scripts/migrate-gas-prices.ts."),
} satisfies Record<InheritableField, FieldRule>;

/** Which geo_type an ancestor must be to satisfy a given fallback. */
const FALLBACK_TARGETS: Partial<Record<FallbackGeography, readonly GeoType[]>> = {
  municipality: ["city"],
  county: ["county"],
  county_then_municipality: ["county", "city"],
  cbsa: ["metro", "city"],
  precinct_then_municipality: ["city"],
};

function isBlank(value: unknown): boolean {
  return (
    value === null ||
    value === undefined ||
    (typeof value === "string" && value.trim() === "") ||
    (Array.isArray(value) && value.length === 0)
  );
}

function label(node: GeoNode): string {
  return `${node.name}, ${node.state}`;
}

/**
 * Resolve one field against an ancestry chain.
 *
 * Exported for testing and for callers that want a single field without
 * paying for the whole row.
 */
export function resolveField<K extends InheritableField>(
  field: K,
  subject: LocationRow,
  chain: readonly GeoNode[]
): ResolvedField<LocationRow[K]> {
  const rule = FIELD_RESOLUTION[field] as FieldRule;
  const direct = subject[field];

  if (!isBlank(direct)) {
    return {
      value: direct as LocationRow[K],
      provenance: { kind: "direct" },
      presentation: rule.presentation,
    };
  }

  /*
   * "none" and "recompute" both refuse to borrow, but for different reasons,
   * and the distinction is the actionable part: a "recompute" hole is fixed by
   * running the sync script, a "none" hole by researching the place.
   */
  if (rule.fallback === "none") {
    return {
      value: null,
      provenance: { kind: "absent", reason: "policy_forbids_inheritance" },
      presentation: rule.presentation,
    };
  }
  if (rule.fallback === "recompute" || rule.fallback === "state") {
    return {
      value: null,
      provenance: { kind: "absent", reason: "no_direct_value" },
      presentation: rule.presentation,
    };
  }

  const targets = FALLBACK_TARGETS[rule.fallback];

  /*
   * Walk `via` in priority order rather than walking the chain, so a county
   * value beats a municipal one for property tax even when the municipality is
   * the nearer ancestor.
   */
  for (const relationship of rule.via) {
    const candidates = chain
      .filter((node) => node.relationship === relationship)
      .sort((a, b) => a.depth - b.depth);

    for (const node of candidates) {
      if (targets && !targets.includes(node.geo_type)) continue;
      const value = node.row[field];
      if (isBlank(value)) continue;
      return {
        value: value as LocationRow[K],
        provenance: {
          kind: "inherited",
          sourceEntityId: node.geo_id,
          sourceEntityLabel: label(node),
          sourceGeoType: node.geo_type,
          relationship,
        },
        presentation: rule.presentation,
      };
    }
  }

  return {
    value: null,
    provenance: { kind: "absent", reason: "no_eligible_ancestor" },
    presentation: rule.presentation,
  };
}

const INHERITABLE_FIELDS = Object.keys(FIELD_RESOLUTION) as InheritableField[];

/**
 * Resolve every inheritable field for `subject` against its ancestry.
 *
 * Pure: no database access, no caching. The caller supplies the chain.
 */
export function resolveLocationFields(
  subject: LocationRow,
  chain: readonly GeoNode[]
): ResolvedLocation {
  // A row with no ancestry has nothing to inherit from and nothing to label,
  // which is every curated city. Return it untouched rather than walking 80
  // fields to prove each one is already direct.
  if (chain.length === 0) {
    return { row: subject, resolution: {}, chain: [] };
  }

  const row = { ...subject } as LocationRow;
  const resolution: ResolutionMap = {};

  for (const field of INHERITABLE_FIELDS) {
    const resolved = resolveField(field, subject, chain);
    resolution[field] = resolved as never;
    if (resolved.provenance.kind === "inherited") {
      (row as unknown as Record<string, unknown>)[field] = resolved.value;
    }
  }

  return { row, resolution, chain: [...chain] };
}

/** True when a value came from a wider geography and needs a source label. */
export function needsSourceLabel(field: ResolvedField<unknown>): boolean {
  return (
    field.provenance.kind === "inherited" ||
    (field.presentation === "context_only" && field.value !== null)
  );
}

/** Human-readable one-liner for a resolved field, for tooltips and footnotes. */
export function describeProvenance(field: ResolvedField<unknown>): string | null {
  const p = field.provenance;
  switch (p.kind) {
    case "direct":
      return null;
    case "inherited":
      return `Reported for ${p.sourceEntityLabel} (${p.sourceGeoType}), not for this place specifically.`;
    case "derived":
      return `Derived via ${p.method} from ${p.inputs.join(", ")}.`;
    case "absent":
      return p.reason === "policy_forbids_inheritance"
        ? "Not available for this place, and not inherited because a wider figure would misdescribe it."
        : p.reason === "no_eligible_ancestor"
          ? "Not available for this place, and no containing geography reports it."
          : "Not available for this place yet.";
  }
}
