/**
 * The editorial climate bucket used by the Explore/quiz climate filter.
 *
 * There are exactly four stored keys, and they are the ONLY values any surface
 * accepts (`lib/filters.ts`, `lib/quiz.ts`, `components/explore/ExploreFilterBar`).
 * `cold_snowy` is labelled "Four seasons" in the UI. Keep the classifier, the
 * enum, and the guard in this one module so a new bucket, or a stricter rule,
 * is a single edit that both the importer and categorize-climate.ts pick up.
 */

export const CLIMATE_CATEGORIES = [
  "cold_snowy",
  "hot_humid",
  "hot_dry",
  "mild_coastal",
] as const;

export type ClimateCategory = (typeof CLIMATE_CATEGORIES)[number];

export function isClimateCategory(value: unknown): value is ClimateCategory {
  return typeof value === "string" && (CLIMATE_CATEGORIES as readonly string[]).includes(value);
}

/**
 * The fields the classifier reads. A structural subset of LocationRow so the
 * same function classifies a DB row and a parsed CSV row, and so a test fixture
 * is just the handful of numbers that actually drive the decision.
 */
export interface ClimateInputs {
  climate: string | null;
  snow_annual: number | null;
  rain_annual: number | null;
  alw: number | null;
  avg_high_summer: number | null;
  humidity_summer: number | null;
}

/** The rule that fired, for --explain and for the tests to assert on. */
export type ClimateRule =
  | "arid_hot_dry"
  | "desert_heat"
  | "heavy_snow"
  | "cold_winter"
  | "humid_summer"
  | "muggy_winter"
  | "humid_subtropical_fallback"
  | "mild_fallback";

export interface ClimateExplanation {
  category: ClimateCategory;
  rule: ClimateRule;
  /** Human-readable reason, naming the inputs that decided it. */
  reason: string;
}

/*
 * A Köppen/label match is a strong prior the raw numbers cannot always express:
 * a station 40 miles away can make a genuinely arid valley look wetter than it
 * is, and the curated `climate` string carries the classification a human made.
 */
const ARID_LABEL = /semi-arid|steppe|desert|\bBS[hk]\b|\bBW[hk]\b/i;
const HUMID_SUBTROPICAL_LABEL = /humid[\s-]*subtropical|\bCfa\b/i;

/*
 * The classifier is intentionally a small, ordered decision tree rather than a
 * scoring model: every retirement city must land in one of four buckets, the
 * inputs are sparse and occasionally missing, and an editor has to be able to
 * read WHY a city got its label. `explainClimate` returns that reason; the DB
 * script prints it under --explain.
 *
 * Ordering matters and encodes the fix for issue #64: an arid, hot-summer place
 * that is not snow-buried is hot_dry BEFORE the cold-winter rule can claim it on
 * a modest snow total. Grand Junction (BSk, 95F summers, 18" snow) is the case
 * this rescues; Elko/Bend/Rapid City stay cold_snowy because heavy snow or mild
 * summers keep them out of the hot_dry rule.
 */
