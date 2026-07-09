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

  // Metrics / display
  climate: string | null;
  cost_of_living: string;
  tags: string[] | null; // jsonb
  emoji: string;
  gradient: string;
  featured: boolean;

  // Political
  state_party: string | null;
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
  income_tax: string | null; // numeric
  col_index: number | null;

  // Veterans Affairs
  has_va: boolean | null;
  nearest_va: string | null;
  distance_to_va: string | null;
  veterans_benefits: string | null;

  // Safety & social
  tci: number | null;
  marijuana_status: string | null;
  lgbtq_rating: string | null;
  lgbtq_mei_score: number | null;
  lgbtq_state_policy_score: string | null; // numeric
  lgbtq_score_source: string | null;

  // Economic hubs
  tech_hub: boolean | null;
  defense_hub: boolean | null;

  // Weather & climate
  snow_annual: number | null;
  rain_annual: number | null;
  sun_days: number | null;
  alw: number | null;
  avg_high_summer: number | null;
  humidity_summer: number | null;

  // Other
  gas_price: string | null;
  description: string | null;
  avg_home_value: string | null; // numeric
  avg_home_value_display: string | null;
  crime: string | null;
  climate_category: string | null;

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
}
