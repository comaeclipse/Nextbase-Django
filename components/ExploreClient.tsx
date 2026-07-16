"use client";

import { useMemo, useState } from "react";
import type { DefenseEmployerRow, Location, StateInfoRow } from "@/lib/types";
import type { EmployerIndex } from "@/lib/defense";
import { filterAndSort, type FilterParams } from "@/lib/filters";
import ExploreFilterBar, {
  DEFAULT_FILTERS,
  type ChipKey,
  type ExploreFilters,
} from "@/components/explore/ExploreFilterBar";
import LocationCard from "./LocationCard";
import StateMap from "./StateMap";

export default function ExploreClient({
  initialLocations,
  stateInfos,
  stateCounts,
  initialStateFilter = null,
  employers,
  employerIndex,
}: {
  initialLocations: Location[];
  stateInfos: StateInfoRow[];
  stateCounts: Record<string, number>;
  initialStateFilter?: string | null;
  employers: DefenseEmployerRow[];
  employerIndex: EmployerIndex;
}) {
  const [filters, setFilters] = useState<ExploreFilters>({
    ...DEFAULT_FILTERS,
    state: initialStateFilter ?? "",
  });

  function update<K extends keyof ExploreFilters>(
    key: K,
    value: ExploreFilters[K]
  ) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  function resetAll() {
    setFilters(DEFAULT_FILTERS);
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
            healthcare: [],
            activities: [],
            snow: "",
            incomeTax: "",
            lgbtq: false,
            noAwb: false,
            noHcm: false,
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
    return {
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
      vibes: filters.vibes.join(",") || null,
      employers: filters.employers.join(",") || null,
      sort: filters.sort,
    };
  }, [filters]);

  const results = useMemo(
    () =>
      filterAndSort(initialLocations, stateInfos, filterParams, {
        employerIndex,
      }),
    [employerIndex, filterParams, initialLocations, stateInfos]
  );

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
          resultCount={results.length}
        />
      </div>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.85fr)]">
        <section>
          <div className="mb-4">
            <h1 className="text-2xl font-bold tracking-tight">
              Explore retirement locations
            </h1>
            <p className="text-muted-foreground">
              Filter by climate, budget, lifestyle, and veteran benefits.
            </p>
          </div>

          {results.length === 0 ? (
            <div className="grid place-items-center gap-2 rounded-2xl border border-dashed bg-background p-12 text-center">
              <p className="font-medium">No locations match those filters</p>
              <p className="text-sm text-muted-foreground">
                Try clearing a filter or widening your budget.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {results.map((location) => (
                <LocationCard key={location.id} location={location} />
              ))}
            </div>
          )}
        </section>

        <aside className="hidden min-h-[720px] lg:block">
          {/* Clears the stacked nav (68) + filter bar (~117) above it. */}
          <div className="sticky top-[200px] rounded-2xl border bg-background p-4">
            <StateMap
              stateCounts={stateCounts}
              selected={filters.state || null}
              onSelect={(next) => update("state", next ?? "")}
            />
          </div>
        </aside>
      </div>
    </>
  );
}
