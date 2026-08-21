"use client";

/*
 * The /profile preference sheet.
 *
 * Every control here is a hard filter, so the page leads with the consequence:
 * a live count of how many cities and states survive. An over-constrained
 * profile should be obvious *before* saving, not after landing on an empty
 * Explore grid.
 *
 * Layout and primitives follow components/quiz2/Quiz2Client.tsx — Card sections,
 * bordered Switch rows, a Slider for the threshold — so this reads as part of
 * the same site rather than a new dialect.
 */
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, Landmark, Users, Info, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import { filterAndSort } from "@/lib/filters";
import type { LocationRow, StateInfoRow } from "@/lib/types";
import {
  DEFAULT_PREFERENCES,
  GUN_FREEDOM_ANY,
  GUN_FREEDOM_STEP,
  PREFERENCE_FACETS,
  PREFERENCE_GROUPS,
  UNSETTLED_GUN_LAW_STATES,
  clearPreferencesCookie,
  describePreferences,
  hasActivePreferences,
  preferencesToFilterParams,
  setPreferencesCookie,
  type PreferenceGroup,
  type SitePreferences,
} from "@/lib/profile";

const GROUP_ICONS: Record<PreferenceGroup, typeof ShieldCheck> = {
  firearms: ShieldCheck,
  taxes: Landmark,
  community: Users,
};

/** The shadcn Slider reports every thumb; this one has a single thumb. */
function firstValue(value: number | readonly number[]): number {
  return typeof value === "number" ? value : (value[0] ?? 0);
}

export default function ProfileClient({
  locations,
  stateInfos,
  initialPreferences,
}: {
  locations: LocationRow[];
  stateInfos: StateInfoRow[];
  initialPreferences: SitePreferences | null;
}) {
  const router = useRouter();
  const saved = initialPreferences ?? DEFAULT_PREFERENCES;
  const [prefs, setPrefs] = useState<SitePreferences>(saved);
  const [justSaved, setJustSaved] = useState(false);

  function update<K extends keyof SitePreferences>(
    key: K,
    value: SitePreferences[K]
  ) {
    setPrefs((prev) => ({ ...prev, [key]: value }));
    setJustSaved(false);
  }

  // Same filterAndSort the rest of the site runs, so the count on this page and
  // the grid on /explore can never disagree.
  const surviving = useMemo(
    () => filterAndSort(locations, stateInfos, preferencesToFilterParams(prefs)),
    [locations, stateInfos, prefs]
  );

  const totalStates = useMemo(
    () => new Set(locations.map((l) => l.state)).size,
    [locations]
  );
  const survivingStates = useMemo(
    () => new Set(surviving.map((l) => l.state)).size,
    [surviving]
  );

  const active = hasActivePreferences(prefs);
  const chips = describePreferences(prefs);
  const isEmpty = active && surviving.length === 0;

  function handleSave() {
    setPreferencesCookie(prefs);
    setJustSaved(true);
    router.push("/explore");
    router.refresh();
  }

  function handleReset() {
    clearPreferencesCookie();
    setPrefs(DEFAULT_PREFERENCES);
    setJustSaved(false);
    router.refresh();
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <header className="mb-6 space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Your profile</h1>
        <p className="text-sm text-muted-foreground">
          Set the things that rule a place out. We&apos;ll apply them everywhere
          you search, so you never scroll past a state you&apos;d never move to.
        </p>
      </header>

      {/* Consequence first: these are removals, not preferences. */}
      <Card className="mb-6 border-primary/30 bg-primary/5 shadow-none">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-semibold tabular-nums">
              {surviving.length}
            </span>
            <span className="text-sm text-muted-foreground">
              of {locations.length} cities · {survivingStates} of {totalStates}{" "}
              states remain
            </span>
          </div>
          {chips.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {chips.map((c) => (
                <Badge key={c} variant="secondary" className="font-normal">
                  {c}
                </Badge>
              ))}
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">
              Nothing set — every city is in play.
            </span>
          )}
        </CardContent>
      </Card>

      {isEmpty ? (
        <p className="mb-6 rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm">
          These settings rule out every city we cover. Loosen one before saving,
          or you&apos;ll land on an empty Explore page.
        </p>
      ) : null}

      <div className="flex flex-col gap-6">
        {PREFERENCE_GROUPS.map((group) => {
          const facets = PREFERENCE_FACETS.filter((f) => f.group === group.id);
          const Icon = GROUP_ICONS[group.id];
          return (
            <Card key={group.id} className="shadow-lg shadow-slate-900/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Icon className="size-4 text-primary" aria-hidden="true" />
                  {group.title}
                </CardTitle>
                <CardDescription>{group.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {facets.map((facet) => (
                  <label
                    key={facet.key}
                    className="flex items-start justify-between gap-4 rounded-lg border border-border p-3"
                  >
                    <span className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium">{facet.label}</span>
                      <span className="text-xs text-muted-foreground">
                        {facet.hint}
                      </span>
                      {facet.caveat ? (
                        <span className="mt-1 flex items-start gap-1 text-xs text-muted-foreground/80">
                          <Info
                            className="mt-0.5 size-3 shrink-0"
                            aria-hidden="true"
                          />
                          {facet.caveat}
                        </span>
                      ) : null}
                    </span>
                    <Switch
                      checked={prefs[facet.key]}
                      onCheckedChange={(checked) => update(facet.key, checked)}
                    />
                  </label>
                ))}

                {/* The index floor lives with the firearm toggles it refines. */}
                {group.id === "firearms" ? (
                  <div className="flex flex-col gap-3 rounded-lg border border-border p-3">
                    <div className="flex items-baseline justify-between">
                      <Label className="text-sm font-medium">
                        Minimum Gun Freedom Index
                      </Label>
                      <span className="text-sm font-semibold tabular-nums">
                        {prefs.gunFreedomMin > GUN_FREEDOM_ANY
                          ? prefs.gunFreedomMin
                          : "No minimum"}
                      </span>
                    </div>
                    <Slider
                      aria-label="Minimum Gun Freedom Index"
                      value={[prefs.gunFreedomMin]}
                      onValueChange={(v) =>
                        update("gunFreedomMin", firstValue(v))
                      }
                      min={GUN_FREEDOM_ANY}
                      max={100}
                      step={GUN_FREEDOM_STEP}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>No minimum</span>
                      <span>100 — least restrictive</span>
                    </div>
                    <p className="flex items-start gap-1 text-xs text-muted-foreground/80">
                      <Info
                        className="mt-0.5 size-3 shrink-0"
                        aria-hidden="true"
                      />
                      A single 0–100 rubric covering bans, carry, purchase and
                      licensing. {UNSETTLED_GUN_LAW_STATES.join(" and ")} are
                      legally unsettled — their bans are enjoined or in
                      litigation, so their scores may move.{" "}
                      <Link href="/gun-freedom" className="underline">
                        See the full index
                      </Link>
                      .
                    </p>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Separator className="my-6" />

      <div className="flex flex-wrap items-center gap-3 pb-4">
        <Button onClick={handleSave} disabled={isEmpty} className="min-w-32">
          Save preferences
        </Button>
        <Button variant="ghost" onClick={handleReset} disabled={!active}>
          <RotateCcw className="size-4" aria-hidden="true" />
          Reset
        </Button>
        {justSaved ? (
          <span className="text-sm text-muted-foreground">Saved.</span>
        ) : null}
      </div>

      <p className="pb-8 text-xs text-muted-foreground">
        Saved in a cookie on this device for 180 days — no account needed. These
        settings change which places we show you; they don&apos;t change any
        city&apos;s Fit score.
      </p>
    </main>
  );
}
