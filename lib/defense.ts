/*
 * Defense-employer domain logic, shared by the data scripts and the app.
 *
 * `locations_location.defense_hub` is a *derived* column combining two independent
 * signals:
 *
 *   1. `defense_hub_manual` — the hand-curated value. This carries military
 *      installations (Norfolk, Fayetteville, Bremerton) that have no contractor
 *      plant and would otherwise be invisible to employer data.
 *   2. Contractor presence — an employer with `counts_as_defense` and at least
 *      DEFENSE_HUB_MIN_POSTINGS non-remote openings in the city.
 *
 *     defense_hub = employer_signal ? true : defense_hub_manual
 *
 * One-directional on purpose: employer data can promote a city to a hub, but can
 * never demote a curated `true`. A NULL (never researched) stays NULL unless an
 * employer resolves it — "unknown" is not the same claim as "not a defense hub".
 * See scripts/recompute-defense-hub.ts.
 */

/*
 * Minimum onsite+hybrid openings before an employer counts as a hub signal.
 *
 * Calibrated against the 77 curated locations: at 1, six cities with a single
 * stray posting (Decorah IA, Houston TX) would flip; at 25, RTX agrees with the
 * existing curation on every row. Remote postings are excluded entirely — they
 * are tagged to a city where the employer has no facility.
 */
export const DEFENSE_HUB_MIN_POSTINGS = 25;

export type EmployerSector = "defense" | "defense_aerospace" | "corporate";

export interface EmployerSeed {
  slug: string;
  display_name: string;
  parent_company: string;
  sector: EmployerSector;
  counts_as_defense: boolean;
  ats_kind: string | null;
  ats_config: Record<string, unknown> | null;
  /** Legacy "Company|BusinessUnit" pairs from hand-sourced CSVs. */
  legacy_aliases: string[];
}

const PHENOM_RTX = { site: "careers.rtx.com", refNum: "RAYTGLOBAL", pageId: "page19-ds" };

/*
 * `businessUnit` values are the exact facet keys returned by the RTX careers
 * API; they are the filter values, so they must match byte-for-byte.
 */
export const DEFENSE_EMPLOYER_SEEDS: EmployerSeed[] = [
  {
    slug: "raytheon",
    display_name: "Raytheon",
    parent_company: "RTX",
    sector: "defense",
    counts_as_defense: true,
    ats_kind: "phenom",
    ats_config: { ...PHENOM_RTX, businessUnit: "Raytheon" },
    legacy_aliases: ["RTX|Raytheon"],
  },
  {
    slug: "collins-aerospace",
    display_name: "Collins Aerospace",
    parent_company: "RTX",
    sector: "defense_aerospace",
    counts_as_defense: true,
    ats_kind: "phenom",
    ats_config: { ...PHENOM_RTX, businessUnit: "Collins Aerospace" },
    legacy_aliases: ["RTX|Collins Aerospace"],
  },
  {
    slug: "pratt-whitney",
    display_name: "Pratt & Whitney",
    parent_company: "RTX",
    sector: "defense_aerospace",
    counts_as_defense: true,
    ats_kind: "phenom",
    ats_config: { ...PHENOM_RTX, businessUnit: "Pratt & Whitney" },
    legacy_aliases: ["RTX|Pratt & Whitney", "RTX|Pratt and Whitney"],
  },
  {
    // Finance/legal/HR roles at Farmington and Cambridge. Real RTX jobs, but not
    // a defense-industry signal for a retiree, so excluded from the hub union.
    slug: "rtx-corporate",
    display_name: "RTX Corporate",
    parent_company: "RTX",
    sector: "corporate",
    counts_as_defense: false,
    ats_kind: "phenom",
    ats_config: { ...PHENOM_RTX, businessUnit: "Corporate Headquarters" },
    legacy_aliases: ["RTX|Corporate Headquarters"],
  },

  // Seeded with zero locations. Each uses a different ATS; importers land later.
  {
    slug: "lockheed-martin",
    display_name: "Lockheed Martin",
    parent_company: "Lockheed Martin",
    sector: "defense",
    counts_as_defense: true,
    ats_kind: null,
    ats_config: null,
    legacy_aliases: [],
  },
  {
    slug: "general-dynamics",
    display_name: "General Dynamics",
    parent_company: "General Dynamics",
    sector: "defense",
    counts_as_defense: true,
    ats_kind: null,
    ats_config: null,
    legacy_aliases: [],
  },
  {
    slug: "northrop-grumman",
    display_name: "Northrop Grumman",
    parent_company: "Northrop Grumman",
    sector: "defense",
    counts_as_defense: true,
    ats_kind: null,
    ats_config: null,
    legacy_aliases: [],
  },
  {
    slug: "l3harris",
    display_name: "L3Harris",
    parent_company: "L3Harris",
    sector: "defense",
    counts_as_defense: true,
    ats_kind: null,
    ats_config: null,
    legacy_aliases: [],
  },
  {
    slug: "boeing",
    display_name: "Boeing",
    parent_company: "Boeing",
    sector: "defense_aerospace",
    counts_as_defense: true,
    ats_kind: null,
    ats_config: null,
    legacy_aliases: [],
  },
];

/** "RTX|Raytheon" -> "raytheon", for CSVs written before employer slugs existed. */
export const LEGACY_EMPLOYER_ALIASES: Record<string, string> = Object.fromEntries(
  DEFENSE_EMPLOYER_SEEDS.flatMap((e) => e.legacy_aliases.map((a) => [a, e.slug]))
);

/** One employer's footprint in one city. Serialized to the client for filtering. */
export interface EmployerPresence {
  slug: string;
  display_name: string;
  parent_company: string;
  counts_as_defense: boolean;
  onsite: number;
  hybrid: number;
  remote: number;
  total: number;
}

/**
 * location_id -> employers present. A plain object (not a Map) so it survives
 * the server -> client component boundary.
 */
export type EmployerIndex = Record<number, EmployerPresence[]>;

/** Does any employer in this city clear the bar for a defense-hub promotion? */
export function hasDefenseEmployerSignal(
  presences: readonly EmployerPresence[] | undefined
): boolean {
  if (!presences) return false;
  return presences.some(
    (p) => p.counts_as_defense && p.onsite + p.hybrid >= DEFENSE_HUB_MIN_POSTINGS
  );
}

/** The employer filter facet: any presence at all, regardless of the hub threshold. */
export function matchesEmployers(
  presences: readonly EmployerPresence[] | undefined,
  slugs: readonly string[]
): boolean {
  if (slugs.length === 0) return true;
  if (!presences) return false;
  return presences.some((p) => p.total > 0 && slugs.includes(p.slug));
}
