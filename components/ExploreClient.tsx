"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { DefenseEmployerRow, Location, StateInfoRow } from "@/lib/types";
import type { EmployerIndex } from "@/lib/defense";
import type { MilitaryProximityIndex } from "@/lib/military";
import { filterAndSort, type FilterParams } from "@/lib/filters";
import {
  applyPreferenceFloor,
  describePreferences,
  hasActivePreferences,
  type SitePreferences,
} from "@/lib/profile";
import ExploreFilterBar, {
  DEFAULT_FILTERS,
  type ChipKey,
  type ExploreFilters,
} from "@/components/explore/ExploreFilterBar";
import LocationCard from "./LocationCard";
import StateMap from "./StateMap";
import {
  quickCheck,
  rankByBudget,
  rankByHeadroom,
  type Affordability,
  type LocationBudget,
  type QuickCheck,
} from "@/lib/affordability";
import { resolveCostConstants } from "@/lib/cost-constants";
import { resolveTaxConstants } from "@/lib/tax-constants";
import {
  DEFAULT_AFFORDABILITY_SCENARIO,
  cushionShare,
  parseMonthlyAmount,
  scenarioAnnotationActive,
  scenarioEstimateOptions,
  scenarioSources,
  type AffordabilityScenario,
} from "@/lib/affordability-scenario";

/** Per-city quick-check annotation: the priced estimate plus its verdict. */
export type QuickAnnotation = {
  affordability: Affordability;
  /** Null when the city could not be priced — "not enough data", never "no". */
  check: QuickCheck | null;
};

