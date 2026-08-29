"use client";

import { useState } from "react";
import { Map, MapControls, MapMarker, MarkerContent, MapPopup } from "@/components/ui/map";

/** A city with individual listings (from the CSV). Filled, sized by count. */
export interface CityPoint {
  key: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  count: number;
  /** Per-employer listing counts in this city, for the popup. */
  employers: { name: string; count: number }[];
}

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
  // sqrt scale so a city with 100 jobs isn't 100× the area of one with 1.
  return Math.max(20, Math.min(56, 16 + Math.sqrt(count) * 4));
}

type Selection =
  | { kind: "city"; point: CityPoint }
  | { kind: "count"; point: CountPoint }
  | null;

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

  return (
    <div className="relative h-[min(64vh,640px)] min-h-[420px]">
      <Map center={[-98, 39]} zoom={3.6} minZoom={2.4} maxZoom={16}>
        <MapControls showZoom showLocate />

        {/* Aggregate-count markers first (underneath the listing dots). */}
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

        {/* Listing city dots on top. */}
        {cityPoints.map((p) => (
          <MapMarker
            key={`city-${p.key}`}
            longitude={p.longitude}
            latitude={p.latitude}
            onClick={() => {
              setSelected({ kind: "city", point: p });
              onSelectCity(p);
            }}
          >
            <MarkerContent>
              <div
                className="flex items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground shadow-md ring-2 ring-background transition-transform hover:scale-110"
                style={{ width: markerSize(p.count), height: markerSize(p.count) }}
                title={`${p.city}, ${p.state} — ${p.count} listings`}
              >
                {p.count}
              </div>
            </MarkerContent>
          </MapMarker>
        ))}

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
            <div className="mt-2 flex flex-col gap-0.5 text-sm">
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
