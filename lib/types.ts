/*
 * Shared types mirroring the existing Neon schema (Django `locations_location`
 * and `locations_stateinfo` tables). Keys are kept snake_case to line up 1:1
 * with the Django models and the ported scoring logic, minimizing porting bugs.
 *
 * Postgres `numeric` columns come back as strings from the driver; those are
 * typed as `string | null` and parsed where needed.
 */

export interface LocationRow {
  id: number;
  name: string;
  state: string;
  county: string | null;
  latitude?: number | null;
  longitude?: number | null;

  // Metrics / display
  climate: string | null;
  cost_of_living: string;
  tags: string[] | null; // jsonb
  emoji: string;
  gradient: string;
  featured: boolean;

  // Political
  /** Legacy duplicate; state-owned value should come from locations_stateinfo. */
  state_party: string | null;
  /** Legacy duplicate; state-owned value should come from locations_stateinfo. */
  governor: string | null;
  city_politics: string | null;
  election_2016: string | null;
  election_2016_percent: number | null;
  election_2024: string | null;
  election_2024_percent: number | null;
  election_change: string | null;

  // Demographics & economics
  population: string | null;
  density: number | null;
  sales_tax: string | null; // numeric
  /** Legacy duplicate; state-owned value should come from locations_stateinfo. */
  income_tax: string | null; // numeric
  col_index: number | null;

  // Veterans Affairs
  has_va: boolean | null;
  nearest_va: string | null;
  distance_to_va: string | null;
  /** Nearest VA medical center (parent facility), distinct from CBOC/clinic. */
  nearest_va_hospital: string | null;
  distance_to_va_hospital: string | null;
  /** Legacy duplicate; state-owned value should come from locations_stateinfo. */
  veterans_benefits: string | null;

  // Safety & social
  tci: number | null;
  /** Legacy duplicate; state-owned value should come from locations_stateinfo. */
  marijuana_status: string | null;
  lgbtq_rating: string | null;
  lgbtq_mei_score: number | null;
  /** Legacy duplicate; state-owned value should come from locations_stateinfo. */
  lgbtq_state_policy_score: string | null; // numeric
  lgbtq_score_source: string | null;

  // Economic hubs
  tech_hub: boolean | null;
  /** Derived: employer presence OR curation. See lib/defense.ts. */
  defense_hub: boolean | null;
  /** The hand-curated input to `defense_hub`; never written by employer sync. */
  defense_hub_manual: boolean | null;

  // Retail access
  has_walmart: boolean | null;
  has_costco: boolean | null;

  // Weather & climate
  snow_annual: number | null;
  rain_annual: number | null;
  sun_days: number | null;
  alw: number | null;
  avg_high_summer: number | null;
  humidity_summer: number | null;

  // Curated geography proximity facets used by Explore.
  near_lake?: boolean;
  near_ocean?: boolean;
  near_mountains?: boolean;
  vibes?: string[];

  // Other
  gas_price: string | null;
  description: string | null;
  avg_home_value: string | null; // numeric
  avg_home_value_display: string | null;
  crime: string | null;
  climate_category: string | null;

  /**
   * Approved current retirement pace from `location_pace_current`.
   * Null when unclassified or still in review. Not a column on locations_location.
   */
  pace_category: "urban" | "suburban" | "small_town" | "rural" | null;

