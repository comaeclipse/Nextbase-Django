"use client";

import { useMemo, useState } from "react";
import { Bar, BarChart, Cell, XAxis, YAxis } from "recharts";
import { Fuel, Gauge, PiggyBank, TrendingUp, X } from "lucide-react";
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
import { aggregate, BANDS, CRITTER_RAMP, type BandName } from "@/lib/critters";
import type { GasPriceDataset, GasPriceValue } from "@/lib/gas-prices-data";

const rampGradient = `linear-gradient(to right, ${CRITTER_RAMP.join(", ")})`;

const distConfig = {
  count: { label: "States" },
} satisfies ChartConfig;

const bandColor = (band: BandName) =>
  BANDS.find((b) => b.name === band)?.color ?? CRITTER_RAMP[3];

const usd = (price: number) => `$${price.toFixed(2)}`;

export default function GasClient({ dataset }: { dataset: GasPriceDataset }) {
  const [selected, setSelected] = useState<string | null>(null);
  const agg = useMemo(() => aggregate(dataset.data), [dataset]);
  const selectedStat = useMemo(
    () =>
      selected
        ? dataset.data.find((d) => d.state === selected) ?? null
        : null,
    [selected, dataset]
  );

  const avgPrice = useMemo(
    () =>
      dataset.data.reduce((sum, d) => sum + d.price, 0) / dataset.data.length,
    [dataset]
  );
  const cheapest = useMemo(
    () =>
      dataset.data.reduce((min, d) => (d.price < min.price ? d : min), dataset.data[0]),
    [dataset]
  );
  const priciest = useMemo(
    () =>
      dataset.data.reduce((max, d) => (d.price > max.price ? d : max), dataset.data[0]),
    [dataset]
  );
  const aboveFour = useMemo(
    () => dataset.data.filter((d) => d.price >= 4).length,
    [dataset]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">{dataset.metricLabel}</h2>
          <p className="text-sm text-muted-foreground">{dataset.dataVintage}</p>
        </div>
        <Badge variant="secondary">State fuel dataset</Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Fuel className="size-4" />}
          label="Most expensive"
          value={priciest.name}
          sub={`${usd(priciest.price)}/gal · ${priciest.band}`}
        />
        <StatCard
          icon={<TrendingUp className="size-4" />}
          label="National average"
          value={`${usd(avgPrice)}`}
          sub={`per gallon, regular`}
        />
        <StatCard
          icon={<Gauge className="size-4" />}
          label="States above $4.00"
          value={String(aboveFour)}
          sub="regular unleaded"
        />
        <StatCard
          icon={<PiggyBank className="size-4" />}
          label="Cheapest"
          value={cheapest.name}
          sub={`${usd(cheapest.price)}/gal`}
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
              bandLabel={(stat) =>
                `${usd((stat as GasPriceValue).price)}/gal`
              }
            />
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">Cheaper</span>
                <div
                  className="h-2.5 flex-1 rounded-full"
                  style={{ background: rampGradient }}
                />
                <span className="text-xs text-muted-foreground">Pricier</span>
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
              avgPrice={avgPrice}
              total={dataset.data.length}
              onClear={() => setSelected(null)}
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Most expensive states</CardTitle>
                <CardDescription>Ranked by regular gas price</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {agg.ranked.slice(0, 10).map((stat) => {
                  const gas = stat as GasPriceValue;
                  return (
                    <button
                      key={gas.state}
                      onClick={() => setSelected(gas.state)}
                      className="group flex w-full items-center gap-3 rounded-md px-1.5 py-1 text-left transition-colors hover:bg-muted"
                    >
                      <span className="w-5 text-xs font-semibold tabular-nums text-muted-foreground">
                        {gas.rank}
                      </span>
                      <span className="w-28 shrink-0 truncate text-sm font-medium">
                        {gas.name}
                      </span>
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${(gas.value / agg.maxValue) * 100}%`,
                            background: bandColor(gas.band),
                          }}
                        />
                      </div>
                      <span className="w-12 text-right text-xs font-semibold tabular-nums">
                        {usd(gas.price)}
                      </span>
                    </button>
                  );
                })}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>States by price band</CardTitle>
          <CardDescription>
            How the 50 states split across the expensiveness index bands
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

      <Card size="sm">
        <CardHeader>
          <CardTitle className="text-sm">Sources</CardTitle>
          <CardDescription>Regular gas price inputs</CardDescription>
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
  avgPrice,
  total,
  onClear,
}: {
  stat: GasPriceValue;
  avgPrice: number;
  total: number;
  onClear: () => void;
}) {
  const delta = stat.price - avgPrice;
  const deltaLabel =
    delta === 0
      ? "at the national average"
      : `${usd(Math.abs(delta))}/gal ${delta > 0 ? "above" : "below"} average`;

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
            {usd(stat.price)}
          </span>
          <span className="text-xs text-muted-foreground">per gallon</span>
        </div>
        <Separator />
        <InfoRow label="National rank" value={`#${stat.rank} of ${total}`} />
        <InfoRow label="Price band" value={stat.band} />
        <InfoRow label="vs. national avg." value={deltaLabel} />
        <InfoRow label="Expensiveness index" value={`${stat.value} / 100`} />
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
