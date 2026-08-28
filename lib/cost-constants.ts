/*
 * National constants for the fixed-income cost model (lib/affordability.ts).
 *
 * WHY THIS FILE EXISTS SEPARATELY: the affordability model converts *relative*
 * BEA Regional Price Parities (100 = national average) into *absolute* dollars.
 * That conversion is impossible without a national dollar anchor. An earlier
 * draft of this feature skipped the anchor and hard-coded an income -> index
 * mapping invented from nothing; against real data it returned zero results for
 * the lowest-income users. Every number the model depends on now lives here,
 * with its source, so it can be reviewed, cited, and refreshed rather than
 * guessed.
 *
 * HOW TO FILL THIS IN (Phase 0): each entry below has `value: null`. Look up the
 * figure from the named source, set the value, set `sourcedOn` to the date you
 * looked it up, and paste the exact URL into `sourceUrl`. Then run:
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/verify-affordability.ts
 * which reports what is still missing and how many cities become computable.
 *
 * DO NOT fill these from memory. The whole point of the file is that each number
 * is traceable to a published figure on a known date.
 */

/**
 * How a constant was arrived at.
 * - "measured"   – a published statistic from a named body (BLS, CMS, C2ER...).
 * - "convention" – a widely used planning rule of thumb, not a measurement.
 *                  These are legitimate but must be labeled, because they carry
 *                  much wider error bars than measured figures and a reader
 *                  deserves to know which is which.
 */
export type ConstantKind = "measured" | "convention";

export interface CostConstant {
  /** The value, or null while unsourced. Units are stated in `unit`. */
  value: number | null;
  unit: string;
  kind: ConstantKind;
  /** Human-readable description of where this comes from. */
  source: string;
  /** Exact URL of the figure. Fill in alongside `value`. */
  sourceUrl: string | null;
  /** ISO date the value was looked up, e.g. "2026-08-09". */
  sourcedOn: string | null;
  /** How often it needs refreshing. */
  refresh: "annual" | "monthly" | "rare";
  /** Anything a future reader needs in order to trust or replace the number. */
  note?: string;
}

/**
 * Identity helper that pins each entry's type to `CostConstant`.
 *
 * Without it, TypeScript infers `value: null` from the literal, so filling in a
 * number would be a type error — exactly backwards from what we want, since
 * filling them in is the whole point of Phase 0.
 */
const constant = (c: CostConstant): CostConstant => c;

/**
 * The anchor set. Keys are referenced by name in lib/affordability.ts, so
 * renaming one is a compile error rather than a silent behavior change.
 */
