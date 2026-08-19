/*
 * The Phase 2 knowledge model: global vocabulary registries, the typed shape
 * of a gold pack and of experience observations, and lossless load/serialize
 * for both.
 *
 * Design rationale lives in docs/KNOWLEDGE_MODEL.md. The registries here are
 * the single place a new vocabulary value must be argued into; packs may
 * declare local `vocabulary` subsets, which the validator checks against
 * these (the generate-dossier-prompt.ts lesson: hand-maintained lists are
 * fine only while a machine checks them against the ontology).
 *
 * Loading is deliberately strict: unknown fields are an error, not a warning,
 * so a pack written with a newer shape forces this model to grow instead of
 * silently dropping data. Lossless round-trip (parse → serialize → deep-equal
 * with the original file) is the Phase 2 exit criterion and is enforced by
 * scripts/tools/validate-knowledge-model.ts.
 */

// ---------------------------------------------------------------------------
// Registries (docs/KNOWLEDGE_MODEL.md §3)
// ---------------------------------------------------------------------------

export const CLAIM_TYPES = [
  "venue_schedule",
  "event_schedule",
  "lived_texture",
  "marketing_portrayal",
  "comparison",
  "method",
  "correction",
  "corpus_inventory",
  "context",
  "required_evidence",
  "abstention",
  "not_established",
] as const;
export type ClaimType = (typeof CLAIM_TYPES)[number];

export const EVIDENCE_CLASSES = [
  "venue_hours_primary",
  "venue_hours_aggregator",
  "community_sentiment",
  "institutional",
  "official_statistic",
  "marketing_material",
  "internal_corpus_audit",
] as const;
export type EvidenceClass = (typeof EVIDENCE_CLASSES)[number];

/*
 * Every fine-grained evidence string observed in the corpus, mapped to its
 * closed class. The original string is always preserved as `evidence_detail`;
 * the class is what retrieval filters on. An unmapped string is a validation
 * error — add it here (with a class) rather than letting it float.
 */
export const EVIDENCE_KIND_TO_CLASS: Record<string, EvidenceClass> = {
  // pack-level kinds
  venue_hours_primary: "venue_hours_primary",
  venue_hours_aggregator: "venue_hours_aggregator",
  community_sentiment: "community_sentiment",
  institutional_baseline: "institutional",
  employer_primary: "institutional",
  internal_corpus_audit: "internal_corpus_audit",
  // experience-observations kinds
  community_account: "community_sentiment",
  local_community_account: "community_sentiment",
  newcomer_community_account: "community_sentiment",
  oilfield_worker_community_account: "community_sentiment",
  resident_community_account: "community_sentiment",
  resident_style_community_account: "community_sentiment",
  visitor_community_account: "community_sentiment",
  worker_family_community_account: "community_sentiment",
  conservation_organization_event: "institutional",
  local_cultural_institution: "institutional",
  local_event_institution: "institutional",
  local_member_organization: "institutional",
  local_newcomer_organization: "institutional",
  municipal_economic_development: "institutional",
  municipal_event_notice: "institutional",
  regional_economic_development_organization: "institutional",
  destination_organization: "marketing_material",
  state_tourism_institution: "marketing_material",
  federal_labor_market_data: "official_statistic",
  state_hunting_regulation: "official_statistic",
  state_wildlife_agency_event: "official_statistic",
  state_workforce_agency: "official_statistic",
};

/* Stance is question-scoped: it lives on the claim-within-a-pack, never on a
 * bare claim (docs §1 principle 2). Three families; a pack's question shape
 * determines which it admits. */
export const STANCES = {
  evidential: ["supports", "contradicts", "context", "attribution_gap"],
  comparison: ["shared_signal", "material_difference", "asymmetric_evidence"],
  abstention: ["missing_required_evidence", "abstains"],
} as const;
export const ALL_STANCES: readonly string[] = Object.values(STANCES).flat();

export const CONFIDENCE_LEVELS = ["high", "medium", "low"] as const;
export type Confidence = (typeof CONFIDENCE_LEVELS)[number];
/* Legacy spellings preserved verbatim as confidence_detail when mapped. */
export const CONFIDENCE_ALIASES: Record<string, Confidence> = { limited: "low" };

export const MEASURES = ["availability", "attendance", "frequency", "outcome"] as const;
export type Measures = (typeof MEASURES)[number];

export const CAUSAL_STATUSES = ["association", "causal", "unknown"] as const;
export const COVERAGE_BASES = [
  "census",
  "representative_sample",
  "partial_sample",
  "anecdotal",
  "single_source",
] as const;

