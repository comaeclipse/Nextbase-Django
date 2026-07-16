"use client";

import dynamic from "next/dynamic";
import type { MappedLocation } from "./LocationsMap";
import styles from "./LocationsMap.module.css";

function MapLoadingFallback() {
  return (
    <div className={styles.mapFrame} aria-busy="true" aria-live="polite">
      <div className={styles.mapHeader}>
        <div>
          <p className={styles.kicker}>UNITED STATES</p>
          <h2>Interactive location map</h2>
        </div>
      </div>
      <div className={styles.mapViewport}>
        <div
          style={{
            display: "grid",
            height: "100%",
            placeItems: "center",
            color: "#334155",
            textAlign: "center",
          }}
        >
          <div>
            <strong>Preparing the interactive map…</strong>
            <p style={{ margin: "8px 0 0", fontSize: "0.875rem" }}>
              City guides remain available while the map loads.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// MapLibre requires WebGL and browser APIs. Keeping its boundary here prevents
// it from blocking the server-rendered route or the rest of its JS hydration.
const InteractiveLocationsMap = dynamic(() => import("./LocationsMap"), {
  ssr: false,
  loading: MapLoadingFallback,
});

export default function LocationsMapExperience({ locations }: { locations: MappedLocation[] }) {
  return <InteractiveLocationsMap locations={locations} />;
}
