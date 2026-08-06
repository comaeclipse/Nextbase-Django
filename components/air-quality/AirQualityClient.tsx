"use client";

import { useMemo, useState } from "react";
import { Bar, BarChart, Cell, XAxis, YAxis } from "recharts";
import { Activity, Flame, ShieldAlert, TrendingUp, Trophy, X } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
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
  StateAirQualityDataset,
  StateAirQualityValue,
} from "@/lib/state-air-quality";
import {
  HISTORICAL_SMOKE_METRICS,
  HISTORICAL_SMOKE_SOURCES,
  historicalSmokeMap,
  type HistoricalSmokeMapValue,
  type HistoricalSmokeMetric,
} from "@/lib/historical-smoke";

const rampGradient = `linear-gradient(to right, ${CRITTER_RAMP.join(", ")})`;

const distConfig = {
  count: { label: "States" },
} satisfies ChartConfig;

const bandColor = (band: BandName) =>
  BANDS.find((b) => b.name === band)?.color ?? CRITTER_RAMP[3];

export default function AirQualityClient({ dataset }: { dataset: StateAirQualityDataset }) {
  const [mode, setMode] = useState<"aqi" | "smoke">("aqi");

  function changeMode(values: string[]) {
    const next = values[0];
    if (next === "aqi" || next === "smoke") setMode(next);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 rounded-lg border bg-card p-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium">Air-quality lens</p>
          <p className="text-xs text-muted-foreground">Compare typical annual AQI with long-run wildfire-smoke exposure.</p>
        </div>
        <ToggleGroup value={[mode]} onValueChange={changeMode} variant="outline" size="sm" spacing={0} aria-label="Air-quality map mode">
          <ToggleGroupItem value="aqi"><Activity className="size-3.5" />Annual AQI</ToggleGroupItem>
          <ToggleGroupItem value="smoke"><Flame className="size-3.5" />Historical smoke</ToggleGroupItem>
        </ToggleGroup>
      </div>
      {mode === "aqi" ? <AqiView dataset={dataset} /> : <HistoricalSmokeView />}
    </div>
  );
}

