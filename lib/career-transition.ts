import { readFileSync } from "node:fs";
import path from "node:path";
import { parse } from "csv-parse/sync";
import { getSql } from "./db";

export type MilitaryBranch =
  | "army"
  | "navy"
  | "air_force"
  | "marine_corps"
  | "coast_guard"
  | "space_force";

export type MilitaryPopulation = "enlisted" | "warrant" | "officer";
export type SpecialtyStatus = "current" | "legacy" | "unknown";
export type MatchDirectness = "direct" | "adjacent" | "requires_gap";

export const BRANCH_LABELS: Record<MilitaryBranch, string> = {
  army: "Army",
  navy: "Navy",
  air_force: "Air Force",
  marine_corps: "Marine Corps",
  coast_guard: "Coast Guard",
  space_force: "Space Force",
};

const BRANCH_ALIASES: Record<string, MilitaryBranch> = {
  army: "army",
  usa: "army",
  navy: "navy",
  usn: "navy",
  airforce: "air_force",
  air_force: "air_force",
  "air force": "air_force",
  usaf: "air_force",
  marines: "marine_corps",
  marinecorps: "marine_corps",
  marine_corps: "marine_corps",
  "marine corps": "marine_corps",
  usmc: "marine_corps",
  coastguard: "coast_guard",
  coast_guard: "coast_guard",
  "coast guard": "coast_guard",
  uscg: "coast_guard",
  spaceforce: "space_force",
  space_force: "space_force",
  "space force": "space_force",
  ussf: "space_force",
};

export interface MilitarySpecialty {
  id: number;
  branch: MilitaryBranch;
  code_system: string;
  code: string;
  title: string;
  population: MilitaryPopulation;
  status: SpecialtyStatus;
  source_kind: string;
  source_url: string;
  source_retrieved_on: string;
}

export interface CivilianTransitionRole {
  id: number;
  slug: string;
  title: string;
  role_family: string;
  onet_soc_code: string | null;
  summary: string;
  credential_notes: string | null;
  source_kind: string;
  source_url: string;
  source_retrieved_on: string;
}

export interface SpecialtyRoleMatch {
  specialty_id: number;
  role_id: number;
  fit_score: number;
  directness: MatchDirectness;
  rationale: string;
  source_kind: string;
  source_url: string;
  source_retrieved_on: string;
}

export type TransitionEmployerType =
  | "oem"
  | "defense_contractor"
  | "mro"
  | "civilian_operator";

export interface TransitionEmployer {
  id: number;
  slug: string;
  display_name: string;
  parent_company: string | null;
  employer_type: TransitionEmployerType;
  defense_employer_slug: string | null;
  website_url: string | null;
  notes: string | null;
  source_kind: string;
  source_url: string;
  source_retrieved_on: string;
}

export interface SpecialtyEmployerMatch {
  specialty_id: number;
  employer_id: number;
  fit_score: number;
  directness: MatchDirectness;
  platform_tags: string[];
  requires_ap: boolean;
  values_ap: boolean;
  requires_clearance: boolean;
  values_clearance: boolean;
  requires_faa: boolean;
  requires_fcc: boolean;
  snapshot_date: string;
  rationale: string;
  source_kind: string;
  source_url: string;
  source_retrieved_on: string;
}

export interface RoleMatchView extends SpecialtyRoleMatch {
  role: CivilianTransitionRole;
}

export interface EmployerMatchView extends SpecialtyEmployerMatch {
  employer: TransitionEmployer;
  mapped_location_count: number | null;
}

export interface SpecialtyMatchView {
  specialty: MilitarySpecialty;
  roles: RoleMatchView[];
  employers: EmployerMatchView[];
}

export interface CareerTransitionCatalog {
  specialties: MilitarySpecialty[];
  roles: CivilianTransitionRole[];
  employers: TransitionEmployer[];
  matches: SpecialtyMatchView[];
  source: "database" | "csv_fallback";
}

