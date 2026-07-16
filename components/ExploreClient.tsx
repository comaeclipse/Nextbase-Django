"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  Building2,
  ChevronDown,
  Heart,
  RotateCcw,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";
import type { DefenseEmployerRow, Location, StateInfoRow } from "@/lib/types";
import type { EmployerIndex } from "@/lib/defense";
import { filterAndSort, type FilterParams } from "@/lib/filters";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import LocationCard from "./LocationCard";
import StateMap from "./StateMap";

const CLIMATE_KEYS = ["cold_snowy", "hot_humid", "hot_dry", "mild_coastal"] as const;
const LIFESTYLE_KEYS = ["urban", "suburban", "small_town", "rural"] as const;
const HEALTHCARE_KEYS = ["va-hospital", "va-clinic"] as const;
const ACTIVITY_KEYS = ["golf", "fishing", "hiking", "culture"] as const;

type BoolMap<K extends string> = Record<K, boolean>;
const falses = <K extends string>(keys: readonly K[]): BoolMap<K> =>
  Object.fromEntries(keys.map((key) => [key, false])) as BoolMap<K>;

const CLIMATE_OPTIONS = [
  ["cold_snowy", "Cold / Snowy"], ["hot_humid", "Hot / Humid"],
  ["hot_dry", "Hot / Dry"], ["mild_coastal", "Mild / Coastal"],
] as const;
const LIFESTYLE_OPTIONS = [
  ["urban", "Urban"], ["suburban", "Suburban"], ["small_town", "Small Town"], ["rural", "Rural"],
] as const;
const HEALTHCARE_OPTIONS = [["va-hospital", "VA hospital nearby"], ["va-clinic", "VA clinic access"]] as const;
const ACTIVITY_OPTIONS = [["golf", "Golf"], ["fishing", "Fishing"], ["hiking", "Hiking"], ["culture", "Arts & culture"]] as const;

function selectedLabel<K extends string>(values: BoolMap<K>, options: readonly (readonly [K, string])[], fallback: string) {
  const labels = options.filter(([key]) => values[key]).map(([, label]) => label);
  return labels.length === 0 ? fallback : labels.length === 1 ? labels[0] : `${labels.length} selected`;
}

function OptionList<K extends string>({
  options, values, onChange,
}: {
  options: readonly (readonly [K, string])[];
  values: BoolMap<K>;
  onChange: (key: K, checked: boolean) => void;
}) {
  return <div className="filter-option-list">{options.map(([key, label]) => <label className="filter-check" key={key}>
    <Checkbox checked={values[key]} onCheckedChange={(checked) => onChange(key, checked === true)} />
    <span>{label}</span>
  </label>)}</div>;
}

function FilterPill({ label, active, icon: Icon, children }: {
  label: string; active?: boolean; icon?: typeof Building2; children: ReactNode;
}) {
  return <Popover>
    <PopoverTrigger className={`filter-pill ${active ? "is-active" : ""}`}>
      {Icon ? <Icon aria-hidden="true" /> : null}<span>{label}</span><ChevronDown aria-hidden="true" />
    </PopoverTrigger>
    <PopoverContent align="start" className="filter-popover">{children}</PopoverContent>
  </Popover>;
}

