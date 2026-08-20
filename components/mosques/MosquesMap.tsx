"use client";

import { useMemo, useState } from "react";
import type * as GeoJSON from "geojson";
import { Map, MapControls, MapPopup } from "@/components/ui/map";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import MosqueDotLayer, { type MosqueLayerMode } from "./MosqueDotLayer";

export interface MappedMosque {
  id: number;
  name: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  latitude: number;
  longitude: number;
  phone: string | null;
  website: string | null;
  sourceUrl: string | null;
}

type MosqueProperties = { id: number };

export default function MosquesMap({ mosques }: { mosques: MappedMosque[] }) {
  const [selected, setSelected] = useState<MappedMosque | null>(null);
  const [mode, setMode] = useState<MosqueLayerMode>("dots");
  const byId = useMemo(() => {
    const index: Record<number, MappedMosque> = {};
    for (const mosque of mosques) index[mosque.id] = mosque;
    return index;
  }, [mosques]);

  const geojson = useMemo<GeoJSON.FeatureCollection<GeoJSON.Point, MosqueProperties>>(
    () => ({
      type: "FeatureCollection",
      features: mosques.map((m) => ({
        type: "Feature",
        properties: { id: m.id },
        geometry: { type: "Point", coordinates: [m.longitude, m.latitude] },
      })),
    }),
    [mosques]
  );

  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
      <div className="flex items-center justify-between gap-4 border-b px-6 py-4">
        <div>
          <p className="text-xs font-bold tracking-widest text-primary">UNITED STATES</p>
          <h2 className="text-lg font-semibold">{mosques.length.toLocaleString()} mosques</h2>
        </div>
        <ToggleGroup
          value={[mode]}
          onValueChange={(values: string[]) =>
            setMode((values[0] as MosqueLayerMode) ?? "dots")
          }
          variant="outline"
          spacing={0}
          aria-label="Map display mode"
        >
          <ToggleGroupItem value="dots">Dots</ToggleGroupItem>
          <ToggleGroupItem value="heatmap">Heatmap</ToggleGroupItem>
        </ToggleGroup>
      </div>

      <div className="relative h-[min(69vh,680px)] min-h-[460px]">
        <Map center={[-98, 39]} zoom={3.3} minZoom={2.4} maxZoom={16}>
          <MapControls showZoom showLocate />
          <MosqueDotLayer<MosqueProperties>
            data={geojson}
            mode={mode}
            onPointClick={(feature) => {
              const mosque = byId[feature.properties.id];
              if (mosque) setSelected(mosque);
            }}
          />
          {selected && (
            <MapPopup
              longitude={selected.longitude}
              latitude={selected.latitude}
              onClose={() => setSelected(null)}
              closeButton
            >
              <h3 className="text-base font-semibold">{selected.name ?? "Mosque"}</h3>
              {(selected.address || selected.city || selected.state) && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {[selected.address, [selected.city, selected.state].filter(Boolean).join(", ")]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              )}
              {selected.phone && (
                <p className="mt-1 text-sm text-muted-foreground">{selected.phone}</p>
              )}
              {(selected.website || selected.sourceUrl) && (
                <div className="mt-3 flex flex-col gap-1 border-t pt-2 text-sm">
                  {selected.website && (
                    <a
                      href={selected.website}
                      target="_blank"
                      rel="noreferrer"
                      className="font-semibold text-primary hover:underline"
                    >
                      Visit website
                    </a>
                  )}
                  {selected.sourceUrl && (
                    <a
                      href={selected.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-muted-foreground hover:underline"
                    >
                      View on OpenStreetMap
                    </a>
                  )}
                </div>
              )}
            </MapPopup>
          )}
        </Map>
      </div>

      <p className="px-6 py-3 text-center text-xs text-muted-foreground">
        Mosque data ©{" "}
        <a
          href="https://www.openstreetmap.org/copyright"
          target="_blank"
          rel="noreferrer"
          className="underline"
        >
          OpenStreetMap contributors
        </a>
        , ODbL. Missing or incorrect? Edit it on OpenStreetMap.
      </p>
    </div>
  );
}
