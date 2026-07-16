"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Label,
  Pie,
  PieChart,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  XAxis,
  YAxis,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

/** One calendar month of normals (NOAA), Jan=1. All metrics nullable. */
export interface MonthPoint {
  month: number;
  high: number | null; // avg daily max °F
  low: number | null; // avg daily min °F
  precip: number | null; // total precip, inches
  snow: number | null; // snowfall, inches
}

export interface WeatherCity {
  id: number;
  name: string;
  state: string;
  climate: string | null;
  climateCategory: string | null;
  snow: number | null; // annual inches
  rain: number | null; // annual inches
  sunDays: number | null; // days/year
  winterLow: number | null; // °F, avg winter low
  summerHigh: number | null; // °F, avg summer high
  humidity: number | null; // % summer
  monthly: MonthPoint[]; // NOAA monthly normals (may be empty)
}

const DAYS_IN_YEAR = 365;
const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

// Weather-semantic palette (base-nova's neutral --chart-* vars are grayscale,
// which reads as dull for weather). These vivid mid-tones work on the light
// public theme.
const COLORS = {
  cold: "#3b82f6", // blue
  warm: "#f59e0b", // amber
  hot: "#ef4444", // red
  rain: "#3b82f6", // blue
  snow: "#93c5fd", // light blue
  sun: "#f59e0b", // amber
  cloud: "#d4d4d8", // zinc-300
  humidity: "#14b8a6", // teal
} as const;

function cityKey(c: WeatherCity) {
  return `${c.name}, ${c.state}`;
}

/* ------------------------------------------------------------------ *
 * Small shared building blocks
 * ------------------------------------------------------------------ */

function Unavailable({ metric }: { metric: string }) {
  return (
    <div className="flex h-[220px] flex-col items-center justify-center gap-2 rounded-lg border border-dashed text-center">
      <span className="text-2xl" aria-hidden>
        🚫
      </span>
      <p className="text-sm font-medium text-muted-foreground">
        {metric} data unavailable
      </p>
      <p className="max-w-[220px] text-xs text-muted-foreground/80">
        This location hasn&apos;t been sourced for {metric.toLowerCase()} yet.
      </p>
    </div>
  );
}

function Stat({
  label,
  value,
  unit,
  missing,
}: {
  label: string;
  value: number | null;
  unit: string;
  missing?: boolean;
}) {
  const unknown = missing || value === null;
  return (
    <div className="rounded-lg border bg-card px-3 py-2.5">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-lg font-semibold tabular-nums">
        {unknown ? (
          <span className="text-muted-foreground">—</span>
        ) : (
          <>
            {value}
            <span className="ml-0.5 text-xs font-normal text-muted-foreground">
              {unit}
            </span>
          </>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Scientific charts
 * ------------------------------------------------------------------ */

function monthlyTempPoints(city: WeatherCity) {
  return city.monthly
    .filter((m) => m.high !== null && m.low !== null)
    .map((m) => ({
      label: MONTH_LABELS[m.month - 1],
      low: m.low as number,
      range: (m.high as number) - (m.low as number),
      high: m.high as number,
    }));
}

interface TempTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: { label: string; high: number; low: number } }>;
}
function TempTooltip({ active, payload }: TempTooltipProps) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border bg-background px-3 py-2 text-xs shadow-md">
      <div className="mb-1 font-medium">{d.label}</div>
      <div className="flex items-center justify-between gap-3">
        <span style={{ color: COLORS.hot }}>High</span>
        <span className="font-medium tabular-nums">{Math.round(d.high)}°F</span>
      </div>
      <div className="flex items-center justify-between gap-3">
        <span style={{ color: COLORS.cold }}>Low</span>
        <span className="font-medium tabular-nums">{Math.round(d.low)}°F</span>
      </div>
    </div>
  );
}

// Monthly temperature envelope: a filled band from each month's avg low to avg
// high across Jan→Dec, from real NOAA normals. The scientific centerpiece.
function MonthlyTempArea({ city }: { city: WeatherCity }) {
  const data = monthlyTempPoints(city);
  const config = {
    range: { label: "Temp range", color: COLORS.warm },
  } satisfies ChartConfig;

  return (
    <ChartContainer config={config} className="h-[260px] w-full">
      <AreaChart data={data} margin={{ left: 4, right: 8, top: 8, bottom: 4 }}>
        <defs>
          <linearGradient id="tempAreaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={COLORS.hot} stopOpacity={0.85} />
            <stop offset="100%" stopColor={COLORS.cold} stopOpacity={0.6} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={8}
        />
        <YAxis
          tickFormatter={(v) => `${v}°`}
          tickLine={false}
          axisLine={false}
          width={36}
        />
        <ChartTooltip cursor content={<TempTooltip />} />
        {/* Invisible base lifts the visible band up to each month's low. */}
        <Area
          dataKey="low"
          stackId="t"
          stroke="none"
          fill="transparent"
          isAnimationActive={false}
        />
        <Area
          dataKey="range"
          stackId="t"
          stroke={COLORS.warm}
          strokeWidth={1.5}
          fill="url(#tempAreaGradient)"
        />
      </AreaChart>
    </ChartContainer>
  );
}

