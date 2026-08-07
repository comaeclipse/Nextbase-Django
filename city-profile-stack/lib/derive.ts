/*
 * Structural feature derivation: turning columns we already store into
 * city-capability feature values for EVERY city, not just researched ones.
 *
 * This is the extrapolation engine. A research dossier gives us ground truth
 * for one city; these formulas give us a defensible estimate for all 109, so a
 * city nobody has written about still gets an isolation score, an amenity
 * depth, and a healthcare-access estimate.
 *
 * Everything here is a pure function of a LocationFacts record so the curves
 * can be unit-tested and, once enough dossiers exist, refit against them.
 * Bump METHOD_VERSION whenever a curve changes — stored rows record the version
 * that produced them so a refit is a re-run rather than a migration.
 */

import { heatIndex, relativeHumidity } from "../../lib/climate";

export const METHOD_VERSION = "structural_v3_va_hospital";

export interface MetroAnchor {
  name: string;
  state: string;
  lat: number;
  lon: number;
  metro_population: number;
}

export interface LocationFacts {
  id: string;
  name: string;
  state: string;
  latitude: number | null;
  longitude: number | null;
  population: number | null;
  density: number | null;
  colIndex: number | null;
  avgHomeValue: number | null;
  distanceToVaMiles: number | null;
  /** Miles to nearest VA medical center (parent facility), not a CBOC/clinic. */
  distanceToVaHospitalMiles: number | null;
  hasVa: boolean | null;
  paceCategory: string | null;
  climateCategory: string | null;
  avgLowWinter: number | null;
  avgHighSummer: number | null;
  snowAnnual: number | null;
  rainAnnual: number | null;
  /** Mean low of the coldest month, from location_weather_monthly. */
  coldestMonthLowF: number | null;
  /** Months whose mean high is 55-85F and mean low above freezing — pleasant outdoors. */
  comfortableMonths: number | null;
  /**
   * Per-month temperature plus the dew point of the nearest hourly station.
   *
   * Dry-bulb temperature alone systematically under-reads humid climates:
   * Nashville and Sierra Vista have nearly identical summer highs (91F vs 92F)
   * and completely different summers. Apparent temperature is computed here
   * from the CITY's own monthly high and the STATION's dew point, following
   * the rule in SCHEMA.md — the hourly station can be 50+ miles away, so its
   * moisture travels but its temperature does not. Sierra Vista's hourly
   * station is Tucson, 54 miles away and 3,000 feet lower.
   */
  monthlyClimate: { month: number; avgHighF: number | null; avgLowF: number | null; dewPointF: number | null }[] | null;
  /** Share of annual precipitation falling Jun-Sep — separates monsoon from cool-season regimes. */
  summerPrecipShare: number | null;
  /** Warm-season dew point from location_hourly_normals — the trustworthy moisture source. */
  summerDewPointF: number | null;
  crime: string | null;
  election2024: string | null;
  election2024Percent: number | null;
  lgbtqRating: number | null;
  lgbtqMeiScore: number | null;
  lgbtqStatePolicyScore: number | null;
  nearLake: boolean | null;
  nearOcean: boolean | null;
  nearMountains: boolean | null;
  vibes: string[] | null;
}

/** A derived value plus the inputs that produced it, for explainability. */
export interface DerivedValue {
  value: number;
  confidence: number;
  inputs: Record<string, number | string | boolean | null>;
}

// ── numeric helpers ───────────────────────────────────────────────────────

export const clamp01 = (n: number): number => (n < 0 ? 0 : n > 1 ? 1 : n);

/** Normalize x into 0..1 across [lo, hi] on a log10 scale. */
export function logScale(x: number, lo: number, hi: number): number {
  if (x <= 0) return 0;
  return clamp01((Math.log10(x) - Math.log10(lo)) / (Math.log10(hi) - Math.log10(lo)));
}

export function linScale(x: number, lo: number, hi: number): number {
  return clamp01((x - lo) / (hi - lo));
}

const round3 = (n: number): number => Math.round(n * 1000) / 1000;

// ── geography ─────────────────────────────────────────────────────────────

const EARTH_RADIUS_MI = 3958.8;
const toRad = (deg: number): number => (deg * Math.PI) / 180;

/**
 * Hours of daylight at the winter solstice for a given latitude.
 *
 * Standard sunrise equation with the solstice declination of -23.44 degrees.
 * Latitude is the only input, so this is available for every city with
 * coordinates — which makes darkness the one climate burden we can derive
 * everywhere, with no weather station required.
 */
