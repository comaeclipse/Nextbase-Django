/*
 * Household scenario for the affordability UI. Shared by /explore, the city
 * page, and the chat estimator so the same mix of income, tenure, and spending
 * profile drives every surface.
 */
import {
  COMFORT_COST_SHARE,
  type EstimateOptions,
  type HealthCoverage,
  type Household,
  type QuickCheck,
  type QuickVerdict,
  type SpendingProfile,
  type Tenure,
} from "./affordability";
import type { FilingStatus, IncomeKind, IncomeSource } from "./income";
import { COST_CONSTANTS } from "./cost-constants";
import { TAX_YEAR } from "./tax-constants";

/**
 * How much of take-home income may go to estimated costs and still count as
 * comfortable — the user's chosen cushion, named by the cushion size.
 */
export type CushionChoice = "breathing_room" | "comfortable" | "strong";

export interface AffordabilityScenario {
  vaDisability: string;
  militaryRetirement: string;
  socialSecurity: string;
  pensionOrIra: string;
  wages: string;
  filing: FilingStatus;
  age65Plus: boolean;
  spouse65Plus: boolean;
  tenure: Tenure;
  spendingProfile: SpendingProfile;
  healthCoverage: HealthCoverage;
  cushion: CushionChoice;
  /*
   * Housing overrides (detailed mode, ownership tenures). Free-text like the
   * income fields; blank means "use the model's default" — the city's typical
   * home value, the sourced 20% down / Freddie Mac rate, the city's property
   * tax rate, and no HOA.
   */
  homePrice: string;
  downPaymentPct: string;
  mortgageRatePct: string;
  propertyTaxPct: string;
  hoaMonthly: string;
}

export const DEFAULT_AFFORDABILITY_SCENARIO: AffordabilityScenario = {
  vaDisability: "",
  militaryRetirement: "",
  socialSecurity: "",
  pensionOrIra: "",
  wages: "",
  filing: "single",
  age65Plus: true,
  spouse65Plus: false,
  tenure: "own_outright",
  spendingProfile: "modest",
  healthCoverage: "medicare_supplement",
  cushion: "comfortable",
  homePrice: "",
  downPaymentPct: "",
  mortgageRatePct: "",
  propertyTaxPct: "",
  hoaMonthly: "",
};

export const INCOME_FIELDS: {
  key: keyof Pick<
    AffordabilityScenario,
    | "vaDisability"
    | "militaryRetirement"
    | "socialSecurity"
    | "pensionOrIra"
    | "wages"
  >;
  kind: IncomeKind;
  label: string;
  hint: string;
}[] = [
  {
    key: "vaDisability",
    kind: "va_disability",
    label: "VA disability",
    hint: "Untaxed federally and in every state",
  },
  {
    key: "militaryRetirement",
    kind: "military_retirement",
    label: "Military retired pay",
    hint: "State treatment varies",
  },
  {
    key: "socialSecurity",
    kind: "social_security",
    label: "Social Security",
    hint: "Federal tax only above a threshold",
  },
  {
    key: "pensionOrIra",
    kind: "pension_or_ira",
    label: "Pension / IRA",
    hint: "Taxed as ordinary income",
  },
  {
    key: "wages",
    kind: "wages",
    label: "Wages",
    hint: "Includes FICA",
  },
];

export const TENURE_OPTIONS: { id: Tenure; label: string; hint: string }[] = [
  { id: "rent", label: "Rent", hint: "Median gross rent, utilities included" },
  {
    id: "own_outright",
    label: "Own, paid off",
    hint: "Taxes, insurance, maintenance, utilities",
  },
  {
    id: "buying",
    label: "Buying",
    hint: "20% down, 30-year mortgage at current rates",
  },
];

export const PROFILE_OPTIONS: {
  id: SpendingProfile;
  label: string;
  hint: string;
}[] = [
  // Labels describe the BUDGET, never the person — "Getting by" / "Typical
  // retiree" read as judgments about the reader, and both flow into prose
  // ("at modest spending"), so they must work lowercased mid-sentence too.
  {
    id: "modest",
    label: "Modest",
    hint: "A leaner budget — BLS 65+ households earning $15k–$30k",
  },
  {
    id: "typical",
    label: "Average",
    hint: "Average spending across all BLS 65+ households",
  },
];

export const HEALTH_COVERAGE_OPTIONS: {
  id: HealthCoverage;
  label: string;
  hint: string;
}[] = [
  {
    id: "medicare_supplement",
    label: "Medicare + supplement",
    hint: "Part B, Medigap, and Part D",
  },
  {
    id: "va_primary",
    label: "VA primary care",
    hint: "Part B only — Medigap and Part D dropped, copays not estimated",
  },
  {
    id: "tricare_prime",
    label: "TRICARE Prime",
    hint: "Group A retiree enrollment fee — copays not estimated",
  },
  {
    id: "tricare_select",
    label: "TRICARE Select",
    hint: "Group A retiree enrollment fee — deductible and cost-shares not estimated",
  },
  {
    id: "tricare_for_life",
    label: "TFL + Medicare",
    hint: "No TRICARE fee — Medicare Part B per person",
  },
];

