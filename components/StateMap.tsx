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
  const DEFAULT_HINT = "Hover over a state — click to filter results";
  const [hint, setHint] = useState(DEFAULT_HINT);
  const maxCount = Math.max(...Object.values(stateCounts), 1);

  return (
    <div className="space-y-3">
      <div>
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
                  onPointerLeave={() => setHint(DEFAULT_HINT)}
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
          {/* Only states with locations are labelled: the map renders in a
              narrow side panel, so labelling all 50 is unreadable noise. */}
          <g pointerEvents="none">
            {US_STATE_SHAPES.map((shape) => {
              const count = stateCounts[shape.abbr] || 0;
              if (!count) return null;
              return (
                <text
                  key={shape.abbr}
                  x={shape.centroid[0]}
                  y={shape.centroid[1]}
                  textAnchor="middle"
                  dy="0.35em"
                  style={{
                    fontSize: "15px",
                    fontWeight: 700,
                    fill: "white",
                    userSelect: "none",
                    paintOrder: "stroke",
                    stroke: "rgba(0,0,0,0.25)",
                    strokeWidth: 2,
                  }}
                >
                  {shape.abbr}
                </text>
              );
            })}
          </g>
        </svg>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3">
        <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
          {hint}
        </span>
        {selected ? (
          <button
            type="button"
            title="Click to clear"
            onClick={() => onSelect(null)}
            className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/20"
          >
            {selected} ×
          </button>
        ) : null}
      </div>

      <div className="flex items-center gap-2">
        <span className="text-[10px] text-muted-foreground">Fewer</span>
        <span
          aria-hidden
          className="h-1.5 flex-1 rounded-full"
          style={{ background: "linear-gradient(to right, #93c5fd, #1d4ed8)" }}
        />
        <span className="text-[10px] text-muted-foreground">More locations</span>
      </div>
    </div>
  );
}
