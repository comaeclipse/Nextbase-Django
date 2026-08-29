import { DEFENSE_JOB_SECTORS, type DefenseJobSector } from "@/lib/defense-jobs-sectors";

/*
 * Categorical colors for the color-by-sector map mode. Hues are the dataviz
 * skill's validated reference palette (references/palette.md), stepped for the
 * light (Carto Positron) and dark (Carto dark-matter) basemaps.
 *
 * IMPORTANT: eight distinct hues on a national symbol map do NOT clear the
 * skill's all-pairs CVD/normal-vision gate — dots of different sectors can sit
 * anywhere near each other, and e.g. red↔orange are hard to tell apart by hue
 * alone (validator: normal-vision ΔE 7.1). That is why this mode is opt-in, why
 * clustering (a single neutral hue) is the default, and why every colored dot
 * ships with the always-on legend AND a click-through popup listing the exact
 * per-sector counts — color is never the only channel.
 */

const LIGHT: Record<DefenseJobSector, string> = {
  "Software & Data": "#2a78d6", // blue
  "Hardware & Engineering": "#eb6834", // orange
  "Manufacturing & Production": "#1baf7a", // aqua
  "Mission & Flight Ops": "#eda100", // yellow
  "Product & Design": "#e87ba4", // magenta
  "Business & Growth": "#008300", // green
  "Security & IT": "#4a3aa7", // violet
  "Corporate & G&A": "#e34948", // red
  Other: "#9ca3af", // neutral gray
};

const DARK: Record<DefenseJobSector, string> = {
  "Software & Data": "#3987e5",
  "Hardware & Engineering": "#d95926",
  "Manufacturing & Production": "#199e70",
  "Mission & Flight Ops": "#c98500",
  "Product & Design": "#d55181",
  "Business & Growth": "#008300",
  "Security & IT": "#9085e9",
  "Corporate & G&A": "#e66767",
  Other: "#6b7280",
};

export function sectorColors(theme: "light" | "dark"): Record<string, string> {
  return theme === "dark" ? DARK : LIGHT;
}

/** Color for one sector, falling back to the neutral "Other" hue. */
export function sectorColor(sector: string, theme: "light" | "dark"): string {
  const table = sectorColors(theme);
  return table[sector] ?? table.Other;
}

/**
 * A MapLibre `match` expression mapping the `dominantSector` feature property to
 * its hue. Only sectors actually present need coloring, but we emit the full set
 * so the expression is stable regardless of the current filter.
 */
export function sectorColorExpression(theme: "light" | "dark"): unknown[] {
  const table = sectorColors(theme);
  const expr: unknown[] = ["match", ["get", "dominantSector"]];
  for (const s of DEFENSE_JOB_SECTORS) {
    if (s === "Other") continue; // handled by the fallback
    expr.push(s, table[s]);
  }
  expr.push(table.Other); // fallback (covers "Other" and any unknown value)
  return expr;
}

/** Legend rows in the canonical sector order. */
export const SECTOR_LEGEND = DEFENSE_JOB_SECTORS;
