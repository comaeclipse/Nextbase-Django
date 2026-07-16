"use client";

import { useMemo, useState } from "react";
import { Bar, BarChart, Cell, XAxis, YAxis } from "recharts";
import { Gauge, Landmark, Scale, Trophy, X } from "lucide-react";
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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import CrittersMap from "@/components/critters/CrittersMap";
import {
  BANDS,
  CRITTER_RAMP,
  aggregate,
  bandForValue,
  type BandName,
} from "@/lib/critters";
import type {
  PoliticsTier,
  StatePoliticsDataset,
  StatePoliticsValue,
} from "@/lib/state-politics-data";

type MapMode = "conservative" | "liberal" | "combined";

const CONSERVATIVE_RAMP = [
  "#fee2e2",
  "#fecaca",
  "#fca5a5",
  "#f87171",
  "#ef4444",
  "#dc2626",
  "#991b1b",
] as const;

const LIBERAL_RAMP = [
  "#dbeafe",
  "#bfdbfe",
  "#93c5fd",
  "#60a5fa",
  "#3b82f6",
  "#2563eb",
  "#1d4ed8",
] as const;

const COMBINED_RAMP = [
  "#1d4ed8",
  "#3b82f6",
  "#93c5fd",
  "#a78bfa",
  "#fca5a5",
  "#ef4444",
  "#991b1b",
] as const;

const MODE_COPY: Record<
  MapMode,
  {
    title: string;
    description: string;
    topTitle: string;
    topDescription: string;
    lowerLabel: string;
    higherLabel: string;
    ramp: readonly string[];
    rankLabel: string;
  }
> = {
  conservative: {
    title: "Most conservative states",
    description:
      "Higher scores show stronger conservative lean on the 2026 index. 100 = most conservative in the nation.",
    topTitle: "Top 10 conservative states",
    topDescription: "Ranked by conservatism score",
    lowerLabel: "Less conservative",
    higherLabel: "More conservative",
    ramp: CONSERVATIVE_RAMP,
    rankLabel: "conservative rank",
  },
  liberal: {
    title: "Most liberal states",
    description:
      "Higher scores show stronger liberal lean, using the inverse of the conservatism index. 100 = most liberal in the nation.",
    topTitle: "Top 10 liberal states",
    topDescription: "Ranked by liberal-lean score",
    lowerLabel: "Less liberal",
    higherLabel: "More liberal",
    ramp: LIBERAL_RAMP,
    rankLabel: "liberal rank",
  },
  combined: {
    title: "Red / blue / purple map",
    description:
      "A combined view where blue states are more progressive, purple states are competitive, and red states are more conservative.",
    topTitle: "Top 10 conservative states",
    topDescription: "Ranked by conservatism score",
    lowerLabel: "More blue",
    higherLabel: "More red",
    ramp: COMBINED_RAMP,
    rankLabel: "conservative rank",
  },
};

const TIER_ORDER: PoliticsTier[] = [
  "Very progressive",
  "Progressive",
  "Lean progressive",
  "Purple",
  "Lean conservative",
  "Conservative",
  "Very conservative",
];

const distConfig = {
  count: { label: "States" },
} satisfies ChartConfig;

const bandColor = (band: BandName) =>
  BANDS.find((b) => b.name === band)?.color ?? CRITTER_RAMP[3];

