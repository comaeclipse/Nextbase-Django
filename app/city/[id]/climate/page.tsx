import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getHourlyWeatherNormals,
  getLocationById,
  getMonthlyWeather,
} from "@/lib/locations";
import {
  buildDewPointByMonth,
  buildDiurnal,
  buildMonthly,
  buildStation,
} from "@/lib/climate";
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

  const [monthlyRows, hourlyRows] = await Promise.all([
    getMonthlyWeather(location.id),
    getHourlyWeatherNormals(location.id),
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
      monthly={monthly}
      diurnal={diurnal}
      dewPoints={buildDewPointByMonth(hourlyRows)}
      station={buildStation(hourlyRows)}
      dataVintage={monthlyRows[0]?.data_vintage ?? hourlyRows[0]?.data_vintage ?? null}
    />
  );
}