// Monthly precipitation (liquid, rain-equivalent inches) across the year.
function MonthlyPrecipBar({ city }: { city: WeatherCity }) {
  const data = city.monthly
    .filter((m) => m.precip !== null)
    .map((m) => ({
      label: MONTH_LABELS[m.month - 1],
      precip: m.precip as number,
    }));
  if (data.length < 6) return <Unavailable metric="Monthly precipitation" />;

  const config = {
    precip: { label: "Precip (in)", color: COLORS.rain },
  } satisfies ChartConfig;

  return (
    <ChartContainer config={config} className="h-[240px] w-full">
      <BarChart data={data} margin={{ left: 4, right: 8, top: 8, bottom: 4 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={8}
        />
        <YAxis
          tickFormatter={(v) => `${v}"`}
          tickLine={false}
          axisLine={false}
          width={36}
        />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent indicator="dot" />}
        />
        <Bar dataKey="precip" fill={COLORS.rain} radius={[3, 3, 0, 0]} />
      </BarChart>
    </ChartContainer>
  );
}

// Temperature "band": a floating bar from avg winter low → avg summer high,
// filled with a cold→hot gradient. Fallback when monthly normals are absent.
function TemperatureBand({ city }: { city: WeatherCity }) {
  const { winterLow, summerHigh } = city;
  if (winterLow === null || summerHigh === null) {
    return <Unavailable metric="Temperature" />;
  }

  const data = [
    { name: "range", base: winterLow, span: Math.max(summerHigh - winterLow, 0) },
  ];
  const domainMin = Math.min(0, winterLow - 8);
  const domainMax = summerHigh + 8;

  const config = {
    span: { label: "Temperature range", color: COLORS.warm },
  } satisfies ChartConfig;

  return (
    <ChartContainer config={config} className="h-[220px] w-full">
      <BarChart
        layout="vertical"
        data={data}
        margin={{ left: 8, right: 8, top: 40, bottom: 8 }}
      >
        <defs>
          <linearGradient id="tempGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={COLORS.cold} />
            <stop offset="50%" stopColor={COLORS.warm} />
            <stop offset="100%" stopColor={COLORS.hot} />
          </linearGradient>
        </defs>
        <XAxis
          type="number"
          domain={[domainMin, domainMax]}
          tickFormatter={(v) => `${v}°`}
          tickLine={false}
          axisLine={false}
          tickMargin={6}
        />
        <YAxis type="category" dataKey="name" hide />
        <Bar dataKey="base" stackId="t" fill="transparent" isAnimationActive={false} />
        <Bar
          dataKey="span"
          stackId="t"
          fill="url(#tempGradient)"
          radius={999}
          barSize={26}
        >
          <Label
            value={`${winterLow}°`}
            position="insideLeft"
            fill="#fff"
            fontSize={13}
            fontWeight={600}
            offset={10}
          />
          <Label
            value={`${summerHigh}°`}
            position="insideRight"
            fill="#fff"
            fontSize={13}
            fontWeight={600}
            offset={10}
          />
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}

// Precipitation donut: snow vs rain (annual inches), total in the center.
function PrecipitationDonut({ city }: { city: WeatherCity }) {
  const { snow, rain } = city;
  if (snow === null && rain === null) {
    return <Unavailable metric="Precipitation" />;
  }
  const snowVal = snow ?? 0;
  const rainVal = rain ?? 0;
  const total = snowVal + rainVal;

  const data = [
    { kind: "rain", value: rainVal, fill: COLORS.rain },
    { kind: "snow", value: snowVal, fill: COLORS.snow },
  ];
  const config = {
    value: { label: "Inches" },
    rain: { label: "Rain", color: COLORS.rain },
    snow: { label: "Snow", color: COLORS.snow },
  } satisfies ChartConfig;

  return (
    <ChartContainer config={config} className="mx-auto aspect-square h-[220px]">
      <PieChart>
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent nameKey="kind" />}
        />
        <Pie
          data={data}
          dataKey="value"
          nameKey="kind"
          innerRadius={58}
          strokeWidth={4}
        >
          <Label
            content={({ viewBox }) => {
              if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                return (
                  <text
                    x={viewBox.cx}
                    y={viewBox.cy}
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    <tspan
                      x={viewBox.cx}
                      y={viewBox.cy}
                      className="fill-foreground text-2xl font-bold"
                    >
                      {total}
                    </tspan>
                    <tspan
                      x={viewBox.cx}
                      y={(viewBox.cy ?? 0) + 20}
                      className="fill-muted-foreground text-xs"
                    >
                      inches / year
                    </tspan>
                  </text>
                );
              }
            }}
          />
        </Pie>
      </PieChart>
    </ChartContainer>
  );
}

