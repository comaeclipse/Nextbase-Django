/*
 * The controlled vocabulary for city-capability features.
 *
 * Features describe what a PLACE provides or imposes — never who should live
 * there. "specialist_healthcare_access = 0.15" is a claim about Elko;
 * "bad_for_people_with_complex_healthcare_needs" would be a claim about people,
 * and we do not store those. Personas are derived at read time in personas.ts.
 *
 * Every value is 0..1. What 0 and 1 MEAN depends on `kind`:
 *
 *   capacity  — more is better for essentially everyone (healthcare, job depth).
 *               Matched against a user minimum + importance.
 *   intensity — a magnitude that is neither good nor bad (winter severity,
 *               isolation, nightlife). Matched against a user target + tolerance
 *               band, because one person's 0.9 isolation is another's dealbreaker.
 *   position  — a location on a two-ended spectrum with a neutral middle
 *               (political conservatism: 0 = strongly progressive, 0.5 = mixed,
 *               1 = strongly conservative). Matched by distance from a target.
 *
 * Collapsing these three into one "score" is the mistake that makes preference
 * matching incoherent — a user does not "want more complex healthcare needs".
 */

export type FeatureKind = "capacity" | "intensity" | "position";

export type FeatureCategory =
  | "character"
  | "climate"
  | "environment"
  | "access"
  | "healthcare"
  | "economy"
  | "housing"
  | "culture"
  | "risk";

/**
 * How a value for this feature is normally produced.
 *   structural — computable for every city from columns we already store.
 *   editorial  — requires a research dossier; no column implies it.
 *   hybrid     — a structural prior exists but a dossier meaningfully corrects it.
 */
export type FeatureDerivation = "structural" | "editorial" | "hybrid";

export interface FeatureDefinition {
  key: string;
  label: string;
  category: FeatureCategory;
  kind: FeatureKind;
  derivation: FeatureDerivation;
  /** Plain-language meaning of a HIGH value. Shown in explanations and tooling. */
  high: string;
  /** Plain-language meaning of a LOW value. */
  low: string;
  /**
   * Sensitive features carry a real risk of being read as a judgment about
   * residents rather than a description of a place. They are never allowed to
   * drive a hard eligibility filter and must render with their provenance.
   */
  sensitive?: boolean;
}

export const FEATURE_SCHEMA_VERSION = "city_fit_v1";

