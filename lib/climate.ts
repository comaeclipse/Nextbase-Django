/**
 * Shapes the two climate-normals tables into chart-ready series for
 * /city/[id]/climate.
 *
 * The split matters (see SCHEMA.md): `location_weather_monthly` is
 * authoritative for temperature, `location_hourly_normals` for moisture. The
 * hourly rows come from the nearest *airport* station, which can be tens of
 * miles away — its dew point travels fine, its absolute temperature does not.
 * `buildDiurnal` is where those two are reconciled.
 */

import type { HourlyWeatherNormalRow, WeatherMonthlyRow } from "./types";

export const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
] as const;

const num = (v: string | null): number | null => (v == null ? null : Number(v));

const toCelsius = (f: number) => ((f - 32) * 5) / 9;

/** Magnus-Tetens, the same approximation the NWS publishes. */
export function relativeHumidity(tempF: number, dewPointF: number): number {
  const t = toCelsius(tempF);
  const d = toCelsius(dewPointF);
  const ratio = Math.exp(
    (17.625 * d) / (243.04 + d) - (17.625 * t) / (243.04 + t)
  );
  return Math.min(100, Math.max(1, ratio * 100));
}

/** NWS Rothfusz regression, with the fallback it specifies below ~80°F. */
export function heatIndex(tempF: number, rh: number): number {
  const simple = 0.5 * (tempF + 61 + (tempF - 68) * 1.2 + rh * 0.094);
  if ((simple + tempF) / 2 < 80) return Math.max(tempF, simple);

  const t = tempF;
  const r = rh;
  let hi =
    -42.379 +
    2.04901523 * t +
    10.14333127 * r -
    0.22475541 * t * r -
    0.00683783 * t * t -
    0.05481717 * r * r +
    0.00122874 * t * t * r +
    0.00085282 * t * r * r -
    0.00000199 * t * t * r * r;

  if (r > 85 && t >= 80 && t <= 87) {
    hi += ((r - 85) / 10) * ((87 - t) / 5);
  }

  return Math.max(tempF, hi);
}

/** 14 → "2 PM". */
export function formatHour(hour: number): string {
  const suffix = hour < 12 ? "AM" : "PM";
  const h = hour % 12 === 0 ? 12 : hour % 12;
  return `${h} ${suffix}`;
}

export interface ClimateMonthPoint {
  month: number;
  label: string;
  high: number | null;
  low: number | null;
  avg: number | null;
  /** Stacked base + span drives the high/low band; see MonthlyTemperature. */
  base: number | null;
  span: number | null;
  precip: number | null;
  snow: number | null;
}

export interface ClimateHourPoint {
  hour: number;
  label: string;
  temp: number;
  feelsLike: number;
  dewPoint: number;
}

export interface ClimateDewPoint {
  month: number;
  label: string;
  dewPoint: number;
  p10: number;
  p90: number;
  /** Stacked base + span drives the p10–p90 band. */
  base: number;
  span: number;
}

export interface ClimateStation {
  name: string;
  distanceMi: number;
}

export function buildMonthly(rows: WeatherMonthlyRow[]): ClimateMonthPoint[] {
  return rows.map((r) => {
    const high = num(r.avg_high_f);
    const low = num(r.avg_low_f);
    return {
      month: r.month,
      label: MONTH_LABELS[r.month - 1] ?? String(r.month),
      high,
      low,
      avg: num(r.avg_temp_f),
      base: low,
      span: high !== null && low !== null ? high - low : null,
      precip: num(r.precip_in),
      snow: num(r.snow_in),
    };
  });
}

/** Mean dew point per month, averaged across all 24 hours, with its spread. */
export function buildDewPointByMonth(
  rows: HourlyWeatherNormalRow[]
): ClimateDewPoint[] {
  const byMonth = new Map<number, HourlyWeatherNormalRow[]>();
  for (const r of rows) {
    if (r.dew_point_f == null) continue;
    const list = byMonth.get(r.month) ?? [];
    list.push(r);
    byMonth.set(r.month, list);
  }

  const out: ClimateDewPoint[] = [];
  for (const [month, hours] of [...byMonth.entries()].sort((a, b) => a[0] - b[0])) {
    const mean = (pick: (r: HourlyWeatherNormalRow) => number | null) => {
      const vals = hours.map(pick).filter((v): v is number => v !== null);
      return vals.length
        ? vals.reduce((a, b) => a + b, 0) / vals.length
        : null;
    };

    const dewPoint = mean((r) => num(r.dew_point_f));
    if (dewPoint === null) continue;
    const p10 = mean((r) => num(r.dew_point_p10_f)) ?? dewPoint;
    const p90 = mean((r) => num(r.dew_point_p90_f)) ?? dewPoint;

    out.push({
      month,
      label: MONTH_LABELS[month - 1] ?? String(month),
      dewPoint: round1(dewPoint),
      p10: round1(p10),
      p90: round1(p90),
      base: round1(p10),
      span: round1(Math.max(0, p90 - p10)),
    });
  }
  return out;
}