export default function ExploreClient({
  initialLocations, stateInfos, stateCounts, initialStateFilter = null, employers, employerIndex,
}: {
  initialLocations: Location[]; stateInfos: StateInfoRow[]; stateCounts: Record<string, number>;
  initialStateFilter?: string | null; employers: DefenseEmployerRow[]; employerIndex: EmployerIndex;
}) {
  const [climate, setClimate] = useState(falses(CLIMATE_KEYS));
  const [snow, setSnow] = useState<string | null>(null);
  const [lgbtq, setLgbtq] = useState(false);
  const [noAwb, setNoAwb] = useState(false);
  const [noHcm, setNoHcm] = useState(false);
  const [cost, setCost] = useState("");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [lifestyle, setLifestyle] = useState(falses(LIFESTYLE_KEYS));
  const [healthcare, setHealthcare] = useState(falses(HEALTHCARE_KEYS));
  const [activities, setActivities] = useState(falses(ACTIVITY_KEYS));
  const [employerSel, setEmployerSel] = useState<Record<string, boolean>>({});
  const [sort, setSort] = useState("best");
  const [view, setView] = useState<"grid" | "list" | "map">(initialStateFilter ? "map" : "grid");
  const [selectedMapState, setSelectedMapState] = useState<string | null>(initialStateFilter);
  const [mapMounted, setMapMounted] = useState(Boolean(initialStateFilter));

  const employerGroups = useMemo(() => {
    const cityCount = new Map<string, number>();
    for (const presences of Object.values(employerIndex)) for (const presence of presences) {
      if (presence.total > 0) cityCount.set(presence.slug, (cityCount.get(presence.slug) ?? 0) + 1);
    }
    const groups = new Map<string, { employer: DefenseEmployerRow; cities: number }[]>();
    for (const employer of employers) {
      const cities = cityCount.get(employer.slug); if (!cities) continue;
      if (!groups.has(employer.parent_company)) groups.set(employer.parent_company, []);
      groups.get(employer.parent_company)!.push({ employer, cities });
    }
    return [...groups.entries()];
  }, [employers, employerIndex]);

  const filterParams = useMemo<FilterParams>(() => {
    const pmin = priceMin.match(/\d+/); const pmax = priceMax.match(/\d+/);
    return {
      snow: snow || null, no_awb: noAwb ? "true" : null, no_hcm: noHcm ? "true" : null,
      state_filter: selectedMapState || null, lgbtq_friendly: lgbtq ? "true" : null,
      climate: CLIMATE_KEYS.filter((key) => climate[key]).join(",") || null,
      cost_of_living: cost || null, price_min: pmin?.[0] || null, price_max: pmax?.[0] || null,
      lifestyle: LIFESTYLE_KEYS.filter((key) => lifestyle[key]).join(",") || null,
      healthcare: HEALTHCARE_KEYS.filter((key) => healthcare[key]).map((key) => key === "va-hospital" ? "va_hospital" : "va_clinic").join(",") || null,
      activities: ACTIVITY_KEYS.filter((key) => activities[key]).join(",") || null,
      employers: Object.keys(employerSel).filter((key) => employerSel[key]).join(",") || null, sort,
    };
  }, [activities, climate, cost, employerSel, healthcare, lgbtq, lifestyle, noAwb, noHcm, priceMax, priceMin, selectedMapState, snow, sort]);

  const results = useMemo(() => filterAndSort(initialLocations, stateInfos, filterParams, { employerIndex }), [employerIndex, filterParams, initialLocations, stateInfos]);
  const activeCount = [climate, lifestyle, employerSel, healthcare, activities].reduce((total, group) => total + Object.values(group).filter(Boolean).length, 0)
    + [snow, lgbtq, noAwb, noHcm, cost, priceMin, priceMax].filter(Boolean).length;
  const personalCount = [lgbtq, noAwb, noHcm].filter(Boolean).length;

  function resetAll() {
    setClimate(falses(CLIMATE_KEYS)); setSnow(null); setLgbtq(false); setNoAwb(false); setNoHcm(false);
    setCost(""); setPriceMin(""); setPriceMax(""); setLifestyle(falses(LIFESTYLE_KEYS));
    setHealthcare(falses(HEALTHCARE_KEYS)); setActivities(falses(ACTIVITY_KEYS)); setEmployerSel({});
    setSelectedMapState(null); setSort("best");
  }
  function selectView(next: "grid" | "list" | "map") {
    if (next === "map") setMapMounted(true); if (next !== "map") setSelectedMapState(null); setView(next);
  }
  const gridClass = `results-grid${view === "list" ? " list-view" : ""}`;

  return <div className="explore-redesign">
    <section className="explore-filter-shell" aria-label="Explore filters">
      <div className="explore-filter-heading"><div><p className="eyebrow">Find your fit</p><h1>Explore retirement locations</h1></div>
        <Button variant="ghost" onClick={resetAll} className="reset-filters" disabled={activeCount === 0}><RotateCcw aria-hidden="true" />Reset</Button>
      </div>
      <div className="explore-filter-bar">
        <FilterPill label={selectedLabel(climate, CLIMATE_OPTIONS, "Climate")} active={CLIMATE_KEYS.some((key) => climate[key])}>
          <h2>Climate</h2><p>Choose one or more year-round patterns.</p><OptionList options={CLIMATE_OPTIONS} values={climate} onChange={(key, checked) => setClimate((current) => ({ ...current, [key]: checked }))} />
        </FilterPill>
        <FilterPill label={selectedLabel(lifestyle, LIFESTYLE_OPTIONS, "Lifestyle")} active={LIFESTYLE_KEYS.some((key) => lifestyle[key])}>
          <h2>Lifestyle</h2><p>How would you like everyday life to feel?</p><OptionList options={LIFESTYLE_OPTIONS} values={lifestyle} onChange={(key, checked) => setLifestyle((current) => ({ ...current, [key]: checked }))} />
        </FilterPill>
        <FilterPill label={Object.values(employerSel).filter(Boolean).length ? `${Object.values(employerSel).filter(Boolean).length} employers` : "Employers"} active={Object.values(employerSel).some(Boolean)} icon={Building2}>
          <h2>Defense employers</h2><p>Show cities with a physical facility from a selected employer.</p>
          <div className="employer-options">{employerGroups.map(([parent, entries]) => <div key={parent}><h3>{parent}</h3>{entries.map(({ employer, cities }) => <label className="filter-check" key={employer.slug}><Checkbox checked={Boolean(employerSel[employer.slug])} onCheckedChange={(checked) => setEmployerSel((current) => ({ ...current, [employer.slug]: checked === true }))} /><span>{employer.display_name} <small>{cities}</small></span></label>)}</div>)}</div>
        </FilterPill>
        <FilterPill label={personalCount ? `${personalCount} personal preference${personalCount > 1 ? "s" : ""}` : "More"} active={personalCount > 0} icon={SlidersHorizontal}>
          <h2>Personal preferences</h2><p>Keep these choices out of your main search until they matter.</p>
          <label className="toggle-row"><span><Heart aria-hidden="true" />LGBTQ friendly</span><Switch checked={lgbtq} onCheckedChange={setLgbtq} /></label>
          <label className="toggle-row"><span><ShieldCheck aria-hidden="true" />No assault-weapons ban</span><Switch checked={noAwb} onCheckedChange={setNoAwb} /></label>
          <label className="toggle-row"><span><ShieldCheck aria-hidden="true" />No high-capacity magazine restrictions</span><Switch checked={noHcm} onCheckedChange={setNoHcm} /></label>
        </FilterPill>
      </div>
      <Accordion className="advanced-filters">
        <AccordionItem value="advanced"><AccordionTrigger><span><SlidersHorizontal aria-hidden="true" />Advanced filters {activeCount > 0 ? <b>{activeCount}</b> : null}</span></AccordionTrigger>
          <AccordionContent><div className="advanced-filter-grid">
            <fieldset><legend>Snowfall</legend><div className="choice-pills">{[["zero", "Zero snow"], ["some", "Some snow"], ["lots", "Lots of snow"]].map(([value, label]) => <Button type="button" variant="outline" key={value} className={snow === value ? "is-selected" : ""} onClick={() => setSnow((current) => current === value ? null : value)}>{label}</Button>)}</div></fieldset>
            <fieldset><legend>Budget</legend><Select value={cost || null} onValueChange={(value) => setCost(value ?? "")}><SelectTrigger><SelectValue placeholder="Any cost of living" /></SelectTrigger><SelectContent><SelectItem value="low">Low cost</SelectItem><SelectItem value="moderate">Moderate cost</SelectItem><SelectItem value="high">High cost</SelectItem></SelectContent></Select><div className="price-fields"><Input aria-label="Minimum home price" inputMode="numeric" placeholder="Min home price" value={priceMin} onChange={(event) => setPriceMin(event.target.value)} /><span>to</span><Input aria-label="Maximum home price" inputMode="numeric" placeholder="Max home price" value={priceMax} onChange={(event) => setPriceMax(event.target.value)} /></div></fieldset>
            <fieldset><legend>Healthcare access</legend><OptionList options={HEALTHCARE_OPTIONS} values={healthcare} onChange={(key, checked) => setHealthcare((current) => ({ ...current, [key]: checked }))} /></fieldset>
            <fieldset><legend>Activities</legend><OptionList options={ACTIVITY_OPTIONS} values={activities} onChange={(key, checked) => setActivities((current) => ({ ...current, [key]: checked }))} /></fieldset>
          </div></AccordionContent>
        </AccordionItem>
      </Accordion>
    </section>

    <main className="explore-results">
      <div className="results-header"><div className="results-info">Found <strong>{results.length} locations</strong> matching your criteria</div>
        <div className="sort-options"><span>Sort by</span><Select value={sort} onValueChange={(value) => setSort(value ?? "best")}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="best">Best match</SelectItem><SelectItem value="cost_asc">Cost: low to high</SelectItem><SelectItem value="cost_desc">Cost: high to low</SelectItem><SelectItem value="climate">Climate</SelectItem><SelectItem value="va">VA access</SelectItem><SelectItem value="gas_asc">Gas: low to high</SelectItem><SelectItem value="gas_desc">Gas: high to low</SelectItem></SelectContent></Select><div className="view-toggle">{(["grid", "list", "map"] as const).map((next) => <Button key={next} type="button" variant="outline" className={view === next ? "active" : ""} onClick={() => selectView(next)}>{next[0].toUpperCase() + next.slice(1)}</Button>)}</div></div>
      </div>
      <div id="map-view" style={{ display: view === "map" ? "block" : "none" }}>{mapMounted && <StateMap stateCounts={stateCounts} selected={selectedMapState} onSelect={setSelectedMapState} />}</div>
      <div className={gridClass} id="results-grid">{results.map((location) => <LocationCard key={location.id} location={location} />)}</div>
    </main>
  </div>;
}