export const COST_CONSTANTS = {
  /**
   * Monthly non-housing spending for a household with a reference person aged
   * 65+, at the NATIONAL average. This is the anchor the whole model scales.
   *
   * Derivation from the source table: take total annual expenditures for the
   * 65+ age group, subtract housing and healthcare, then divide by 12. Both are
   * priced separately by the model; leaving either in this baseline would
   * double-count it.
   */
  nonHousingBaseline65Plus: constant({
    value: 2620,
    unit: "USD per month",
    kind: "measured",
    source:
      "BLS Consumer Expenditure Survey 2024, reference person 65+: total " +
      "average annual expenditures $61,432 minus housing $22,193 and " +
      "healthcare $7,799 = $31,440, / 12",
    sourceUrl: "https://fred.stlouisfed.org/series/CXUTOTALEXPLB0407M",
    sourcedOn: "2026-08-17",
    refresh: "annual",
    note:
      "Healthcare is removed because medicarePartBMonthly and " +
      "medigapMonthly/partDMonthly add health premiums separately. The previous " +
      "total-minus-housing derivation counted healthcare twice. Healthcare uses " +
      "the same BLS release and age group: " +
      "https://fred.stlouisfed.org/series/CXUHEALTHLB0407M.\n" +
      "THIS IS THE 65+ MEAN (`typical` spending profile). Total 65+ spending " +
      "of $61,432/yr is about $5,119/mo; a veteran on $2,400/mo cannot fund " +
      "that lifestyle in any city. The `modest` profile (BLS 65+ by income, " +
      "$15,000–$29,999) is the default for 'where can I get by'. Do not " +
      "quietly replace this mean with an all-ages lowest-quintile figure.",
  }),

  /**
   * Goods slice of the 65+ non-housing/non-health baseline. Scaled by BEA
   * goods RPP. Housing (including furnishings and housekeeping supplies) and
   * healthcare are already out of the parent baseline, so they are not in
   * this slice either.
   *
   * BLS CE 2024, reference person 65+, annual: food at home $5,251; alcoholic
   * beverages $532; apparel $1,198; vehicle purchases $3,510; gasoline /
   * motor oil $1,806 (transportation residual after vehicle purchases, other
   * vehicle expenses, and public transit); reading $120; tobacco $266;
   * entertainment toys/hobbies $97; entertainment other supplies/equipment
   * $525. Total $13,305 / 12.
   */
  nonHousingGoodsMonthly: constant({
    value: 1108.75,
    unit: "USD per month",
    kind: "measured",
    source:
      "BLS CE 2024, 65+: goods categories inside the $31,440 non-housing/" +
      "non-health remainder, / 12",
    sourceUrl: "https://fred.stlouisfed.org/release/tables?eid=1198958&rid=479",
    sourcedOn: "2026-08-18",
    refresh: "annual",
    note:
      "Do not average this with the services RPP. Goods and other services " +
      "are separate BEA components and are scaled independently.",
  }),

  /**
   * Local-consumption services slice of the same baseline. Scaled by BEA
   * other-services RPP. Cash contributions and pensions are *not* in this
   * slice — they do not have a local price level.
   *
   * BLS CE 2024, 65+, annual: food away from home $2,689; other vehicle
   * expenses $3,198; public transportation $1,024; entertainment fees $602;
   * audio/visual equipment and services $1,048; pets $752; personal care
   * $782; education $429; miscellaneous $973 (includes a $1 rounding
   * remainder so the three slices reconstruct $31,440). Total $11,497 / 12.
   */
  nonHousingOtherServicesMonthly: constant({
    value: 958.083333,
    unit: "USD per month",
    kind: "measured",
    source:
      "BLS CE 2024, 65+: other-services categories inside the $31,440 " +
      "remainder, / 12",
    sourceUrl: "https://fred.stlouisfed.org/release/tables?eid=1198958&rid=479",
    sourcedOn: "2026-08-18",
    refresh: "annual",
  }),

  /**
   * Cash contributions plus personal insurance and pensions. These sit in the
   * BLS 65+ mean but are not local consumption, so they are *not* scaled by
   * RPP. $3,158 + $3,480 = $6,638 / 12.
   */
  nonHousingUnscaledMonthly: constant({
    value: 553.166667,
    unit: "USD per month",
    kind: "measured",
    source:
      "BLS CE 2024, 65+: cash contributions $3,158 plus personal insurance " +
      "and pensions $3,480, / 12",
    sourceUrl: "https://fred.stlouisfed.org/release/tables?eid=1198958&rid=479",
    sourcedOn: "2026-08-18",
    refresh: "annual",
    note:
      "Kept so the typical/mean profile reconstructs the 65+ remainder. The " +
      "modest profile sets this slice to 0 — cash gifts and pension " +
      "withholding are not part of a get-by budget (see " +
      "modestNonHousingUnscaledMonthly).",
  }),

  /**
   * Modest non-housing/non-health remainder. Default spending profile.
   *
   * BLS Table 3254, 2021–2022 (latest 65+ × income cross-tab as of 2026-08-18):
   * consumer units with reference person 65+ and income $15,000–$29,999.
   * Mean income $22,114 — around Social Security plus a small pension — and
   * the largest 65+ income group (10.1M of 36.5M CUs). Total expenditures
   * $36,583 minus housing $14,169 minus healthcare $5,573 = $16,841. Cash
   * contributions $3,160 and personal insurance/pensions $481 are then
   * removed (they are not local get-by consumption; Elder Index omits them),
   * leaving $13,200 / 12.
   */
  modestNonHousingBaseline65Plus: constant({
    value: 1100,
    unit: "USD per month",
    kind: "measured",
    source:
      "BLS CE Table 3254, 2021–2022, 65+ with income $15,000–$29,999: " +
      "non-housing/non-health remainder after dropping cash contributions " +
      "and pensions, / 12",
    sourceUrl:
      "https://www.bls.gov/cex/tables/cross-tab/mean/reference-person-age-by-income-65-or-older-2021-2022.pdf",
    sourcedOn: "2026-08-18",
    refresh: "annual",
    note:
      "Latest published 65+ × income table; 2022–2023 and 2023–2024 files " +
      "are not posted yet. Two-year mean, not the 2024 calendar-year 65+ " +
      "mean used by the typical profile. Household size is 1.3 people vs " +
      "the Elder Index's one adult, so this slightly overstates a " +
      "single-veteran budget. Do not substitute the all-ages lowest quintile.",
  }),

  /**
   * Modest goods slice. Same BLS-to-BEA mapping as the typical goods constant.
   *
   * Annual: food at home $3,353; alcoholic beverages $249; apparel $546;
   * vehicle purchases $1,602; gasoline $1,081; reading $117; tobacco $243;
   * entertainment toys/hobbies $73; entertainment other supplies $248.
   * Total $7,512 / 12.
   */
  modestNonHousingGoodsMonthly: constant({
    value: 626,
    unit: "USD per month",
    kind: "measured",
    source:
      "BLS CE Table 3254, 2021–2022, 65+ $15,000–$29,999: goods categories " +
      "inside the modest remainder, / 12",
    sourceUrl:
      "https://www.bls.gov/cex/tables/cross-tab/mean/reference-person-age-by-income-65-or-older-2021-2022.pdf",
    sourcedOn: "2026-08-18",
    refresh: "annual",
  }),

  /**
   * Modest other-services slice. $1 rounding remainder assigned here so
   * goods + services reconstruct $13,200.
   *
   * Annual: food away $1,184; other vehicle expenses $1,887; public
   * transportation $186; entertainment fees $162; audio/visual $769; pets
   * $327; personal care $410; education $70; miscellaneous $693.
   * Total $5,688 / 12.
   */
  modestNonHousingOtherServicesMonthly: constant({
    value: 474,
    unit: "USD per month",
    kind: "measured",
    source:
      "BLS CE Table 3254, 2021–2022, 65+ $15,000–$29,999: other-services " +
      "categories inside the modest remainder, / 12",
    sourceUrl:
      "https://www.bls.gov/cex/tables/cross-tab/mean/reference-person-age-by-income-65-or-older-2021-2022.pdf",
    sourcedOn: "2026-08-18",
    refresh: "annual",
  }),

  /**
   * Modest unscaled slice. Zero: cash contributions and pension withholding
   * in this income group are not a get-by local price.
   */
  modestNonHousingUnscaledMonthly: constant({
    value: 0,
    unit: "USD per month",
    kind: "measured",
    source:
      "BLS CE Table 3254, 2021–2022, 65+ $15,000–$29,999: cash contributions " +
      "$3,160 plus personal insurance and pensions $481 are omitted from " +
      "the modest profile",
    sourceUrl:
      "https://www.bls.gov/cex/tables/cross-tab/mean/reference-person-age-by-income-65-or-older-2021-2022.pdf",
    sourcedOn: "2026-08-18",
    refresh: "annual",
    note:
      "The typical profile keeps this slice so the 65+ mean reconstructs. " +
      "Modest drops it rather than scaling a charity/pension average.",
  }),

  /**
   * Modest owner utilities. Same BLS table and income column as the modest
   * remainder; owners only, scaled by BEA utilities RPP.
   */
  modestNationalUtilitiesMonthly: constant({
    value: 259.333333,
    unit: "USD per month",
    kind: "measured",
    source:
      "BLS CE Table 3254, 2021–2022, 65+ $15,000–$29,999: utilities, fuels, " +
      "and public services $3,112 / 12",
    sourceUrl:
      "https://www.bls.gov/cex/tables/cross-tab/mean/reference-person-age-by-income-65-or-older-2021-2022.pdf",
    sourcedOn: "2026-08-18",
    refresh: "annual",
  }),

  /**
   * National median home value, used to normalize each city's housing index to
   * 100. A city at exactly this value gets housingIndex = 100.
   */
  nationalMedianHomeValue: constant({
    value: 372995,
    unit: "USD",
    kind: "measured",
    source:
      "Zillow Home Value Index (ZHVI), all homes incl. single-family, condo " +
      "and co-op, United States — observation for June 2026",
    sourceUrl: "https://fred.stlouisfed.org/series/USAUCSFRCONDOSMSAMID",
    sourcedOn: "2026-08-11",
    refresh: "monthly",
    note:
      "Observation month is June 2026 (ZHVI publishes with a lag); sourcedOn " +
      "is merely when it was looked up. Refresh the observation, not just the " +
      "date.\n" +
      "ZHVI is the TYPICAL home value (35th-65th percentile), which is the " +
      "right counterpart to avg_home_value — lib/housing-market.ts shows this " +
      "project's home values are Zillow-derived, so the two are like-for-like. " +
      "Do not substitute a median SALE price: it is a different population " +
      "(homes that transacted) and would shift every city's housing index in " +
      "the same direction.",
  }),

  /** Standard Medicare Part B monthly premium. Does not vary by location. */
  medicarePartBMonthly: constant({
    value: 202.9,
    unit: "USD per month",
    kind: "measured",
    source:
      "CMS standard Medicare Part B premium for calendar year 2026 " +
      "(up 9.7% from $185.00 in 2025)",
    sourceUrl:
      "https://www.federalregister.gov/documents/2025/11/19/2025-20251/medicare-program-medicare-part-b-monthly-actuarial-rates-premium-rates-and-annual-deductible",
    sourcedOn: "2026-08-11",
    refresh: "annual",
    note:
      "The STANDARD premium only. Two ways a real person pays something else, " +
      "both of which this model ignores:\n" +
      "- IRMAA surcharges apply above an income threshold that fixed-income " +
      "retirees are generally below, so omitting them is safe here.\n" +
      "- The hold-harmless rule caps the premium increase at a beneficiary's " +
      "Social Security COLA, so some retirees pay LESS than the standard " +
      "figure. That makes this constant mildly conservative.\n" +
      "Excludes the $283 annual Part B deductible, which is not a monthly cost.",
  }),

  /**
   * Average Medigap (Medicare Supplement) premium across all plan types. Split
   * out from the former combined `supplementalHealthMonthly` so the
   * `va_primary` HealthCoverage path (lib/affordability.ts) can drop this
   * specific premium while Part D keeps its own line.
   */
  medigapMonthly: constant({
    value: 217,
    unit: "USD per month",
    kind: "measured",
    source: "KFF: average Medigap premium across all plans, 2023 analysis",
    sourceUrl:
      "https://www.kff.org/medicare/issue-brief/key-facts-about-medigap-enrollment-and-premiums-for-medicare-beneficiaries/",
    sourcedOn: "2026-08-25",
    refresh: "annual",
    note:
      "MIXED VINTAGE: this is KFF's 2023 analysis, the newest published " +
      "average found; Medigap has risen since, so this understates slightly.\n" +
      "Only applies to the default `medicare_supplement` HealthCoverage " +
      "choice. Many veterans use VA healthcare and carry no Medigap — the " +
      "`va_primary` path drops this premium entirely as a household coverage " +
      "choice, not a geography one. Carrying VA health care does not by " +
      "itself mean Medigap was dropped, which is why this is opt-in rather " +
      "than inferred from a city's VA access.",
  }),

  /**
   * Average stand-alone Part D (prescription drug) premium. Split out from
   * the former combined `supplementalHealthMonthly` for the same reason as
   * `medigapMonthly`.
   */
  partDMonthly: constant({
    value: 36,
    unit: "USD per month",
    kind: "measured",
    source: "KFF: average stand-alone Part D premium for 2026",
    sourceUrl:
      "https://www.kff.org/medicare/medicare-part-d-enrollment-premiums-and-cost-sharing-in-2026/",
    sourcedOn: "2026-08-11",
    refresh: "annual",
    note:
      "Only applies to the default `medicare_supplement` HealthCoverage " +
      "choice. VA drug coverage counts as Medicare creditable prescription " +
      "drug coverage, so the `va_primary` path drops this premium too, " +
      "without modeling a late-enrollment penalty while that VA coverage " +
      "continues.",
  }),

  /*
   * TRICARE retiree enrollment fees, CY2026 (issue #108 Phase 3). Modeled at
   * GROUP A (initial service before 2018-01-01): in 2026 essentially every
   * already-retired 20-year retiree is Group A — the earliest 20-year Group B
   * retirees appear around 2038. Group B pays more; that is disclosed via
   * missingContext, not priced.
   *
   * These are PER-PLAN fees, not per-person: a couple (two enrolled
   * beneficiaries) pays the FAMILY rate, never 2x the individual rate (DHA
   * TRICARE For Life Program Manager, DVIDS Q&A 2026-02-26,
   * https://www.dvidshub.net/news/558968/). TRICARE For Life needs no
   * constant here: no enrollment fee, each beneficiary pays Medicare Part B
   * (medicarePartBMonthly).
   *
   * Fact sheets publish ANNUAL fees; monthly = annual / 12, which is faithful
   * because TRICARE bills monthly by allotment.
   */

  /** TRICARE Prime, Group A retiree, individual: $381.96/yr. */
  tricarePrimeIndividualMonthly: constant({
    value: 31.83,
    unit: "USD per month",
    kind: "measured",
    source:
      "DHA, TRICARE 2026 Costs and Fees fact sheet (May 2026, FS410G260526WP): " +
      "Prime Group A retiree $381.96 per individual per year, / 12",
    sourceUrl:
      "https://tricare.mil/-/media/Files/TRICARE/Publications/FactSheets/Costs_Fees.pdf",
    sourcedOn: "2026-08-25",
    refresh: "annual",
    note:
      "Group B (service on/after 2018-01-01) pays $462.96/yr — not modeled. " +
      "Prime copays (e.g. $26 primary care, Group A) and the catastrophic cap " +
      "are not estimated; disclosed via missingContext.",
  }),

  /** TRICARE Prime, Group A retiree, family: $765.00/yr. */
  tricarePrimeFamilyMonthly: constant({
    value: 63.75,
    unit: "USD per month",
    kind: "measured",
    source:
      "DHA, TRICARE 2026 Costs and Fees fact sheet: Prime Group A retiree " +
      "$765.00 per family per year, / 12",
    sourceUrl:
      "https://tricare.mil/-/media/Files/TRICARE/Publications/FactSheets/Costs_Fees.pdf",
    sourcedOn: "2026-08-25",
    refresh: "annual",
    note:
      "One fee per enrolled family of two or more, per the DHA family-rate " +
      "rule — the couple path uses this, never 2x the individual fee.",
  }),

  /** TRICARE Select, Group A retiree, individual: $186.96/yr. */
  tricareSelectIndividualMonthly: constant({
    value: 15.58,
    unit: "USD per month",
    kind: "measured",
    source:
      "DHA, TRICARE 2026 Costs and Fees fact sheet: Select Group A retiree " +
      "$186.96 per individual per year, / 12",
    sourceUrl:
      "https://tricare.mil/-/media/Files/TRICARE/Publications/FactSheets/Costs_Fees.pdf",
    sourcedOn: "2026-08-25",
    refresh: "annual",
    note:
      "Group B pays $594.96/yr — not modeled. Select also carries an annual " +
      "deductible ($150/$300 Group A) and per-visit cost-shares (e.g. $38 " +
      "network primary care); disclosed via missingContext, not priced.",
  }),

  /** TRICARE Select, Group A retiree, family: $375.00/yr. */
  tricareSelectFamilyMonthly: constant({
    value: 31.25,
    unit: "USD per month",
    kind: "measured",
    source:
      "DHA, TRICARE 2026 Costs and Fees fact sheet: Select Group A retiree " +
      "$375.00 per family per year, / 12",
    sourceUrl:
      "https://tricare.mil/-/media/Files/TRICARE/Publications/FactSheets/Costs_Fees.pdf",
    sourcedOn: "2026-08-25",
    refresh: "annual",
  }),

  /**
   * FALLBACK effective property tax rate, used only when a city has no
   * `property_tax_rate` of its own. Per-city data is a P0 ingestion task; until
   * it lands this keeps the ownership paths computable, and any city using it
   * is flagged in `approximations` so the UI can say so.
   */
  fallbackPropertyTaxRate: constant({
    value: 0.0099,
    unit: "fraction of home value per year",
    kind: "measured",
    source:
      "US average effective property tax rate ~0.99% of home value, 2026 " +
      "estimates aligned to Tax Foundation state analysis and Census ACS " +
      "(annual taxes paid / home value)",
    sourceUrl: "https://taxfoundation.org/data/all/state/property-taxes-by-state-county/",
    sourcedOn: "2026-08-11",
    refresh: "annual",
    note:
      "A national average hides enormous variation — roughly 0.29% in Hawaii " +
      "to 1.88% in New Jersey and Illinois, a 6-7x spread — so any city " +
      "relying on this fallback has a materially less trustworthy estimate and " +
      "is flagged in `approximations`. This is why per-city property_tax_rate " +
      "is P0; see issue #43.",
  }),

  /**
   * Annual home maintenance as a fraction of home value. This is a planning
   * convention, not a measured statistic — labeled `convention` so it reads as
   * what it is.
   */
  annualMaintenanceRate: constant({
    value: 0.01,
    unit: "fraction of home value per year",
    kind: "convention",
    source:
      "The widely used 1%-of-home-value-per-year planning rule of thumb. Not a " +
      "measured statistic — chosen as the most common convention.",
    sourceUrl: null,
    sourcedOn: "2026-08-11",
    refresh: "rare",
    note:
      "Not a measurement. Older homes and harsh climates run higher. Because " +
      "it scales with home value it quietly penalizes expensive cities — " +
      "worth revisiting if the ground-truth check shows systematic bias.",
  }),

  /**
   * Monthly utilities, fuels, and public services for a 65+ household —
   * electricity, gas, water, sewer, trash.
   *
   * ADDED FOR OWNERS ONLY, and the asymmetry is the whole point. A renter's
   * median GROSS rent (ACS B25064) already bundles utilities, and the
   * non-housing baseline excludes them because BLS files utilities under
   * housing. So without this term owners were charged utilities zero times
   * while renters were charged once, making owning look several hundred dollars
   * a month cheaper than it is.
   */
  nationalUtilitiesMonthly: constant({
    value: 373.33,
    unit: "USD per month",
    kind: "measured",
    source:
      "BLS Consumer Expenditure Survey 2024, utilities/fuels/public services " +
      "for reference person 65+: $4,480/yr, / 12",
    sourceUrl: "https://fred.stlouisfed.org/series/CXUUTILSLB0407M",
    sourcedOn: "2026-08-11",
    refresh: "annual",
    note:
      "Same BLS release and same age group as nonHousingBaseline65Plus, so " +
      "utilities are counted exactly once: excluded from the baseline (BLS " +
      "files them under housing) and added back explicitly for owners only.\n" +
      "The owner term is scaled by the city's BEA utilities RPP. Renters do " +
      "not use this constant: ACS B25064 gross rent already includes utilities.\n" +
      "The modest profile uses modestNationalUtilitiesMonthly from the 65+ " +
      "by-income table instead of this 65+ mean.",
  }),

  /**
   * The dwelling coverage amount the homeowners premiums in lib/insurance.ts
   * are quoted at. Read it off that dataset's documented `profile` string —
   * do not guess. Every city's insurance figure is scaled relative to this, so
   * a wrong value shifts all of them in the same direction.
   */
  insuranceBenchmarkDwelling: constant({
    value: 300000,
    unit: "USD of dwelling coverage",
    kind: "measured",
    source:
      'lib/insurance.ts -> HOME_INSURANCE_DATASET.profile: "$300K dwelling, ' +
      '$300K liability, $1K deductible, good credit; 2% hurricane deductible ' +
      'where applicable." (dataVintage: 2026 standardized benchmark)',
    sourceUrl: null,
    sourcedOn: "2026-08-11",
    refresh: "rare",
    note:
      "Sourced from inside the repo — no external lookup. sourceUrl is null " +
      "because the source is a file, not a URL.\n" +
      "If HOME_INSURANCE_DATASET is ever re-benchmarked at a different dwelling " +
      "amount, this MUST change with it: every city's insurance figure is " +
      "scaled relative to this number, so a stale value biases them all the " +
      "same way.",
  }),

  /**
   * Share of a home's market value that is the insurable STRUCTURE rather than
   * the land. Insurance is priced on replacement cost, so market value has to
   * be discounted before scaling a premium by it.
   */
  structureShareOfValue: constant({
    value: 0.7,
    unit: "fraction 0..1",
    kind: "convention",
    source:
      "Convention: land is commonly taken as roughly 20-30% of residential " +
      "market value, leaving ~70% as insurable structure. Not measured.",
    sourceUrl: null,
    sourcedOn: "2026-08-11",
    refresh: "rare",
    note:
      "Genuinely market-specific: land is a small share of value in Forest, MS " +
      "and a large share in Boulder, CO, so a single national number " +
      "systematically overcharges insurance in expensive metros. Acceptable as " +
      "a v1 stand-in; revisit if the ground-truth check shows expensive cities " +
      "reading high.",
  }),

  /** 30-year fixed mortgage rate, for the `buying` tenure only. */
  mortgageRate30yr: constant({
    value: 0.0669,
    unit: "annual fraction, e.g. 0.065 for 6.5%",
    kind: "measured",
    source:
      "Freddie Mac Primary Mortgage Market Survey, 30-year FRM average — " +
      "week of 2026-08-06",
    sourceUrl: "https://www.freddiemac.com/pmms",
    sourcedOn: "2026-08-11",
    refresh: "monthly",
    note:
      "A WEEKLY series, so this goes stale faster than anything else here. " +
      "PMMS assumes 20% down and excellent credit, which matches " +
      "defaultDownPaymentFraction but flatters a borrower who does not.\n" +
      "Only the `buying` tenure reads this. Retirees buying after a home sale " +
      "often pay cash, in which case own_outright is the right tenure and this " +
      "constant is irrelevant to them.",
  }),

  /** Default down payment fraction for the `buying` tenure. */
  defaultDownPaymentFraction: constant({
    value: 0.2,
    unit: "fraction 0..1",
    kind: "convention",
    source:
      "Product decision: 20%, matching the borrower profile Freddie Mac's PMMS " +
      "assumes, so the rate and the down payment describe the same buyer.",
    sourceUrl: null,
    sourcedOn: "2026-08-11",
    refresh: "rare",
    note:
      "Many retirees buying after selling a home put down far more than a " +
      "conventional 20%. Consider letting the user override this in the UI; " +
      "the model accepts a per-call override already.",
  }),

  /*
   * COUPLE INTERPOLATION ANCHORS (issue #108). BLS publishes NO "married
   * couples only x 65+" expenditure table — the full cross-tab index was
   * enumerated on 2026-08-25 and the composition-of-CU family has no age
   * cut. The measured substitute is the CU-size x age pair from one
   * publication: Table 3600 (one-person CUs, 65+) and Table 3620 (two-person
   * CUs, 65+), CE 2021-2022 — the SAME vintage as the modest profile's
   * Table 3254, a deliberate mismatch with the 2024 typical anchors. Only
   * the RATIO structure of these sums is used, never their dollar levels,
   * which limits the vintage-mismatch damage to relative shape.
   *
   * WHY RAW SUMS AND NOT A PRE-BAKED COUPLE RATIO: the existing baskets
   * describe the AVERAGE 65+ consumer unit at each profile — about 1.3
   * people for modest, more for typical — not a one-person household.
   * Multiplying such a base by the raw two-over-one-person ratio (~2x)
   * double-counts the extra people already inside the base and overstates a
   * couple by tens of percent. Instead, coupleSliceMultipliers() interpolates
   * each slice linearly in household size between the one-person and
   * two-person sums, evaluates the base at its own published size, and takes
   * couple = twoPerson / interpolated(base). That lands the effective couple
   * multipliers near 1.4-1.5 — independently corroborated by the Elder
   * Index 2025 needs-based couple/single ratio of ~1.35 (elderindex.org).
   *
   * KNOWN LIMITS, by construction (surfaced via missingContext, not hidden):
   * two-person 65+ CUs are ~85% couples but include elder-plus-adult-child
   * pairs, and they have 2.28x the pre-tax income of one-person 65+ CUs
   * ($75,477 vs $33,114), so the shape is partly an income effect, not
   * purely a second-person effect. Category cells suppressed by BLS
   * (RSE >= 25%) on either side are excluded from BOTH sides of a sum.
   */

  /**
   * One-person 65+ goods-category annual sum: food at home $3,086; alcohol
   * $344; apparel $719; vehicle purchases $1,341; gasoline $998; reading
   * $130; tobacco $183; entertainment toys/hobbies $89. Other entertainment
   * supplies suppressed on both sides and excluded.
   */
  onePerson65GoodsAnnual: constant({
    value: 6890,
    unit: "USD per year",
    kind: "measured",
    source:
      "BLS CE 2021-2022, Table 3600 (one-person CUs by age of reference " +
      "person), 65+ column: goods-category sum",
    sourceUrl:
      "https://www.bls.gov/cex/tables/cross-tab/mean/cu-size-by-age-1-person-2021-2022.pdf",
    sourcedOn: "2026-08-25",
    refresh: "annual",
    note:
      "Used only as an interpolation anchor by coupleSliceMultipliers(); " +
      "never added into a budget as dollars. 2023-2024 exists only as XLSX; " +
      "refresh all eight one/two-person sums together.",
  }),

  /**
   * Two-person 65+ goods-category annual sum: food at home $5,615; alcohol
   * $660; apparel $1,280; vehicle purchases $3,580; gasoline $2,188;
   * reading $169; tobacco $238; entertainment toys/hobbies $139.
   */
  twoPerson65GoodsAnnual: constant({
    value: 13869,
    unit: "USD per year",
    kind: "measured",
    source:
      "BLS CE 2021-2022, Table 3620 (two-person CUs by age of reference " +
      "person), 65+ column: goods-category sum",
    sourceUrl:
      "https://www.bls.gov/cex/tables/cross-tab/mean/cu-size-by-age-2-persons-2021-2022.pdf",
    sourcedOn: "2026-08-25",
    refresh: "annual",
  }),

  /**
   * One-person 65+ other-services annual sum: food away $1,357; other
   * vehicle expenses $1,890; public transportation $256; entertainment fees
   * $208; audio/visual $818; pets $446; personal care $439; miscellaneous
   * $750. Education suppressed on the one-person side and excluded from
   * both sides.
   */
  onePerson65OtherServicesAnnual: constant({
    value: 6164,
    unit: "USD per year",
    kind: "measured",
    source:
      "BLS CE 2021-2022, Table 3600, 65+ column: other-services category sum",
    sourceUrl:
      "https://www.bls.gov/cex/tables/cross-tab/mean/cu-size-by-age-1-person-2021-2022.pdf",
    sourcedOn: "2026-08-25",
    refresh: "annual",
  }),

  /**
   * Two-person 65+ other-services annual sum: food away $2,843; other
   * vehicle $3,533; public transportation $631; entertainment fees $696;
   * audio/visual $1,207; pets $894; personal care $836; miscellaneous
   * $1,045 (education excluded to mirror the one-person side).
   */
  twoPerson65OtherServicesAnnual: constant({
    value: 11685,
    unit: "USD per year",
    kind: "measured",
    source:
      "BLS CE 2021-2022, Table 3620, 65+ column: other-services category sum",
    sourceUrl:
      "https://www.bls.gov/cex/tables/cross-tab/mean/cu-size-by-age-2-persons-2021-2022.pdf",
    sourcedOn: "2026-08-25",
    refresh: "annual",
  }),

  /** One-person 65+ utilities, fuels, and public services, annual. */
  onePerson65UtilitiesAnnual: constant({
    value: 2985,
    unit: "USD per year",
    kind: "measured",
    source: "BLS CE 2021-2022, Table 3600, 65+ column: utilities line",
    sourceUrl:
      "https://www.bls.gov/cex/tables/cross-tab/mean/cu-size-by-age-1-person-2021-2022.pdf",
    sourcedOn: "2026-08-25",
    refresh: "annual",
    note:
      "Two people in one dwelling do not double the utility bill — the " +
      "two-over-one ratio here is 1.62 vs ~2.0 for goods, which is exactly " +
      "why utilities interpolate separately.",
  }),

  /** Two-person 65+ utilities, fuels, and public services, annual. */
  twoPerson65UtilitiesAnnual: constant({
    value: 4822,
    unit: "USD per year",
    kind: "measured",
    source: "BLS CE 2021-2022, Table 3620, 65+ column: utilities line",
    sourceUrl:
      "https://www.bls.gov/cex/tables/cross-tab/mean/cu-size-by-age-2-persons-2021-2022.pdf",
    sourcedOn: "2026-08-25",
    refresh: "annual",
  }),

  /**
   * One-person 65+ unscaled slice: cash contributions $2,602 plus personal
   * insurance and pensions $1,234. Only the typical profile carries a
   * non-zero unscaled slice; modest stays 0 for couples too.
   */
  onePerson65UnscaledAnnual: constant({
    value: 3836,
    unit: "USD per year",
    kind: "measured",
    source:
      "BLS CE 2021-2022, Table 3600, 65+ column: cash contributions plus " +
      "personal insurance and pensions",
    sourceUrl:
      "https://www.bls.gov/cex/tables/cross-tab/mean/cu-size-by-age-1-person-2021-2022.pdf",
    sourcedOn: "2026-08-25",
    refresh: "annual",
  }),

  /** Two-person 65+ unscaled slice: $5,705 + $4,252. */
  twoPerson65UnscaledAnnual: constant({
    value: 9957,
    unit: "USD per year",
    kind: "measured",
    source:
      "BLS CE 2021-2022, Table 3620, 65+ column: cash contributions plus " +
      "personal insurance and pensions",
    sourceUrl:
      "https://www.bls.gov/cex/tables/cross-tab/mean/cu-size-by-age-2-persons-2021-2022.pdf",
    sourcedOn: "2026-08-25",
    refresh: "annual",
  }),

  /**
   * Average people per consumer unit behind the MODEST baskets (Table 3254,
   * 65+ x income $15k-$30k). The size the interpolation evaluates the
   * modest base at.
   */
  modestHouseholdSize: constant({
    value: 1.3,
    unit: "people per consumer unit",
    kind: "measured",
    source:
      "BLS CE Table 3254, 2021-2022, 65+ with income $15,000-$29,999: " +
      "average number in consumer unit (people)",
    sourceUrl:
      "https://www.bls.gov/cex/tables/cross-tab/mean/reference-person-age-by-income-65-or-older-2021-2022.pdf",
    sourcedOn: "2026-08-25",
    refresh: "annual",
    note:
      "Read directly from the published table (which also re-confirmed every " +
      "existing modest-profile figure). Same column's 'Adults 65 and older' " +
      "is 1.2 — part of the extra 0.3 is a younger co-resident, not a spouse.",
  }),

  /**
   * Average people per consumer unit behind the TYPICAL baskets (CE 2024,
   * all 65+ CUs). The size the interpolation evaluates the typical base at.
   */
  typicalHouseholdSize: constant({
    value: 1.8,
    unit: "people per consumer unit",
    kind: "measured",
    source:
      "BLS CE 2024 calendar year, reference person 65+: average number in " +
      "consumer unit (people), series CXU980010LB0407M — same database, " +
      "vintage, and demographic code (LB0407) as nonHousingBaseline65Plus",
    sourceUrl:
      "https://api.bls.gov/publicAPI/v2/timeseries/data/CXU980010LB0407M?latest=true",
    sourcedOn: "2026-08-25",
    refresh: "annual",
    note:
      "Item code 980010 = people-per-CU was verified by degenerate " +
      "identities: the one-person-CU series returns exactly 1.0 and the " +
      "two-person-CU series exactly 2.0 for 2024. The 2021-2022 two-year " +
      "mean shows 1.7; 1.8 is used because the typical baskets are CY2024.",
  }),
};

