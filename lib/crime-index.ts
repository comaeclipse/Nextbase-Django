/**
 * Total Crime Index (TCI) — the reproducible, FBI-sourced safety number stored
 * in `locations_location.tci` and labelled by `crime`.
 *
 * The problem this solves: consumer "crime index" sites disagree by 3× and are
 * proprietary, so a curated city could never get a defensible, comparable TCI
 * (see issue #64 follow-up / #278, and SCHEMA.md's note that the legacy `crime`
 * column mixes two vocabularies). This module fixes the method ONCE:
 *
 *   TCI = round( VIOLENT_WEIGHT · violentIndex + PROPERTY_WEIGHT · propertyIndex )
 *   where   xIndex = 100 · cityRatePer100k(x) / nationalRatePer100k(x)
 *
 * National average = 100, lower is safer. The two components are each indexed to
 * the national rate and then averaged, rather than summing raw counts, so that
 * violent crime — roughly one-fifth as common as property crime — is not drowned
 * out. It is a normalized composite, not a raw count total; "Total" means it
 * spans both offense families, not that it is their unweighted sum.
 *
 * Inputs come from the FBI (Crime Data Explorer agency data: violent + property
 * offense counts and the agency's covered population). The national reference
 * rates are the FBI national estimates for the same year. See
 * data/sources/crime/TCI_METHODOLOGY.md for the sourcing runbook.
 */

/** National reference rates for one FBI reporting year; TCI is relative to these. */
export interface CrimeReference {
  /** FBI reporting year the national rates are drawn from. */
  year: number;
  /** National violent-crime rate per 100,000 (murder, rape, robbery, agg. assault). */
  violentRatePer100k: number;
  /** National property-crime rate per 100,000 (burglary, larceny, MV theft). */
  propertyRatePer100k: number;
  /** Provenance for the two rates. */
  source: string;
}

/*
 * FBI national estimates by year. A city's counts must be indexed against the
 * SAME year's national rate, and thanks to the NIBRS transition a city's last
 * usable FBI year is often not the latest one (see the methodology doc's
 * Florida/coverage-gap note), so more than one year is kept here. Values are
 * cited in data/sources/crime/TCI_METHODOLOGY.md; add a year in both places.
 */
export const NATIONAL_CRIME_REFERENCE_BY_YEAR: Record<number, CrimeReference> = {
  2023: {
    year: 2023,
    violentRatePer100k: 363.8,
    propertyRatePer100k: 1916.7,
    source: "FBI UCR, Crime in the Nation 2023 (Crime Data Explorer national estimates)",
  },
  2022: {
    year: 2022,
    violentRatePer100k: 380.7,
    propertyRatePer100k: 1954.4,
    source: "FBI UCR 2022 national estimates (Crime Data Explorer)",
  },
  2020: {
    year: 2020,
    violentRatePer100k: 387.8,
    propertyRatePer100k: 1958.2,
    source: "FBI UCR, Crime in the United States 2020 national estimates",
  },
};

/** The default reference: the newest year with a fully FBI-sourced rate pair. */
export const NATIONAL_CRIME_REFERENCE: CrimeReference = NATIONAL_CRIME_REFERENCE_BY_YEAR[2023];

/** The national reference for a given FBI year; throws if that year isn't stored. */
export function referenceForYear(year: number): CrimeReference {
  const ref = NATIONAL_CRIME_REFERENCE_BY_YEAR[year];
  if (!ref) {
    throw new Error(
      `No national reference for FBI year ${year}. Add it to NATIONAL_CRIME_REFERENCE_BY_YEAR ` +
        `and data/sources/crime/TCI_METHODOLOGY.md, or pass explicit --ref-violent/--ref-property.`,
    );
  }
  return ref;
}

/*
 * Equal weight. Violent crime matters more to the retirement-safety question
 * this index feeds, but it is also far rarer, so a heavier property weight would
 * make TCI track shoplifting more than assault. Equal weighting is the neutral,
 * defensible default; change both numbers together (they must sum to 1).
 */
export const VIOLENT_WEIGHT = 0.5;
export const PROPERTY_WEIGHT = 0.5;