type CsvRow = Record<string, string | undefined>;

const DATA_DIR = path.join(process.cwd(), "data", "career-transition");

function clean(value: string | null | undefined): string | null {
  if (value == null) return null;
  const trimmed = String(value).trim();
  return trimmed === "" || trimmed.toUpperCase() === "NA" ? null : trimmed;
}

function required(row: CsvRow, name: string): string {
  const value = clean(row[name]);
  if (!value) throw new Error(`Missing required ${name}: ${JSON.stringify(row)}`);
  return value;
}

function parseBool(value: string | null | undefined): boolean {
  const cleaned = clean(value);
  return cleaned ? ["1", "true", "t", "yes", "y"].includes(cleaned.toLowerCase()) : false;
}

function parseIntField(row: CsvRow, name: string): number {
  const raw = required(row, name);
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isInteger(parsed)) throw new Error(`Invalid integer ${name}: ${raw}`);
  return parsed;
}

function parseBranch(value: string): MilitaryBranch {
  const normalized = value.trim().toLowerCase().replace(/[-\s]+/g, "_");
  const branch = BRANCH_ALIASES[normalized] ?? BRANCH_ALIASES[value.trim().toLowerCase()];
  if (!branch) throw new Error(`Unsupported military branch: ${value}`);
  return branch;
}

function parsePopulation(value: string): MilitaryPopulation {
  const normalized = value.trim().toLowerCase();
  if (normalized === "enlisted" || normalized === "warrant" || normalized === "officer") {
    return normalized;
  }
  throw new Error(`Unsupported population: ${value}`);
}

function parseStatus(value: string): SpecialtyStatus {
  const normalized = value.trim().toLowerCase();
  if (normalized === "current" || normalized === "legacy" || normalized === "unknown") {
    return normalized;
  }
  throw new Error(`Unsupported specialty status: ${value}`);
}

function parseDirectness(value: string): MatchDirectness {
  const normalized = value.trim().toLowerCase();
  if (normalized === "direct" || normalized === "adjacent" || normalized === "requires_gap") {
    return normalized;
  }
  throw new Error(`Unsupported directness: ${value}`);
}

function parseEmployerType(value: string): TransitionEmployerType {
  const normalized = value.trim().toLowerCase();
  if (
    normalized === "oem" ||
    normalized === "defense_contractor" ||
    normalized === "mro" ||
    normalized === "civilian_operator"
  ) {
    return normalized;
  }
  throw new Error(`Unsupported employer type: ${value}`);
}

function parseTags(value: string | null | undefined): string[] {
  const cleaned = clean(value);
  if (!cleaned) return [];
  return cleaned
    .split(/[|;]/)
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function normalizeSpecialtyKey(branch: MilitaryBranch, code: string) {
  return `${branch}:${code.trim().toUpperCase().replace(/\s+/g, "")}`;
}

export function searchSpecialties(
  specialties: MilitarySpecialty[],
  branch: MilitaryBranch,
  query: string
) {
  const needle = query.trim().toLowerCase();
  return specialties
    .filter((specialty) => specialty.branch === branch)
    .filter((specialty) => {
      if (!needle) return true;
      return (
        specialty.code.toLowerCase().includes(needle) ||
        specialty.title.toLowerCase().includes(needle)
      );
    })
    .sort((a, b) => a.code.localeCompare(b.code) || a.title.localeCompare(b.title));
}

export function sortRoleMatches<T extends { fit_score: number; directness: MatchDirectness }>(
  matches: T[]
) {
  const directnessRank: Record<MatchDirectness, number> = {
    direct: 0,
    adjacent: 1,
    requires_gap: 2,
  };
  return [...matches].sort(
    (a, b) =>
      b.fit_score - a.fit_score ||
      directnessRank[a.directness] - directnessRank[b.directness]
  );
}

export function validateSourceFields(row: CsvRow, label: string) {
  for (const field of ["SourceKind", "SourceUrl", "SourceRetrievedOn"]) {
    if (!clean(row[field])) throw new Error(`${label} missing ${field}`);
  }
}

function asRows<T>(value: unknown): T[] {
  return value as T[];
}

function dateString(value: unknown): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value);
}

