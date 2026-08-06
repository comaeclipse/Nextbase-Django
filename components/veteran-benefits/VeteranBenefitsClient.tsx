"use client";

import { useMemo, useState } from "react";
import { Award, SlidersHorizontal, Trophy, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import CrittersMap from "@/components/critters/CrittersMap";
import { BENEFIT_CATEGORIES, PROFILE_CONTEXT, type VeteranBenefitsState } from "@/lib/state-veteran-benefits";

const BLUE_RAMP = ["#eff6ff", "#dbeafe", "#bfdbfe", "#93c5fd", "#60a5fa", "#2563eb", "#1e3a8a"] as const;
const rampGradient = `linear-gradient(to right, ${BLUE_RAMP.join(", ")})`;

export default function VeteranBenefitsClient({ data }: { data: VeteranBenefitsState[] }) {
  const [profileId, setProfileId] = useState<string>("overall");
  const [minimumScore, setMinimumScore] = useState([60]);
  const [selected, setSelected] = useState<string | null>(null);
  const profile = PROFILE_CONTEXT.find((item) => item.id === profileId) ?? PROFILE_CONTEXT[0];
  const visible = useMemo(() => data.filter((state) => state.value >= minimumScore[0]), [data, minimumScore]);
  const selectedState = data.find((state) => state.state === selected) ?? null;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-[1fr_290px]">
        <Card className="border-blue-200/80 bg-blue-50/45">
          <CardHeader>
            <div className="flex items-center gap-2"><SlidersHorizontal className="size-4 text-blue-700" /><CardTitle>Customize your view</CardTitle></div>
            <CardDescription>Choose a published profile context and set the minimum composite score to show on the map.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium">Veteran profile
              <Select value={profileId} onValueChange={(value) => value && setProfileId(value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PROFILE_CONTEXT.map((item) => <SelectItem key={item.id} value={item.id}>{item.label}</SelectItem>)}</SelectContent>
              </Select>
            </label>
            <div className="grid gap-2"><div className="flex justify-between text-sm font-medium"><span>Minimum composite score</span><span className="tabular-nums text-blue-700">{minimumScore[0]}+</span></div><Slider value={minimumScore} min={40} max={95} step={1} onValueChange={(value) => setMinimumScore(Array.from(typeof value === "number" ? [value] : value))} aria-label="Minimum composite score" /><p className="text-xs text-muted-foreground">{visible.length} of 50 states shown</p></div>
          </CardContent>
        </Card>
        <Card className="border-blue-200/80">
          <CardHeader><CardTitle className="text-sm">Selected profile</CardTitle></CardHeader>
          <CardContent className="space-y-2"><div className="flex items-baseline justify-between gap-2"><span className="font-semibold">{profile.winner}</span><Badge>{profile.score}</Badge></div><p className="text-xs leading-5 text-muted-foreground">{profile.note}</p></CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Metric icon={<Trophy className="size-4" />} label="Overall leader" value="Texas" detail="97 / 100" />
        <Metric icon={<Award className="size-4" />} label="Top composite tier" value="11 states" detail="Score of 80+" />
        <Metric icon={<SlidersHorizontal className="size-4" />} label="Largest categories" value="54 points" detail="Tax + P&T property relief" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Veteran benefits by state</CardTitle><CardDescription>Higher scores indicate a stronger state-created benefits package under the published August 6, 2026 rubric.</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <CrittersMap data={visible} unit="composite score" selected={selected} onSelect={setSelected} colorRamp={BLUE_RAMP} bandLabel={(state) => state.displayBand ?? state.band} />
            <div className="flex items-center gap-3"><span className="text-xs text-muted-foreground">Lower score</span><div className="h-2.5 flex-1 rounded-full" style={{ background: rampGradient }} /><span className="text-xs text-muted-foreground">Higher score</span></div>
          </CardContent>
        </Card>
        {selectedState ? <SelectedCard state={selectedState} onClear={() => setSelected(null)} /> : <TopStates data={data} onSelect={setSelected} />}
      </div>

      <Card>
        <CardHeader><CardTitle>Complete 2026 ranking</CardTitle><CardDescription>The default published composite remains intact; the controls above filter and add profile context, rather than re-score states without the underlying category workbook.</CardDescription></CardHeader>
        <CardContent><div className="overflow-x-auto"><table className="w-full min-w-[520px] text-sm"><thead className="border-b text-xs text-muted-foreground"><tr><th className="px-2 py-2 text-left font-medium">Rank</th><th className="px-2 py-2 text-left font-medium">State</th><th className="px-2 py-2 text-right font-medium">Score</th><th className="px-2 py-2 text-left font-medium">Tier</th></tr></thead><tbody>{data.map((state) => <tr key={state.state} className="border-b last:border-0 hover:bg-blue-50/60"><td className="px-2 py-2 tabular-nums">{state.rank}</td><td className="px-2 py-2 font-medium">{state.name}</td><td className="px-2 py-2 text-right font-semibold tabular-nums">{state.value}</td><td className="px-2 py-2"><Badge variant="outline">{state.displayBand}</Badge></td></tr>)}</tbody></table></div></CardContent>
      </Card>

      <Card size="sm">
        <CardHeader><CardTitle className="text-sm">Scoring model and limitations</CardTitle><CardDescription>State-created benefits only, not broader quality-of-life factors</CardDescription></CardHeader>
        <CardContent className="grid gap-5 md:grid-cols-2"><div><p className="text-sm leading-6 text-muted-foreground">The model places 54 of 100 points on military retirement/SBP tax treatment and 100% P&amp;T/TDIU property relief. Benefits lost credit when they were temporary, income-tested, local-option, narrow, capped, or only available at 100%.</p><p className="mt-3 text-xs text-muted-foreground">Rules, county filing dates, income tests, acreage limits, and non-ad-valorem assessments can change the result for an individual household.</p></div><ul className="space-y-1.5 text-sm text-muted-foreground">{BENEFIT_CATEGORIES.map(([label, points]) => <li key={label} className="flex justify-between gap-3"><span>{label}</span><span className="font-medium tabular-nums text-foreground">{points}</span></li>)}</ul></CardContent>
      </Card>
    </div>
  );
}

function Metric({ icon, label, value, detail }: { icon: React.ReactNode; label: string; value: string; detail: string }) { return <Card><CardContent className="flex flex-col gap-1"><div className="flex items-center gap-1.5 text-muted-foreground">{icon}<span className="text-xs font-medium">{label}</span></div><div className="text-xl font-bold">{value}</div><div className="text-xs text-muted-foreground">{detail}</div></CardContent></Card>; }
function TopStates({ data, onSelect }: { data: VeteranBenefitsState[]; onSelect: (state: string) => void }) { return <Card><CardHeader><CardTitle>Top 10 states</CardTitle><CardDescription>Published composite scores</CardDescription></CardHeader><CardContent className="space-y-2.5">{data.slice(0, 10).map((state) => <button key={state.state} onClick={() => onSelect(state.state)} className="flex w-full items-center gap-3 rounded-md px-1.5 py-1 text-left hover:bg-blue-50"><span className="w-5 text-xs font-semibold tabular-nums text-muted-foreground">{state.rank}</span><span className="w-28 shrink-0 truncate text-sm font-medium">{state.name}</span><div className="h-1.5 flex-1 rounded-full bg-muted"><div className="h-full rounded-full bg-blue-600" style={{ width: `${state.value}%` }} /></div><span className="w-8 text-right text-xs font-semibold tabular-nums">{state.value}</span></button>)}</CardContent></Card>; }
function SelectedCard({ state, onClear }: { state: VeteranBenefitsState; onClear: () => void }) { return <Card><CardHeader><div className="flex items-start justify-between gap-2"><div><CardTitle>{state.name}</CardTitle><CardDescription>Pinned state · {state.state}</CardDescription></div><button onClick={onClear} aria-label="Clear selection" className="inline-flex size-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"><X className="size-4" /></button></div></CardHeader><CardContent className="space-y-4"><div className="flex items-baseline gap-2"><span className="text-3xl font-bold tabular-nums">{state.value}</span><span className="text-xs text-muted-foreground">of 100</span></div><Separator /><div className="flex justify-between gap-3 text-sm"><span className="text-muted-foreground">National rank</span><span className="font-semibold">#{state.rank} of 50</span></div><div className="flex justify-between gap-3 text-sm"><span className="text-muted-foreground">Composite tier</span><span className="font-semibold">{state.displayBand}</span></div></CardContent></Card>; }
