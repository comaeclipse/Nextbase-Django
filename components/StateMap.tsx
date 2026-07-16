"use client";

import { useState } from "react";
import { US_STATE_SHAPES } from "@/lib/maps/us-state-shapes";

function blueFor(count: number, maxCount: number) {
  if (count <= 0) return "#e5e7eb";
  const progress = count / maxCount;
  const from = [147, 197, 253];
  const to = [29, 78, 216];
  return `rgb(${from.map((channel, index) => Math.round(channel + (to[index] - channel) * progress)).join(",")})`;
}

/** A server-rendered, progressively enhanced state filter for Explore. */
export default function StateMap({
  stateCounts,
  selected,
  onSelect,
}: {
  stateCounts: Record<string, number>;
  selected: string | null;
  onSelect: (abbr: string | null) => void;
}) {
  const [hint, setHint] = useState("Hover over a state — click to filter results below");
  const maxCount = Math.max(...Object.values(stateCounts), 1);

  return (
    <>
      <div id="map-svg-container">
        <svg viewBox="0 0 960 560" width="100%" role="img" aria-label="Locations by state">
          <g>
            {US_STATE_SHAPES.map((shape) => {
              const count = stateCounts[shape.abbr] || 0;
              const isSelected = selected === shape.abbr;
              return (
                <path
                  key={shape.abbr}
                  d={shape.d}
                  fill={isSelected ? "#f59e0b" : blueFor(count, maxCount)}
                  stroke="white"
                  strokeWidth={0.6}
                  style={{ cursor: count ? "pointer" : "default" }}
                  role={count ? "button" : undefined}
                  tabIndex={count ? 0 : undefined}
                  aria-label={`${shape.name}: ${count || "no"} location${count === 1 ? "" : "s"}`}
                  onPointerEnter={() =>
                    setHint(
                      count
                        ? `${shape.name} — ${count} location${count !== 1 ? "s" : ""}`
                        : `${shape.name} — no locations`
                    )
                  }
                  onPointerLeave={() => setHint("Hover over a state — click to filter results below")}
                  onClick={() => count && onSelect(isSelected ? null : shape.abbr)}
                  onKeyDown={(event) => {
                    if (count && (event.key === "Enter" || event.key === " ")) {
                      event.preventDefault();
                      onSelect(isSelected ? null : shape.abbr);
                    }
                  }}
                />
              );
            })}
          </g>
          <g pointerEvents="none">
            {US_STATE_SHAPES.map((shape) => {
              const count = stateCounts[shape.abbr] || 0;
              return (
                <text
                  key={shape.abbr}
                  x={shape.centroid[0]}
                  y={shape.centroid[1]}
                  textAnchor="middle"
                  dy="0.35em"
                  style={{
                    fontSize: "7px",
                    fontWeight: 700,
                    fill: count ? "white" : "#9ca3af",
                    userSelect: "none",
                  }}
                >
                  {shape.abbr}
                </text>
              );
            })}
          </g>
        </svg>
      </div>
      <div className="map-state-bar" id="map-state-bar">
        <span id="map-hint">{hint}</span>
        {selected && (
          <button className="map-selected-chip" title="Click to clear" onClick={() => onSelect(null)}>
            {selected} ×
          </button>
        )}
        <span className="map-legend">
          <span>Fewer</span>
          <span className="map-legend-bar" />
          <span>More locations</span>
        </span>
      </div>
    </>
  );
}