export type CostConstantKey = keyof typeof COST_CONSTANTS;

/** Every constant that still has `value: null`. */
export function missingConstants(): CostConstantKey[] {
  return (Object.keys(COST_CONSTANTS) as CostConstantKey[]).filter(
    (k) => COST_CONSTANTS[k].value === null
  );
}

/** All constants resolved to plain numbers, once every one has been sourced. */
export type ResolvedConstants = Record<CostConstantKey, number>;

export type ConstantsResolution =
  | { ok: true; constants: ResolvedConstants }
  | { ok: false; missing: CostConstantKey[] };

/**
 * Narrow the nullable constant table to plain numbers, or report what is still
 * unsourced. Returning a discriminated union (rather than throwing, or
 * defaulting to zeros) is deliberate: it makes "Phase 0 is incomplete" a state
 * the callers must handle explicitly, so an unsourced constant can never be
 * silently treated as 0 and quietly produce a confident wrong answer.
 */
export function resolveCostConstants(): ConstantsResolution {
  const missing = missingConstants();
  if (missing.length > 0) return { ok: false, missing };

  const out = {} as ResolvedConstants;
  for (const key of Object.keys(COST_CONSTANTS) as CostConstantKey[]) {
    out[key] = COST_CONSTANTS[key].value as number;
  }
  return { ok: true, constants: out };
}

