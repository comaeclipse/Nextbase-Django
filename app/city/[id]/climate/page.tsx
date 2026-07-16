import { notFound } from "next/navigation";
import CityClimateDashboard, {
  type ClimateAirQuality,
  type ClimateHour,
  type ClimateMonth,
} from "@/components/city-climate/CityClimateDashboard";
import {
  getHourlyWeatherNormals,
  getLatestAirQualityAnnual,
  getLocationById,
  getMonthlyWeather,
} from "@/lib/locations";

export const dynamic = "force-dynamic";

function parseId(id: string): number | null {
  return /^\d+$/.test(id) ? Number(id) : null;
}

function numberOrNull(value: string | null): number | null {
  return value == null ? null : Number(value);
}

export default async function CityClimatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const locationId = parseId(id);
  if (locationId === null) notFound();

  const [city, monthlyRows, hourlyRows, airQualityRow] = await Promise.all([
    getLocationById(locationId),
    getMonthlyWeather(locationId),
    getHourlyWeatherNormals(locationId),
    getLatestAirQualityAnnual(locationId),
  ]);
  if (!city) notFound();

  const monthly: ClimateMonth[] = monthlyRows.map((row) => ({
    month: row.month,
    high: numberOrNull(row.avg_high_f),
    low: numberOrNull(row.avg_low_f),
    average: numberOrNull(row.avg_temp_f),
    precipitation: numberOrNull(row.precip_in),
    snow: numberOrNull(row.snow_in),
    precipitationDays: row.precip_days,
    humidity: row.humidity_pct,
    sunshine: row.sun_pct,
    dataVintage: row.data_vintage,
    sourceUrl: row.source_url,
  }));
  const hourly: ClimateHour[] = hourlyRows.map((row) => ({
    month: row.month,
    hour: row.hour,
    temperature: numberOrNull(row.temp_f),
    dewPoint: numberOrNull(row.dew_point_f),
    dewPointP10: numberOrNull(row.dew_point_p10_f),
    dewPointP90: numberOrNull(row.dew_point_p90_f),
    heatIndex: numberOrNull(row.heat_index_f),
    stationName: row.station_name,
    stationDistance: numberOrNull(row.station_distance_mi),
    dataVintage: row.data_vintage,
    sourceUrl: row.source_url,
  }));
  const airQuality: ClimateAirQuality | null = airQualityRow
    ? {
        year: Number(airQualityRow.year),
        goodDays: Number(airQualityRow.good_days),
        moderateDays: Number(airQualityRow.moderate_days),
        unhealthySensitiveDays: Number(airQualityRow.unhealthy_sensitive_days),
        unhealthyDays: Number(airQualityRow.unhealthy_days),
        veryUnhealthyDays: Number(airQualityRow.very_unhealthy_days),
        hazardousDays: Number(airQualityRow.hazardous_days),
        medianAqi: Number(airQualityRow.median_aqi),
        p90Aqi: Number(airQualityRow.p90_aqi),
        maxAqi: Number(airQualityRow.max_aqi),
        sourceGeoName: airQualityRow.source_geo_name,
        sourceGeoType: airQualityRow.source_geo_type,
        sourceUrl: airQualityRow.source_url,
      }
    : null;

  return (
    <CityClimateDashboard
      city={{
        id: city.id,
        name: city.name,
        state: city.state,
        climate: city.climate,
        climateCategory: city.climate_category,
        annualSnow: city.snow_annual,
        annualRain: city.rain_annual,
        sunDays: city.sun_days,
        winterLow: city.alw,
        summerHigh: city.avg_high_summer,
        summerHumidity: city.humidity_summer,
      }}
      monthly={monthly}
      hourly={hourly}
      airQuality={airQuality}
    />
  );
}
