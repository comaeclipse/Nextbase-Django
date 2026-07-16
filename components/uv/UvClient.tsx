"use client";

import { useMemo, useState } from "react";
import { Bar, BarChart, Cell, XAxis, YAxis } from "recharts";
import { ShieldAlert, Sun, TrendingUp, Trophy, X } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import CrittersMap from "@/components/critters/CrittersMap";
import {
  aggregate,
  BANDS,
  CRITTER_RAMP,
  type BandName,
} from "@/lib/critters";
import type {
  StateWeatherIndexDataset,
  StateWeatherIndexValue,
} from "@/lib/state-weather-data";

const rampGradient = `linear-gradient(to right, ${CRITTER_RAMP.join(", ")})`;

const distConfig = {
  count: { label: "States" },
} satisfies ChartConfig;

const bandColor = (band: BandName) =>
  BANDS.find((b) => b.name === band)?.color ?? CRITTER_RAMP[3];

export default function UvClient({ dataset }: { dataset: StateWeatherIndexDataset }) {
  const [selected, setSelected] = useState<string | null>(null);
  const agg = useMemo(() => aggregate(dataset.data), [dataset]);
  const selectedStat = useMemo(
    () => (selected ? dataset.data.find((d) => d.state === selected) ?? null : null),
    [selected, dataset]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">{dataset.metricLabel}</h2>
          <p className="text-sm text-muted-foreground">{dataset.dataVintage}</p>
        </div>
        <Badge variant="secondary">State weather dataset</Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Trophy className="size-4" />}
          label="Highest exposure"
          value={agg.worst.name}
          sub={`${agg.worst.value} · ${agg.worst.band}`}
        />
        <StatCard
          icon={<TrendingUp className="size-4" />}
          label="National average"
          value={String(agg.avg)}
          sub={dataset.unit}
        />
        <StatCard
          icon={<ShieldAlert className="size-4" />}
          label="High-exposure states"
          value={String(agg.highCount)}
          sub="High or Very High band"
        />
        <StatCard
          icon={<Sun className="size-4" />}
          label="Peak month"
          value={mode(dataset.data.map((d) => d.peakMonth))}
          sub="most common peak"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{dataset.metricLabel} by state</CardTitle>
            <CardDescription>{dataset.blurb}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <CrittersMap
              data={dataset.data}
              unit={dataset.unit}
              selected={selected}
              onSelect={setSelected}
            />
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">Lower</span>
                <div
                  className="h-2.5 flex-1 rounded-full"
                  style={{ background: rampGradient }}
                />
                <span className="text-xs text-muted-foreground">Higher</span>
                <span className="ml-1 text-xs text-muted-foreground">
                  ({dataset.unit})
                </span>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {BANDS.map((b) => (
                  <span
                    key={b.name}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground"
                  >
                    <span
                      className="size-2.5 rounded-[3px]"
                      style={{ background: b.color }}
                    />
                    {b.name}
                  </span>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {selectedStat ? (
            <SelectedCard
              stat={selectedStat}
              unit={dataset.unit}
              total={dataset.data.length}
              onClear={() => setSelected(null)}
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Top 10 states</CardTitle>
                <CardDescription>Ranked by {dataset.metricLabel.toLowerCase()}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {agg.ranked.slice(0, 10).map((stat) => (
                  <button
                    key={stat.state}
                    onClick={() => setSelected(stat.state)}
                    className="group flex w-full items-center gap-3 rounded-md px-1.5 py-1 text-left transition-colors hover:bg-muted"
                  >
                    <span className="w-5 text-xs font-semibold tabular-nums text-muted-foreground">
                      {stat.rank}
                    </span>
                    <span className="w-28 shrink-0 truncate text-sm font-medium">
                      {stat.name}
                    </span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(stat.value / agg.maxValue) * 100}%`,
                          background: bandColor(stat.band),
                        }}
                      />
                    </div>
                    <span className="w-8 text-right text-xs font-semibold tabular-nums">
                      {stat.value}
                    </span>
                  </button>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>States by exposure band</CardTitle>
          <CardDescription>How the 50 states split across UV exposure bands</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={distConfig} className="h-[240px] w-full">
            <BarChart accessibilityLayer data={agg.bandCounts} margin={{ top: 8 }}>
              <XAxis
                dataKey="band"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12 }}
              />
              <YAxis hide />
              <ChartTooltip
                cursor={{ fill: "var(--muted)", opacity: 0.4 }}
                content={<ChartTooltipContent />}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {agg.bandCounts.map((b) => (
                  <Cell key={b.band} fill={b.color} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card size="sm">
        <CardHeader>
          <CardTitle className="text-sm">Sources</CardTitle>
          <CardDescription>{dataset.label} inputs</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm leading-6 text-muted-foreground">
            <span className="font-medium text-foreground">Sources:</span>{" "}
            {dataset.sources.join(", ")}
          </p>
          <p className="text-sm leading-6 text-muted-foreground">
            <span className="font-medium text-foreground">Methodology:</span>{" "}
            {dataset.methodology}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function mode(values: string[]) {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "";
}

function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-1">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          {icon}
          <span className="text-xs font-medium">{label}</span>
        </div>
        <div className="truncate text-xl font-bold leading-tight" title={value}>
          {value}
        </div>
        <div className="text-xs text-muted-foreground">{sub}</div>
      </CardContent>
    </Card>
  );
}

function SelectedCard({
  stat,
  unit,
  total,
  onClear,
}: {
  stat: StateWeatherIndexValue;
  unit: string;
  total: number;
  onClear: () => void;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle>{stat.name}</CardTitle>
            <CardDescription>Pinned state · {stat.state}</CardDescription>
          </div>
          <button
            onClick={onClear}
            aria-label="Clear selection"
            className="inline-flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold tabular-nums leading-none">
            {stat.value}
          </span>
          <span className="text-xs text-muted-foreground">{unit}</span>
        </div>
        <Separator />
        <InfoRow label="National rank" value={`#${stat.rank} of ${total}`} />
        <InfoRow label="Risk band" value={stat.band} />
        <InfoRow
          label="Annual solar-noon UVI"
          value={stat.annualMeanSolarNoonUvi.toFixed(1)}
        />
        <InfoRow
          label="Peak monthly UVI"
          value={`${stat.peakMonthlyMeanUvi.toFixed(1)} in ${stat.peakMonth}`}
        />
      </CardContent>
    </Card>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-semibold tabular-nums">{value}</span>
    </div>
  );
}
