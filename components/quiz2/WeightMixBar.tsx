"use client";

import { WEIGHT_FACTORS, type WeightKey } from "@/lib/quiz2";

/**
 * Stacked bar showing how the six factors divide up the Fit score. Segments are
 * flex-basis driven so they animate as the sliders move.
 */
export default function WeightMixBar({
  shares,
}: {
  shares: Record<WeightKey, number>;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      <div
        className="quiz2-mix"
        role="img"
        aria-label={WEIGHT_FACTORS.map(
          (f) => `${f.label} ${Math.round(shares[f.key])}%`
        ).join(", ")}
      >
        {WEIGHT_FACTORS.map((factor) => (
          <div
            key={factor.key}
            className="quiz2-mix-segment"
            style={{
              flexBasis: `${shares[factor.key]}%`,
              backgroundColor: factor.color,
            }}
          />
        ))}
      </div>
      <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
        {WEIGHT_FACTORS.map((factor) => (
          <li key={factor.key} className="flex items-center gap-1.5">
            <span
              className="size-2 shrink-0 rounded-full"
              style={{ backgroundColor: factor.color }}
              aria-hidden="true"
            />
            <span>{factor.label}</span>
            <span className="font-medium tabular-nums text-foreground">
              {Math.round(shares[factor.key])}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