export function winterSolsticeDaylightHours(latitudeDeg: number): number {
  const declination = toRad(-23.44);
  const phi = toRad(latitudeDeg);
  const cosH = -Math.tan(phi) * Math.tan(declination);
  if (cosH >= 1) return 0; // polar night
  if (cosH <= -1) return 24; // midnight sun
  const hourAngleDeg = (Math.acos(cosH) * 180) / Math.PI;
  return (2 * hourAngleDeg) / 15;
}

export function haversineMiles(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_MI * Math.asin(Math.sqrt(a));
}

/**
 * How much of a metro's services survive a drive of `miles`. Full value inside
 * 20 miles, then falling away steeply.
 *
 * The exponent was raised from 1.6 to 2.6 after calibration against Elko: at
 * 1.6 the tail was fat enough that Los Angeles, 488 miles away, out-supplied
 * Salt Lake City at 203 miles. A metro eight hours distant is not a source of
 * groceries, specialists, or a Saturday errand, and the curve now says so.
 */
export function distanceDecay(miles: number): number {
  const beyond = Math.max(0, miles - 20);
  return 1 / (1 + (beyond / 55) ** 2.6);
}

export interface MetroAccess {
  /** Population of the largest metro, discounted by how far away it is. */
  effectivePopulation: number;
  /** That effective population mapped onto 0..1. */
  score: number;
  nearestLargeMetro: string | null;
  nearestLargeMetroMiles: number | null;
  hubAirportScore: number;
}

/**
 * Access is driven by the single best metro rather than a sum over metros:
 * two adjacent mid-size cities do not add up to one large one for the purposes
 * of finding a cardiologist or a specialty part.
 */
export function computeMetroAccess(
  lat: number,
  lon: number,
  anchors: readonly MetroAnchor[]
): MetroAccess {
  let effectivePopulation = 0;
  let hubEffective = 0;
  let nearestLargeMetro: string | null = null;
  let nearestLargeMetroMiles: number | null = null;

  for (const anchor of anchors) {
    const miles = haversineMiles(lat, lon, anchor.lat, anchor.lon);
    const effective = anchor.metro_population * distanceDecay(miles);
    if (effective > effectivePopulation) effectivePopulation = effective;
    // Hub airports track the largest metros, not merely the nearest one.
    if (anchor.metro_population >= 1_500_000) {
      const hub = anchor.metro_population * distanceDecay(miles);
      if (hub > hubEffective) hubEffective = hub;
    }
    if (anchor.metro_population >= 500_000) {
      if (nearestLargeMetroMiles === null || miles < nearestLargeMetroMiles) {
        nearestLargeMetroMiles = miles;
        nearestLargeMetro = `${anchor.name}, ${anchor.state}`;
      }
    }
  }

  return {
    effectivePopulation,
    // 30k effective = 0, 3.16M effective = 1. The floor sits low because the
    // steepened decay curve pushes remote cities' effective populations into
    // the tens of thousands; at a 100k floor both Elko and Casper clipped to
    // maximum isolation and stopped being distinguishable from each other.
    score: logScale(effectivePopulation, 30_000, 3_160_000),
    nearestLargeMetro,
    nearestLargeMetroMiles:
      nearestLargeMetroMiles === null ? null : Math.round(nearestLargeMetroMiles),
    hubAirportScore: logScale(hubEffective, 40_000, 4_000_000),
  };
}

// ── parsing the columns as stored ─────────────────────────────────────────

/**
 * The population column is mostly comma-formatted ("58,771") but a handful of
 * rows use magnitude suffixes ("1.47M", "542k", "47k"). Stripping non-digits
 * turned those three cities into towns of 1.47, 542 and 47 people, which then
 * skewed the home-value regression for everyone.
 */