export const FEATURES: readonly FeatureDefinition[] = [
  // ── character ───────────────────────────────────────────────────────────
  //
  // What a place FEELS like, as distinct from what it provides.
  //
  // The other seven categories are capability features: healthcare access,
  // employment depth, isolation, car dependence. Those are quantifiable-adjacent
  // — a statistical database can approximate most of them, and 27 of them are
  // derived structurally for all 112 cities.
  //
  // These cannot be derived from any table. There is no column for "a city that
  // embraces quirkiness", "nobody is open past nine", or "people do yoga in the
  // park while a band plays on the corner". That texture only exists in what
  // residents say, which is the entire reason the dossier layer exists — and
  // until now the ontology barely used it. Every feature here is editorial-only
  // and always will be.
  //
  // They are evidenced by rows in `location_texture_markers`: concrete,
  // quotable, observable details. The marker is the evidence AND the deliverable
  // — "there is no 24-hour anything" tells a reader more than
  // late_night_availability = 0.15 ever will. The score exists to make texture
  // sortable; the marker exists to make it real.
  {
    key: "quirk_embrace",
    label: "Tolerance for weirdness",
    category: "character",
    kind: "intensity",
    derivation: "editorial",
    high: "Eccentricity is celebrated; being odd is a form of belonging",
    low: "There is a strong sense of how one is supposed to be, and visible deviation is noticed",
  },
  {
    key: "street_life_vibrancy",
    label: "Street and public life",
    category: "character",
    kind: "capacity",
    derivation: "editorial",
    high: "People spontaneously occupy public space — buskers, park gatherings, sidewalk life",
    low: "Public space is transited, not inhabited; social life happens indoors and by arrangement",
  },
  {
    key: "independent_business_character",
    label: "Independent vs. chain character",
    category: "character",
    kind: "intensity",
    derivation: "editorial",
    high: "The places people name are one-offs — owner-run, idiosyncratic, unreplicable",
    low: "The commercial landscape is national brands and could be anywhere",
  },
  {
    key: "neighborliness",
    label: "Everyday neighborliness",
    category: "character",
    kind: "capacity",
    derivation: "editorial",
    high: "Neighbours know each other, lend things, notice absence, show up unprompted",
    low: "People are cordial and separate; you could live a year without learning a name",
  },
  {
    key: "late_night_availability",
    label: "How late the city stays on",
    category: "character",
    kind: "capacity",
    derivation: "editorial",
    high: "Something is open and someone is out at 1am on a Tuesday",
    low: "The place closes early and completely; there is no 24-hour anything",
  },
  {
    key: "creative_participation",
    label: "Making culture vs. consuming it",
    category: "character",
    kind: "capacity",
    derivation: "editorial",
    high: "Ordinary residents make things — bands, murals, markets, theatre, zines",
    low: "Culture is something bought and attended rather than produced",
  },
  {
    key: "status_performance",
    label: "Status and scene performance",
    category: "character",
    kind: "intensity",
    derivation: "editorial",
    high: "Visible signalling of money, taste or insider standing shapes social life",
    low: "Unpretentious; what you drive and where you eat carry little social weight",
  },
  {
    key: "civic_identity_intensity",
    label: "Strength of local identity",
    category: "character",
    kind: "intensity",
    derivation: "editorial",
    high: "Being from here is an identity people carry and defend",
    low: "Where you live is an address, not a self-description",
  },
  {
    key: "population_rootedness",
    label: "Rooted vs. transient population",
    category: "character",
    kind: "intensity",
    derivation: "editorial",
    high: "Multigenerational families, long tenures, deep local memory",
    low: "Most people arrived recently and many will leave; the population turns over",
  },
  {
    key: "subculture_depth",
    label: "Depth of niche communities",
    category: "character",
    kind: "capacity",
    derivation: "editorial",
    high: "Whatever you are into, there are enough others to form a real scene",
    low: "Niche interests are pursued alone or online",
  },

  // ── environment ─────────────────────────────────────────────────────────
  {
    key: "outdoor_recreation_access",
    label: "Outdoor recreation access",
    category: "environment",
    kind: "capacity",
    derivation: "hybrid",
    high: "Trails, water, mountains, or public land are reachable from town daily",
    low: "Meaningful outdoor recreation requires a trip",
  },
  {
    key: "public_land_access",
    label: "Public land access",
    category: "environment",
    kind: "capacity",
    derivation: "editorial",
    high: "Large tracts of federal or state land are open nearby for dispersed use",
    low: "Surrounding land is private, developed, or access-restricted",
  },
  {
    key: "natural_scenery",
    label: "Landscape and scenery",
    category: "environment",
    kind: "capacity",
    derivation: "editorial",
    high: "The surrounding landscape is a stated reason people stay",
    low: "Surroundings are unremarkable or actively unattractive",
  },
  // ── climate ─────────────────────────────────────────────────────────────
  // Split out of `environment` after Billings vs. Sierra Vista scored 0.85
  // similar. Climate is the axis people filter on first, and burying three
  // climate features among recreation features let a 57-inch snow difference
  // average away against water access and trail quality.
  {
    // Cold and snow were one feature until Billings vs. Sierra Vista. They are
    // independent — Rapid City is snowier than it is cold, Sierra Vista freezes
    // occasionally with no lasting snow — and blending them 0.6/0.4 destroyed
    // exactly the information that distinguishes a northern winter from a high-
    // desert one.
    key: "winter_cold_severity",
    label: "Winter cold",
    category: "climate",
    kind: "intensity",
    derivation: "structural",
    high: "Deep cold is a normal part of winter; sub-zero outbreaks happen",
    low: "Winter afternoons are comfortable in a light jacket",
  },
  {
    key: "snow_burden",
    label: "Snow burden",
    category: "climate",
    kind: "intensity",
    derivation: "structural",
    high: "Snow accumulates, persists, and shapes driving and daily planning",
    low: "Snow is rare or melts within a day",
  },
  {
    key: "summer_heat_severity",
    label: "Summer heat severity",
    category: "climate",
    kind: "intensity",
    derivation: "structural",
    high: "Summer heat materially limits daytime activity",
    low: "Summers stay comfortable",
  },
  {
    key: "humidity_burden",
    label: "Humidity burden",
    category: "climate",
    kind: "intensity",
    derivation: "structural",
    high: "Warm-season air is muggy enough to be a daily consideration",
    low: "Dry air; heat is felt as sun rather than mugginess",
  },
  {
    // A `position`, not an intensity: neither end is more rain, they are
    // different rain. Two cities can match on annual total and still feel
    // nothing alike — Billings peaks in May, Sierra Vista in a July monsoon.
    key: "precipitation_seasonality",
    label: "When the rain falls",
    category: "climate",
    kind: "position",
    derivation: "structural",
    high: "Summer-monsoon pattern: dry spring, dramatic late-summer storms",
    low: "Cool-season pattern: wettest in winter and spring, drier late summer",
  },
  {
    // Daylight is not temperature. Research on seasonal mood and on winter
    // mobility separates them explicitly: icy surfaces, darkness and rain
    // suppress walking independently of how cold it is, and someone can enjoy
    // cold air and snow while still finding a 4:30pm sunset intolerable.
    // Derived from latitude, so it is available for every city with coordinates.
    key: "winter_daylight_deficit",
    label: "Winter darkness",
    category: "climate",
    kind: "intensity",
    derivation: "structural",
    high: "Midwinter days are short enough to shape mood and daily routine",
    low: "Daylight stays long enough year-round to be a non-issue",
  },
  {
    // The feature that unifies the hot/cold argument rather than taking a side.
    // Household-location research finds people pay for warmer winters AND
    // cooler summers — they are buying outdoor season, not a temperature.
    // Both extremes produce confinement and behavioural adaptation; this counts
    // the months a place is comfortable to be outside in, whichever way it fails.
    key: "outdoor_comfort_season",
    label: "Length of the comfortable outdoor season",
    category: "climate",
    kind: "capacity",
    derivation: "structural",
    high: "Most of the year is pleasant to spend outdoors",
    low: "Heat, cold, or both confine people indoors for much of the year",
  },
  {
    // The "infrastructure skeptic" axis. Livability in both extremes depends on
    // working mechanical conditioning — the Chicago heat-wave studies found a
    // functioning air conditioner was the strongest single protective factor,
    // and cold snaps carry the mirror-image dependence on heat. A mild climate
    // is livable when the power fails; an extreme one is not.
    key: "climate_control_dependence",
    label: "Dependence on heating and cooling",
    category: "climate",
    kind: "intensity",
    derivation: "structural",
    high: "Comfort and safety depend on mechanical heating or cooling working",
    low: "The climate is livable without much heating or cooling",
  },
  {
    key: "wind_exposure",
    label: "Wind exposure",
    category: "climate",
    kind: "intensity",
    derivation: "editorial",
    high: "Persistent wind shapes driving, building upkeep, recreation, and mood",
    low: "Wind is an occasional weather event, not a condition",
  },
  {
    key: "severe_storm_risk",
    label: "Severe storm and hail risk",
    category: "climate",
    kind: "intensity",
    derivation: "editorial",
    high: "Hail, sudden storms, or violent weather are a property and insurance consideration",
    low: "Severe weather is rare enough to ignore",
  },
  {
    key: "water_recreation_access",
    label: "Water recreation access",
    category: "environment",
    kind: "capacity",
    derivation: "structural",
    high: "Fishing, floating, paddling, or boating are available close to home",
    low: "Water recreation requires a trip",
  },

  // ── access ──────────────────────────────────────────────────────────────
  {
    key: "geographic_isolation",
    label: "Geographic isolation",
    category: "access",
    kind: "intensity",
    derivation: "structural",
    high: "The nearest large metro is a trip, not an errand",
    low: "A large metro's services are routinely reachable",
  },
  {
    key: "urban_amenity_depth",
    label: "Everyday amenity depth",
    category: "access",
    kind: "capacity",
    derivation: "structural",
    high: "Restaurants, retail, services, and culture have real variety",
    low: "Choices are few and repeat quickly",
  },
  {
    key: "specialty_retail_access",
    label: "Specialty retail access",
    category: "access",
    kind: "capacity",
    derivation: "structural",
    high: "Uncommon goods, parts, and services can be bought locally",
    low: "Anything unusual is ordered online or bought out of town",
  },
  {
    key: "major_airport_access",
    label: "Major airport access",
    category: "access",
    kind: "capacity",
    derivation: "structural",
    high: "A hub airport is an easy drive",
    low: "Air travel starts with a long drive or a connecting hop",
  },
  {
    key: "car_dependence",
    label: "Car dependence",
    category: "access",
    kind: "intensity",
    derivation: "structural",
    high: "Daily life is impractical without a reliable vehicle",
    low: "Errands, work, and care are reachable without driving",
  },
  {
    // Added after Bangor. car_dependence is one citywide number and it hides the
    // most common American pattern: a genuinely walkable core surrounded by
    // strip commercial. Bangor scores downtown 0.79 against citywide 0.34 —
    // "The downtown is like one street with a loop" and "Grocery stores and
    // such are not walkable" are both true of the same city.
    key: "downtown_walkability",
    label: "Walkability of the core",
    category: "access",
    kind: "capacity",
    derivation: "editorial",
    high: "A compact core where you can park once, or live centrally, and circulate on foot",
    low: "No real pedestrian core; even the centre is driven between",
  },

  // ── healthcare ──────────────────────────────────────────────────────────
  {
    key: "routine_healthcare_access",
    label: "Routine healthcare access",
    category: "healthcare",
    kind: "capacity",
    derivation: "structural",
    high: "Primary care, urgent care, and pharmacies are easy to reach",
    low: "Even routine care involves waits or travel",
  },
  {
    // Added after Bangor. Every previous healthcare feature measured whether
    // care EXISTS. Bangor has two hospitals, 1,100+ affiliated clinicians and a
    // referral role across eastern Maine — infrastructure 0.82 — alongside
    // months-long primary-care waits that exceed national averages, and a
    // resident line that settles it: "it is genuinely impossible to get a doctor
    // around here." Navigability 0.28. Regional hub with unreachable care is a
    // common, decision-relevant pattern the ontology previously could not state.
    key: "healthcare_navigability",
    label: "Can you actually get seen",
    category: "healthcare",
    kind: "capacity",
    derivation: "editorial",
    high: "A new resident can establish primary care and get referred without a long fight",
    low: "The care exists but waitlists, referrals and admin make it hard to reach",
  },
  {
    key: "specialist_healthcare_access",
    label: "Specialist healthcare access",
    category: "healthcare",
    kind: "capacity",
    derivation: "hybrid",
    high: "Specialists and complex care are available without leaving the region",
    low: "Specialist care means travelling to another metro",
  },
  {
    key: "va_outpatient_access",
    label: "VA outpatient access",
    category: "healthcare",
    kind: "capacity",
    derivation: "structural",
    high: "A VA clinic handles routine visits close to home",
    low: "Routine VA care requires a long drive",
  },
  {
    key: "va_hospital_access",
    label: "VA hospital access",
    category: "healthcare",
    kind: "capacity",
    derivation: "structural",
    high: "A VA medical center — not just a clinic — is within reasonable reach",
    low: "VA hospital services are far away",
  },

  // ── economy ─────────────────────────────────────────────────────────────
  {
    key: "employment_opportunity_depth",
    label: "Job market depth",
    category: "economy",
    kind: "capacity",
    derivation: "structural",
    high: "Many employers hire across many roles",
    low: "Openings are few and turn over slowly",
  },
  {
    key: "employment_diversity",
    label: "Economic diversity",
    category: "economy",
    kind: "capacity",
    derivation: "editorial",
    high: "No single industry dominates the local economy",
    low: "One industry drives most local income and its cycles hit everyone",
  },
  {
    key: "high_wage_trade_opportunity",
    label: "High-wage trade opportunity",
    category: "economy",
    kind: "capacity",
    derivation: "editorial",
    high: "Skilled trades and industrial work pay well above the local cost base",
    low: "Trade work pays at or below what the local cost base demands",
  },
  {
    key: "remote_work_viability",
    label: "Remote work viability",
    category: "economy",
    kind: "capacity",
    derivation: "editorial",
    high: "Connectivity and services support working remotely full time",
    low: "Infrastructure or isolation makes remote work fragile",
  },
  {
    key: "commute_burden",
    label: "Commute burden",
    category: "economy",
    kind: "intensity",
    derivation: "editorial",
    high: "Typical work trips consume a large share of the day",
    low: "Getting to work is short and predictable",
  },
  {
    // The distinction Rapid City's dossier turns on. housing_affordability is
    // absolute and housing_value_for_size is relative to town size; this is
    // relative to what people are actually paid HERE. A place can be cheap
    // nationally and still unaffordable to the people who work in it.
    key: "local_wage_adequacy",
    label: "Local wages vs. local costs",
    category: "economy",
    kind: "capacity",
    derivation: "editorial",
    high: "Ordinary local jobs cover ordinary local costs",
    low: "Local pay does not keep up with local housing and living costs",
  },
  {
    key: "tourism_pressure",
    label: "Tourism pressure",
    category: "economy",
    kind: "intensity",
    derivation: "editorial",
    high: "Visitor volume shapes traffic, housing, wages, and the rhythm of the year",
    low: "Tourism is not a factor in daily life",
  },
  {
    key: "growth_pressure",
    label: "Growth and change pressure",
    category: "economy",
    kind: "intensity",
    derivation: "editorial",
    high: "Rapid in-migration or development is outpacing housing and infrastructure",
    low: "The place is stable; what is there now is roughly what will be there",
  },
  {
    // Distinct from employment_diversity: a place can have several industries
    // and still ride one commodity cycle. Casper is more diversified than Elko
    // yet both rise and fall with extraction prices.
    key: "economic_cycle_exposure",
    label: "Boom-and-bust exposure",
    category: "economy",
    kind: "intensity",
    derivation: "editorial",
    high: "Employment, housing, and local confidence swing with a commodity cycle",
    low: "The local economy is insulated from any single market cycle",
  },

  // ── housing ─────────────────────────────────────────────────────────────
  {
    key: "housing_affordability",
    label: "Housing affordability",
    category: "housing",
    kind: "capacity",
    derivation: "structural",
    high: "Housing is cheap relative to the national picture",
    low: "Housing costs are steep in absolute terms",
  },
  {
    key: "housing_value_for_size",
    label: "Housing cost vs. town size",
    category: "housing",
    kind: "capacity",
    derivation: "structural",
    high: "Housing is cheap for a place this size — the expected small-town discount is real",
    low: "Housing costs far more than a town this size normally would",
  },
  {
    key: "rental_availability",
    label: "Rental availability",
    category: "housing",
    kind: "capacity",
    derivation: "editorial",
    high: "Rentals can be secured without a wait",
    low: "Waiting lists and competition make arriving without a lease risky",
  },

  // ── culture ─────────────────────────────────────────────────────────────
  {
    key: "political_conservatism",
    label: "Local political lean",
    category: "culture",
    kind: "position",
    derivation: "structural",
    high: "Strongly conservative",
    low: "Strongly progressive",
    sensitive: true,
  },
  {
    // Split from lgbtq_social_acceptance after Casper: its stored score of 92
    // comes from an HRC Municipal Equality Index scorecard, which grades city
    // ordinances, employment policy and services — not how daily life feels.
    // Casper scores high on policy while its dossier describes a socially
    // conservative, visibly religious climate. Both readings are true because
    // they measure different things, so they get different features.
    key: "lgbtq_municipal_policy",
    label: "LGBTQ municipal policy",
    category: "culture",
    kind: "capacity",
    derivation: "structural",
    high: "City ordinances, employment policy and services are protective",
    low: "No municipal protections beyond what the state requires",
    sensitive: true,
  },
  {
    key: "lgbtq_social_acceptance",
    label: "LGBTQ social acceptance",
    category: "culture",
    kind: "capacity",
    derivation: "editorial",
    high: "Residents report an accepting day-to-day social climate",
    low: "Residents report having to seek out compatible circles deliberately",
    sensitive: true,
  },
  {
    // Added after Bangor. Acceptance and scene size come apart cleanly: a queer
    // resident reporting "I have never felt unsafe" (acceptance 0.82) in a city
    // whose own subreddit fills with young LGBTQ newcomers asking how to meet
    // anyone (scene 0.43). Safe but lonely is a real and separate outcome.
    key: "lgbtq_scene_size",
    label: "Size of the LGBTQ community",
    category: "culture",
    kind: "capacity",
    derivation: "editorial",
    high: "Dedicated venues, a real dating pool, a refreshing social circuit",
    low: "The community exists but is small, periodic, and hard to find",
    sensitive: true,
  },
  {
    // Added after Bangor. political_conservatism is a POSITION where 0.5 means
    // "evenly split". This is variance, not position: how many different kinds
    // of people visibly coexist. Bangor is 41/28/29 D/R/unenrolled — it leans
    // left AND is genuinely heterogeneous, which one axis cannot express.
    key: "political_heterogeneity",
    label: "Political and cultural mix",
    category: "culture",
    kind: "intensity",
    derivation: "editorial",
    high: "Progressives, conservatives, independents and the apolitical all visibly share the same civic arena",
    low: "One outlook dominates; dissent is private or absent",
    sensitive: true,
  },
  {
    key: "family_infrastructure",
    label: "Family infrastructure",
    category: "culture",
    kind: "capacity",
    derivation: "editorial",
    high: "Schools, youth sports, extracurriculars, and safe independence for kids are all present",
    low: "Families have to assemble these themselves or drive for them",
  },
  {
    // Kept separate from political_conservatism because they diverge: a place
    // can vote heavily one way without religion being visible in daily life,
    // and vice versa. Casper's dossier is explicit that both are present.
    key: "religious_culture_prominence",
    label: "Visibility of religious culture",
    category: "culture",
    kind: "intensity",
    derivation: "editorial",
    high: "Churches and religious norms occupy a visible place in community life",
    low: "Religion is largely a private matter locally",
    sensitive: true,
  },
  {
    // Records what residents REPORT about the local climate — never an
    // attribute of any resident, and never a demographic composition figure.
    // Editorial only, and deliberately hard to score high or low: the source
    // discourse on this topic is the least reliable material in any dossier,
    // mixing genuine first-hand accounts with open prejudice. Values here
    // should stay mid-range with low confidence unless the evidence is
    // unusually clean, and the UI must surface it as reported experience
    // requiring independent verification, never as a rating of a place.
    key: "racial_inclusion_climate",
    label: "Reported racial inclusion",
    category: "culture",
    kind: "capacity",
    derivation: "editorial",
    high: "Residents of color report an unremarkable, welcoming day-to-day experience",
    low: "Residents of color report recurring hostility or exclusion",
    sensitive: true,
  },
  {
    key: "social_integration_ease",
    label: "Ease of breaking in socially",
    category: "culture",
    kind: "capacity",
    derivation: "editorial",
    high: "Newcomers find friends without an existing connection",
    low: "Social networks are established, interconnected, and slow to open",
  },
  {
    key: "social_anonymity",
    label: "Social anonymity",
    category: "culture",
    kind: "intensity",
    derivation: "structural",
    high: "You can live privately; reputation does not travel",
    low: "Everyone knows everyone and a conflict follows you",
  },
  {
    key: "alcohol_centered_social_scene",
    label: "Alcohol-centered socializing",
    category: "culture",
    kind: "intensity",
    derivation: "editorial",
    high: "Bars, casinos, or drinking are the default way people socialize",
    low: "Plenty of social life happens without alcohol at the center",
  },
  {
    key: "nightlife_depth",
    label: "Nightlife and evening options",
    category: "culture",
    kind: "capacity",
    derivation: "structural",
    high: "Evenings offer real variety",
    low: "Evening options are few and repeat",
  },
  {
    key: "dating_pool_depth",
    label: "Dating pool depth",
    category: "culture",
    kind: "capacity",
    derivation: "structural",
    high: "A large, varied pool of single adults",
    low: "Small and socially interconnected",
  },
  {
    key: "cultural_distinctiveness",
    label: "Local cultural identity",
    category: "culture",
    kind: "intensity",
    derivation: "editorial",
    high: "The place has a strong identity of its own, not a generic template",
    low: "Culturally interchangeable with anywhere else",
  },

  // ── risk ────────────────────────────────────────────────────────────────
  {
    // Deliberately "perceived": this is how safe daily life feels to residents,
    // which is a different quantity from a crime rate and often disagrees with
    // it. Both dossiers describe places residents call safe while also naming
    // real property-crime and substance problems.
    key: "perceived_everyday_safety",
    label: "Perceived everyday safety",
    category: "risk",
    kind: "capacity",
    derivation: "hybrid",
    high: "Residents describe ordinary daily life as feeling safe",
    low: "Residents describe daily caution as necessary",
  },
  {
    key: "trailing_spouse_isolation_risk",
    label: "Trailing-partner isolation risk",
    category: "risk",
    kind: "intensity",
    derivation: "editorial",
    high: "A partner who moves without their own job or network is likely to end up isolated",
    low: "A non-working partner can build a life independently",
  },
  {
    key: "substance_problem_visibility",
    label: "Visible substance problems",
    category: "risk",
    kind: "intensity",
    derivation: "editorial",
    high: "Addiction and related social problems are visible in daily life",
    low: "Not a commonly raised local concern",
    sensitive: true,
  },
] as const;