function normalizeDbSpecialty(row: MilitarySpecialty): MilitarySpecialty {
  return {
    id: Number(row.id),
    branch: row.branch,
    code_system: row.code_system,
    code: row.code,
    title: row.title,
    population: row.population,
    status: row.status,
    source_kind: row.source_kind,
    source_url: row.source_url,
    source_retrieved_on: dateString(row.source_retrieved_on),
  };
}

function normalizeDbRole(row: CivilianTransitionRole): CivilianTransitionRole {
  return {
    id: Number(row.id),
    slug: row.slug,
    title: row.title,
    role_family: row.role_family,
    onet_soc_code: row.onet_soc_code,
    summary: row.summary,
    credential_notes: row.credential_notes,
    source_kind: row.source_kind,
    source_url: row.source_url,
    source_retrieved_on: dateString(row.source_retrieved_on),
  };
}

function normalizeDbEmployer(row: TransitionEmployer): TransitionEmployer {
  return {
    id: Number(row.id),
    slug: row.slug,
    display_name: row.display_name,
    parent_company: row.parent_company,
    employer_type: row.employer_type,
    defense_employer_slug: row.defense_employer_slug,
    website_url: row.website_url,
    notes: row.notes,
    source_kind: row.source_kind,
    source_url: row.source_url,
    source_retrieved_on: dateString(row.source_retrieved_on),
  };
}

function normalizeDbRoleMatch(row: RoleMatchView): RoleMatchView {
  return {
    specialty_id: Number(row.specialty_id),
    role_id: Number(row.role_id),
    fit_score: Number(row.fit_score),
    directness: row.directness,
    rationale: row.rationale,
    source_kind: row.source_kind,
    source_url: row.source_url,
    source_retrieved_on: dateString(row.source_retrieved_on),
    role: normalizeDbRole(row.role),
  };
}

function normalizeDbEmployerMatch(row: EmployerMatchView): EmployerMatchView {
  return {
    specialty_id: Number(row.specialty_id),
    employer_id: Number(row.employer_id),
    fit_score: Number(row.fit_score),
    directness: row.directness,
    platform_tags: row.platform_tags ?? [],
    requires_ap: row.requires_ap,
    values_ap: row.values_ap,
    requires_clearance: row.requires_clearance,
    values_clearance: row.values_clearance,
    requires_faa: row.requires_faa,
    requires_fcc: row.requires_fcc,
    snapshot_date: dateString(row.snapshot_date),
    rationale: row.rationale,
    source_kind: row.source_kind,
    source_url: row.source_url,
    source_retrieved_on: dateString(row.source_retrieved_on),
    employer: normalizeDbEmployer(row.employer),
    mapped_location_count:
      row.mapped_location_count == null ? null : Number(row.mapped_location_count),
  };
}

function csvRows(file: string): CsvRow[] {
  return parse(readFileSync(path.join(DATA_DIR, file), "utf-8"), {
    columns: true,
    skip_empty_lines: true,
    bom: true,
  });
}