export const TEMPORAL_PATTERNS = [
  "year_round_weekly",
  "seasonal",
  "event_driven",
  "one_time",
  "unknown",
] as const;
export type TemporalPattern = (typeof TEMPORAL_PATTERNS)[number];

export const QUESTION_SHAPES = [
  "answerable",
  "cross_city_comparison",
  "comparative_single_city",
  "conflicting_evidence",
  "insufficient",
  "adversarial_attribution",
  "adversarial_insufficient_evidence",
  "adversarial_overreach",
  "adversarial_causality",
  "adversarial_geography",
] as const;

export const DIVERGENCE_STANCES = [
  "co_true_different_measures",
  "asymmetric_evidence",
  "genuine_conflict",
  "superseded",
] as const;
export const POLE_PERSPECTIVES = ["lived", "marketing", "institutional", "official"] as const;

export const PLACE_KINDS = [
  "venue",
  "district",
  "city",
  "county",
  "metro",
  "region",
  "school_district",
] as const;
export const RESOLUTION_STATUSES = ["verified", "unresolved", "closed", "rebranded"] as const;
export const SCHEDULE_COMPONENTS = ["venue", "kitchen", "bar", "program"] as const;
export const LINK_RELS = [
  "corroborates",
  "contradicts",
  "corrects",
  "supersedes",
  "scopes",
  "cross_references",
  "reuses",
] as const;

// ---------------------------------------------------------------------------
// Gold pack file shape (schema_version 1, as checked in under data/gold-packs)
// ---------------------------------------------------------------------------

export interface PackClaimFile {
  id: string;
  claim: string;
  claim_type: string;
  evidence_kind: string;
  stance: string;
  confidence: string;
  geography_scope: string;
  quote: string | null;
  source_urls: string[];
  retrieved_on: string;
  limitations: string[];
  // schema_version 2 additions — the eval v1 constructs (docs §4)
  measures?: string;
  temporal_pattern?: string;
  coverage?: { basis: string; universe: string };
  causal_status?: string;
}

/* schema_version 2: a pack may carry divergences (docs §4.4). Poles must cite
 * claims that exist in the same pack. */
export interface PackDivergenceFile {
  id: string;
  city: string;
  topic: string;
  poles: { perspective: string; claim_ids: string[]; status: string }[];
  stance: string;
  note: string;
}

export interface CorpusBoundary {
  reviewed_at_commit: string;
  reviewed_on: string;
  reviewed_artifacts: string[];
  method: string;
}

export interface PackAnswer {
  verdict: string;
  one_line: string;
  sentence_trace: { sentence: string; evidence: string[] }[];
}

export interface PackVocabulary {
  claim_type?: string[];
  evidence_kind?: string[];
  stance?: Record<string, string>;
  confidence?: string[];
}

export interface PackFile {
  schema_version: number;
  pack_id: string;
  question: string;
  question_shape?: string;
  geography_scope: string;
  temporal_scope?: string;
  retrieved_on: string;
  ledger_entry?: string;
  ledger_entries?: string[];
  corpus_boundary?: CorpusBoundary;
  method_note?: string;
  vocabulary: PackVocabulary;
  notes_on_sourcing?: string;
  claims: PackClaimFile[];
  divergences?: PackDivergenceFile[];
  answer: PackAnswer;
}

/* Field order for serialization; must list every legal key. Parsing rejects
 * keys outside this list so new pack fields force a model update. */
const PACK_KEYS: (keyof PackFile)[] = [
  "schema_version",
  "pack_id",
  "question",
  "question_shape",
  "geography_scope",
  "temporal_scope",
  "retrieved_on",
  "ledger_entry",
  "ledger_entries",
  "corpus_boundary",
  "method_note",
  "vocabulary",
  "notes_on_sourcing",
  "claims",
  "divergences",
  "answer",
];
const CLAIM_KEYS: (keyof PackClaimFile)[] = [
  "id",
  "claim",
  "claim_type",
  "evidence_kind",
  "stance",
  "confidence",
  "geography_scope",
  "quote",
  "source_urls",
  "retrieved_on",
  "limitations",
  "measures",
  "temporal_pattern",
  "coverage",
  "causal_status",
];
const DIVERGENCE_KEYS = ["id", "city", "topic", "poles", "stance", "note"];

export interface ParseResult<T> {
  value: T;
  errors: string[];
}

function unknownKeys(obj: object, allowed: readonly string[], where: string): string[] {
  return Object.keys(obj)
    .filter((k) => !allowed.includes(k))
    .map((k) => `${where}: unknown field "${k}" — add it to the model, do not drop it`);
}

