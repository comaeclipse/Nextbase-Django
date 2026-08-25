/*
 * Controlled vocabulary for recurring city genres.
 *
 * Genres are evidence-backed bundles of traits, not aliases for individual
 * feature values. The registry therefore records which features can support a
 * classification while explicitly keeping variable traits out of the genre's
 * identity. Governance and admission rules live in
 * docs/NANOGENRE_TAXONOMY.md.
 */
import { isFeatureKey } from "./ontology";

export const GENRE_ONTOLOGY_VERSION = "city_genres_v1";

export const GENRE_LEVELS = ["broad", "micro", "nano"] as const;
export type GenreLevel = (typeof GENRE_LEVELS)[number];

export const GENRE_STATUSES = ["provisional", "admitted", "retired"] as const;
export type GenreStatus = (typeof GENRE_STATUSES)[number];

export interface GenreDefinition {
  key: string;
  label: string;
  priorLabels?: readonly string[];
  level: GenreLevel;
  status: GenreStatus;
  definition: string;
  /** The recurring relationship that makes this a genre rather than a trait. */
  distinguishingPattern: readonly string[];
  /** Existing feature keys that may support, but never automatically decide, membership. */
  supportingFeatureKeys: readonly string[];
  /** Axes that describe variants inside the genre and must not create sibling genres alone. */
  variableTraitKeys: readonly string[];
  discoveryMembers: readonly string[];
  validationMembers: readonly string[];
  rationale: string;
  governanceDecision: string;
  introducedOn: string;
  reviewedBy: string;
  reviewedOn: string;
}

export const GENRES = [
  {
    key: "regional_service_hub",
    label: "Regional Service Hub",
    priorLabels: ["Interior Regional Service Hub"],
    level: "micro",
    status: "provisional",
    definition:
      "A relatively self-contained city that supplies disproportionately important employment, services, or institutions to a broad surrounding region.",
    distinguishingPattern: [
      "The city serves a hinterland larger than its population alone would predict.",
      "Everyday necessities and regionally important institutions coexist with thinner metropolitan-scale depth.",
      "A local anchor explains the city's particular form without defining a separate genre.",
    ],
    supportingFeatureKeys: [
      "geographic_isolation",
      "employment_opportunity_depth",
      "routine_healthcare_access",
      "specialist_healthcare_access",
      "urban_amenity_depth",
    ],
    variableTraitKeys: [
      "economic_cycle_exposure",
      "high_wage_trade_opportunity",
      "public_land_access",
      "wind_exposure",
      "downtown_walkability",
      "car_dependence",
    ],
    discoveryMembers: [
      "Casper, WY",
      "Odessa, TX",
      "Cheyenne, WY",
      "North Platte, NE",
      "Grand Junction, CO",
    ],
    validationMembers: ["Pensacola, FL"],
    rationale:
      "Five independently researched discovery cities established recurrence. Pensacola then reproduced the hub structure on the Gulf Coast, showing that interior/coastal position and energy, government, rail, healthcare, public-land, or military anchors are traits within one family rather than separate genres.",
    governanceDecision: "NANOGENRE_TAXONOMY.md section 12 decisions 6-8",
    introducedOn: "2026-08-21",
    reviewedBy: "comaeclipse",
    reviewedOn: "2026-08-21",
  },
  {
    key: "historic_coastal_port_city",
    label: "Historic Coastal Port City",
    level: "micro",
    status: "provisional",
    definition:
      "A coastal city where a working-port economy and a historic urban core jointly shape employment, identity, visitor pressure, and everyday movement.",
    distinguishingPattern: [
      "A working port remains part of the city's economic structure rather than merely its history or branding.",
      "A walkable historic core sits inside a substantially car-dependent outer fabric.",
      "Heritage tourism and resident life exert simultaneous, sometimes conflicting pressure on the same city.",
    ],
    supportingFeatureKeys: [
      "downtown_walkability",
      "car_dependence",
      "tourism_pressure",
      "employment_diversity",
      "cultural_distinctiveness",
    ],
    variableTraitKeys: [
      "tourism_pressure",
      "specialist_healthcare_access",
      "growth_pressure",
      "housing_affordability",
      "water_recreation_access",
    ],
    discoveryMembers: ["Savannah, GA", "Mobile, AL", "Charleston, SC"],
    validationMembers: [],
    rationale:
      "Savannah, Mobile, and Charleston independently reproduced the port, historic-core, and car-dependent-outer-fabric bundle. Their tourism, medical depth, affordability, and growth differences form continuous axes inside the family rather than sibling genres.",
    governanceDecision: "NANOGENRE_TAXONOMY.md section 12 decisions 6-8",
    introducedOn: "2026-08-21",
    reviewedBy: "comaeclipse",
    reviewedOn: "2026-08-21",
  },
] as const satisfies readonly GenreDefinition[];

const BY_KEY = new Map<string, GenreDefinition>(GENRES.map((genre) => [genre.key, genre]));

