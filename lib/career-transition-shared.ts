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
  | "civilian_operator"
  | "commercial_cyber";

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
