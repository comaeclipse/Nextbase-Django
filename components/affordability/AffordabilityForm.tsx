"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  AFFORDABILITY_DISCLAIMER,
  HEALTH_COVERAGE_OPTIONS,
  INCOME_FIELDS,
  PROFILE_OPTIONS,
  TENURE_OPTIONS,
  affordabilityVintage,
  type AffordabilityScenario,
} from "@/lib/affordability-scenario";
import type { FilingStatus } from "@/lib/income";
import type { HealthCoverage, SpendingProfile, Tenure } from "@/lib/affordability";

export default function AffordabilityForm({
  scenario,
  onChange,
}: {
  scenario: AffordabilityScenario;
  onChange: (next: AffordabilityScenario) => void;
}) {
  function set<K extends keyof AffordabilityScenario>(
    key: K,
    value: AffordabilityScenario[K]
  ) {
    onChange({ ...scenario, [key]: value });
  }

  return (
    <div className="grid gap-4">
      <section className="grid gap-2">
        <p className="text-sm font-medium">Monthly income by source</p>
        <p className="text-xs text-muted-foreground">
          A mix is better than a single number — VA disability is untaxed
          everywhere, retired pay is not.
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {INCOME_FIELDS.map((field) => (
            <div key={field.key} className="grid gap-1">
              <Label htmlFor={`aff-${field.key}`} className="text-xs">
                {field.label}
              </Label>
              <Input
                id={`aff-${field.key}`}
                inputMode="decimal"
                placeholder="0"
                value={scenario[field.key]}
                onChange={(e) => set(field.key, e.target.value)}
                aria-describedby={`aff-${field.key}-hint`}
              />
              <p
                id={`aff-${field.key}-hint`}
                className="text-[11px] text-muted-foreground"
              >
                {field.hint}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-2">
        <p className="text-sm font-medium">Household</p>
        <ToggleGroup
          value={[scenario.filing]}
          onValueChange={(values: string[]) =>
            set("filing", (values[0] as FilingStatus) ?? "single")
          }
          variant="outline"
          spacing={0}
          aria-label="Filing status"
          className="grid grid-cols-2"
        >
          <ToggleGroupItem value="single">Single</ToggleGroupItem>
          <ToggleGroupItem value="married">Married</ToggleGroupItem>
        </ToggleGroup>
        <label className="flex items-center justify-between gap-3 text-sm">
          <span>You are 65 or older</span>
          <Switch
            checked={scenario.age65Plus}
            onCheckedChange={(checked) => set("age65Plus", checked)}
          />
        </label>
        {scenario.filing === "married" ? (
          <label className="flex items-center justify-between gap-3 text-sm">
            <span>Spouse is 65 or older</span>
            <Switch
              checked={scenario.spouse65Plus}
              onCheckedChange={(checked) => set("spouse65Plus", checked)}
            />
          </label>
        ) : null}
      </section>

      <section className="grid gap-2">
        <p className="text-sm font-medium">Housing</p>
        <ToggleGroup
          value={[scenario.tenure]}
          onValueChange={(values: string[]) =>
            set("tenure", (values[0] as Tenure) ?? "own_outright")
          }
          variant="outline"
          spacing={0}
          aria-label="Housing tenure"
          className="grid grid-cols-3"
        >
          {TENURE_OPTIONS.map((option) => (
            <ToggleGroupItem key={option.id} value={option.id} className="px-2">
              {option.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <p className="text-[11px] text-muted-foreground">
          {TENURE_OPTIONS.find((o) => o.id === scenario.tenure)?.hint}
        </p>
      </section>

      <section className="grid gap-2">
        <p className="text-sm font-medium">Spending</p>
        <ToggleGroup
          value={[scenario.spendingProfile]}
          onValueChange={(values: string[]) =>
            set("spendingProfile", (values[0] as SpendingProfile) ?? "modest")
          }
          variant="outline"
          spacing={0}
          aria-label="Spending profile"
          className="grid grid-cols-2"
        >
          {PROFILE_OPTIONS.map((option) => (
            <ToggleGroupItem key={option.id} value={option.id}>
              {option.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <p className="text-[11px] text-muted-foreground">
          {PROFILE_OPTIONS.find((o) => o.id === scenario.spendingProfile)?.hint}
        </p>
      </section>

      <section className="grid gap-2">
        <p className="text-sm font-medium">Health coverage</p>
        <ToggleGroup
          value={[scenario.healthCoverage]}
          onValueChange={(values: string[]) =>
            set(
              "healthCoverage",
              (values[0] as HealthCoverage) ?? "medicare_supplement"
            )
          }
          variant="outline"
          spacing={0}
          aria-label="Health coverage"
          className="grid grid-cols-2"
        >
          {HEALTH_COVERAGE_OPTIONS.map((option) => (
            <ToggleGroupItem key={option.id} value={option.id} className="px-2">
              {option.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <p className="text-[11px] text-muted-foreground">
          {
            HEALTH_COVERAGE_OPTIONS.find((o) => o.id === scenario.healthCoverage)
              ?.hint
          }
        </p>
      </section>

      <p className="text-[11px] leading-snug text-muted-foreground">
        {AFFORDABILITY_DISCLAIMER} {affordabilityVintage()}
      </p>
    </div>
  );
}
