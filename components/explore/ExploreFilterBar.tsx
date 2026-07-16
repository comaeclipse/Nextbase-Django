"use client";

import * as React from "react";
import {
  Building2,
  Check,
  ChevronDown,
  Droplets,
  Fish,
  Heart,
  Home,
  Landmark,
  MapPin,
  Moon,
  Mountain,
  MountainSnow,
  Music,
  RotateCcw,
  Sailboat,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Snowflake,
  Sparkles,
  Stethoscope,
  Store,
  Sun,
  Tent,
  TreePalm,
  Trees,
  Waves,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { DefenseEmployerRow } from "@/lib/types";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ *
 * Filter model
 * ------------------------------------------------------------------ */

export type ExploreFilters = {
  state: string;
  cost: string;
  priceMin: string;
  priceMax: string;
  climate: string[];
  lifestyle: string[];
  geography: string[];
  vibes: string[];
  employers: string[];
  snow: string;
  healthcare: string[];
  activities: string[];
  incomeTax: "" | "none" | "low";
  lgbtq: boolean;
  noAwb: boolean;
  noHcm: boolean;
  sort: string;
};

export const DEFAULT_FILTERS: ExploreFilters = {
  state: "",
  cost: "",
  priceMin: "",
  priceMax: "",
  climate: [],
  lifestyle: [],
  geography: [],
  vibes: [],
  employers: [],
  snow: "",
  healthcare: [],
  activities: [],
  incomeTax: "",
  lgbtq: false,
  noAwb: false,
  noHcm: false,
  sort: "best",
};

/** Chips group fields the way the popovers do, not one chip per field. */
export type ChipKey =
  | "state"
  | "budget"
  | "climate"
  | "lifestyle"
  | "geography"
  | "more";

type Option = { id: string; label: string; icon: React.ComponentType<{ className?: string }> };

export const CLIMATE_OPTIONS: Option[] = [
  { id: "cold_snowy", label: "Four seasons", icon: Snowflake },
  { id: "hot_humid", label: "Hot / Humid", icon: Droplets },
  { id: "hot_dry", label: "Hot / Dry", icon: Sun },
  { id: "mild_coastal", label: "Mild / Coastal", icon: Waves },
];

export const LIFESTYLE_OPTIONS: Option[] = [
  { id: "urban", label: "Urban", icon: Building2 },
  { id: "suburban", label: "Suburban", icon: Home },
  { id: "small_town", label: "Small town", icon: Store },
  { id: "rural", label: "Rural", icon: Trees },
];

export const GEOGRAPHY_OPTIONS: Option[] = [
  { id: "lake", label: "Near a lake", icon: Waves },
  { id: "ocean", label: "Near the ocean", icon: Sailboat },
  { id: "mountains", label: "Near the mountains", icon: Mountain },
];

export const VIBE_OPTIONS: Option[] = [
  { id: "beach_life", label: "Beach life", icon: TreePalm },
  { id: "desert_life", label: "Desert life", icon: Sun },
  { id: "mountain_living", label: "Mountain living", icon: MountainSnow },
  { id: "southern_living", label: "Southern living", icon: Landmark },
  { id: "lake_living", label: "Lake living", icon: Waves },
  { id: "great_outdoors", label: "Great outdoors", icon: Tent },
  { id: "nightlife", label: "Nightlife", icon: Music },
  { id: "quiet_retreat", label: "Quiet retreat", icon: Moon },
];

export const HEALTHCARE_OPTIONS: Option[] = [
  { id: "va-hospital", label: "VA hospital nearby", icon: Stethoscope },
  { id: "va-clinic", label: "VA clinic access", icon: Stethoscope },
];

export const ACTIVITY_OPTIONS: Option[] = [
  { id: "golf", label: "Golf", icon: Trees },
  { id: "fishing", label: "Fishing", icon: Fish },
  { id: "hiking", label: "Hiking", icon: Mountain },
  { id: "culture", label: "Arts & culture", icon: Landmark },
];

const SNOW_OPTIONS = [
  ["zero", "Zero snow"],
  ["some", "Some snow"],
  ["lots", "Lots of snow"],
] as const;

/** Home prices, in thousands — `lib/filters` multiplies these back up. */
const PRICE_OPTIONS = [
  "150", "200", "250", "300", "350", "400", "500", "600", "750", "1000",
];

/** Base UI resolves the trigger's label from `items`, so these carry both. */
export const SORT_OPTIONS = [
  { value: "best", label: "Best match" },
  { value: "cost_asc", label: "Cost: low to high" },
  { value: "cost_desc", label: "Cost: high to low" },
  { value: "climate", label: "Climate" },
  { value: "va", label: "VA access" },
  { value: "gas_asc", label: "Gas: low to high" },
  { value: "gas_desc", label: "Gas: high to low" },
];

const COST_OPTIONS = [
  { value: "low", label: "Low cost" },
  { value: "moderate", label: "Moderate cost" },
  { value: "high", label: "High cost" },
];

const PRICE_ITEMS = PRICE_OPTIONS.map((value) => ({
  value,
  label: `$${formatPrice(value)}`,
}));

/* ------------------------------------------------------------------ *
 * Labels
 * ------------------------------------------------------------------ */

function formatMultiLabel(values: string[], options: Option[], fallback: string) {
  if (values.length === 0) return fallback;
  if (values.length === 1) {
    return options.find((o) => o.id === values[0])?.label ?? fallback;
  }
  return `${values.length} selected`;
}

function formatPrice(value: string) {
  const n = Number(value);
  if (!n) return "";
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(n * 1000);
}

function formatBudgetLabel(filters: ExploreFilters) {
  const cost = filters.cost
    ? filters.cost[0].toUpperCase() + filters.cost.slice(1) + " cost"
    : null;
  const price =
    filters.priceMin && filters.priceMax
      ? `$${formatPrice(filters.priceMin)}–$${formatPrice(filters.priceMax)}`
      : filters.priceMin
        ? `$${formatPrice(filters.priceMin)}+`
        : filters.priceMax
          ? `Up to $${formatPrice(filters.priceMax)}`
          : null;
  return [cost, price].filter(Boolean).join(" · ") || "Budget";
}

/** Everything the More drawer owns — mirrors the "more" chip and its badge. */
export function moreFilterCount(filters: ExploreFilters) {
  return (
    filters.vibes.length +
    filters.employers.length +
    filters.healthcare.length +
    filters.activities.length +
    (filters.snow ? 1 : 0) +
    (filters.incomeTax ? 1 : 0) +
    (filters.lgbtq ? 1 : 0) +
    (filters.noAwb ? 1 : 0) +
    (filters.noHcm ? 1 : 0)
  );
}

/* ------------------------------------------------------------------ *
 * Pieces
 * ------------------------------------------------------------------ */

const FilterButton = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof Button> & {
    label: string;
    active?: boolean;
    icon?: React.ComponentType<{ className?: string }>;
  }
>(({ label, active, icon: Icon, className, ...props }, ref) => {
  return (
    <Button
      ref={ref}
      variant="outline"
      className={cn(
        "h-10 shrink-0 gap-2 rounded-full bg-background px-4 font-medium shadow-none",
        active && "border-primary bg-primary/5 text-primary",
        className
      )}
      {...props}
    >
      {Icon ? <Icon className="size-4" /> : null}
      <span className="max-w-40 truncate">{label}</span>
      <ChevronDown className="size-3.5 opacity-60" />
    </Button>
  );
});
FilterButton.displayName = "FilterButton";

function SectionHeading({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="space-y-1">
      <h3 className="font-semibold">{title}</h3>
      {description ? (
        <p className="text-sm text-muted-foreground">{description}</p>
      ) : null}
    </div>
  );
}

/** The demo's home-type grid: a checkbox card per option. */
function CheckCards({
  name,
  options,
  values,
  onChange,
  columns = 2,
}: {
  name: string;
  options: Option[];
  values: string[];
  onChange: (next: string[]) => void;
  columns?: 1 | 2;
}) {
  function toggle(id: string, checked: boolean) {
    onChange(checked ? [...values, id] : values.filter((v) => v !== id));
  }

  return (
    <div className={cn("grid gap-2", columns === 2 && "grid-cols-2")}>
      {options.map(({ id, label, icon: Icon }) => {
        const checked = values.includes(id);
        return (
          <Label
            key={id}
            htmlFor={`${name}-${id}`}
            className={cn(
              "flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors hover:bg-accent",
              checked && "border-primary bg-primary/5"
            )}
          >
            <Checkbox
              id={`${name}-${id}`}
              checked={checked}
              onCheckedChange={(value) => toggle(id, value === true)}
            />
            <Icon className="size-4 text-muted-foreground" />
            <span className="text-sm font-medium">{label}</span>
          </Label>
        );
      })}
    </div>
  );
}

function BudgetFields({
  filters,
  update,
}: {
  filters: ExploreFilters;
  update: <K extends keyof ExploreFilters>(key: K, value: ExploreFilters[K]) => void;
}) {
  return (
    <div className="space-y-4">
      <Select
        items={COST_OPTIONS}
        value={filters.cost || null}
        onValueChange={(value) => update("cost", (value as string) ?? "")}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Any cost of living" />
        </SelectTrigger>
        <SelectContent>
          {COST_OPTIONS.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <Select
          items={PRICE_ITEMS}
          value={filters.priceMin || null}
          onValueChange={(value) => update("priceMin", (value as string) ?? "")}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="No min" />
          </SelectTrigger>
          <SelectContent>
            {PRICE_ITEMS.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">to</span>
        <Select
          items={PRICE_ITEMS}
          value={filters.priceMax || null}
          onValueChange={(value) => update("priceMax", (value as string) ?? "")}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="No max" />
          </SelectTrigger>
          <SelectContent>
            {PRICE_ITEMS.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function StatePicker({
  filters,
  update,
  stateCounts,
}: {
  filters: ExploreFilters;
  update: <K extends keyof ExploreFilters>(key: K, value: ExploreFilters[K]) => void;
  stateCounts: Record<string, number>;
}) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");

  const states = React.useMemo(
    () =>
      Object.entries(stateCounts)
        .filter(([abbr]) => abbr.toLowerCase().includes(query.toLowerCase()))
        .sort((a, b) => a[0].localeCompare(b[0])),
    [stateCounts, query]
  );

  function choose(next: string) {
    update("state", next);
    setOpen(false);
    setQuery("");
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            aria-expanded={open}
            className="h-10 min-w-0 flex-1 justify-start gap-2 rounded-full px-4 shadow-none sm:max-w-sm"
          >
            <MapPin className="size-4 shrink-0 text-primary" />
            <span className="truncate">
              {filters.state ? `${filters.state}` : "All states"}
            </span>
            <ChevronDown className="ml-auto size-3.5 shrink-0 opacity-60" />
          </Button>
        }
      />
      <PopoverContent align="start" className="w-72 gap-0 p-0">
        <div className="border-b p-2">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search a state…"
            aria-label="Search a state"
            className="h-9 border-0 shadow-none focus-visible:ring-0"
          />
        </div>
        <div className="max-h-72 overflow-y-auto p-1">
          <button
            type="button"
            onClick={() => choose("")}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
          >
            <Check
              className={cn("size-4", filters.state ? "opacity-0" : "opacity-100")}
            />
            All states
          </button>
          {states.length === 0 ? (
            <p className="px-2 py-6 text-center text-sm text-muted-foreground">
              No state found.
            </p>
          ) : (
            states.map(([abbr, count]) => (
              <button
                key={abbr}
                type="button"
                onClick={() => choose(abbr)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
              >
                <Check
                  className={cn(
                    "size-4",
                    filters.state === abbr ? "opacity-100" : "opacity-0"
                  )}
                />
                <span className="flex-1 text-left">{abbr}</span>
                <span className="text-xs text-muted-foreground">{count}</span>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function ToggleRow({
  icon: Icon,
  label,
  checked,
  onCheckedChange,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <Label className="flex cursor-pointer items-center justify-between gap-3 py-1">
      <span className="flex items-center gap-2.5 text-sm font-normal">
        <Icon className="size-4 text-muted-foreground" />
        {label}
      </span>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </Label>
  );
}

function MoreFiltersContent({
  filters,
  update,
  employerGroups,
}: {
  filters: ExploreFilters;
  update: <K extends keyof ExploreFilters>(key: K, value: ExploreFilters[K]) => void;
  employerGroups: [string, { employer: DefenseEmployerRow; cities: number }[]][];
}) {
  function toggleEmployer(slug: string, checked: boolean) {
    update(
      "employers",
      checked
        ? [...filters.employers, slug]
        : filters.employers.filter((s) => s !== slug)
    );
  }

  return (
    <div className="space-y-7 px-1 py-2">
      <section className="space-y-4">
        <SectionHeading
          title="Vibe"
          description="Regional setting and lifestyle feel."
        />
        <CheckCards
          name="vibe"
          options={VIBE_OPTIONS}
          values={filters.vibes}
          onChange={(next) => update("vibes", next)}
        />
      </section>

      <Separator />

      <section className="space-y-4">
        <SectionHeading
          title="Snowfall"
          description="How much snow a normal winter brings."
        />
        <ToggleGroup
          value={filters.snow ? [filters.snow] : []}
          onValueChange={(values: string[]) => update("snow", values[0] ?? "")}
          variant="outline"
          spacing={0}
          aria-label="Snowfall"
          className="grid grid-cols-3"
        >
          {SNOW_OPTIONS.map(([value, label]) => (
            <ToggleGroupItem key={value} value={value} className="px-2">
              {label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </section>

      <Separator />

      <section className="space-y-4">
        <SectionHeading title="Healthcare access" />
        <CheckCards
          name="healthcare"
          options={HEALTHCARE_OPTIONS}
          values={filters.healthcare}
          onChange={(next) => update("healthcare", next)}
        />
      </section>

      <Separator />

      <section className="space-y-4">
        <SectionHeading title="Activities" />
        <CheckCards
          name="activity"
          options={ACTIVITY_OPTIONS}
          values={filters.activities}
          onChange={(next) => update("activities", next)}
        />
      </section>

      {employerGroups.length > 0 ? (
        <>
          <Separator />
          <section className="space-y-4">
            <SectionHeading
              title="Defense employers"
              description="Show cities with a physical facility from a selected employer."
            />
            <div className="space-y-4">
              {employerGroups.map(([parent, entries]) => (
                <div key={parent} className="space-y-2">
                  <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                    {parent}
                  </p>
                  {entries.map(({ employer, cities }) => (
                    <Label
                      key={employer.slug}
                      htmlFor={`employer-${employer.slug}`}
                      className="flex cursor-pointer items-center gap-3 py-1 text-sm font-normal"
                    >
                      <Checkbox
                        id={`employer-${employer.slug}`}
                        checked={filters.employers.includes(employer.slug)}
                        onCheckedChange={(value) =>
                          toggleEmployer(employer.slug, value === true)
                        }
                      />
                      <span className="flex-1">{employer.display_name}</span>
                      <span className="text-xs text-muted-foreground">
                        {cities}
                      </span>
                    </Label>
                  ))}
                </div>
              ))}
            </div>
          </section>
        </>
      ) : null}

      <Separator />

      <section className="space-y-3">
        <SectionHeading
          title="Personal preferences"
          description="Kept out of the main search until they matter."
        />
        <ToggleRow
          icon={Heart}
          label="LGBTQ friendly"
          checked={filters.lgbtq}
          onCheckedChange={(checked) => update("lgbtq", checked)}
        />
        <ToggleRow
          icon={ShieldCheck}
          label="No assault-weapons ban"
          checked={filters.noAwb}
          onCheckedChange={(checked) => update("noAwb", checked)}
        />
        <ToggleRow
          icon={ShieldCheck}
          label="No high-capacity magazine limits"
          checked={filters.noHcm}
          onCheckedChange={(checked) => update("noHcm", checked)}
        />
        {/* One field, two switches — turning either on turns the other off. */}
        <ToggleRow
          icon={Landmark}
          label="No state income tax"
          checked={filters.incomeTax === "none"}
          onCheckedChange={(checked) => update("incomeTax", checked ? "none" : "")}
        />
        <ToggleRow
          icon={Landmark}
          label="Low state income tax (4% or less)"
          checked={filters.incomeTax === "low"}
          onCheckedChange={(checked) => update("incomeTax", checked ? "low" : "")}
        />
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Bar
 * ------------------------------------------------------------------ */

export default function ExploreFilterBar({
  filters,
  update,
  resetAll,
  clearFilter,
  stateCounts,
  employerGroups,
  resultCount,
}: {
  filters: ExploreFilters;
  update: <K extends keyof ExploreFilters>(key: K, value: ExploreFilters[K]) => void;
  resetAll: () => void;
  clearFilter: (key: ChipKey) => void;
  stateCounts: Record<string, number>;
  employerGroups: [string, { employer: DefenseEmployerRow; cities: number }[]][];
  resultCount: number;
}) {
  const count = moreFilterCount(filters);

  const activeChips = (
    [
      filters.state ? { key: "state", label: filters.state } : null,
      filters.cost || filters.priceMin || filters.priceMax
        ? { key: "budget", label: formatBudgetLabel(filters) }
        : null,
      filters.climate.length
        ? { key: "climate", label: formatMultiLabel(filters.climate, CLIMATE_OPTIONS, "Climate") }
        : null,
      filters.lifestyle.length
        ? { key: "lifestyle", label: formatMultiLabel(filters.lifestyle, LIFESTYLE_OPTIONS, "Lifestyle") }
        : null,
      filters.geography.length
        ? { key: "geography", label: formatMultiLabel(filters.geography, GEOGRAPHY_OPTIONS, "Geography") }
        : null,
      count > 0 ? { key: "more", label: "More filters" } : null,
    ] as ({ key: ChipKey; label: string } | null)[]
  ).filter(Boolean) as { key: ChipKey; label: string }[];

  const moreContent = (
    <MoreFiltersContent
      filters={filters}
      update={update}
      employerGroups={employerGroups}
    />
  );

  return (
    <div className="border-b bg-background">
      <div className="mx-auto max-w-7xl px-4 py-3">
        <div className="flex items-center gap-2">
          <StatePicker
            filters={filters}
            update={update}
            stateCounts={stateCounts}
          />

          <div className="hidden min-w-0 flex-1 items-center gap-2 overflow-x-auto pb-1 md:flex">
            <Popover>
              <PopoverTrigger
                render={
                  <FilterButton
                    label={formatBudgetLabel(filters)}
                    active={Boolean(
                      filters.cost || filters.priceMin || filters.priceMax
                    )}
                  />
                }
              />
              <PopoverContent align="start" className="w-80 gap-4 p-4">
                <SectionHeading
                  title="Budget"
                  description="Overall cost of living, home price, or both."
                />
                <BudgetFields filters={filters} update={update} />
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger
                render={
                  <FilterButton
                    label={formatMultiLabel(filters.climate, CLIMATE_OPTIONS, "Climate")}
                    icon={Sun}
                    active={filters.climate.length > 0}
                  />
                }
              />
              <PopoverContent align="start" className="w-[27rem] gap-4 p-4">
                <SectionHeading
                  title="Climate"
                  description="Choose one or more year-round patterns. Four seasons covers distinct winters with real cold or snow."
                />
                <CheckCards
                  name="climate"
                  options={CLIMATE_OPTIONS}
                  values={filters.climate}
                  onChange={(next) => update("climate", next)}
                />
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger
                render={
                  <FilterButton
                    label={formatMultiLabel(filters.lifestyle, LIFESTYLE_OPTIONS, "Lifestyle")}
                    icon={Building2}
                    active={filters.lifestyle.length > 0}
                  />
                }
              />
              <PopoverContent align="start" className="w-[27rem] gap-4 p-4">
                <SectionHeading
                  title="Lifestyle"
                  description="Urban, suburban, small town, or rural settlement type."
                />
                <CheckCards
                  name="lifestyle"
                  options={LIFESTYLE_OPTIONS}
                  values={filters.lifestyle}
                  onChange={(next) => update("lifestyle", next)}
                />
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger
                render={
                  <FilterButton
                    label={formatMultiLabel(filters.geography, GEOGRAPHY_OPTIONS, "Geography")}
                    icon={Waves}
                    active={filters.geography.length > 0}
                  />
                }
              />
              <PopoverContent align="start" className="w-96 gap-4 p-4">
                <SectionHeading
                  title="Geography"
                  description="Nearby natural features; selecting more than one broadens results."
                />
                <CheckCards
                  name="geography"
                  options={GEOGRAPHY_OPTIONS}
                  values={filters.geography}
                  onChange={(next) => update("geography", next)}
                  columns={1}
                />
              </PopoverContent>
            </Popover>

            <Drawer direction="right">
              <DrawerTrigger
                render={
                  <Button
                    variant="outline"
                    className={cn(
                      "h-10 shrink-0 gap-2 rounded-full px-4 shadow-none",
                      count > 0 && "border-primary bg-primary/5 text-primary"
                    )}
                  >
                    <SlidersHorizontal className="size-4" />
                    More
                    {count > 0 ? (
                      <Badge className="h-5 min-w-5 rounded-full px-1.5">
                        {count}
                      </Badge>
                    ) : null}
                  </Button>
                }
              />
              <DrawerContent className="rounded-none">
                <DrawerHeader className="border-b">
                  <DrawerTitle>All filters</DrawerTitle>
                  <DrawerDescription>
                    Fine-tune the locations shown in your results.
                  </DrawerDescription>
                </DrawerHeader>
                <div className="min-h-0 flex-1 overflow-y-auto px-5">
                  {moreContent}
                </div>
                <DrawerFooter className="border-t sm:flex-row sm:items-center sm:justify-between">
                  <Button variant="ghost" onClick={resetAll} className="gap-2">
                    <RotateCcw className="size-4" /> Reset all
                  </Button>
                  <DrawerClose
                    render={
                      <Button className="sm:min-w-48">
                        Show {resultCount} locations
                      </Button>
                    }
                  />
                </DrawerFooter>
              </DrawerContent>
            </Drawer>
          </div>

          <Drawer>
            <DrawerTrigger
              render={
                <Button className="shrink-0 gap-2 rounded-full md:hidden">
                  <SlidersHorizontal className="size-4" />
                  Filters
                  {count > 0 ? (
                    <Badge
                      variant="secondary"
                      className="h-5 min-w-5 rounded-full px-1.5"
                    >
                      {count}
                    </Badge>
                  ) : null}
                </Button>
              }
            />
            <DrawerContent>
              <DrawerHeader className="border-b">
                <DrawerTitle>Search filters</DrawerTitle>
                <DrawerDescription>
                  {filters.state ? filters.state : "All states"}
                </DrawerDescription>
              </DrawerHeader>
              <div className="min-h-0 flex-1 overflow-y-auto px-4">
                <div className="space-y-7 py-2">
                  <section className="space-y-4">
                    <SectionHeading title="Budget" />
                    <BudgetFields filters={filters} update={update} />
                  </section>
                  <Separator />
                  <section className="space-y-4">
                    <SectionHeading title="Climate" />
                    <CheckCards
                      name="m-climate"
                      options={CLIMATE_OPTIONS}
                      values={filters.climate}
                      onChange={(next) => update("climate", next)}
                    />
                  </section>
                  <Separator />
                  <section className="space-y-4">
                    <SectionHeading title="Lifestyle" />
                    <CheckCards
                      name="m-lifestyle"
                      options={LIFESTYLE_OPTIONS}
                      values={filters.lifestyle}
                      onChange={(next) => update("lifestyle", next)}
                    />
                  </section>
                  <Separator />
                  <section className="space-y-4">
                    <SectionHeading title="Geography" />
                    <CheckCards
                      name="m-geography"
                      options={GEOGRAPHY_OPTIONS}
                      values={filters.geography}
                      onChange={(next) => update("geography", next)}
                      columns={1}
                    />
                  </section>
                  <Separator />
                  {moreContent}
                </div>
              </div>
              <DrawerFooter className="border-t">
                <div className="grid grid-cols-[auto_1fr] gap-2">
                  <Button
                    variant="outline"
                    onClick={resetAll}
                    aria-label="Reset all filters"
                  >
                    <RotateCcw className="size-4" />
                  </Button>
                  <DrawerClose
                    render={<Button>Show {resultCount} locations</Button>}
                  />
                </div>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>

          <Button
            size="icon"
            className="hidden shrink-0 rounded-full sm:inline-flex"
            aria-label="Search"
          >
            <Search className="size-4" />
          </Button>
        </div>

        {activeChips.length > 0 ? (
          <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1">
            {activeChips.map((chip) => (
              <Badge
                key={chip.key}
                variant="secondary"
                className="h-8 shrink-0 gap-1 rounded-full pl-3 pr-1.5 font-medium"
              >
                {chip.label}
                <button
                  type="button"
                  onClick={() => clearFilter(chip.key)}
                  className="grid size-6 place-items-center rounded-full hover:bg-background"
                  aria-label={`Remove ${chip.label} filter`}
                >
                  <X className="size-3.5" />
                </button>
              </Badge>
            ))}
            <Button
              variant="ghost"
              size="sm"
              onClick={resetAll}
              className="shrink-0 rounded-full"
            >
              Clear all
            </Button>
          </div>
        ) : null}
      </div>

      <div className="border-t bg-muted/30">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2 text-sm">
          <div className="flex min-w-0 items-center gap-2">
            <Sparkles className="size-4 shrink-0 text-primary" />
            <span className="truncate">
              <strong>{resultCount} locations</strong>
              {filters.state ? ` in ${filters.state}` : " matching your criteria"}
            </span>
          </div>
          <Select
            items={SORT_OPTIONS}
            value={filters.sort}
            onValueChange={(value) => update("sort", (value as string) ?? "best")}
          >
            <SelectTrigger className="h-8 w-44 border-0 bg-transparent shadow-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              {SORT_OPTIONS.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
