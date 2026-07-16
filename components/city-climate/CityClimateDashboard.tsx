"use client";

import * as React from "react";
import Link from "next/link";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowLeft,
  CalendarDays,
  CloudRain,
  Droplets,
  Gauge,
  Leaf,
  Snowflake,
  Sun,
  ThermometerSun,
  Wind,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type ClimateMonth = {
  month: number;
  high: number | null;
  low: number | null;
  average: number | null;
  precipitation: number | null;
  snow: number | null;
  precipitationDays: number | null;
  humidity: number | null;
  sunshine: number | null;
  dataVintage: string | null;
  sourceUrl: string | null;
};

export type ClimateHour = {
  month: number;
  hour: number;
  temperature: number | null;
  dewPoint: number | null;
  dewPointP10: number | null;
  dewPointP90: number | null;
  heatIndex: number | null;
  stationName: string | null;
  stationDistance: number | null;
  dataVintage: string | null;
  sourceUrl: string | null;
};

export type ClimateAirQuality = {
  year: number;
  goodDays: number;
  moderateDays: number;
  unhealthySensitiveDays: number;
  unhealthyDays: number;
  veryUnhealthyDays: number;
  hazardousDays: number;
  medianAqi: number;
  p90Aqi: number;
  maxAqi: number;
  sourceGeoName: string;
  sourceGeoType: string;
  sourceUrl: string;
};

