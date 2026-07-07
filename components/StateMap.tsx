"use client";

import { useEffect, useRef } from "react";
import { STATE_NAME_TO_ABBR } from "@/lib/states";

/*
 * D3 + topojson US state map, ported from the inline script in
 * locations/templates/locations/explore.html. Libraries and the us-atlas
 * topojson are dynamically imported (from npm, not a CDN) so they are
 * code-split and only fetched when the map view is first opened.
 *
 * The map owns its SVG imperatively (like the Django version); clicking a state
 * calls onSelect, and a `selected` prop change recolors + updates the chip.
 */
export default function StateMap({
  stateCounts,
  selected,
  onSelect,
}: {
  stateCounts: Record<string, number>;
  selected: string | null;
  onSelect: (abbr: string | null) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLSpanElement>(null);
  const selectedRef = useRef<string | null>(selected);
  // Imperative recolor handle, set after init.
  const recolorRef = useRef<(() => void) | null>(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  // Keep the latest `selected` for D3 closures + recolor when it changes.
  useEffect(() => {
    selectedRef.current = selected;
    if (recolorRef.current) recolorRef.current();
  }, [selected]);

  useEffect(() => {
    // Idempotent: only draw if not already drawn. `cancelled` belongs to THIS
    // effect run so that under React StrictMode's mount→cleanup→mount, the
    // superseded run bails and the live run draws exactly one SVG.
    let cancelled = false;
    const container = containerRef.current;
    if (!container || container.querySelector("svg")) return;

    (async () => {
      try {
        const [d3, topojson, atlas] = await Promise.all([
          import("d3"),
          import("topojson-client"),
          import("us-atlas/states-10m.json") as Promise<{ default: unknown }>,
        ]);
        if (cancelled || !containerRef.current) return;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const us = (atlas as any).default ?? atlas;
        container.innerHTML = "";

        const maxCount = Math.max(...Object.values(stateCounts), 1);
        const colorScale = d3
          .scaleSequential()
          .domain([0, maxCount])
          .interpolator(d3.interpolate("#93c5fd", "#1d4ed8"));

        const width = 960,
          height = 560;
        const projection = d3.geoAlbersUsa().scale(1280).translate([480, 290]);
        const pathGen = d3.geoPath().projection(projection);

        const svg = d3
          .select(container)
          .append("svg")
          .attr("viewBox", `0 0 ${width} ${height}`)
          .attr("width", "100%");

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const features = (topojson.feature(us as any, (us as any).objects.states) as any)
          .features;

        function stateColor(abbr: string | undefined): string {
          if (!abbr) return "#e5e7eb";
          if (abbr === selectedRef.current) return "#f59e0b";
          const n = stateCounts[abbr] || 0;
          return n > 0 ? (colorScale(n) as string) : "#e5e7eb";
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const statePaths = svg
          .append("g")
          .selectAll("path")
          .data(features)
          .join("path")
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .attr("d", pathGen as any)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .attr("fill", (d: any) => stateColor(STATE_NAME_TO_ABBR[d.properties.name]))
          .attr("stroke", "white")
          .attr("stroke-width", 0.6)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .style("cursor", (d: any) =>
            stateCounts[STATE_NAME_TO_ABBR[d.properties.name]] ? "pointer" : "default"
          )
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .on("mouseenter", function (this: any, _event: unknown, d: any) {
            const abbr = STATE_NAME_TO_ABBR[d.properties.name];
            const n = stateCounts[abbr] || 0;
            if (hintRef.current) {
              hintRef.current.textContent =
                n > 0
                  ? `${d.properties.name} — ${n} location${n !== 1 ? "s" : ""}`
                  : `${d.properties.name} — no locations`;
            }
            if (abbr !== selectedRef.current) {
              d3.select(this).attr("fill", n > 0 ? "#2563eb" : "#d1d5db");
            }
          })
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .on("mouseleave", function (this: any, _event: unknown, d: any) {
            const abbr = STATE_NAME_TO_ABBR[d.properties.name];
            d3.select(this).attr("fill", stateColor(abbr));
            if (hintRef.current) {
              hintRef.current.textContent =
                "Hover over a state — click to filter results below";
            }
          })
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .on("click", function (_event: unknown, d: any) {
            const abbr = STATE_NAME_TO_ABBR[d.properties.name];
            if (!stateCounts[abbr]) return;
            const next = selectedRef.current === abbr ? null : abbr;
            onSelectRef.current(next);
          });

        // State abbreviation labels
        svg
          .append("g")
          .selectAll("text")
          .data(features)
          .join("text")
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .attr("transform", (d: any) => {
            const c = pathGen.centroid(d);
            return isNaN(c[0]) ? "translate(-999,-999)" : `translate(${c})`;
          })
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .text((d: any) => STATE_NAME_TO_ABBR[d.properties.name] || "")
          .attr("text-anchor", "middle")
          .attr("dy", "0.35em")
          .style("font-size", "7px")
          .style("font-weight", "700")
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .style("fill", (d: any) =>
            stateCounts[STATE_NAME_TO_ABBR[d.properties.name]] ? "white" : "#9ca3af"
          )
          .style("pointer-events", "none")
          .style("user-select", "none");

        recolorRef.current = () => {
          statePaths.attr("fill", (d: unknown) =>
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            stateColor(STATE_NAME_TO_ABBR[(d as any).properties.name])
          );
        };
      } catch (err) {
        if (!cancelled && containerRef.current) {
          containerRef.current.innerHTML = `<div class="map-loading">Could not load map: ${
            (err as Error).message
          }</div>`;
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [stateCounts]);

  return (
    <>
      <div id="map-svg-container" ref={containerRef}>
        <div className="map-loading">Loading map...</div>
      </div>
      <div className="map-state-bar" id="map-state-bar">
        <span id="map-hint" ref={hintRef}>
          Hover over a state — click to filter results below
        </span>
        {selected && (
          <span
            className="map-selected-chip"
            title="Click to clear"
            onClick={() => onSelect(null)}
          >
            {selected} ×
          </span>
        )}
        <span className="map-legend">
          <span>Fewer</span>
          <span className="map-legend-bar"></span>
          <span>More locations</span>
        </span>
      </div>
    </>
  );
}
