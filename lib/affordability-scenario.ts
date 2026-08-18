/*
 * Household scenario for the affordability UI. Shared by /explore, the city
 * page, and the chat estimator so the same mix of income, tenure, and spending
 * profile drives every surface.
 */
import type { Tenure, SpendingProfile } from "./affordability";
import type { FilingStatus, IncomeKind, IncomeSource } from "./income";
import { COST_CONSTANTS } from "./cost-constants";
import { TAX_YEAR } from "./tax-constants";

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
  {
    id: "modest",
    label: "Getting by",
    hint: "BLS 65+ households earning $15k–$30k",
  },
  {
    id: "typical",
    label: "Typical retiree",
    hint: "BLS average 65+ household spending",
  },
];

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

export function tenureLabel(tenure: Tenure): string {
  return TENURE_OPTIONS.find((o) => o.id === tenure)?.label ?? tenure;
}

export function profileLabel(profile: SpendingProfile): string {
  return PROFILE_OPTIONS.find((o) => o.id === profile)?.label ?? profile;
}

export function scenarioChipLabel(scenario: AffordabilityScenario): string {
  const gross = scenarioGrossMonthly(scenario);
  return `${profileLabel(scenario.spendingProfile)} · ${tenureLabel(scenario.tenure)} · ${formatUsd(gross)}/mo`;
}

export const AFFORDABILITY_DISCLAIMER =
  "This is an estimate for comparing places, not tax advice, a quote, or a recommendation to move.";

export function affordabilityVintage(): string {
  const rent = "ACS 2024 median gross rent";
  const rpp = "BEA 2024 regional price parities";
  const modest = "BLS CE 2021–2022 65+ by income";
  const typical = "BLS CE 2024 65+ mean";
  const health = `CMS/KFF ${COST_CONSTANTS.medicarePartBMonthly.sourcedOn?.slice(0, 4) ?? "2026"} Medicare premiums`;
  return `Sources: ${rent}; ${rpp}; ${modest} (getting by) / ${typical} (typical); ${health}; IRS tax year ${TAX_YEAR}.`;
}
