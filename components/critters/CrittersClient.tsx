"use client";

import { useMemo, useState } from "react";
import { Bar, BarChart, Cell, XAxis, YAxis } from "recharts";
import { Bug, ShieldAlert, TrendingUp, Trophy, X } from "lucide-react";
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
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  aggregate,
  BANDS,
  CRITTER_DATASETS,
  CRITTER_RAMP,
  getDataset,
  type BandName,
  type StateValue,
} from "@/lib/critters";
import CrittersMap from "./CrittersMap";

const rampGradient = `linear-gradient(to right, ${CRITTER_RAMP.join(", ")})`;

const bandColor = (band: BandName) =>
  BANDS.find((b) => b.name === band)?.color ?? CRITTER_RAMP[3];

const distConfig = {
  count: { label: "States" },
} satisfies ChartConfig;

type Option = { id: string; label: string; emoji: string };
const OPTIONS: Option[] = CRITTER_DATASETS.map((d) => ({
  id: d.id,
  label: d.critter,
  emoji: d.emoji,
}));

export default function CrittersClient() {
  const [datasetId, setDatasetId] = useState(CRITTER_DATASETS[0].id);
  const [selected, setSelected] = useState<string | null>(null);

  const dataset = getDataset(datasetId);
  const agg = useMemo(() => aggregate(dataset.data), [dataset]);
  const selectedOption = OPTIONS.find((o) => o.id === datasetId)!;

  const selectedStat = useMemo(
    () => (selected ? dataset.data.find((d) => d.state === selected) ?? null : null),
    [selected, dataset]
  );

  return (
    <div className="space-y-6">
      {/* Critter selector */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-sm font-medium">Critter</label>
          <Combobox
            items={OPTIONS}
            value={selectedOption}
            onValueChange={(o: Option | null) => {
              if (o) {
                setDatasetId(o.id);
                setSelected(null);
              }
            }}
            itemToStringLabel={(o: Option) => o.label}
            isItemEqualToValue={(a: Option, b: Option) => a.id === b.id}
          >
            <ComboboxInput placeholder="Search critters…" className="w-full sm:w-64" />
            <ComboboxContent>
              <ComboboxEmpty>No critters found.</ComboboxEmpty>
              <ComboboxList>
                {(item: Option) => (
                  <ComboboxItem key={item.id} value={item}>
                    <span aria-hidden>{item.emoji}</span>
                    <span>{item.label}</span>
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        </div>
        {dataset.sourced ? (
          <Badge variant="secondary" className="gap-1">
            <span aria-hidden>{dataset.emoji}</span> Sourced dataset
          </Badge>
        ) : (
          <Badge variant="outline" className="gap-1 text-muted-foreground">
            Sample data
          </Badge>
        )}
      </div>

      {/* Summary stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Trophy className="size-4" />}
          label="Worst state"
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
          label="High-risk states"
          value={String(agg.highCount)}
          sub="High or Very High band"
        />
        <StatCard
          icon={<Bug className="size-4" />}
          label="Most common band"
          value={agg.modeBand}
          sub="across all states"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Map */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span aria-hidden>{dataset.emoji}</span>
              {dataset.metricLabel} by state
            </CardTitle>
            <CardDescription>{dataset.blurb}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <CrittersMap
              data={dataset.data}
              unit={dataset.unit}
              selected={selected}
              onSelect={setSelected}
            />
            {/* Legend */}
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

        {/* Detail / ranked column */}
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

      {/* Band distribution */}
      <Card>
        <CardHeader>
          <CardTitle>States by risk band</CardTitle>
          <CardDescription>
            How the 50 states split across {dataset.critter.toLowerCase()} risk bands
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

      {/* Sources */}
      {dataset.sourced && dataset.sources && (
        <Card size="sm">
          <CardHeader>
            <CardTitle className="text-sm">Sources</CardTitle>
            <CardDescription>{dataset.critter} index inputs</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-wrap gap-x-2 gap-y-1.5 text-xs text-muted-foreground">
              {dataset.sources.map((s) => (
                <li key={s}>
                  <Badge variant="outline" className="font-normal">
                    {s}
                  </Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
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
  stat: StateValue;
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
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">National rank</span>
          <span className="font-semibold tabular-nums">
            #{stat.rank} of {total}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Risk band</span>
          <Badge
            className="gap-1 border-transparent text-white"
            style={{ background: bandColor(stat.band) }}
          >
            {stat.band}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