export function parsePopulation(raw: string | null): number | null {
  if (!raw) return null;
  const text = raw.trim();
  const suffixed = text.match(/^([\d.,]+)\s*([kKmM])$/);
  if (suffixed) {
    const n = Number(suffixed[1].replace(/,/g, ""));
    if (!Number.isFinite(n)) return null;
    const multiplier = suffixed[2].toLowerCase() === "m" ? 1_000_000 : 1_000;
    return n * multiplier;
  }
  const n = Number(text.replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * The crime column mixes two vocabularies — letter grades ("A+" .. "F") and
 * words ("Low" / "Moderate" / "High"). Returns 0..1 where 1 is safest.
 */
export function parseCrimeGrade(raw: string | null): number | null {
  if (!raw) return null;
  const text = raw.trim();
  const words: Record<string, number> = { low: 0.8, moderate: 0.5, high: 0.2 };
  const word = words[text.toLowerCase()];
  if (word !== undefined) return word;

  const grade = text.match(/^([A-Fa-f])([+-]?)$/);
  if (!grade) return null;
  const base: Record<string, number> = { a: 0.9, b: 0.75, c: 0.55, d: 0.35, f: 0.15 };
  const letter = base[grade[1].toLowerCase()];
  if (letter === undefined) return null;
  const modifier = grade[2] === "+" ? 0.05 : grade[2] === "-" ? -0.05 : 0;
  return clamp01(letter + modifier);
}

export function parseMiles(raw: string | null): number | null {
  if (!raw) return null;
  const match = raw.match(/([\d.]+)\s*mile/i);
  if (!match) return null;
  const n = Number(match[1]);
  return Number.isFinite(n) ? n : null;
}

// ── the shared intermediate quantities ────────────────────────────────────

export interface Context {
  metro: MetroAccess;
  /** Local settlement depth: how much town is actually here. */
  localDepth: number;
  /**
   * How much this place outweighs anything near it. A high value means the town
   * functions as a regional center — it carries the hospital and the hardware
   * store for a wide area, which no single column states.
   */
  regionalCenter: number;
  /** Fitted residual of log(home value) against log(population). Null if unfittable. */
  homeValueResidual: number | null;
}

export function buildContext(
  facts: LocationFacts,
  anchors: readonly MetroAnchor[],
  homeValueResidual: number | null
): Context | null {
  if (facts.latitude === null || facts.longitude === null) return null;
  const metro = computeMetroAccess(facts.latitude, facts.longitude, anchors);
  // 2k = 0, 1M = 1. Below 2k there is no meaningful "town" tier left to lose.
  const localDepth = facts.population === null ? 0 : logScale(facts.population, 2_000, 1_000_000);
  return {
    metro,
    localDepth,
    regionalCenter: clamp01(localDepth - metro.score),
    homeValueResidual,
  };
}

/**
 * Fits log10(home value) ~ a + b * log10(population) by ordinary least squares
 * across the whole dataset, then reports each city's residual.
 *
 * This is what recovers "expensive for a town this size" — Elko's complaint that
 * it is not the cheap small town people expect — from two columns that never say
 * so individually.
 */
export function fitHomeValueResiduals(
  rows: readonly { id: string; population: number | null; avgHomeValue: number | null }[]
): Map<string, number> {
  const usable = rows.filter(
    (r): r is { id: string; population: number; avgHomeValue: number } =>
      r.population !== null && r.population > 0 && r.avgHomeValue !== null && r.avgHomeValue > 0
  );
  const residuals = new Map<string, number>();
  if (usable.length < 10) return residuals;

  const xs = usable.map((r) => Math.log10(r.population));
  const ys = usable.map((r) => Math.log10(r.avgHomeValue));
  const meanX = xs.reduce((a, b) => a + b, 0) / xs.length;
  const meanY = ys.reduce((a, b) => a + b, 0) / ys.length;
  let num = 0;
  let den = 0;
  for (let i = 0; i < xs.length; i++) {
    num += (xs[i] - meanX) * (ys[i] - meanY);
    den += (xs[i] - meanX) ** 2;
  }
  const slope = den === 0 ? 0 : num / den;
  const intercept = meanY - slope * meanX;
  usable.forEach((row, i) => {
    residuals.set(row.id, ys[i] - (intercept + slope * xs[i]));
  });
  return residuals;
}

// ── apparent temperature ──────────────────────────────────────────────────

/**
 * Peak summer apparent temperature: the city's own hottest monthly mean high,
 * felt through that month's dew point.
 *
 * Reuses relativeHumidity/heatIndex from lib/climate.ts rather than
 * reimplementing them, and follows the same anchoring rule as buildDiurnal:
 * temperature from the city, moisture from the station.
 */
export function summerApparentHighF(
  facts: LocationFacts
): { value: number; dryBulbF: number; dewPointF: number } | null {
  if (!facts.monthlyClimate) return null;
  let best: { value: number; dryBulbF: number; dewPointF: number } | null = null;
  for (const m of facts.monthlyClimate) {
    if (m.avgHighF === null || m.dewPointF === null) continue;
    const rh = relativeHumidity(m.avgHighF, m.dewPointF);
    const apparent = heatIndex(m.avgHighF, rh);
    if (best === null || apparent > best.value) {
      best = { value: apparent, dryBulbF: m.avgHighF, dewPointF: m.dewPointF };
    }
  }
  return best;
}

/** Months needing mechanical cooling or heating, counted in both directions. */
export function conditioningMonths(
  facts: LocationFacts
): { count: number; cooling: number; heating: number } | null {
  if (!facts.monthlyClimate) return null;
  let cooling = 0;
  let heating = 0;
  for (const m of facts.monthlyClimate) {
    if (m.avgHighF !== null) {
      const apparent =
        m.dewPointF === null
          ? m.avgHighF
          : heatIndex(m.avgHighF, relativeHumidity(m.avgHighF, m.dewPointF));
      // 85F apparent, not 88: at a 70F dew point most households are
      // running air conditioning well before the mid-80s.
      if (apparent > 85) cooling++;
    }
    if (m.avgLowF !== null && m.avgLowF < 25) heating++;
  }
  return { count: cooling + heating, cooling, heating };
}

// ── feature derivations ───────────────────────────────────────────────────

type Deriver = (facts: LocationFacts, ctx: Context) => DerivedValue | null;

const value = (
  v: number,
  confidence: number,
  inputs: Record<string, number | string | boolean | null>
): DerivedValue => ({ value: round3(clamp01(v)), confidence: round3(confidence), inputs });

export const DERIVERS: Record<string, Deriver> = {
  geographic_isolation: (_facts, ctx) =>
    value(1 - ctx.metro.score, 0.85, {
      nearest_large_metro: ctx.metro.nearestLargeMetro,
      nearest_large_metro_miles: ctx.metro.nearestLargeMetroMiles,
      effective_metro_population: Math.round(ctx.metro.effectivePopulation),
    }),

  urban_amenity_depth: (_facts, ctx) =>
    value(0.6 * ctx.localDepth + 0.4 * ctx.metro.score, 0.7, {
      local_depth: round3(ctx.localDepth),
      metro_access: round3(ctx.metro.score),
    }),

  specialty_retail_access: (_facts, ctx) =>
    value(0.35 * ctx.localDepth + 0.65 * ctx.metro.score, 0.65, {
      local_depth: round3(ctx.localDepth),
      metro_access: round3(ctx.metro.score),
    }),

  major_airport_access: (_facts, ctx) =>
    value(ctx.metro.hubAirportScore, 0.7, {
      hub_airport_score: round3(ctx.metro.hubAirportScore),
    }),

  nightlife_depth: (_facts, ctx) =>
    value(0.7 * ctx.localDepth + 0.3 * ctx.metro.score, 0.6, {
      local_depth: round3(ctx.localDepth),
      metro_access: round3(ctx.metro.score),
    }),

  dating_pool_depth: (_facts, ctx) =>
    value(0.65 * ctx.localDepth + 0.35 * ctx.metro.score, 0.55, {
      local_depth: round3(ctx.localDepth),
      metro_access: round3(ctx.metro.score),
    }),

  social_anonymity: (_facts, ctx) =>
    value(0.85 * ctx.localDepth + 0.15 * ctx.metro.score, 0.55, {
      local_depth: round3(ctx.localDepth),
    }),

  employment_opportunity_depth: (_facts, ctx) =>
    value(0.55 * ctx.localDepth + 0.45 * ctx.metro.score, 0.6, {
      local_depth: round3(ctx.localDepth),
      metro_access: round3(ctx.metro.score),
    }),

  specialist_healthcare_access: (_facts, ctx) =>
    // Specialists concentrate in metros; a regional hospital adds some depth
    // but does not substitute for a metropolitan medical center.
    value(0.7 * ctx.metro.score + 0.2 * ctx.localDepth + 0.2 * ctx.regionalCenter, 0.7, {
      metro_access: round3(ctx.metro.score),
      regional_center: round3(ctx.regionalCenter),
    }),

  routine_healthcare_access: (_facts, ctx) =>
    // Floored at 0.15: essentially every incorporated place has some primary care.
    value(
      0.15 + 0.85 * (0.45 * ctx.metro.score + 0.55 * ctx.localDepth + 0.5 * ctx.regionalCenter),
      0.65,
      {
        metro_access: round3(ctx.metro.score),
        local_depth: round3(ctx.localDepth),
        regional_center: round3(ctx.regionalCenter),
      }
    ),

  va_outpatient_access: (facts) => {
    if (facts.distanceToVaMiles === null) return null;
    // 0 miles = 1.0, 60+ miles = 0.
    return value(1 - linScale(facts.distanceToVaMiles, 0, 60), 0.8, {
      distance_to_va_miles: facts.distanceToVaMiles,
      has_va: facts.hasVa,
    });
  },

  va_hospital_access: (facts) => {
    if (facts.distanceToVaHospitalMiles === null) return null;
    // Medical centers are scarcer; score falls off over a wider drive (0–120 mi).
    return value(1 - linScale(facts.distanceToVaHospitalMiles, 0, 120), 0.8, {
      distance_to_va_hospital_miles: facts.distanceToVaHospitalMiles,
    });
  },

  car_dependence: (facts, ctx) => {
    const byPace: Record<string, number> = {
      urban: 0.4,
      suburban: 0.78,
      small_town: 0.9,
      rural: 0.97,
    };
    const base = facts.paceCategory ? byPace[facts.paceCategory] : null;
    if (base === null || base === undefined) {
      // No pace classification: fall back to settlement depth alone.
      return value(1 - 0.6 * ctx.localDepth, 0.45, { local_depth: round3(ctx.localDepth) });
    }
    // Transit and walkability track metro membership, so shade by metro access.
    return value(base - 0.12 * ctx.metro.score, 0.7, {
      pace_category: facts.paceCategory,
      metro_access: round3(ctx.metro.score),
    });
  },

  winter_cold_severity: (facts) => {
    // Prefer the coldest month's actual mean low from monthly normals over the
    // coarse avg_low_winter column, which is null for a third of the dataset.
    const low = facts.coldestMonthLowF ?? facts.avgLowWinter;
    if (low === null) return null;
    // 50F = 0 (Sierra Vista's mild high desert), 0F = 1 (a hard northern winter).
    return value(1 - linScale(low, 0, 50), facts.coldestMonthLowF !== null ? 0.85 : 0.7, {
      coldest_month_low_f: facts.coldestMonthLowF,
      avg_low_winter: facts.avgLowWinter,
    });
  },

  snow_burden: (facts) => {
    if (facts.snowAnnual === null) return null;
    // 0in = 0, 90in = 1. Kept separate from cold: Sierra Vista freezes without
    // accumulating, Rapid City accumulates without being Montana-cold.
    return value(linScale(facts.snowAnnual, 0, 90), 0.8, {
      snow_annual_in: facts.snowAnnual,
    });
  },

  winter_daylight_deficit: (facts) => {
    if (facts.latitude === null) return null;
    const hours = winterSolsticeDaylightHours(facts.latitude);
    // ~11h (southern Florida) = no deficit; ~5h (Anchorage) = maximum.
    return value(1 - linScale(hours, 5, 11), 0.85, {
      latitude: round3(facts.latitude),
      winter_solstice_daylight_hours: round3(hours),
    });
  },

  outdoor_comfort_season: (facts) => {
    if (facts.comfortableMonths === null) return null;
    // 0 of 12 comfortable months = 0; 10+ = 1. The dataset runs 3 to 12 with
    // the mass at 6-8, so a ceiling of 8 flattened the whole top tier — the
    // mild-coastal and Mediterranean climates that location research finds
    // people pay a premium for are exactly the ones worth distinguishing.
    return value(linScale(facts.comfortableMonths, 0, 10), 0.8, {
      comfortable_months: facts.comfortableMonths,
      definition: "mean high 55-85F and mean low above freezing",
    });
  },

  climate_control_dependence: (facts) => {
    const months = conditioningMonths(facts);
    if (months === null) return null;
    // 0 conditioning months = livable unconditioned; 6+ = half the year depends
    // on working HVAC. Counts BOTH directions: a place needing five months of
    // heat and a place needing five months of cooling are equally exposed when
    // the power fails.
    //
    // The heat side uses APPARENT temperature. The original dry-bulb-only rule
    // (mean high > 90F) scored Nashville 0.00 against a dossier reading of 0.80
    // — because Nashville tops out near 90F and its summers are nonetheless
    // unlivable without air conditioning. That is the whole point of the
    // humid/dry distinction: you cannot evaporatively cool at a 73F dew point.
    return value(linScale(months.count, 0, 6), 0.75, {
      conditioning_months: months.count,
      cooling_months: months.cooling,
      heating_months: months.heating,
      definition: "apparent high above 85F (heat index) or mean low below 25F",
    });
  },

  precipitation_seasonality: (facts) => {
    if (facts.summerPrecipShare === null) return null;
    // Share of annual precipitation falling Jun-Sep. Around 0.33 is neutral
    // (evenly spread); 0.55+ is a monsoon regime; below 0.2 is cool-season.
    return value(linScale(facts.summerPrecipShare, 0.15, 0.55), 0.8, {
      summer_precip_share: round3(facts.summerPrecipShare),
    });
  },

  summer_heat_severity: (facts) => {
    // Apparent temperature, not dry bulb. Nashville's dossier reads 0.80 while
    // dry bulb gave 0.58, because 91F at a 66F dew point is a different summer
    // from 92F at a 34F dew point. Four dry-climate dossiers hid this bias
    // completely; the first humid one exposed it immediately.
    const apparent = summerApparentHighF(facts);
    if (apparent !== null) {
      return value(linScale(apparent.value, 75, 102), 0.8, {
        apparent_high_f: round3(apparent.value),
        dry_bulb_high_f: apparent.dryBulbF,
        summer_dew_point_f: round3(apparent.dewPointF),
      });
    }
    if (facts.avgHighSummer === null) return null;
    return value(linScale(facts.avgHighSummer, 72, 105), 0.6, {
      avg_high_summer: facts.avgHighSummer,
      caveat: "dry-bulb only; no dew point available, so humid heat is under-read",
    });
  },

  humidity_burden: (facts) => {
    // humidity_summer on locations_location is known-unreliable, so moisture
    // comes from hourly-normals dew point where we have it and from the climate
    // category otherwise — at a visibly lower confidence.
    if (facts.summerDewPointF !== null) {
      return value(linScale(facts.summerDewPointF, 45, 75), 0.8, {
        summer_dew_point_f: round3(facts.summerDewPointF),
      });
    }
    const byCategory: Record<string, number> = {
      hot_humid: 0.85,
      humid_continental: 0.6,
      mild_coastal: 0.45,
      cold_snowy: 0.3,
      hot_dry: 0.12,
    };
    const fallback = facts.climateCategory ? byCategory[facts.climateCategory] : undefined;
    if (fallback === undefined) return null;
    return value(fallback, 0.45, { climate_category: facts.climateCategory });
  },

  housing_affordability: (facts) => {
    if (facts.avgHomeValue === null && facts.colIndex === null) return null;
    const home =
      facts.avgHomeValue === null ? null : 1 - logScale(facts.avgHomeValue, 120_000, 900_000);
    const col = facts.colIndex === null ? null : 1 - linScale(facts.colIndex, 80, 160);
    const parts = [
      home === null ? null : { w: 0.65, v: home },
      col === null ? null : { w: 0.35, v: col },
    ].filter((p): p is { w: number; v: number } => p !== null);
    const totalW = parts.reduce((a, p) => a + p.w, 0);
    return value(parts.reduce((a, p) => a + p.w * p.v, 0) / totalW, totalW === 1 ? 0.8 : 0.65, {
      avg_home_value: facts.avgHomeValue,
      col_index: facts.colIndex,
    });
  },

  housing_value_for_size: (_facts, ctx) => {
    if (ctx.homeValueResidual === null) return null;
    // IMPORTANT: the residual is measured against THIS dataset, which is a
    // curated list of retirement destinations, not a random sample of American
    // towns. Its baseline is already expensive, so sitting on the trend line
    // here still means expensive nationally. Both researched cities read as
    // roughly average by residual while their dossiers call them expensive for
    // their size — a dataset-composition bias, not a curve error. The 1.8
    // multiplier widens sensitivity; confidence is lowered to match.
    return value(0.5 - ctx.homeValueResidual * 1.8, 0.5, {
      log_home_value_residual: round3(ctx.homeValueResidual),
      caveat: "residual is relative to this curated dataset, not a national baseline",
    });
  },

  political_conservatism: (facts) => {
    if (facts.election2024 === null || facts.election2024Percent === null) return null;
    const winner = facts.election2024.toLowerCase();
    const republican = winner.startsWith("r") || winner.includes("trump");
    const democrat = winner.startsWith("d") || winner.includes("harris") || winner.includes("biden");
    if (!republican && !democrat) return null;
    const margin = (facts.election2024Percent - 50) / 50; // 0..1 above a bare majority
    const signed = republican ? margin : -margin;
    return value(0.5 + signed * 0.62, 0.8, {
      election_2024: facts.election2024,
      election_2024_percent: facts.election2024Percent,
    });
  },

  lgbtq_municipal_policy: (facts) => {
    // Measures municipal POLICY only. Says nothing about social climate — see
    // lgbtq_social_acceptance, which is editorial-only for exactly that reason.
    //
    // A legacy import once stored 100 for 51 HRC rows despite each row carrying
    // its actual HRC score in `lgbtq_rating`. The repair script corrects those
    // values, but keep this guard so a bad future import cannot turn a third of
    // the dataset into maximally protective policy scores.
    const meiTrustworthy =
      facts.lgbtqMeiScore !== null &&
      !(facts.lgbtqMeiScore === 100 && facts.lgbtqRating !== null && facts.lgbtqRating !== 100);

    if (facts.lgbtqRating !== null) {
      return value(linScale(facts.lgbtqRating, 0, 100), meiTrustworthy ? 0.8 : 0.6, {
        lgbtq_rating: facts.lgbtqRating,
        lgbtq_mei_score: facts.lgbtqMeiScore,
        basis: meiTrustworthy
          ? "HRC Municipal Equality Index"
          : "lgbtq_rating; stored mei_score of 100 rejected as the known corruption signature",
      });
    }
    if (meiTrustworthy && facts.lgbtqMeiScore !== null) {
      return value(linScale(facts.lgbtqMeiScore, 0, 100), 0.8, {
        lgbtq_mei_score: facts.lgbtqMeiScore,
        basis: "HRC Municipal Equality Index",
      });
    }
    return null;
  },

  perceived_everyday_safety: (facts) => {
    const grade = parseCrimeGrade(facts.crime);
    if (grade === null) return null;
    // Low confidence on purpose: the column mixes two grading vocabularies from
    // different sources, and the feature is about how safe life FEELS, which a
    // crime index only partly predicts. A dossier should override this.
    return value(grade, 0.5, { crime: facts.crime });
  },

  water_recreation_access: (facts, ctx) => {
    if (facts.nearLake === null && facts.nearOcean === null && facts.vibes === null) return null;
    const vibes = facts.vibes ?? [];
    let score = 0.1;
    if (facts.nearLake) score += 0.35;
    if (facts.nearOcean) score += 0.35;
    if (vibes.includes("lake_living")) score += 0.2;
    if (vibes.includes("beach_life")) score += 0.2;
    if (vibes.includes("great_outdoors")) score += 0.1;
    // Rivers are not a column: a place can have excellent water recreation and
    // score low here. Confidence stays modest for that reason.
    score += 0.1 * (1 - ctx.localDepth);
    return value(score, 0.45, {
      near_lake: facts.nearLake,
      near_ocean: facts.nearOcean,
      vibes: vibes.join(",") || null,
      caveat: "no river data available",
    });
  },

  outdoor_recreation_access: (facts, ctx) => {
    if (
      facts.nearLake === null &&
      facts.nearOcean === null &&
      facts.nearMountains === null &&
      facts.vibes === null
    ) {
      return null;
    }
    const vibes = facts.vibes ?? [];
    let score = 0.12;
    if (facts.nearMountains) score += 0.3;
    if (facts.nearLake) score += 0.18;
    if (facts.nearOcean) score += 0.18;
    if (vibes.includes("great_outdoors")) score += 0.2;
    if (vibes.includes("mountain_living")) score += 0.1;
    if (vibes.includes("quiet_retreat")) score += 0.05;
    // Open country is closer at hand where the settlement is small.
    score += 0.15 * (1 - ctx.localDepth);
    return value(score, 0.55, {
      near_mountains: facts.nearMountains,
      near_lake: facts.nearLake,
      near_ocean: facts.nearOcean,
      vibes: vibes.join(",") || null,
    });
  },
};

export function deriveAll(
  facts: LocationFacts,
  ctx: Context
): Record<string, DerivedValue> {
  const out: Record<string, DerivedValue> = {};
  for (const [key, deriver] of Object.entries(DERIVERS)) {
    const derived = deriver(facts, ctx);
    if (derived !== null) out[key] = derived;
  }
  return out;
}