// Sunshine donut: sunny days vs cloudy days out of 365.
function SunshineDonut({ city }: { city: WeatherCity }) {
  if (city.sunDays === null) {
    return <Unavailable metric="Sunshine" />;
  }
  const sunny = Math.min(city.sunDays, DAYS_IN_YEAR);
  const cloudy = DAYS_IN_YEAR - sunny;

  const data = [
    { kind: "sunny", value: sunny, fill: COLORS.sun },
    { kind: "cloudy", value: cloudy, fill: COLORS.cloud },
  ];
  const config = {
    value: { label: "Days" },
    sunny: { label: "Sunny days", color: COLORS.sun },
    cloudy: { label: "Cloudy days", color: COLORS.cloud },
  } satisfies ChartConfig;

  return (
    <ChartContainer config={config} className="mx-auto aspect-square h-[220px]">
      <PieChart>
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent nameKey="kind" />}
        />
        <Pie
          data={data}
          dataKey="value"
          nameKey="kind"
          innerRadius={58}
          startAngle={90}
          endAngle={-270}
          strokeWidth={4}
        >
          <Label
            content={({ viewBox }) => {
              if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                return (
                  <text
                    x={viewBox.cx}
                    y={viewBox.cy}
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    <tspan
                      x={viewBox.cx}
                      y={viewBox.cy}
                      className="fill-foreground text-2xl font-bold"
                    >
                      {sunny}
                    </tspan>
                    <tspan
                      x={viewBox.cx}
                      y={(viewBox.cy ?? 0) + 20}
                      className="fill-muted-foreground text-xs"
                    >
                      sunny days
                    </tspan>
                  </text>
                );
              }
            }}
          />
        </Pie>
      </PieChart>
    </ChartContainer>
  );
}

// Humidity radial gauge.
function HumidityGauge({ city }: { city: WeatherCity }) {
  if (city.humidity === null) {
    return <Unavailable metric="Humidity" />;
  }
  const value = city.humidity;
  const data = [{ name: "humidity", value, fill: COLORS.humidity }];
  const config = {
    value: { label: "Humidity", color: COLORS.humidity },
  } satisfies ChartConfig;

  return (
    <ChartContainer config={config} className="mx-auto aspect-square h-[220px]">
      <RadialBarChart
        data={data}
        startAngle={90}
        endAngle={90 - (value / 100) * 360}
        innerRadius={70}
        outerRadius={100}
      >
        <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
        <RadialBar background dataKey="value" cornerRadius={999} />
        <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle">
          <tspan className="fill-foreground text-3xl font-bold">{value}%</tspan>
        </text>
        <text
          x="50%"
          y="50%"
          dy={26}
          textAnchor="middle"
          className="fill-muted-foreground text-xs"
        >
          summer humidity
        </text>
      </RadialBarChart>
    </ChartContainer>
  );
}

/* ------------------------------------------------------------------ *
 * Vibe (qualitative) section
 * ------------------------------------------------------------------ */

interface VibeTag {
  emoji: string;
  label: string;
}

