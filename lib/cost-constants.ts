/*
 * National constants for the fixed-income cost model (lib/affordability.ts).
 *
 * WHY THIS FILE EXISTS SEPARATELY: the affordability model converts a *relative*
 * cost index (col_index, where 100 = national average) into *absolute* dollars.
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
   * 65+ age group, subtract the housing component, divide by 12. Subtracting
   * housing matters — the model prices housing separately from DB columns, so
   * leaving it in would double-count it.
   */
  nonHousingBaseline65Plus: constant({
    value: null,
    unit: "USD per month",
    kind: "measured",
    source:
      "BLS Consumer Expenditure Survey, table of average annual expenditures " +
      "by age of reference person; use the 65+ row, total minus housing, / 12",
    sourceUrl: null,
    sourcedOn: null,
    refresh: "annual",
    note:
      "WHICH FIGURE YOU PICK LARGELY DECIDES THE FEATURE. A smoke test with a " +
      "$2,500/mo placeholder put all 132 cities 'over budget' for someone on " +
      "$2,400/mo — the anchor alone exceeded their income before any housing " +
      "was added. That is arithmetic, not a bug, but it means a mean-based " +
      "anchor can make the tool answer 'nowhere' to everyone it is built for.\n" +
      "The published 65+ AVERAGE is pulled upward by wealthy households and is " +
      "probably too high. Prefer a median or lower-quintile figure for the age " +
      "group if the source offers one. Consider sourcing two (a low and a mid " +
      "figure) so the model can express a range rather than a false point " +
      "estimate. Whichever you choose, the ground-truth check in " +
      "scripts/verify-affordability.ts is what tells you if it is right.",
  }),

  /**
   * The housing share of the composite COL index basket. Used to algebraically
   * remove housing from col_index so it is not counted twice — see
   * `nonHousingIndex()` in lib/affordability.ts.
   *
   * This matters more than it looks: in this database
   * corr(col_index, avg_home_value) = 0.840, so col_index is heavily driven by
   * housing already.
   */
  housingWeight: constant({
    value: null,
    unit: "fraction 0..1",
    kind: "measured",
    source: "C2ER / ACCRA Cost of Living Index published basket weights",
    sourceUrl: null,
    sourcedOn: null,
    refresh: "rare",
    note:
      "Confirm this matches whatever index col_index was actually sourced " +
      "from. If col_index came from a different provider, use THAT provider's " +
      "housing weight — mixing providers is the main way this model can be " +
      "quietly wrong.",
  }),

  /**
   * National median home value, used to normalize each city's housing index to
   * 100. A city at exactly this value gets housingIndex = 100.
   */
  nationalMedianHomeValue: constant({
    value: null,
    unit: "USD",
    kind: "measured",
    source: "Zillow ZHVI national, or FHFA House Price Index",
    sourceUrl: null,
    sourcedOn: null,
    refresh: "monthly",
    note:
      "Must be the same *kind* of figure as avg_home_value in the DB " +
      "(typical/average home value, not median SALE price). Mismatching these " +
      "shifts every city's housing index in the same direction.",
  }),

  /** Standard Medicare Part B monthly premium. Does not vary by location. */
  medicarePartBMonthly: constant({
    value: null,
    unit: "USD per month",
    kind: "measured",
    source: "CMS published Part B premium schedule for the current year",
    sourceUrl: null,
    sourcedOn: null,
    refresh: "annual",
    note:
      "The standard premium only. IRMAA surcharges apply above an income " +
      "threshold that fixed-income retirees are generally below.",
  }),

  /**
   * Typical Medigap/supplement + Part D monthly premium. Set to 0 if you decide
   * to model only Part B; the harness will still run.
   */
  supplementalHealthMonthly: constant({
    value: null,
    unit: "USD per month",
    kind: "measured",
    source: "CMS / KFF published average Medigap + Part D premium",
    sourceUrl: null,
    sourcedOn: null,
    refresh: "annual",
    note:
      "Genuinely varies by state and plan. A national average is a stand-in " +
      "until there is a per-state figure. VA-enrolled veterans near a facility " +
      "often carry far less than this — that discount is Phase D, and it needs " +
      "distance_to_va parsed into a numeric column first.",
  }),

  /**
   * FALLBACK effective property tax rate, used only when a city has no
   * `property_tax_rate` of its own. Per-city data is a P0 ingestion task; until
   * it lands this keeps the ownership paths computable, and any city using it
   * is flagged in `approximations` so the UI can say so.
   */
  fallbackPropertyTaxRate: constant({
    value: null,
    unit: "fraction of home value per year",
    kind: "measured",
    source: "Tax Foundation national average effective property tax rate",
    sourceUrl: null,
    sourcedOn: null,
    refresh: "annual",
    note:
      "A national average hides enormous variation (roughly 0.3% to 2.5% " +
      "across states), so a city relying on this fallback has a materially " +
      "less trustworthy estimate. This is why per-city property_tax_rate is P0.",
  }),

  /**
   * Annual home maintenance as a fraction of home value. This is a planning
   * convention, not a measured statistic — labeled `convention` so it reads as
   * what it is.
   */
  annualMaintenanceRate: constant({
    value: null,
    unit: "fraction of home value per year",
    kind: "convention",
    source:
      "Common financial-planning rule of thumb (commonly cited as ~1%/yr). " +
      "Pick a value, cite where you took it from, and treat it as a knob.",
    sourceUrl: null,
    sourcedOn: null,
    refresh: "rare",
    note:
      "Not a measurement. Older homes and harsh climates run higher. Because " +
      "it scales with home value it quietly penalizes expensive cities — " +
      "worth revisiting if the ground-truth check shows systematic bias.",
  }),

  /** 30-year fixed mortgage rate, for the `buying` tenure only. */
  mortgageRate30yr: constant({
    value: null,
    unit: "annual fraction, e.g. 0.065 for 6.5%",
    kind: "measured",
    source: "Freddie Mac Primary Mortgage Market Survey",
    sourceUrl: null,
    sourcedOn: null,
    refresh: "monthly",
  }),

  /** Default down payment fraction for the `buying` tenure. */
  defaultDownPaymentFraction: constant({
    value: null,
    unit: "fraction 0..1",
    kind: "convention",
    source: "Product decision — set the default you want to show.",
    sourceUrl: null,
    sourcedOn: null,
    refresh: "rare",
    note:
      "Many retirees buying after selling a home put down far more than a " +
      "conventional 20%. Consider letting the user override this in the UI; " +
      "the model accepts a per-call override already.",
  }),
};

export type CostConstantKey = keyof typeof COST_CONSTANTS;

/**
 * Plausibility band for a derived non-housing index. A city outside this range
 * does not have exotic costs — it has an inconsistent col_index or
 * avg_home_value. Flagging beats scoring: see scripts/verify-affordability.ts,
 * which prints outliers as a data-quality report.
 */
export const NON_HOUSING_INDEX_BOUNDS = { min: 70, max: 160 } as const;

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
