"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type {
  ClientJobListing,
  DefenseJobCityPoint,
  DefenseJobFacets,
} from "@/lib/defense-jobs";
import DefenseJobsMap, {
  type CityPoint,
  type CountPoint,
} from "./DefenseJobsMap";

/** Client-side listing shape (camelCase mirror of DefenseJobListingRow). */
export type JobListing = ClientJobListing;

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

/** Build the query string the API routes expect from the current filter state. */
function buildParams(f: {
  sectors: Set<string>;
  employers: Set<string>;
  regions: Set<string>;
  remote: boolean;
  skillbridge: boolean;
  q: string;
  city: string | null;
}): URLSearchParams {
  const p = new URLSearchParams();
  if (f.sectors.size) p.set("sectors", [...f.sectors].join(","));
  if (f.employers.size) p.set("employers", [...f.employers].join(","));
  if (f.regions.size) p.set("regions", [...f.regions].join(","));
  if (f.remote) p.set("remote", "true");
  if (f.skillbridge) p.set("skillbridge", "true");
  if (f.q.trim()) p.set("q", f.q.trim());
  if (f.city) p.set("city", f.city);
  return p;
}

function skillBridgeTypeLabel(value: string | null): string {
  if (value === "direct_employer") return "Direct SkillBridge";
  if (value === "convertible_requisition") return "Convertible SkillBridge";
  if (value === "hiring_our_heroes") return "Hiring Our Heroes";
  if (value === "training_to_employment") return "Training pathway";
  if (value === "third_party_fellowship") return "Fellowship";
  if (value === "government_agency") return "Government SkillBridge";
  return "SkillBridge";
}

interface ListResponse {
  listings: JobListing[];
  total: number;
  page: number;
  pageSize: number;
}
interface MapResponse {
  cityPoints: DefenseJobCityPoint[];
}