function buildVibe(city: WeatherCity): {
  headline: string;
  emoji: string;
  tags: VibeTag[];
  comfort: number | null;
} {
  const tags: VibeTag[] = [];

  if (city.sunDays !== null) {
    if (city.sunDays >= 250) tags.push({ emoji: "☀️", label: "Sun-soaked" });
    else if (city.sunDays >= 200) tags.push({ emoji: "🌤️", label: "Bright" });
    else if (city.sunDays >= 160) tags.push({ emoji: "⛅", label: "Mixed skies" });
    else tags.push({ emoji: "☁️", label: "Grey skies" });
  }

  const precip = (city.snow ?? 0) + (city.rain ?? 0);
  if (city.snow !== null || city.rain !== null) {
    if (precip >= 70) tags.push({ emoji: "🌧️", label: "Wet" });
    else if (precip >= 35) tags.push({ emoji: "🌦️", label: "Moderate rain" });
    else tags.push({ emoji: "🏜️", label: "Dry" });
  }

  if (city.snow !== null) {
    if (city.snow >= 48) tags.push({ emoji: "❄️", label: "Snowy" });
    else if (city.snow >= 12) tags.push({ emoji: "🌨️", label: "Some snow" });
  }

  if (city.summerHigh !== null) {
    if (city.summerHigh >= 95) tags.push({ emoji: "🥵", label: "Scorching summers" });
    else if (city.summerHigh >= 88) tags.push({ emoji: "🌡️", label: "Warm summers" });
    else if (city.summerHigh >= 78) tags.push({ emoji: "😎", label: "Mild summers" });
    else tags.push({ emoji: "🧊", label: "Cool summers" });
  }

  if (city.winterLow !== null) {
    if (city.winterLow <= 15) tags.push({ emoji: "🥶", label: "Frigid winters" });
    else if (city.winterLow <= 32) tags.push({ emoji: "🧥", label: "Cold winters" });
    else tags.push({ emoji: "🌴", label: "Gentle winters" });
  }

  if (city.humidity !== null) {
    if (city.humidity >= 70) tags.push({ emoji: "💧", label: "Humid air" });
    else if (city.humidity >= 50) tags.push({ emoji: "🌫️", label: "Balanced humidity" });
    else tags.push({ emoji: "🌵", label: "Dry air" });
  }

  // Playful comfort index (0–100). Only computed when the core inputs exist.
  let comfort: number | null = null;
  const parts: number[] = [];
  const weights: number[] = [];
  if (city.sunDays !== null) {
    parts.push(clamp01(city.sunDays / 300) * 100);
    weights.push(0.35);
  }
  if (city.summerHigh !== null) {
    // best around 84°F, penalize extremes
    parts.push(clamp01(1 - Math.abs(city.summerHigh - 84) / 25) * 100);
    weights.push(0.25);
  }
  if (city.winterLow !== null) {
    // best around 40°F
    parts.push(clamp01(1 - Math.abs(city.winterLow - 40) / 40) * 100);
    weights.push(0.25);
  }
  if (city.snow !== null || city.rain !== null) {
    parts.push(clamp01(1 - precip / 90) * 100);
    weights.push(0.15);
  }
  if (parts.length) {
    const wsum = weights.reduce((a, b) => a + b, 0);
    comfort = Math.round(
      parts.reduce((acc, p, i) => acc + p * weights[i], 0) / wsum
    );
  }

  // Headline + hero emoji from the climate category, falling back to sun.
  const byCategory: Record<string, { headline: string; emoji: string }> = {
    hot_dry: { headline: "Warm & dry — sunshine most of the year", emoji: "🏜️" },
    hot_humid: { headline: "Hot & sticky — lush, humid summers", emoji: "🌴" },
    cold_snowy: { headline: "Four seasons — real winters, real snow", emoji: "❄️" },
    mild_coastal: { headline: "Mild & coastal — even-keeled year-round", emoji: "🌊" },
    mild: { headline: "Mild & even-keeled year-round", emoji: "🌤️" },
    temperate: { headline: "Temperate — comfortable middle ground", emoji: "🍃" },
  };
  const fallback =
    city.sunDays !== null && city.sunDays >= 230
      ? { headline: "Bright and sunny for most of the year", emoji: "☀️" }
      : { headline: city.climate ?? "A climate all its own", emoji: "🌦️" };
  const hero =
    (city.climateCategory && byCategory[city.climateCategory]) || fallback;

  return { headline: hero.headline, emoji: hero.emoji, tags, comfort };
}

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

function VibeCard({ city }: { city: WeatherCity }) {
  const { headline, emoji, tags, comfort } = React.useMemo(
    () => buildVibe(city),
    [city]
  );

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-lg">🌈</span> The Vibe
        </CardTitle>
        <CardDescription>{city.climate ?? "Climate profile"}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-center gap-4 rounded-xl border bg-muted/40 p-4">
          <div className="text-4xl leading-none" aria-hidden>
            {emoji}
          </div>
          <div>
            <div className="text-base font-semibold">{headline}</div>
            {comfort !== null && (
              <div className="mt-2 flex items-center gap-2">
                <div className="h-2 w-40 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${comfort}%`,
                      background: `linear-gradient(90deg, ${COLORS.cold}, ${COLORS.sun})`,
                    }}
                  />
                </div>
                <span className="text-sm font-medium tabular-nums">
                  {comfort}/100
                </span>
                <span className="text-xs text-muted-foreground">
                  comfort index
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {tags.map((t) => (
            <span
              key={t.label}
              className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1 text-sm"
            >
              <span aria-hidden>{t.emoji}</span>
              {t.label}
            </span>
          ))}
        </div>
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground">
        The comfort index is a playful heuristic from sun, temperature, and
        precipitation — not an official rating.
      </CardFooter>
    </Card>
  );
}