/**
 * TCI → `crime` label. National average is 100, so the bands are "meaningfully
 * below / around / meaningfully above the national rate". These clean thresholds
 * supersede the inconsistent legacy labels rather than reproducing them.
 */
export const CRIME_LABEL_THRESHOLDS = { low: 75, high: 150 } as const;
export type CrimeLabel = "Low" | "Moderate" | "High";

export function crimeLabelFromTci(tci: number): CrimeLabel {
  if (tci < CRIME_LABEL_THRESHOLDS.low) return "Low";
  if (tci >= CRIME_LABEL_THRESHOLDS.high) return "High";
  return "Moderate";
}

/** A rate per 100,000, from a raw offense count and the covered population. */
export function ratePer100k(count: number, population: number): number {
  if (!Number.isFinite(count) || count < 0) throw new Error("count must be a non-negative number");
  if (!Number.isFinite(population) || population <= 0) throw new Error("population must be a positive number");
  return (count / population) * 100_000;
}

/** The two per-100k rates a TCI needs, whether the caller has counts or rates. */
export interface CrimeRates {
  violentRatePer100k: number;
  propertyRatePer100k: number;
}

/** Build {violent,property} rates from FBI counts + the agency's covered population. */
export function ratesFromCounts(input: {
  violentCount: number;
  propertyCount: number;
  population: number;
}): CrimeRates {
  return {
    violentRatePer100k: ratePer100k(input.violentCount, input.population),
    propertyRatePer100k: ratePer100k(input.propertyCount, input.population),
  };
}

type CrimePeriodSeries = Record<string, number | null> | undefined;

/**
 * Count FBI CDE periods where both offense families are present. Presence is
 * separate from non-zero volume: some agencies publish a year-end annual dump
 * where earlier month keys are zero and December carries the full-year count.
 */
export function reportedCrimePeriods(
  violentPeriods: CrimePeriodSeries,
  propertyPeriods: CrimePeriodSeries,
): number {
  if (!violentPeriods || !propertyPeriods) return 0;
  let periods = 0;
  for (const period of Object.keys(violentPeriods)) {
    if (violentPeriods[period] != null && propertyPeriods[period] != null) periods += 1;
  }
  return periods;
}

export function isUsableFbiAgencyYear(input: {
  periodsReported: number;
  expectedPeriods?: number;
  violentCount: number;
  propertyCount: number;
  population: number;
}): boolean {
  const expectedPeriods = input.expectedPeriods ?? 12;
  return (
    input.periodsReported >= expectedPeriods &&
    input.violentCount > 0 &&
    input.propertyCount > 0 &&
    input.population > 0
  );
}

export interface TciBreakdown {
  tci: number;
  violentIndex: number;
  propertyIndex: number;
  label: CrimeLabel;
  referenceYear: number;
}

/**
 * The full computation, returning the sub-indices too so a reviewer can see
 * whether a high TCI is driven by violence or property crime.
 */
export function totalCrimeIndexBreakdown(
  rates: CrimeRates,
  reference: CrimeReference = NATIONAL_CRIME_REFERENCE,
): TciBreakdown {
  if (rates.violentRatePer100k < 0 || rates.propertyRatePer100k < 0) {
    throw new Error("crime rates must be non-negative");
  }
  const violentIndex = 100 * (rates.violentRatePer100k / reference.violentRatePer100k);
  const propertyIndex = 100 * (rates.propertyRatePer100k / reference.propertyRatePer100k);
  const tci = Math.round(VIOLENT_WEIGHT * violentIndex + PROPERTY_WEIGHT * propertyIndex);
  return {
    tci,
    violentIndex: Math.round(violentIndex),
    propertyIndex: Math.round(propertyIndex),
    label: crimeLabelFromTci(tci),
    referenceYear: reference.year,
  };
}

/** The TCI integer alone. */
export function totalCrimeIndex(
  rates: CrimeRates,
  reference: CrimeReference = NATIONAL_CRIME_REFERENCE,
): number {
  return totalCrimeIndexBreakdown(rates, reference).tci;
}
