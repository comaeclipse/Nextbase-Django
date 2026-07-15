"use client";

import Link from "next/link";
import { Compass, Minus, Plus, ShieldCheck } from "lucide-react";
import {
  Map,
  MapMarker,
  MarkerContent,
  MarkerPopup,
  MarkerTooltip,
  useMap,
} from "@/components/ui/map";
import styles from "./LocationsMap.module.css";

type Pace = "urban" | "suburban" | "small_town" | "rural" | null;

export interface MappedLocation {
  id: number;
  name: string;
  state: string;
  latitude: number;
  longitude: number;
  pace: Pace;
  climate: string | null;
  costOfLiving: string;
  homeValue: string | null;
  defenseHub: boolean | null;
}

const paceMeta: Record<Exclude<Pace, null>, { label: string; color: string }> = {
  urban: { label: "Urban", color: "#2563eb" },
  suburban: { label: "Suburban", color: "#8b5cf6" },
  small_town: { label: "Small Town", color: "#0f9d79" },
  rural: { label: "Rural", color: "#b7791f" },
};

function PaceBadge({ pace }: { pace: Pace }) {
  if (!pace) return null;
  const meta = paceMeta[pace];
  return (
    <span className={styles.paceBadge} style={{ backgroundColor: `${meta.color}16`, color: meta.color }}>
      {meta.label}
    </span>
  );
}

function MapToolbar() {
  const { map, isLoaded } = useMap();
  if (!map || !isLoaded) return null;

  return (
    <div className={styles.controls} aria-label="Map controls">
      <button type="button" aria-label="Zoom in" onClick={() => map.zoomIn()}>
        <Plus size={17} strokeWidth={2.5} />
      </button>
      <button type="button" aria-label="Zoom out" onClick={() => map.zoomOut()}>
        <Minus size={17} strokeWidth={2.5} />
      </button>
      <button
        type="button"
        aria-label="Return to United States view"
        className={styles.reset}
        onClick={() => map.easeTo({ center: [-99, 38], zoom: 2.25, duration: 650 })}
      >
        <Compass size={17} strokeWidth={2.25} />
      </button>
    </div>
  );
}

export default function LocationsMap({ locations }: { locations: MappedLocation[] }) {
  return (
    <div className={styles.mapFrame}>
      <div className={styles.mapHeader}>
        <div>
          <p className={styles.kicker}>UNITED STATES</p>
          <h2>{locations.length} curated locations</h2>
        </div>
        <div className={styles.legend} aria-label="Pace legend">
          {(Object.keys(paceMeta) as Exclude<Pace, null>[]).map((pace) => (
            <span key={pace}>
              <i style={{ backgroundColor: paceMeta[pace].color }} />
              {paceMeta[pace].label}
            </span>
          ))}
        </div>
      </div>

      <div className={styles.mapViewport}>
        <Map
          className={styles.mapCanvas}
          center={[-99, 38]}
          zoom={2.25}
          minZoom={1.6}
          maxZoom={13}
          styles={{
            light: "https://tiles.openfreemap.org/styles/bright",
            dark: "https://tiles.openfreemap.org/styles/bright",
          }}
        >
          <MapToolbar />
          {locations.map((location) => {
            const meta = location.pace ? paceMeta[location.pace] : null;
            const color = meta?.color ?? "#64748b";
            return (
              <MapMarker
                key={location.id}
                longitude={location.longitude}
                latitude={location.latitude}
                anchor="bottom"
              >
                <MarkerContent>
                  <button
                    type="button"
                    className={styles.marker}
                    aria-label={`Open ${location.name}, ${location.state}`}
                    style={{ "--marker-color": color } as React.CSSProperties}
                  >
                    <span />
                  </button>
                </MarkerContent>
                <MarkerTooltip className={styles.tooltip}>
                  {location.name}, {location.state}
                </MarkerTooltip>
                <MarkerPopup className={styles.popup} closeButton>
                  <div className={styles.popupTopline}>
                    <span>{location.state}</span>
                    <PaceBadge pace={location.pace} />
                  </div>
                  <h3>{location.name}</h3>
                  <p>
                    {location.climate || "Climate details available"} · {location.costOfLiving} cost
                  </p>
                  {location.defenseHub && (
                    <p className={styles.defenseLine}>
                      <ShieldCheck size={14} /> Defense-employment signal
                    </p>
                  )}
                  <Link href={`/city/${location.id}`} className={styles.cityLink}>
                    View city guide <span aria-hidden="true">→</span>
                  </Link>
                </MarkerPopup>
              </MapMarker>
            );
          })}
        </Map>
      </div>

      <p className={styles.mapFootnote}>
        Marker locations use U.S. Census Bureau 2024 Gazetteer place internal points.
      </p>
    </div>
  );
}