export default function DefenseJobsExplorer({
  facets,
  initialListings,
  initialTotal,
  initialCityPoints,
  counts,
}: {
  facets: DefenseJobFacets;
  initialListings: JobListing[];
  initialTotal: number;
  initialCityPoints: DefenseJobCityPoint[];
  counts: EmployerCount[];
}) {
  // Filter state.
  const [selSectors, setSelSectors] = useState<Set<string>>(new Set());
  const [selEmployers, setSelEmployers] = useState<Set<string>>(new Set());
  const [selRegions, setSelRegions] = useState<Set<string>>(new Set());
  const [selCountEmployers, setSelCountEmployers] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [skillBridgeOnly, setSkillBridgeOnly] = useState(false);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);

  // Server-fed data state (seeded from the unfiltered initial render).
  const [items, setItems] = useState<JobListing[]>(initialListings);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(1);
  const [cityPoints, setCityPoints] = useState<CityPoint[]>(initialCityPoints);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // Debounce the free-text search so keystrokes don't each fire a request.
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 250);
    return () => clearTimeout(t);
  }, [search]);

  // Facet options come straight from the server (no longer derived from listings).
  const listingEmployerSlugs = useMemo(
    () => new Set(facets.employers.map((e) => e.key)),
    [facets.employers]
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

  const toggle = (set: Set<string>, key: string): Set<string> => {
    const next = new Set(set);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    return next;
  };

  // Monotonic request id so a slow response can never overwrite a newer one.
  const reqIdRef = useRef(0);
  const skipInitialRef = useRef(true);

  const currentParams = useCallback(
    () =>
      buildParams({
        sectors: selSectors,
        employers: selEmployers,
        regions: selRegions,
        remote: remoteOnly,
        skillbridge: skillBridgeOnly,
        q: debouncedSearch,
        city: selectedCity,
      }),
    [
      selSectors,
      selEmployers,
      selRegions,
      remoteOnly,
      skillBridgeOnly,
      debouncedSearch,
      selectedCity,
    ]
  );

  // Refetch page 1 + the map whenever a filter changes.
  useEffect(() => {
    if (skipInitialRef.current) {
      skipInitialRef.current = false;
      return;
    }
    const id = ++reqIdRef.current;
    const controller = new AbortController();
    setLoading(true);
    const params = currentParams();
    const listParams = new URLSearchParams(params);
    listParams.set("page", "1");
    Promise.all([
      fetch(`/api/defense-jobs?${listParams}`, { signal: controller.signal }).then(
        (r) => r.json() as Promise<ListResponse>
      ),
      fetch(`/api/defense-jobs/map?${params}`, { signal: controller.signal }).then(
        (r) => r.json() as Promise<MapResponse>
      ),
    ])
      .then(([list, map]) => {
        if (id !== reqIdRef.current) return;
        setItems(list.listings);
        setTotal(list.total);
        setPage(1);
        setCityPoints(map.cityPoints);
        setLoading(false);
      })
      .catch((err) => {
        if (err?.name === "AbortError" || id !== reqIdRef.current) return;
        setLoading(false);
      });
    return () => controller.abort();
  }, [currentParams]);

  const loadMore = useCallback(() => {
    if (loadingMore || items.length >= total) return;
    const id = reqIdRef.current; // must still match when the response lands
    const nextPage = page + 1;
    const params = currentParams();
    params.set("page", String(nextPage));
    setLoadingMore(true);
    fetch(`/api/defense-jobs?${params}`, {})
      .then((r) => r.json() as Promise<ListResponse>)
      .then((list) => {
        if (id !== reqIdRef.current) return; // a filter changed mid-flight
        setItems((prev) => [...prev, ...list.listings]);
        setTotal(list.total);
        setPage(nextPage);
        setLoadingMore(false);
      })
      .catch(() => setLoadingMore(false));
  }, [loadingMore, items.length, total, page, currentParams]);

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
    skillBridgeOnly ||
    selectedCity ||
    search.trim();

  const clearAll = () => {
    setSelSectors(new Set());
    setSelEmployers(new Set());
    setSelRegions(new Set());
    setRemoteOnly(false);
    setSkillBridgeOnly(false);
    setSelectedCity(null);
    setSearch("");
  };

  const onMap = cityPoints.reduce((n, p) => n + p.count, 0);

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
            <span className="font-semibold text-foreground">{total.toLocaleString()}</span>{" "}
            of {facets.total.toLocaleString()} listings
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
          {facets.sectors.map((s) => (
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
          {facets.employers.map((e) => (
            <Chip
              key={e.key}
              active={selEmployers.has(e.key)}
              onClick={() => setSelEmployers((p) => toggle(p, e.key))}
            >
              <span className="inline-flex items-center gap-1.5">
                {e.name}
                {e.skillBridgeActive ? (
                  <span className="rounded-full bg-primary-foreground/20 px-1.5 text-[10px] font-semibold uppercase tracking-wide">
                    SB
                  </span>
                ) : null}
              </span>
            </Chip>
          ))}
        </FilterGroup>

        <FilterGroup label="Region">
          {facets.regions.map((r) => (
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
          {facets.skillBridgeListings > 0 ? (
            <Chip
              active={skillBridgeOnly}
              onClick={() => setSkillBridgeOnly((v) => !v)}
            >
              Active SkillBridge
            </Chip>
          ) : null}
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
                {onMap.toLocaleString()} listings on map
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
          <div
            className={cn(
              "max-h-[min(64vh,640px)] space-y-3 overflow-y-auto rounded-2xl border bg-card p-4 shadow-sm transition-opacity",
              loading && "opacity-60"
            )}
          >
            {total === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No listings match these filters.
              </p>
            ) : (
              <>
                {items.map((j) => {
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
                      <p className="mt-0.5 text-sm text-muted-foreground">{loc}</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <Badge variant="secondary">{j.sector}</Badge>
                        {j.fieldRaw && j.fieldRaw !== j.sector && (
                          <Badge variant="outline">{j.fieldRaw}</Badge>
                        )}
                        {j.employmentType && (
                          <Badge variant="outline">{j.employmentType}</Badge>
                        )}
                        {j.skillBridgeStatus === "active" && (
                          <Badge variant="secondary">
                            {skillBridgeTypeLabel(j.skillBridgeParticipationType)}
                          </Badge>
                        )}
                      </div>
                    </a>
                  );
                })}
                {items.length < total && (
                  <button
                    type="button"
                    onClick={loadMore}
                    disabled={loadingMore}
                    className="w-full rounded-xl border border-dashed py-3 text-sm font-medium text-primary transition-colors hover:bg-muted/50 disabled:opacity-60"
                  >
                    {loadingMore
                      ? "Loading…"
                      : `Load more (${(total - items.length).toLocaleString()} more)`}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
