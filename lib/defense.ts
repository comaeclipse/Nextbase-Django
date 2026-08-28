/*
 * Defense-employer domain logic, shared by the data scripts and the app.
 *
 * `locations_location.defense_hub` is a *derived* column with three inputs, in
 * priority order:
 *
 *   1. `defense_hub_manual = false` — a hard human veto. Some cities host an RTX
 *      facility yet are not defense hubs for a retiree (a lone Collins depot in a
 *      small town: Jamestown ND, Burnsville MN). An explicit `false` always wins.
 *   2. Contractor presence — any `counts_as_defense`, active employer with at
 *      least DEFENSE_HUB_MIN_POSTINGS onsite+hybrid (non-remote) openings, i.e. a
 *      physical facility. We only ingest RTX, so a single RTX site is a *sample*
 *      of a wider, untracked defense cluster; presence therefore promotes to a hub.
 *   3. `defense_hub_manual` otherwise — carries hubs employer data can't see:
 *      military-installation towns (Norfolk, Fayetteville, Bremerton) with no
 *      contractor plant, or hubs whose RTX openings are momentarily zero (Boston).
 *
 *     defense_hub = manual === false ? false
 *                 : presence          ? true
 *                 : manual
 *
 * A NULL (never researched, no presence) stays NULL — "unknown" is not "not a
 * hub". See scripts/recompute-defense-hub.ts.
 */

/*
 * Minimum onsite+hybrid openings for an employer to count as a *physical presence*.
 *
 * One is enough: a single onsite/hybrid opening implies a real facility, and since
 * we only ingest RTX that facility is a sample of a wider (untracked) defense
 * cluster. Presence then promotes the city to a hub unless `defense_hub_manual`
 * vetoes it (see the module header). Remote postings are excluded entirely — they
 * are tagged to a city where the employer has no facility, so they never promote.
 */
