"use client";

import { useMemo, useState } from "react";
import {
  Check,
  Copy,
  Crosshair,
  HeartHandshake,
  House,
  RotateCcw,
  ShieldCheck,
  SlidersHorizontal,
  Snowflake,
  Stethoscope,
  Wallet,
} from "lucide-react";
import type { LocationRow, StateInfoRow } from "@/lib/types";
import { filterAndSort } from "@/lib/filters";
import { calculatePersonalizedScore } from "@/lib/scoring";
import {
  ACTIVITY_OPTIONS,
  CLIMATE_OPTIONS,
  DEFAULT_QUIZ2_PROFILE,
  LIFESTYLE_OPTIONS,
  PRESETS,
  PRICE_ANY,
  PRICE_MIN,
  PRICE_STEP,
  SNOW_OPTIONS,
  WEIGHT_FACTORS,
  formatPriceCeiling,
  profileToFilterParams,
  profileToWeights,
  weightShares,
  type Quiz2Profile,
  type WeightKey,
} from "@/lib/quiz2";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import MatchPreview from "./MatchPreview";
import WeightMixBar from "./WeightMixBar";

const PREVIEW_COUNT = 6;

const FACTOR_ICONS: Record<WeightKey, React.ComponentType<{ className?: string }>> = {
  va: Stethoscope,
  costOfLiving: Wallet,
  homeValue: House,
  safety: ShieldCheck,
  lgbtq: HeartHandshake,
  gunRights: Crosshair,
};

/**
 * Sliders are passed a single-element array: the shadcn wrapper derives its
 * thumb count from the value, and a bare number makes it fall back to two
 * thumbs at [min, max]. The change handler mirrors that array back.
 */
function firstValue(value: number | readonly number[]): number {
  return Array.isArray(value) ? value[0] : (value as number);
}

/** How strongly a slider position reads in plain language. */
function weightLabel(value: number): string {
  if (value === 0) return "Ignore";
  if (value < 30) return "Minor";
  if (value < 60) return "Moderate";
  if (value < 85) return "Strong";
  return "Critical";
}