  /**
   * Denormalized from `locations_stateinfo` on the location query, same as
   * pace_category above — not columns on locations_location.
   *
   * Carried on the row because take-home income depends on them (see
   * lib/income.ts) and the explore page filters client-side over locations
   * alone; threading a second table through filterAndSort would be a much
   * larger change for the same result.
   */
  retired_pay_tax?: RetiredPayTax | null;
  no_income_tax?: boolean | null;
  ss_tax_treatment?: "not_taxed" | "partial" | "taxed" | "unknown" | null;
  /** AGI at or below which the state exempts Social Security benefits. */
  ss_tax_threshold_single?: number | null;
  ss_tax_threshold_married?: number | null;
  /** Age at year-end at or above which the SS exemption gate opens. */
  ss_tax_min_age?: number | null;
  /** If true, reaching ss_tax_min_age exempts SS regardless of AGI. */
  ss_tax_age_exempts_fully?: boolean | null;
  /**
   * General senior subtraction from state taxable income (not Social
   * Security-specific — see lib/income.ts and issue #58). Dollars per
   * qualifying individual; null means the state has no such deduction.
   */
  senior_deduction_amount?: number | null;
  /** Age at which a filer qualifies for senior_deduction_amount. */
  senior_deduction_min_age?: number | null;
  /** If true, each 65+ filer/spouse gets one unit of senior_deduction_amount. */
  senior_deduction_per_qualifying_person?: boolean | null;

  /** Monthly median gross rent, dollars. ACS 5-year B25064. */
  median_rent?: number | null;
  /** Effective annual property tax as a fraction of home value. */
  property_tax_rate?: number | null;
  /** BEA RPP components (100 = US average). Joined from location_cost_rpp. */
  goods_rpp?: number | null;
  housing_rpp?: number | null;
  utilities_rpp?: number | null;
  other_services_rpp?: number | null;
  bea_geo_type?: "msa" | "nonmetro_state" | null;
  bea_geo_code?: string | null;
  bea_geo_name?: string | null;
  rpp_vintage_year?: number | null;

  // Election trend
  rep_vote_share_change_pp: number | null;
  dem_vote_share_change_pp: number | null;
}

/** A location augmented with the runtime-computed editorial Fit score. */
export interface Location extends LocationRow {
  calculated_match_score: number;
}

/** How a state treats military retired pay for income-tax purposes. */
export type RetiredPayTax =
  | "no_income_tax"
  | "exempt"
  | "partial"
  | "conditional"
  | "taxed"
  | "unknown";

export interface StateInfoRow {
  state: string; // two-letter USPS abbreviation (primary key)
  magazine_limit: string | null;
  gifford_score: string | null;
  ghost_gun_ban: string | null;
  assault_weapons_ban: boolean | null;
  high_cap_mag_ban: boolean | null;

  /*
   * Veteran benefits. State-level facts — never duplicate these onto a location.
   *
   * The booleans are three-valued: `null` means the source summary was silent,
   * which is NOT the same as `false`. Filter with `=== true`, never `!== false`.
   */
  no_income_tax: boolean | null;
  retired_pay_tax: RetiredPayTax | null;
  disabled_vet_property_tax: boolean | null;
  employment_preference: boolean | null;
  education_benefit: boolean | null;
  parks_benefit: boolean | null;
  hunt_fish_benefit: boolean | null;
  vet_benefits_summary: string | null;
  /** Null until a human checks the row against a primary source. */
  vet_benefits_verified_on: string | null;

  /*
   * Optional until scripts/migrate-state-owned-fields.ts has been applied.
   * These are normalized state-owned replacements for legacy duplicated
   * locations_location columns.
   */
  state_party?: string | null;
  state_party_source_url?: string | null;
  state_party_verified_on?: string | null;
  governor?: string | null;
  governor_source_url?: string | null;
  governor_verified_on?: string | null;
  income_tax?: string | null;
  income_tax_semantics?: string | null;
  income_tax_source_url?: string | null;
  income_tax_verified_on?: string | null;
  marijuana_status?: string | null;
  marijuana_status_source_url?: string | null;
  marijuana_status_verified_on?: string | null;
  lgbtq_state_policy_score?: string | null;
  lgbtq_state_policy_source_url?: string | null;
  lgbtq_state_policy_verified_on?: string | null;

  senior_deduction_amount?: number | null;
  senior_deduction_min_age?: number | null;
  senior_deduction_per_qualifying_person?: boolean | null;
  senior_deduction_tax_year?: number | null;
  senior_deduction_source_status?: "official" | "calculated" | null;
  senior_deduction_source_url?: string | null;
  senior_deduction_verified_on?: string | null;
}