export const DEFENSE_HUB_MIN_POSTINGS = 1;

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

  {
    // Intelligence/defense integrator. No public ATS feed we scrape; its site
    // footprint is hand-sourced (source_kind = official_location_page), and each
    // sourced row carries an attested onsite opening count, so presence promotes
    // exactly like an RTX facility does.
    slug: "system-high",
    display_name: "System High",
    parent_company: "System High",
    sector: "defense",
    counts_as_defense: true,
    ats_kind: null,
    ats_config: null,
    legacy_aliases: [],
  },

  {
    // Defense/IT integrator (Reston HQ). No public ATS feed we scrape; its
    // nationwide site footprint is hand-sourced (source_kind = user_attested),
    // and each row carries an attested onsite opening count, so presence promotes
    // exactly like an RTX facility does — mirrors System High.
    slug: "leidos",
    display_name: "Leidos",
    parent_company: "Leidos",
    sector: "defense",
    counts_as_defense: true,
    ats_kind: null,
    ats_config: null,
    legacy_aliases: [],
  },

  {
    // Defense-technology manufacturer. Its public Greenhouse board is used for
    // hand-sourced, dated facility snapshots until an ATS sync is added.
    slug: "anduril",
    display_name: "Anduril Industries",
    parent_company: "Anduril Industries",
    sector: "defense",
    counts_as_defense: true,
    ats_kind: "greenhouse",
    ats_config: { board: "andurilindustries" },
    legacy_aliases: [],
  },

  // Seeded with zero locations. Each uses a different ATS; importers land later.
  {
    slug: "lockheed-martin",
    display_name: "Lockheed Martin",
    parent_company: "Lockheed Martin",
    sector: "defense",
    counts_as_defense: true,
    // Listings ingested from LM's Eightfold careers API (domain
    // lockheedmartin.com), CONUS-only. Old careers backend was BrassRing.
    ats_kind: "eightfold",
    ats_config: { domain: "lockheedmartin.com" },
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

  // Defense-tech companies whose individual job *listings* are ingested via the
  // /defense-jobs CSV importer (scripts/import-defense-job-listings.ts), not the
  // aggregate defense_employer_locations path. Seeded so listings can link an
  // employer_slug and so they appear in the unified employer filter. Kratos has
  // no listings yet but is seeded because the user tracks it.
  {
    slug: "shield-ai",
    display_name: "Shield AI",
    parent_company: "Shield AI",
    sector: "defense",
    counts_as_defense: true,
    ats_kind: null,
    ats_config: null,
    legacy_aliases: [],
  },
  {
    slug: "palantir",
    display_name: "Palantir",
    parent_company: "Palantir Technologies",
    sector: "defense",
    counts_as_defense: true,
    ats_kind: null,
    ats_config: null,
    legacy_aliases: [],
  },
  {
    slug: "saronic",
    display_name: "Saronic",
    parent_company: "Saronic Technologies",
    sector: "defense",
    counts_as_defense: true,
    ats_kind: null,
    ats_config: null,
    legacy_aliases: [],
  },
  {
    slug: "vannevar-labs",
    display_name: "Vannevar Labs",
    parent_company: "Vannevar Labs",
    sector: "defense",
    counts_as_defense: true,
    ats_kind: null,
    ats_config: null,
    legacy_aliases: [],
  },
  {
    slug: "kratos",
    display_name: "Kratos Defense",
    parent_company: "Kratos Defense & Security Solutions",
    sector: "defense",
    counts_as_defense: true,
    ats_kind: null,
    ats_config: null,
    legacy_aliases: [],
  },
  {
    // Directed-energy / counter-electronics prime (Leonidas HPM). Listings are
    // pulled from its public Greenhouse board (board token "epirus") via the
    // /defense-jobs CSV importer.
    slug: "epirus",
    display_name: "Epirus",
    parent_company: "Epirus",
    sector: "defense",
    counts_as_defense: true,
    ats_kind: "greenhouse",
    ats_config: { board: "epirus" },
    legacy_aliases: [],
  },
  {
    // National-security software (Enterprise Readiness platform; Patriot, F-35,
    // B-52 programs). Formerly Govini — rebranded to Air in 2026. Listings come
    // from its public Greenhouse board (board token "air").
    slug: "air",
    display_name: "Air (Govini)",
    parent_company: "Air",
    sector: "defense",
    counts_as_defense: true,
    ats_kind: "greenhouse",
    ats_config: { board: "air" },
    legacy_aliases: [],
  },
  {
    // Advanced sensing / detection defense-tech (El Segundo). Listings come from
    // its public Greenhouse board (board token "chaosindustries").
    slug: "chaos-industries",
    display_name: "CHAOS Industries",
    parent_company: "CHAOS Industries",
    sector: "defense",
    counts_as_defense: true,
    ats_kind: "greenhouse",
    ats_config: { board: "chaosindustries" },
    legacy_aliases: [],
  },
  {
    // Hypersonic-weapons / low-cost strike startup (Torrance CA, plus Rio Rancho
    // NM and Midland/Allen TX). No public JSON ATS feed; listings are scraped
    // from its careers-page.com (Manatal) board into the /defense-jobs CSV.
    slug: "castelion",
    display_name: "Castelion",
    parent_company: "Castelion",
    sector: "defense",
    counts_as_defense: true,
    ats_kind: null,
    ats_config: null,
    legacy_aliases: [],
  },
  {
    // Military planning / staff software (deployed to combatant commands; roles
    // at Fort Leavenworth, Fort Knox, Wiesbaden/Stuttgart, plus US remote).
    // Listings come from its public Ashby board (board token "onebrief").
    slug: "onebrief",
    display_name: "Onebrief",
    parent_company: "Onebrief",
    sector: "defense",
    counts_as_defense: true,
    ats_kind: "ashby",
    ats_config: { board: "onebrief" },
    legacy_aliases: [],
  },
  {
    // Autonomous precision-manufacturing for aerospace & defense (Los Angeles,
    // plus Mesa AZ and Cherokee AL factories). Listings from its public Ashby
    // board (board token "hadrian-automation").
    slug: "hadrian",
    display_name: "Hadrian",
    parent_company: "Hadrian Automation",
    sector: "defense",
    counts_as_defense: true,
    ats_kind: "ashby",
    ats_config: { board: "hadrian-automation" },
    legacy_aliases: [],
  },
  {
    // Expeditionary manufacturing / unmanned aerial systems for defense
    // (San Diego). Listings scraped from its Gem (jobs.gem.com) board; Gem has
    // no public JSON feed, so pay/education are not captured at ingest.
    slug: "firestorm",
    display_name: "Firestorm",
    parent_company: "Firestorm Labs",
    sector: "defense",
    counts_as_defense: true,
    ats_kind: null,
    ats_config: null,
    legacy_aliases: [],
  },
  {
    // Hypersonic aircraft (Quarterhorse/Darkhorse); Atlanta HQ, plus Los Angeles
    // and Jacksonville. Listings from its public Lever board (token "hermeus").
    slug: "hermeus",
    display_name: "Hermeus",
    parent_company: "Hermeus",
    sector: "defense_aerospace",
    counts_as_defense: true,
    ats_kind: "lever",
    ats_config: { board: "hermeus" },
    legacy_aliases: [],
  },
  {
    // Real-time geospatial intelligence / satellite imagery (Tukwila WA, Herndon
    // VA). Listings from its public Greenhouse board (board token "blacksky").
    slug: "blacksky",
    display_name: "BlackSky",
    parent_company: "BlackSky",
    sector: "defense",
    counts_as_defense: true,
    ats_kind: "greenhouse",
    ats_config: { board: "blacksky" },
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
  /**
   * Contained geographies whose postings are folded into the counts above.
   * Present only when a facility sits in a neighborhood rather than being
   * posted against the city itself, so the page can say "incl. Canoga Park".
   *
   * The counts are summed INTO onsite/hybrid/remote/total rather than kept
   * separate, so hasDefenseEmployerSignal and matchesEmployers below need no
   * changes and the defense_ecosystem filter comes out right automatically.
   */
  rolled_up_from?: {
    geo_id: number;
    name: string;
    state: string;
    onsite: number;
    hybrid: number;
    remote: number;
    total: number;
  }[];
}

/**
 * location_id -> employers present. A plain object (not a Map) so it survives
 * the server -> client component boundary.
 */
/**
 * Defense employment elsewhere in a city's metro.
 *
 * Deliberately separate from EmployerPresence rather than folded into it. A
 * facility in the city (or in a geography inside it, like Canoga Park) is a
 * fact about that city; a facility 40 miles away in the same CBSA is a fact
 * about the region. Merging the two would have made Greenville TX read 258
 * openings from McKinney, and four Boston-area cities read an identical 599.
 *
 * This is also why metro presence never feeds defense_hub -- see
 * scripts/recompute-defense-hub.ts, which walks municipal_containment only.
 */
export interface MetroEmployerPresence {
  slug: string;
  display_name: string;
  counts_as_defense: boolean;
  /** onsite + hybrid only: a remote posting is not a facility. */
  onsiteHybrid: number;
  /** The places inside the metro that contribute, largest first. */
  places: { name: string; state: string; onsiteHybrid: number }[];
}

export interface MetroEmployment {
  metroName: string;
  employers: MetroEmployerPresence[];
}

export type MetroEmployerIndex = Record<number, MetroEmployment>;

export type EmployerIndex = Record<number, EmployerPresence[]>;

/**
 * Does this city have a physical defense-employer presence (onsite+hybrid ≥
 * DEFENSE_HUB_MIN_POSTINGS)? This is the promotion signal only — it does not apply
 * the `defense_hub_manual = false` veto, so the stored `defense_hub` column, not
 * this helper, is the final answer.
 */
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
