"use client";

import { useRef, useState } from "react";
import { US_STATE_SHAPES } from "@/lib/maps/us-state-shapes";
import { CRITTER_RAMP, type StateValue } from "@/lib/critters";

type Tooltip = { x: number; y: number; width: number; stat: StateValue } | null;

function interpolateRamp(value: number, max: number, ramp: readonly string[]) {
  const progress = Math.max(0, Math.min(1, value / max));
  const scaled = progress * (ramp.length - 1);
  const lower = Math.floor(scaled);
  const upper = Math.min(lower + 1, ramp.length - 1);
  const mix = scaled - lower;
  const from = ramp[lower].match(/\w\w/g)?.map((hex) => Number.parseInt(hex, 16));
  const to = ramp[upper].match(/\w\w/g)?.map((hex) => Number.parseInt(hex, 16));
  if (!from || !to) return ramp[lower];
  return `#${from
    .map((channel, index) => Math.round(channel + (to[index] - channel) * mix).toString(16).padStart(2, "0"))
    .join("")}`;
}

/**
 * Declarative SVG choropleth. The paths are pre-generated from us-atlas, so
 * they are rendered by React on the server and are visible before hydration.
 * D3/topojson remain a build-time concern instead of a client dependency.
 */
export default function CrittersMap({
  data,
  unit,
  selected,
  onSelect,
  bandLabel,
  colorRamp = CRITTER_RAMP,
}: {
  data: StateValue[];
  unit: string;
  selected: string | null;
  onSelect: (abbr: string | null) => void;
  bandLabel?: (stat: StateValue) => string;
  colorRamp?: readonly string[];
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<Tooltip>(null);
  const byAbbr = new Map(data.map((stat) => [stat.state, stat]));
  const maxValue = Math.max(...data.map((stat) => stat.value), 1);

  return (
    <div ref={wrapRef} className="relative w-full">
      <svg
        viewBox="0 0 960 560"
        width="100%"
        className="block"
        role="img"
        aria-label="United States state comparison map"
      >
        <g>
          {US_STATE_SHAPES.map((shape) => {
            const stat = byAbbr.get(shape.abbr);
            const isSelected = shape.abbr === selected;
            return (
              <path
                key={shape.abbr}
                d={shape.d}
                fill={stat ? interpolateRamp(stat.value, maxValue, colorRamp) : "var(--muted)"}
                stroke={isSelected ? "var(--foreground)" : "var(--background)"}
                strokeWidth={isSelected ? 2.5 : 0.75}
                style={{ cursor: stat ? "pointer" : "default", transition: "fill 120ms ease" }}
                role={stat ? "button" : undefined}
                tabIndex={stat ? 0 : undefined}
                aria-label={stat ? `${stat.name}: ${stat.value} ${unit}` : shape.name}
                onPointerMove={(event) => {
                  if (!stat) return;
                  const rect = (wrapRef.current ?? event.currentTarget).getBoundingClientRect();
                  setTooltip({
                    x: event.clientX - rect.left,
                    y: event.clientY - rect.top,
                    width: rect.width,
                    stat,
                  });
                }}
                onPointerLeave={() => setTooltip(null)}
                onClick={() => stat && onSelect(selected === shape.abbr ? null : shape.abbr)}
                onKeyDown={(event) => {
                  if (stat && (event.key === "Enter" || event.key === " ")) {
                    event.preventDefault();
                    onSelect(selected === shape.abbr ? null : shape.abbr);
                  }
                }}
              />
            );
          })}
        </g>
        <g pointerEvents="none">
          {US_STATE_SHAPES.map((shape) => (
            <text
              key={shape.abbr}
              x={shape.centroid[0]}
              y={shape.centroid[1]}
              textAnchor="middle"
              dy="0.35em"
              style={{
                fontSize: "7px",
                fontWeight: 700,
                fill: "#1f2937",
                paintOrder: "stroke",
                stroke: "rgba(255,255,255,0.85)",
                strokeWidth: "1.6px",
                userSelect: "none",
              }}
            >
              {shape.abbr}
            </text>
          ))}
        </g>
      </svg>
      {tooltip && (
        <div
          className="pointer-events-none absolute z-20 w-44 rounded-md border bg-popover p-2.5 text-popover-foreground shadow-md"
          style={{
            left: Math.max(0, Math.min(tooltip.x + 14, tooltip.width - 180)),
            top: Math.max(tooltip.y - 10, 0),
          }}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold">{tooltip.stat.name}</span>
            <span className="text-xs text-muted-foreground">{tooltip.stat.state}</span>
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-lg font-bold tabular-nums leading-none">{tooltip.stat.value}</span>
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