/**
 * Which national spending basket the model scales.
 *
 * `modest` is BLS 65+ by income ($15k–$30k) — "what does it take to get by?"
 * `typical` is the BLS 65+ mean — "what does the average retiree household spend?"
 * Callers must pick one; the engine never silently swaps them.
 */
export type SpendingProfile = "modest" | "typical";

export const DEFAULT_SPENDING_PROFILE: SpendingProfile = "modest";

/**
 * Who the estimate prices. `single` is the existing behavior: each profile's
 * published basket, which describes the AVERAGE consumer unit at that
 * profile (slightly more than one person), plus one person's premiums.
 * `couple` scales the consumption slices via coupleSliceMultipliers() and
 * doubles the per-person Medicare premiums.
 */
export type Household = "single" | "couple";

export const DEFAULT_HOUSEHOLD: Household = "single";

export interface SpendingSlices {
  goodsMonthly: number;
  otherServicesMonthly: number;
  unscaledMonthly: number;
  utilitiesMonthly: number;
}

/**
 * Per-slice couple multipliers for a profile.
 *
 * Each slice is interpolated linearly in household size between the measured
 * one-person and two-person 65+ sums; the profile's base is evaluated at its
 * own published size, and the multiplier is twoPerson / interpolated(base).
 * See the COUPLE INTERPOLATION ANCHORS comment above for why the raw 2/1
 * ratio must NOT be applied directly: the base already averages more than
 * one person, and double-counting them overstates a couple by tens of
 * percent.
 */
