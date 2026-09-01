"use client";

import * as React from "react";
import {
  Award,
  Briefcase,
  Building2,
  ChevronDown,
  Globe2,
  RotateCcw,
  Search,
  SlidersHorizontal,
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
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import type { DefenseJobFacets } from "@/lib/defense-jobs";

/* ------------------------------------------------------------------ *
 * Shared pieces (mirrors the /explore filter bar)
 * ------------------------------------------------------------------ */

type Option = { key: string; name: string; skillBridgeActive?: boolean };

const FilterButton = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof Button> & {
    label: string;
    active?: boolean;
    icon?: React.ComponentType<{ className?: string }>;
  }
>(({ label, active, icon: Icon, className, ...props }, ref) => (
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
));
FilterButton.displayName = "FilterButton";

function multiLabel(selected: Set<string>, options: Option[], fallback: string) {
  if (selected.size === 0) return fallback;
  if (selected.size === 1) {
    const only = [...selected][0];
    return options.find((o) => o.key === only)?.name ?? fallback;
  }
  return `${selected.size} selected`;
}

/** A small "SB" pill marking an employer with an active SkillBridge posting. */
function SkillBridgeTag() {
  return (
    <span className="rounded-full bg-primary/10 px-1.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
      SB
    </span>
  );
}

/** A scrollable checkbox list used inside a popover or the mobile drawer. */
function CheckList({
  options,
  selected,
  onToggle,
  emptyLabel = "None available",
}: {
  options: Option[];
  selected: Set<string>;
  onToggle: (key: string) => void;
  emptyLabel?: string;
}) {
  if (options.length === 0) {
    return (
      <p className="px-2 py-6 text-center text-sm text-muted-foreground">
        {emptyLabel}
      </p>
    );
  }
  return (
    <div className="max-h-72 space-y-0.5 overflow-y-auto p-1">
      {options.map((o) => {
        const checked = selected.has(o.key);
        return (
          <button
            key={o.key}
            type="button"
            onClick={() => onToggle(o.key)}
            className={cn(
              "flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent",
              checked && "font-medium"
            )}
          >
            <Checkbox checked={checked} className="pointer-events-none" />
            <span className="flex-1">{o.name}</span>
            {o.skillBridgeActive ? <SkillBridgeTag /> : null}
          </button>
        );
      })}
    </div>
  );
}

function MultiSelectPopover({
  label,
  icon,
  options,
  selected,
  onToggle,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  options: Option[];
  selected: Set<string>;
  onToggle: (key: string) => void;
}) {
  return (
    <Popover>
      <PopoverTrigger
        render={
          <FilterButton
            label={multiLabel(selected, options, label)}
            icon={icon}
            active={selected.size > 0}
          />
        }
      />
      <PopoverContent align="start" className="w-72 gap-0 p-0">
        <CheckList options={options} selected={selected} onToggle={onToggle} />
      </PopoverContent>
    </Popover>
  );
}

function SectionHeading({ title, description }: { title: string; description?: string }) {
  return (
    <div className="space-y-1">
      <h3 className="font-semibold">{title}</h3>
      {description ? (
        <p className="text-sm text-muted-foreground">{description}</p>
      ) : null}
    </div>
  );
}

/**
 * The "More" section: remote-only, active-SkillBridge-only, and the aggregate
 * cross-reference employers.
 */
function MoreContent({
  remoteOnly,
  onRemoteChange,
  skillBridgeAvailable,
  skillBridgeOnly,
  onSkillBridgeChange,
  countOnlyEmployers,
  selCountEmployers,
  onToggleCountEmployer,
}: {
  remoteOnly: boolean;
  onRemoteChange: (checked: boolean) => void;
  skillBridgeAvailable: boolean;
  skillBridgeOnly: boolean;
  onSkillBridgeChange: (checked: boolean) => void;
  countOnlyEmployers: Option[];
  selCountEmployers: Set<string>;
  onToggleCountEmployer: (key: string) => void;
}) {
  return (
    <div className="space-y-7 px-1 py-2">
      <section className="space-y-3">
        <SectionHeading
          title="Listing type"
          description="Narrow to remote roles or active DoD SkillBridge openings."
        />
        <Label className="flex cursor-pointer items-center justify-between gap-3 py-1">
          <span className="flex items-center gap-2.5 text-sm font-normal">
            <Globe2 className="size-4 text-muted-foreground" />
            Remote only
          </span>
          <Switch checked={remoteOnly} onCheckedChange={onRemoteChange} />
        </Label>
        {skillBridgeAvailable ? (
          <Label className="flex cursor-pointer items-center justify-between gap-3 py-1">
            <span className="flex items-center gap-2.5 text-sm font-normal">
              <Award className="size-4 text-muted-foreground" />
              Active SkillBridge only
            </span>
            <Switch
              checked={skillBridgeOnly}
              onCheckedChange={onSkillBridgeChange}
            />
          </Label>
        ) : null}
      </section>

      {countOnlyEmployers.length > 0 && (
        <>
          <Separator />
          <section className="space-y-4">
            <SectionHeading
              title="Cross-reference on map"
              description="Tracked defense employers we hold aggregate posting counts for but no individual listings yet. Adds dashed count markers to the map."
            />
            <div className="space-y-1">
              {countOnlyEmployers.map((e) => (
                <Label
                  key={e.key}
                  htmlFor={`count-emp-${e.key}`}
                  className="flex cursor-pointer items-center gap-3 py-1 text-sm font-normal"
                >
                  <Checkbox
                    id={`count-emp-${e.key}`}
                    checked={selCountEmployers.has(e.key)}
                    onCheckedChange={() => onToggleCountEmployer(e.key)}
                  />
                  <span className="flex-1">{e.name}</span>
                </Label>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Bar
 * ------------------------------------------------------------------ */

export interface DefenseJobsFilterBarProps {
  facets: DefenseJobFacets;
  countOnlyEmployers: Option[];
  search: string;
  onSearchChange: (value: string) => void;
  selSectors: Set<string>;
  selEmployers: Set<string>;
  selRegions: Set<string>;
  selCountEmployers: Set<string>;
  remoteOnly: boolean;
  skillBridgeOnly: boolean;
  onToggleSector: (key: string) => void;
  onToggleEmployer: (key: string) => void;
  onToggleRegion: (key: string) => void;
  onToggleCountEmployer: (key: string) => void;
  onRemoteChange: (checked: boolean) => void;
  onSkillBridgeChange: (checked: boolean) => void;
  /** True when a city dot is selected on the map (drives the clear affordance). */
  citySelected: boolean;
  /** Filtered listing count. */
  total: number;
  resetAll: () => void;
}

export default function DefenseJobsFilterBar({
  facets,
  countOnlyEmployers,
  search,
  onSearchChange,
  selSectors,
  selEmployers,
  selRegions,
  selCountEmployers,
  remoteOnly,
  skillBridgeOnly,
  onToggleSector,
  onToggleEmployer,
  onToggleRegion,
  onToggleCountEmployer,
  onRemoteChange,
  onSkillBridgeChange,
  citySelected,
  total,
  resetAll,
}: DefenseJobsFilterBarProps) {
  const sectorOptions = React.useMemo<Option[]>(
    () => facets.sectors.map((s) => ({ key: s, name: s })),
    [facets.sectors]
  );
  const regionOptions = React.useMemo<Option[]>(
    () => facets.regions.map((r) => ({ key: r, name: r })),
    [facets.regions]
  );
  const employerOptions = facets.employers;
  const skillBridgeAvailable = facets.skillBridgeListings > 0;

  const moreCount =
    (remoteOnly ? 1 : 0) + (skillBridgeOnly ? 1 : 0) + selCountEmployers.size;

  const anyFilter =
    selSectors.size > 0 ||
    selEmployers.size > 0 ||
    selRegions.size > 0 ||
    selCountEmployers.size > 0 ||
    remoteOnly ||
    skillBridgeOnly ||
    citySelected ||
    search.trim().length > 0;

  // Active chips: one per selection, plus the toggle chips.
  type Chip = { id: string; label: string; onRemove: () => void };
  const chips: Chip[] = [];
  for (const key of selSectors)
    chips.push({ id: `sector-${key}`, label: key, onRemove: () => onToggleSector(key) });
  for (const key of selEmployers) {
    const name = employerOptions.find((e) => e.key === key)?.name ?? key;
    chips.push({ id: `emp-${key}`, label: name, onRemove: () => onToggleEmployer(key) });
  }
  for (const key of selRegions)
    chips.push({ id: `region-${key}`, label: key, onRemove: () => onToggleRegion(key) });
  if (remoteOnly)
    chips.push({ id: "remote", label: "Remote only", onRemove: () => onRemoteChange(false) });
  if (skillBridgeOnly)
    chips.push({
      id: "skillbridge",
      label: "Active SkillBridge",
      onRemove: () => onSkillBridgeChange(false),
    });
  for (const key of selCountEmployers) {
    const name = countOnlyEmployers.find((e) => e.key === key)?.name ?? key;
    chips.push({
      id: `count-${key}`,
      label: `${name} (map)`,
      onRemove: () => onToggleCountEmployer(key),
    });
  }

  const moreContent = (
    <MoreContent
      remoteOnly={remoteOnly}
      onRemoteChange={onRemoteChange}
      skillBridgeAvailable={skillBridgeAvailable}
      skillBridgeOnly={skillBridgeOnly}
      onSkillBridgeChange={onSkillBridgeChange}
      countOnlyEmployers={countOnlyEmployers}
      selCountEmployers={selCountEmployers}
      onToggleCountEmployer={onToggleCountEmployer}
    />
  );

  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
      <div className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="relative min-w-0 flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search title, company, city…"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="h-10 rounded-full pl-9"
            />
          </div>

          {/* Desktop popover row */}
          <div className="hidden min-w-0 flex-1 items-center gap-2 overflow-x-auto pb-1 md:flex">
            <MultiSelectPopover
              label="Sector"
              icon={Briefcase}
              options={sectorOptions}
              selected={selSectors}
              onToggle={onToggleSector}
            />
            <MultiSelectPopover
              label="Employer"
              icon={Building2}
              options={employerOptions}
              selected={selEmployers}
              onToggle={onToggleEmployer}
            />
            {regionOptions.length > 0 && (
              <MultiSelectPopover
                label="Region"
                icon={Globe2}
                options={regionOptions}
                selected={selRegions}
                onToggle={onToggleRegion}
              />
            )}

            <Drawer direction="right">
              <DrawerTrigger
                render={
                  <Button
                    variant="outline"
                    className={cn(
                      "h-10 shrink-0 gap-2 rounded-full px-4 shadow-none",
                      moreCount > 0 && "border-primary bg-primary/5 text-primary"
                    )}
                  >
                    <SlidersHorizontal className="size-4" />
                    More
                    {moreCount > 0 ? (
                      <Badge className="h-5 min-w-5 rounded-full px-1.5">
                        {moreCount}
                      </Badge>
                    ) : null}
                  </Button>
                }
              />
              <DrawerContent className="rounded-none">
                <DrawerHeader className="border-b">
                  <DrawerTitle>More filters</DrawerTitle>
                  <DrawerDescription>
                    Listing type and map cross-reference.
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
                        Show {total.toLocaleString()} listings
                      </Button>
                    }
                  />
                </DrawerFooter>
              </DrawerContent>
            </Drawer>
          </div>

          {/* Mobile: a single all-filters drawer */}
          <Drawer>
            <DrawerTrigger
              render={
                <Button className="shrink-0 gap-2 rounded-full md:hidden">
                  <SlidersHorizontal className="size-4" />
                  Filters
                </Button>
              }
            />
            <DrawerContent>
              <DrawerHeader className="border-b">
                <DrawerTitle>Search filters</DrawerTitle>
                <DrawerDescription>Filter defense job listings.</DrawerDescription>
              </DrawerHeader>
              <div className="min-h-0 flex-1 overflow-y-auto px-4">
                <div className="space-y-7 py-2">
                  <section className="space-y-3">
                    <SectionHeading title="Sector" />
                    <CheckList
                      options={sectorOptions}
                      selected={selSectors}
                      onToggle={onToggleSector}
                    />
                  </section>
                  <Separator />
                  <section className="space-y-3">
                    <SectionHeading title="Employer" />
                    <CheckList
                      options={employerOptions}
                      selected={selEmployers}
                      onToggle={onToggleEmployer}
                    />
                  </section>
                  {regionOptions.length > 0 && (
                    <>
                      <Separator />
                      <section className="space-y-3">
                        <SectionHeading title="Region" />
                        <CheckList
                          options={regionOptions}
                          selected={selRegions}
                          onToggle={onToggleRegion}
                        />
                      </section>
                    </>
                  )}
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
                    render={<Button>Show {total.toLocaleString()} listings</Button>}
                  />
                </div>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        </div>

        {chips.length > 0 ? (
          <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1">
            {chips.map((chip) => (
              <Badge
                key={chip.id}
                variant="secondary"
                className="h-8 shrink-0 gap-1 rounded-full pl-3 pr-1.5 font-medium"
              >
                <span className="max-w-48 truncate">{chip.label}</span>
                <button
                  type="button"
                  onClick={chip.onRemove}
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
        <div className="flex items-center justify-between gap-4 px-4 py-2 text-sm text-muted-foreground">
          <span>
            <span className="font-semibold text-foreground">
              {total.toLocaleString()}
            </span>{" "}
            of {facets.total.toLocaleString()} listings
          </span>
          {anyFilter ? (
            <button
              type="button"
              onClick={resetAll}
              className="text-primary hover:underline"
            >
              Clear filters
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