/** Breakdown-row label for the health line, by coverage stack. */
export function healthLineLabel(coverage: HealthCoverage): string {
  if (coverage === "medicare_supplement") return "Medicare / supplement";
  if (coverage === "va_primary") return "Medicare Part B";
  if (coverage === "tricare_for_life") return "Medicare Part B (TFL)";
  return "TRICARE enrollment";
}

export function parseMonthlyAmount(raw: string): number {
  const n = Number(String(raw).replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export function scenarioSources(scenario: AffordabilityScenario): IncomeSource[] {
  return INCOME_FIELDS.map((field) => ({
    kind: field.kind,
    monthlyAmount: parseMonthlyAmount(scenario[field.key]),
  })).filter((source) => source.monthlyAmount > 0);
}

export function scenarioGrossMonthly(scenario: AffordabilityScenario): number {
  return scenarioSources(scenario).reduce((sum, s) => sum + s.monthlyAmount, 0);
}

export function scenarioIsActive(scenario: AffordabilityScenario): boolean {
  return scenarioGrossMonthly(scenario) > 0;
}

export function formatUsd(n: number | null | undefined, digits = 0): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return "—";
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  });
}

export function bandLabel(
  band: "comfortable" | "tight" | "over" | "unknown"
): string {
  if (band === "comfortable") return "Comfortable";
  if (band === "tight") return "Tight";
  if (band === "over") return "Over budget";
  return "Not enough data";
}

/**
 * One plain sentence per band, so the card can lead with a verdict a reader
 * doesn't have to interpret. Same three bands as bandLabel — the sentence is
 * presentation, never a fourth judgment.
 */
export function bandVerdict(
  band: "comfortable" | "tight" | "over" | "unknown"
): string {
  if (band === "comfortable")
    return "Your income covers this city with room to spare.";
  if (band === "tight")
    return "You could make it work here, but you'd be cutting back and watching every dollar.";
  if (band === "over")
    return "This city costs more than your estimated take-home — the numbers don't work at this income.";
  return "We can't price this city yet, so there's no verdict.";
}

/**
 * Cushion choices, labeled by the budget property (share of income left
 * unspent at the comfortable boundary), never by the person. The default MUST
 * stay in lockstep with COMFORT_COST_SHARE so an untouched scenario bands
 * exactly like every surface that never passes a share.
 */
export const CUSHION_OPTIONS: {
  id: CushionChoice;
  label: string;
  hint: string;
  /** Share of take-home costs may reach: 1 - cushion. */
  share: number;
}[] = [
  {
    id: "breathing_room",
    label: "10% cushion",
    hint: "Some breathing room",
    share: 0.9,
  },
  {
    id: "comfortable",
    label: "20% cushion",
    hint: "The standard comfortable benchmark",
    share: COMFORT_COST_SHARE,
  },
  {
    id: "strong",
    label: "30% cushion",
    hint: "Strong cushion — savings, travel, surprises",
    share: 0.7,
  },
];

export function cushionShare(choice: CushionChoice): number {
  return (
    CUSHION_OPTIONS.find((o) => o.id === choice)?.share ?? COMFORT_COST_SHARE
  );
}

/**
 * The cost-side household for a scenario. Married filing is an explicit
 * two-person declaration, so the couple basket is a mapping of the user's own
 * choice, not an inference about them. ONE definition on purpose: the city
 * card and /explore must price the same scenario identically.
 */
export function scenarioHousehold(scenario: AffordabilityScenario): Household {
  return scenario.filing === "married" ? "couple" : "single";
}

/** A positive dollar amount, or undefined to take the model's default. */
export function parseOptionalAmount(raw: string): number | undefined {
  const n = parseMonthlyAmount(raw);
  return n > 0 ? n : undefined;
}

/**
 * A human percentage ("6.5", "20") as a fraction, or undefined for the
 * model's default. Values outside (0, 100) are treated as unset rather than
 * fed to the model as a nonsense rate.
 */
export function parseOptionalPercent(raw: string): number | undefined {
  const n = parseMonthlyAmount(raw);
  return n > 0 && n < 100 ? n / 100 : undefined;
}

/**
 * The EstimateOptions a scenario implies — basket, coverage, household, and
 * any housing overrides the user typed. The single source of truth for
 * turning scenario state into model options.
 */