export function parsePack(raw: unknown, file: string): ParseResult<PackFile> {
  const errors: string[] = [];
  const p = raw as PackFile;
  errors.push(...unknownKeys(p as object, PACK_KEYS as string[], file));

  if (p.question_shape !== undefined && !(QUESTION_SHAPES as readonly string[]).includes(p.question_shape)) {
    errors.push(`${file}: question_shape "${p.question_shape}" not in registry`);
  }

  const packStances = p.vocabulary?.stance ? Object.keys(p.vocabulary.stance) : null;
  for (const v of p.vocabulary?.claim_type ?? []) {
    if (!(CLAIM_TYPES as readonly string[]).includes(v)) errors.push(`${file}: pack vocabulary claim_type "${v}" not in registry`);
  }
  for (const v of p.vocabulary?.evidence_kind ?? []) {
    if (!(v in EVIDENCE_KIND_TO_CLASS)) errors.push(`${file}: pack vocabulary evidence_kind "${v}" has no class mapping`);
  }
  for (const v of packStances ?? []) {
    if (!ALL_STANCES.includes(v)) errors.push(`${file}: pack vocabulary stance "${v}" not in registry`);
  }
  for (const v of p.vocabulary?.confidence ?? []) {
    if (!(CONFIDENCE_LEVELS as readonly string[]).includes(v) && !(v in CONFIDENCE_ALIASES)) {
      errors.push(`${file}: pack vocabulary confidence "${v}" not in registry`);
    }
  }

  const claimIds = new Set<string>();
  for (const c of p.claims ?? []) {
    const where = `${file} claim ${c.id}`;
    errors.push(...unknownKeys(c, CLAIM_KEYS as string[], where));
    if (claimIds.has(c.id)) errors.push(`${where}: duplicate id`);
    claimIds.add(c.id);
    if (!(CLAIM_TYPES as readonly string[]).includes(c.claim_type)) errors.push(`${where}: claim_type "${c.claim_type}" not in registry`);
    if (!(c.evidence_kind in EVIDENCE_KIND_TO_CLASS)) errors.push(`${where}: evidence_kind "${c.evidence_kind}" has no class mapping`);
    if (!ALL_STANCES.includes(c.stance)) errors.push(`${where}: stance "${c.stance}" not in registry`);
    if (packStances && !packStances.includes(c.stance)) errors.push(`${where}: stance "${c.stance}" not declared in this pack's vocabulary`);
    if (p.vocabulary?.claim_type && !p.vocabulary.claim_type.includes(c.claim_type)) {
      errors.push(`${where}: claim_type "${c.claim_type}" not declared in this pack's vocabulary`);
    }
    if (!(CONFIDENCE_LEVELS as readonly string[]).includes(c.confidence) && !(c.confidence in CONFIDENCE_ALIASES)) {
      errors.push(`${where}: confidence "${c.confidence}" not in registry`);
    }
    if (c.measures !== undefined && !(MEASURES as readonly string[]).includes(c.measures)) {
      errors.push(`${where}: measures "${c.measures}" not in registry`);
    }
    if (c.temporal_pattern !== undefined && !(TEMPORAL_PATTERNS as readonly string[]).includes(c.temporal_pattern)) {
      errors.push(`${where}: temporal_pattern "${c.temporal_pattern}" not in registry`);
    }
    if (c.causal_status !== undefined && !(CAUSAL_STATUSES as readonly string[]).includes(c.causal_status)) {
      errors.push(`${where}: causal_status "${c.causal_status}" not in registry`);
    }
    if (c.coverage !== undefined) {
      errors.push(...unknownKeys(c.coverage, ["basis", "universe"], `${where} coverage`));
      if (!(COVERAGE_BASES as readonly string[]).includes(c.coverage.basis)) {
        errors.push(`${where}: coverage.basis "${c.coverage.basis}" not in registry`);
      }
    }
  }

  for (const d of p.divergences ?? []) {
    const where = `${file} divergence ${d.id}`;
    errors.push(...unknownKeys(d, DIVERGENCE_KEYS, where));
    if (!(DIVERGENCE_STANCES as readonly string[]).includes(d.stance)) errors.push(`${where}: stance "${d.stance}" not in registry`);
    if (d.poles.length < 2) errors.push(`${where}: needs at least two poles`);
    for (const pole of d.poles) {
      errors.push(...unknownKeys(pole, ["perspective", "claim_ids", "status"], where));
      if (!(POLE_PERSPECTIVES as readonly string[]).includes(pole.perspective)) {
        errors.push(`${where}: perspective "${pole.perspective}" not in registry`);
      }
      if (pole.status !== "present" && pole.status !== "missing") errors.push(`${where}: pole status "${pole.status}" invalid`);
      if (pole.status === "present" && pole.claim_ids.length === 0) {
        errors.push(`${where}: present pole "${pole.perspective}" has no claims — poles must be claims, never prose`);
      }
      if (pole.status === "missing" && pole.claim_ids.length > 0) {
        errors.push(`${where}: missing pole "${pole.perspective}" must not cite claims`);
      }
      for (const id of pole.claim_ids) {
        if (!claimIds.has(id)) errors.push(`${where}: pole cites unknown claim "${id}"`);
      }
    }
  }

  for (const [i, s] of (p.answer?.sentence_trace ?? []).entries()) {
    for (const e of s.evidence) {
      if (!claimIds.has(e)) errors.push(`${file} sentence_trace[${i}]: evidence "${e}" is not a claim id in this pack`);
    }
  }

  return { value: p, errors };
}

