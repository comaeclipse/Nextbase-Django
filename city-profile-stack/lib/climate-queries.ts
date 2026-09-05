/** Monthly climate and historical AQI for chat; never a current weather forecast. */
import { getSql } from "../../lib/db";
import { buildMonthly, buildDewPointByMonth, MONTH_LABELS } from "../../lib/climate";
import { resolveStateAbbr, STATE_NAME_TO_ABBR } from "../../lib/states";
import type { WeatherMonthlyRow, HourlyWeatherNormalRow, AirQualityAnnualRow } from "../../lib/types";

interface ClimatePlace { id: number; name: string; state: string; is_candidate: boolean }
interface Provenance {
  data_vintage: string | null;
  source_kind: string | null;
  source_url: string | null;
  source_retrieved_on: string | null;
}
const provenance = (r: Provenance) => ({
  dataVintage: r.data_vintage, source: r.source_kind,
  sourceUrl: r.source_url, retrievedOn: r.source_retrieved_on,
});

export function shapeCityClimate(
  place: ClimatePlace, monthly: WeatherMonthlyRow[], hourly: HourlyWeatherNormalRow[],
  air: AirQualityAnnualRow | null, month?: number, year?: number,
) {
  const temperatures = buildMonthly(monthly);
  const moisture = buildDewPointByMonth(hourly);
  const months = month ? [month] : Array.from({ length: 12 }, (_, i) => i + 1);
  return {
    matched: true as const, city: `${place.name}, ${place.state}`, isCandidate: place.is_candidate,
    months: months.map((m) => {
      const t = temperatures.find((r) => r.month === m);
      const d = moisture.find((r) => r.month === m);
      const row = monthly.find((r) => r.month === m);
      const hours = hourly.filter((r) => r.month === m && r.dew_point_f != null);
      return {
        month: m, label: MONTH_LABELS[m - 1],
        temperatureAndPrecipitation: row && t ? {
          averageHighF: t.high, averageLowF: t.low, averageTempF: t.avg,
          precipitationInches: t.precip, snowfallInches: t.snow,
          precipitationDays: row.precip_days, ...provenance(row),
        } : null,
        moisture: d ? {
          meanDewPointF: d.dewPoint, hoursRepresented: hours.length,
          stations: [...new Map(hours.map((r) => [r.station_id, {
            id: r.station_id, name: r.station_name,
            distanceMiles: r.station_distance_mi == null ? null : Number(r.station_distance_mi),
            ...provenance(r),
          }])).values()],
        } : null,
      };
    }),
    airQuality: air ? {
      year: air.year, scope: air.source_geo_type, area: air.source_geo_name,
      state: air.source_state_name,
      distanceMiles: air.source_distance_miles == null ? null : Number(air.source_distance_miles),
      observedDays: air.days_with_aqi,
      goodDays: air.good_days, moderateDays: air.moderate_days,
      unhealthyForSensitiveGroupsDays: air.unhealthy_sensitive_days,
      unhealthyDays: air.unhealthy_days, veryUnhealthyDays: air.very_unhealthy_days,
      hazardousDays: air.hazardous_days,
      daysAbove100: air.unhealthy_sensitive_days + air.unhealthy_days + air.very_unhealthy_days + air.hazardous_days,
      daysAbove150: air.unhealthy_days + air.very_unhealthy_days + air.hazardous_days,
      medianAqi: air.median_aqi, p90Aqi: air.p90_aqi, maxAqi: air.max_aqi,
      ...provenance(air),
    } : null,
    airQualitySelection: year ? `Requested year ${year}; no fallback to another year.` : "Latest recorded year; not current air quality.",
    notes: [
      "Temperatures and precipitation are monthly long-run normals, not forecasts. Each month carries its source and vintage.",
      "Moisture is mean dew point from hourly station normals, not relative humidity. Station temperature is never substituted for city monthly temperature.",
      "AQI is annual history for the named source area, not a city-only measurement or current conditions. Always report its year, area, and observedDays denominator.",
      "Bad-air days can mean AQI above 100 (including sensitive groups) or above 150; name the threshold. Unobserved days are not clean days.",
      "Null means not recorded for this place or requested period, never zero. Monthly climate selection does not turn annual AQI into monthly AQI.",
      ...(!place.is_candidate ? ["This place is known but is not ranked as a retirement candidate."] : []),
    ],
  };
}

export async function getCityClimate(city: string, month?: number, year?: number) {
  if (month != null && (!Number.isInteger(month) || month < 1 || month > 12)) throw new Error("Month must be 1–12.");
  if (year != null && (!Number.isInteger(year) || year < 1900 || year > 2100)) throw new Error("Year must be 1900–2100.");
  const sep = city.lastIndexOf(",");
  const name = (sep < 0 ? city : city.slice(0, sep)).trim();
  const stateInput = sep < 0 ? null : city.slice(sep + 1).trim();
  const stateName = Object.keys(STATE_NAME_TO_ABBR).find((s) => s.toLowerCase() === stateInput?.toLowerCase());
  const state = resolveStateAbbr(stateName ?? stateInput);
  if (!name || (stateInput !== null && !state)) return {
    matched: false as const, status: "invalid_input", note: 'Use "City, ST" with a valid state.',
  };
  const sql = getSql();
  const places = await sql.query(
    `SELECT id, name, state, is_candidate FROM locations_location
     WHERE LOWER(name) = LOWER($1) ${state ? "AND state = $2" : ""} ORDER BY state, id`,
    state ? [name, state] : [name],
  ) as ClimatePlace[];
  if (!places.length) return { matched: false as const, status: "unknown", query: city, note: "No matching place found." };
  if (places.length > 1) return {
    matched: false as const, status: "ambiguous", query: city,
    candidates: places.map((p) => `${p.name}, ${p.state}`), note: "Ask which place the user means.",
  };
  const place = places[0];
  // Uncached reads also work in command-line smoke checks. Missing tables are an
  // operational error, not evidence that a city's measurements are absent.
  const [monthly, hourly, air] = await Promise.all([
    sql.query(`SELECT * FROM location_weather_monthly WHERE location_id = $1 ORDER BY month`, [place.id]),
    sql.query(`SELECT * FROM location_hourly_normals WHERE location_id = $1 ORDER BY month, hour`, [place.id]),
    sql.query(`SELECT * FROM location_air_quality_annual WHERE location_id = $1
      ${year ? "AND year = $2" : ""} ORDER BY year DESC LIMIT 1`, year ? [place.id, year] : [place.id]),
  ]);
  return shapeCityClimate(place, monthly as WeatherMonthlyRow[], hourly as HourlyWeatherNormalRow[],
    (air[0] as AirQualityAnnualRow) ?? null, month, year);
}
