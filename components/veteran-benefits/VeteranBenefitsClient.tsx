"use client";

import { useState } from "react";
import { HeartHandshake, Home, Trophy, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import CrittersMap from "@/components/critters/CrittersMap";
import { BENEFIT_CATEGORIES, PROFILE_CONTEXT, type VeteranBenefitsState } from "@/lib/state-veteran-benefits";

const BLUE_RAMP = ["#eff6ff", "#dbeafe", "#bfdbfe", "#93c5fd", "#60a5fa", "#2563eb", "#1e3a8a"] as const;
const rampGradient = `linear-gradient(to right, ${BLUE_RAMP.join(", ")})`;

export default function VeteranBenefitsClient({ data }: { data: VeteranBenefitsState[] }) {
  const [profileId, setProfileId] = useState("overall");
  const [selected, setSelected] = useState<string | null>("TX");
  const profile = PROFILE_CONTEXT.find((item) => item.id === profileId) ?? PROFILE_CONTEXT[0];
  const selectedState = data.find((state) => state.state === selected) ?? null;

  function chooseProfile(id: string) {
    const next = PROFILE_CONTEXT.find((item) => item.id === id) ?? PROFILE_CONTEXT[0];
    setProfileId(next.id);
    setSelected(next.state);
  }

  return <div className="space-y-6">
    <Card className="border-blue-200 bg-blue-50/50">
      <CardHeader>
        <div className="flex items-center gap-2"><HeartHandshake className="size-4 text-blue-700" /><CardTitle>What best describes you?</CardTitle></div>
        <CardDescription>Pick the situation closest to yours. We’ll highlight the state that the supplied research says is the best fit for that group.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">{PROFILE_CONTEXT.map((item) => <Button key={item.id} variant={item.id === profile.id ? "default" : "outline"} size="sm" onClick={() => chooseProfile(item.id)}>{item.label}</Button>)}</div>
        <div className="grid gap-3 rounded-lg border border-blue-200 bg-background p-4 sm:grid-cols-[1fr_auto] sm:items-center"><div><p className="text-sm text-muted-foreground">Best fit in this scenario</p><p className="mt-1 text-xl font-bold text-blue-950">{profile.winner}</p><p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">{profile.note}</p></div><Badge className="justify-self-start sm:justify-self-end">Profile score: {profile.score}</Badge></div>
      </CardContent>
    </Card>

    <div className="grid gap-4 sm:grid-cols-3">
      <Metric icon={<Trophy className="size-4" />} label="Best overall" value="Texas" detail="Strongest all-around package" />
      <Metric icon={<Home className="size-4" />} label="What matters most" value="Taxes + property" detail="54 of 100 points in the model" />
      <Metric icon={<HeartHandshake className="size-4" />} label="What this is for" value="State benefits" detail="Not jobs, weather, or VA access" />
    </div>

    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader><CardTitle>Overall veteran-benefits ranking</CardTitle><CardDescription>This map always shows the all-around ranking. Your profile choice above highlights its best-fit state on the map—it does not hide or re-score the other states.</CardDescription></CardHeader>
        <CardContent className="space-y-4"><CrittersMap data={data} unit="overall benefit score" selected={selected} onSelect={setSelected} colorRamp={BLUE_RAMP} bandLabel={(state) => state.displayBand ?? state.band} /><div className="flex items-center gap-3"><span className="text-xs text-muted-foreground">Less generous</span><div className="h-2.5 flex-1 rounded-full" style={{ background: rampGradient }} /><span className="text-xs text-muted-foreground">More generous</span></div></CardContent>
      </Card>
      {selectedState ? <SelectedCard state={selectedState} profile={profile} onClear={() => setSelected(null)} /> : <TopStates data={data} onSelect={setSelected} />}
    </div>

    <Card>
      <CardHeader><CardTitle>Complete 2026 ranking</CardTitle><CardDescription>A simple overall comparison of what each state offers veterans and their families. Higher means a stronger benefits package under this study’s rubric.</CardDescription></CardHeader>
      <CardContent><div className="overflow-x-auto"><table className="w-full min-w-[520px] text-sm"><thead className="border-b text-xs text-muted-foreground"><tr><th className="px-2 py-2 text-left font-medium">Rank</th><th className="px-2 py-2 text-left font-medium">State</th><th className="px-2 py-2 text-right font-medium">Overall score</th><th className="px-2 py-2 text-left font-medium">Level</th></tr></thead><tbody>{data.map((state) => <tr key={state.state} className="border-b last:border-0 hover:bg-blue-50/60"><td className="px-2 py-2 tabular-nums">{state.rank}</td><td className="px-2 py-2 font-medium">{state.name}</td><td className="px-2 py-2 text-right font-semibold tabular-nums">{state.value}</td><td className="px-2 py-2"><Badge variant="outline">{state.displayBand}</Badge></td></tr>)}</tbody></table></div></CardContent>
    </Card>

    <Card size="sm"><CardHeader><CardTitle className="text-sm">What went into the overall score?</CardTitle><CardDescription>The ranking looks at state-created benefits—especially recurring household savings—not whether a state has better jobs, weather, hospitals, or a nearby VA.</CardDescription></CardHeader><CardContent className="grid gap-5 md:grid-cols-2"><p className="text-sm leading-6 text-muted-foreground">The biggest weight goes to military retirement/SBP tax treatment and property-tax relief for veterans rated 100% P&amp;T/TDIU. Education, vehicle, employment, recreation, cash support, and survivor benefits also count.</p><ul className="space-y-1.5 text-sm text-muted-foreground">{BENEFIT_CATEGORIES.map(([label, points]) => <li key={label} className="flex justify-between gap-3"><span>{label}</span><span className="font-medium tabular-nums text-foreground">up to {points}</span></li>)}</ul></CardContent></Card>
  </div>;
}

function Metric({ icon, label, value, detail }: { icon: React.ReactNode; label: string; value: string; detail: string }) { return <Card><CardContent className="flex flex-col gap-1"><div className="flex items-center gap-1.5 text-muted-foreground">{icon}<span className="text-xs font-medium">{label}</span></div><div className="text-xl font-bold">{value}</div><div className="text-xs text-muted-foreground">{detail}</div></CardContent></Card>; }
function TopStates({ data, onSelect }: { data: VeteranBenefitsState[]; onSelect: (state: string) => void }) { return <Card><CardHeader><CardTitle>Top 10 overall</CardTitle><CardDescription>Strongest all-around benefit packages</CardDescription></CardHeader><CardContent className="space-y-2.5">{data.slice(0, 10).map((state) => <Button key={state.state} variant="ghost" size="sm" onClick={() => onSelect(state.state)} className="flex w-full justify-start gap-3 px-1.5"><span className="w-5 text-xs font-semibold tabular-nums text-muted-foreground">{state.rank}</span><span className="w-28 shrink-0 truncate text-left text-sm font-medium">{state.name}</span><span className="ml-auto text-xs font-semibold tabular-nums">{state.value}</span></Button>)}</CardContent></Card>; }
function SelectedCard({ state, profile, onClear }: { state: VeteranBenefitsState; profile: (typeof PROFILE_CONTEXT)[number]; onClear: () => void }) { const isProfileMatch = state.state === profile.state; return <Card><CardHeader><div className="flex items-start justify-between gap-2"><div><CardTitle>{state.name}</CardTitle><CardDescription>{isProfileMatch ? "Highlighted for your selected situation" : "Selected on the overall map"}</CardDescription></div><Button variant="ghost" size="icon-sm" onClick={onClear} aria-label="Clear selection"><X className="size-4" /></Button></div></CardHeader><CardContent className="space-y-4"><div className="flex items-baseline gap-2"><span className="text-3xl font-bold tabular-nums">{state.value}</span><span className="text-xs text-muted-foreground">overall score</span></div><Separator /><div className="flex justify-between gap-3 text-sm"><span className="text-muted-foreground">Overall rank</span><span className="font-semibold">#{state.rank} of 50</span></div><div className="flex justify-between gap-3 text-sm"><span className="text-muted-foreground">Benefits level</span><span className="font-semibold">{state.displayBand}</span></div>{isProfileMatch && <p className="rounded-md bg-blue-50 p-3 text-sm leading-6 text-blue-950">For <strong>{profile.label.toLowerCase()}</strong>, the supplied research highlights {profile.winner}: {profile.note}</p>}</CardContent></Card>; }
