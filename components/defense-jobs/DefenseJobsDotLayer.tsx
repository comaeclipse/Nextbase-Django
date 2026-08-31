"use client";

import { useEffect, useMemo, useRef } from "react";
import type * as GeoJSON from "geojson";
import type * as MapLibreGL from "maplibre-gl";
import { useMap } from "@/components/ui/map";
import { sectorColorExpression } from "./sectorColors";
import type { DefenseJobCityPoint } from "@/lib/defense-jobs";

/*
 * The listing dots for /defense-jobs, drawn as MapLibre GL layers over a single
 * GeoJSON source (the DOM-marker approach can't survive clustering or thousands
 * of points — same reason the mosques map uses GL layers; see MosqueDotLayer).
 *
 * Two modes:
 *   clusters  RTX-style: nearby cities collapse into count bubbles (summed
 *             listing counts) that split as you zoom; single neutral hue.
 *   sectors   datawrapper-style: unclustered dots colored by each city's
 *             dominant sector, paired with an always-on legend + click-through
 *             breakdown (color is never the only channel — see sectorColors.ts).
 *
 * The source's `cluster` option can't be toggled in place, so switching mode (or
 * theme) tears the source + layers down and rebuilds them; data-only changes go
 * through setData.
 */

const TEXT_FONT = ["Open Sans Regular"];
const CLUSTER_COLOR = { light: "#2a78d6", dark: "#3987e5" } as const;

export type DefenseJobsMapMode = "clusters" | "sectors";

export interface CityFeatureProps {
  key: string;
  count: number;
  dominantSector: string;
}

function toGeoJSON(
  points: DefenseJobCityPoint[]
): GeoJSON.FeatureCollection<GeoJSON.Point, CityFeatureProps> {
  return {
    type: "FeatureCollection",
    features: points.map((p) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [p.longitude, p.latitude] },
      properties: { key: p.key, count: p.count, dominantSector: p.dominantSector },
    })),
  };
}

// sqrt-ish radius ramps so a 1000-listing city isn't 1000× the area of a 1.
const CLUSTER_RADIUS: MapLibreGL.ExpressionSpecification = [
  "interpolate", ["linear"], ["get", "sum"],
  1, 14, 25, 20, 100, 28, 500, 38, 2000, 48,
];
const POINT_RADIUS: MapLibreGL.ExpressionSpecification = [
  "interpolate", ["linear"], ["get", "count"],
  1, 7, 10, 11, 50, 18, 200, 26, 1000, 36,
];

