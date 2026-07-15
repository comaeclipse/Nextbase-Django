import { getAllLocations, getAllMonthlyWeather } from "@/lib/locations";
import WeatherClient, {
  type WeatherCity,
  type MonthPoint,
} from "@/components/WeatherClient";

// Reads the live Neon schema, so it must render per-request.
export const dynamic = "force-dynamic";

const numOrNull = (v: string | null): number | null =>
  v == null ? null : Number(v);

export default async function WeatherPage() {
  const [rows, monthlyRows] = await Promise.all([
    getAllLocations(),
    getAllMonthlyWeather(),
  ]);

  // Group the flat monthly rows by location_id.
  const monthlyByLocation = new Map<number, MonthPoint[]>();
  for (const m of monthlyRows) {
    const list = monthlyByLocation.get(m.location_id) ?? [];
    list.push({
      month: m.month,
      high: numOrNull(m.avg_high_f),
      low: numOrNull(m.avg_low_f),
      precip: numOrNull(m.precip_in),
      snow: numOrNull(m.snow_in),
    });
    monthlyByLocation.set(m.location_id, list);
  }

  const cities: WeatherCity[] = rows
    .map((r) => {
      const monthly: MonthPoint[] = monthlyByLocation.get(r.id) ?? [];
      return {
        id: r.id,
        name: r.name,
        state: r.state,
        climate: r.climate,
        climateCategory: r.climate_category,
        snow: r.snow_annual,
        rain: r.rain_annual,
        sunDays: r.sun_days,
        winterLow: r.alw,
        summerHigh: r.avg_high_summer,
        humidity: r.humidity_summer,
        monthly,
      };
    })
    .sort((a, b) =>
      a.name.localeCompare(b.name) || a.state.localeCompare(b.state)
    );

  return <WeatherClient cities={cities} />;
}