function AqiView({
  dataset,
}: {
  dataset: StateAirQualityDataset;
}) {
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
        <Badge variant="secondary">EPA annual county AQI</Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Trophy className="size-4" />}
          label="Highest burden"
          value={agg.worst.name}
          sub={`${agg.worst.value} - ${agg.worst.band}`}
        />
        <StatCard
          icon={<TrendingUp className="size-4" />}
          label="National average"
          value={String(agg.avg)}
          sub={dataset.unit}
        />
        <StatCard
          icon={<ShieldAlert className="size-4" />}
          label="High-burden states"
          value={String(agg.highCount)}
          sub="High or Very High band"
        />
        <StatCard
          icon={<Activity className="size-4" />}
          label="Measured counties"
          value={String(
            dataset.data.reduce((sum, state) => sum + state.monitoredCounties, 0)
          )}
          sub="EPA county rows"
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
              bandLabel={(stat) => `${stat.band} burden`}
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
                <CardDescription>Ranked by AQI burden index</CardDescription>
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
          <CardTitle>States by burden band</CardTitle>
          <CardDescription>
            How the 50 states split across 2025 AQI burden bands
          </CardDescription>
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

      <Card>
        <CardHeader>
          <CardTitle>Full state ranking</CardTitle>
          <CardDescription>
            Index score plus the underlying monitored-county AQI metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="border-b text-xs text-muted-foreground">
                <tr>
                  <th className="px-2 py-2 text-left font-medium">Rank</th>
                  <th className="px-2 py-2 text-left font-medium">State</th>
                  <th className="px-2 py-2 text-right font-medium">Index</th>
                  <th className="px-2 py-2 text-right font-medium">Median AQI</th>
                  <th className="px-2 py-2 text-right font-medium">90th pct AQI</th>
                  <th className="px-2 py-2 text-right font-medium">Unhealthy days</th>
                  <th className="px-2 py-2 text-right font-medium">Counties</th>
                  <th className="px-2 py-2 text-left font-medium">Band</th>
                </tr>
              </thead>
              <tbody>
                {agg.ranked.map((state) => {
                  const row = state as StateAirQualityValue;
                  return (
                    <tr
                      key={row.state}
                      className="border-b last:border-0 hover:bg-muted/50"
                    >
                      <td className="px-2 py-2 tabular-nums">{row.rank}</td>
                      <td className="px-2 py-2 font-medium">{row.name}</td>
                      <td className="px-2 py-2 text-right font-semibold tabular-nums">
                        {row.value}
                      </td>
                      <td className="px-2 py-2 text-right tabular-nums">
                        {row.medianAqi.toFixed(1)}
                      </td>
                      <td className="px-2 py-2 text-right tabular-nums">
                        {row.p90Aqi.toFixed(1)}
                      </td>
                      <td className="px-2 py-2 text-right tabular-nums">
                        {row.unhealthyDaysPerYear.toFixed(1)}
                      </td>
                      <td className="px-2 py-2 text-right tabular-nums">
                        {row.monitoredCounties}
                      </td>
                      <td className="px-2 py-2">
                        <Badge
                          className="border-transparent text-white"
                          style={{ background: bandColor(row.band) }}
                        >
                          {row.band}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card size="sm">
        <CardHeader>
          <CardTitle className="text-sm">Sources and methodology</CardTitle>
          <CardDescription>{dataset.label} index inputs</CardDescription>
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

function HistoricalSmokeView() {
  const [metric, setMetric] = useState<HistoricalSmokeMetric>("recurrence");
  const [selected, setSelected] = useState<string | null>(null);
  const data = useMemo(() => historicalSmokeMap(metric), [metric]);
  const agg = useMemo(() => aggregate(data), [data]);
  const ranked = useMemo(() => [...data].sort((a, b) => a.rank - b.rank), [data]);
  const selectedState = useMemo(
    () => data.find((row) => row.state === selected) ?? null,
    [data, selected]
  );
  const copy = HISTORICAL_SMOKE_METRICS[metric];

  function changeMetric(values: string[]) {
    const next = values[0] as HistoricalSmokeMetric | undefined;
    if (next && next in HISTORICAL_SMOKE_METRICS) {
      setMetric(next);
      setSelected(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Historical wildfire smoke</h2>
          <p className="text-sm text-muted-foreground">Population-weighted county predictions, 2006-2020</p>
        </div>
        <Badge variant="secondary">Contiguous U.S. coverage</Badge>
      </div>

      <div className="rounded-lg border bg-muted/20 p-3">
        <p className="mb-2 text-xs font-medium text-muted-foreground">Map metric</p>
        <ToggleGroup value={[metric]} onValueChange={changeMetric} variant="outline" size="sm" spacing={0} aria-label="Historical smoke metric" className="flex-wrap">
          <ToggleGroupItem value="recurrence">Recurrence</ToggleGroupItem>
          <ToggleGroupItem value="smokeDays">Smoke days/year</ToggleGroupItem>
          <ToggleGroupItem value="burden">Annual burden</ToggleGroupItem>
          <ToggleGroupItem value="worstDay">Typical worst day</ToggleGroupItem>
        </ToggleGroup>
        <p className="mt-2 text-xs leading-5 text-muted-foreground">{copy.description}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<Flame className="size-4" />} label="Highest exposure" value={agg.worst.name} sub={`${copy.format(agg.worst.value)} ${metric === "recurrence" ? "share of years" : copy.unit}`} />
        <StatCard icon={<TrendingUp className="size-4" />} label="48-state average" value={copy.format(agg.avg)} sub={metric === "recurrence" ? "share of years" : copy.unit} />
        <StatCard icon={<Activity className="size-4" />} label="Source window" value="2006-2020" sub="15 complete years" />
        <StatCard icon={<ShieldAlert className="size-4" />} label="Coverage" value="48 states" sub="Alaska and Hawaii unavailable" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{copy.label} by state</CardTitle>
            <CardDescription>{copy.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <CrittersMap data={data} unit={metric === "recurrence" ? "%" : copy.unit} selected={selected} onSelect={setSelected} bandLabel={(row) => `${row.band} relative exposure`} />
            <p className="text-xs leading-5 text-muted-foreground">Colors are relative to the selected metric. Alaska and Hawaii are gray because the source covers the contiguous U.S. only.</p>
          </CardContent>
        </Card>

        {selectedState ? (
          <SmokeSelectedCard state={selectedState} metric={metric} onClear={() => setSelected(null)} />
        ) : (
          <Card>
            <CardHeader><CardTitle>Top 10 states</CardTitle><CardDescription>Ranked by {copy.label.toLowerCase()}</CardDescription></CardHeader>
            <CardContent className="space-y-2.5">
              {agg.ranked.slice(0, 10).map((state) => (
                <button key={state.state} onClick={() => setSelected(state.state)} className="group flex w-full items-center gap-3 rounded-md px-1.5 py-1 text-left transition-colors hover:bg-muted">
                  <span className="w-5 text-xs font-semibold tabular-nums text-muted-foreground">{state.rank}</span>
                  <span className="w-28 shrink-0 truncate text-sm font-medium">{state.name}</span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-orange-600" style={{ width: `${(state.value / agg.maxValue) * 100}%` }} /></div>
                  <span className="w-10 text-right text-xs font-semibold tabular-nums">{copy.format(state.value)}</span>
                </button>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader><CardTitle>Full state ranking</CardTitle><CardDescription>Historical wildfire-smoke summaries, ordered by {copy.label.toLowerCase()}</CardDescription></CardHeader>
        <CardContent><div className="overflow-x-auto"><table className="w-full min-w-[820px] text-sm"><thead className="border-b text-xs text-muted-foreground"><tr><th className="px-2 py-2 text-left font-medium">Rank</th><th className="px-2 py-2 text-left font-medium">State</th><th className="px-2 py-2 text-right font-medium">Selected metric</th><th className="px-2 py-2 text-right font-medium">Smoke days/year</th><th className="px-2 py-2 text-right font-medium">Annual burden</th><th className="px-2 py-2 text-right font-medium">Worst year</th><th className="px-2 py-2 text-left font-medium">Typical season</th></tr></thead><tbody>{ranked.map((state) => <tr key={state.state} className="border-b last:border-0 hover:bg-muted/50"><td className="px-2 py-2 tabular-nums">{state.rank}</td><td className="px-2 py-2 font-medium">{state.name}</td><td className="px-2 py-2 text-right font-semibold tabular-nums">{copy.format(state.value)} {metric !== "recurrence" && <span className="text-xs font-normal text-muted-foreground">{copy.unit}</span>}</td><td className="px-2 py-2 text-right tabular-nums">{state.smokeDaysPerYear.toFixed(1)}</td><td className="px-2 py-2 text-right tabular-nums">{state.annualSmokeBurden.toFixed(1)}</td><td className="px-2 py-2 text-right tabular-nums">{state.worstYear}</td><td className="px-2 py-2">{state.typicalSmokeSeason}</td></tr>)}</tbody></table></div></CardContent>
      </Card>

      <Card size="sm">
        <CardHeader><CardTitle className="text-sm">Sources and methodology</CardTitle><CardDescription>How the historical-smoke layer is calculated</CardDescription></CardHeader>
        <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
          <p><span className="font-medium text-foreground">Sources:</span> {HISTORICAL_SMOKE_SOURCES.join("; ")}</p>
          <p><span className="font-medium text-foreground">Method:</span> County-day smoke predictions are treated as zero when absent, clipped at zero when present, and population-weighted with 2020 Census county estimates. This is a long-run exposure summary, not a current-air-quality reading or a point-level estimate. See <code>data/state_historical_smoke_sources.md</code> for the full derivation.</p>
        </CardContent>
      </Card>
    </div>
  );
}

function SmokeSelectedCard({ state, metric, onClear }: { state: HistoricalSmokeMapValue; metric: HistoricalSmokeMetric; onClear: () => void }) {
  const copy = HISTORICAL_SMOKE_METRICS[metric];
  const unit = metric === "recurrence" ? "share of years" : copy.unit;
  return <Card><CardHeader><div className="flex items-start justify-between gap-2"><div><CardTitle>{state.name}</CardTitle><CardDescription>Historical wildfire smoke, 2006-2020</CardDescription></div><button onClick={onClear} aria-label="Clear selection" className="inline-flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"><X className="size-4" /></button></div></CardHeader><CardContent className="space-y-4"><div className="flex items-baseline gap-2"><span className="text-3xl font-bold tabular-nums leading-none">{copy.format(state.value)}</span><span className="text-xs text-muted-foreground">{unit}</span></div><Separator /><InfoRow label="National rank" value={`#${state.rank} of 48`} /><InfoRow label="Significant smoke days/year" value={state.smokeDaysPerYear.toFixed(1)} /><InfoRow label="Annual smoke burden" value={`${state.annualSmokeBurden.toFixed(1)} ug-day/m3`} /><InfoRow label="Typical worst day" value={`${state.typicalWorstDay.toFixed(1)} ug/m3`} /><InfoRow label="Typical smoke season" value={state.typicalSmokeSeason} /><InfoRow label="Worst year" value={String(state.worstYear)} /></CardContent></Card>;
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
  stat: StateAirQualityValue;
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
            <CardDescription>Pinned state - {stat.state}</CardDescription>
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
        <InfoRow label="Median AQI" value={stat.medianAqi.toFixed(1)} />
        <InfoRow label="90th percentile AQI" value={stat.p90Aqi.toFixed(1)} />
        <InfoRow
          label="Unhealthy days/year"
          value={stat.unhealthyDaysPerYear.toFixed(1)}
        />
        <InfoRow label="Monitored counties" value={String(stat.monitoredCounties)} />
        <InfoRow label="Max AQI" value={String(stat.maxAqi)} />
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
