"use client";

import { useEffect, useRef } from "react";
import type * as GeoJSON from "geojson";
import type * as MapLibreGL from "maplibre-gl";
import { useMap } from "@/components/ui/map";

/*
 * Point rendering copied from maps.deflock.org (the MapLibre map, NOT the
 * legacy Leaflet/markercluster one). Three unclustered circle layers over a
 * single source, crossfading by zoom:
 *
 *   heat   a plasma-ramp density surface, opaque until z11 and gone by z14
 *   glow   a blurred halo that only appears once you're zoomed in past z8
 *   dots   the tiny dots that carry the national view, faded out by z10
 *   points the full marker with a stroke, faded IN from z9.6 -- the clickable one
 *
 * The paint expressions below are deflock's verbatim, including the heatmap --
 * which exists in their style but is pinned to visibility:none and has no UI, so
 * the toggle behavior here is ours, not theirs. Two deliberate departures:
 *   - `dots` is also click-bound, since our map opens at z3.3 and deflock's is
 *     unclickable that far out.
 *   - heatmap mode keeps `points` on. Heatmap opacity ramps to 0 by z14, so
 *     without it the map would go blank exactly where you want detail; `points`
 *     fades in at z9.6, which dovetails with the heatmap fading out.
 */

const DOT_COLOR = "#4DA6FF";

export type MosqueLayerMode = "dots" | "heatmap";

const HEATMAP_PAINT: MapLibreGL.HeatmapLayerSpecification["paint"] = {
  "heatmap-weight": 1,
  "heatmap-intensity": [
    "interpolate", ["linear"], ["zoom"],
    0, 0.15, 4, 0.4, 7, 0.8, 9, 1, 12, 2, 14, 3,
  ],
  // plasma ramp
  "heatmap-color": [
    "interpolate", ["linear"], ["heatmap-density"],
    0, "rgba(0,0,0,0)",
    0.05, "#0d0887",
    0.15, "#7e03a8",
    0.35, "#cc4778",
    0.6, "#f89540",
    1, "#f0f921",
  ],
  "heatmap-radius": [
    "interpolate", ["linear"], ["zoom"],
    0, 2, 4, 4, 7, 8, 9, 10, 12, 14, 14, 18,
  ],
  "heatmap-opacity": [
    "interpolate", ["linear"], ["zoom"],
    0, 0.85, 9, 0.85, 11, 0.595, 13, 0.17, 14, 0,
  ],
};

const GLOW_PAINT: MapLibreGL.CircleLayerSpecification["paint"] = {
  "circle-color": DOT_COLOR,
  "circle-radius": [
    "interpolate", ["linear"], ["zoom"],
    8, 2, 9, 5, 10, 9, 11, 10, 12, 16,
  ],
  "circle-opacity": [
    "interpolate", ["linear"], ["zoom"],
    8, 0, 9, 0.15, 11, 0.15, 12, 0.4,
  ],
  "circle-blur": 0.5,
  "circle-stroke-width": 0,
};

const DOTS_PAINT: MapLibreGL.CircleLayerSpecification["paint"] = {
  "circle-color": DOT_COLOR,
  "circle-radius": [
    "interpolate", ["linear"], ["zoom"],
    0, 1, 4, 1.5, 7, 2.2, 8, 3.5, 9.9, 5,
  ],
  "circle-opacity": [
    "interpolate", ["linear"], ["zoom"],
    0, 0.5, 6, 0.6, 8.5, 0.75, 9.6, 0.75, 10, 0,
  ],
  "circle-stroke-width": 0,
};

const POINTS_PAINT: MapLibreGL.CircleLayerSpecification["paint"] = {
  "circle-color": [
    "interpolate", ["linear"], ["zoom"],
    9.6, DOT_COLOR, 10.4, "#2196E8",
  ],
  "circle-radius": ["interpolate", ["linear"], ["zoom"], 9, 4.3, 10, 6],
  "circle-stroke-width": ["interpolate", ["linear"], ["zoom"], 9.6, 0, 10.4, 2],
  "circle-stroke-color": "#93CBFF",
  "circle-opacity": ["interpolate", ["linear"], ["zoom"], 9, 0, 9.6, 1],
  "circle-stroke-opacity": ["interpolate", ["linear"], ["zoom"], 9, 0, 9.6, 1],
};