/** Stable ordering for vector generation. Append-only within a schema version. */
export const FEATURE_ORDER: readonly string[] = FEATURES.map((f) => f.key);

const BY_KEY = new Map(FEATURES.map((f) => [f.key, f]));

export function getFeature(key: string): FeatureDefinition {
  const feature = BY_KEY.get(key);
  if (!feature) throw new Error(`Unknown feature key: ${key}`);
  return feature;
}

export function isFeatureKey(key: string): boolean {
  return BY_KEY.has(key);
}

/**
 * Where a stored value came from. Higher tiers win when several are available
 * for the same city and feature — see resolveFeature().
 */
export type FeatureProvenance = "editorial" | "derived_structural" | "propagated";

export const PROVENANCE_RANK: Record<FeatureProvenance, number> = {
  editorial: 3,
  derived_structural: 2,
  propagated: 1,
};

/**
 * Confidence ceilings by provenance. These are enforced on write, not merely
 * documented, because the failure mode we care about is a Reddit thread
 * hardening into something the UI states as fact.
 */
export const CONFIDENCE_CEILING: Record<FeatureProvenance, number> = {
  editorial: 0.9,
  derived_structural: 0.85,
  propagated: 0.4,
};

/**
 * Only these provenances may exclude a city from results. A propagated value is
 * a guess about a city nobody researched; it can rank and it can caveat, but it
 * must never be the reason a city disappears.
 */
export function canHardFilter(provenance: FeatureProvenance): boolean {
  return provenance !== "propagated";
}
