"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import * as topojson from "topojson-client";
import atlas from "us-atlas/states-10m.json";
import { STATE_NAME_TO_ABBR } from "@/lib/states";
import { CRITTER_RAMP, type StateValue } from "@/lib/critters";

/*
 * D3 + topojson US choropleth of nuisance-critter density, built on the same
 * proven approach as components/StateMap.tsx: geoAlbersUsa (which repositions
 * Alaska/Hawaii as insets) applied to the geographic us-atlas topojson, with
 * libraries imported with the initial client bundle so a fresh direct visit
 * cannot leave the map waiting on a secondary chunk.
 *
 * The SVG is owned imperatively; a floating HTML tooltip (styled with shadcn
 * tokens) follows the cursor, and clicking a state calls onSelect.
 */

type Tooltip = { x: number; y: number; stat: StateValue } | null;

export default function CrittersMap({
  data,
  unit,
  selected,
  onSelect,
  bandLabel,
}: {
  data: StateValue[];
  unit: string;
  selected: string | null;
  onSelect: (abbr: string | null) => void;
  bandLabel?: (stat: StateValue) => string;
}) {
  // `svgRef` is owned imperatively by D3 and MUST have no React children, so
  // React reconciliation never collides with the injected <svg>. The loading
  // overlay and tooltip live as siblings under `wrapRef` instead.
  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<Tooltip>(null);
  const [loaded, setLoaded] = useState(false);

  // Latest values for the imperative D3 closures.
  const byAbbr = useRef<Map<string, StateValue>>(new Map());
  byAbbr.current = new Map(data.map((d) => [d.state, d]));
  const selectedRef = useRef(selected);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const recolorRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    selectedRef.current = selected;
    recolorRef.current?.();
  }, [selected]);

  useEffect(() => {
    let cancelled = false;
    const container = svgRef.current;
    if (!container || container.querySelector("svg")) return;

    (async () => {
      try {
        if (cancelled || !svgRef.current) return;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const us = atlas as any;
        container.innerHTML = "";

        const maxValue = Math.max(...data.map((d) => d.value), 1);
        const color = d3
          .scaleSequential()
          .domain([0, maxValue])
          .interpolator(d3.interpolateRgbBasis(CRITTER_RAMP as unknown as string[]));

        const width = 960;
        const height = 560;
        const projection = d3.geoAlbersUsa().scale(1280).translate([480, 290]);
        const pathGen = d3.geoPath().projection(projection);

        const svg = d3
          .select(container)
          .append("svg")
          .attr("viewBox", `0 0 ${width} ${height}`)
          .attr("width", "100%")
          .style("display", "block");

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const features = (topojson.feature(us as any, (us as any).objects.states) as any)
          .features;

        function statFor(name: string): StateValue | undefined {
          return byAbbr.current.get(STATE_NAME_TO_ABBR[name]);
        }

        function fillFor(name: string): string {
          const stat = statFor(name);
          if (!stat) return "var(--muted)";
          return color(stat.value) as string;
        }

        const paths = svg
          .append("g")
          .selectAll("path")
          .data(features)
          .join("path")
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .attr("d", pathGen as any)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .attr("fill", (d: any) => fillFor(d.properties.name))
          .attr("stroke", "var(--background)")
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .attr("stroke-width", (d: any) =>
            STATE_NAME_TO_ABBR[d.properties.name] === selectedRef.current ? 2.5 : 0.75
          )
          .style("cursor", "pointer")
          .style("transition", "fill 120ms ease")
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .on("mousemove", function (this: any, event: MouseEvent, d: any) {
            const stat = statFor(d.properties.name);
            if (!stat) {
              setTooltip(null);
              return;
            }
            const rect = (wrapRef.current ?? container).getBoundingClientRect();
            setTooltip({
              x: event.clientX - rect.left,
              y: event.clientY - rect.top,
              stat,
            });
            d3.select(this).attr("stroke", "var(--foreground)").raise();
          })
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .on("mouseleave", function (this: any, _e: unknown, d: any) {
            setTooltip(null);
            const isSel = STATE_NAME_TO_ABBR[d.properties.name] === selectedRef.current;
            d3.select(this)
              .attr("stroke", isSel ? "var(--foreground)" : "var(--background)")
              .attr("stroke-width", isSel ? 2.5 : 0.75);
          })
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .on("click", function (_e: unknown, d: any) {
            const abbr = STATE_NAME_TO_ABBR[d.properties.name];
            if (!byAbbr.current.has(abbr)) return;
            onSelectRef.current(selectedRef.current === abbr ? null : abbr);
          });

        // State abbreviation labels with a halo so they read on any fill.
        svg
          .append("g")
          .attr("pointer-events", "none")
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
          .style("fill", "#1f2937")
          .style("paint-order", "stroke")
          .style("stroke", "rgba(255,255,255,0.85)")
          .style("stroke-width", "1.6px")
          .style("user-select", "none");

        recolorRef.current = () => {
          paths
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .attr("stroke", (d: any) =>
              STATE_NAME_TO_ABBR[d.properties.name] === selectedRef.current
                ? "var(--foreground)"
                : "var(--background)"
            )
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .attr("stroke-width", (d: any) =>
              STATE_NAME_TO_ABBR[d.properties.name] === selectedRef.current ? 2.5 : 0.75
            );
        };

        setLoaded(true);
      } catch (err) {
        if (!cancelled && svgRef.current) {
          svgRef.current.innerHTML = `<div class="p-8 text-center text-sm text-muted-foreground">Could not load map: ${
            (err as Error).message
          }</div>`;
          setLoaded(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [data]);

  return (
    <div ref={wrapRef} className="relative w-full">
      {/* Imperatively owned by D3 — must stay free of React children. */}
      <div ref={svgRef} className="w-full" />
      {!loaded && (
        <div className="flex h-[320px] items-center justify-center text-sm text-muted-foreground">
          Loading map…
        </div>
      )}
      {tooltip && (
        <div
          className="pointer-events-none absolute z-20 w-44 rounded-md border bg-popover p-2.5 text-popover-foreground shadow-md"
          style={{
            left: Math.min(tooltip.x + 14, (wrapRef.current?.clientWidth ?? 0) - 180),
            top: Math.max(tooltip.y - 10, 0),
          }}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold">{tooltip.stat.name}</span>
            <span className="text-xs text-muted-foreground">{tooltip.stat.state}</span>
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-lg font-bold tabular-nums leading-none">
              {tooltip.stat.value}
            </span>
            <span className="text-[10px] text-muted-foreground">{unit}</span>
          </div>
          <div className="mt-1.5 flex items-center justify-between text-xs text-muted-foreground">
            <span>{bandLabel?.(tooltip.stat) ?? tooltip.stat.displayBand ?? tooltip.stat.band}</span>
            <span>#{tooltip.stat.rank} of {data.length}</span>
          </div>
        </div>
      )}
    </div>
  );
}
