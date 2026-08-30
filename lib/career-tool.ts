/*
 * Phase 4 chat-tool composition (issue #228 / CAREER_CHAT_TOOL_PLAN.md).
 *
 * One function the chat tool's `execute` calls. It runs the whole deterministic
 * pipeline server-side — resolveSpecialty → catalog skills/roles/employers →
 * listingsForSpecialty — and returns a single structured result. This is the
 * integrity crux: the model gets ONE "explore this occupation" verb and can only
 * narrate the result (or relay the ambiguity question). It never keyword-searches
 * listings or picks a specialty itself, which is how a ship electrician would
 * otherwise be handed avionics jobs.
 *
 * Server-only: imports the DB/fs-backed catalog + the listings bridge. Call it
 * from the chat route / server components, never a client bundle.
 */
import {
  getCareerTransitionCatalog,
  normalizeSpecialtyKey,
  resolveSpecialty,
  type CareerTransitionCatalog,
  type EmployerMatchView,
  type MilitaryBranch,
  type RoleMatchView,
  type SkillMatchView,
} from "./career-transition";
import { listingsForSpecialty, type SpecialtyListings } from "./career-listings-bridge";

export interface CareerSpecialtyView {
  branch: MilitaryBranch;
  code: string;
  title: string;
  status: string;
  source_url: string;
  source_retrieved_on: string;
}

export interface CareerSkillView {
  title: string;
  kind: string;
  directness: string;
  fit_score: number;
  rationale: string;
  source_retrieved_on: string;
}

export interface CareerRoleView {
  title: string;
  role_family: string;
  onet_soc_code: string | null;
  directness: string;
  fit_score: number;
  summary: string;
  credential_notes: string | null;
}

export interface CareerEmployerView {
  display_name: string;
  employer_type: string;
  parent_company: string | null;
  directness: string;
  fit_score: number;
  rationale: string;
  website_url: string | null;
  mapped_location_count: number | null;
  snapshot_date: string;
}

export interface CareerCandidateView {
  branch: MilitaryBranch;
  code: string;
  title: string;
  disambiguator: string;
}

export type CareerToolResult =
  | {
      status: "resolved";
      specialty: CareerSpecialtyView;
      skills: CareerSkillView[];
      roles: CareerRoleView[];
      employers: CareerEmployerView[];
      listings: SpecialtyListings;
    }
  | {
      status: "ambiguous";
      branch: MilitaryBranch | null;
      term: string;
      candidates: CareerCandidateView[];
      clarification: string;
    }
  | {
      status: "uncovered";
      branch: MilitaryBranch | null;
      query: string;
      explanation: string;
    };

export interface ExploreOptions {
  branch?: MilitaryBranch;
  /** An explicit rating/MOS/AFSC code if the user gave one (e.g. "EM", "15T"). */
  code?: string;
  /** An NEC / sub-specialty code if the user gave one (reserved for finer disambiguation). */
  nec?: string;
}

/** Injectable so the composition can be unit-tested without a database. */
export interface ExploreDeps {
  loadCatalog?: () => Promise<CareerTransitionCatalog>;
  listListings?: typeof listingsForSpecialty;
}

function pickSkill(m: SkillMatchView): CareerSkillView {
  return {
    title: m.skill.title,
    kind: m.skill.skill_kind,
    directness: m.directness,
    fit_score: m.fit_score,
    rationale: m.rationale,
    source_retrieved_on: m.source_retrieved_on,
  };
}

function pickRole(m: RoleMatchView): CareerRoleView {
  return {
    title: m.role.title,
    role_family: m.role.role_family,
    onet_soc_code: m.role.onet_soc_code,
    directness: m.directness,
    fit_score: m.fit_score,
    summary: m.role.summary,
    credential_notes: m.role.credential_notes,
  };
}

function pickEmployer(m: EmployerMatchView): CareerEmployerView {
  return {
    display_name: m.employer.display_name,
    employer_type: m.employer.employer_type,
    parent_company: m.employer.parent_company,
    directness: m.directness,
    fit_score: m.fit_score,
    rationale: m.rationale,
    website_url: m.employer.website_url,
    mapped_location_count: m.mapped_location_count,
    snapshot_date: m.snapshot_date,
  };
}

/**
 * Resolve a free-text military occupation to civilian skills, roles, employers,
 * and real job listings — or an honest ask / decline. `opts.code` (an explicit
 * rating/MOS) takes precedence over the free-text query for resolution.
 */
export async function exploreSpecialtyTransition(
  query: string,
  opts: ExploreOptions = {},
  deps: ExploreDeps = {}
): Promise<CareerToolResult> {
  const loadCatalog = deps.loadCatalog ?? getCareerTransitionCatalog;
  const listListings = deps.listListings ?? listingsForSpecialty;

  const catalog = await loadCatalog();
  const resolution = resolveSpecialty(catalog, opts.code ?? query, opts.branch);

  if (resolution.status === "ambiguous") {
    return {
      status: "ambiguous",
      branch: resolution.branch,
      term: resolution.term,
      candidates: resolution.candidates.map((c) => ({
        branch: c.branch,
        code: c.code,
        title: c.title,
        disambiguator: c.disambiguator,
      })),
      clarification: resolution.clarification,
    };
  }

  if (resolution.status === "uncovered") {
    return {
      status: "uncovered",
      branch: resolution.branch,
      query: resolution.query,
      explanation: resolution.explanation,
    };
  }

  const specialty = resolution.specialty;
  const match = catalog.matches.find(
    (m) =>
      normalizeSpecialtyKey(m.specialty.branch, m.specialty.code) ===
      normalizeSpecialtyKey(specialty.branch, specialty.code)
  );

  if (!match) {
    // Resolved to a real specialty that carries no curated matches yet — honest
    // "not covered", never a borrowed neighbor.
    return {
      status: "uncovered",
      branch: specialty.branch,
      query,
      explanation: `${specialty.title} (${specialty.code}) is recognized but has no civilian roles mapped yet.`,
    };
  }

  const listings = await listListings(match);

  return {
    status: "resolved",
    specialty: {
      branch: specialty.branch,
      code: specialty.code,
      title: specialty.title,
      status: specialty.status,
      source_url: specialty.source_url,
      source_retrieved_on: specialty.source_retrieved_on,
    },
    skills: match.skills.map(pickSkill),
    roles: match.roles.map(pickRole),
    employers: match.employers.map(pickEmployer),
    listings,
  };
}
