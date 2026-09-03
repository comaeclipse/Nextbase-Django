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
import {
  ShieldCheck,
  Landmark,
  Users,
  Info,
  RotateCcw,
  ArrowRight,
  BriefcaseBusiness,
  X as ClearIcon,
} from "lucide-react";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";

import { filterAndSort } from "@/lib/filters";
import type { LocationRow, StateInfoRow } from "@/lib/types";
import {
  BRANCH_LABELS,
  type MilitaryBranch,
  type MilitarySpecialty,
  type ProfilePickerCatalog,
} from "@/lib/career-transition-shared";
import type { SpecialtyListings } from "@/lib/career-listings-bridge";
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

const MILITARY_BRANCHES = Object.keys(BRANCH_LABELS) as MilitaryBranch[];
const MILITARY_BRANCH_ITEMS = MILITARY_BRANCHES.map((b) => ({
  value: b,
  label: BRANCH_LABELS[b],
}));

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
  pickerCatalog,
  initialListingsTeaser,
}: {
  locations: LocationRow[];
  stateInfos: StateInfoRow[];
  initialPreferences: SitePreferences | null;
  pickerCatalog: ProfilePickerCatalog;
  initialListingsTeaser: SpecialtyListings | null;
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

  // Changing branch invalidates whatever specialty code was picked under the
  // old branch, mirroring CareerTransitionClient's updateBranch.
  function updateBranch(next: MilitaryBranch | "") {
    setPrefs((prev) => ({ ...prev, militaryBranch: next, militarySpecialtyCode: "" }));
    setJustSaved(false);
  }

  const branchSpecialties = useMemo(
    () =>
      prefs.militaryBranch
        ? pickerCatalog.specialties.filter((s) => s.branch === prefs.militaryBranch)
        : [],
    [pickerCatalog.specialties, prefs.militaryBranch]
  );
  const selectedSpecialty =
    branchSpecialties.find((s) => s.code === prefs.militarySpecialtyCode) ?? null;
  const matchKey =
    prefs.militaryBranch && prefs.militarySpecialtyCode
      ? `${prefs.militaryBranch}:${prefs.militarySpecialtyCode}`
      : null;
  const resolvedMatch = matchKey ? pickerCatalog.matches[matchKey] : undefined;
  const codeNotInCatalog = Boolean(matchKey) && !resolvedMatch;
  // The teaser is server-rendered from the SAVED cookie — flag when the
  // in-progress edit has drifted from it so the preview isn't misread as live.
  const militaryEditsUnsaved =
    prefs.militaryBranch !== saved.militaryBranch ||
    prefs.militarySpecialtyCode !== saved.militarySpecialtyCode;

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

  // Save in place — this page is just the profile. We surface a prompt to go
  // see the new matches on /explore rather than yanking the visitor there.
  // refresh() re-derives the server-rendered job-listings teaser from the
  // just-saved cookie without resetting this component's local `prefs` state.
  function handleSave() {
    setPreferencesCookie(prefs);
    setJustSaved(true);
    router.refresh();
  }

  // The saved cookie is read server-side on /explore; refresh() clears the
  // client router cache so the grid reflects it immediately.
  function goToMatches() {
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
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      {/* Identity, not a filter — lives outside the two-column grid so it's
          never mistaken for something that moves the "X of Y cities" count. */}
      <Card className="mb-8 shadow-lg shadow-slate-900/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BriefcaseBusiness className="size-4 text-primary" aria-hidden="true" />
            Military background
          </CardTitle>
          <CardDescription>
            Your branch and MOS/NEC surface matching civilian skills and job leads
            below. This never filters which places you see.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-end gap-2">
            <div className="flex-1 space-y-1.5">
              <Label className="text-sm font-medium">Branch of service</Label>
              <Select
                items={MILITARY_BRANCH_ITEMS}
                value={prefs.militaryBranch || null}
                onValueChange={(v) => updateBranch((v as MilitaryBranch) ?? "")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a branch" />
                </SelectTrigger>
                <SelectContent>
                  {MILITARY_BRANCHES.map((b) => (
                    <SelectItem key={b} value={b}>
                      {BRANCH_LABELS[b]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {prefs.militaryBranch ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => updateBranch("")}
                aria-label="Clear branch"
              >
                <ClearIcon className="size-4" aria-hidden="true" />
              </Button>
            ) : null}
          </div>

          {prefs.militaryBranch ? (
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">MOS / NEC / AFSC</Label>
              <Combobox
                items={branchSpecialties}
                value={selectedSpecialty}
                onValueChange={(s: MilitarySpecialty | null) =>
                  update("militarySpecialtyCode", s ? s.code : "")
                }
                itemToStringLabel={(s: MilitarySpecialty) => `${s.code} — ${s.title}`}
                isItemEqualToValue={(a: MilitarySpecialty, b: MilitarySpecialty) =>
                  a.branch === b.branch && a.code === b.code
                }
              >
                <ComboboxInput placeholder="Search code or title" className="w-full" />
                <ComboboxContent>
                  <ComboboxEmpty>
                    No {BRANCH_LABELS[prefs.militaryBranch]}{" "}
                    specialties found — our catalog is a seed and doesn&apos;t
                    cover every code yet.
                  </ComboboxEmpty>
                  <ComboboxList>
                    {(s: MilitarySpecialty) => (
                      <ComboboxItem key={`${s.branch}:${s.code}`} value={s}>
                        <span className="font-medium">{s.code}</span>
                        <Badge variant="outline" className="ml-1">
                          {s.code_system}
                        </Badge>
                        <span className="ml-1.5 text-muted-foreground">
                          {s.title}
                        </span>
                      </ComboboxItem>
                    )}
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
            </div>
          ) : null}

          {matchKey && resolvedMatch ? (
            <div className="flex flex-col gap-2 rounded-lg border border-border p-3">
              {resolvedMatch.roleTitles.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {resolvedMatch.roleTitles.map((t) => (
                    <Badge key={t} variant="secondary" className="font-normal">
                      {t}
                    </Badge>
                  ))}
                </div>
              ) : null}
              {resolvedMatch.skillTitles.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {resolvedMatch.skillTitles.map((t) => (
                    <Badge key={t} variant="outline" className="font-normal">
                      {t}
                    </Badge>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
          {codeNotInCatalog && prefs.militaryBranch ? (
            <p className="flex items-start gap-1 text-xs text-muted-foreground/80">
              <Info className="mt-0.5 size-3 shrink-0" aria-hidden="true" />
              We don&apos;t have {BRANCH_LABELS[prefs.militaryBranch]}{" "}
              {prefs.militarySpecialtyCode} in our career-transition data yet. You
              can still save it — we&apos;ll show matches as soon as we add coverage.
            </p>
          ) : null}

          {saved.militaryBranch && saved.militarySpecialtyCode ? (
            <div className="border-t border-border pt-4">
              {militaryEditsUnsaved ? (
                <p className="mb-2 text-xs text-muted-foreground">
                  Showing openings for your last-saved{" "}
                  {BRANCH_LABELS[saved.militaryBranch]} {saved.militarySpecialtyCode}.
                  Save to update this preview.
                </p>
              ) : null}
              {initialListingsTeaser && initialListingsTeaser.listings.length > 0 ? (
                <div className="grid gap-2 sm:grid-cols-3">
                  {initialListingsTeaser.listings.map((l) => (
                    <a
                      key={l.id}
                      href={l.url}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg border p-3 text-sm hover:bg-muted/50"
                    >
                      <p className="font-medium leading-snug">{l.title}</p>
                      <p className="text-xs text-muted-foreground">{l.company}</p>
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {initialListingsTeaser?.note ??
                    "No live openings preview available for this specialty yet."}
                </p>
              )}
              <Button
                render={
                  <Link
                    href={`/career-transition?branch=${saved.militaryBranch}&code=${saved.militarySpecialtyCode}`}
                  />
                }
                nativeButton={false}
                variant="outline"
                className="mt-3 gap-2"
              >
                View full career transition &amp; live listings
                <ArrowRight className="size-4" aria-hidden="true" />
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:gap-10">
        {/* Left column: who this is for + the live consequence + actions. On
            large screens it sticks while the settings column scrolls. */}
        <div className="flex flex-col gap-6 lg:sticky lg:top-8 lg:self-start">
          <header className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">Your profile</h1>
            <p className="text-sm text-muted-foreground">
              Set the things that rule a place out. We&apos;ll apply them
              everywhere you search, so you never scroll past a state you&apos;d
              never move to.
            </p>
          </header>

          {/* Consequence first: these are removals, not preferences. */}
          <Card className="border-primary/30 bg-primary/5 shadow-none">
            <CardContent className="flex flex-col gap-3 py-4">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-semibold tabular-nums">
                  {surviving.length}
                </span>
                <span className="text-sm text-muted-foreground">
                  of {locations.length} cities · {survivingStates} of{" "}
                  {totalStates} states remain
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
            <p className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm">
              These settings rule out every city we cover. Loosen one before
              saving, or you&apos;ll land on an empty Explore page.
            </p>
          ) : null}

          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={handleSave} disabled={isEmpty} className="min-w-32">
              Save preferences
            </Button>
            <Button
              variant="ghost"
              onClick={handleReset}
              disabled={!active && !prefs.militaryBranch}
            >
              <RotateCcw className="size-4" aria-hidden="true" />
              Reset
            </Button>
          </div>

          {justSaved ? (
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
              <p className="text-sm font-medium">Profile saved.</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                We&apos;ll apply it everywhere you search.
              </p>
              <Button onClick={goToMatches} className="mt-2.5 gap-2">
                See your matches on Explore
                <ArrowRight className="size-4" aria-hidden="true" />
              </Button>
            </div>
          ) : null}

          <p className="text-xs text-muted-foreground">
            Saved in a cookie on this device for 180 days — no account needed.
            These settings change which places we show you; they don&apos;t
            change any city&apos;s Fit score.
          </p>
        </div>

        {/* Right column: the settings themselves. */}
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
      </div>
    </main>
  );
}
