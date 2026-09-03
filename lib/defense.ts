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
  /**
   * The board this employer's job listings are pulled from (issue #313) — the
   * repo's single registry of scrape sources, mirrored into `defense_employers`.
   * `ats_kind` names the vendor; `ats_config` carries what its adapter needs:
   * `board` (greenhouse / lever / ashby / gem / manatal), `domain` (eightfold),
   * `site` (phenom / successfactors / radancy / careers-site), `organization`
   * (usajobs). `manual: true` flags a board with no fetchable feed (browser
   * scraped), which the sync script must skip loudly rather than prune;
   * `fetcher` points at a committed pull script where one exists. Null means no
   * known board yet. For the RTX brands the same fields also drive the aggregate
   * defense_employer_locations sync. lib/defense-jobs-companies.test.ts fails
   * if an employer with committed listings leaves this null.
   */
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
    // Listings ingested from LM's Eightfold careers API (host
    // lockheedmartin.eightfold.ai, domain lockheedmartin.com). Old careers
    // backend was BrassRing. `host` is required by the eightfold adapter.
    ats_kind: "eightfold",
    ats_config: { domain: "lockheedmartin.com", host: "lockheedmartin.eightfold.ai" },
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
    // Listings from its Eightfold tenant. The API domain is `ngc.com`, NOT
    // northropgrumman.com (that returns the SPA shell); page size is fixed at 10
    // and the ATS 403s two concurrent pulls — see the fetcher.
    slug: "northrop-grumman",
    display_name: "Northrop Grumman",
    parent_company: "Northrop Grumman",
    sector: "defense",
    counts_as_defense: true,
    ats_kind: "eightfold",
    ats_config: {
      domain: "ngc.com",
      site: "jobs.northropgrumman.com",
      fetcher: "scripts/fetch-northrop-grumman-jobs.ts",
    },
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
    // Listings came from its public Lever board (jobs.lever.co/shieldai). An
    // Ashby board (api.ashbyhq.com/posting-api/job-board/shield-ai) is live
    // with the same roles as of 2026-09; keep Lever so URLs stay comparable
    // with the existing rows, and switch when Lever goes dark.
    slug: "shield-ai",
    display_name: "Shield AI",
    parent_company: "Shield AI",
    sector: "defense",
    counts_as_defense: true,
    ats_kind: "lever",
    ats_config: { board: "shieldai", alternate: { kind: "ashby", board: "shield-ai" } },
    legacy_aliases: [],
  },
  {
    // Listings from its public Lever board (jobs.lever.co/palantir).
    slug: "palantir",
    display_name: "Palantir",
    parent_company: "Palantir Technologies",
    sector: "defense",
    counts_as_defense: true,
    ats_kind: "lever",
    ats_config: { board: "palantir" },
    legacy_aliases: [],
  },
  {
    // Listings from its public Ashby board (jobs.ashbyhq.com/saronic).
    slug: "saronic",
    display_name: "Saronic",
    parent_company: "Saronic Technologies",
    sector: "defense",
    counts_as_defense: true,
    ats_kind: "ashby",
    ats_config: { board: "saronic" },
    legacy_aliases: [],
  },
  {
    // Listings from its public Greenhouse board (board token "vannevarlabs").
    slug: "vannevar-labs",
    display_name: "Vannevar Labs",
    parent_company: "Vannevar Labs",
    sector: "defense",
    counts_as_defense: true,
    ats_kind: "greenhouse",
    ats_config: { board: "vannevarlabs" },
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
    ats_kind: "manatal",
    ats_config: { board: "castelion-corporation", site: "www.careers-page.com", manual: true },
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
    ats_kind: "gem",
    ats_config: { board: "firestorm", site: "jobs.gem.com", manual: true },
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
  {
    // Cybersecurity (defense-adjacent: federal/DoD security business). Careers
    // run on Radancy (tenant 47263) with no public JSON feed, so listings are
    // scraped list-level (CONUS-only); pay/education not captured at ingest.
    slug: "palo-alto-networks",
    display_name: "Palo Alto Networks",
    parent_company: "Palo Alto Networks",
    sector: "defense",
    counts_as_defense: true,
    ats_kind: "radancy",
    ats_config: { site: "jobs.paloaltonetworks.com", tenant: "47263", manual: true },
    legacy_aliases: [],
  },
  {
    // Defense prime (BAE Systems Inc., the US arm; Nashua NH electronic systems,
    // plus many CONUS sites). Careers on Phenom (refNum BAE1US); listings pulled
    // from phApp.ddo.eagerLoadRefineSearch, USA/CONUS-only.
    slug: "bae-systems",
    display_name: "BAE Systems",
    parent_company: "BAE Systems",
    sector: "defense_aerospace",
    counts_as_defense: true,
    ats_kind: "phenom",
    ats_config: { refNum: "BAE1US", site: "jobs.baesystems.com" },
    legacy_aliases: [],
  },
  {
    // Defense-intelligence contractor (TS/SCI analysis at Ft Meade, Linthicum,
    // Langley-Eustis). Small WordPress careers site (no ATS API).
    slug: "cyntel-technologies",
    display_name: "Cyntel Technologies",
    parent_company: "Cyntel Technologies",
    sector: "defense",
    counts_as_defense: true,
    ats_kind: "careers-site",
    ats_config: { site: "cynteltechnologies.com", path: "/job/", manual: true },
    legacy_aliases: [],
  },
  {
    // Cleared defense/IC services contractor (Chantilly/McLean/Tysons VA,
    // Hanover MD, Fort Meade): data/software/DevOps/DSP engineering roles for
    // fully cleared candidates. Listings from its public Lever board
    // (jobs.lever.co/fantom-corporation). Seeded ahead of its first pull
    // (issue #313) so the board is on record; no defense_employer_locations
    // rows until listings land.
    slug: "fantom-corporation",
    display_name: "Fantom Corporation",
    parent_company: "Fantom Corporation",
    sector: "defense",
    counts_as_defense: true,
    ats_kind: "lever",
    ats_config: { board: "fantom-corporation" },
    legacy_aliases: [],
  },

  {
    // Government agency, not a private contractor: Naval Sea Systems Command,
    // the Navy's largest systems command (shipbuilding, ship/submarine warfare
    // centers). Its individual job *listings* are ingested from USAJOBS via the
    // /defense-jobs CSV importer (ats="USAJOBS"). Seeded only so those listings
    // can link an employer_slug and appear in the unified employer filter.
    // `counts_as_defense: false` and NO defense_employer_locations rows are
    // written for it, so it never feeds defense_hub / defense_ecosystem — those
    // facets stay a private-contractor signal (see the module header).
    slug: "navsea",
    display_name: "Naval Sea Systems Command",
    parent_company: "Department of the Navy",
    sector: "defense",
    counts_as_defense: false,
    // USAJOBS Data API (keyed: USAJOBS_API_KEY + USAJOBS_UA). `organization` is
    // the agency code (NV24 = NAVSEA, not Nevada); the fetcher scopes titles.
    ats_kind: "usajobs",
    ats_config: { organization: "NV24", positionTitle: "Acquisition Specialist;Contract Specialist", fetcher: "scripts/fetch-usajobs-navsea.ts" },
    legacy_aliases: [],
  },

  // Defense employers referenced by the career-transition graph
  // (data/career-transition/employers.csv). Seeded with zero locations and no
  // ATS scraper — presence data lands later via hand-sourced footprints or an
  // importer, same as the general-dynamics / northrop-grumman seeds. This lets
  // transition_employers.defense_employer_slug link them (issue #265). Civilian
  // operators, commercial-cyber employers, and government agencies stay unseeded.
  // HII's shipbuilding listings (Newport News + Ingalls + Corporate) come from
  // its SAP SuccessFactors career site (server-rendered, 50/page). Mission
  // Technologies is a separate site (jobs.hii-tsd.com), not pulled.
  { slug: "hii", display_name: "HII", parent_company: "HII", sector: "defense", counts_as_defense: true, ats_kind: "successfactors", ats_config: { site: "careers.huntingtoningalls.com", fetcher: "scripts/fetch-hii-jobs.ts" }, legacy_aliases: [] },
  { slug: "fincantieri-marinette", display_name: "Fincantieri Marinette Marine", parent_company: "Fincantieri", sector: "defense", counts_as_defense: true, ats_kind: null, ats_config: null, legacy_aliases: [] },
  { slug: "austal-usa", display_name: "Austal USA", parent_company: "Austal", sector: "defense", counts_as_defense: true, ats_kind: null, ats_config: null, legacy_aliases: [] },
  { slug: "leonardo-drs", display_name: "Leonardo DRS", parent_company: "Leonardo DRS", sector: "defense", counts_as_defense: true, ats_kind: null, ats_config: null, legacy_aliases: [] },
  { slug: "kbr", display_name: "KBR", parent_company: "KBR", sector: "defense", counts_as_defense: true, ats_kind: null, ats_config: null, legacy_aliases: [] },
  { slug: "peraton", display_name: "Peraton", parent_company: "Peraton", sector: "defense", counts_as_defense: true, ats_kind: null, ats_config: null, legacy_aliases: [] },
  { slug: "booz-allen", display_name: "Booz Allen Hamilton", parent_company: "Booz Allen Hamilton", sector: "defense", counts_as_defense: true, ats_kind: null, ats_config: null, legacy_aliases: [] },
  { slug: "caci", display_name: "CACI", parent_company: "CACI", sector: "defense", counts_as_defense: true, ats_kind: null, ats_config: null, legacy_aliases: [] },
  { slug: "mantech", display_name: "ManTech", parent_company: "ManTech", sector: "defense", counts_as_defense: true, ats_kind: null, ats_config: null, legacy_aliases: [] },
  { slug: "saic", display_name: "SAIC", parent_company: "SAIC", sector: "defense", counts_as_defense: true, ats_kind: null, ats_config: null, legacy_aliases: [] },
  { slug: "sierra-nevada", display_name: "Sierra Nevada Corporation", parent_company: "Sierra Nevada Corporation", sector: "defense", counts_as_defense: true, ats_kind: null, ats_config: null, legacy_aliases: [] },
  { slug: "amentum", display_name: "Amentum", parent_company: "Amentum", sector: "defense", counts_as_defense: true, ats_kind: null, ats_config: null, legacy_aliases: [] },
  { slug: "v2x", display_name: "V2X", parent_company: "V2X", sector: "defense", counts_as_defense: true, ats_kind: null, ats_config: null, legacy_aliases: [] },
  { slug: "bell-textron", display_name: "Bell (Textron)", parent_company: "Textron", sector: "defense_aerospace", counts_as_defense: true, ats_kind: null, ats_config: null, legacy_aliases: [] },
  { slug: "fn-america", display_name: "FN America", parent_company: "FN America", sector: "defense", counts_as_defense: true, ats_kind: null, ats_config: null, legacy_aliases: [] },
  { slug: "sig-sauer", display_name: "SIG Sauer", parent_company: "SIG Sauer", sector: "defense", counts_as_defense: true, ats_kind: null, ats_config: null, legacy_aliases: [] },
  { slug: "colt-cz", display_name: "Colt CZ Group", parent_company: "Colt CZ Group", sector: "defense", counts_as_defense: true, ats_kind: null, ats_config: null, legacy_aliases: [] },
  { slug: "oceaneering", display_name: "Oceaneering International", parent_company: "Oceaneering International", sector: "defense", counts_as_defense: true, ats_kind: null, ats_config: null, legacy_aliases: [] },
  { slug: "three-saints-bay", display_name: "Three Saints Bay", parent_company: "Three Saints Bay", sector: "defense", counts_as_defense: true, ats_kind: null, ats_config: null, legacy_aliases: [] },
  { slug: "marine-acoustics", display_name: "Marine Acoustics", parent_company: "Marine Acoustics", sector: "defense", counts_as_defense: true, ats_kind: null, ats_config: null, legacy_aliases: [] },
  { slug: "arcfield", display_name: "Arcfield", parent_company: "Arcfield", sector: "defense", counts_as_defense: true, ats_kind: null, ats_config: null, legacy_aliases: [] },

  // Commercial / dual-use employers with a defense or national-security arm, not
  // defense primes: they run large commercial job boards (SpaceX also posts
  // food-service/welding/marine roles; xAI is a consumer-AI company), so unlike a
  // prime we do NOT count every opening. Seeded now because their boards are on
  // the existing Greenhouse adapter; `counts_as_defense: false` (the NAVSEA /
  // RTX-Corporate precedent) keeps them out of defense_hub / defense_ecosystem and
  // writes NO defense_employer_locations rows. The "which listings count" rule
  // (a defense-slice filter) is deferred to issue #336; until then no listings are
  // pulled, only the board is recorded (issue #313).
  {
    // Space Exploration Technologies: aerospace/defense (Starshield, NSSL launches)
    // plus a heavy commercial board (Starlink, launch ops). Greenhouse board
    // token "spacex" (~2,281 postings; the content=true payload is ~26 MB, so the
    // adapter must page it or drop content on the list pass).
    slug: "spacex",
    display_name: "SpaceX",
    parent_company: "Space Exploration Technologies Corp.",
    sector: "defense_aerospace",
    counts_as_defense: false,
    ats_kind: "greenhouse",
    ats_config: { board: "spacex" },
    legacy_aliases: [],
  },
  {
    // xAI: commercial AI company (Grok) with a thin/emerging defense footprint.
    // Greenhouse board token "xai" (~253 postings); the careers UI's dept ids are
    // Greenhouse departments[].id, so a department filter is available for the
    // eventual defense slice (#336).
    slug: "xai",
    display_name: "xAI",
    parent_company: "xAI",
    sector: "corporate",
    counts_as_defense: false,
    ats_kind: "greenhouse",
    ats_config: { board: "xai" },
    legacy_aliases: [],
  },

  // More commercial / dual-use employers (same counts_as_defense:false rationale
  // as the block above), but on ATSes beyond Greenhouse. Their sync adapters are
  // not built yet — these seeds only record the board (issue #313, Phase 2/3); no
  // listings are pulled and the defense-slice policy is #336. See the candidate
  // notes in #313 for the verified feeds behind each ats_config.
  {
    // Oracle: its own Oracle Cloud Recruiting product (Fusion "CX" / ORC). Public
    // REST finder recruitingCEJobRequisitions, no auth (~2,237 reqs). NEW vendor.
    slug: "oracle",
    display_name: "Oracle",
    parent_company: "Oracle Corporation",
    sector: "corporate",
    counts_as_defense: false,
    ats_kind: "oracle_orc",
    ats_config: { host: "eeho.fa.us2.oraclecloud.com", siteNumber: "CX_45001", sitePath: "jobsearch" },
    legacy_aliases: [],
  },
  {
    // Dell Technologies: also Oracle Cloud Recruiting, on its own tenant
    // (enterpriseplatform.dell.com). Same oracle_orc adapter as Oracle. NOTE: an
    // unrecognized siteNumber silently returns a small default set, so the real
    // one is read from the careers page: Dell CX_1001, Oracle CX_45001 (not CX_1).
    slug: "dell",
    display_name: "Dell Technologies",
    parent_company: "Dell Technologies",
    sector: "corporate",
    counts_as_defense: false,
    ats_kind: "oracle_orc",
    ats_config: { host: "enterpriseplatform.dell.com", siteNumber: "CX_1001", sitePath: "careers" },
    legacy_aliases: [],
  },
  {
    // Microsoft: Eightfold (same adapter family as Lockheed/Northrop), host
    // apply.careers.microsoft.com. Use /api/pcsx/search?domain=microsoft.com
    // (~2,213 reqs / ~1,206 US); the /api/apply/v2/jobs path 403s.
    slug: "microsoft",
    display_name: "Microsoft",
    parent_company: "Microsoft Corporation",
    sector: "corporate",
    counts_as_defense: false,
    ats_kind: "eightfold",
    ats_config: { domain: "microsoft.com", host: "apply.careers.microsoft.com" },
    legacy_aliases: [],
  },
  {
    // Amazon Web Services: amazon.jobs bespoke public search API (icims-backed).
    // AWS alone is thousands of rows, so the adapter MUST apply a defense slice,
    // not a full-board pull (#336) — defense_query anchors that slice. NEW vendor.
    slug: "amazon-web-services",
    display_name: "Amazon Web Services (AWS)",
    parent_company: "Amazon.com, Inc.",
    sector: "corporate",
    counts_as_defense: false,
    ats_kind: "amazon_jobs",
    ats_config: { business_category: "amazon-web-services", defense_query: "security clearance" },
    legacy_aliases: [],
  },
  {
    // Cisco: careers.cisco.com is a Phenom front-end over a Workday system of
    // record (cisco.wd5.myworkdayjobs.com). Pull the Workday CXS JSON API
    // (POST /wday/cxs/cisco/Cisco_Careers/jobs, ~1,282 reqs). NEW vendor (Workday).
    slug: "cisco",
    display_name: "Cisco",
    parent_company: "Cisco Systems, Inc.",
    sector: "corporate",
    counts_as_defense: false,
    ats_kind: "workday",
    ats_config: { host: "cisco.wd5.myworkdayjobs.com", tenant: "cisco", site: "Cisco_Careers" },
    legacy_aliases: [],
  },
  {
    // Tesla: careers use a bespoke cua-api behind Akamai bot protection that hard
    // -403s server-side requests (curl, no TLS/browser fingerprint). No curl-able
    // feed — this is a Phase-4 browser-only source (#313). Seeded with no ATS so
    // the employer is on record; listings need a browser adapter or manual pull.
    slug: "tesla",
    display_name: "Tesla",
    parent_company: "Tesla, Inc.",
    sector: "corporate",
    counts_as_defense: false,
    ats_kind: null,
    ats_config: null,
    legacy_aliases: [],
  },
  {
    // GCI (gci.tech) — national-security integrator; every opening is a cleared
    // intel/cyber role ("TS/SCI with Poly Required"), so a defense pure-play.
    // Careers run on UltiPro / UKG Recruiting: the public JobBoard
    // LoadSearchResults JSON API is curl-able server-side (in-process `ultipro`
    // adapter). tenant + board GUID are the two ids the adapter needs.
    slug: "gci",
    display_name: "GCI",
    parent_company: "GCI",
    sector: "defense",
    counts_as_defense: true,
    ats_kind: "ultipro",
    ats_config: { tenant: "GCI1000GCI", board: "09636f6c-2fa1-4a76-adb9-57dea469416b", careers_url: "https://gci.tech/careers/" },
    legacy_aliases: [],
  },
  {
    // DSD Laboratories (dsdlabs.com) — DoD/warfighter defense-technology shop, a
    // pure-play. No ATS: a bespoke, self-hosted SSR careers page. The in-process
    // `dsd_labs` adapter fetches https://dsdlabs.com/careers/ and regex-parses the
    // <article class="role"> blocks (curl-able with a browser UA).
    slug: "dsd-laboratories",
    display_name: "DSD Laboratories",
    parent_company: "DSD Laboratories",
    sector: "defense",
    counts_as_defense: true,
    ats_kind: "dsd_labs",
    ats_config: { site: "dsdlabs.com", careers_url: "https://dsdlabs.com/careers/" },
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