export default function ExploreClient({
  initialLocations,
  stateInfos,
  stateCounts,
  initialStateFilter = null,
  employers,
  employerIndex,
  militaryIndex = {},
  preferences = null,
}: {
  initialLocations: Location[];
  stateInfos: StateInfoRow[];
  stateCounts: Record<string, number>;
  initialStateFilter?: string | null;
  employers: DefenseEmployerRow[];
  employerIndex: EmployerIndex;
  militaryIndex?: MilitaryProximityIndex;
  /** Saved dealbreakers from /profile, applied as a floor under the filter bar. */
  preferences?: SitePreferences | null;
}) {
  const [filters, setFilters] = useState<ExploreFilters>({
    ...DEFAULT_FILTERS,
    state: initialStateFilter ?? "",
  });
  const [scenario, setScenario] = useState<AffordabilityScenario>(
    DEFAULT_AFFORDABILITY_SCENARIO
  );

  function update<K extends keyof ExploreFilters>(
    key: K,
    value: ExploreFilters[K]
  ) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  function resetAll() {
    setFilters(DEFAULT_FILTERS);
    setScenario(DEFAULT_AFFORDABILITY_SCENARIO);
  }

  function updateScenario(next: AffordabilityScenario) {
    const wasActive = scenarioAnnotationActive(scenario);
    const nowActive = scenarioAnnotationActive(next);
    setScenario(next);
    if (!wasActive && nowActive) {
      setFilters((current) => ({ ...current, sort: "headroom_desc" }));
    }
    if (wasActive && !nowActive && filters.sort === "headroom_desc") {
      setFilters((current) => ({ ...current, sort: "best" }));
    }
  }

  function clearScenario() {
    setScenario(DEFAULT_AFFORDABILITY_SCENARIO);
    if (filters.sort === "headroom_desc") {
      setFilters((current) => ({ ...current, sort: "best" }));
    }
  }

  /** Chips are grouped, so clearing one clears every field behind it. */
  function clearFilter(key: ChipKey) {
    setFilters((current) => {
      switch (key) {
        case "state":
          return { ...current, state: "" };
        case "budget":
          return { ...current, cost: "", priceMin: "", priceMax: "" };
        case "climate":
          return { ...current, climate: [] };
        case "lifestyle":
          return { ...current, lifestyle: [] };
        case "geography":
          return { ...current, geography: [] };
        case "more":
          return {
            ...current,
            vibes: [],
            employers: [],
            defenseEcosystem: false,
            healthcare: [],
            activities: [],
            snow: "",
            incomeTax: "",
            noStateIncomeTax: false,
            retiredPayUntaxed: false,
            hasWalmart: false,
            hasCostco: false,
            lgbtq: false,
            noAwb: false,
            noHcm: false,
            baseMaxDistance: "",
            baseBranches: [],
          };
      }
    });
  }

  const employerGroups = useMemo(() => {
    const cityCount = new Map<string, number>();
    for (const presences of Object.values(employerIndex)) {
      for (const presence of presences) {
        if (presence.total > 0) {
          cityCount.set(presence.slug, (cityCount.get(presence.slug) ?? 0) + 1);
        }
      }
    }
    const groups = new Map<
      string,
      { employer: DefenseEmployerRow; cities: number }[]
    >();
    for (const employer of employers) {
      const cities = cityCount.get(employer.slug);
      if (!cities) continue;
      if (!groups.has(employer.parent_company)) {
        groups.set(employer.parent_company, []);
      }
      groups.get(employer.parent_company)!.push({ employer, cities });
    }
    return [...groups.entries()];
  }, [employers, employerIndex]);

  const filterParams = useMemo<FilterParams>(() => {
    // Price inputs are free text elsewhere in the app, so scrape digits.
    const pmin = filters.priceMin.match(/\d+/);
    const pmax = filters.priceMax.match(/\d+/);
    const sessionParams: FilterParams = {
      snow: filters.snow || null,
      no_awb: filters.noAwb ? "true" : null,
      no_hcm: filters.noHcm ? "true" : null,
      state_filter: filters.state || null,
      lgbtq_friendly: filters.lgbtq ? "true" : null,
      climate: filters.climate.join(",") || null,
      cost_of_living: filters.cost || null,
      price_min: pmin?.[0] || null,
      price_max: pmax?.[0] || null,
      lifestyle: filters.lifestyle.join(",") || null,
      healthcare:
        filters.healthcare
          .map((key) => (key === "va-hospital" ? "va_hospital" : "va_clinic"))
          .join(",") || null,
      activities: filters.activities.join(",") || null,
      geography: filters.geography.join(",") || null,
      income_tax: filters.incomeTax || null,
      no_income_tax: filters.noStateIncomeTax ? "true" : null,
      // "Military retirement not taxed" = no income tax at all OR retired pay
      // explicitly exempt. `conditional`/`partial` are deliberately excluded:
      // they'd mislead a retiree who doesn't meet the gate (issue #6).
      retired_pay_tax: filters.retiredPayUntaxed ? "no_income_tax,exempt" : null,
      vibes: filters.vibes.join(",") || null,
      employers: filters.employers.join(",") || null,
      defense_ecosystem: filters.defenseEcosystem ? "true" : null,
      near_base:
        filters.baseMaxDistance || filters.baseBranches.length > 0
          ? "true"
          : null,
      base_branch: filters.baseBranches.join(",") || null,
      base_max_distance:
        filters.baseMaxDistance ||
        (filters.baseBranches.length > 0 ? "50" : null),
      has_walmart: filters.hasWalmart ? "true" : null,
      has_costco: filters.hasCostco ? "true" : null,
      sort: filters.sort === "headroom_desc" ? "best" : filters.sort,
    };
    // Saved preferences are a floor, not a default: the filter bar can narrow
    // further but can never widen past a dealbreaker the visitor saved.
    return preferences
      ? applyPreferenceFloor(sessionParams, preferences)
      : sessionParams;
  }, [filters, preferences]);

  const profileConstraints = useMemo(
    () =>
      preferences && hasActivePreferences(preferences)
        ? describePreferences(preferences)
        : [],
    [preferences]
  );

  const filtered = useMemo(
    () =>
      filterAndSort(initialLocations, stateInfos, filterParams, {
        employerIndex,
        militaryIndex,
      }),
    [employerIndex, filterParams, initialLocations, militaryIndex, stateInfos]
  );

  // Per-state survivor counts for the map's "filtered out" hatch. The state
  // selection is stripped first — otherwise clicking a state would hatch every
  // other state — so this answers "which states still have a city that matches
  // my climate/budget/lifestyle/veteran/profile criteria?". Null when nothing
  // is filtering, so the map falls back to raw totals (its original behavior).
  const matchStateCounts = useMemo(() => {
    const anyFilter = Object.entries(filterParams).some(
      ([key, value]) =>
        key !== "state_filter" && key !== "sort" && value != null
    );
    if (!anyFilter) return null;
    const rows = filterAndSort(
      initialLocations,
      stateInfos,
      { ...filterParams, state_filter: null },
      { employerIndex, militaryIndex }
    );
    const counts: Record<string, number> = {};
    for (const loc of rows) {
      counts[loc.state] = (counts[loc.state] ?? 0) + 1;
    }
    return counts;
  }, [employerIndex, filterParams, initialLocations, militaryIndex, stateInfos]);

  const annotated = useMemo(() => {
    const empty = (location: Location) => ({
      location,
      budget: null as LocationBudget | null,
      quick: null as QuickAnnotation | null,
    });
    if (!scenarioAnnotationActive(scenario)) return filtered.map(empty);
    const cost = resolveCostConstants();
    if (!cost.ok) return filtered.map(empty);

    if (scenario.mode === "quick") {
      // One scalar take-home, the standardized quick baseline — the same
      // pinned modest + Medicare-with-supplement the city card's quick tab
      // uses, so a city reads identically on both surfaces.
      const income = parseMonthlyAmount(scenario.quickIncome);
      const ranked = rankByHeadroom(filtered, income, scenario.tenure, cost.constants, {
        spendingProfile: "modest",
        healthCoverage: "medicare_supplement",
        household: scenario.quickHousehold,
      });
      const rows = ranked.map((row) => ({
        location: row.location as Location,
        budget: null as LocationBudget | null,
        quick: { affordability: row, check: quickCheck(row, income) } as QuickAnnotation,
      }));
      if (filters.sort !== "headroom_desc") {
        const byId = new Map(rows.map((r) => [r.location.id, r]));
        return filtered.map((location) => byId.get(location.id) ?? empty(location));
      }
      return rows;
    }

    const tax = resolveTaxConstants();
    if (!tax.ok) return filtered.map(empty);
    // scenarioEstimateOptions keeps this surface pricing-identical to the
    // city card: same couple basket for married filing, same overrides.
    const ranked = rankByBudget(
      filtered,
      {
        sources: scenarioSources(scenario),
        filing: scenario.filing,
        age65Plus: scenario.age65Plus,
        spouse65Plus: scenario.spouse65Plus,
      },
      scenario.tenure,
      cost.constants,
      tax.constants,
      scenarioEstimateOptions(scenario),
      cushionShare(scenario.cushion)
    );
    if (filters.sort !== "headroom_desc") {
      const byId = new Map(ranked.map((row) => [row.location.id, row]));
      return filtered.map((location) => {
        const row = byId.get(location.id);
        return { location, budget: row ?? null, quick: null as QuickAnnotation | null };
      });
    }
    return ranked.map((row) => ({
      location: row.location as Location,
      budget: row,
      quick: null as QuickAnnotation | null,
    }));
  }, [filtered, filters.sort, scenario]);

  return (
    <>
      {/* PublicNav is itself sticky at z-100 and 68px tall, so the bar parks
          under it rather than at the viewport top. */}
      <div className="sticky top-[68px] z-40">
        <ExploreFilterBar
          filters={filters}
          update={update}
          resetAll={resetAll}
          clearFilter={clearFilter}
          stateCounts={stateCounts}
          employerGroups={employerGroups}
          resultCount={annotated.length}
          scenario={scenario}
          onScenarioChange={updateScenario}
          onClearScenario={clearScenario}
        />
      </div>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.85fr)]">
        <section>
          <div className="mb-4">
            <h1 className="text-2xl font-bold tracking-tight">
              Explore retirement locations
            </h1>
            <p className="text-muted-foreground">
              {scenarioAnnotationActive(scenario)
                ? "Filter as usual, then rank by money left over. Cities without enough data stay in the list."
                : "Filter by climate, budget, lifestyle, and veteran benefits. Open On my income for a quick affordability check by city."}
            </p>
          </div>

          {profileConstraints.length > 0 ? (
            <div className="mb-4 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-sm">
              <span className="font-medium">Your profile is applied:</span>
              <span className="text-muted-foreground">
                {profileConstraints.join(" · ")}
              </span>
              <Link href="/profile" className="ml-auto underline">
                Change
              </Link>
            </div>
          ) : null}

          {annotated.length === 0 ? (
            <div className="grid place-items-center gap-2 rounded-2xl border border-dashed bg-background p-12 text-center">
              <p className="font-medium">No locations match those filters</p>
              <p className="text-sm text-muted-foreground">
                {profileConstraints.length > 0
                  ? "Try clearing a filter, widening your budget, or loosening your profile."
                  : "Try clearing a filter or widening your budget."}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {annotated.map(({ location, budget, quick }) => (
                <LocationCard
                  key={location.id}
                  location={location}
                  budget={budget}
                  quick={quick}
                  tenure={scenario.tenure}
                />
              ))}
            </div>
          )}
        </section>

        <aside className="hidden min-h-[720px] lg:block">
          {/* Clears the stacked nav (68) + filter bar (~117) above it. */}
          <div className="sticky top-[200px] rounded-2xl border bg-background p-4">
            <StateMap
              stateCounts={stateCounts}
              matchCounts={matchStateCounts}
              selected={filters.state || null}
              onSelect={(next) => update("state", next ?? "")}
            />
          </div>
        </aside>
      </div>
    </>
  );
}
