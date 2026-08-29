import {
  GENRE_ONTOLOGY_VERSION,
  validateGenreAssignment,
  type GenreAssignmentDraft,
  type GenreAssignmentEvidence,
} from "./genre-ontology";

export interface GenreAssignmentEvidenceFile {
  feature_keys?: string[];
  source_signal_keys?: string[];
  dossier_keys?: string[];
  claim_ids?: string[];
  divergence_ids?: string[];
  notes?: string[];
}

export interface GenreAssignmentFileRow {
  city: string;
  state: string;
  level: string;
  genre_key: string;
  is_primary: boolean;
  confidence: number;
  rationale: string;
  evidence: GenreAssignmentEvidenceFile;
  assigned_on: string;
  reviewed_by?: string;
  reviewed_at?: string;
}

export interface GenreAssignmentsFile {
  ontology_version: string;
  method_version: string;
  assignments: GenreAssignmentFileRow[];
}

export interface GenreAssignmentsParseResult {
  value: GenreAssignmentsFile | null;
  errors: string[];
}

const FILE_KEYS = ["ontology_version", "method_version", "assignments"] as const;
const ROW_KEYS = [
  "city",
  "state",
  "level",
  "genre_key",
  "is_primary",
  "confidence",
  "rationale",
  "evidence",
  "assigned_on",
  "reviewed_by",
  "reviewed_at",
] as const;
const EVIDENCE_KEYS = [
  "feature_keys",
  "source_signal_keys",
  "dossier_keys",
  "claim_ids",
  "divergence_ids",
  "notes",
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function unknownKeys(
  value: Record<string, unknown>,
  allowed: readonly string[],
  where: string
): string[] {
  return Object.keys(value)
    .filter((key) => !allowed.includes(key))
    .map((key) => `${where}: unknown field "${key}"`);
}

function validateStringArray(value: unknown, where: string): string[] {
  if (value === undefined) return [];
  if (!Array.isArray(value)) return [`${where}: must be an array`];
  if (value.some((item) => typeof item !== "string" || !item.trim())) {
    return [`${where}: entries must be non-blank strings`];
  }
  return [];
}

export function evidenceFromFile(
  evidence: GenreAssignmentEvidenceFile
): GenreAssignmentEvidence {
  return {
    featureKeys: evidence.feature_keys,
    sourceSignalKeys: evidence.source_signal_keys,
    dossierKeys: evidence.dossier_keys,
    claimIds: evidence.claim_ids,
    divergenceIds: evidence.divergence_ids,
    notes: evidence.notes,
  };
}

export function assignmentDraftFromFile(
  row: GenreAssignmentFileRow,
  source: GenreAssignmentsFile
): GenreAssignmentDraft {
  return {
    level: row.level,
    genreKey: row.genre_key,
    isPrimary: row.is_primary,
    confidence: row.confidence,
    rationale: row.rationale,
    evidence: evidenceFromFile(row.evidence),
    ontologyVersion: source.ontology_version,
    methodVersion: source.method_version,
    assignedOn: row.assigned_on,
    reviewedBy: row.reviewed_by,
    reviewedAt: row.reviewed_at,
  };
}

export function parseGenreAssignmentsFile(
  raw: unknown,
  file = "genre assignments"
): GenreAssignmentsParseResult {
  const errors: string[] = [];
  if (!isRecord(raw)) return { value: null, errors: [`${file}: must be an object`] };
  errors.push(...unknownKeys(raw, FILE_KEYS, file));

  const ontologyVersionValid = typeof raw.ontology_version === "string";
  if (raw.ontology_version !== GENRE_ONTOLOGY_VERSION) {
    errors.push(
      `${file}: ontology_version must be ${GENRE_ONTOLOGY_VERSION}, got "${String(raw.ontology_version)}"`
    );
  }
  const methodVersionValid =
    typeof raw.method_version === "string" && Boolean(raw.method_version.trim());
  if (!methodVersionValid) {
    errors.push(`${file}: method_version is required`);
  }
  if (!Array.isArray(raw.assignments)) {
    errors.push(`${file}: assignments must be an array`);
    return { value: null, errors };
  }

  const source = raw as unknown as GenreAssignmentsFile;
  const seen = new Set<string>();
  const primaryByCityLevel = new Set<string>();

  raw.assignments.forEach((candidate, index) => {
    const where = `${file} assignments[${index}]`;
    if (!isRecord(candidate)) {
      errors.push(`${where}: must be an object`);
      return;
    }
    errors.push(...unknownKeys(candidate, ROW_KEYS, where));

    const stringFields = ["city", "state", "level", "genre_key", "rationale", "assigned_on"];
    let coreTypesValid = true;
    for (const field of stringFields) {
      if (typeof candidate[field] !== "string" || !(candidate[field] as string).trim()) {
        errors.push(`${where}: ${field} is required`);
        coreTypesValid = false;
      }
    }
    if (typeof candidate.is_primary !== "boolean") {
      errors.push(`${where}: is_primary must be boolean`);
      coreTypesValid = false;
    }
    if (typeof candidate.confidence !== "number") {
      errors.push(`${where}: confidence must be numeric`);
      coreTypesValid = false;
    }
    if (typeof candidate.state === "string" && !/^[A-Z]{2}$/.test(candidate.state)) {
      errors.push(`${where}: state must be a two-letter uppercase abbreviation`);
    }
    if (candidate.reviewed_by !== undefined && typeof candidate.reviewed_by !== "string") {
      errors.push(`${where}: reviewed_by must be a string`);
      coreTypesValid = false;
    }
    if (candidate.reviewed_at !== undefined && typeof candidate.reviewed_at !== "string") {
      errors.push(`${where}: reviewed_at must be a string`);
      coreTypesValid = false;
    }

    if (!isRecord(candidate.evidence)) {
      errors.push(`${where}: evidence must be an object`);
      coreTypesValid = false;
    } else {
      errors.push(...unknownKeys(candidate.evidence, EVIDENCE_KEYS, `${where} evidence`));
      for (const key of EVIDENCE_KEYS) {
        const evidenceErrors = validateStringArray(
          candidate.evidence[key],
          `${where} evidence.${key}`
        );
        if (evidenceErrors.length > 0) coreTypesValid = false;
        errors.push(...evidenceErrors);
      }
    }

    if (!coreTypesValid || !ontologyVersionValid || !methodVersionValid) return;
    const row = candidate as unknown as GenreAssignmentFileRow;
    errors.push(
      ...validateGenreAssignment(assignmentDraftFromFile(row, source)).map(
        (error) => `${where}: ${error}`
      )
    );

    const key = `${row.city}\u0000${row.state}\u0000${row.level}\u0000${row.genre_key}`;
    if (seen.has(key)) errors.push(`${where}: duplicate city/level/genre assignment`);
    seen.add(key);

    if (row.is_primary) {
      const primaryKey = `${row.city}\u0000${row.state}\u0000${row.level}`;
      if (primaryByCityLevel.has(primaryKey)) {
        errors.push(`${where}: more than one primary assignment for this city and level`);
      }
      primaryByCityLevel.add(primaryKey);
    }
  });

  return { value: source, errors };
}
