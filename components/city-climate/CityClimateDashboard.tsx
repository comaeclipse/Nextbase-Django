"use client";

import * as React from "react";
import Link from "next/link";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Label,
  ReferenceDot,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowLeft,
  CloudSun,
  Droplets,
  Snowflake,
  Sun,
  Thermometer,
  Umbrella,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import {
  DEW_RAMP,
  MONTH_LABELS,
  dewPointComfort,
  type ClimateDewPoint,
  type ClimateHourPoint,
  type ClimateMonthPoint,
  type ClimateStation,
} from "@/lib/climate";

export interface ClimateCity {
  id: number;
  name: string;
  state: string;
  climate: string | null;
  summerHigh: number | null;
  winterLow: number | null;
  rainAnnual: number | null;
  snowAnnual: number | null;
  sunDays: number | null;
}

interface Props {
  city: ClimateCity;
  monthly: ClimateMonthPoint[];
  diurnal: Record<string, ClimateHourPoint[]>;
  dewPoints: ClimateDewPoint[];
  station: ClimateStation | null;
  dataVintage: string | null;
}

/* ------------------------------------------------------------------ *
 * Shared building blocks
 * ------------------------------------------------------------------ */

/** The small uppercase eyebrow that titles every panel in this dashboard. */
function CardLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
      {children}
    </span>
  );
}

function Unavailable({ metric }: { metric: string }) {
  return (
    <div className="flex h-[220px] flex-col items-center justify-center gap-2 rounded-lg border border-dashed text-center">
      <span className="text-2xl" aria-hidden>
        🚫
      </span>
      <p className="text-sm font-medium text-muted-foreground">
        {metric} data unavailable
      </p>
      <p className="max-w-[240px] text-xs text-muted-foreground/80">
        This location hasn&apos;t been sourced for {metric.toLowerCase()} yet.
      </p>
    </div>
  );
}