/**
 * A typical day for each month: hour-by-hour temperature, dew point, and heat
 * index.
 *
 * The station's diurnal *shape* (how far and when the temperature swings) is
 * representative even from distance, but its absolute level is not — so each
 * month's curve is rescaled to land its daily min/max on that month's
 * `avg_low_f`/`avg_high_f` from the authoritative monthly normals. This removes
 * the station's siting bias and keeps this chart from contradicting the
 * monthly-temperature chart on the same page.
 *
 * Heat index is then *recomputed* from the anchored temperature and the
 * (unshifted, measured) dew point rather than rescaled — it's a non-linear
 * function of both, so an affine shift would be meaningless.
 *
 * Months with no monthly normal fall back to the raw station temperature.
 */
export function buildDiurnal(
  hourlyRows: HourlyWeatherNormalRow[],
  monthly: ClimateMonthPoint[]
): Map<number, ClimateHourPoint[]> {
  const monthlyByMonth = new Map(monthly.map((m) => [m.month, m]));
  const byMonth = new Map<number, HourlyWeatherNormalRow[]>();
  for (const r of hourlyRows) {
    if (r.temp_f == null || r.dew_point_f == null) continue;
    const list = byMonth.get(r.month) ?? [];
    list.push(r);
    byMonth.set(r.month, list);
  }

  const out = new Map<number, ClimateHourPoint[]>();
  for (const [month, rows] of byMonth) {
    const hours = [...rows].sort((a, b) => a.hour - b.hour);
    const stationTemps = hours.map((r) => Number(r.temp_f));
    const sMin = Math.min(...stationTemps);
    const sMax = Math.max(...stationTemps);

    const target = monthlyByMonth.get(month);
    const canAnchor =
      target?.high != null && target.low != null && sMax - sMin > 0.1;
    const scale = canAnchor ? (target!.high! - target!.low!) / (sMax - sMin) : 1;

    out.set(
      month,
      hours.map((r, i) => {
        const temp = canAnchor
          ? target!.low! + (stationTemps[i] - sMin) * scale
          : stationTemps[i];
        // Dew point can't exceed air temperature; clamp so RH tops out at 100.
        const dewPoint = Math.min(Number(r.dew_point_f), temp);
        const rh = relativeHumidity(temp, dewPoint);
        return {
          hour: r.hour,
          label: formatHour(r.hour),
          temp: round1(temp),
          feelsLike: round1(heatIndex(temp, rh)),
          dewPoint: round1(dewPoint),
        };
      })
    );
  }
  return out;
}

export function buildStation(
  rows: HourlyWeatherNormalRow[]
): ClimateStation | null {
  const first = rows.find((r) => r.station_name);
  if (!first) return null;
  return {
    name: first.station_name!,
    distanceMi: Number(first.station_distance_mi),
  };
}

export type DewPointComfort = {
  label: string;
  /** Index into DEW_RAMP — a single-hue ordinal scale, dry → oppressive. */
  step: number;
};

/** The conventional NWS comfort bands for dew point. */
export function dewPointComfort(dewPointF: number): DewPointComfort {
  if (dewPointF < 50) return { label: "Dry", step: 0 };
  if (dewPointF < 60) return { label: "Comfortable", step: 1 };
  if (dewPointF < 65) return { label: "Sticky", step: 2 };
  if (dewPointF < 70) return { label: "Muggy", step: 3 };
  return { label: "Oppressive", step: 4 };
}

/** Dew point is ordered, not categorical, so its key is one hue getting deeper. */
export const DEW_RAMP = [
  "#cbe9e4",
  "#8fd2c9",
  "#4fb3a5",
  "#2b8577",
  "#155e54",
] as const;

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
