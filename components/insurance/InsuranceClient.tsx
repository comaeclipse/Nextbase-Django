"use client";

import { useMemo, useState } from "react";
import { Bar, BarChart, Cell, XAxis, YAxis } from "recharts";
import { CarFront, DollarSign, House, ShieldAlert, Trophy, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import CrittersMap from "@/components/critters/CrittersMap";
import { aggregate, BANDS, CRITTER_RAMP } from "@/lib/critters";
import { INSURANCE_DATASETS, type InsuranceDataset, type InsuranceStateValue } from "@/lib/insurance";

const rampGradient = `linear-gradient(to right, ${CRITTER_RAMP.join(", ")})`;
const chartConfig = { count: { label: "States" } } satisfies ChartConfig;
const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
type DatasetId = InsuranceDataset["id"];

export default function InsuranceClient() {
  const [datasetId, setDatasetId] = useState<DatasetId>("home");
  const [selected, setSelected] = useState<string | null>(null);
  const dataset = INSURANCE_DATASETS.find((item) => item.id === datasetId) ?? INSURANCE_DATASETS[0];
  const stats = useMemo(() => aggregate(dataset.data), [dataset]);
  const ranked = useMemo(() => [...dataset.data].sort((a, b) => a.rank - b.rank), [dataset]);
  const selectedState = useMemo(() => dataset.data.find((item) => item.state === selected) ?? null, [dataset, selected]);

  function changeDataset(values: string[]) {
    const next = values[0];
    if (next !== "home" && next !== "auto") return;
    setDatasetId(next);
    setSelected(null);
  }

  return <div className="space-y-6">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <ToggleGroup value={[datasetId]} onValueChange={changeDataset} variant="outline" size="sm" spacing={0} aria-label="Insurance type">
        <ToggleGroupItem value="home" aria-label="Homeowners insurance"><House className="size-4" />Homeowners</ToggleGroupItem>
        <ToggleGroupItem value="auto" aria-label="Car insurance"><CarFront className="size-4" />Car</ToggleGroupItem>
      </ToggleGroup>
      <Badge variant="secondary">{dataset.dataVintage}</Badge>
    </div>

    <p className="rounded-md border bg-muted/30 px-3 py-2 text-xs leading-5 text-muted-foreground"><span className="font-medium text-foreground">Standardized profile:</span> {dataset.profile}</p>

    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard icon={<Trophy className="size-4" />} label="Highest benchmark" value={ranked[0].name} sub={`${money.format(ranked[0].annualPremium)}/year`} />
      <StatCard icon={<DollarSign className="size-4" />} label="50-state average" value={money.format(dataset.nationalAverage)} sub="per year" />
      <StatCard icon={<ShieldAlert className="size-4" />} label="High-cost states" value={String(stats.highCount)} sub="High or Very High index band" />
      <StatCard icon={datasetId === "home" ? <House className="size-4" /> : <CarFront className="size-4" />} label="Lowest benchmark" value={ranked.at(-1)?.name ?? ""} sub={`${money.format(ranked.at(-1)?.annualPremium ?? 0)}/year`} />
    </div>

    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2"><CardHeader><CardTitle>{dataset.metricLabel} by state</CardTitle><CardDescription>{dataset.blurb}</CardDescription></CardHeader><CardContent className="space-y-4">
        <CrittersMap data={dataset.data} unit={dataset.unit} selected={selected} onSelect={setSelected} />
        <Legend />
      </CardContent></Card>
      {selectedState ? <SelectedCard state={selectedState} onClear={() => setSelected(null)} /> : <RankedCard ranked={ranked} onSelect={setSelected} />}
    </div>

    <Card><CardHeader><CardTitle>States by cost band</CardTitle><CardDescription>Distribution of 2026 standardized {datasetId === "home" ? "homeowners" : "car-insurance"} premiums</CardDescription></CardHeader><CardContent><ChartContainer config={chartConfig} className="h-[240px] w-full"><BarChart accessibilityLayer data={stats.bandCounts} margin={{ top: 8 }}><XAxis dataKey="band" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} /><YAxis hide /><ChartTooltip cursor={{ fill: "var(--muted)", opacity: 0.4 }} content={<ChartTooltipContent />} /><Bar dataKey="count" radius={[4, 4, 0, 0]}>{stats.bandCounts.map((band) => <Cell key={band.band} fill={band.color} />)}</Bar></BarChart></ChartContainer></CardContent></Card>
    <Sources dataset={dataset} />
  </div>;
}