export function scenarioEstimateOptions(
  scenario: AffordabilityScenario
): EstimateOptions {
  return {
    spendingProfile: scenario.spendingProfile,
    healthCoverage: scenario.healthCoverage,
    household: scenarioHousehold(scenario),
    homePriceOverride: parseOptionalAmount(scenario.homePrice),
    downPaymentFraction: parseOptionalPercent(scenario.downPaymentPct),
    mortgageRateOverride: parseOptionalPercent(scenario.mortgageRatePct),
    propertyTaxRateOverride: parseOptionalPercent(scenario.propertyTaxPct),
    hoaMonthly: parseOptionalAmount(scenario.hoaMonthly),
  };
}

export const HOUSEHOLD_OPTIONS: {
  id: Household;
  label: string;
  hint: string;
}[] = [
  { id: "single", label: "Single", hint: "One person" },
  {
    id: "couple",
    label: "Couple",
    hint: "Two people — Medicare premiums doubled, one dwelling",
  },
];

export function householdLabel(household: Household): string {
  return HOUSEHOLD_OPTIONS.find((o) => o.id === household)?.label ?? household;
}

/**
 * Badge tone for a quick-check verdict, mapping the five bands onto the
 * card's existing three badge classes. The finer color distinctions live in
 * the .aff-verdict-* text classes, not the chip.
 */
export function quickVerdictBadgeClass(
  verdict: QuickVerdict
): "good" | "warn" | "bad" {
  if (verdict === "comfortable") return "good";
  if (verdict === "in_the_ballpark") return "warn";
  return "bad";
}

/** Chip/badge label for a quick-check verdict. */
export function quickVerdictLabel(verdict: QuickVerdict): string {
  switch (verdict) {
    case "way_out_of_range":
      return "Way out of range";
    case "probably_too_expensive":
      return "Probably too expensive";
    case "very_tight":
      return "Very tight";
    case "in_the_ballpark":
      return "In the ballpark";
    case "comfortable":
      return "Comfortable range";
  }
}

/**
 * One plain sentence per quick-check verdict. Like bandVerdict, presentation
 * only — the metric lives in lib/affordability.ts. Magnitude (shortfall,
 * distance to comfortable) is rendered separately by the caller so these
 * sentences stay reusable across cities.
 */
export function quickVerdictCopy(verdict: QuickVerdict): string {
  switch (verdict) {
    case "way_out_of_range":
      return "Your take-home isn't close to what our model estimates ordinary costs run here.";
    case "probably_too_expensive":
      return "A large ongoing shortfall looks likely — most months wouldn't balance.";
    case "very_tight":
      return "You'd be near basic costs with essentially no margin for anything unexpected.";
    case "in_the_ballpark":
      return "You appear able to cover normal estimated costs here, but your cushion would be smaller than our 20% comfort target.";
    case "comfortable":
      return "Your income meets our 20% uncommitted-income target for this city.";
  }
}

/**
 * Secondary personality line for genuinely absurd mismatches (coverage under
 * 50%). Null otherwise — it decorates the way-out-of-range verdict, it never
 * replaces it.
 */
export function wildestDreamsLine(check: QuickCheck): string | null {
  if (!check.wildestDreams) return null;
  const pct = Math.round(check.coverage * 100);
  return `This one may be in "in your wildest dreams" territory — your take-home is about ${pct}% of what our model estimates ordinary costs run here.`;
}

export function tenureLabel(tenure: Tenure): string {
  return TENURE_OPTIONS.find((o) => o.id === tenure)?.label ?? tenure;
}

export function profileLabel(profile: SpendingProfile): string {
  return PROFILE_OPTIONS.find((o) => o.id === profile)?.label ?? profile;
}

export function healthCoverageLabel(coverage: HealthCoverage): string {
  return HEALTH_COVERAGE_OPTIONS.find((o) => o.id === coverage)?.label ?? coverage;
}

export function scenarioChipLabel(scenario: AffordabilityScenario): string {
  const gross = scenarioGrossMonthly(scenario);
  const coverage =
    scenario.healthCoverage === "va_primary"
      ? ` · ${healthCoverageLabel(scenario.healthCoverage)}`
      : "";
  return `${profileLabel(scenario.spendingProfile)} · ${tenureLabel(scenario.tenure)}${coverage} · ${formatUsd(gross)}/mo`;
}

export const AFFORDABILITY_DISCLAIMER =
  "This is an estimate for comparing places, not tax advice, a quote, or a recommendation to move.";

export function affordabilityVintage(): string {
  const rent = "ACS 2024 median gross rent";
  const rpp = "BEA 2024 regional price parities";
  const modest = "BLS CE 2021–2022 65+ by income";
  const typical = "BLS CE 2024 65+ mean";
  const health = `CMS/KFF ${COST_CONSTANTS.medicarePartBMonthly.sourcedOn?.slice(0, 4) ?? "2026"} Medicare premiums`;
  return `Sources: ${rent}; ${rpp}; ${modest} (modest) / ${typical} (average); ${health}; IRS tax year ${TAX_YEAR}.`;
}