export function explainClimate(loc: ClimateInputs): ClimateExplanation {
  const label = loc.climate ?? "";
  const aridLabel = ARID_LABEL.test(label);
  const humidSubtropical = HUMID_SUBTROPICAL_LABEL.test(label);

  const summerHigh = loc.avg_high_summer;
  const snow = loc.snow_annual;
  const rain = loc.rain_annual;
  const humidity = loc.humidity_summer;
  const winterLow = loc.alw;

  const hotSummer = summerHigh != null && summerHigh >= 88;
  const veryHotSummer = summerHigh != null && summerHigh >= 95;
  const heavySnow = snow != null && snow >= 35;
  const lowRain = rain != null && rain <= 15;
  const lowHumidity = humidity != null && humidity <= 45;
  // Label OR sparse-station numbers: either is enough to call a place dry.
  const aridSignal = aridLabel || lowRain;

  /*
   * Two things disqualify an otherwise arid, hot-summer place from hot_dry:
   *
   * snowBurdened — heavy snow, or a frigid winter (avg low ≤20°F) with real
   *   snow. This is what separates hot semi-arid valleys (Grand Junction, avg
   *   low 17°F but only 18" snow; Pueblo, mild 26°F winters) from the frigid
   *   snowy prairie that merely carries a "semi-arid" label (North Platte, avg
   *   low 12°F + 30" snow; Pierre, 10°F + 31") — the prairie is cold_snowy.
   *
   * tropicalHumid — a measured high humidity in a warm-winter place. Leeward
   *   Honolulu is literally "Hot semi-arid" by its 16"/yr rainfall yet sits at
   *   67% humidity and never cools below the upper 60s: that is muggy tropics,
   *   not dry heat. A mild-winter dry coast (Costa Mesa, avg low 48°F, marine-
   *   layer humidity, 11"/yr rain) is NOT tropical and stays hot_dry.
   */
  const snowBurdened = heavySnow || (winterLow != null && winterLow <= 20 && snow != null && snow >= 20);
  const tropicalHumid = humidity != null && humidity >= 60 && winterLow != null && winterLow >= 55;

  // Rule 1 — hot & dry. An arid place with genuinely hot summers, so long as it
  // is neither snow-burdened nor muggy tropics, is hot_dry even if its winters
  // get some snow.
  if (aridSignal && hotSummer && !snowBurdened && !tropicalHumid) {
    return {
      category: "hot_dry",
      rule: "arid_hot_dry",
      reason:
        `arid (${aridLabel ? `label "${label}"` : `rain ${rain}"≤15`}), ` +
        `hot summers (avg high ${summerHigh}°F≥88), snow ${snow ?? "?"}"<35 — not snow-burdened`,
    };
  }
  // Very hot summers with genuinely dry air read as desert heat regardless of
  // the label (a true BWh like Yuma, or a hot-summer Mediterranean valley).
  if (veryHotSummer && lowHumidity) {
    return {
      category: "hot_dry",
      rule: "desert_heat",
      reason: `very hot summers (avg high ${summerHigh}°F≥95) with dry air (summer humidity ${humidity}%≤45)`,
    };
  }

  // Rule 2 — cold & snowy ("Four seasons"). Heavy snow alone, or a cold winter
  // paired with meaningful snow, is a real four-season burden.
  if (snow != null && snow >= 30) {
    return {
      category: "cold_snowy",
      rule: "heavy_snow",
      reason: `heavy snow (${snow}"/yr≥30)`,
    };
  }
  if (winterLow != null && winterLow <= 25 && snow != null && snow >= 15) {
    return {
      category: "cold_snowy",
      rule: "cold_winter",
      reason: `cold winters (avg low ${winterLow}°F≤25) with real snow (${snow}"/yr≥15)`,
    };
  }

  // Rule 3 — hot & humid. Measured humidity is the primary signal; when it is
  // missing, a humid-subtropical (Cfa) label with hot, rainy summers is the
  // fallback so an Oklahoma City does not fall through to mild_coastal.
  if (hotSummer && humidity != null && humidity >= 60) {
    return {
      category: "hot_humid",
      rule: "humid_summer",
      reason: `hot (avg high ${summerHigh}°F≥88) and humid (summer humidity ${humidity}%≥60) summers`,
    };
  }
  // A warm-summer guard keeps this on true subtropics (warm winters AND warm
  // summers). Without it a cool marine coast — Redondo Beach, 74°F summers but
  // 72% marine-layer humidity — reads as muggy subtropical, which it is not.
  if (
    winterLow != null && winterLow >= 45 &&
    humidity != null && humidity >= 65 &&
    summerHigh != null && summerHigh >= 82
  ) {
    return {
      category: "hot_humid",
      rule: "muggy_winter",
      reason: `warm (avg high ${summerHigh}°F≥82), mild-winter (avg low ${winterLow}°F≥45), muggy (summer humidity ${humidity}%≥65) subtropics`,
    };
  }
  if (humidSubtropical && hotSummer && rain != null && rain >= 30) {
    return {
      category: "hot_humid",
      rule: "humid_subtropical_fallback",
      reason:
        `humid-subtropical label "${label}", hot summers (avg high ${summerHigh}°F≥88), ` +
        `substantial rainfall (${rain}"/yr≥30) — humid even without a humidity reading`,
    };
  }

  // Rule 4 — the temperate fallback.
  return {
    category: "mild_coastal",
    rule: "mild_fallback",
    reason: "no hot/dry, cold/snowy, or hot/humid rule matched — temperate/coastal by default",
  };
}

/** The category alone, for callers that do not need the explanation. */
export function classifyClimate(loc: ClimateInputs): ClimateCategory {
  return explainClimate(loc).category;
}

/**
 * Whether there is enough climate data to classify a city with confidence. The
 * summer high separates the three "hot" buckets from the temperate fallback, so
 * without it a city would silently default to mild_coastal — exactly the quiet
 * misclassification issue #64 is about. A city import that lacks it must fail
 * (or pass --allow-incomplete) rather than store a guessed bucket.
 */
export function hasClassifiableClimate(loc: ClimateInputs): boolean {
  return loc.avg_high_summer != null;
}