function StatTile({
  label,
  value,
  unit,
  icon: Icon,
}: {
  label: string;
  value: number | null;
  unit?: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex flex-col justify-between gap-3 rounded-xl border bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <CardLabel>{label}</CardLabel>
        <Icon className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
      </div>
      <div className="flex items-baseline gap-1">
        {value === null ? (
          <span className="text-2xl font-semibold leading-none text-muted-foreground">
            —
          </span>
        ) : (
          <>
            <span className="text-2xl font-semibold leading-none">{value}</span>
            {unit ? (
              <span className="text-sm text-muted-foreground">{unit}</span>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Charts
 * ------------------------------------------------------------------ */

const tempConfig = {
  high: { label: "Average high", color: "var(--chart-2)" },
  low: { label: "Average low", color: "var(--chart-1)" },
} satisfies ChartConfig;

function MonthlyTemperature({ monthly }: { monthly: ClimateMonthPoint[] }) {
  const data = monthly.filter((m) => m.high !== null && m.low !== null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Temperature through the year</CardTitle>
        <CardDescription>
          Average daily high and low for each month, 30-year normals.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <Unavailable metric="Temperature" />
        ) : (
          <ChartContainer
            config={tempConfig}
            className="aspect-auto h-[300px] w-full"
          >
            <AreaChart data={data} margin={{ left: 4, right: 12, top: 12 }}>
              <defs>
                {(["high", "low"] as const).map((key) => (
                  <linearGradient
                    key={key}
                    id={`fill-temp-${key}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor={tempConfig[key].color}
                      stopOpacity={0.14}
                    />
                    <stop
                      offset="100%"
                      stopColor={tempConfig[key].color}
                      stopOpacity={0}
                    />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={10}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={6}
                width={42}
                domain={["dataMin - 8", "dataMax + 8"]}
                tickFormatter={(v: number) => `${Math.round(v)}°F`}
              />
              <ChartTooltip
                cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
                content={<ChartTooltipContent indicator="line" />}
              />
              {(["high", "low"] as const).map((key) => (
                <Area
                  key={key}
                  dataKey={key}
                  type="monotone"
                  stroke={tempConfig[key].color}
                  strokeWidth={2}
                  fill={`url(#fill-temp-${key})`}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--card)" }}
                  isAnimationActive={false}
                />
              ))}
              <ChartLegend content={<ChartLegendContent />} />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}

const dewConfig = {
  dewPoint: { label: "Dew point", color: "var(--chart-3)" },
  range: { label: "Typical range", color: "var(--chart-3)" },
} satisfies ChartConfig;

function MonthlyHumidity({ dewPoints }: { dewPoints: ClimateDewPoint[] }) {
  const peak = React.useMemo(
    () =>
      dewPoints.length
        ? dewPoints.reduce((a, b) => (b.dewPoint > a.dewPoint ? b : a))
        : null,
    [dewPoints]
  );
  const comfort = peak ? dewPointComfort(peak.dewPoint) : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Humidity through the year</CardTitle>
        <CardDescription>
          Average dew point, with the band each month typically swings between.
          Dew point tracks mugginess better than relative humidity, which
          swings with temperature all day.
        </CardDescription>
        {comfort ? (
          <CardAction>
            <Badge variant="secondary" className="gap-1.5 font-normal">
              <span
                aria-hidden
                className="size-2 rounded-full"
                style={{ backgroundColor: DEW_RAMP[comfort.step] }}
              />
              Muggiest: {peak!.label}, {comfort.label.toLowerCase()}
            </Badge>
          </CardAction>
        ) : null}
      </CardHeader>
      <CardContent>
        {dewPoints.length === 0 ? (
          <Unavailable metric="Humidity" />
        ) : (
          <ChartContainer
            config={dewConfig}
            className="aspect-auto h-[300px] w-full"
          >
            <AreaChart data={dewPoints} margin={{ left: 4, right: 12, top: 12 }}>
              <defs>
                <linearGradient id="fill-dew" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-3)" stopOpacity={0.14} />
                  <stop offset="100%" stopColor="var(--chart-3)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={10}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={6}
                width={42}
                domain={["dataMin - 6", "dataMax + 6"]}
                tickFormatter={(v: number) => `${Math.round(v)}°F`}
              />
              <ChartTooltip
                cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
                content={
                  <ChartTooltipContent
                    indicator="line"
                    formatter={(value, name, item) => {
                      const row = item?.payload as ClimateDewPoint;
                      if (name === "range") {
                        return (
                          <span className="text-xs text-muted-foreground">
                            typically {row.p10}–{row.p90}°F
                          </span>
                        );
                      }
                      return (
                        <span className="text-xs">
                          {row.dewPoint}°F · {dewPointComfort(row.dewPoint).label}
                        </span>
                      );
                    }}
                  />
                }
              />
              {/* A range dataKey draws the p10–p90 band without a stack, which
                  would otherwise drag the axis down to zero. */}
              <Area
                dataKey={(d: ClimateDewPoint) => [d.p10, d.p90]}
                name="range"
                stroke="none"
                fill="var(--chart-3)"
                fillOpacity={0.12}
                isAnimationActive={false}
                activeDot={false}
              />
              <Area
                dataKey="dewPoint"
                type="monotone"
                stroke="var(--chart-3)"
                strokeWidth={2}
                fill="url(#fill-dew)"
                dot={false}
                activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--card)" }}
                isAnimationActive={false}
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}

const dayConfig = {
  temp: { label: "Temperature", color: "var(--chart-1)" },
  feelsLike: { label: "Feels like", color: "var(--chart-3)" },
} satisfies ChartConfig;

function TypicalDay({
  diurnal,
  station,
}: {
  diurnal: Record<string, ClimateHourPoint[]>;
  station: ClimateStation | null;
}) {
  const months = React.useMemo(
    () => Object.keys(diurnal).map(Number).sort((a, b) => a - b),
    [diurnal]
  );
  // Default to July: the month where heat index has the most to say.
  const [month, setMonth] = React.useState(() =>
    months.includes(7) ? 7 : (months[0] ?? 1)
  );
  const hours = diurnal[String(month)] ?? [];

  // Direct-label the extreme rather than every point: the heat-index peak is
  // the story, so that is the one point that gets a value.
  const peak = React.useMemo(
    () =>
      hours.length
        ? hours.reduce((a, b) => (b.feelsLike > a.feelsLike ? b : a))
        : null,
    [hours]
  );

  function changeMonth(values: string[]) {
    const next = Number(values[0]);
    if (Number.isFinite(next) && next >= 1 && next <= 12) setMonth(next);
  }

  const hasData = hours.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          A typical day{hasData ? ` in ${MONTH_LABELS[month - 1]}` : ""}
        </CardTitle>
        <CardDescription>
          {hasData ? (
            <>
              Hour by hour through an average {MONTH_LABELS[month - 1]} day,
              against what it actually feels like.
              {station
                ? ` Moisture from ${station.name}, ${station.distanceMi.toFixed(1)} mi away.`
                : ""}
            </>
          ) : (
            "Hour by hour through an average day, against what it actually feels like."
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasData ? (
          <Unavailable metric="Hourly climate" />
        ) : (
          <>
            <ToggleGroup
              value={[String(month)]}
              onValueChange={changeMonth}
              variant="outline"
              size="sm"
              spacing={0}
              aria-label="Month"
              className="flex-wrap"
            >
              {months.map((m) => (
                <ToggleGroupItem
                  key={m}
                  value={String(m)}
                  aria-label={`Typical day in ${MONTH_LABELS[m - 1]}`}
                  className="text-xs"
                >
                  {MONTH_LABELS[m - 1]}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>

            <ChartContainer
              config={dayConfig}
              className="aspect-auto h-[300px] w-full"
            >
              <AreaChart data={hours} margin={{ left: 4, right: 12, top: 24 }}>
                <defs>
                  {(["temp", "feelsLike"] as const).map((key) => (
                    <linearGradient
                      key={key}
                      id={`fill-day-${key}`}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor={dayConfig[key].color}
                        stopOpacity={0.14}
                      />
                      <stop
                        offset="100%"
                        stopColor={dayConfig[key].color}
                        stopOpacity={0}
                      />
                    </linearGradient>
                  ))}
                </defs>

                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  minTickGap={28}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={6}
                  width={42}
                  domain={["dataMin - 4", "dataMax + 4"]}
                  tickFormatter={(v: number) => `${Math.round(v)}°F`}
                />
                <ChartTooltip
                  cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
                  content={
                    <ChartTooltipContent
                      indicator="line"
                      labelFormatter={(value) => `${value}`}
                    />
                  }
                />

                {(["temp", "feelsLike"] as const).map((key) => (
                  <Area
                    key={key}
                    dataKey={key}
                    type="monotone"
                    stroke={dayConfig[key].color}
                    strokeWidth={2}
                    fill={`url(#fill-day-${key})`}
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--card)" }}
                    isAnimationActive={false}
                  />
                ))}

                {peak ? (
                  <ReferenceDot
                    x={peak.label}
                    y={peak.feelsLike}
                    r={4}
                    fill="var(--chart-3)"
                    stroke="var(--card)"
                    strokeWidth={2}
                  >
                    <Label
                      value={`Peak heat index ${Math.round(peak.feelsLike)}°`}
                      position="top"
                      offset={10}
                      className="fill-foreground text-[11px] font-medium"
                    />
                  </ReferenceDot>
                ) : null}

                <ChartLegend content={<ChartLegendContent />} />
              </AreaChart>
            </ChartContainer>
          </>
        )}
      </CardContent>
    </Card>
  );
}

const precipConfig = {
  precip: { label: "Rain (in)", color: "var(--chart-1)" },
  snow: { label: "Snow (in)", color: "var(--chart-5)" },
} satisfies ChartConfig;

function MonthlyPrecip({ monthly }: { monthly: ClimateMonthPoint[] }) {
  const data = monthly.filter((m) => m.precip !== null || m.snow !== null);
  const anySnow = data.some((m) => (m.snow ?? 0) > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rain and snow</CardTitle>
        <CardDescription>
          Average monthly precipitation{anySnow ? ", with snowfall" : ""}.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <Unavailable metric="Precipitation" />
        ) : (
          <ChartContainer
            config={precipConfig}
            className="aspect-auto h-[260px] w-full"
          >
            <BarChart data={data} margin={{ left: 4, right: 12, top: 12 }}>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={10}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={6}
                width={38}
                tickFormatter={(v: number) => `${v}"`}
              />
              <ChartTooltip
                cursor={{ fill: "var(--muted)", opacity: 0.4 }}
                content={<ChartTooltipContent indicator="line" />}
              />
              <Bar
                dataKey="precip"
                fill="var(--color-precip)"
                radius={[4, 4, 0, 0]}
                maxBarSize={18}
                isAnimationActive={false}
              />
              {anySnow ? (
                <Bar
                  dataKey="snow"
                  fill="var(--color-snow)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={18}
                  isAnimationActive={false}
                />
              ) : null}
              {anySnow ? <ChartLegend content={<ChartLegendContent />} /> : null}
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ *
 * Page
 * ------------------------------------------------------------------ */

export default function CityClimateDashboard({
  city,
  monthly,
  diurnal,
  dewPoints,
  station,
  dataVintage,
}: Props) {
  // Mirrors the per-month condition in buildDiurnal: no monthly normal means
  // the diurnal curve is the station's own, unscaled.
  const anchored = monthly.some((m) => m.high !== null && m.low !== null);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3 px-1 pt-2">
        <div className="flex items-center gap-3">
          <CloudSun className="size-5 shrink-0 text-chart-1" aria-hidden />
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              {city.name}, {city.state}
            </h1>
            <p className="text-sm text-muted-foreground">
              {city.climate ?? "Climate and weather normals"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {dataVintage ? (
            <Badge variant="outline" className="font-normal">
              {dataVintage} normals
            </Badge>
          ) : null}
          <Link
            href={`/city/${city.id}`}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5",
              "text-sm font-medium hover:bg-muted"
            )}
          >
            <ArrowLeft className="size-3.5" aria-hidden />
            Back to {city.name}
          </Link>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatTile
          label="Summer high"
          value={city.summerHigh}
          unit="°F"
          icon={Thermometer}
        />
        <StatTile
          label="Winter low"
          value={city.winterLow}
          unit="°F"
          icon={Snowflake}
        />
        <StatTile
          label="Annual rain"
          value={city.rainAnnual}
          unit="in"
          icon={Umbrella}
        />
        <StatTile
          label="Annual snow"
          value={city.snowAnnual}
          unit="in"
          icon={Snowflake}
        />
        <StatTile label="Sunny days" value={city.sunDays} icon={Sun} />
      </div>

      <TypicalDay diurnal={diurnal} station={station} />

      <div className="grid gap-3 lg:grid-cols-2">
        <MonthlyTemperature monthly={monthly} />
        <MonthlyHumidity dewPoints={dewPoints} />
      </div>

      <MonthlyPrecip monthly={monthly} />

      {station ? (
        <p className="flex items-start gap-2 px-1 py-4 text-xs text-muted-foreground">
          <Droplets className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          <span>
            {`Temperature and precipitation are NOAA monthly normals for this city. Moisture comes from the nearest hourly station (${station.name}, ${station.distanceMi.toFixed(1)} mi), `}
            {anchored
              ? "so the typical-day curve is scaled to match this city's own monthly highs and lows."
              : "and this city has no monthly normals yet, so the typical-day curve is the station's own reading."}
          </span>
        </p>
      ) : null}
    </div>
  );
}