function Legend() { return <div className="space-y-2"><div className="flex items-center gap-3"><span className="text-xs text-muted-foreground">Lower cost</span><div className="h-2.5 flex-1 rounded-full" style={{ background: rampGradient }} /><span className="text-xs text-muted-foreground">Higher cost</span></div><div className="flex flex-wrap gap-x-4 gap-y-1">{BANDS.map((band) => <span key={band.name} className="flex items-center gap-1.5 text-xs text-muted-foreground"><span className="size-2.5 rounded-[3px]" style={{ background: band.color }} />{band.name}</span>)}</div></div>; }

function StatCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub: string }) { return <Card><CardContent className="flex flex-col gap-1"><div className="flex items-center gap-1.5 text-muted-foreground">{icon}<span className="text-xs font-medium">{label}</span></div><div className="truncate text-xl font-bold leading-tight" title={value}>{value}</div><div className="text-xs text-muted-foreground">{sub}</div></CardContent></Card>; }

function RankedCard({ ranked, onSelect }: { ranked: InsuranceStateValue[]; onSelect: (state: string) => void }) { return <Card><CardHeader><CardTitle>Top 10 most expensive</CardTitle><CardDescription>By standardized annual premium</CardDescription></CardHeader><CardContent className="space-y-2.5">{ranked.slice(0, 10).map((state) => <button key={state.state} onClick={() => onSelect(state.state)} className="flex w-full items-center gap-3 rounded-md px-1.5 py-1 text-left transition-colors hover:bg-muted"><span className="w-5 text-xs font-semibold tabular-nums text-muted-foreground">{state.rank}</span><span className="w-28 shrink-0 truncate text-sm font-medium">{state.name}</span><div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full" style={{ width: `${state.value}%`, background: CRITTER_RAMP[5] }} /></div><span className="w-12 text-right text-xs font-semibold tabular-nums">{money.format(state.annualPremium)}</span></button>)}</CardContent></Card>; }

function SelectedCard({ state, onClear }: { state: InsuranceStateValue; onClear: () => void }) { const diff = `${state.nationalDifference > 0 ? "+" : ""}${state.nationalDifference}%`; return <Card><CardHeader><div className="flex items-start justify-between gap-2"><div><CardTitle>{state.name}</CardTitle><CardDescription>Pinned state · {state.state}</CardDescription></div><button onClick={onClear} aria-label="Clear selection" className="inline-flex size-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"><X className="size-4" /></button></div></CardHeader><CardContent className="space-y-4"><div className="flex items-baseline gap-2"><span className="text-3xl font-bold tabular-nums leading-none">{money.format(state.annualPremium)}</span><span className="text-xs text-muted-foreground">per year</span></div><Separator /><Info label="Monthly equivalent" value={money.format(state.monthlyPremium)} />{state.sixMonthPremium && <Info label="Six-month benchmark" value={money.format(state.sixMonthPremium)} />}<Info label="Vs. 50-state average" value={diff} /><Info label="National rank" value={`#${state.rank} of 50`} /><Info label="Cost index" value={`${state.value} · ${state.band}`} />{state.insureComAnnual && <><Separator /><p className="text-xs font-medium text-muted-foreground">Reference rates (not scored)</p><Info label="Insure.com" value={`${money.format(state.insureComAnnual)}/yr`} /><Info label="NerdWallet" value={`${money.format(state.nerdwalletAnnual ?? 0)}/yr`} /></>}</CardContent></Card>; }
function Info({ label, value }: { label: string; value: string }) { return <div className="flex items-center justify-between gap-4 text-sm"><span className="text-muted-foreground">{label}</span><span className="text-right font-semibold tabular-nums">{value}</span></div>; }
function Sources({ dataset }: { dataset: InsuranceDataset }) { return <Card size="sm"><CardHeader><CardTitle className="text-sm">Sources, methodology & limitations</CardTitle><CardDescription>{dataset.label} insurance benchmark</CardDescription></CardHeader><CardContent className="space-y-4 text-sm leading-6 text-muted-foreground"><div><span className="font-medium text-foreground">Sources.</span><ul className="mt-1 list-disc space-y-1 pl-5">{dataset.sources.map((source) => <li key={source.href}><a className="font-medium text-foreground underline underline-offset-2" href={source.href} target="_blank" rel="noreferrer">{source.label}</a>: {source.detail}</li>)}</ul></div><p><span className="font-medium text-foreground">Methodology.</span> {dataset.methodology}</p><p><span className="font-medium text-foreground">Limitations.</span> {dataset.limitations}</p><p className="text-xs">Prepared July 16, 2026. This analytical visualization is not insurance, legal, or actuarial advice.</p></CardContent></Card>; }