export function coupleSliceMultipliers(
  profile: SpendingProfile,
  c: ResolvedConstants
): SpendingSlices {
  const size =
    profile === "typical" ? c.typicalHouseholdSize : c.modestHouseholdSize;
  // Sizes are expected in [1, 2]. A future refresh above 2.0 would
  // extrapolate multipliers below 1 (a couple priced cheaper than the base)
  // — if the published average ever crosses 2, this construction needs a
  // rethink, not a clamp.
  const m = (onePerson: number, twoPerson: number): number => {
    const baseEquivalent = onePerson + (size - 1) * (twoPerson - onePerson);
    return baseEquivalent > 0 ? twoPerson / baseEquivalent : 1;
  };
  return {
    goodsMonthly: m(c.onePerson65GoodsAnnual, c.twoPerson65GoodsAnnual),
    otherServicesMonthly: m(
      c.onePerson65OtherServicesAnnual,
      c.twoPerson65OtherServicesAnnual
    ),
    unscaledMonthly: m(c.onePerson65UnscaledAnnual, c.twoPerson65UnscaledAnnual),
    utilitiesMonthly: m(c.onePerson65UtilitiesAnnual, c.twoPerson65UtilitiesAnnual),
  };
}

export function spendingSlices(
  profile: SpendingProfile,
  c: ResolvedConstants,
  household: Household = DEFAULT_HOUSEHOLD
): SpendingSlices {
  const base: SpendingSlices =
    profile === "typical"
      ? {
          goodsMonthly: c.nonHousingGoodsMonthly,
          otherServicesMonthly: c.nonHousingOtherServicesMonthly,
          unscaledMonthly: c.nonHousingUnscaledMonthly,
          utilitiesMonthly: c.nationalUtilitiesMonthly,
        }
      : {
          goodsMonthly: c.modestNonHousingGoodsMonthly,
          otherServicesMonthly: c.modestNonHousingOtherServicesMonthly,
          unscaledMonthly: c.modestNonHousingUnscaledMonthly,
          utilitiesMonthly: c.modestNationalUtilitiesMonthly,
        };
  if (household === "single") return base;
  const scale = coupleSliceMultipliers(profile, c);
  return {
    goodsMonthly: base.goodsMonthly * scale.goodsMonthly,
    otherServicesMonthly: base.otherServicesMonthly * scale.otherServicesMonthly,
    unscaledMonthly: base.unscaledMonthly * scale.unscaledMonthly,
    utilitiesMonthly: base.utilitiesMonthly * scale.utilitiesMonthly,
  };
}