export default function MosqueDotLayer<
  P extends GeoJSON.GeoJsonProperties = GeoJSON.GeoJsonProperties,
>({
  data,
  mode = "dots",
  onPointClick,
}: {
  data: GeoJSON.FeatureCollection<GeoJSON.Point, P>;
  mode?: MosqueLayerMode;
  onPointClick?: (feature: GeoJSON.Feature<GeoJSON.Point, P>) => void;
}) {
  const { map, isLoaded } = useMap();
  const sourceId = "mosque-points";
  const heatId = "mosque-heat";
  const glowId = "mosque-glow";
  const dotsId = "mosque-dots";
  const pointsId = "mosque-points-hi";

  // Keep the latest handler without re-registering listeners on every render.
  const clickRef = useRef(onPointClick);
  useEffect(() => {
    clickRef.current = onPointClick;
  }, [onPointClick]);

  useEffect(() => {
    if (!isLoaded || !map) return;

    map.addSource(sourceId, { type: "geojson", data });
    // Added first so the density surface sits beneath every point layer.
    map.addLayer({
      id: heatId,
      type: "heatmap",
      source: sourceId,
      paint: HEATMAP_PAINT,
      layout: { visibility: "none" },
    });
    map.addLayer({ id: glowId, type: "circle", source: sourceId, paint: GLOW_PAINT });
    map.addLayer({ id: dotsId, type: "circle", source: sourceId, paint: DOTS_PAINT });
    map.addLayer({ id: pointsId, type: "circle", source: sourceId, paint: POINTS_PAINT });

    const handleClick = (
      e: MapLibreGL.MapMouseEvent & { features?: MapLibreGL.MapGeoJSONFeature[] },
    ) => {
      const feature = e.features?.[0];
      if (!feature) return;
      clickRef.current?.(
        feature as unknown as GeoJSON.Feature<GeoJSON.Point, P>,
      );
    };
    const enter = () => {
      map.getCanvas().style.cursor = "pointer";
    };
    const leave = () => {
      map.getCanvas().style.cursor = "";
    };

    // `dots` as well as `points`, so a mosque stays clickable at national zoom.
    for (const layer of [dotsId, pointsId]) {
      map.on("click", layer, handleClick);
      map.on("mouseenter", layer, enter);
      map.on("mouseleave", layer, leave);
    }

    return () => {
      try {
        for (const layer of [dotsId, pointsId]) {
          map.off("click", layer, handleClick);
          map.off("mouseenter", layer, enter);
          map.off("mouseleave", layer, leave);
        }
        for (const layer of [pointsId, dotsId, glowId, heatId]) {
          if (map.getLayer(layer)) map.removeLayer(layer);
        }
        if (map.getSource(sourceId)) map.removeSource(sourceId);
      } catch {
        // ignore
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, map]);

  useEffect(() => {
    if (!isLoaded || !map) return;
    const source = map.getSource(sourceId) as MapLibreGL.GeoJSONSource | undefined;
    source?.setData(data);
  }, [isLoaded, map, data]);

  useEffect(() => {
    if (!isLoaded || !map) return;
    const heat = mode === "heatmap";
    const visibility: Record<string, "visible" | "none"> = {
      [heatId]: heat ? "visible" : "none",
      [glowId]: heat ? "none" : "visible",
      [dotsId]: heat ? "none" : "visible",
      [pointsId]: "visible",
    };
    for (const [layer, value] of Object.entries(visibility)) {
      if (map.getLayer(layer)) map.setLayoutProperty(layer, "visibility", value);
    }
  }, [isLoaded, map, mode]);

  return null;
}
