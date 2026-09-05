import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AirQualityAnnualRow, HourlyWeatherNormalRow, WeatherMonthlyRow } from "../../lib/types";
const { query } = vi.hoisted(() => ({ query: vi.fn() }));
vi.mock("../../lib/db", () => ({ getSql: () => ({ query }) }));
import { getCityClimate, shapeCityClimate } from "./climate-queries";

const place = { id: 1, name: "Elko", state: "NV", is_candidate: true };
const source = { data_vintage: "1991–2020", source_kind: "NOAA", source_url: "https://example.org/normals", source_retrieved_on: "2026-08-01" };
const monthly: WeatherMonthlyRow = {
  id: 1, location_id: 1, month: 7, avg_high_f: "92", avg_low_f: "50", avg_temp_f: "71",
  precip_in: "0.5", snow_in: "0", precip_days: null, humidity_pct: null, sun_pct: null, ...source,
};
const hourly: HourlyWeatherNormalRow = {
  id: 1, location_id: 1, month: 7, hour: 0, temp_f: "120", dew_point_f: "40",
  dew_point_p10_f: null, dew_point_p90_f: null, heat_index_f: "140",
  station_id: "far", station_name: "Distant airport", station_distance_mi: "65", ...source,
};
const air: AirQualityAnnualRow = {
  id: 1, location_id: 1, year: 2025, source_geo_type: "nearest_county", source_state_name: "Nevada",
  source_geo_name: "Elko County", source_distance_miles: "20", days_with_aqi: 100,
  good_days: 80, moderate_days: 10, unhealthy_sensitive_days: 4, unhealthy_days: 3,
  very_unhealthy_days: 2, hazardous_days: 1, max_aqi: 310, p90_aqi: 100, median_aqi: 40,
  days_co: 0, days_no2: 0, days_ozone: 10, days_pm25: 90, days_pm10: 0,
  data_vintage: "2025", source_kind: "EPA", source_url: "https://example.org/aqi",
  source_file: "annual.csv", source_retrieved_on: "2026-08-01",
};
beforeEach(() => query.mockReset());

describe("climate facts", () => {
  it("keeps distant station temperatures out of city climate and preserves provenance", () => {
    const result = shapeCityClimate(place, [monthly], [hourly], air, 7);
    expect(result.months).toHaveLength(1);
    expect(result.months[0].temperatureAndPrecipitation).toMatchObject({ averageHighF: 92, snowfallInches: 0, precipitationDays: null, dataVintage: "1991–2020" });
    expect(result.months[0].moisture).toMatchObject({ meanDewPointF: 40, hoursRepresented: 1, stations: [{ distanceMiles: 65 }] });
    expect(JSON.stringify(result)).not.toContain('"120"');
    expect(result.airQuality).toMatchObject({ year: 2025, area: "Elko County", scope: "nearest_county", observedDays: 100, daysAbove100: 10, daysAbove150: 6 });
  });
  it("does not fill missing months, temperature fields or AQI with zero or hourly temperature", () => {
    const result = shapeCityClimate({ ...place, is_candidate: false }, [{ ...monthly, avg_high_f: null }], [hourly], null);
    expect(result.months).toHaveLength(12);
    expect(result.months[0].temperatureAndPrecipitation).toBeNull();
    expect(result.months[0].moisture).toBeNull();
    expect(result.months[6].temperatureAndPrecipitation?.averageHighF).toBeNull();
    expect(result.airQuality).toBeNull();
    expect(result.isCandidate).toBe(false);
  });
  it("accepts full state names without case sensitivity and binds explicit years", async () => {
    query.mockResolvedValueOnce([place]).mockResolvedValueOnce([monthly]).mockResolvedValueOnce([hourly]).mockResolvedValueOnce([]);
    const result = await getCityClimate("Elko, nevada", 7, 2024);
    expect(query.mock.calls[0][1]).toEqual(["Elko", "NV"]);
    expect(query.mock.calls[3][0]).toContain("AND year = $2");
    expect(query.mock.calls[3][1]).toEqual([1, 2024]);
    expect(result).toMatchObject({ matched: true, airQuality: null });
  });
  it("requests the latest recorded AQI year by default", async () => {
    query.mockResolvedValueOnce([place]).mockResolvedValueOnce([]).mockResolvedValueOnce([]).mockResolvedValueOnce([air]);
    expect(await getCityClimate("Elko, NV")).toMatchObject({ airQuality: { year: 2025 } });
    expect(query.mock.calls[3][0]).toContain("ORDER BY year DESC LIMIT 1");
    expect(query.mock.calls[3][1]).toEqual([1]);
  });
  it("does not query climate for ambiguous or unknown places", async () => {
    query.mockResolvedValueOnce([place, { ...place, state: "GA" }]);
    expect(await getCityClimate("Elko")).toMatchObject({ matched: false, status: "ambiguous" });
    expect(query).toHaveBeenCalledTimes(1);
    query.mockResolvedValueOnce([]);
    expect(await getCityClimate("Missing, NV")).toMatchObject({ status: "unknown" });
    expect(query).toHaveBeenCalledTimes(2);
  });
  it("never discards an invalid supplied state or accepts invalid periods", async () => {
    expect(await getCityClimate("Elko, typo")).toMatchObject({ status: "invalid_input" });
    expect(await getCityClimate("Elko,")).toMatchObject({ status: "invalid_input" });
    await expect(getCityClimate("Elko", 13)).rejects.toThrow("Month");
    await expect(getCityClimate("Elko", 7, 0)).rejects.toThrow("Year");
    expect(query).not.toHaveBeenCalled();
  });
  it("propagates a read failure instead of claiming no measurements", async () => {
    query.mockResolvedValueOnce([place]).mockRejectedValueOnce(new Error("DB unavailable"));
    await expect(getCityClimate("Elko")).rejects.toThrow("DB unavailable");
  });
});
