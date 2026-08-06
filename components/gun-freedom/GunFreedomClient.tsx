"use client";

import { useMemo, useState } from "react";
import { Scale, ShieldCheck, Trophy, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import CrittersMap from "@/components/critters/CrittersMap";
import { CRITTER_RAMP, aggregate } from "@/lib/critters";
import type { StateGunFreedomDataset, StateGunFreedomValue } from "@/lib/state-gun-freedom";

const rampGradient = `linear-gradient(to right, ${CRITTER_RAMP.join(", ")})`;

export default function GunFreedomClient({ dataset }: { dataset: StateGunFreedomDataset }) {
  const [selected, setSelected] = useState<string | null>(null);
  const aggregateData = useMemo(() => aggregate(dataset.data), [dataset]);
  const selectedState = useMemo(() => dataset.data.find((row) => row.state === selected) ?? null, [dataset, selected]);
  const unsettled = dataset.data.filter((row) => row.legalStatus === "Unsettled");

  return <div className="space-y-6">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div><h2 className="text-lg font-semibold">{dataset.metricLabel}</h2><p className="text-sm text-muted-foreground">{dataset.dataVintage}</p></div>
      <Badge variant="secondary">Provisional policy index</Badge>
    </div>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Stat icon={<Trophy className="size-4" />} label="Highest score" value={aggregateData.worst.name} sub={`${aggregateData.worst.value} of 100`} />
      <Stat icon={<ShieldCheck className="size-4" />} label="National average" value={String(aggregateData.avg)} sub={dataset.unit} />
      <Stat icon={<Scale className="size-4" />} label="Higher-freedom states" value={String(dataset.data.filter((row) => row.value >= 80).length)} sub="Score of 80 or higher" />
      <Stat icon={<Scale className="size-4" />} label="Legally unsettled" value={String(unsettled.length)} sub={unsettled.map((row) => row.state).join(", ")} />
    </div>
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2"><CardHeader><CardTitle>Gun Freedom Index by state</CardTitle><CardDescription>{dataset.blurb}</CardDescription></CardHeader><CardContent className="space-y-4">
        <CrittersMap data={dataset.data} unit={dataset.unit} selected={selected} onSelect={setSelected} bandLabel={(row) => row.displayBand ?? row.band} />
        <div className="flex items-center gap-3"><span className="text-xs text-muted-foreground">More restrictive</span><div className="h-2.5 flex-1 rounded-full" style={{ background: rampGradient }} /><span className="text-xs text-muted-foreground">Less restrictive</span></div>
      </CardContent></Card>
      {selectedState ? <SelectedCard state={selectedState} total={dataset.data.length} onClear={() => setSelected(null)} /> : <Card><CardHeader><CardTitle>Top 10 states</CardTitle><CardDescription>Highest scores in this index</CardDescription></CardHeader><CardContent className="space-y-2.5">{aggregateData.ranked.slice(0, 10).map((row) => <button key={row.state} onClick={() => setSelected(row.state)} className="flex w-full items-center gap-3 rounded-md px-1.5 py-1 text-left hover:bg-muted"><span className="w-5 text-xs font-semibold text-muted-foreground">{row.rank}</span><span className="w-28 shrink-0 truncate text-sm font-medium">{row.name}</span><div className="h-1.5 flex-1 rounded-full bg-muted"><div className="h-full rounded-full bg-amber-600" style={{ width: `${row.value}%` }} /></div><span className="w-8 text-right text-xs font-semibold">{row.value}</span></button>)}</CardContent></Card>}
    </div>
    <Card><CardHeader><CardTitle>Full state ranking</CardTitle><CardDescription>Score and plain-language statewide policy summary</CardDescription></CardHeader><CardContent><div className="overflow-x-auto"><table className="w-full min-w-[720px] text-sm"><thead className="border-b text-xs text-muted-foreground"><tr><th className="px-2 py-2 text-left font-medium">Rank</th><th className="px-2 py-2 text-left font-medium">State</th><th className="px-2 py-2 text-right font-medium">Index</th><th className="px-2 py-2 text-left font-medium">Policy summary</th><th className="px-2 py-2 text-left font-medium">Status</th></tr></thead><tbody>{aggregateData.ranked.map((row) => { const state = row as StateGunFreedomValue; return <tr key={state.state} className="border-b last:border-0 hover:bg-muted/50"><td className="px-2 py-2 tabular-nums">{state.rank}</td><td className="px-2 py-2 font-medium">{state.name}</td><td className="px-2 py-2 text-right font-semibold tabular-nums">{state.value}</td><td className="px-2 py-2 text-muted-foreground">{state.summary}</td><td className="px-2 py-2">{state.legalStatus ? <Badge variant="outline">Legally unsettled</Badge> : "—"}</td></tr>; })}</tbody></table></div></CardContent></Card>
    <Card size="sm"><CardHeader><CardTitle className="text-sm">Sources and methodology</CardTitle><CardDescription>How the provisional index was constructed</CardDescription></CardHeader><CardContent className="space-y-3"><p className="text-sm leading-6 text-muted-foreground"><span className="font-medium text-foreground">Sources:</span>{" "}{dataset.sources.map((source, index) => <span key={source.href}>{index > 0 && ", "}<a className="underline underline-offset-2" href={source.href} target="_blank" rel="noreferrer">{source.label}</a></span>)}</p><p className="text-sm leading-6 text-muted-foreground"><span className="font-medium text-foreground">Methodology:</span>{" "}{dataset.methodology}</p></CardContent></Card>
  </div>;
}

function Stat({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub: string }) { return <Card><CardContent className="flex flex-col gap-1"><div className="flex items-center gap-1.5 text-muted-foreground">{icon}<span className="text-xs font-medium">{label}</span></div><div className="truncate text-xl font-bold leading-tight">{value}</div><div className="text-xs text-muted-foreground">{sub}</div></CardContent></Card>; }
function SelectedCard({ state, total, onClear }: { state: StateGunFreedomValue; total: number; onClear: () => void }) { return <Card><CardHeader><div className="flex items-start justify-between gap-2"><div><CardTitle>{state.name}</CardTitle><CardDescription>Pinned state — {state.state}</CardDescription></div><button onClick={onClear} aria-label="Clear selection" className="inline-flex size-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"><X className="size-4" /></button></div></CardHeader><CardContent className="space-y-4"><div className="flex items-baseline gap-2"><span className="text-3xl font-bold tabular-nums">{state.value}</span><span className="text-xs text-muted-foreground">of 100</span></div><Separator /><Info label="National rank" value={`#${state.rank} of ${total}`} /><Info label="Index reading" value={state.displayBand ?? state.band} /><Info label="Legal status" value={state.legalStatus ?? "No special flag"} /><p className="text-sm leading-6 text-muted-foreground">{state.summary}</p></CardContent></Card>; }
function Info({ label, value }: { label: string; value: string }) { return <div className="flex items-center justify-between gap-4 text-sm"><span className="text-muted-foreground">{label}</span><span className="text-right font-semibold">{value}</span></div>; }