export function getGenre(key: string): GenreDefinition {
  const genre = BY_KEY.get(key);
  if (!genre) throw new Error(`Unknown genre key: ${key}`);
  return genre;
}

export function isGenreKey(key: string): boolean {
  return BY_KEY.has(key);
}

export function validateGenreOntology(
  definitions: readonly GenreDefinition[] = GENRES
): string[] {
  const errors: string[] = [];
  const keys = new Set<string>();

  for (const genre of definitions) {
    const where = `genre ${genre.key || "<missing key>"}`;
    if (!/^[a-z][a-z0-9_]*$/.test(genre.key)) {
      errors.push(`${where}: key must be lowercase snake case`);
    }
    if (keys.has(genre.key)) errors.push(`${where}: duplicate key`);
    keys.add(genre.key);
    if (!(GENRE_LEVELS as readonly string[]).includes(genre.level)) {
      errors.push(`${where}: unknown level "${genre.level}"`);
    }
    if (!(GENRE_STATUSES as readonly string[]).includes(genre.status)) {
      errors.push(`${where}: unknown status "${genre.status}"`);
    }
    if (!genre.label.trim()) errors.push(`${where}: label is required`);
    if (!genre.definition.trim()) errors.push(`${where}: definition is required`);
    if (genre.distinguishingPattern.length < 2) {
      errors.push(`${where}: needs a recurring multi-trait pattern`);
    }
    if (!genre.rationale.trim()) errors.push(`${where}: rationale is required`);
    if (!genre.governanceDecision.trim()) {
      errors.push(`${where}: governance decision is required`);
    }
    for (const featureKey of [
      ...genre.supportingFeatureKeys,
      ...genre.variableTraitKeys,
    ]) {
      if (!isFeatureKey(featureKey)) {
        errors.push(`${where}: unknown feature key "${featureKey}"`);
      }
    }
  }

  return errors;
}

export interface GenreAssignmentEvidence {
  featureKeys?: readonly string[];
  sourceSignalKeys?: readonly string[];
  claimIds?: readonly string[];
  divergenceIds?: readonly string[];
  notes?: readonly string[];
}

export interface GenreAssignmentDraft {
  level: string;
  genreKey: string;
  isPrimary: boolean;
  confidence: number;
  rationale: string;
  evidence: GenreAssignmentEvidence;
  ontologyVersion: string;
  methodVersion: string;
  assignedOn: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export function validateGenreAssignment(assignment: GenreAssignmentDraft): string[] {
  const errors: string[] = [];
  const genre = isGenreKey(assignment.genreKey) ? getGenre(assignment.genreKey) : null;

  if (!genre) errors.push(`unknown genre key "${assignment.genreKey}"`);
  if (!(GENRE_LEVELS as readonly string[]).includes(assignment.level)) {
    errors.push(`unknown genre level "${assignment.level}"`);
  } else if (genre && genre.level !== assignment.level) {
    errors.push(
      `genre "${assignment.genreKey}" is ${genre.level}, not ${assignment.level}`
    );
  }
  if (
    !Number.isFinite(assignment.confidence) ||
    assignment.confidence < 0 ||
    assignment.confidence > 1
  ) {
    errors.push("confidence must be between 0 and 1");
  }
  if (!assignment.rationale.trim()) errors.push("rationale is required");
  if (assignment.ontologyVersion !== GENRE_ONTOLOGY_VERSION) {
    errors.push(
      `ontology version "${assignment.ontologyVersion}" does not match ${GENRE_ONTOLOGY_VERSION}`
    );
  }
  if (!assignment.methodVersion.trim()) errors.push("method version is required");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(assignment.assignedOn)) {
    errors.push("assignedOn must be YYYY-MM-DD");
  }

  const evidenceKeys = assignment.evidence.featureKeys ?? [];
  for (const featureKey of evidenceKeys) {
    if (!isFeatureKey(featureKey)) errors.push(`unknown evidence feature key "${featureKey}"`);
  }
  const evidenceCount =
    evidenceKeys.length +
    (assignment.evidence.sourceSignalKeys?.length ?? 0) +
    (assignment.evidence.claimIds?.length ?? 0) +
    (assignment.evidence.divergenceIds?.length ?? 0) +
    (assignment.evidence.notes?.filter((note) => note.trim()).length ?? 0);
  if (evidenceCount === 0) errors.push("at least one evidence reference is required");

  if (Boolean(assignment.reviewedBy) !== Boolean(assignment.reviewedAt)) {
    errors.push("reviewedBy and reviewedAt must be provided together");
  }
  if (assignment.reviewedBy !== undefined && !assignment.reviewedBy.trim()) {
    errors.push("reviewedBy must not be blank");
  }
  if (
    assignment.reviewedAt !== undefined &&
    Number.isNaN(Date.parse(assignment.reviewedAt))
  ) {
    errors.push("reviewedAt must be an ISO timestamp");
  }

  return errors;
}
