/*
 * Deterministic specialty → defense_job_listings bridge (issue #224).
 *
 * The chat model must NOT keyword-search listings itself — that is how a ship
 * electrician gets recommended avionics jobs. This module owns the join: given a
 * resolved specialty (a SpecialtyMatchView from the catalog), it returns real
 * listings from the same query the /defense-jobs page uses, plus employer career
 * URLs as an honest fallback. The caller (career page, or the Phase 4 chat tool)
 * only narrates the result.
 *
 * Join keys, in order:
 *   1. mapped `defense_employer_slug` on the specialty's employer matches →
 *      DefenseJobFilter.employers (COALESCE(employer_slug, company) keys).
 *   2. skill listing_keywords (falling back to role titles) → an OR over the
 *      single-substring `q`, run one term at a time and merged (today's
 *      getDefenseJobListingsPage takes one substring, per the issue).
 *
 * Honesty: if no employer is mapped, or mapped employers have no matching
 * listing, return `listings: []` with the employer career URLs and a clear
 * status. Never invent a posting.
 *
 * Server-only: imports the DB-backed listings query and the fs/db-backed catalog
 * types. Call it from server components / the chat route, never a client bundle.
 */
import {
  getDefenseJobListingsPage,
  toClientListing,
  type ClientJobListing,
  type DefenseJobFilter,
  type DefenseJobListingsPage,
} from "./defense-jobs";
import type { SpecialtyMatchView } from "./career-transition";
import { resolveStateAbbr } from "./states";

export type ListingBridgeStatus = "listings" | "no_hits" | "unmapped";

export interface BridgeEmployerLink {
  slug: string;
  display_name: string;
  website_url: string | null;
  /** The defense_employers slug this employer maps to, or null when unmapped. */
  defense_employer_slug: string | null;
}

export interface SpecialtyListings {
  status: ListingBridgeStatus;
  /** Distinct defense_employers slugs this specialty's employers map to. */
  mappedEmployerSlugs: string[];
  /** The keyword set the listings were matched on (for transparency). */
  keywords: string[];
  /** Real listings from mapped employers matching a keyword; may be empty. */
  listings: ClientJobListing[];
  /** Every employer match's career URL — the fallback when listings are empty. */
  employerLinks: BridgeEmployerLink[];
  city: string | null;
  state: string | null;
  note: string;
}

/** Injectable listings query, so tests can run without a database. */
export type ListPageFn = (
  filter: DefenseJobFilter,
  page: number,
  pageSize: number
) => Promise<DefenseJobListingsPage>;

const MAX_KEYWORDS = 12;
const MAX_LISTINGS = 25;

export interface SpecialtyListingOptions {
  city?: string | null;
  state?: string | null;
}

/**
 * The terms to OR-search listings with: skill listing_keywords first (the
 * purpose-built field), role titles as a fallback so a specialty with no skills
 * still has something to match on. Deduped, lower-cased, capped.
 */
export function keywordsForSpecialty(match: SpecialtyMatchView): string[] {
  const fromSkills = match.skills.flatMap((s) => s.skill.listing_keywords);
  const fromRoles = match.roles.map((r) => r.role.title);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of [...fromSkills, ...fromRoles]) {
    const term = raw.trim().toLowerCase();
    if (term && !seen.has(term)) {
      seen.add(term);
      out.push(term);
      if (out.length >= MAX_KEYWORDS) break;
    }
  }
  return out;
}

export function employerLinksForSpecialty(match: SpecialtyMatchView): BridgeEmployerLink[] {
  return match.employers.map((e) => ({
    slug: e.employer.slug,
    display_name: e.employer.display_name,
    website_url: e.employer.website_url,
    defense_employer_slug: e.employer.defense_employer_slug,
  }));
}

/**
 * Resolve a specialty to real listings + employer career links.
 * `listPage` defaults to the live DB query; pass a stub in tests.
 */
export async function listingsForSpecialty(
  match: SpecialtyMatchView,
  listPage: ListPageFn = getDefenseJobListingsPage,
  options: SpecialtyListingOptions = {}
): Promise<SpecialtyListings> {
  const employerLinks = employerLinksForSpecialty(match);
  const mappedEmployerSlugs = [
    ...new Set(
      match.employers
        .map((e) => e.employer.defense_employer_slug)
        .filter((slug): slug is string => Boolean(slug))
    ),
  ];
  const keywords = keywordsForSpecialty(match);
  const city = options.city?.trim() || null;
  const state = options.state ? resolveStateAbbr(options.state) : null;
  const cityFilter = city && state ? `${city}|${state}` : null;

  if (mappedEmployerSlugs.length === 0) {
    return {
      status: "unmapped",
      mappedEmployerSlugs,
      keywords,
      listings: [],
      employerLinks,
      city,
      state,
      note:
        "No defense employer for this specialty is mapped to live listings yet — " +
        "showing employer career pages instead.",
    };
  }

  // OR the keyword set by running one single-substring query per term and
  // merging. Employer filter is AND-ed in every call, so results only ever come
  // from the mapped employers. No keywords → an employer-only query.
  const terms = keywords.length > 0 ? keywords : [""];
  const byId = new Map<number, ClientJobListing>();
  for (const term of terms) {
    const filter: DefenseJobFilter = { employers: mappedEmployerSlugs };
    if (term) filter.q = term;
    if (cityFilter) filter.city = cityFilter;
    const { listings } = await listPage(filter, 1, MAX_LISTINGS);
    for (const row of listings) {
      const listing = toClientListing(row);
      if (!byId.has(listing.id)) byId.set(listing.id, listing);
    }
    if (byId.size >= MAX_LISTINGS) break;
  }

  const listings = [...byId.values()].slice(0, MAX_LISTINGS);
  return {
    status: listings.length > 0 ? "listings" : "no_hits",
    mappedEmployerSlugs,
    keywords,
    listings,
    employerLinks,
    city,
    state,
    note:
      listings.length > 0
        ? cityFilter
          ? `Live listings in ${city}, ${state} from mapped defense employers matching this specialty.`
          : "Live listings from mapped defense employers matching this specialty."
        : cityFilter
          ? `Mapped employers have no current listings in ${city}, ${state} matching this specialty — ` +
            "showing employer career pages instead."
          : "Mapped employers have no current listings matching this specialty — " +
          "showing employer career pages instead.",
  };
}