/**
 * One calendar month of weather normals for a city (`location_weather_monthly`).
 * 12 rows per location. Additive to the annual columns on `locations_location`,
 * which stay authoritative for scoring/filters. Numeric columns come back as
 * strings from the driver; parse where needed. All metrics nullable — a city
 * may have temperature normals but no humidity, etc.
 */
export interface WeatherMonthlyRow {
  id: number;
  location_id: number;
  month: number; // 1-12

  avg_high_f: string | null; // numeric
  avg_low_f: string | null; // numeric
  avg_temp_f: string | null; // numeric
  precip_in: string | null; // numeric
  snow_in: string | null; // numeric
  precip_days: number | null;
  humidity_pct: number | null;
  sun_pct: number | null;

  data_vintage: string | null;
  source_kind: string | null;
  source_url: string | null;
  source_retrieved_on: string | null;
}

/**
 * One hour of a calendar-month climate normal (`location_hourly_normals`).
 * These are station-backed moisture normals, intentionally separate from the
 * monthly temperature normals because the closest suitable NOAA station can
 * differ. Numeric columns are returned as strings by Neon.
 *
 * `temp_f` here is the moisture station's, which may be far from the city —
 * treat `location_weather_monthly` as authoritative for temperature.
 */
export interface HourlyWeatherNormalRow {
  id: number;
  location_id: number;
  month: number; // 1-12
  hour: number; // 0-23, local standard time

  temp_f: string | null; // numeric
  dew_point_f: string | null; // numeric
  dew_point_p10_f: string | null; // numeric
  dew_point_p90_f: string | null; // numeric
  heat_index_f: string | null; // numeric

  station_id: string;
  station_name: string | null;
  station_distance_mi: string; // numeric
  data_vintage: string | null;
  source_kind: string | null;
  source_url: string | null;
  source_retrieved_on: string | null;
}

/**
 * Annual AQI summary matched to a curated city. EPA AirData publishes these
 * annual summaries by county/CBSA rather than exact municipal boundary, so the
 * matched source geography is stored with every row.
 */
export interface AirQualityAnnualRow {
  id: number;
  location_id: number;
  year: number;
  source_geo_type: "county" | "cbsa" | "nearest_county";
  source_state_name: string;
  source_geo_name: string;
  source_distance_miles: string | null;

  days_with_aqi: number;
  good_days: number;
  moderate_days: number;
  unhealthy_sensitive_days: number;
  unhealthy_days: number;
  very_unhealthy_days: number;
  hazardous_days: number;
  max_aqi: number;
  p90_aqi: number;
  median_aqi: number;

  days_co: number;
  days_no2: number;
  days_ozone: number;
  days_pm25: number;
  days_pm10: number;

  data_vintage: string;
  source_kind: string;
  source_url: string;
  source_file: string;
  source_retrieved_on: string;
}

/** A filterable employer (`defense_employers`), e.g. Raytheon under parent RTX. */
export interface DefenseEmployerRow {
  id: number;
  slug: string;
  display_name: string;
  parent_company: string;
  sector: string;
  counts_as_defense: boolean;
  active: boolean;
}

/** One employer's footprint in one city (`defense_employer_locations`). */
export interface DefenseEmployerLocationRow {
  id: number;
  employer_id: number;
  /** Null when the city is not one of the curated retirement locations. */
  location_id: number | null;
  country: string;
  state: string;
  city: string;
  region_label: string;
  location_name: string | null;
  location_type: string | null;
  latitude: number | null;
  longitude: number | null;
  onsite_posting_count: number | null;
  hybrid_posting_count: number | null;
  remote_posting_count: number | null;
  total_posting_count: number | null;
  snapshot_date: string | null;
  source_kind: string | null;
  source_url: string | null;
  source_retrieved_on: string | null;
  is_featured: boolean;
  notes: string | null;
}
