"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import CrittersMap from "@/components/critters/CrittersMap";
import { BENEFIT_CATEGORIES, BENEFIT_STATUSES, type BenefitPick, type BenefitStatus, type VeteranBenefitsState } from "@/lib/state-veteran-benefits";

const BLUE_RAMP = ["#eff6ff", "#dbeafe", "#bfdbfe", "#93c5fd", "#60a5fa", "#2563eb", "#1e3a8a"] as const;
const rampGradient = `linear-gradient(to right, ${BLUE_RAMP.join(", ")})`;

export default function VeteranBenefitsClient({ data }: { data: VeteranBenefitsState[] }) {
  const [statusId, setStatusId] = useState(BENEFIT_STATUSES[0].id);
  const [pickId, setPickId] = useState(BENEFIT_STATUSES[0].picks[0].id);
  const [selected, setSelected] = useState<string | null>(BENEFIT_STATUSES[0].picks[0].states[0]);

  const status = BENEFIT_STATUSES.find((item) => item.id === statusId) ?? BENEFIT_STATUSES[0];
  const pick = status.picks.find((item) => item.id === pickId) ?? status.picks[0];
  const selectedState = data.find((state) => state.state === selected) ?? null;

  function choose(next: BenefitStatus, nextPick: BenefitPick) {
    setStatusId(next.id);
    setPickId(nextPick.id);
    setSelected(nextPick.states[0]);
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Where do you stand?</CardTitle>
          <CardDescription>State benefits key off your status, not your ZIP code. Each one adds a different lever.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ToggleGroup
            value={[status.id]}
            onValueChange={(values) => {
              const next = BENEFIT_STATUSES.find((item) => item.id === values[0]);
              if (next) choose(next, next.picks[0]);
            }}
            variant="outline"
            spacing={0}
            aria-label="Veteran status"
            className="grid w-full grid-cols-2 sm:grid-cols-4"
          >
            {BENEFIT_STATUSES.map((item) => (
              <ToggleGroupItem key={item.id} value={item.id} className="h-9 aria-pressed:bg-blue-600 aria-pressed:text-white">
                {item.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <p className="text-sm text-muted-foreground">{status.who}</p>
            {status.picks.length > 1 && (
              <ToggleGroup
                value={[pick.id]}
                onValueChange={(values) => {
                  const next = status.picks.find((item) => item.id === values[0]);
                  if (next) choose(status, next);
                }}
                variant="outline"
                size="sm"
                spacing={0}
                aria-label={`${status.label} detail`}
              >
                {status.picks.map((item) => (
                  <ToggleGroupItem key={item.id} value={item.id}>{item.label}</ToggleGroupItem>
                ))}
              </ToggleGroup>
            )}
          </div>

          <div className="grid overflow-hidden rounded-lg ring-1 ring-foreground/10 sm:grid-cols-2">
            <div className="border-b p-4 sm:border-r sm:border-b-0">
              <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">What this status changes</p>
              <p className="mt-2 text-sm leading-6">{status.lever}</p>
            </div>
            <div className="bg-blue-50/60 p-4">
              <p className="text-xs font-semibold tracking-wide text-blue-700 uppercase">Best fit</p>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-xl font-bold text-blue-950">{pick.winner}</span>
                <span className="text-xs text-muted-foreground tabular-nums">{pick.score} / 100</span>
              </div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{pick.note}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Overall 2026 ranking</CardTitle>
            <CardDescription className="flex items-center gap-1.5">
              <span className="inline-block size-2.5 shrink-0 rounded-full ring-2 ring-amber-500" aria-hidden />
              Ringed: best fit for a {status.label.toLowerCase()}. Click any state for its detail.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <CrittersMap
              data={data}
              unit="overall benefit score"
              selected={selected}
              onSelect={setSelected}
              colorRamp={BLUE_RAMP}
              highlighted={pick.states}
              bandLabel={(state) => state.displayBand ?? state.band}
            />
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">Less generous</span>
              <div className="h-2.5 flex-1 rounded-full" style={{ background: rampGradient }} />
              <span className="text-xs text-muted-foreground">More generous</span>
            </div>
          </CardContent>
        </Card>
        {selectedState ? (
          <SelectedCard state={selectedState} pick={pick} status={status} onClear={() => setSelected(null)} />
        ) : (
          <TopStates data={data} onSelect={setSelected} />
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Complete ranking</CardTitle>
          <CardDescription>The all-around comparison, unchanged by the status you picked above.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-h-96 overflow-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead className="sticky top-0 bg-card text-xs text-muted-foreground">
                <tr className="border-b">
                  <th className="px-2 py-2 text-left font-medium">Rank</th>
                  <th className="px-2 py-2 text-left font-medium">State</th>
                  <th className="px-2 py-2 text-right font-medium">Overall score</th>
                  <th className="px-2 py-2 text-left font-medium">Level</th>
                </tr>
              </thead>
              <tbody>
                {data.map((state) => (
                  <tr
                    key={state.state}
                    onClick={() => setSelected(state.state)}
                    className={`cursor-pointer border-b last:border-0 hover:bg-blue-50/60 ${state.state === selected ? "bg-blue-50" : ""}`}
                  >
                    <td className="px-2 py-2 tabular-nums">{state.rank}</td>
                    <td className="px-2 py-2 font-medium">{state.name}</td>
                    <td className="px-2 py-2 text-right font-semibold tabular-nums">{state.value}</td>
                    <td className="px-2 py-2"><Badge variant="outline">{state.displayBand}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card size="sm">
        <CardContent>
          <Accordion>
            <AccordionItem value="scope">
              <AccordionTrigger>What this ranking does and does not measure</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                It scores benefits a state creates for veterans — above all the recurring household savings. It says nothing about jobs, weather, hospitals, or how close the nearest VA facility is. Use the city pages for those.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="weights">
              <AccordionTrigger>How the overall score is built</AccordionTrigger>
              <AccordionContent>
                <p className="text-muted-foreground">Taxes and property relief carry 54 of the 100 points, which is why retirees and 100% P&amp;T veterans see the sharpest differences between states.</p>
                <ul className="mt-4 grid gap-1.5 text-sm text-muted-foreground sm:grid-cols-2">
                  {BENEFIT_CATEGORIES.map(([label, points]) => (
                    <li key={label} className="flex justify-between gap-3 border-b border-dashed pb-1.5">
                      <span>{label}</span>
                      <span className="font-medium tabular-nums text-foreground">{points}</span>
                    </li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}

function TopStates({ data, onSelect }: { data: VeteranBenefitsState[]; onSelect: (state: string) => void }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top 10 overall</CardTitle>
        <CardDescription>Strongest all-around benefit packages</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2.5">
        {data.slice(0, 10).map((state) => (
          <Button key={state.state} variant="ghost" size="sm" onClick={() => onSelect(state.state)} className="flex w-full justify-start gap-3 px-1.5">
            <span className="w-5 text-xs font-semibold tabular-nums text-muted-foreground">{state.rank}</span>
            <span className="w-28 shrink-0 truncate text-left text-sm font-medium">{state.name}</span>
            <span className="ml-auto text-xs font-semibold tabular-nums">{state.value}</span>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}

function SelectedCard({
  state,
  pick,
  status,
  onClear,
}: {
  state: VeteranBenefitsState;
  pick: BenefitPick;
  status: BenefitStatus;
  onClear: () => void;
}) {
  const isBestFit = state.state === pick.states[0];
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle>{state.name}</CardTitle>
            <CardDescription>{isBestFit ? `Best fit for a ${status.label.toLowerCase()}` : "Selected on the map"}</CardDescription>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={onClear} aria-label="Clear selection">
            <X className="size-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold tabular-nums">{state.value}</span>
          <span className="text-xs text-muted-foreground">overall score</span>
        </div>
        <Separator />
        <div className="flex justify-between gap-3 text-sm">
          <span className="text-muted-foreground">Overall rank</span>
          <span className="font-semibold">#{state.rank} of 50</span>
        </div>
        <div className="flex justify-between gap-3 text-sm">
          <span className="text-muted-foreground">Benefits level</span>
          <span className="font-semibold">{state.displayBand}</span>
        </div>
        {isBestFit && <p className="rounded-md bg-blue-50 p-3 text-sm leading-6 text-blue-950">{pick.note}</p>}
      </CardContent>
    </Card>
  );
}