export function loadCareerTransitionCsvCatalog(): CareerTransitionCatalog {
  const specialties = csvRows("specialties.csv").map((row, index) => {
    validateSourceFields(row, `specialty ${required(row, "Code")}`);
    return {
      id: index + 1,
      branch: parseBranch(required(row, "Branch")),
      code_system: required(row, "CodeSystem"),
      code: required(row, "Code").toUpperCase(),
      title: required(row, "Title"),
      population: parsePopulation(required(row, "Population")),
      status: parseStatus(required(row, "Status")),
      source_kind: required(row, "SourceKind"),
      source_url: required(row, "SourceUrl"),
      source_retrieved_on: required(row, "SourceRetrievedOn"),
    } satisfies MilitarySpecialty;
  });

  const roles = csvRows("roles.csv").map((row, index) => {
    validateSourceFields(row, `role ${required(row, "RoleSlug")}`);
    return {
      id: index + 1,
      slug: required(row, "RoleSlug"),
      title: required(row, "RoleTitle"),
      role_family: required(row, "RoleFamily"),
      onet_soc_code: clean(row.OnetSocCode),
      summary: required(row, "Summary"),
      credential_notes: clean(row.CredentialNotes),
      source_kind: required(row, "SourceKind"),
      source_url: required(row, "SourceUrl"),
      source_retrieved_on: required(row, "SourceRetrievedOn"),
    } satisfies CivilianTransitionRole;
  });

  const employers = csvRows("employers.csv").map((row, index) => {
    validateSourceFields(row, `employer ${required(row, "EmployerSlug")}`);
    return {
      id: index + 1,
      slug: required(row, "EmployerSlug"),
      display_name: required(row, "DisplayName"),
      parent_company: clean(row.ParentCompany),
      employer_type: parseEmployerType(required(row, "EmployerType")),
      defense_employer_slug: clean(row.ExistingDefenseEmployerSlug),
      website_url: clean(row.WebsiteUrl),
      notes: clean(row.Notes),
      source_kind: required(row, "SourceKind"),
      source_url: required(row, "SourceUrl"),
      source_retrieved_on: required(row, "SourceRetrievedOn"),
    } satisfies TransitionEmployer;
  });

  const specialtyByKey = new Map(
    specialties.map((specialty) => [normalizeSpecialtyKey(specialty.branch, specialty.code), specialty])
  );
  const roleBySlug = new Map(roles.map((role) => [role.slug, role]));
  const employerBySlug = new Map(employers.map((employer) => [employer.slug, employer]));

  const roleMatches: RoleMatchView[] = csvRows("specialty-role-matches.csv").map((row) => {
    validateSourceFields(row, `role match ${required(row, "Branch")} ${required(row, "Code")}`);
    const branch = parseBranch(required(row, "Branch"));
    const specialty = specialtyByKey.get(normalizeSpecialtyKey(branch, required(row, "Code")));
    const role = roleBySlug.get(required(row, "RoleSlug"));
    if (!specialty) throw new Error(`Unknown specialty in role match: ${JSON.stringify(row)}`);
    if (!role) throw new Error(`Unknown role in role match: ${JSON.stringify(row)}`);
    return {
      specialty_id: specialty.id,
      role_id: role.id,
      fit_score: parseIntField(row, "FitScore"),
      directness: parseDirectness(required(row, "Directness")),
      rationale: required(row, "Rationale"),
      source_kind: required(row, "SourceKind"),
      source_url: required(row, "SourceUrl"),
      source_retrieved_on: required(row, "SourceRetrievedOn"),
      role,
    };
  });

  const employerMatches: EmployerMatchView[] = csvRows("specialty-employer-matches.csv").map((row) => {
    validateSourceFields(row, `employer match ${required(row, "Branch")} ${required(row, "Code")}`);
    const branch = parseBranch(required(row, "Branch"));
    const specialty = specialtyByKey.get(normalizeSpecialtyKey(branch, required(row, "Code")));
    const employer = employerBySlug.get(required(row, "EmployerSlug"));
    if (!specialty) throw new Error(`Unknown specialty in employer match: ${JSON.stringify(row)}`);
    if (!employer) throw new Error(`Unknown employer in employer match: ${JSON.stringify(row)}`);
    return {
      specialty_id: specialty.id,
      employer_id: employer.id,
      fit_score: parseIntField(row, "FitScore"),
      directness: parseDirectness(required(row, "Directness")),
      platform_tags: parseTags(row.PlatformTags),
      requires_ap: parseBool(row.RequiresAP),
      values_ap: parseBool(row.ValuesAP),
      requires_clearance: parseBool(row.RequiresClearance),
      values_clearance: parseBool(row.ValuesClearance),
      requires_faa: parseBool(row.RequiresFAA),
      requires_fcc: parseBool(row.RequiresFCC),
      snapshot_date: required(row, "SnapshotDate"),
      rationale: required(row, "Rationale"),
      source_kind: required(row, "SourceKind"),
      source_url: required(row, "SourceUrl"),
      source_retrieved_on: required(row, "SourceRetrievedOn"),
      employer,
      mapped_location_count: null,
    };
  });

  return buildCatalog(specialties, roles, employers, roleMatches, employerMatches, "csv_fallback");
}

