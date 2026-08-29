"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import DefenseJobsMap, {
  type CityPoint,
  type CountPoint,
} from "./DefenseJobsMap";

/** Client-side listing shape (camelCase mirror of DefenseJobListingRow). */
export interface JobListing {
  id: number;
  company: string;
  employerSlug: string | null;
  title: string;
  fieldRaw: string | null;
  sector: string;
  city: string | null;
  state: string | null;
  region: string | null;
  isRemote: boolean;
  latitude: number | null;
  longitude: number | null;
  employmentType: string | null;
  payMin: number | null;
  payMax: number | null;
  payInterval: string | null;
  education: string | null;
  url: string;
}

/** Client-side aggregate count shape (camelCase mirror of DefenseEmployerCityCount). */
export interface EmployerCount {
  employerSlug: string;
  displayName: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  onsite: number;
  hybrid: number;
  remote: number;
  total: number;
}

const employerKey = (j: JobListing) => j.employerSlug ?? j.company;
const cityKey = (city: string | null, state: string | null) =>
  city && state ? `${city}|${state}` : null;

function formatPay(j: JobListing): string | null {
  if (j.payMin == null && j.payMax == null) return null;
  const unit =
    j.payInterval === "hour"
      ? "/hr"
      : j.payInterval === "month"
        ? "/mo"
        : j.payInterval === "year"
          ? "/yr"
          : "";
  const fmt = (n: number) =>
    j.payInterval === "hour"
      ? `$${n.toFixed(0)}`
      : n >= 1000
        ? `$${Math.round(n / 1000)}k`
        : `$${n}`;
  if (j.payMin != null && j.payMax != null && j.payMin !== j.payMax) {
    return `${fmt(j.payMin)}–${fmt(j.payMax)}${unit}`;
  }
  return `${fmt(j.payMin ?? j.payMax!)}${unit}`;
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-sm transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background text-foreground hover:bg-muted"
      )}
    >
      {children}
    </button>
  );
}

function FilterGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

