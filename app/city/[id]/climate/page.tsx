import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getHourlyWeatherNormals,
  getLatestAirQuality,
  getLocationById,
  getMonthlyWeather,
} from "@/lib/locations";
import {
  buildDewPointByMonth,
  buildDiurnal,
  buildMonthly,
  buildStation,
} from "@/lib/climate";
import { getCityClimateNote } from "@/lib/city-climate-notes";
import CityClimateDashboard from "@/components/city-climate/CityClimateDashboard";

// Reads the live Neon schema, so it must render per-request.
export const dynamic = "force-dynamic";

function parseId(id: string): number | null {
  if (!/^\d+$/.test(id)) return null;
  return Number(id);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const pk = parseId(id);
  if (pk === null) return { title: "VetRetire" };
  const location = await getLocationById(pk);
  if (!location) return { title: "VetRetire" };
  return {
    title: `${location.name}, ${location.state} climate — VetRetire`,
    description: `Temperature, humidity, and precipitation normals for ${location.name}, ${location.state}.`,
  };
}

export default async function CityClimatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const pk = parseId(id);
  if (pk === null) notFound();

  const location = await getLocationById(pk);
  if (!location) notFound();

  const [monthlyRows, hourlyRows, airQuality] = await Promise.all([
    getMonthlyWeather(location.id),
    getHourlyWeatherNormals(location.id),
    getLatestAirQuality(location.id),
  ]);

  const monthly = buildMonthly(monthlyRows);
  // Serialize the Map — this crosses the server/client boundary.
  const diurnal = Object.fromEntries(buildDiurnal(hourlyRows, monthly));

  return (
    <CityClimateDashboard
      city={{
        id: location.id,
        name: location.name,
        state: location.state,
        climate: location.climate,
        summerHigh: location.avg_high_summer,
        winterLow: location.alw,
        rainAnnual: location.rain_annual,
        snowAnnual: location.snow_annual,
        sunDays: location.sun_days,
      }}
      airQuality={
        airQuality
          ? {
              year: airQuality.year,
              sourceGeoName: airQuality.source_geo_name,
              sourceGeoType: airQuality.source_geo_type,
              goodDays: airQuality.good_days,
              moderateDays: airQuality.moderate_days,
              unhealthyDays:
                airQuality.unhealthy_sensitive_days +
                airQuality.unhealthy_days +
                airQuality.very_unhealthy_days +
                airQuality.hazardous_days,
              medianAqi: airQuality.median_aqi,
              p90Aqi: airQuality.p90_aqi,
            }
          : null
      }
      climateNote={getCityClimateNote(location.name, location.state)}
      monthly={monthly}
      diurnal={diurnal}
      dewPoints={buildDewPointByMonth(hourlyRows)}
      station={buildStation(hourlyRows)}
      dataVintage={monthlyRows[0]?.data_vintage ?? hourlyRows[0]?.data_vintage ?? null}
    />
  );
}