/* Serialize with canonical key order. Round-trip lossless-ness is proven by
 * deep-equality against the original parsed JSON (key order excluded). */
export function packToJson(p: PackFile): unknown {
  const pick = (obj: object, keys: readonly string[]) => {
    const out: Record<string, unknown> = {};
    for (const k of keys) {
      const v = (obj as Record<string, unknown>)[k];
      if (v !== undefined) out[k] = v;
    }
    return out;
  };
  const out = pick(p, PACK_KEYS as string[]);
  out.claims = p.claims.map((c) => pick(c, CLAIM_KEYS as string[]));
  return out;
}

// ---------------------------------------------------------------------------
// Experience observations (data/experience-observations.json)
// ---------------------------------------------------------------------------

export interface ObservationRow {
  city: string;
  state: string;
  observation_key: string;
  topic: string;
  claim_key: string;
  stance: string;
  observation: string;
  source_excerpt: string;
  source_title: string;
  source_url: string;
  evidence_kind: string;
  confidence: string;
  geography_scope: string;
  tags: string[];
  source_retrieved_on: string;
}

export interface ObservationsFile {
  methodology: string;
  observations: ObservationRow[];
}

const OBSERVATION_KEYS: (keyof ObservationRow)[] = [
  "city",
  "state",
  "observation_key",
  "topic",
  "claim_key",
  "stance",
  "observation",
  "source_excerpt",
  "source_title",
  "source_url",
  "evidence_kind",
  "confidence",
  "geography_scope",
  "tags",
  "source_retrieved_on",
];

export function parseObservations(raw: unknown, file: string): ParseResult<ObservationsFile> {
  const errors: string[] = [];
  const o = raw as ObservationsFile;
  errors.push(...unknownKeys(o as object, ["methodology", "observations"], file));
  for (const row of o.observations ?? []) {
    const where = `${file} observation ${row.observation_key}`;
    errors.push(...unknownKeys(row, OBSERVATION_KEYS as string[], where));
    if (!(row.evidence_kind in EVIDENCE_KIND_TO_CLASS)) errors.push(`${where}: evidence_kind "${row.evidence_kind}" has no class mapping`);
    if (!ALL_STANCES.includes(row.stance)) errors.push(`${where}: stance "${row.stance}" not in registry`);
    if (!(CONFIDENCE_LEVELS as readonly string[]).includes(row.confidence) && !(row.confidence in CONFIDENCE_ALIASES)) {
      errors.push(`${where}: confidence "${row.confidence}" not in registry`);
    }
  }
  return { value: o, errors };
}

// ---------------------------------------------------------------------------
// Model-native records (docs §2): the shapes new data is authored in.
// ---------------------------------------------------------------------------

export interface GeographyScope {
  label: string; // verbatim, always
  precision?: "city" | "county" | "metro" | "blurred_metro" | "district" | "corpus_only";
  place_refs?: string[];
}

export interface Claim {
  id: string;
  claim: string;
  claim_type: ClaimType;
  evidence_class: EvidenceClass;
  evidence_detail: string; // the original fine-grained kind, verbatim
  confidence: Confidence;
  confidence_detail?: string; // original spelling when aliased (e.g. "limited")
  geography_scope: GeographyScope;
  temporal_scope?: string;
  quote: string | null;
  source_urls: string[];
  retrieved_on: string;
  limitations: string[];
  // eval v1 constructs (docs §4)
  measures?: Measures;
  causal_status?: (typeof CAUSAL_STATUSES)[number];
  coverage?: { basis: (typeof COVERAGE_BASES)[number]; universe: string };
  // legacy carry-through for observation-mapped claims
  default_stance?: string;
  topic?: string;
  tags?: string[];
  place_refs?: string[];
  claim_key?: string;
  source_title?: string;
}

