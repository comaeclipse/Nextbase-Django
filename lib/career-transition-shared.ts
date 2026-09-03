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
export type SkillBridgeStatus = "active" | "inactive" | "unknown";
export type SkillBridgeParticipationType =
  | "direct_employer"
  | "convertible_requisition"
  | "hiring_our_heroes"
  | "training_to_employment"
  | "third_party_fellowship"
  | "government_agency";

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
  | "commercial_cyber"
  | "government_agency";

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
  skillbridge_status: SkillBridgeStatus;
  skillbridge_participation_type: SkillBridgeParticipationType | null;
  skillbridge_pathways: string[];
  skillbridge_remote_available: boolean | null;
  skillbridge_nationwide: boolean | null;
  skillbridge_target_domains: string[];
  skillbridge_duration_days_min: number | null;
  skillbridge_duration_days_max: number | null;
  skillbridge_mou_expiration: string | null;
  skillbridge_source_url: string | null;
  skillbridge_verified_at: string | null;
  skillbridge_notes: string | null;
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

export interface SpecialtyListingEvidence {
  specialty_id: number;
  employer_id: number;
  listing_title: string;
  company_name: string;
  location: string;
  url: string;
  fit_score: number;
  directness: MatchDirectness;
  platform_tags: string[];
  requires_clearance: boolean;
  clearance_note: string | null;
  snapshot_date: string;
  evidence_note: string;
  source_kind: string;
  source_url: string;
  source_retrieved_on: string;
}

export type SkillKind = "technical" | "domain" | "credential" | "clearance" | "safety";

export interface TransitionSkill {
  id: number;
  slug: string;
  title: string;
  skill_kind: SkillKind;
  summary: string;
  listing_keywords: string[];
  source_kind: string;
  source_url: string;
  source_retrieved_on: string;
}

export interface SpecialtySkillMatch {
  specialty_id: number;
  skill_id: number;
  fit_score: number;
  directness: MatchDirectness;
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

export interface SkillMatchView extends SpecialtySkillMatch {
  skill: TransitionSkill;
}

export interface ListingEvidenceView extends SpecialtyListingEvidence {
  employer: TransitionEmployer;
}

export interface SpecialtyMatchView {
  specialty: MilitarySpecialty;
  roles: RoleMatchView[];
  employers: EmployerMatchView[];
  skills: SkillMatchView[];
  listingEvidence: ListingEvidenceView[];
}

export interface CareerTransitionCatalog {
  specialties: MilitarySpecialty[];
  roles: CivilianTransitionRole[];
  employers: TransitionEmployer[];
  skills: TransitionSkill[];
  listingEvidence: ListingEvidenceView[];
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

export function skillBridgeScoreBonus(
  employer: Pick<TransitionEmployer, "skillbridge_status" | "skillbridge_participation_type">
): number {
  if (employer.skillbridge_status !== "active") return 0;
  switch (employer.skillbridge_participation_type) {
    case "direct_employer":
      return 6;
    case "convertible_requisition":
      return 5;
    case "training_to_employment":
      return 4;
    case "hiring_our_heroes":
    case "third_party_fellowship":
      return 3;
    case "government_agency":
      return 2;
    default:
      return 1;
  }
}

export function effectiveEmployerFitScore(match: EmployerMatchView): number {
  return Math.min(100, match.fit_score + skillBridgeScoreBonus(match.employer));
}

export interface ProfilePickerMatch {
  roleTitles: string[];
  skillTitles: string[];
}

export interface ProfilePickerCatalog {
  specialties: MilitarySpecialty[];
  /** Keyed by `${branch}:${code}`, same composite key CareerTransitionClient uses. */
  matches: Record<string, ProfilePickerMatch>;
  source: CareerTransitionCatalog["source"];
}

/**
 * Trims the full catalog down to what /profile's picker needs: specialties
 * (for the branch+search combobox) plus just role/skill TITLES per specialty
 * (for the resolved-selection chips). Drops employers, listing evidence, and
 * full role/skill objects — /profile only teases the match, it doesn't render
 * employer or credential detail (that stays on /career-transition, which
 * keeps the full catalog). Matches arrive pre-sorted by buildCatalog, so
 * slicing keeps the top-ranked entries.
 */
export function toProfilePickerCatalog(
  catalog: CareerTransitionCatalog
): ProfilePickerCatalog {
  const matches: Record<string, ProfilePickerMatch> = {};
  for (const m of catalog.matches) {
    const key = `${m.specialty.branch}:${m.specialty.code}`;
    matches[key] = {
      roleTitles: m.roles.slice(0, 4).map((r) => r.role.title),
      skillTitles: m.skills.slice(0, 6).map((s) => s.skill.title),
    };
  }
  return { specialties: catalog.specialties, matches, source: catalog.source };
}