export default function DefenseJobsExplorer({
  listings,
  counts,
}: {
  listings: JobListing[];
  counts: EmployerCount[];
}) {
  const [selSectors, setSelSectors] = useState<Set<string>>(new Set());
  const [selEmployers, setSelEmployers] = useState<Set<string>>(new Set());
  const [selRegions, setSelRegions] = useState<Set<string>>(new Set());
  const [selCountEmployers, setSelCountEmployers] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);

  // Facet options derived once from the data.
  const listingEmployers = useMemo(() => {
    const m = new Map<string, string>();
    for (const j of listings) m.set(employerKey(j), j.company);
    return [...m.entries()]
      .map(([key, name]) => ({ key, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [listings]);

  const listingEmployerSlugs = useMemo(
    () => new Set(listings.map((j) => j.employerSlug).filter(Boolean) as string[]),
    [listings]
  );

  // Employers we track only as aggregate counts (no individual listings).
  const countOnlyEmployers = useMemo(() => {
    const m = new Map<string, string>();
    for (const c of counts) {
      if (!listingEmployerSlugs.has(c.employerSlug)) {
        m.set(c.employerSlug, c.displayName);
      }
    }
    return [...m.entries()]
      .map(([slug, name]) => ({ slug, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [counts, listingEmployerSlugs]);

  const sectorsPresent = useMemo(() => {
    const s = new Set(listings.map((j) => j.sector));
    return [...s].sort();
  }, [listings]);

  const regionsPresent = useMemo(() => {
    const s = new Set(listings.map((j) => j.region).filter(Boolean) as string[]);
    return [...s].sort();
  }, [listings]);

  const toggle = (set: Set<string>, key: string): Set<string> => {
    const next = new Set(set);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    return next;
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return listings.filter((j) => {
      if (selSectors.size && !selSectors.has(j.sector)) return false;
      if (selEmployers.size && !selEmployers.has(employerKey(j))) return false;
      if (selRegions.size && (!j.region || !selRegions.has(j.region))) return false;
      if (remoteOnly && !j.isRemote) return false;
      if (selectedCity && cityKey(j.city, j.state) !== selectedCity) return false;
      if (q) {
        const hay = `${j.title} ${j.company} ${j.city ?? ""} ${j.fieldRaw ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [listings, selSectors, selEmployers, selRegions, remoteOnly, selectedCity, search]);

  const cityPoints = useMemo<CityPoint[]>(() => {
    const m = new Map<string, CityPoint & { _emp: Map<string, number> }>();
    for (const j of filtered) {
      if (j.latitude == null || j.longitude == null || !j.city || !j.state) continue;
      const key = `${j.city}|${j.state}`;
      let entry = m.get(key);
      if (!entry) {
        entry = {
          key,
          city: j.city,
          state: j.state,
          latitude: j.latitude,
          longitude: j.longitude,
          count: 0,
          employers: [],
          _emp: new Map(),
        };
        m.set(key, entry);
      }
      entry.count += 1;
      entry._emp.set(j.company, (entry._emp.get(j.company) ?? 0) + 1);
    }
    return [...m.values()].map((e) => ({
      key: e.key,
      city: e.city,
      state: e.state,
      latitude: e.latitude,
      longitude: e.longitude,
      count: e.count,
      employers: [...e._emp.entries()]
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count),
    }));
  }, [filtered]);

  const countPoints = useMemo<CountPoint[]>(() => {
    if (!selCountEmployers.size) return [];
    return counts
      .filter((c) => selCountEmployers.has(c.employerSlug))
      .map((c) => ({
        key: `${c.employerSlug}-${c.city}-${c.state}`,
        displayName: c.displayName,
        city: c.city,
        state: c.state,
        latitude: c.latitude,
        longitude: c.longitude,
        onsite: c.onsite,
        hybrid: c.hybrid,
        remote: c.remote,
        total: c.total,
      }));
  }, [counts, selCountEmployers]);

  const anyFilter =
    selSectors.size ||
    selEmployers.size ||
    selRegions.size ||
    remoteOnly ||
    selectedCity ||
    search.trim();

  const clearAll = () => {
    setSelSectors(new Set());
    setSelEmployers(new Set());
    setSelRegions(new Set());
    setRemoteOnly(false);
    setSelectedCity(null);
    setSearch("");
  };

  return (
    <div className="space-y-5">
      {/* Filter bar */}
      <div className="space-y-4 rounded-2xl border bg-card p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Input
            placeholder="Search title, company, city…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="sm:max-w-xs"
          />
          <div className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{filtered.length.toLocaleString()}</span>{" "}
            of {listings.length.toLocaleString()} listings
            {anyFilter ? (
              <button
                type="button"
                onClick={clearAll}
                className="ml-3 text-primary hover:underline"
              >
                Clear filters
              </button>
            ) : null}
          </div>
        </div>

        <FilterGroup label="Sector">
          {sectorsPresent.map((s) => (
            <Chip
              key={s}
              active={selSectors.has(s)}
              onClick={() => setSelSectors((p) => toggle(p, s))}
            >
              {s}
            </Chip>
          ))}
        </FilterGroup>

        <FilterGroup label="Employer">
          {listingEmployers.map((e) => (
            <Chip
              key={e.key}
              active={selEmployers.has(e.key)}
              onClick={() => setSelEmployers((p) => toggle(p, e.key))}
            >
              {e.name}
            </Chip>
          ))}
        </FilterGroup>

        <FilterGroup label="Region">
          {regionsPresent.map((r) => (
            <Chip
              key={r}
              active={selRegions.has(r)}
              onClick={() => setSelRegions((p) => toggle(p, r))}
            >
              {r}
            </Chip>
          ))}
          <Chip active={remoteOnly} onClick={() => setRemoteOnly((v) => !v)}>
            Remote only
          </Chip>
        </FilterGroup>

        {countOnlyEmployers.length > 0 && (
          <FilterGroup label="Cross-reference on map (aggregate counts, no listings yet)">
            {countOnlyEmployers.map((e) => (
              <Chip
                key={e.slug}
                active={selCountEmployers.has(e.slug)}
                onClick={() => setSelCountEmployers((p) => toggle(p, e.slug))}
              >
                {e.name}
              </Chip>
            ))}
          </FilterGroup>
        )}
      </div>

      {/* Map + list */}
      <div className="grid gap-5 lg:grid-cols-5">
        <div className="overflow-hidden rounded-2xl border bg-card shadow-sm lg:col-span-3">
          <div className="flex items-center justify-between gap-4 border-b px-5 py-3">
            <div>
              <p className="text-xs font-bold tracking-widest text-primary">UNITED STATES</p>
              <h2 className="text-lg font-semibold">
                {cityPoints.reduce((n, p) => n + p.count, 0).toLocaleString()} listings on map
              </h2>
            </div>
            {selectedCity && (
              <button
                type="button"
                onClick={() => setSelectedCity(null)}
                className="text-sm text-primary hover:underline"
              >
                Clear city ×
              </button>
            )}
          </div>
          <DefenseJobsMap
            cityPoints={cityPoints}
            countPoints={countPoints}
            onSelectCity={(p) => setSelectedCity(p.key)}
          />
          <p className="px-5 py-3 text-xs text-muted-foreground">
            Solid dots are individual job listings, sized by count. Dashed rings are
            aggregate posting counts for defense employers we track but have no
            individual listings for yet. International listings appear in the list
            below, not on this US map.
          </p>
        </div>

        <div className="lg:col-span-2">
          <div className="max-h-[min(64vh,640px)] space-y-3 overflow-y-auto rounded-2xl border bg-card p-4 shadow-sm">
            {filtered.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No listings match these filters.
              </p>
            ) : (
              filtered.map((j) => {
                const pay = formatPay(j);
                const loc = j.isRemote
                  ? "Remote"
                  : [j.city, j.state].filter(Boolean).join(", ") ||
                    j.region ||
                    "—";
                return (
                  <a
                    key={j.id}
                    href={j.url}
                    target="_blank"
                    rel="noreferrer"
                    className="block rounded-xl border p-3 transition-colors hover:bg-muted/50"
                  >
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-primary">
                      {j.company}
                    </p>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-semibold leading-snug">{j.title}</h3>
                      {pay && (
                        <span className="shrink-0 text-xs font-semibold text-primary">
                          {pay}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {loc}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <Badge variant="secondary">{j.sector}</Badge>
                      {j.fieldRaw && j.fieldRaw !== j.sector && (
                        <Badge variant="outline">{j.fieldRaw}</Badge>
                      )}
                      {j.employmentType && (
                        <Badge variant="outline">{j.employmentType}</Badge>
                      )}
                    </div>
                  </a>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