export default function DefenseJobsDotLayer({
  points,
  mode,
  onCityClick,
}: {
  points: DefenseJobCityPoint[];
  mode: DefenseJobsMapMode;
  onCityClick: (key: string, lngLat: [number, number]) => void;
}) {
  const { map, isLoaded, resolvedTheme: theme } = useMap();
  const sourceId = "defense-jobs-src";
  const clustersId = "defense-jobs-clusters";
  const clusterCountId = "defense-jobs-cluster-count";
  const pointsId = "defense-jobs-points";
  const pointCountId = "defense-jobs-point-count";

  const data = useMemo(() => toGeoJSON(points), [points]);

  // Latest data for the (re)build effect, which is keyed on mode/theme — not on
  // data — so it doesn't rebuild the source on every filter change; the separate
  // setData effect below handles data-only updates.
  const dataRef = useRef(data);
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  const clickRef = useRef(onCityClick);
  useEffect(() => {
    clickRef.current = onCityClick;
  }, [onCityClick]);

  // Build (and rebuild on mode/theme change) the source + layers.
  useEffect(() => {
    if (!isLoaded || !map) return;
    const clustered = mode === "clusters";
    const fill = clustered
      ? CLUSTER_COLOR[theme]
      : (sectorColorExpression(theme) as MapLibreGL.ExpressionSpecification);

    map.addSource(sourceId, {
      type: "geojson",
      data: dataRef.current,
      ...(clustered
        ? {
            cluster: true,
            // Tight radius so isolated small-count cities (a lone "1" or "5")
            // stay visible as their own dots at the national default zoom
            // instead of being absorbed into a nearby cluster.
            clusterRadius: 28,
            clusterMaxZoom: 11,
            // Sum the listing counts within each cluster (not city count).
            clusterProperties: { sum: ["+", ["get", "count"]] },
          }
        : {}),
    });

    if (clustered) {
      map.addLayer({
        id: clustersId,
        type: "circle",
        source: sourceId,
        filter: ["has", "point_count"],
        paint: {
          "circle-color": CLUSTER_COLOR[theme],
          "circle-radius": CLUSTER_RADIUS,
          "circle-opacity": 0.9,
          "circle-stroke-width": 2,
          "circle-stroke-color": theme === "dark" ? "#0b0b0b" : "#ffffff",
        },
      });
      map.addLayer({
        id: clusterCountId,
        type: "symbol",
        source: sourceId,
        filter: ["has", "point_count"],
        layout: {
          "text-field": ["number-format", ["get", "sum"], {}],
          "text-font": TEXT_FONT,
          "text-size": 12,
          "text-allow-overlap": true,
        },
        paint: { "text-color": "#ffffff" },
      });
    }

    // Unclustered / all points.
    map.addLayer({
      id: pointsId,
      type: "circle",
      source: sourceId,
      ...(clustered ? { filter: ["!", ["has", "point_count"]] } : {}),
      paint: {
        "circle-color": fill,
        "circle-radius": POINT_RADIUS,
        "circle-opacity": 0.9,
        "circle-stroke-width": 2,
        "circle-stroke-color": theme === "dark" ? "#0b0b0b" : "#ffffff",
      },
    });
    map.addLayer({
      id: pointCountId,
      type: "symbol",
      source: sourceId,
      ...(clustered ? { filter: ["!", ["has", "point_count"]] } : {}),
      layout: {
        "text-field": ["number-format", ["get", "count"], {}],
        "text-font": TEXT_FONT,
        "text-size": 11,
        "text-allow-overlap": true,
      },
      paint: {
        "text-color": "#ffffff",
        "text-halo-color": theme === "dark" ? "#0b0b0b" : "rgba(0,0,0,0.35)",
        "text-halo-width": 0.8,
      },
    });

    const enter = () => {
      map.getCanvas().style.cursor = "pointer";
    };
    const leave = () => {
      map.getCanvas().style.cursor = "";
    };

    const handlePointClick = (
      e: MapLibreGL.MapMouseEvent & { features?: MapLibreGL.MapGeoJSONFeature[] }
    ) => {
      const f = e.features?.[0];
      if (!f) return;
      const key = String((f.properties as CityFeatureProps).key);
      const [lng, lat] = (f.geometry as GeoJSON.Point).coordinates as [number, number];
      clickRef.current(key, [lng, lat]);
    };

    const handleClusterClick = async (
      e: MapLibreGL.MapMouseEvent & { features?: MapLibreGL.MapGeoJSONFeature[] }
    ) => {
      const f = e.features?.[0];
      if (!f) return;
      const clusterId = f.properties?.cluster_id;
      const src = map.getSource(sourceId) as MapLibreGL.GeoJSONSource;
      try {
        const zoom = await src.getClusterExpansionZoom(clusterId);
        const [lng, lat] = (f.geometry as GeoJSON.Point).coordinates as [number, number];
        map.easeTo({ center: [lng, lat], zoom, duration: 400 });
      } catch {
        // ignore — cluster may have changed under us
      }
    };

    map.on("mouseenter", pointsId, enter);
    map.on("mouseleave", pointsId, leave);
    map.on("click", pointsId, handlePointClick);
    if (clustered) {
      map.on("mouseenter", clustersId, enter);
      map.on("mouseleave", clustersId, leave);
      map.on("click", clustersId, handleClusterClick);
    }

    return () => {
      try {
        map.off("mouseenter", pointsId, enter);
        map.off("mouseleave", pointsId, leave);
        map.off("click", pointsId, handlePointClick);
        map.off("mouseenter", clustersId, enter);
        map.off("mouseleave", clustersId, leave);
        map.off("click", clustersId, handleClusterClick);
        for (const id of [pointCountId, pointsId, clusterCountId, clustersId]) {
          if (map.getLayer(id)) map.removeLayer(id);
        }
        if (map.getSource(sourceId)) map.removeSource(sourceId);
      } catch {
        // style may be mid-reload
      }
    };
  }, [isLoaded, map, mode, theme]);

  // Data-only updates (filter changes) without a source rebuild.
  useEffect(() => {
    if (!isLoaded || !map) return;
    const src = map.getSource(sourceId) as MapLibreGL.GeoJSONSource | undefined;
    src?.setData(data);
  }, [isLoaded, map, data]);

  return null;
}
