/**
 * National-percentile normalization for pace inputs.
 * Density / population / employment / ped-intersection use log1p;
 * walkability is ranked on its native 1–20 scale without log1p.
 */

export function log1p(value: number): number {
  return Math.log1p(Math.max(0, value));
}

/** Winsorize at the empirical 1st and 99th percentiles of `sorted`. */
export function winsorBounds(sorted: number[]): [number, number] {
  if (sorted.length === 0) return [0, 0];
  if (sorted.length === 1) return [sorted[0], sorted[0]];
  const lo = percentileAt(sorted, 0.01);
  const hi = percentileAt(sorted, 0.99);
  return [lo, hi];
}

export function winsorize(value: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, value));
}

function percentileAt(sorted: number[], p: number): number {
  if (sorted.length === 1) return sorted[0];
  const idx = p * (sorted.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  const t = idx - lo;
  return sorted[lo] * (1 - t) + sorted[hi] * t;
}

/**
 * Empirical percentile rank of `value` within `sorted` (ascending),
 * returned on a 0–100 scale. Ties use the mid-rank of equal values.
 */
export function percentileRank(sorted: number[], value: number): number {
  if (sorted.length === 0) return 0;
  if (sorted.length === 1) return value >= sorted[0] ? 100 : 0;

  let lo = 0;
  let hi = sorted.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (sorted[mid] < value) lo = mid + 1;
    else hi = mid;
  }
  const firstGe = lo;

  lo = 0;
  hi = sorted.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (sorted[mid] <= value) lo = mid + 1;
    else hi = mid;
  }
  const firstGt = lo;

  if (firstGe === firstGt) {
    // Strict insertion point — value not present; use fraction below.
    return (firstGe / sorted.length) * 100;
  }
  const midRank = (firstGe + firstGt - 1) / 2;
  return (midRank / (sorted.length - 1)) * 100;
}

export function prepareSeries(
  values: number[],
  useLog1p: boolean
): { transformed: number[]; sorted: number[]; bounds: [number, number] } {
  const transformed = values
    .filter((v) => Number.isFinite(v) && v >= 0)
    .map((v) => (useLog1p ? log1p(v) : v));
  const sortedForBounds = [...transformed].sort((a, b) => a - b);
  const bounds = winsorBounds(sortedForBounds);
  const winsorized = transformed.map((v) => winsorize(v, bounds[0], bounds[1]));
  const sorted = [...winsorized].sort((a, b) => a - b);
  return { transformed: winsorized, sorted, bounds };
}

export function normalizeValue(
  raw: number | null | undefined,
  sorted: number[],
  bounds: [number, number],
  useLog1p: boolean
): number | null {
  if (raw == null || !Number.isFinite(raw) || raw < 0) return null;
  if (sorted.length === 0) return null;
  const t = useLog1p ? log1p(raw) : raw;
  const w = winsorize(t, bounds[0], bounds[1]);
  return percentileRank(sorted, w);
}
