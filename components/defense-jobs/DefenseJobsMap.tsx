"use client";

import { useMemo, useState } from "react";
import { Map, MapControls, MapMarker, MarkerContent, MapPopup, useMap } from "@/components/ui/map";
import { cn } from "@/lib/utils";
import { DEFENSE_JOB_SECTORS } from "@/lib/defense-jobs-sectors";
import type { DefenseJobCityPoint } from "@/lib/defense-jobs";
import DefenseJobsDotLayer, { type DefenseJobsMapMode } from "./DefenseJobsDotLayer";
import { sectorColor } from "./sectorColors";

/** A city with individual listings. Re-exported for the explorer. */
export type CityPoint = DefenseJobCityPoint;

/** A city with only aggregate posting counts (tracked prime, no listings). Hollow. */
export interface CountPoint {
  key: string;
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

function markerSize(count: number): number {
  return Math.max(20, Math.min(56, 16 + Math.sqrt(count) * 4));
}

type Selection =
  | { kind: "city"; point: CityPoint }
  | { kind: "count"; point: CountPoint }
  | null;

/** Segmented Density / By sector control, overlaid top-left inside the map. */
function ModeToggle({
  mode,
  onChange,
}: {
  mode: DefenseJobsMapMode;
  onChange: (m: DefenseJobsMapMode) => void;
}) {
  const options: { value: DefenseJobsMapMode; label: string }[] = [
    { value: "clusters", label: "Density" },
    { value: "sectors", label: "By sector" },
  ];
  return (
    <div className="absolute left-2 top-2 z-10 flex overflow-hidden rounded-md border border-border bg-background shadow-sm">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={mode === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "px-2.5 py-1 text-xs font-medium transition-colors",
            mode === o.value
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** A theme-aware colored swatch for a sector (reads the map's resolved theme). */
function SectorDot({ sector, className }: { sector: string; className?: string }) {
  const { resolvedTheme } = useMap();
  return (
    <span
      className={cn("inline-block size-2.5 shrink-0 rounded-full", className)}
      style={{ backgroundColor: sectorColor(sector, resolvedTheme) }}
    />
  );
}

/** Sector color legend, overlaid bottom-left. */
function SectorLegend({ present }: { present: string[] }) {
  const rows = DEFENSE_JOB_SECTORS.filter((s) => present.includes(s));
  if (rows.length === 0) return null;
  return (
    <div className="absolute bottom-10 left-2 z-10 max-w-[45%] rounded-md border border-border bg-background/95 p-2 text-[11px] shadow-sm backdrop-blur-sm">
      <p className="mb-1 font-semibold text-muted-foreground">Dominant sector</p>
      <div className="grid grid-cols-1 gap-x-3 gap-y-0.5 sm:grid-cols-2">
        {rows.map((s) => (
          <div key={s} className="flex items-center gap-1.5">
            <SectorDot sector={s} />
            <span className="truncate text-foreground">{s}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DefenseJobsMap({
  cityPoints,
  countPoints,
  onSelectCity,
}: {
  cityPoints: CityPoint[];
  countPoints: CountPoint[];
  onSelectCity: (point: CityPoint) => void;
}) {
  const [selected, setSelected] = useState<Selection>(null);
  const [mode, setMode] = useState<DefenseJobsMapMode>("clusters");

  const cityByKey = useMemo(() => {
    const m = new globalThis.Map<string, CityPoint>();
    for (const p of cityPoints) m.set(p.key, p);
    return m;
  }, [cityPoints]);

  const presentSectors = useMemo(() => {
    const s = new Set(cityPoints.map((p) => p.dominantSector));
    return [...s];
  }, [cityPoints]);

  const handleCityClick = (key: string) => {
    const point = cityByKey.get(key);
    if (!point) return;
    setSelected({ kind: "city", point });
    onSelectCity(point);
  };

  return (
    <div className="relative h-[min(64vh,640px)] min-h-[420px]">
      <Map center={[-98, 39]} zoom={3.6} minZoom={2.4} maxZoom={16}>
        <MapControls showZoom showLocate />
        <ModeToggle mode={mode} onChange={setMode} />
        {mode === "sectors" && <SectorLegend present={presentSectors} />}

        {/* Aggregate-count markers (tracked primes, no listings) as dashed DOM markers. */}
        {countPoints.map((p) => (
          <MapMarker
            key={`count-${p.key}`}
            longitude={p.longitude}
            latitude={p.latitude}
            onClick={() => setSelected({ kind: "count", point: p })}
          >
            <MarkerContent>
              <div
                className="flex items-center justify-center rounded-full border-2 border-dashed border-muted-foreground/70 bg-background/80 text-[11px] font-semibold text-muted-foreground shadow-sm"
                style={{ width: markerSize(p.total), height: markerSize(p.total) }}
                title={`${p.displayName} — ${p.total} tracked openings (aggregate counts)`}
              >
                {p.total}
              </div>
            </MarkerContent>
          </MapMarker>
        ))}

        {/* Listing city dots as GL layers (clustered or sector-colored). */}
        <DefenseJobsDotLayer
          points={cityPoints}
          mode={mode}
          onCityClick={handleCityClick}
        />

        {selected?.kind === "city" && (
          <MapPopup
            longitude={selected.point.longitude}
            latitude={selected.point.latitude}
            onClose={() => setSelected(null)}
            closeButton
          >
            <h3 className="text-base font-semibold">
              {selected.point.city}, {selected.point.state}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {selected.point.count} open listing{selected.point.count === 1 ? "" : "s"}
            </p>
            {mode === "sectors" && selected.point.sectors.length > 0 && (
              <div className="mt-2 flex flex-col gap-0.5 border-t pt-2 text-sm">
                <p className="mb-0.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  By sector
                </p>
                {selected.point.sectors.map((s) => (
                  <div key={s.sector} className="flex items-center justify-between gap-4">
                    <span className="flex items-center gap-1.5">
                      <SectorDot sector={s.sector} className="size-2" />
                      {s.sector}
                    </span>
                    <span className="text-muted-foreground">{s.count}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-2 flex flex-col gap-0.5 border-t pt-2 text-sm">
              <p className="mb-0.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                By employer
              </p>
              {selected.point.employers.map((e) => (
                <div key={e.name} className="flex justify-between gap-4">
                  <span>{e.name}</span>
                  <span className="text-muted-foreground">{e.count}</span>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => onSelectCity(selected.point)}
              className="mt-3 border-t pt-2 text-sm font-semibold text-primary hover:underline"
            >
              Show these in the list →
            </button>
          </MapPopup>
        )}

        {selected?.kind === "count" && (
          <MapPopup
            longitude={selected.point.longitude}
            latitude={selected.point.latitude}
            onClose={() => setSelected(null)}
            closeButton
          >
            <h3 className="text-base font-semibold">{selected.point.displayName}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {selected.point.city}, {selected.point.state}
            </p>
            <div className="mt-2 flex flex-col gap-0.5 text-sm">
              <div className="flex justify-between gap-4">
                <span>Onsite</span>
                <span className="text-muted-foreground">{selected.point.onsite}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span>Hybrid</span>
                <span className="text-muted-foreground">{selected.point.hybrid}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span>Remote</span>
                <span className="text-muted-foreground">{selected.point.remote}</span>
              </div>
              <div className="flex justify-between gap-4 border-t pt-1 font-semibold">
                <span>Total</span>
                <span>{selected.point.total}</span>
              </div>
            </div>
            <p className="mt-2 border-t pt-2 text-xs text-muted-foreground">
              Aggregate posting counts we track for this employer — no individual
              listings yet.
            </p>
          </MapPopup>
        )}
      </Map>
    </div>
  );
}