function buildCatalog(
  specialties: MilitarySpecialty[],
  roles: CivilianTransitionRole[],
  employers: TransitionEmployer[],
  roleMatches: RoleMatchView[],
  employerMatches: EmployerMatchView[],
  source: CareerTransitionCatalog["source"]
): CareerTransitionCatalog {
  const matches = specialties.map((specialty) => ({
    specialty,
    roles: sortRoleMatches(roleMatches.filter((match) => match.specialty_id === specialty.id)),
    employers: sortRoleMatches(
      employerMatches.filter((match) => match.specialty_id === specialty.id)
    ),
  }));

  return {
    specialties: specialties.sort(
      (a, b) => a.branch.localeCompare(b.branch) || a.code.localeCompare(b.code)
    ),
    roles,
    employers,
    matches,
    source,
  };
}

export async function getCareerTransitionCatalog(): Promise<CareerTransitionCatalog> {
  try {
    const sql = getSql();
    const [
      specialtyRows,
      roleRows,
      employerRows,
      roleMatchRows,
      employerMatchRows,
    ] = await Promise.all([
      sql.query(`SELECT * FROM military_specialties ORDER BY branch, code`),
      sql.query(`SELECT * FROM civilian_transition_roles ORDER BY role_family, title`),
      sql.query(`SELECT * FROM transition_employers ORDER BY employer_type, display_name`),
      sql.query(
        `SELECT m.*, row_to_json(r.*) AS role
         FROM specialty_role_matches m
         JOIN civilian_transition_roles r ON r.id = m.role_id`
      ),
      sql.query(
        `SELECT
           m.*,
           row_to_json(e.*) AS employer,
           CASE
             WHEN e.defense_employer_slug IS NULL THEN NULL
             ELSE (
               SELECT count(DISTINCT d.location_id)::int
               FROM defense_employer_locations d
               JOIN defense_employers de ON de.id = d.employer_id
               WHERE de.slug = e.defense_employer_slug
                 AND d.location_id IS NOT NULL
                 AND COALESCE(d.total_posting_count, 0) > 0
             )
           END AS mapped_location_count
         FROM specialty_employer_matches m
         JOIN transition_employers e ON e.id = m.employer_id`
      ),
    ]);

    const specialties = asRows<MilitarySpecialty>(specialtyRows).map(normalizeDbSpecialty);
    const roles = asRows<CivilianTransitionRole>(roleRows).map(normalizeDbRole);
    const employers = asRows<TransitionEmployer>(employerRows).map(normalizeDbEmployer);
    const roleMatches = asRows<RoleMatchView>(roleMatchRows).map(normalizeDbRoleMatch);
    const employerMatches = asRows<EmployerMatchView>(employerMatchRows).map(
      normalizeDbEmployerMatch
    );

    if (specialties.length === 0) return loadCareerTransitionCsvCatalog();
    return buildCatalog(specialties, roles, employers, roleMatches, employerMatches, "database");
  } catch (error) {
    const code = (error as { code?: string }).code;
    if (code === "42P01" || code === "42703" || code === "3D000") {
      return loadCareerTransitionCsvCatalog();
    }
    if ((error as Error).message.includes("DATABASE_URL")) {
      return loadCareerTransitionCsvCatalog();
    }
    throw error;
  }
}