export interface ScheduleRow {
  days: ("mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun")[];
  open: string; // "HH:MM" 24h
  close: string | null; // null = "until close" (unpublished)
  closes_next_day?: boolean;
  approximate?: boolean;
}

export interface Schedule {
  id: string;
  place_id: string;
  component: (typeof SCHEDULE_COMPONENTS)[number];
  program_name?: string;
  rows: ScheduleRow[];
  temporal_pattern: TemporalPattern;
  as_of: string;
  claim_ids: string[]; // provenance: the claims this structure was read from
}

export interface DivergencePole {
  perspective: (typeof POLE_PERSPECTIVES)[number];
  claim_ids: string[]; // must be real, tagged claims — never prose
  status: "present" | "missing";
}

export interface Divergence {
  id: string;
  city: string;
  topic: string;
  poles: DivergencePole[];
  stance: (typeof DIVERGENCE_STANCES)[number];
  note: string;
}

/* Both poles must exist as claims; a missing pole is a research TODO that the
 * answer layer must surface as one-sided evidence (docs §4.4). */
export function validateDivergence(d: Divergence, knownClaimIds: Set<string>): string[] {
  const errors: string[] = [];
  if (d.poles.length < 2) errors.push(`divergence ${d.id}: needs at least two poles`);
  for (const pole of d.poles) {
    if (pole.status === "present" && pole.claim_ids.length === 0) {
      errors.push(`divergence ${d.id}: present pole "${pole.perspective}" has no claims`);
    }
    if (pole.status === "missing" && pole.claim_ids.length > 0) {
      errors.push(`divergence ${d.id}: missing pole "${pole.perspective}" must not cite claims`);
    }
    for (const id of pole.claim_ids) {
      if (!knownClaimIds.has(id)) errors.push(`divergence ${d.id}: pole cites unknown claim "${id}"`);
    }
  }
  return errors;
}

/* Mechanical observation → claim mapping (docs §5). Reversible; the validator
 * round-trips all rows through claimToObservation to prove it. */
export function observationToClaim(o: ObservationRow): Claim {
  const canonical = (CONFIDENCE_LEVELS as readonly string[]).includes(o.confidence)
    ? (o.confidence as Confidence)
    : CONFIDENCE_ALIASES[o.confidence];
  return {
    id: o.observation_key,
    claim: o.observation,
    claim_type: "lived_texture",
    evidence_class: EVIDENCE_KIND_TO_CLASS[o.evidence_kind],
    evidence_detail: o.evidence_kind,
    confidence: canonical,
    ...(canonical !== o.confidence ? { confidence_detail: o.confidence } : {}),
    geography_scope: { label: o.geography_scope },
    quote: o.source_excerpt,
    source_urls: [o.source_url],
    retrieved_on: o.source_retrieved_on,
    limitations: [],
    default_stance: o.stance,
    topic: o.topic,
    tags: o.tags,
    place_refs: [`${o.city}, ${o.state}`],
    claim_key: o.claim_key,
    source_title: o.source_title,
  };
}

export function claimToObservation(c: Claim): ObservationRow {
  const [city, state] = (c.place_refs?.[0] ?? ", ").split(", ");
  return {
    city,
    state,
    observation_key: c.id,
    topic: c.topic ?? "",
    claim_key: c.claim_key ?? "",
    stance: c.default_stance ?? "",
    observation: c.claim,
    source_excerpt: c.quote ?? "",
    source_title: c.source_title ?? "",
    source_url: c.source_urls[0],
    evidence_kind: c.evidence_detail,
    confidence: c.confidence_detail ?? c.confidence,
    geography_scope: c.geography_scope.label,
    tags: c.tags ?? [],
    source_retrieved_on: c.retrieved_on,
  };
}

// ---------------------------------------------------------------------------
// Deep equality with path reporting, for the round-trip proof.
// ---------------------------------------------------------------------------

export function deepDiff(a: unknown, b: unknown, path = "$"): string[] {
  if (a === b) return [];
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return [`${path}: array length ${a.length} != ${b.length}`];
    return a.flatMap((v, i) => deepDiff(v, b[i], `${path}[${i}]`));
  }
  if (a && b && typeof a === "object" && typeof b === "object" && !Array.isArray(a) && !Array.isArray(b)) {
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    return [...keys].flatMap((k) =>
      deepDiff((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k], `${path}.${k}`)
    );
  }
  return [`${path}: ${JSON.stringify(a)} != ${JSON.stringify(b)}`];
}