/* ------------------------------------------------------------------ *
 * Page
 * ------------------------------------------------------------------ */

export default function WeatherClient({ cities }: { cities: WeatherCity[] }) {
  const [selectedKey, setSelectedKey] = React.useState(() =>
    cities.length ? cityKey(cities[0]) : ""
  );

  const city = React.useMemo(
    () => cities.find((c) => cityKey(c) === selectedKey) ?? cities[0],
    [cities, selectedKey]
  );

  if (!city) {
    return (
      <p className="text-muted-foreground">No locations available.</p>
    );
  }

  const hasMonthlyTemp = monthlyTempPoints(city).length >= 6;

  const missing = [
    city.winterLow === null || city.summerHigh === null ? "temperature" : null,
    city.snow === null && city.rain === null ? "precipitation" : null,
    city.sunDays === null ? "sunny days" : null,
    city.humidity === null ? "humidity" : null,
  ].filter(Boolean) as string[];

  return (
    <div className="space-y-8">
      {/* Header + city picker */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Weather &amp; Climate</h1>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            The science and the vibe of each retirement location&apos;s weather.
            Pick a city to explore its temperature range, precipitation,
            sunshine, and humidity.
          </p>
        </div>
        <Select
          value={selectedKey}
          onValueChange={(value) => setSelectedKey(value ?? "")}
        >
          <SelectTrigger className="w-full sm:w-[240px]" size="default">
            <SelectValue placeholder="Choose a city" />
          </SelectTrigger>
          <SelectContent className="max-h-[320px]">
            {cities.map((c) => (
              <SelectItem key={cityKey(c)} value={cityKey(c)}>
                {c.name}, {c.state}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Completeness banner */}
      {missing.length > 0 && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm">
          <span aria-hidden>⚠️</span>
          <p>
            <span className="font-medium">Incomplete data for {city.name}:</span>{" "}
            {missing.join(", ")} {missing.length === 1 ? "is" : "are"} not sourced
            yet. Those panels are marked unavailable below.
          </p>
        </div>
      )}

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label="Winter low" value={city.winterLow} unit="°F" />
        <Stat label="Summer high" value={city.summerHigh} unit="°F" />
        <Stat label="Snow" value={city.snow} unit="in" />
        <Stat label="Rain" value={city.rain} unit="in" />
        <Stat label="Sunny days" value={city.sunDays} unit="/yr" />
        <Stat label="Humidity" value={city.humidity} unit="%" />
      </div>

      {/* Scientific section */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          By the numbers
        </h2>
        {/* Temperature — monthly envelope when NOAA normals exist */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>🌡️</span> Temperature through the year
            </CardTitle>
            <CardDescription>
              {hasMonthlyTemp
                ? "Average monthly high → low band (°F)"
                : "Average winter low → summer high (°F)"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {hasMonthlyTemp ? (
              <MonthlyTempArea city={city} />
            ) : (
              <TemperatureBand city={city} />
            )}
          </CardContent>
        </Card>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>🌧️</span> Precipitation by month
              </CardTitle>
              <CardDescription>Rain-equivalent inches per month</CardDescription>
            </CardHeader>
            <CardContent>
              <MonthlyPrecipBar city={city} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>🌨️</span> Rain vs. snow
              </CardTitle>
              <CardDescription>Annual split (inches)</CardDescription>
            </CardHeader>
            <CardContent>
              <PrecipitationDonut city={city} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>☀️</span> Sunshine
              </CardTitle>
              <CardDescription>Sunny days out of 365</CardDescription>
            </CardHeader>
            <CardContent>
              <SunshineDonut city={city} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>💧</span> Humidity
              </CardTitle>
              <CardDescription>Average summer relative humidity</CardDescription>
            </CardHeader>
            <CardContent>
              <HumidityGauge city={city} />
            </CardContent>
          </Card>
        </div>

        {hasMonthlyTemp && (
          <p className="text-xs text-muted-foreground">
            Monthly temperature and precipitation: NOAA/NCEI 1991–2020 Climate
            Normals, nearest station. Humidity and sunshine are annual figures.
          </p>
        )}
      </section>

      {/* Vibe section */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          The feel
        </h2>
        <VibeCard city={city} />
      </section>
    </div>
  );
}