type DashboardProps = {
  city: {
    id: number;
    name: string;
    state: string;
    climate: string | null;
    climateCategory: string | null;
    annualSnow: number | null;
    annualRain: number | null;
    sunDays: number | null;
    winterLow: number | null;
    summerHigh: number | null;
    summerHumidity: number | null;
  };
  monthly: ClimateMonth[];
  hourly: ClimateHour[];
  airQuality: ClimateAirQuality | null;
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const COLORS = {
  high: "#f97316",
  low: "#2563eb",
  average: "#a855f7",
  rain: "#0ea5e9",
  snow: "#93c5fd",
  dew: "#0f766e",
  heat: "#dc2626",
  good: "#22c55e",
  moderate: "#f59e0b",
  unhealthy: "#f97316",
  severe: "#dc2626",
} as const;

const tempConfig = {
  high: { label: "Average high", color: COLORS.high },
  low: { label: "Average low", color: COLORS.low },
  average: { label: "Average", color: COLORS.average },
} satisfies ChartConfig;

const precipitationConfig = {
  precipitation: { label: "Precipitation", color: COLORS.rain },
  snow: { label: "Snow", color: COLORS.snow },
} satisfies ChartConfig;

const humidityConfig = {
  temperature: { label: "Temperature", color: COLORS.high },
  dewPoint: { label: "Dew point", color: COLORS.dew },
  heatIndex: { label: "Heat index", color: COLORS.heat },
} satisfies ChartConfig;

function value(value: number | null, suffix = "") {
  return value == null ? "—" : `${value}${suffix}`;
}

function MetricCard({
  icon: Icon,
  label,
  metric,
  detail,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  metric: string;
  detail: string;
}) {
  return (
    <Card className="gap-0 py-0 shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
            <p className="mt-1 text-2xl font-bold tracking-tight tabular-nums">{metric}</p>
            <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
          </div>
          <Icon className="mt-0.5 size-5 text-muted-foreground" aria-hidden />
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="flex h-[280px] items-center justify-center rounded-lg border border-dashed px-6 text-center text-sm text-muted-foreground">
      {label} data is not available for this city yet.
    </div>
  );
}

export default function CityClimateDashboard({ city, monthly, hourly, airQuality }: DashboardProps) {
  const [selectedMonth, setSelectedMonth] = React.useState("7");
  const monthlyData = monthly.map((row) => ({ ...row, label: MONTHS[row.month - 1] ?? String(row.month) }));
  const temperatureData = monthlyData.filter((row) => row.high != null || row.low != null || row.average != null);
  const precipitationData = monthlyData.filter((row) => row.precipitation != null || row.snow != null);
  const hourData = hourly
    .filter((row) => row.month === Number(selectedMonth))
    .map((row) => ({ ...row, label: `${String(row.hour).padStart(2, "0")}:00` }));
  const monthlySource = monthly.find((row) => row.sourceUrl)?.sourceUrl;
  const monthlyVintage = monthly.find((row) => row.dataVintage)?.dataVintage;
  const hourlySource = hourly.find((row) => row.sourceUrl)?.sourceUrl;
  const hourlyVintage = hourly.find((row) => row.dataVintage)?.dataVintage;
  const station = hourly.find((row) => row.stationName);
  const airData = airQuality
    ? [
        { label: "Good", value: airQuality.goodDays, fill: COLORS.good },
        { label: "Moderate", value: airQuality.moderateDays, fill: COLORS.moderate },
        { label: "Sensitive groups", value: airQuality.unhealthySensitiveDays, fill: COLORS.unhealthy },
        { label: "Unhealthy or worse", value: airQuality.unhealthyDays + airQuality.veryUnhealthyDays + airQuality.hazardousDays, fill: COLORS.severe },
      ].filter((row) => row.value > 0)
    : [];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col justify-between gap-4 border-b pb-6 sm:flex-row sm:items-end">
        <div>
          <Link href={`/city/${city.id}`} className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            <ArrowLeft className="size-4" /> Back to {city.name}
          </Link>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">{city.name} climate dashboard</h1>
            {city.climate && <Badge variant="secondary">{city.climate}</Badge>}
          </div>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            A detailed view of the climate normals, seasonal precipitation, hourly moisture, and air quality available for {city.name}, {city.state}.
          </p>
        </div>
        <Badge variant="outline" className="w-fit gap-1.5 px-3 py-1.5">
          <CalendarDays className="size-3.5" /> Climate normals {monthlyVintage ?? hourlyVintage ?? "available"}
        </Badge>
      </div>

      <section aria-label="Annual climate snapshot" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={ThermometerSun} label="Summer high" metric={value(city.summerHigh, "°F")} detail="Average high in summer" />
        <MetricCard icon={Snowflake} label="Winter low" metric={value(city.winterLow, "°F")} detail="Average low in winter" />
        <MetricCard icon={CloudRain} label="Annual rain" metric={value(city.annualRain, '"')} detail="Average rainfall per year" />
        <MetricCard icon={Snowflake} label="Annual snow" metric={value(city.annualSnow, '"')} detail="Average snowfall per year" />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg"><ThermometerSun className="size-5 text-orange-600" /> Temperature through the year</CardTitle>
            <CardDescription>NOAA monthly average high, low, and mean temperature in °F.</CardDescription>
          </CardHeader>
          <CardContent>
            {temperatureData.length ? (
              <ChartContainer config={tempConfig} className="h-[310px] w-full">
                <LineChart data={temperatureData} margin={{ left: 0, right: 12, top: 10, bottom: 0 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
                  <YAxis tickFormatter={(number) => `${number}°`} tickLine={false} axisLine={false} width={42} />
                  <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
                  <Legend verticalAlign="top" height={36} />
                  <Line type="monotone" dataKey="high" stroke={COLORS.high} strokeWidth={2.5} dot={false} connectNulls />
                  <Line type="monotone" dataKey="average" stroke={COLORS.average} strokeWidth={2} strokeDasharray="5 4" dot={false} connectNulls />
                  <Line type="monotone" dataKey="low" stroke={COLORS.low} strokeWidth={2.5} dot={false} connectNulls />
                </LineChart>
              </ChartContainer>
            ) : <EmptyChart label="Monthly temperature" />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg"><Sun className="size-5 text-amber-500" /> Year at a glance</CardTitle>
            <CardDescription>Annual figures used in the city profile.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">Sunny days</p><p className="mt-1 text-2xl font-semibold tabular-nums">{value(city.sunDays, " / 365")}</p></div>
            <div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">Summer humidity</p><p className="mt-1 text-2xl font-semibold tabular-nums">{value(city.summerHumidity, "%")}</p></div>
            <div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">Climate classification</p><p className="mt-1 text-base font-semibold">{city.climate ?? "Not classified"}</p></div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg"><CloudRain className="size-5 text-sky-600" /> Precipitation by month</CardTitle>
            <CardDescription>Rain-equivalent precipitation and snowfall totals in inches.</CardDescription>
          </CardHeader>
          <CardContent>
            {precipitationData.length ? (
              <ChartContainer config={precipitationConfig} className="h-[300px] w-full">
                <BarChart data={precipitationData} margin={{ left: 0, right: 12, top: 10, bottom: 0 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
                  <YAxis tickFormatter={(number) => `${number}\"`} tickLine={false} axisLine={false} width={42} />
                  <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                  <Legend verticalAlign="top" height={36} />
                  <Bar dataKey="precipitation" fill={COLORS.rain} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="snow" fill={COLORS.snow} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            ) : <EmptyChart label="Monthly precipitation" />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg"><Droplets className="size-5 text-teal-600" /> Wet days</CardTitle>
            <CardDescription>Days with measurable precipitation, where available.</CardDescription>
          </CardHeader>
          <CardContent>
            {monthlyData.some((row) => row.precipitationDays != null) ? (
              <ChartContainer config={{ days: { label: "Wet days", color: COLORS.rain } }} className="h-[300px] w-full">
                <AreaChart data={monthlyData} margin={{ left: 0, right: 12, top: 10, bottom: 0 }}>
                  <defs><linearGradient id="wet-days" x1="0" x2="0" y1="0" y2="1"><stop offset="5%" stopColor={COLORS.rain} stopOpacity={0.45} /><stop offset="95%" stopColor={COLORS.rain} stopOpacity={0.05} /></linearGradient></defs>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={32} />
                  <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
                  <Area type="monotone" dataKey="precipitationDays" name="days" stroke={COLORS.rain} fill="url(#wet-days)" strokeWidth={2} />
                </AreaChart>
              </ChartContainer>
            ) : <EmptyChart label="Monthly wet-day" />}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg"><Wind className="size-5 text-teal-700" /> A typical day: heat and moisture</CardTitle>
              <CardDescription>Hourly normals at the closest suitable NOAA moisture station.</CardDescription>
            </div>
            <Select value={selectedMonth} onValueChange={(nextMonth) => nextMonth && setSelectedMonth(nextMonth)}>
              <SelectTrigger className="w-[130px]" aria-label="Month to display"><SelectValue /></SelectTrigger>
              <SelectContent>{MONTHS.map((name, index) => <SelectItem key={name} value={String(index + 1)}>{name}</SelectItem>)}</SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            {hourData.length ? (
              <ChartContainer config={humidityConfig} className="h-[310px] w-full">
                <LineChart data={hourData} margin={{ left: 0, right: 12, top: 10, bottom: 0 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} interval={2} />
                  <YAxis tickFormatter={(number) => `${number}°`} tickLine={false} axisLine={false} width={42} />
                  <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
                  <Legend verticalAlign="top" height={36} />
                  <Line type="monotone" dataKey="temperature" stroke={COLORS.high} strokeWidth={2.5} dot={false} connectNulls />
                  <Line type="monotone" dataKey="dewPoint" stroke={COLORS.dew} strokeWidth={2.5} dot={false} connectNulls />
                  <Line type="monotone" dataKey="heatIndex" stroke={COLORS.heat} strokeWidth={2} strokeDasharray="5 4" dot={false} connectNulls />
                </LineChart>
              </ChartContainer>
            ) : <EmptyChart label="Hourly heat and moisture" />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg"><Gauge className="size-5 text-teal-700" /> Moisture station</CardTitle>
            <CardDescription>The station used for dew point and heat-index normals.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">Station</p><p className="mt-1 font-medium">{station?.stationName ?? "Not available"}</p></div>
            <div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">Distance from city</p><p className="mt-1 text-xl font-semibold tabular-nums">{value(station?.stationDistance ?? null, " mi")}</p></div>
            <p className="text-xs leading-relaxed text-muted-foreground">Dew point measures the actual amount of moisture in the air; it is more useful for comfort than relative humidity alone.</p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_1.5fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg"><Leaf className="size-5 text-emerald-600" /> Air quality</CardTitle>
            <CardDescription>{airQuality ? `${airQuality.year} annual AQI summary for ${airQuality.sourceGeoName}` : "Annual EPA AQI summary"}</CardDescription>
          </CardHeader>
          <CardContent>
            {airQuality && airData.length ? (
              <div className="grid items-center gap-3 sm:grid-cols-[190px_1fr]">
                <ChartContainer config={{ value: { label: "Days" } }} className="mx-auto aspect-square h-[190px]">
                  <PieChart><Pie data={airData} dataKey="value" nameKey="label" innerRadius={54} outerRadius={82} strokeWidth={3}>{airData.map((entry) => <Cell key={entry.label} fill={entry.fill} />)}</Pie><ChartTooltip content={<ChartTooltipContent nameKey="label" />} /></PieChart>
                </ChartContainer>
                <div className="space-y-2">{airData.map((entry) => <div key={entry.label} className="flex items-center justify-between gap-3 text-sm"><span className="flex items-center gap-2"><span className="size-2.5 rounded-full" style={{ backgroundColor: entry.fill }} />{entry.label}</span><span className="font-semibold tabular-nums">{entry.value} days</span></div>)}</div>
              </div>
            ) : <EmptyChart label="Annual air-quality" />}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-lg">AQI details</CardTitle><CardDescription>EPA reports air quality by monitoring geography, not municipal boundaries.</CardDescription></CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">Median AQI</p><p className="mt-1 text-2xl font-semibold tabular-nums">{airQuality?.medianAqi ?? "—"}</p></div>
            <div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">90th percentile AQI</p><p className="mt-1 text-2xl font-semibold tabular-nums">{airQuality?.p90Aqi ?? "—"}</p></div>
            <div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">Maximum AQI</p><p className="mt-1 text-2xl font-semibold tabular-nums">{airQuality?.maxAqi ?? "—"}</p></div>
            {airQuality && <p className="sm:col-span-3 text-xs text-muted-foreground">Matched to {airQuality.sourceGeoType.replaceAll("_", " ")}: {airQuality.sourceGeoName}.</p>}
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader><CardTitle className="text-lg">Data sources and coverage</CardTitle><CardDescription>Each dataset keeps its own station or reporting geography so comparisons remain honest.</CardDescription></CardHeader>
        <CardContent className="grid gap-4 text-sm md:grid-cols-3">
          <div><p className="font-medium">Monthly climate</p><p className="mt-1 text-muted-foreground">{monthly.length ? `${monthly.length} of 12 months · ${monthlyVintage ?? "vintage unavailable"}` : "No monthly normals"}</p>{monthlySource && <a className="mt-2 inline-block text-primary underline-offset-4 hover:underline" href={monthlySource} target="_blank" rel="noreferrer">View NOAA source</a>}</div>
          <div><p className="font-medium">Hourly moisture</p><p className="mt-1 text-muted-foreground">{hourly.length ? `${hourly.length} hourly month-slots · ${hourlyVintage ?? "vintage unavailable"}` : "No hourly moisture normals"}</p>{hourlySource && <a className="mt-2 inline-block text-primary underline-offset-4 hover:underline" href={hourlySource} target="_blank" rel="noreferrer">View NOAA source</a>}</div>
          <div><p className="font-medium">Air quality</p><p className="mt-1 text-muted-foreground">{airQuality ? `${airQuality.year} · ${airQuality.sourceGeoName}` : "No annual AQI record"}</p>{airQuality && <a className="mt-2 inline-block text-primary underline-offset-4 hover:underline" href={airQuality.sourceUrl} target="_blank" rel="noreferrer">View EPA source</a>}</div>
        </CardContent>
      </Card>
    </div>
  );
}