export default function Quiz2Client({
  locations,
  stateInfos,
}: {
  locations: LocationRow[];
  stateInfos: StateInfoRow[];
}) {
  const [profile, setProfile] = useState<Quiz2Profile>(DEFAULT_QUIZ2_PROFILE);
  const [copied, setCopied] = useState(false);

  const stateInfoByAbbr = useMemo(() => {
    const map: Record<string, StateInfoRow> = {};
    for (const s of stateInfos) map[s.state] = s;
    return map;
  }, [stateInfos]);

  // Re-scores and re-filters the full list on every control change. This is the
  // whole point of the demo, so it runs synchronously rather than behind a
  // "See results" button.
  const results = useMemo(() => {
    const weights = profileToWeights(profile);
    return filterAndSort(locations, stateInfos, profileToFilterParams(profile), {
      scoreFn: (loc) =>
        calculatePersonalizedScore(loc, stateInfoByAbbr[loc.state], weights),
    });
  }, [profile, locations, stateInfos, stateInfoByAbbr]);

  const shares = useMemo(() => weightShares(profile), [profile]);

  const activeFilters = useMemo(() => {
    const labels: string[] = [];
    for (const value of profile.climate) {
      const opt = CLIMATE_OPTIONS.find((o) => o.value === value);
      if (opt) labels.push(`${opt.emoji} ${opt.label}`);
    }
    const lifestyle = LIFESTYLE_OPTIONS.find((o) => o.value === profile.lifestyle);
    if (lifestyle) labels.push(lifestyle.label);
    for (const value of profile.activities) {
      const opt = ACTIVITY_OPTIONS.find((o) => o.value === value);
      if (opt) labels.push(`${opt.emoji} ${opt.label}`);
    }
    const snow = SNOW_OPTIONS.find((o) => o.value === profile.snow);
    if (snow) labels.push(`Snow: ${snow.label}`);
    if (profile.priceIsHardFilter && profile.priceMax < PRICE_ANY) {
      labels.push(`Under $${profile.priceMax}k`);
    }
    if (profile.noAssaultWeaponsBan) labels.push("No assault weapons ban");
    if (profile.noHighCapMagBan) labels.push("No mag capacity limit");
    if (profile.lgbtqFriendlyOnly) labels.push("LGBTQ+ friendly only");
    return labels;
  }, [profile]);

  function update<K extends keyof Quiz2Profile>(key: K, value: Quiz2Profile[K]) {
    setProfile((prev) => ({ ...prev, [key]: value }));
  }

  function updateWeight(key: WeightKey, value: number) {
    setProfile((prev) => ({
      ...prev,
      weights: { ...prev.weights, [key]: value },
    }));
  }

  async function copyProfile() {
    await navigator.clipboard.writeText(JSON.stringify(profile, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="quiz2-grid">
      <div className="flex flex-col gap-5">
        {/* Presets */}
        <Card className="shadow-lg shadow-slate-900/5">
          <CardHeader>
            <CardTitle className="text-base">Start from a preset</CardTitle>
            <CardDescription>
              Or skip straight to the sliders — nothing here is locked in.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {PRESETS.map((preset) => (
              <Button
                key={preset.id}
                variant="outline"
                onClick={() => setProfile(preset.profile)}
                className="h-auto flex-col items-start gap-1 px-3 py-2.5 text-left whitespace-normal"
              >
                <span className="text-sm font-semibold">
                  <span aria-hidden="true">{preset.emoji}</span> {preset.label}
                </span>
                <span className="text-xs font-normal text-muted-foreground">
                  {preset.blurb}
                </span>
              </Button>
            ))}
          </CardContent>
        </Card>

        {/* Weight sliders — the core of the demo. */}
        <Card className="shadow-lg shadow-slate-900/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <SlidersHorizontal className="size-4 text-primary" aria-hidden="true" />
              What matters most
            </CardTitle>
            <CardDescription>
              These weights decide the Fit score. They reorder your matches without
              ever removing a location.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            {WEIGHT_FACTORS.map((factor) => {
              const Icon = FACTOR_ICONS[factor.key];
              const value = profile.weights[factor.key];
              return (
                <div key={factor.key} className="flex flex-col gap-2.5">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="flex items-center gap-2 text-sm font-medium">
                      <Icon className="size-4 text-muted-foreground" />
                      {factor.label}
                    </span>
                    <Badge variant="outline" className="tabular-nums">
                      {weightLabel(value)} · {value}
                    </Badge>
                  </div>
                  <div
                    className="quiz2-slider"
                    style={{ "--accent-color": factor.color } as React.CSSProperties}
                  >
                    <Slider
                      aria-label={factor.label}
                      value={[value]}
                      onValueChange={(v) => updateWeight(factor.key, firstValue(v))}
                      min={0}
                      max={100}
                      step={5}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">{factor.hint}</p>
                </div>
              );
            })}

            <Separator />

            <div className="flex flex-col gap-2">
              <Label className="text-sm">Your score recipe</Label>
              <WeightMixBar shares={shares} />
            </div>
          </CardContent>
        </Card>

        {/* Place & climate */}
        <Card className="shadow-lg shadow-slate-900/5">
          <CardHeader>
            <CardTitle className="text-base">Where you&apos;d like to land</CardTitle>
            <CardDescription>
              Unlike the sliders, these are hard filters — a place has to qualify.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <div className="flex flex-col gap-2.5">
              <Label className="text-sm">Climate — pick any that appeal</Label>
              <ToggleGroup
                multiple
                variant="outline"
                aria-label="Climate"
                value={profile.climate}
                onValueChange={(v) => update("climate", v)}
                className="flex-wrap"
              >
                {CLIMATE_OPTIONS.map((opt) => (
                  <ToggleGroupItem key={opt.value} value={opt.value}>
                    <span aria-hidden="true">{opt.emoji}</span> {opt.label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>

            <div className="flex flex-col gap-2.5">
              <Label className="text-sm">Pace of life</Label>
              <ToggleGroup
                variant="outline"
                aria-label="Pace of life"
                value={profile.lifestyle ? [profile.lifestyle] : []}
                onValueChange={(v) => update("lifestyle", v[0] ?? "")}
                className="flex-wrap"
              >
                {LIFESTYLE_OPTIONS.map((opt) => (
                  <ToggleGroupItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
              <p className="text-xs text-muted-foreground">
                Leave unselected to stay open to any setting.
              </p>
            </div>

            <div className="flex flex-col gap-2.5">
              <Label className="flex items-center gap-2 text-sm">
                <Snowflake className="size-4 text-muted-foreground" aria-hidden="true" />
                How much snow can you live with?
              </Label>
              <ToggleGroup
                variant="outline"
                aria-label="Snow tolerance"
                value={profile.snow ? [profile.snow] : []}
                onValueChange={(v) => update("snow", v[0] ?? "")}
                className="flex-wrap"
              >
                {SNOW_OPTIONS.map((opt) => (
                  <ToggleGroupItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>

            <div className="flex flex-col gap-2.5">
              <Label className="text-sm">Weekend plans</Label>
              <ToggleGroup
                multiple
                variant="outline"
                aria-label="Activities"
                value={profile.activities}
                onValueChange={(v) => update("activities", v)}
                className="flex-wrap"
              >
                {ACTIVITY_OPTIONS.map((opt) => (
                  <ToggleGroupItem key={opt.value} value={opt.value}>
                    <span aria-hidden="true">{opt.emoji}</span> {opt.label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
          </CardContent>
        </Card>

        {/* Budget */}
        <Card className="shadow-lg shadow-slate-900/5">
          <CardHeader>
            <CardTitle className="text-base">Home budget</CardTitle>
            <CardDescription>
              Home affordability already sways your score. Flip the switch to make
              this a hard ceiling instead.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <div className="flex flex-col gap-3">
              <div className="flex items-baseline justify-between">
                <Label className="text-sm">Price ceiling</Label>
                <span className="text-lg font-semibold tabular-nums">
                  {formatPriceCeiling(profile.priceMax)}
                </span>
              </div>
              <Slider
                aria-label="Home price ceiling"
                value={[profile.priceMax]}
                onValueChange={(v) => update("priceMax", firstValue(v))}
                min={PRICE_MIN}
                max={PRICE_ANY}
                step={PRICE_STEP}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>${PRICE_MIN}k</span>
                <span>No limit</span>
              </div>
            </div>

            <label className="flex items-center justify-between gap-4 rounded-lg border border-border p-3">
              <span className="flex flex-col gap-0.5">
                <span className="text-sm font-medium">
                  Hide places above my ceiling
                </span>
                <span className="text-xs text-muted-foreground">
                  {profile.priceIsHardFilter
                    ? "Pricier locations are filtered out entirely."
                    : "Pricier locations still appear, just ranked lower."}
                </span>
              </span>
              <Switch
                checked={profile.priceIsHardFilter}
                onCheckedChange={(checked) => update("priceIsHardFilter", checked)}
                disabled={profile.priceMax >= PRICE_ANY}
              />
            </label>
          </CardContent>
        </Card>

        {/* Deal-breakers */}
        <Card className="shadow-lg shadow-slate-900/5">
          <CardHeader>
            <CardTitle className="text-base">Deal-breakers</CardTitle>
            <CardDescription>
              Each switch removes locations outright. Use them sparingly.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {[
              {
                key: "noAssaultWeaponsBan" as const,
                title: "Exclude states with an assault weapons ban",
              },
              {
                key: "noHighCapMagBan" as const,
                title: "Exclude states with magazine capacity limits",
              },
              {
                key: "lgbtqFriendlyOnly" as const,
                title: "Only highly LGBTQ+ friendly locations",
              },
            ].map((item) => (
              <label
                key={item.key}
                className="flex items-center justify-between gap-4 rounded-lg border border-border p-3"
              >
                <span className="text-sm font-medium">{item.title}</span>
                <Switch
                  checked={profile[item.key]}
                  onCheckedChange={(checked) => update(item.key, checked)}
                />
              </label>
            ))}
          </CardContent>
        </Card>

        <div className="flex flex-wrap items-center gap-2 pb-2">
          <Button variant="outline" onClick={() => setProfile(DEFAULT_QUIZ2_PROFILE)}>
            <RotateCcw aria-hidden="true" />
            Reset profile
          </Button>
          <Button variant="ghost" onClick={copyProfile}>
            {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
            {copied ? "Copied" : "Copy profile JSON"}
          </Button>
        </div>
      </div>

      <div className="quiz2-preview">
        <MatchPreview
          matches={results.slice(0, PREVIEW_COUNT)}
          totalResults={results.length}
          activeFilters={activeFilters}
        />
      </div>
    </div>
  );
}