export default function PoliticsClient({
  dataset,
}: {
  dataset: StatePoliticsDataset;
}) {
  const [mapMode, setMapMode] = useState<MapMode>("combined");
  const [selected, setSelected] = useState<string | null>(null);
  const displayData = useMemo(
    () => buildDisplayData(dataset.data, mapMode),
    [dataset.data, mapMode]
  );
  const agg = useMemo(() => aggregate(displayData), [displayData]);
  const selectedStat = useMemo(
    () => (selected ? displayData.find((d) => d.state === selected) ?? null : null),
    [selected, displayData]
  );
  const tierCounts = useMemo(() => countTiers(dataset.data), [dataset]);
  const competitiveCount = dataset.data.filter((d) => d.value >= 40 && d.value <= 60).length;
  const modeCopy = MODE_COPY[mapMode];
  const rampGradient = `linear-gradient(to right, ${modeCopy.ramp.join(", ")})`;

  function changeMapMode(values: string[]) {
    const next = values[0];
    if (next !== "conservative" && next !== "liberal" && next !== "combined") return;
    setMapMode(next);
    setSelected(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">{dataset.metricLabel}</h2>
          <p className="text-sm text-muted-foreground">{dataset.dataVintage}</p>
        </div>
        <div className="flex flex-col gap-2 sm:items-end">
          <ToggleGroup
            value={[mapMode]}
            onValueChange={changeMapMode}
            variant="outline"
            size="sm"
            spacing={0}
            aria-label="Political map mode"
            className="flex-wrap justify-start sm:justify-end"
          >
            <ToggleGroupItem value="conservative" aria-label="Most conservative map">
              Most conservative
            </ToggleGroupItem>
            <ToggleGroupItem value="liberal" aria-label="Most liberal map">
              Most liberal
            </ToggleGroupItem>
            <ToggleGroupItem value="combined" aria-label="Red blue purple map">
              Red / blue / purple
            </ToggleGroupItem>
          </ToggleGroup>
          <Badge variant="secondary">State politics dataset</Badge>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Trophy className="size-4" />}
          label={mapMode === "liberal" ? "Most liberal" : "Most conservative"}
          value={agg.worst.name}
          sub={`${agg.worst.value} - ${agg.worst.displayBand ?? agg.worst.band}`}
        />
        <StatCard
          icon={<Gauge className="size-4" />}
          label="National average"
          value={String(agg.avg)}
          sub={dataset.unit}
        />
        <StatCard
          icon={<Scale className="size-4" />}
          label="Competitive states"
          value={String(competitiveCount)}
          sub="Score between 40 and 60"
        />
        <StatCard
          icon={<Landmark className="size-4" />}
          label="Republican trifectas"
          value={String(dataset.data.filter((d) => d.governmentConfiguration === "Republican trifecta").length)}
          sub="in this index"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{modeCopy.title}</CardTitle>
            <CardDescription>{modeCopy.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <CrittersMap
              data={displayData}
              unit={dataset.unit}
              selected={selected}
              onSelect={setSelected}
              bandLabel={(stat) => stat.displayBand ?? stat.band}
              colorRamp={modeCopy.ramp}
            />
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">{modeCopy.lowerLabel}</span>
                <div
                  className="h-2.5 flex-1 rounded-full"
                  style={{ background: rampGradient }}
                />
                <span className="text-xs text-muted-foreground">{modeCopy.higherLabel}</span>
                <span className="ml-1 text-xs text-muted-foreground">
                  ({dataset.unit})
                </span>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {TIER_ORDER.map((tier) => {
                  const band = dataset.data.find((d) => d.tier === tier)?.band ?? "Moderate";
                  return (
                    <span
                      key={tier}
                      className="flex items-center gap-1.5 text-xs text-muted-foreground"
                    >
                      <span
                        className="size-2.5 rounded-[3px]"
                        style={{ background: bandColor(band) }}
                      />
                      {tier}
                    </span>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {selectedStat ? (
            <SelectedCard
              stat={selectedStat}
              total={dataset.data.length}
              rankLabel={modeCopy.rankLabel}
              onClear={() => setSelected(null)}
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>{modeCopy.topTitle}</CardTitle>
                <CardDescription>{modeCopy.topDescription}</CardDescription>
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
                    <span className="w-10 text-right text-xs font-semibold tabular-nums">
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
          <CardTitle>States by political tier</CardTitle>
          <CardDescription>How the 50 states split across the index tiers</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={distConfig} className="h-[260px] w-full">
            <BarChart accessibilityLayer data={tierCounts} margin={{ top: 8 }}>
              <XAxis
                dataKey="tier"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12 }}
                interval={0}
              />
              <YAxis hide />
              <ChartTooltip
                cursor={{ fill: "var(--muted)", opacity: 0.4 }}
                content={<ChartTooltipContent />}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {tierCounts.map((tier) => (
                  <Cell key={tier.tier} fill={tier.color} />
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
            Index score plus the underlying PVI, ideology, control, and scenario fields
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead className="border-b text-xs text-muted-foreground">
                <tr>
                  <th className="px-2 py-2 text-left font-medium">Rank</th>
                  <th className="px-2 py-2 text-left font-medium">State</th>
                  <th className="px-2 py-2 text-right font-medium">Index</th>
                  <th className="px-2 py-2 text-left font-medium">Cook PVI</th>
                  <th className="px-2 py-2 text-right font-medium">Gallup adv.</th>
                  <th className="px-2 py-2 text-left font-medium">State government</th>
                  <th className="px-2 py-2 text-left font-medium">Tier</th>
                  <th className="px-2 py-2 text-right font-medium">Scenario range</th>
                </tr>
              </thead>
              <tbody>
                {agg.ranked.map((state) => {
                  const row = state as StatePoliticsValue;
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
                      <td className="px-2 py-2">{row.cookPvi}</td>
                      <td className="px-2 py-2 text-right tabular-nums">
                        {formatSigned(row.gallupConservativeAdvantage)}
                      </td>
                      <td className="px-2 py-2">{row.governmentConfiguration}</td>
                      <td className="px-2 py-2">
                        <Badge
                          className="border-transparent text-white"
                          style={{ background: bandColor(row.band) }}
                        >
                          {row.tier}
                        </Badge>
                      </td>
                      <td className="px-2 py-2 text-right tabular-nums">
                        {row.minimumScoreAcrossWeightScenarios}-
                        {row.maximumScoreAcrossWeightScenarios}
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
          <CardTitle className="text-sm">Sources and Methodology</CardTitle>
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

function countTiers(data: StatePoliticsValue[]) {
  return TIER_ORDER.map((tier) => {
    const sample = data.find((d) => d.tier === tier);
    return {
      tier,
      count: data.filter((d) => d.tier === tier).length,
      color: sample ? bandColor(sample.band) : CRITTER_RAMP[3],
    };
  });
}

function buildDisplayData(data: StatePoliticsValue[], mode: MapMode): StatePoliticsValue[] {
  if (mode !== "liberal") return data;

  const rows = data
    .map((state) => ({
      ...state,
      value: Math.round((100 - state.value) * 10) / 10,
    }))
    .sort((a, b) => b.value - a.value || a.name.localeCompare(b.name));

  return rows.map((state, index) => ({
    ...state,
    rank: index + 1,
    band: bandForValue(state.value),
    displayBand: liberalTierLabel(state),
  }));
}

function liberalTierLabel(state: StatePoliticsValue) {
  if (state.tier === "Very progressive") return "Very liberal";
  if (state.tier === "Progressive") return "Liberal";
  if (state.tier === "Lean progressive") return "Lean liberal";
  if (state.tier === "Purple") return "Purple";
  if (state.tier === "Lean conservative") return "Lean conservative";
  if (state.tier === "Conservative") return "Conservative";
  return "Very conservative";
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
  total,
  rankLabel,
  onClear,
}: {
  stat: StatePoliticsValue;
  total: number;
  rankLabel: string;
  onClear: () => void;
}) {
  const rankRange =
    stat.bestRankAcrossWeightScenarios === stat.worstRankAcrossWeightScenarios
      ? `#${stat.bestRankAcrossWeightScenarios}`
      : `#${stat.bestRankAcrossWeightScenarios}-#${stat.worstRankAcrossWeightScenarios}`;

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
          <span className="text-xs text-muted-foreground">0-100 index</span>
        </div>
        <Separator />
        <InfoRow label={rankLabel} value={`#${stat.rank} of ${total}`} />
        <InfoRow label="Political tier" value={stat.tier} />
        <InfoRow label="Cook PVI" value={stat.cookPvi} />
        <InfoRow
          label="Gallup advantage"
          value={`${formatSigned(stat.gallupConservativeAdvantage)} conservative`}
        />
        <InfoRow label="State government" value={stat.governmentConfiguration} />
        <InfoRow label="Scenario rank range" value={rankRange} />
        <InfoRow
          label="Scenario score range"
          value={`${stat.minimumScoreAcrossWeightScenarios}-${stat.maximumScoreAcrossWeightScenarios}`}
        />
      </CardContent>
    </Card>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="max-w-[12rem] text-right font-semibold tabular-nums">{value}</span>
    </div>
  );
}

function formatSigned(value: number) {
  return value > 0 ? `+${value}` : String(value);
}
