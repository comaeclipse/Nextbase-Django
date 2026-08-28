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
  matchCounts = null,
  selected,
  onSelect,
}: {
  /** Every state's total city count in the dataset (drives clickability). */
  stateCounts: Record<string, number>;
  /**
   * Per-state city count that survives the active filters/profile (with the
   * map's own state selection removed, so picking a state doesn't hatch the
   * rest). When provided, a state with cities in the dataset but zero survivors
   * is drawn "filtered out" (a diagonal hatch overlay), and the blue scale
   * reflects remaining matches rather than raw totals. Null = no active
   * filtering, so the map behaves exactly as before.
   */
  matchCounts?: Record<string, number> | null;
  selected: string | null;
  onSelect: (abbr: string | null) => void;
}) {
  const DEFAULT_HINT = "Hover over a state — click to filter results";
  const [hint, setHint] = useState(DEFAULT_HINT);
  // Color intensity is relative to the counts actually on screen: remaining
  // matches when filtering, raw totals otherwise.
  const scaleSource = matchCounts ?? stateCounts;
  const maxCount = Math.max(...Object.values(scaleSource), 1);

  return (
    <div className="space-y-3">
      <div>
        <svg viewBox="0 0 960 560" width="100%" role="img" aria-label="Locations by state">
          <defs>
            {/* Datawrapper-style hatch: one repeating tile, clipped to the
                state path it fills, marks states excluded by the filters. */}
            <pattern
              id="state-filtered-out"
              width="7"
              height="7"
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(45)"
            >
              <rect width="7" height="7" fill="#f1f5f9" />
              <line x1="0" y1="0" x2="0" y2="7" stroke="#94a3b8" strokeWidth={2} />
            </pattern>
          </defs>
          <g>
            {US_STATE_SHAPES.map((shape) => {
              const total = stateCounts[shape.abbr] || 0;
              const matches = matchCounts
                ? matchCounts[shape.abbr] ?? 0
                : total;
              const isSelected = selected === shape.abbr;
              // Has cities, but the active filters/profile excluded all of them.
              const filteredOut = Boolean(matchCounts) && total > 0 && matches === 0;
              const fill = isSelected
                ? "#f59e0b"
                : filteredOut
                  ? "url(#state-filtered-out)"
                  : blueFor(matches, maxCount);
              return (
                <path
                  key={shape.abbr}
                  d={shape.d}
                  fill={fill}
                  stroke="white"
                  strokeWidth={0.6}
                  style={{ cursor: total ? "pointer" : "default" }}
                  role={total ? "button" : undefined}
                  tabIndex={total ? 0 : undefined}
                  aria-label={
                    filteredOut
                      ? `${shape.name}: 0 of ${total} match your filters`
                      : `${shape.name}: ${matches || "no"} location${matches === 1 ? "" : "s"}`
                  }
                  onPointerEnter={() =>
                    setHint(
                      filteredOut
                        ? `${shape.name} — 0 of ${total} match your filters`
                        : total
                          ? `${shape.name} — ${matches} location${matches !== 1 ? "s" : ""}`
                          : `${shape.name} — no locations`
                    )
                  }
                  onPointerLeave={() => setHint(DEFAULT_HINT)}
                  onClick={() => total && onSelect(isSelected ? null : shape.abbr)}
                  onKeyDown={(event) => {
                    if (total && (event.key === "Enter" || event.key === " ")) {
                      event.preventDefault();
                      onSelect(isSelected ? null : shape.abbr);
                    }
                  }}
                />
              );
            })}
          </g>
          {/* Only states with cities in the dataset are labelled: the map
              renders in a narrow side panel, so labelling all 50 is unreadable
              noise. Filtered-out states keep a muted label so you can still
              read which state the hatch belongs to. */}
          <g pointerEvents="none">
            {US_STATE_SHAPES.map((shape) => {
              const total = stateCounts[shape.abbr] || 0;
              if (!total) return null;
              const matches = matchCounts
                ? matchCounts[shape.abbr] ?? 0
                : total;
              const isSelected = selected === shape.abbr;
              const filteredOut = Boolean(matchCounts) && matches === 0;
              const labelFill =
                filteredOut && !isSelected ? "#64748b" : "white";
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
                    fill: labelFill,
                    userSelect: "none",
                    paintOrder: "stroke",
                    stroke:
                      filteredOut && !isSelected
                        ? "rgba(255,255,255,0.6)"
                        : "rgba(0,0,0,0.25)",
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

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground">Fewer</span>
          <span
            aria-hidden
            className="h-1.5 w-16 rounded-full"
            style={{ background: "linear-gradient(to right, #93c5fd, #1d4ed8)" }}
          />
          <span className="text-[10px] text-muted-foreground">More matches</span>
        </div>
        {matchCounts ? (
          <div className="flex items-center gap-1.5">
            <svg width="14" height="14" aria-hidden className="shrink-0">
              <defs>
                <pattern
                  id="state-filtered-out-key"
                  width="5"
                  height="5"
                  patternUnits="userSpaceOnUse"
                  patternTransform="rotate(45)"
                >
                  <rect width="5" height="5" fill="#f1f5f9" />
                  <line x1="0" y1="0" x2="0" y2="5" stroke="#94a3b8" strokeWidth={1.5} />
                </pattern>
              </defs>
              <rect
                width="14"
                height="14"
                rx="2"
                fill="url(#state-filtered-out-key)"
                stroke="#cbd5e1"
                strokeWidth={1}
              />
            </svg>
            <span className="text-[10px] text-muted-foreground">
              Filtered out
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
